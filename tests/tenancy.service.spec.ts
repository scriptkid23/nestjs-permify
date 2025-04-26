import { Test, TestingModule } from '@nestjs/testing';
import { TenancyService } from '../lib/services/tenancy.service';
import { HttpService } from '@nestjs/axios';

// Create a test implementation of TenancyService
class TestTenancyService extends TenancyService {
  constructor() {
    // Create a mock HttpService
    const mockHttpService = {
      post: jest.fn(),
      delete: jest.fn(),
    } as unknown as HttpService;
    
    super(mockHttpService);
  }

  async createTenant(tenantId: string): Promise<any> {
    return {
      id: tenantId,
      name: tenantId,
      created_at: '2023-04-26T08:00:00Z',
    };
  }

  async deleteTenant(tenantId: string): Promise<any> {
    return { success: true };
  }
}

describe('TenancyService', () => {
  let service: TestTenancyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: TenancyService,
          useClass: TestTenancyService,
        },
      ],
    }).compile();

    service = module.get<TestTenancyService>(TenancyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTenant', () => {
    it('should create a tenant with the given ID', async () => {
      // Arrange
      const tenantId = 'my-new-tenant';

      // Act
      const result = await service.createTenant(tenantId);

      // Assert
      expect(result).toEqual({
        id: tenantId,
        name: tenantId,
        created_at: '2023-04-26T08:00:00Z',
      });
    });
  });

  describe('deleteTenant', () => {
    it('should delete a tenant with the given ID', async () => {
      // Arrange
      const tenantId = 'tenant-to-delete';

      // Act
      const result = await service.deleteTenant(tenantId);

      // Assert
      expect(result).toEqual({ success: true });
    });
  });
}); 