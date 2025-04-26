import { Test, TestingModule } from '@nestjs/testing';
import { PermifyModule } from '../lib/permify.module';
import { TenancyService } from '../lib/services/tenancy.service';
import { SchemaService } from '../lib/services/schema.service';
import { DataService } from '../lib/services/data.service';
import { PermissionService } from '../lib/services/permission.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { CreateTenantDto, CreateTenantResponse, ListTenantsDto, ListTenantsResponse } from '../lib/dtos/tenancy.dto';

// Test class for TenancyService
class TestTenancyService extends TenancyService {
  constructor() {
    const mockHttpService = {
      post: jest.fn().mockImplementation(() => of({
        data: { id: 'test-tenant', name: 'test-tenant' },
        status: 200,
      })),
      delete: jest.fn().mockImplementation(() => of({
        data: { success: true },
        status: 200,
      })),
      get: jest.fn().mockImplementation(() => of({
        data: { id: 'test-tenant', name: 'test-tenant' },
        status: 200,
      })),
    } as unknown as HttpService;
    
    super(mockHttpService);
  }

  async createTenant(dto: CreateTenantDto): Promise<CreateTenantResponse> {
    return {
      id: dto.id,
      name: dto.name || dto.id
    };
  }

  async listTenants(dto: ListTenantsDto = {}): Promise<ListTenantsResponse> {
    return {
      tenants: [
        {
          id: 'test-tenant',
          name: 'test-tenant'
        }
      ]
    };
  }
}

// Test class for SchemaService
class TestSchemaService extends SchemaService {
  constructor() {
    const mockHttpService = {
      post: jest.fn().mockImplementation(() => of({
        data: { schema_version: '1.0.0' },
        status: 200,
      })),
    } as unknown as HttpService;
    
    super(mockHttpService);
  }
}

// Test class for PermissionService
class TestPermissionService extends PermissionService {
  // Keep track of relationships in memory for testing
  private relationships: { [key: string]: string[] } = {};

  constructor() {
    const mockHttpService = {
      post: jest.fn().mockImplementation((url, data) => {
        console.log('Permission check request:', JSON.stringify(data));
        
        // Determine if isAllowed based on the complete request data
        let isAllowed = false;
        
        if (data.entity && data.entity.type === 'document' && data.entity.id === 'doc1') {
          // Check context for userId
          const userId = data.subject?.id;
          const permission = data.permission;
          
          if (userId === 'user1') {
            // user1 has both edit and view permissions as creator
            isAllowed = true;
          } else if (userId === 'user2' && permission === 'view') {
            // user2 only has view permission
            isAllowed = true;
          }
        }
        
        return of({
          data: { 
            can: isAllowed ? 'CHECK_RESULT_ALLOWED' : 'CHECK_RESULT_DENIED',
            isAllowed: isAllowed,
            metadata: { check_count: 1 }
          },
          status: 200,
        });
      }),
    } as unknown as HttpService;
    
    super(mockHttpService);
  }
  
  // Record relationship info
  addRelationship(entity: string, id: string, relation: string, userId: string) {
    const key = `${entity}:${id}#${relation}`;
    if (!this.relationships[key]) {
      this.relationships[key] = [];
    }
    this.relationships[key].push(userId);
  }
}

// Test class for DataService
class TestDataService extends DataService {
  private permissionService: TestPermissionService;
  
  constructor(permissionService: TestPermissionService) {
    const mockHttpService = {
      post: jest.fn().mockImplementation((url, data) => {
        console.log('Data service request:', JSON.stringify(data));
        return of({
          data: { success: true },
          status: 200,
        });
      }),
    } as unknown as HttpService;
    
    super(mockHttpService);
    this.permissionService = permissionService;
  }
  
  async writeData(dto: any): Promise<any> {
    // Extract entity and ID from input
    let entity = dto.entity;
    let id = dto.context?.documentId || 'doc1';
    
    if (entity.includes(':')) {
      [entity, id] = entity.split(':');
    }
    
    // Record the relationship for permission checks
    this.permissionService.addRelationship(entity, id, dto.subject.relation, dto.subject.id);
    
    // Return success response
    return {
      success: true
    };
  }
}

describe('Flow Using Library (Mock Services)', () => {
  let tenancyService: TestTenancyService;
  let schemaService: TestSchemaService;
  let dataService: TestDataService;
  let permissionService: TestPermissionService;
  
  beforeEach(async () => {
    // Create permission service first so it can be passed to data service
    permissionService = new TestPermissionService();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: TenancyService,
          useClass: TestTenancyService,
        },
        {
          provide: SchemaService,
          useClass: TestSchemaService,
        },
        {
          provide: DataService,
          useFactory: () => new TestDataService(permissionService),
        },
        {
          provide: PermissionService,
          useValue: permissionService,
        },
      ],
    }).compile();

    tenancyService = module.get<TestTenancyService>(TenancyService);
    schemaService = module.get<TestSchemaService>(SchemaService);
    dataService = module.get<TestDataService>(DataService);
  });

  it('should test a complete flow using library services', async () => {
    try {
      console.log('\n--- TESTING COMPLETE FLOW USING LIBRARY (MOCK) ---');
      
      // 1. Create a random tenant ID to avoid conflicts
      const tenantId = `test-tenant-${uuidv4().substring(0, 8)}`;
      console.log(`Using tenant: ${tenantId}`);
      
      // 2. Create tenant using TenancyService
      const tenantCreated = await tenancyService.createTenant({
        id: tenantId,
        name: tenantId
      });
      console.log('Tenant created:', tenantCreated);
      
      // 3. Create schema using SchemaService
      const schema = `
        entity user {}
        
        entity document {
          relation creator @user
          relation viewer @user
          
          permission view = viewer or creator
          permission edit = creator
        }
      `;
      
      const schemaWritten = await schemaService.writeSchema({
        tenant_id: tenantId,
        schema: schema
      });
      console.log('Schema created:', schemaWritten);
      
      // 4. Create data using DataService
      const userId = 'user1';
      const documentId = 'doc1';
      
      // Create creator relationship
      const creatorRelation = await dataService.writeData({
        tenant_id: tenantId,
        action: 'create',
        entity: 'document',
        subject: { 
          id: userId, 
          relation: 'creator'
        },
        context: { documentId: documentId }
      });
      console.log('Creator relationship created:', creatorRelation);
      
      // 5. Check edit permission using PermissionService for user1
      const editPermissionResult = await permissionService.checkAccess({
        tenant_id: tenantId,
        entity: 'document',
        id: documentId,
        permission: 'edit',
        context: { userId: userId }
      });
      console.log('Check edit permission result:', editPermissionResult);
      
      // user1 must have edit permission
      expect(editPermissionResult.isAllowed).toBe(true);
      
      // 6. Check view permission for user1
      const viewPermissionResult = await permissionService.checkAccess({
        tenant_id: tenantId,
        entity: 'document',
        id: documentId,
        permission: 'view',
        context: { userId: userId }
      });
      console.log('Check view permission result:', viewPermissionResult);
      
      // user1 must have view permission
      expect(viewPermissionResult.isAllowed).toBe(true);
      
      // 7. Check that user2 (no relationship) should not have edit permission
      const user2Id = 'user2';
      const user2EditPermissionResult = await permissionService.checkAccess({
        tenant_id: tenantId,
        entity: 'document',
        id: documentId,
        permission: 'edit',
        context: { userId: user2Id }
      });
      console.log('Check user2 edit permission result:', user2EditPermissionResult);
      
      // user2 should not have edit permission
      expect(user2EditPermissionResult.isAllowed).toBe(false);
      
      // 8. Delete tenant after test is complete
      const tenantDeleted = await tenancyService.deleteTenant(tenantId);
      console.log('Tenant deleted:', tenantDeleted);
      
      console.log('--- COMPLETE FLOW TEST USING LIBRARY (MOCK) FINISHED ---\n');
      
    } catch (error: any) {
      console.error('Error during flow test:', error?.response?.data || error?.message || 'Unknown error');
      console.log('Error details:', error);
      throw error; // Fail the test if there are unexpected errors
    }
  });
}); 