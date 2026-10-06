import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory: async () => {
        const { ApolloServerPluginLandingPageLocalDefault } =
          await import('@apollo/server/plugin/landingPage/default');
        return {
          path: '/graphql',
          autoSchemaFile: true,
          sortSchema: true,
          graphiql: false,
          introspection: true,
          plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
        };
      },
    }),
    ProfileModule,
  ],
})
export class AppModule {}
