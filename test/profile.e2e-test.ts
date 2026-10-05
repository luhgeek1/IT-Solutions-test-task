import 'dotenv/config';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { profileData } from '../prisma/profile-data';
import { AppModule } from '../src/app.module';

const profileQuery = `
  query {
    profile {
      id name description githubUrl linkedinUrl
      skills { id name category profileId }
      experience { id company position startDate endDate achievements profileId }
      projects { id name description repositoryUrl liveUrl technologies profileId }
    }
  }
`;

describe(
  'Profile GraphQL API — реальная PostgreSQL',
  { concurrency: false },
  () => {
    const schemaName = `e2e_${randomUUID().replaceAll('-', '')}`;
    const originalDatabaseUrl = process.env.DATABASE_URL;
    let app: INestApplication | undefined;
    let prisma: PrismaClient | undefined;
    let endpoint: string;

    function runPrisma(...args: string[]): void {
      execFileSync(
        process.execPath,
        [resolve('node_modules/prisma/build/index.js'), ...args],
        { env: process.env, stdio: 'pipe', timeout: 60_000 },
      );
    }

    async function query(source: string = profileQuery): Promise<unknown> {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: source }),
      });
      assert.equal(response.status, 200);
      return response.json();
    }

    before(
      async () => {
        assert.ok(
          originalDatabaseUrl,
          'Задайте DATABASE_URL в .env и запустите PostgreSQL.',
        );
        const databaseUrl = new URL(originalDatabaseUrl);
        databaseUrl.searchParams.set('schema', schemaName);
        process.env.DATABASE_URL = databaseUrl.toString();
        prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

        runPrisma('migrate', 'deploy');
        runPrisma('db', 'seed');

        const moduleRef = await Test.createTestingModule({
          imports: [AppModule],
        }).compile();
        app = moduleRef.createNestApplication({ logger: false });
        await app.listen(0, '127.0.0.1');
        endpoint = `${await app.getUrl()}/graphql`;
      },
      { timeout: 120_000 },
    );

    after(async () => {
      try {
        await app?.close();
      } finally {
        try {
          await prisma?.$executeRawUnsafe(
            `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`,
          );
        } finally {
          await prisma?.$disconnect();
          if (originalDatabaseUrl === undefined) {
            delete process.env.DATABASE_URL;
          } else {
            process.env.DATABASE_URL = originalDatabaseUrl;
          }
        }
      }
    });

    it('возвращает профиль и все вложенные связи с датами и nullable-полями', async () => {
      const { skills, experience, projects, ...profile } = profileData;
      const expectedProfile = {
        ...profile,
        skills: [...skills]
          .sort((left, right) => left.name.localeCompare(right.name))
          .map((skill) => ({ ...skill, profileId: profile.id })),
        experience: experience.map((entry) => ({
          ...entry,
          startDate: entry.startDate.toISOString(),
          profileId: profile.id,
        })),
        projects: projects.map((project) => ({
          ...project,
          profileId: profile.id,
        })),
      };
      assert.deepEqual(await query(), { data: { profile: expectedProfile } });
    });

    it('возвращает только запрошенные поля', async () => {
      assert.deepEqual(await query('{ profile { name } }'), {
        data: { profile: { name: profileData.name } },
      });
    });

    it('повторный seed сохраняет данные и идентификаторы, удаляет устаревшие связи', async () => {
      const initialResponse = await query();
      await prisma!.skill.create({
        data: {
          id: 'obsolete-skill',
          name: 'Obsolete skill',
          category: 'Test',
          profileId: profileData.id,
        },
      });
      runPrisma('db', 'seed');
      runPrisma('db', 'seed');
      assert.deepEqual(await query(), initialResponse);
      assert.equal(await prisma!.profile.count(), 1);
      assert.equal(await prisma!.skill.count(), profileData.skills.length);
      assert.equal(
        await prisma!.experience.count(),
        profileData.experience.length,
      );
      assert.equal(await prisma!.project.count(), profileData.projects.length);
    });

    it('отдаёт HTML с Apollo Sandbox по тому же endpoint', async () => {
      const response = await fetch(endpoint, {
        headers: { Accept: 'text/html' },
      });
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type') ?? '', /text\/html/);
      assert.match(await response.text(), /embeddable-sandbox/);
    });

    it('возвращает null для отсутствующего профиля; внешние ключи удаляют его связи', async () => {
      await prisma!.profile.delete({ where: { id: profileData.id } });
      assert.deepEqual(await query(), { data: { profile: null } });
      assert.equal(await prisma!.skill.count(), 0);
      assert.equal(await prisma!.experience.count(), 0);
      assert.equal(await prisma!.project.count(), 0);
    });
  },
);
