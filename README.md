# NestJS Permify

[![npm version](https://badge.fury.io/js/nestjs-permify.svg)](https://badge.fury.io/js/nestjs-permify)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm downloads](https://img.shields.io/npm/dm/nestjs-permify.svg)](https://www.npmjs.com/package/nestjs-permify)
[![GitHub stars](https://img.shields.io/github/stars/scriptkid23/nestjs-permify.svg)](https://github.com/scriptkid23/nestjs-permify/stargazers)

A comprehensive NestJS client library for integrating with [Permify](https://permify.co) - the open-source authorization service. This module provides a clean, type-safe interface to Permify's authorization system, making it easy to implement fine-grained permissions in your NestJS applications.

## Features

- Seamless integration with NestJS dependency injection system
- Comprehensive TypeScript support with detailed DTOs and interfaces
- Complete coverage of Permify API services:
  - Permission checking and expansion
  - Schema management and validation
  - Relationship data management
  - Multi-tenant management
  - Real-time permission watching
  - Resource and subject lookup
- Automatic health checking of the Permify service
- Permission interceptor for simplified access control

## Installation

```bash
npm install nestjs-permify
```

### Peer Dependencies

This package requires the following peer dependencies:

```json
{
  "@nestjs/axios": "^1.0.0 || ^2.0.0 || ^3.0.0 || ^4.0.0",
  "@nestjs/common": "^8.0.0 || ^9.0.0 || ^10.0.0 || ^11.0.0",
  "rxjs": "^7.0.0 || ^8.0.0"
}
```

Make sure these packages are installed in your project.

## Quick Start

### Module Registration

#### Basic Configuration

```typescript
import { Module } from '@nestjs/common';
import { PermifyModule } from 'nestjs-permify';

@Module({
  imports: [
    PermifyModule.forRoot({
      baseUrl: 'https://api.permify.co', // or your self-hosted Permify server URL
      apiKey: 'your-api-key', // if required
      skipHealthCheck: false, // default: false - performs a health check during initialization
    }),
    // Other modules...
  ],
})
export class AppModule {}
```

#### Dynamic Configuration

```typescript
import { Module } from '@nestjs/common';
import { PermifyModule } from 'nestjs-permify';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PermifyModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        baseUrl: configService.get('PERMIFY_BASE_URL'),
        apiKey: configService.get('PERMIFY_API_KEY'),
        skipHealthCheck: configService.get('PERMIFY_SKIP_HEALTH_CHECK') === 'true',
      }),
    }),
  ],
})
export class AppModule {}
```

## Usage Examples

### Tenant Management

```typescript
import { Injectable } from '@nestjs/common';
import { TenancyService } from 'nestjs-permify';

@Injectable()
export class OrganizationService {
  constructor(private readonly tenancyService: TenancyService) {}

  async createOrganization(orgId: string, name: string): Promise<void> {
    // Create a new tenant in Permify for this organization
    await this.tenancyService.createTenant({
      id: orgId,
      name: name,
    });
  }

  async getAllOrganizations(pageSize = 20, continuousToken?: string) {
    return this.tenancyService.listTenants({
      page_size: pageSize,
      continuous_token: continuousToken,
    });
  }
}
```

### Schema Management

```typescript
import { Injectable } from '@nestjs/common';
import { SchemaService } from 'nestjs-permify';

@Injectable()
export class AuthorizationSchemaService {
  constructor(private readonly schemaService: SchemaService) {}

  async initializeSchema(tenantId: string): Promise<string> {
    // Define your authorization schema
    const schema = `
      entity user {}
      
      entity document {
        relation creator @user
        relation viewer @user
        relation editor @user
        
        permission view = viewer or creator or editor
        permission edit = creator or editor
        permission delete = creator
      }
      
      entity folder {
        relation owner @user
        relation member @user
        
        permission view = owner or member
        permission edit = owner
        permission share = owner
      }
    `;
    
    // Validate schema before writing
    const validationResult = await this.schemaService.validateSchema({
      tenant_id: tenantId,
      schema,
    });
    
    if (!validationResult.is_valid) {
      throw new Error(`Schema validation failed: ${validationResult.error}`);
    }
    
    // Write the schema
    const result = await this.schemaService.writeSchema({
      tenant_id: tenantId,
      schema,
    });
    
    return result.schema_version;
  }

  async getSchema(tenantId: string, version?: string) {
    return this.schemaService.readSchema({
      tenant_id: tenantId,
      schema_version: version,
    });
  }

  async updateSchema(tenantId: string, schemaVersion: string) {
    // Add a new entity to the schema
    return this.schemaService.partialUpdate({
      tenant_id: tenantId,
      schema_version: schemaVersion,
      entities: {
        write: {
          comment: {
            relations: {
              author: { type: "user" },
            },
            permissions: {
              edit: { rule: "author" },
              delete: { rule: "author" },
            },
          },
        },
      },
    });
  }
}
```

### Permission Checking

```typescript
import { Injectable } from '@nestjs/common';
import { PermissionService, CheckAccessDto } from 'nestjs-permify';

@Injectable()
export class DocumentPermissionService {
  constructor(private readonly permissionService: PermissionService) {}

  async canUserPerformAction(
    tenantId: string,
    userId: string,
    entityType: string,
    entityId: string,
    permission: string,
    context?: Record<string, any>,
  ): Promise<boolean> {
    const checkDto: CheckAccessDto = {
      tenant_id: tenantId,
      entity: entityType,
      id: entityId,
      permission: permission,
      subject: {
        id: userId,
        type: 'user',
      },
      context: context,
    };
    
    const result = await this.permissionService.checkAccess(checkDto);
    return result.isAllowed;
  }
  
  async expandPermissions(
    tenantId: string, 
    userId: string,
    entityType: string,
    entityId: string,
  ) {
    return this.permissionService.expandPermissions({
      tenant_id: tenantId,
      entity: entityType,
      id: entityId,
      subject: {
        id: userId,
        type: 'user',
      },
    });
  }

  async findAllResourcesUserCanAccess(
    tenantId: string,
    userId: string,
    resourceType: string,
    permission: string,
  ) {
    return this.permissionService.lookupResources({
      tenant_id: tenantId,
      permission: permission,
      entity: resourceType,
      subject: {
        id: userId,
        type: 'user',
      },
    });
  }
}
```

### Relationship Management

```typescript
import { Injectable } from '@nestjs/common';
import { DataService } from 'nestjs-permify';

@Injectable()
export class RelationshipService {
  constructor(private readonly dataService: DataService) {}

  async addUserToDocument(
    tenantId: string,
    documentId: string,
    userId: string,
    relation: 'creator' | 'viewer' | 'editor',
  ): Promise<void> {
    await this.dataService.writeData({
      tenant_id: tenantId,
      entity: `document:${documentId}`,
      subject: {
        id: userId,
        relation: relation,
      },
    });
  }
  
  async getDocumentRelationships(tenantId: string, documentId: string) {
    return this.dataService.readRelationships({
      tenant_id: tenantId,
      entity: 'document',
      id: documentId,
    });
  }
  
  async removeUserFromDocument(
    tenantId: string,
    documentId: string,
    relation: string,
  ): Promise<void> {
    await this.dataService.deleteRelationship({
      tenant_id: tenantId,
      entity: 'document',
      id: documentId,
      relation: relation,
    });
  }
  
  async findAllViewersOfDocument(tenantId: string, documentId: string) {
    return this.dataService.lookupSubjects({
      tenant_id: tenantId,
      entity: 'document',
      id: documentId,
      relation: 'viewer',
      subject_type: 'user',
    });
  }
}
```

## Available Services

The library provides comprehensive services to interact with all aspects of Permify:

| Service | Description |
|---------|-------------|
| `PermissionService` | Check access permissions, expand permissions, and lookup resources/subjects based on permissions |
| `SchemaService` | Create, read, validate, and manage authorization schemas |
| `DataService` | Manage relationships between entities (write, read, delete) |
| `TenancyService` | Create, list, and manage tenants for multi-tenant applications |
| `BundleService` | Work with bundled schemas for more efficient schema management |
| `WatchService` | Set up watchers for real-time permission updates |

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `baseUrl` | The base URL of your Permify instance | - |
| `apiKey` | API key for authorization (if required) | - |
| `skipHealthCheck` | Whether to skip the health check during initialization | `false` |

## Error Handling

The library will throw appropriate errors when the Permify service is unreachable or returns errors. We recommend implementing proper error handling in your application:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from 'nestjs-permify';

@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name);
  
  constructor(private readonly permissionService: PermissionService) {}
  
  async checkAccess(/* params */) {
    try {
      const result = await this.permissionService.checkAccess(/* params */);
      return result.isAllowed;
    } catch (error) {
      this.logger.error(`Authorization check failed: ${error.message}`, error.stack);
      // Decide how to handle this in your application
      // You might want to fail closed (deny access) or open (allow access) depending on your security requirements
      return false; // Default to deny
    }
  }
}
```

## Troubleshooting

### "Cannot read properties of undefined (reading 'post')"

If you encounter the error "Cannot read properties of undefined (reading 'post')" when using the services, this indicates that the HttpService is not properly injected. This can happen for a few reasons:

1. **Ensure you've imported PermifyModule correctly**

   Make sure you're using `PermifyModule.forRoot()` or `PermifyModule.forRootAsync()` in your app module:

   ```typescript
   @Module({
     imports: [
       PermifyModule.forRoot({
         baseUrl: 'https://your-permify-server.com',
         // other options...
       }),
     ],
   })
   export class AppModule {}
   ```

2. **Check HttpModule import**

   Make sure @nestjs/axios is properly installed and available in your project:

   ```bash
   npm install @nestjs/axios
   ```

3. **Module registration order**

   The order of module registration can sometimes affect dependency injection. Try moving the PermifyModule import before other modules that might depend on it.

4. **Circular dependencies**

   If you have circular dependencies between your modules, it can cause injection issues. Review your module structure to ensure there are no circular dependencies.

## Permission Interceptor

The Permission Interceptor simplifies access control in NestJS applications by automatically checking permissions based on decorators.

### Setup

```typescript
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PermifyModule, PermissionInterceptorModule, PermissionInterceptor } from 'nestjs-permify';

@Module({
  imports: [
    PermifyModule.forRoot({
      baseUrl: 'http://localhost:3476',
      // apiKey: 'your-api-key', // Optional
    }),
    PermissionInterceptorModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: PermissionInterceptor,
    },
  ],
})
export class AppModule {}
```

### Usage

#### Method 1: Per-Route Permissions

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { RequirePermission } from 'nestjs-permify';

@Controller('documents')
export class DocumentController {
  @RequirePermission({
    entity: 'document',
    idParam: 'id',
    permission: 'read',
    contextFields: ['organization'] // Extract from request
  })
  @Get(':id')
  getDocument(@Param('id') id: string) {
    // Only called if user has read permission on the document
    return this.documentService.findById(id);
  }
}
```

#### Method 2: Controller-Level Permissions

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { RequirePermission } from 'nestjs-permify';

@Controller('documents')
@RequirePermission({
  entity: 'document',
  permission: 'read',
})
export class DocumentController {
  @Get(':id')
  getDocument(@Param('id') id: string) {
    // Checks permissions using controller metadata
    return this.documentService.findById(id);
  }

  // Override controller metadata
  @RequirePermission({
    entity: 'document',
    permission: 'write',
  })
  @Post(':id')
  updateDocument(@Param('id') id: string, @Body() data: any) {
    // Checks write permission
    return this.documentService.update(id, data);
  }
}
```

### Metadata Options

```typescript
export interface PermissionMetadata {
  entity: string;           // Entity type (e.g., 'document', 'project')
  idParam?: string;         // Route parameter name for entity ID (default: 'id')
  permission: string;       // Permission to check (e.g., 'read', 'write')
  subjectType?: string;     // Subject type (default: 'user')
  contextFields?: string[]; // Fields to include in context from request
  tenant?: string;          // Tenant ID or parameter name (default: from req.tenant)
}
```

### Error Handling

The interceptor automatically throws a `ForbiddenException` if the permission check fails.

## Complete Example: From Schema Design to Authorization

This example demonstrates a complete integration of Permify in a document management system:

### 1. Define Authorization Schema

First, design your permission model by defining entities, relations, and permissions:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { SchemaService } from 'nestjs-permify';

@Injectable()
export class AuthorizationSchemaInitializer implements OnModuleInit {
  constructor(private readonly schemaService: SchemaService) {}

  async onModuleInit() {
    // Define the permission schema for the organization
    const schema = `
      // Users within the system
      entity user {}

      // Organizations represent top-level containers
      entity organization {
        // Relations define connections to users
        relation admin @user
        relation member @user

        // Permissions define what users can do
        permission view = admin or member
        permission edit = admin
        permission manage_members = admin
      }

      // Projects belong to organizations
      entity project {
        relation owner @user
        relation editor @user
        relation viewer @user
        relation parent @organization

        // Direct permissions
        permission view = owner or editor or viewer
        permission edit = owner or editor
        permission delete = owner

        // Organizational permissions (inheritance)
        permission admin = parent.admin
      }

      // Documents belong to projects
      entity document {
        relation creator @user
        relation collaborator @user
        relation reviewer @user
        relation parent @project

        // Direct permissions
        permission view = creator or collaborator or reviewer or parent.viewer
        permission edit = creator or collaborator or parent.editor
        permission delete = creator or parent.owner
        permission comment = view

        // Inherit project permissions for admins
        permission admin = parent.admin
      }
    `;

    // For each organization, create a tenant and schema
    const organizations = await this.getAllOrganizations();
    
    for (const org of organizations) {
      // Create a tenant for each organization
      await this.schemaService.writeSchema({
        tenant_id: org.id,
        schema,
      });
      
      console.log(`Schema initialized for organization: ${org.name} (${org.id})`);
    }
  }

  // Mock method to get organizations (in a real app, this would come from your database)
  private async getAllOrganizations() {
    return [
      { id: 'org-1', name: 'Acme Inc.' },
      { id: 'org-2', name: 'TechCorp' },
    ];
  }
}
```

### 2. Create Relationships During Entity Creation

Create relationships in Permify when entities are created in your application:

```typescript
// document.service.ts
import { Injectable } from '@nestjs/common';
import { DataService } from 'nestjs-permify';

@Injectable()
export class DocumentService {
  constructor(private readonly dataService: DataService) {}

  async createDocument(
    organizationId: string,
    projectId: string,
    userId: string,
    documentData: any,
  ) {
    // First, create the document in your database
    const document = await this.documentRepository.create({
      ...documentData,
      projectId,
      createdBy: userId,
    });

    // Then, create relationships in Permify
    await this.dataService.writeData({
      tenant_id: organizationId,
      entity: `document:${document.id}`,
      subject: {
        id: userId,
        relation: 'creator',
      },
    });

    // Also establish the parent relationship to the project
    await this.dataService.writeData({
      tenant_id: organizationId,
      entity: `document:${document.id}`,
      subject: {
        id: projectId,
        relation: 'parent',
      },
    });

    return document;
  }

  async addCollaborator(organizationId: string, documentId: string, userId: string) {
    // Add the user as a collaborator in your database
    await this.documentCollaboratorRepository.create({
      documentId,
      userId,
      role: 'collaborator',
    });

    // Create the relationship in Permify
    await this.dataService.writeData({
      tenant_id: organizationId,
      entity: `document:${documentId}`,
      subject: {
        id: userId,
        relation: 'collaborator',
      },
    });
  }
}
```

### 3. Set Up Controller with Permission Interceptor

```typescript
// document.module.ts
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { 
  PermifyModule, 
  PermissionInterceptorModule, 
  PermissionInterceptor 
} from 'nestjs-permify';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';

@Module({
  imports: [
    PermifyModule.forRoot({
      baseUrl: process.env.PERMIFY_URL || 'http://localhost:3476',
    }),
    PermissionInterceptorModule,
  ],
  controllers: [DocumentController],
  providers: [
    DocumentService,
    {
      provide: APP_INTERCEPTOR,
      useClass: PermissionInterceptor,
    },
  ],
})
export class DocumentModule {}
```

### 4. Implement Controller with Permission Checks

```typescript
// document.controller.ts
import { 
  Controller, Get, Post, Put, Delete, 
  Param, Body, Req, UseGuards 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermission } from 'nestjs-permify';
import { DocumentService } from './document.service';

@Controller('organizations/:orgId/projects/:projectId/documents')
@UseGuards(AuthGuard('jwt'))
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  async createDocument(
    @Req() req,
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Body() documentData: any,
  ) {
    // When creating a document, no permission check needed
    // The current user becomes the creator automatically
    return this.documentService.createDocument(
      orgId,
      projectId,
      req.user.id,
      documentData,
    );
  }

  @Get()
  @RequirePermission({
    entity: 'project',
    idParam: 'projectId',
    permission: 'view',
    tenant: 'orgId',
  })
  async getAllDocuments(
    @Param('projectId') projectId: string
  ) {
    // This will only execute if user has 'view' permission on the project
    return this.documentService.findAll(projectId);
  }

  @Get(':documentId')
  @RequirePermission({
    entity: 'document',
    idParam: 'documentId',
    permission: 'view',
    tenant: 'orgId',
    contextFields: ['user.organizationRole'],
  })
  async getDocument(
    @Param('documentId') documentId: string
  ) {
    // This will only execute if user has 'view' permission on the document
    return this.documentService.findById(documentId);
  }

  @Put(':documentId')
  @RequirePermission({
    entity: 'document',
    idParam: 'documentId',
    permission: 'edit',
    tenant: 'orgId',
  })
  async updateDocument(
    @Param('documentId') documentId: string,
    @Body() updateData: any,
  ) {
    // This will only execute if user has 'edit' permission on the document
    return this.documentService.update(documentId, updateData);
  }

  @Delete(':documentId')
  @RequirePermission({
    entity: 'document',
    idParam: 'documentId',
    permission: 'delete',
    tenant: 'orgId',
  })
  async deleteDocument(
    @Param('documentId') documentId: string,
  ) {
    // This will only execute if user has 'delete' permission on the document
    return this.documentService.delete(documentId);
  }

  @Post(':documentId/collaborators')
  @RequirePermission({
    entity: 'document',
    idParam: 'documentId',
    permission: 'edit',
    tenant: 'orgId',
  })
  async addCollaborator(
    @Param('orgId') orgId: string,
    @Param('documentId') documentId: string,
    @Body('userId') userId: string,
  ) {
    // Only users with 'edit' permission can add collaborators
    return this.documentService.addCollaborator(orgId, documentId, userId);
  }
}
```

### 5. Implement Front-End Permission Checking

In your front-end application, you can use the permission checking services to hide or show UI elements:

```typescript
// Angular example service
@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  constructor(private http: HttpClient) {}
  
  async canPerformAction(
    orgId: string,
    entityType: string,
    entityId: string,
    permission: string
  ): Promise<boolean> {
    try {
      const response = await this.http.post<{isAllowed: boolean}>(
        `/api/permissions/check`,
        {
          orgId,
          entityType,
          entityId,
          permission
        }
      ).toPromise();
      
      return response.isAllowed;
    } catch (error) {
      console.error('Permission check failed', error);
      return false;
    }
  }
}

// Usage in a component
@Component({
  selector: 'app-document-detail',
  template: `
    <div class="document-container">
      <h1>{{document.title}}</h1>
      <div class="content">{{document.content}}</div>
      
      <div class="actions">
        <button *ngIf="canEdit" (click)="editDocument()">Edit</button>
        <button *ngIf="canDelete" (click)="deleteDocument()">Delete</button>
        <button *ngIf="canAddCollaborators" (click)="showCollaboratorModal()">
          Add Collaborator
        </button>
      </div>
    </div>
  `
})
export class DocumentDetailComponent implements OnInit {
  document: any;
  canEdit = false;
  canDelete = false;
  canAddCollaborators = false;
  
  constructor(
    private documentService: DocumentService,
    private permissionService: PermissionService,
    private route: ActivatedRoute
  ) {}
  
  async ngOnInit() {
    const orgId = this.route.snapshot.paramMap.get('orgId');
    const documentId = this.route.snapshot.paramMap.get('documentId');
    
    this.document = await this.documentService.getDocument(orgId, documentId);
    
    // Check permissions to update UI
    this.canEdit = await this.permissionService.canPerformAction(
      orgId, 'document', documentId, 'edit'
    );
    
    this.canDelete = await this.permissionService.canPerformAction(
      orgId, 'document', documentId, 'delete'
    );
    
    this.canAddCollaborators = await this.permissionService.canPerformAction(
      orgId, 'document', documentId, 'edit'
    );
  }
}
```

### 6. Create Backend Permission Endpoint

For front-end permission checking, create an endpoint in your NestJS application:

```typescript
// permission.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionService } from 'nestjs-permify';

@Controller('permissions')
@UseGuards(AuthGuard('jwt'))
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post('check')
  async checkPermission(
    @Req() req,
    @Body() body: {
      orgId: string;
      entityType: string;
      entityId: string;
      permission: string;
    }
  ) {
    const result = await this.permissionService.checkAccess({
      tenant_id: body.orgId,
      entity: body.entityType,
      id: body.entityId,
      permission: body.permission,
      subjectType: 'user',
      context: {
        userId: req.user.id,
        // Include other context data as needed
        organizationRole: req.user.roles?.[body.orgId],
      },
    });

    return { isAllowed: result.isAllowed };
  }
}
```

This complete example demonstrates the full workflow:
1. Designing the authorization schema with entity relationships and permissions
2. Creating relationships during entity lifecycle in your application
3. Implementing permission checks using the interceptor
4. Controlling UI elements based on permissions
5. Setting up a permission checking endpoint for frontend applications

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Permify](https://permify.co) - For their open-source authorization system
- [NestJS](https://nestjs.com) - For the progressive Node.js framework

