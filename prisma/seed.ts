import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { profileData } from './profile-data';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const { skills, experience, projects, ...profile } = profileData;

  await prisma.profile.upsert({
    where: { id: profile.id },
    create: {
      ...profile,
      skills: { create: skills },
      experience: { create: experience },
      projects: { create: projects },
    },
    update: {
      ...profile,
      skills: { deleteMany: {}, create: skills },
      experience: { deleteMany: {}, create: experience },
      projects: { deleteMany: {}, create: projects },
    },
  });

  console.log(`seed: ok`);
}

main()
  .catch((error: unknown) => {
    console.error('seed: failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
