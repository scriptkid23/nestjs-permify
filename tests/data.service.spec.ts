import { Test, TestingModule } from '@nestjs/testing';
import { DataService } from '../lib/services/data.service';
import { HttpModule } from '@nestjs/axios';

describe('DataService', () => {
  let service: DataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [DataService],
    }).compile();
    service = module.get<DataService>(DataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Additional tests mocking HttpService...
});
