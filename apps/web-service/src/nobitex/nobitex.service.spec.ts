import { Test, TestingModule } from '@nestjs/testing';
import { NobitexService } from './nobitex.service';

describe('NobitexService', () => {
  let service: NobitexService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NobitexService],
    }).compile();

    service = module.get<NobitexService>(NobitexService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
