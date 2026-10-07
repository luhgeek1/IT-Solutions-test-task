import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Profile } from './models/profile.model';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  findProfile(): Promise<Profile | null> {
    return this.prisma.profile.findUnique({
      where: { id: 'developer' },
      include: {
        skills: { orderBy: [{ name: 'asc' }, { id: 'asc' }] },
        experience: { orderBy: [{ startDate: 'desc' }, { id: 'asc' }] },
        projects: { orderBy: [{ name: 'asc' }, { id: 'asc' }] },
      },
    });
  }
}
