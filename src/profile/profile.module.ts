import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ProfileResolver } from './profile.resolver.js';
import { ProfileService } from './profile.service.js';

@Module({
  imports: [PrismaModule],
  providers: [ProfileResolver, ProfileService],
})
export class ProfileModule {}
