import { Test, TestingModule } from '@nestjs/testing';
import { SchemaService } from '../lib/services/schema.service';
import { HttpModule } from '@nestjs/axios';

describe('SchemaService', () => {
  let service: SchemaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [SchemaService],
    }).compile();
    service = module.get<SchemaService>(SchemaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Additional tests mocking HttpService...
});
