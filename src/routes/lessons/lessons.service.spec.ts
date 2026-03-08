import { Test, TestingModule } from '@nestjs/testing';
import { LessonsService } from './lessons.service';
import { LessonsRepository } from './lessons.repo';

describe('LessonsService', () => {
  let service: LessonsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonsService,
        {
          provide: LessonsRepository,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<LessonsService>(LessonsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
