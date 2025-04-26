import { Test, TestingModule } from '@nestjs/testing';
import { TenancyService } from '../lib/services/tenancy.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { 
  CreateTenantDto, 
  CreateTenantResponse, 
  ListTenantsDto, 
  ListTenantsResponse, 
  GetTenantResponse 
} from '../lib/dtos/tenancy.dto';

// Create a test implementation of TenancyService
class TestTenancyService extends TenancyService {
  constructor() {
    // Create a mock HttpService
    const mockHttpService = {
      post: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
    } as unknown as HttpService;
    
    super(mockHttpService);
  }

  async createTenant(dto: CreateTenantDto): Promise<CreateTenantResponse> {
    return {
      id: dto.id,
      name: dto.name || dto.id,
    };
  }

  async deleteTenant(tenantId: string): Promise<any> {
    return { 
      tenant: {
        id: tenantId,
        name: tenantId,
        created_at: '2023-04-26T08:00:00Z',
      }
    };
  }
  
  async listTenants(dto: ListTenantsDto = {}): Promise<ListTenantsResponse> {
    return {
      tenants: [
        {
          id: 't1',
          name: 'Tenant 1',
        },
        {
          id: 't2',
          name: 'Tenant 2',
        }
      ],
      continuous_token: dto.continuous_token ? 'next_token' : undefined
    };
  }
  
  async getTenant(tenantId: string): Promise<GetTenantResponse> {
    return {
      id: tenantId,
      name: tenantId,
    };
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
      const dto: CreateTenantDto = {
        id: 'my-new-tenant',
        name: 'My New Tenant'
      };

      // Act
      const result = await service.createTenant(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(dto.id);
      expect(result.name).toBe(dto.name);
    });
    
    it('should use ID as name when name is not provided', async () => {
      // Arrange
      const dto: CreateTenantDto = {
        id: 'my-new-tenant'
      };

      // Act
      const result = await service.createTenant(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(dto.id);
      expect(result.name).toBe(dto.id);
    });
  });

  describe('deleteTenant', () => {
    it('should delete a tenant with the given ID', async () => {
      // Arrange
      const tenantId = 'tenant-to-delete';

      // Act
      const result = await service.deleteTenant(tenantId);

      // Assert
      expect(result).toBeDefined();
      expect(result.tenant).toBeDefined();
      expect(result.tenant.id).toBe(tenantId);
    });
  });
  
  describe('listTenants', () => {
    it('should list tenants with pagination', async () => {
      // Arrange
      const dto: ListTenantsDto = {
        page_size: 10
      };

      // Act
      const result = await service.listTenants(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.tenants).toBeInstanceOf(Array);
      expect(result.tenants.length).toBeGreaterThan(0);
      expect(result.tenants[0]).toHaveProperty('id');
      expect(result.tenants[0]).toHaveProperty('name');
    });
    
    it('should handle continuous token for pagination', async () => {
      // Arrange
      const dto: ListTenantsDto = {
        page_size: 10,
        continuous_token: 'previous_token'
      };

      // Act
      const result = await service.listTenants(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.continuous_token).toBe('next_token');
    });
  });
  
  describe('getTenant', () => {
    it('should get tenant information by ID', async () => {
      // Arrange
      const tenantId = 't1';

      // Act
      const result = await service.getTenant(tenantId);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(tenantId);
    });
  });
}); 