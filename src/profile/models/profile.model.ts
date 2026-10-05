import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Experience } from './experience.model';
import { Project } from './project.model';
import { Skill } from './skill.model';

@ObjectType()
export class Profile {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String)
  description!: string;

  @Field(() => String)
  githubUrl!: string;

  @Field(() => String, { nullable: true })
  linkedinUrl!: string | null;

  @Field(() => [Skill])
  skills!: Skill[];

  @Field(() => [Experience])
  experience!: Experience[];

  @Field(() => [Project])
  projects!: Project[];
}
