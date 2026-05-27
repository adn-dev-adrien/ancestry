import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { ZodValidationFilter } from './common/filters/zod-validation.filter';
import { HealthModule } from './modules/health/health.module';
import { TreesModule } from './modules/trees/trees.module';
import { PersonsModule } from './modules/persons/persons.module';
import { RelationshipsModule } from './modules/relationships/relationships.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    TreesModule,
    PersonsModule,
    RelationshipsModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: ZodValidationFilter }],
})
export class AppModule {}
