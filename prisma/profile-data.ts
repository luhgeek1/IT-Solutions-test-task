export const profileData = {
  id: 'developer',
  name: 'YOUR_NAME',
  description: 'YOUR_DESCRIPTION',
  githubUrl: 'https://github.com/YOUR_GITHUB_USERNAME',
  linkedinUrl: null,
  skills: [
    { id: 'skill-typescript', name: 'TypeScript', category: 'Language' },
    { id: 'skill-nestjs', name: 'NestJS', category: 'Framework' },
    { id: 'skill-postgresql', name: 'PostgreSQL', category: 'Database' },
    { id: 'skill-graphql', name: 'GraphQL', category: 'API' },
  ],
  experience: [
    {
      id: 'experience-example',
      company: 'YOUR_COMPANY',
      position: 'YOUR_POSITION',
      startDate: new Date('2024-01-01T00:00:00.000Z'),
      endDate: null,
      achievements: ['YOUR_ACHIEVEMENT'],
    },
  ],
  projects: [
    {
      id: 'project-business-card',
      name: 'Developer Business Card API',
      description: 'Учебная цифровая визитка с GraphQL API.',
      repositoryUrl:
        'https://github.com/YOUR_GITHUB_USERNAME/developer-business-card-api',
      liveUrl: null,
      technologies: ['TypeScript', 'NestJS', 'Prisma', 'PostgreSQL', 'GraphQL'],
    },
  ],
};
