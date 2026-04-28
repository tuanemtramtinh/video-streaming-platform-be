# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev          # Start API server with watch mode
npm run start:worker       # Start video processing worker (separate process)

# Build & Production
npm run build              # Compile TypeScript
npm run start:prod         # Run compiled app
npm run start:worker:prod  # Run compiled worker

# Database
npx prisma migrate dev     # Run migrations
npx prisma generate        # Regenerate Prisma client after schema changes — run this whenever schema.prisma changes
npx prisma studio          # Open Prisma Studio GUI
npm run init-seed-data     # Seed initial data (via initialScript/index.ts)

# Code quality
npm run lint               # ESLint with auto-fix
npm run format             # Prettier formatting

# Testing
npm run test               # Unit tests
npm run test:watch         # Unit tests in watch mode
npm run test:cov           # With coverage
npm run test:e2e           # End-to-end tests (test/jest-e2e.json config)
npm test -- --testPathPattern=courses  # Run a single test file by pattern
```

## Commit Message Format

All commits must include a Jira ticket key — enforced by Husky hook and GitHub Actions CI:

```
SCRUM-99: fix bug in login endpoint
```

## Architecture Overview

This is a **NestJS** backend for a video streaming/e-learning platform. It uses:
- **PostgreSQL** via **Prisma ORM** with `@prisma/adapter-pg` for connection pooling
- **AWS S3** (or compatible) for video/file storage
- **Redis + BullMQ** for async job queuing
- **JWT** for authentication (access + refresh tokens)
- **Zod** via `nestjs-zod` for all request/response validation and serialization

### Two-Process Architecture

The app runs as **two separate processes** that must both be started for video upload to work end-to-end:

1. **API server** (`src/main.ts`) — handles HTTP requests, enqueues video processing jobs
2. **Worker** (`src/worker/video-processing.worker.ts`) — picks up BullMQ jobs, downloads video from S3, transcodes to HLS using `ffprobe`/`ffmpeg`, uploads HLS segments back to S3, updates `Lesson.videoStatus`

**ffmpeg and ffprobe must be installed and on PATH** for video processing to work.

### Model/DTO Pattern

Every feature uses two schema files:
- **`*.model.ts`** — Zod schemas + inferred TypeScript types (the source of truth)
- **`*.dto.ts`** — thin wrappers using `createZodDto(schema)` from `nestjs-zod` to produce NestJS-injectable DTO classes

Always define the shape in `*.model.ts` first, then export a DTO class from `*.dto.ts`. The global `ZodValidationPipe` and `ZodSerializerInterceptor` use these DTOs automatically.

### Module Structure

Feature modules live in `src/routes/`:
- `auth/` — register, login, token refresh, logout
- `users/` — user profile management
- `courses/` — course CRUD; enrollment (`POST /courses/:id/enroll`, `GET /courses/me/enrolled`, `GET /courses/:id/enrollments`); wishlist (`DELETE /courses/:id/wishlist`); `GET /courses` and `GET /courses/:id` return `isEnrolled` when user is authenticated
- `sections/` — ordered sections within a course
- `lessons/` — lessons within sections; video lessons go through `pending → processing → ready/failed` lifecycle; multipart S3 upload endpoints
- `resources/` — file resources scoped to a **Course** (`Resource.courseId`), assigned to lessons via the `LessonResource` join table
- `categories/` — course categories

`src/shared/` is a **global NestJS module** providing:
- `PrismaService` — singleton Prisma client
- `S3Service` — upload, download, presigned URLs, multipart support
- `TokenService` — JWT sign/verify for access and refresh tokens
- `HashingService` — bcrypt wrappers
- `AuthGuard` — JWT bearer token guard; throws 401 if no/invalid token
- `OptionalAuthGuard` — decodes token if present and sets `request[REQUEST_USER_KEY]`, but never throws; use on public routes that need optional user context (e.g. to compute `isEnrolled`)
- `VideoProcessingQueueService` — BullMQ producer that enqueues jobs

> **Note:** `UserRepository` is in `SharedModule.providers` but **not** in `exports`. Feature modules that need it (e.g. `CoursesModule`) must declare it in their own `providers` array.

### Request Lifecycle

Global providers registered in `AppModule`:
- `ZodValidationPipe` — validates incoming request DTOs against Zod schemas
- `ZodSerializerInterceptor` — serializes responses using Zod schemas
- `HttpExceptionFilter` — standardizes error responses

Each feature follows the pattern: `Controller → Service → Repository (Prisma)`.

### Environment Variables

Defined and validated in `src/config/env.schema.ts` using Zod. Required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | HTTP server port (default 3000) |
| `ACCESS_TOKEN_SECRET` / `ACCESS_TOKEN_EXPIRES_IN` | JWT access token config |
| `REFRESH_TOKEN_SECRET` / `REFRESH_TOKEN_EXPIRES_IN` | JWT refresh token config |
| `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_ENDPOINT`, `S3_BUCKET_NAME` | S3-compatible storage |
| `REDIS_HOST`, `REDIS_PORT` | Redis connection (defaults: localhost:6379) |
| `REDIS_USERNAME`, `REDIS_PASSWORD` | Optional Redis auth |

### Data Model Key Notes

- **User** has many **Roles** via `UserRole` join table (RBAC with admin/teacher/student roles)
- **Course** hierarchy: Course → Section → Lesson → LessonResource → Resource
- **Enrollment** — composite PK `[userId, courseId]`; `Enrollment.userId` maps to the student (not `studentId`)
- **Wishlist** — composite PK `[userId, courseId]`; same pattern as Enrollment
- **Payment** — PayOS gateway integration; statuses: `pending → processing → paid | cancelled | expired | failed`; stores `checkoutUrl`, `qrCode`, `webhookData` (JSON)
- `Lesson.videoStatus` enum: `pending → processing → ready | failed`
- `Lesson.contentUrl` is updated to the HLS `master.m3u8` S3 URL once processing completes
- `RefreshToken` is stored in DB for revocation support

### HLS Video Processing

Large video files use a **three-step multipart S3 upload** before triggering processing:

1. `POST /lessons/multipart-upload/start` → returns `{ uploadId, videoKey }`
2. `POST /lessons/multipart-upload/sign-part` → returns a presigned URL per part
3. `POST /lessons/multipart-upload/complete` → finalises the upload with ETags
4. `POST /lessons/:lessonId/process-video` → enqueues the BullMQ job

The worker then:
1. Downloads the raw file from S3 (`videos/raw/`)
2. Probes with `ffprobe`, selects renditions (360p/480p/720p/1080p based on source resolution)
3. FFmpeg encodes to multi-bitrate HLS with 6-second segments
4. Uploads HLS files to S3 under `videos/hls/{lessonId}/`
5. Sets `Lesson.contentUrl` to the `master.m3u8` URL and `videoStatus` to `ready`
