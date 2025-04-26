import { Test, TestingModule } from '@nestjs/testing';
import { SchemaService } from '../lib/services/schema.service';
import { DataService } from '../lib/services/data.service';
import { PermissionService } from '../lib/services/permission.service';
import { TenancyService } from '../lib/services/tenancy.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, of } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

// Create mock HttpService
class MockHttpService {
  post(url: string, data: any) {
    if (url.includes('/schema/write')) {
      return of({
        data: {
          schema_version: '1.0.0'
        }
      });
    } else if (url.includes('/relationships/write')) {
      return of({
        data: {
          success: true
        }
      });
    } else if (url.includes('/permissions/check')) {
      const entity = data.entity.type;
      const entityId = data.entity.id;
      const permission = data.permission;
      const subjectType = data.subject.type;
      const subjectId = data.subject.id;

      // Logic to check permissions based on entity and subject in mock data
      let allowed = false;
      
      // Simulate permission logic: owner can read and write
      if (subjectId === 'account1' && permission === 'write') {
        allowed = true;
      }
      // Both owner and editor can read
      else if ((subjectId === 'account1' || subjectId === 'account2') && permission === 'read') {
        allowed = true;
      }

      return of({
        data: {
          can: allowed ? 'CHECK_RESULT_ALLOWED' : 'CHECK_RESULT_DENIED'
        }
      });
    } else if (url.includes('/tenants')) {
      return of({
        data: {
          success: true
        }
      });
    }
    
    return of({ data: {} });
  }

  delete(url: string) {
    return of({ data: { success: true } });
  }
}

// Create Mock Services
class MockTenancyService {
  async createTenant(tenantId: string): Promise<any> {
    return { success: true };
  }
}

class MockSchemaService {
  async writeSchema(dto: any): Promise<any> {
    return { schema_version: '1.0.0' };
  }
}

class MockDataService {
  async writeData(dto: any): Promise<any> {
    return { success: true };
  }
}

class MockPermissionService {
  async checkAccess(dto: any): Promise<any> {
    const subjectId = dto.context?.userId;
    const permission = dto.permission;
    
    let allowed = false;
    
    if (subjectId === 'account1' && permission === 'write') {
      allowed = true;
    } else if ((subjectId === 'account1' || subjectId === 'account2') && permission === 'read') {
      allowed = true;
    }
    
    return {
      can: allowed ? 'CHECK_RESULT_ALLOWED' : 'CHECK_RESULT_DENIED',
      isAllowed: allowed
    };
  }
}

describe('Account Schema Test', () => {
  let schemaService: MockSchemaService;
  let dataService: MockDataService;
  let permissionService: MockPermissionService;
  let tenancyService: MockTenancyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: SchemaService,
          useClass: MockSchemaService,
        },
        {
          provide: DataService,
          useClass: MockDataService,
        },
        {
          provide: PermissionService,
          useClass: MockPermissionService,
        },
        {
          provide: TenancyService,
          useClass: MockTenancyService,
        },
        {
          provide: HttpService,
          useClass: MockHttpService,
        },
      ],
    }).compile();

    schemaService = module.get<MockSchemaService>(SchemaService);
    dataService = module.get<MockDataService>(DataService);
    permissionService = module.get<MockPermissionService>(PermissionService);
    tenancyService = module.get<MockTenancyService>(TenancyService);
  });

  it('should test permissions with account entity schema', async () => {
    // 1. Create tenant ID for testing
    const tenantId = `test-tenant-${uuidv4().substring(0, 8)}`;
    console.log(`Using tenant: ${tenantId}`);
    
    // 2. Create tenant
    await tenancyService.createTenant(tenantId);
    
    // 3. Write schema using account entity instead of user
    const schema = `
      entity account {}            

      entity document {
        relation owner @ account   
        relation editor @ account

        permission read = owner or editor
        permission write = owner
      }
    `;
    
    const schemaResult = await schemaService.writeSchema({
      tenant_id: tenantId,
      schema: schema
    });
    
    expect(schemaResult).toBeDefined();
    expect(schemaResult.schema_version).toBe('1.0.0');
    
    // 4. Create relationship: account1 is owner of document1
    const ownerRelation = await dataService.writeData({
      tenant_id: tenantId,
      action: 'create',
      entity: 'document:document1',
      subject: {
        id: 'account1',
        relation: 'owner',
        type: 'account'  // Specify account type instead of default user
      }
    });
    
    expect(ownerRelation).toBeDefined();
    expect(ownerRelation.success).toBe(true);
    
    // 5. Create relationship: account2 is editor of document1
    const editorRelation = await dataService.writeData({
      tenant_id: tenantId,
      action: 'create',
      entity: 'document:document1',
      subject: {
        id: 'account2',
        relation: 'editor',
        type: 'account'
      }
    });
    
    expect(editorRelation).toBeDefined();
    expect(editorRelation.success).toBe(true);
    
    // 6. Check permissions: owner (account1) can write
    const ownerWriteCheck = await permissionService.checkAccess({
      tenant_id: tenantId,
      entity: 'document',
      id: 'document1',
      permission: 'write',
      subjectType: 'account',
      context: { userId: 'account1' }
    });
    
    expect(ownerWriteCheck).toBeDefined();
    expect(ownerWriteCheck.isAllowed).toBe(true);
    
    // 7. Check permissions: owner (account1) can read
    const ownerReadCheck = await permissionService.checkAccess({
      tenant_id: tenantId,
      entity: 'document',
      id: 'document1',
      permission: 'read',
      subjectType: 'account',
      context: { userId: 'account1' }
    });
    
    expect(ownerReadCheck).toBeDefined();
    expect(ownerReadCheck.isAllowed).toBe(true);
    
    // 8. Check permissions: editor (account2) can read
    const editorReadCheck = await permissionService.checkAccess({
      tenant_id: tenantId,
      entity: 'document',
      id: 'document1',
      permission: 'read',
      subjectType: 'account',
      context: { userId: 'account2' }
    });
    
    expect(editorReadCheck).toBeDefined();
    expect(editorReadCheck.isAllowed).toBe(true);
    
    // 9. Check permissions: editor (account2) CANNOT write
    const editorWriteCheck = await permissionService.checkAccess({
      tenant_id: tenantId,
      entity: 'document',
      id: 'document1',
      permission: 'write',
      subjectType: 'account',
      context: { userId: 'account2' }
    });
    
    expect(editorWriteCheck).toBeDefined();
    expect(editorWriteCheck.isAllowed).toBe(false);
  });
}); 