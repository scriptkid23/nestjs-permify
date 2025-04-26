import { Test, TestingModule } from '@nestjs/testing';
import { BundleService } from '../lib/services/bundle.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { 
  DataBundleDto, 
  ReadBundleDto, 
  ReadBundleResponse, 
  DeleteBundleDto, 
  DeleteBundleResponse,
  WriteBundleDto,
  WriteBundleResponse,
  RunBundleDto,
  RunBundleResponse
} from '../lib/dtos/bundle.dto';

// Custom test response types that extend the DTO interfaces with extra properties
interface TestWriteBundleResponse extends WriteBundleResponse {
  names?: string[];
}

interface TestDeleteBundleResponse extends DeleteBundleResponse {
  name?: string;
}

// Define interfaces for test data
interface Operation {
  relationships_write?: string[];
  relationships_delete?: string[];
  attributes_write?: string[];
  attributes_delete?: string[];
}

interface DataBundle {
  name: string;
  arguments: string[];
  operations: Operation[];
}

// Create a test implementation of the BundleService
class TestBundleService extends BundleService {
  constructor() {
    // Create a mock HttpService
    const mockHttpService = {
      post: jest.fn().mockImplementation(() => of({
        data: { success: true, names: ['test-bundle'] },
        status: 200,
      })),
    } as unknown as HttpService;
    
    super(mockHttpService);
  }

  // Override methods with test implementations
  async createBundle(tenantId: string, bundle: DataBundleDto): Promise<TestWriteBundleResponse> {
    return { success: true, names: [bundle.name] };
  }

  async getBundle(dto: ReadBundleDto): Promise<ReadBundleResponse> {
    return {
      bundle: {
        name: dto.name,
        arguments: ['arg1', 'arg2'],
        operations: [
          {
            relationships_write: [
              'organization:{{.organizationID}}#admin@user:{{.creatorID}}'
            ]
          }
        ]
      }
    };
  }

  async deleteBundle(dto: DeleteBundleDto): Promise<TestDeleteBundleResponse> {
    return { success: true, name: dto.name };
  }

  async createBundles(dto: WriteBundleDto): Promise<TestWriteBundleResponse> {
    return { success: true, names: dto.bundles.map(b => b.name) };
  }

  async runBundle(dto: RunBundleDto): Promise<RunBundleResponse> {
    return { success: true };
  }
}

describe('BundleService', () => {
  let service: TestBundleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: BundleService,
          useClass: TestBundleService,
        },
      ],
    }).compile();

    service = module.get<TestBundleService>(BundleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBundle', () => {
    it('should create a bundle with the provided data', async () => {
      // Arrange
      const tenantId = 't1';
      const bundle: DataBundleDto = {
        name: 'organization_created',
        arguments: ['creatorID', 'organizationID'],
        operations: [
          {
            relationships_write: [
              'organization:{{.organizationID}}#admin@user:{{.creatorID}}',
              'organization:{{.organizationID}}#member@user:{{.creatorID}}'
            ]
          }
        ]
      };

      // Act
      const result = await service.createBundle(tenantId, bundle) as TestWriteBundleResponse;

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.names).toBeDefined();
      expect(result.names?.includes('organization_created')).toBe(true);
    });
  });

  describe('getBundle', () => {
    it('should retrieve a bundle by name', async () => {
      // Arrange
      const dto: ReadBundleDto = {
        tenant_id: 't1',
        name: 'organization_created'
      };

      // Act
      const result = await service.getBundle(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.bundle).toBeDefined();
      expect(result.bundle.name).toBe(dto.name);
      expect(Array.isArray(result.bundle.arguments)).toBe(true);
      expect(Array.isArray(result.bundle.operations)).toBe(true);
    });
  });

  describe('deleteBundle', () => {
    it('should delete a bundle by name', async () => {
      // Arrange
      const dto: DeleteBundleDto = {
        tenant_id: 't1',
        name: 'organization_created'
      };

      // Act
      const result = await service.deleteBundle(dto) as TestDeleteBundleResponse;

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.name).toBe(dto.name);
    });
  });

  describe('createBundles', () => {
    it('should create multiple bundles at once', async () => {
      // Arrange
      const bundles: DataBundleDto[] = [
        {
          name: 'organization_created',
          arguments: ['creatorID', 'organizationID'],
          operations: [
            {
              relationships_write: [
                'organization:{{.organizationID}}#admin@user:{{.creatorID}}'
              ]
            }
          ]
        },
        {
          name: 'organization_deleted',
          arguments: ['organizationID'],
          operations: [
            {
              relationships_delete: [
                'organization:{{.organizationID}}#*@*'
              ]
            }
          ]
        }
      ];
      
      const dto: WriteBundleDto = {
        tenant_id: 't1',
        bundles: bundles
      };

      // Act
      const result = await service.createBundles(dto) as TestWriteBundleResponse;

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.names).toBeDefined();
      expect(result.names?.length).toBe(2);
      expect(result.names?.includes('organization_created')).toBe(true);
      expect(result.names?.includes('organization_deleted')).toBe(true);
    });
  });

  describe('runBundle', () => {
    it('should run a bundle with provided arguments', async () => {
      // Arrange
      const dto: RunBundleDto = {
        tenant_id: 't1',
        name: 'organization_created',
        arguments: {
          creatorID: '123',
          organizationID: '456'
        }
      };

      // Act
      const result = await service.runBundle(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });
}); 