import 'dotenv/config';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { profileData } from '../prisma/profile-data';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ProfileService } from '../src/profile/profile.service';

describe('Profile GraphQL API', () => {
  const schemaName = `e2e_${randomUUID().replaceAll('-', '')}`;
  let databaseUrl: URL;
  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;
  let endpoint: string;

  before(
    async () => {
      assert.ok(
        process.env.DATABASE_URL,
        'Задайте DATABASE_URL в .env и запустите PostgreSQL.',
      );
      databaseUrl = new URL(process.env.DATABASE_URL);
      databaseUrl.searchParams.set('schema', schemaName);
      prisma = new PrismaService({ datasourceUrl: databaseUrl.toString() });

      runPrisma('migrate', 'deploy');

      await prisma.profile.create({
        data: {
          id: 'developer',
          name: 'Test Developer',
          description: 'Backend developer',
          githubUrl: 'https://github.com/developer',
          skills: { create: { name: 'TypeScript', category: 'Language' } },
          experience: {
            create: {
              company: 'Test Company',
              position: 'Developer',
              startDate: new Date('2025-01-01'),
              achievements: ['Built an API'],
            },
          },
          projects: {
            create: {
              name: 'Business Card',
              description: 'GraphQL API',
              repositoryUrl: 'https://github.com/developer/business-card',
              technologies: ['NestJS', 'Prisma'],
            },
          },
        },
      });
      await prisma.profile.create({
        data: {
          id: 'aaa-other',
          name: 'Other Developer',
          description: 'Another profile',
          githubUrl: 'https://github.com/other',
        },
      });

      const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(PrismaService)
        .useValue(prisma)
        .compile();
      app = moduleRef.createNestApplication({ logger: false });
      await app.listen(0, '127.0.0.1');
      endpoint = `${await app.getUrl()}/graphql`;
    },
    { timeout: 120_000 },
  );

  after(async () => {
    try {
      await prisma?.$executeRawUnsafe(
        `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`,
      );
    } finally {
      if (app) {
        await app.close();
      } else {
        await prisma?.$disconnect();
      }
    }
  });

  function runPrisma(...args: string[]): void {
    execFileSync(
      process.execPath,
      [resolve('node_modules/prisma/build/index.js'), ...args],
      {
        env: { ...process.env, DATABASE_URL: databaseUrl.toString() },
        timeout: 60_000,
        stdio: 'pipe',
      },
    );
  }

  async function query(source: string): Promise<unknown> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: source }),
    });
    assert.equal(response.status, 200);
    return response.json();
  }

  it('возвращает профиль developer со всеми связями, даже если есть другой профиль', async () => {
    const result = await query(`{
      profile {
        id name linkedinUrl
        skills { name category }
        experience { company startDate endDate }
        projects { name technologies }
      }
    }`);
    assert.deepEqual(result, {
      data: {
        profile: {
          id: 'developer',
          name: 'Test Developer',
          linkedinUrl: null,
          skills: [{ name: 'TypeScript', category: 'Language' }],
          experience: [
            {
              company: 'Test Company',
              startDate: '2025-01-01T00:00:00.000Z',
              endDate: null,
            },
          ],
          projects: [
            { name: 'Business Card', technologies: ['NestJS', 'Prisma'] },
          ],
        },
      },
    });
  });

  it('возвращает только запрошенные поля', async () => {
    assert.deepEqual(await query('{ profile { name } }'), {
      data: { profile: { name: 'Test Developer' } },
    });
  });

  it('отдаёт HTML с Apollo Sandbox', async () => {
    const response = await fetch(endpoint, {
      headers: { Accept: 'text/html' },
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /text\/html/);
    assert.match(await response.text(), /embeddable-sandbox/);
  });

  it('повторный seed сохраняет данные и идентификаторы без дубликатов', async () => {
    await prisma!.profile.deleteMany({ where: { id: profileData.id } });
    const profileCount = await prisma!.profile.count();
    const profileService = app!.get(ProfileService);

    runPrisma('db', 'seed');
    const initialProfile = await profileService.findProfile();
    assert.ok(initialProfile);
    assert.equal(initialProfile.name, profileData.name);

    runPrisma('db', 'seed');
    assert.deepEqual(await profileService.findProfile(), initialProfile);
    assert.deepEqual(
      await Promise.all([
        prisma!.profile.count(),
        prisma!.skill.count(),
        prisma!.experience.count(),
        prisma!.project.count(),
      ]),
      [
        profileCount + 1,
        profileData.skills.length,
        profileData.experience.length,
        profileData.projects.length,
      ],
    );
  });

  it('возвращает null, если developer отсутствует, даже при наличии другого профиля', async () => {
    await prisma!.profile.deleteMany({ where: { id: 'developer' } });
    assert.deepEqual(await query('{ profile { id } }'), {
      data: { profile: null },
    });
  });
});
