import { Test, TestingModule } from '@nestjs/testing';
import { PermissionService } from '../lib/services/permission.service';
import { HttpModule } from '@nestjs/axios';

describe('PermissionService', () => {
  let service: PermissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [PermissionService],
    }).compile();
    service = module.get<PermissionService>(PermissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Additional tests mocking HttpService...
});
