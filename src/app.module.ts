import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/routes/auth/auth.module';
import { SharedModule } from './shared/shared.module';
import { validateEnv } from 'src/config/env.validate';
import { UsersModule } from 'src/routes/users/users.module';
import { CoursesModule } from 'src/routes/courses/courses.module';
import { SectionsModule } from './routes/sections/sections.module';
import { LessonsModule } from './routes/lessons/lessons.module';
import { ResourcesModule } from './routes/resources/resources.module';
import { CategoriesModule } from './routes/categories/categories.module';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { HttpExceptionFilter } from 'src/shared/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env'],
      ignoreEnvFile: false,
    }),
    AuthModule,
    SharedModule,
    UsersModule,
    CoursesModule,
    SectionsModule,
    LessonsModule,
    ResourcesModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
