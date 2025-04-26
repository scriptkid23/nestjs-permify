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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Permify](https://permify.co) - For their open-source authorization system
- [NestJS](https://nestjs.com) - For the progressive Node.js framework

