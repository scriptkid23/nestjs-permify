import { Test, TestingModule } from '@nestjs/testing';
import { PermifyModule } from '../lib/permify.module';
import { TenancyService } from '../lib/services/tenancy.service';
import { SchemaService } from '../lib/services/schema.service';
import { DataService } from '../lib/services/data.service';
import { PermissionService } from '../lib/services/permission.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

// Class test cho TenancyService
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
    } as unknown as HttpService;
    
    super(mockHttpService);
  }
}

// Class test cho SchemaService
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

// Class test cho DataService
class TestDataService extends DataService {
  constructor() {
    const mockHttpService = {
      post: jest.fn().mockImplementation(() => of({
        data: { success: true },
        status: 200,
      })),
    } as unknown as HttpService;
    
    super(mockHttpService);
  }
}

// Class test cho PermissionService
class TestPermissionService extends PermissionService {
  constructor() {
    const mockHttpService = {
      post: jest.fn().mockImplementation((url, data) => {
        // Mặc định bất kỳ ai là creator đều có quyền edit
        const isAllowed = data.context && data.context.userId === 'user1';
        
        return of({
          data: { isAllowed: isAllowed },
          status: 200,
        });
      }),
    } as unknown as HttpService;
    
    super(mockHttpService);
  }
}

describe('Flow Using Library (Mock Services)', () => {
  let tenancyService: TestTenancyService;
  let schemaService: TestSchemaService;
  let dataService: TestDataService;
  let permissionService: TestPermissionService;
  
  beforeEach(async () => {
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
          useClass: TestDataService,
        },
        {
          provide: PermissionService,
          useClass: TestPermissionService,
        },
      ],
    }).compile();

    tenancyService = module.get<TestTenancyService>(TenancyService);
    schemaService = module.get<TestSchemaService>(SchemaService);
    dataService = module.get<TestDataService>(DataService);
    permissionService = module.get<TestPermissionService>(PermissionService);
  });

  it('should test a complete flow using library services', async () => {
    try {
      console.log('\n--- TESTING COMPLETE FLOW USING LIBRARY (MOCK) ---');
      
      // 1. Tạo tenant ID ngẫu nhiên để tránh xung đột
      const tenantId = `test-tenant-${uuidv4().substring(0, 8)}`;
      console.log(`Using tenant: ${tenantId}`);
      
      // 2. Tạo tenant sử dụng TenancyService
      const tenantCreated = await tenancyService.createTenant(tenantId);
      console.log('Tenant created:', tenantCreated);
      
      // 3. Tạo schema sử dụng SchemaService
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
      
      // 4. Tạo dữ liệu sử dụng DataService
      const userId = 'user1';
      const documentId = 'doc1';
      
      // Tạo mối quan hệ creator
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
      
      // 5. Kiểm tra quyền edit sử dụng PermissionService cho user1
      const editPermissionResult = await permissionService.checkAccess({
        tenant_id: tenantId,
        entity: 'document',
        id: documentId,
        permission: 'edit',
        context: { userId: userId }
      });
      console.log('Check edit permission result:', editPermissionResult);
      
      // user1 phải có quyền edit
      expect(editPermissionResult.isAllowed).toBe(true);
      
      // 6. Kiểm tra quyền view cho user1
      const viewPermissionResult = await permissionService.checkAccess({
        tenant_id: tenantId,
        entity: 'document',
        id: documentId,
        permission: 'view',
        context: { userId: userId }
      });
      console.log('Check view permission result:', viewPermissionResult);
      
      // user1 phải có quyền view
      expect(viewPermissionResult.isAllowed).toBe(true);
      
      // 7. Kiểm tra user2 (không có mối quan hệ) không nên có quyền edit
      const user2Id = 'user2';
      const user2EditPermissionResult = await permissionService.checkAccess({
        tenant_id: tenantId,
        entity: 'document',
        id: documentId,
        permission: 'edit',
        context: { userId: user2Id }
      });
      console.log('Check user2 edit permission result:', user2EditPermissionResult);
      
      // user2 không nên có quyền edit
      expect(user2EditPermissionResult.isAllowed).toBe(false);
      
      // 8. Xóa tenant sau khi test xong
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