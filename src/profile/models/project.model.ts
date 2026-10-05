import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Project {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String)
  description!: string;

  @Field(() => String)
  repositoryUrl!: string;

  @Field(() => String, { nullable: true })
  liveUrl!: string | null;

  @Field(() => [String])
  technologies!: string[];

  @Field(() => ID)
  profileId!: string;
}
