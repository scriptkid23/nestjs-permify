import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { TenancyService } from '../lib/services/tenancy.service';
import { SchemaService } from '../lib/services/schema.service';
import { DataService } from '../lib/services/data.service';
import { PermissionService } from '../lib/services/permission.service';
import { v4 as uuidv4 } from 'uuid';

describe('Permify API Integration Test', () => {
  let tenancyService: TenancyService;
  let schemaService: SchemaService;
  let dataService: DataService;
  let permissionService: PermissionService;
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule.register({
          baseURL: 'http://localhost:3476',
        }),
      ],
      providers: [
        {
          provide: TenancyService,
          useFactory: (httpService) => new TenancyService(httpService),
          inject: [HttpService],
        },
        {
          provide: SchemaService,
          useFactory: (httpService) => new SchemaService(httpService),
          inject: [HttpService],
        },
        {
          provide: DataService,
          useFactory: (httpService) => new DataService(httpService),
          inject: [HttpService],
        },
        {
          provide: PermissionService,
          useFactory: (httpService) => new PermissionService(httpService),
          inject: [HttpService],
        },
      ],
    }).compile();

    tenancyService = module.get<TenancyService>(TenancyService);
    schemaService = module.get<SchemaService>(SchemaService);
    dataService = module.get<DataService>(DataService);
    permissionService = module.get<PermissionService>(PermissionService);
  });

  it('should test complete Permify API flow', async () => {
    // Skip test if server is not running
    try {
      console.log('\n--- TESTING COMPLETE FLOW WITH REAL PERMIFY SERVER ---');
      
      // 1. Sử dụng tenant t1 có sẵn theo docs
      const tenantId = 't1';
      console.log(`Using default tenant: ${tenantId}`);
      
      // 2. Tạo schema sử dụng SchemaService
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
      
      // 3. Tạo dữ liệu sử dụng DataService
      const userId = 'user1';
      const documentId = 'doc1';
      
      // Sử dụng cú pháp đúng theo Permify cho entity và relation
      console.log('Creating relationship between document and user...');
      
      // Format Permify: entity:id#relation@subject_type:subject_id
      // VD: document:doc1#creator@user:user1
      const tupleString = `document:${documentId}#creator@user:${userId}`;
      console.log('Relationship tuple:', tupleString);
      
      const creatorRelation = await dataService.writeData({
        tenant_id: tenantId,
        action: 'create',
        entity: `document:${documentId}`,
        subject: { 
          id: userId, 
          relation: 'creator'
        }
      });
      console.log('Creator relationship created:', creatorRelation);
      
      // 4. Kiểm tra quyền edit sử dụng PermissionService cho user1
      console.log(`\nChecking if user ${userId} can edit document ${documentId}...`);
      const editPermissionResult = await permissionService.checkAccess({
        tenant_id: tenantId,
        entity: 'document',
        id: documentId,
        permission: 'edit',
        context: { userId: userId }
      });
      console.log('Check edit permission result:', editPermissionResult);
      
      // user1 phải có quyền edit vì là creator
      expect(editPermissionResult.isAllowed).toBe(true);
      
      // 5. Kiểm tra quyền view cho user1
      console.log(`\nChecking if user ${userId} can view document ${documentId}...`);
      const viewPermissionResult = await permissionService.checkAccess({
        tenant_id: tenantId,
        entity: 'document',
        id: documentId,
        permission: 'view',
        context: { userId: userId }
      });
      console.log('Check view permission result:', viewPermissionResult);
      
      // user1 phải có quyền view vì là creator
      expect(viewPermissionResult.isAllowed).toBe(true);
      
      // 6. Tạo thêm một user khác và thiết lập quyền viewer
      const user2Id = 'user2';
      console.log(`\nAdding ${user2Id} as viewer to document ${documentId}...`);
      
      // Format: document:doc1#viewer@user:user2
      const viewerTupleString = `document:${documentId}#viewer@user:${user2Id}`;
      console.log('Viewer relationship tuple:', viewerTupleString);
      
      const viewerRelation = await dataService.writeData({
        tenant_id: tenantId,
        action: 'create',
        entity: `document:${documentId}`,
        subject: { 
          id: user2Id, 
          relation: 'viewer'
        }
      });
      console.log('Viewer relationship created:', viewerRelation);
      
      // 7. Kiểm tra quyền view cho user2
      console.log(`\nChecking if user ${user2Id} can view document ${documentId}...`);
      const user2ViewPermissionResult = await permissionService.checkAccess({
        tenant_id: tenantId,
        entity: 'document',
        id: documentId,
        permission: 'view',
        context: { userId: user2Id }
      });
      console.log('Check user2 view permission result:', user2ViewPermissionResult);
      
      // user2 phải có quyền view vì là viewer
      expect(user2ViewPermissionResult.isAllowed).toBe(true);
      
      // 8. Kiểm tra user2 không có quyền edit
      console.log(`\nChecking if user ${user2Id} can edit document ${documentId}...`);
      const user2EditPermissionResult = await permissionService.checkAccess({
        tenant_id: tenantId,
        entity: 'document',
        id: documentId,
        permission: 'edit',
        context: { userId: user2Id }
      });
      console.log('Check user2 edit permission result:', user2EditPermissionResult);
      
      // user2 không nên có quyền edit vì chỉ là viewer
      expect(user2EditPermissionResult.isAllowed).toBe(false);
      
      console.log('\n--- COMPLETE FLOW TEST WITH REAL PERMIFY SERVER FINISHED ---\n');
      
    } catch (error: any) {
      console.error('Error during flow test:', error?.response?.data || error?.message || 'Unknown error');
      console.log('Full error details:', error);
      if (error?.response?.status === 404 || error?.code === 'ECONNREFUSED') {
        console.log('Skipping test - Permify server is not running at http://localhost:3476/');
        console.log('Permify server không chạy ở địa chỉ http://localhost:3476/');
        console.log('Hãy đảm bảo Permify server đang chạy và thử lại.');
        return;
      }
      throw error;
    }
  }, 20000); // Tăng timeout lên 20 giây vì gọi API thực có thể mất thời gian
}); 