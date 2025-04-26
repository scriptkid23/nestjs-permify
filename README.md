# NestJS Permify

[![npm version](https://badge.fury.io/js/nestjs-permify.svg)](https://badge.fury.io/js/nestjs-permify)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm downloads](https://img.shields.io/npm/dm/nestjs-permify.svg)](https://www.npmjs.com/package/nestjs-permify)
[![GitHub stars](https://img.shields.io/github/stars/scriptkid23/nestjs-permify.svg)](https://github.com/scriptkid23/nestjs-permify/stargazers)

A NestJS client library for interacting with the [Permify](https://permify.co) authorization service API. This module provides a clean and type-safe interface to Permify's authorization system, making it easy to integrate fine-grained permissions into your NestJS applications.

## Features

- Fully integrated with NestJS dependency injection system
- TypeScript support with comprehensive type definitions
- Wraps all major Permify services:
  - Permission checking and expansion
  - Schema management
  - Relationship data management
  - Tenant management
  - Schema bundling
  - Real-time permission watching

## Installation

```bash
npm install nestjs-permify
```

## Quick Start

### Module Registration

Add the PermifyModule to your application's imports:

```typescript
import { Module } from '@nestjs/common';
import { PermifyModule } from 'nestjs-permify';

@Module({
  imports: [
    PermifyModule.forRoot({
      baseUrl: 'https://api.permify.co', // or your Permify server URL
      apiKey: 'your-api-key', // if required
    }),
    // Other modules...
  ],
})
export class AppModule {}
```

For dynamic configuration (e.g., loading from environment variables or ConfigService):

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
      }),
    }),
  ],
})
export class AppModule {}
```

### Usage Examples

#### Checking Permissions

```typescript
import { Injectable } from '@nestjs/common';
import { PermissionService, CheckAccessDto } from 'nestjs-permify';

@Injectable()
export class DocumentService {
  constructor(private readonly permissionService: PermissionService) {}

  async canUserEditDocument(userId: string, documentId: string): Promise<boolean> {
    const checkDto: CheckAccessDto = {
      tenant_id: 'your-tenant-id',
      entity: 'document',
      id: documentId,
      permission: 'edit',
      context: { userId },
    };
    
    const result = await this.permissionService.checkAccess(checkDto);
    return result.isAllowed;
  }
}
```

#### Managing Schemas

```typescript
import { Injectable } from '@nestjs/common';
import { SchemaService } from 'nestjs-permify';

@Injectable()
export class AuthorizationService {
  constructor(private readonly schemaService: SchemaService) {}

  async initializeAuthSchema(tenantId: string): Promise<void> {
    const schema = `
      entity user {}
      
      entity document {
        relation creator @user
        relation viewer @user
        
        permission view = viewer or creator
        permission edit = creator
      }
    `;
    
    await this.schemaService.writeSchema({
      tenant_id: tenantId,
      schema,
    });
  }
}
```

#### Creating Relationships

```typescript
import { Injectable } from '@nestjs/common';
import { DataService } from 'nestjs-permify';

@Injectable()
export class DocumentRelationService {
  constructor(private readonly dataService: DataService) {}

  async setDocumentCreator(tenantId: string, documentId: string, userId: string): Promise<void> {
    await this.dataService.writeData({
      tenant_id: tenantId,
      action: 'create',
      entity: `document:${documentId}`,
      subject: { 
        id: userId, 
        relation: 'creator'
      },
    });
  }
}
```

## Available Services

The library provides the following services:

| Service | Description |
|---------|-------------|
| `PermissionService` | Check access permissions and expand permissions |
| `SchemaService` | Create and manage authorization schemas |
| `DataService` | Manage relationships between entities |
| `TenancyService` | Create and manage tenants for multi-tenant applications |
| `BundleService` | Work with bundled schemas |
| `WatchService` | Set up watchers for real-time permission updates |

## Advanced Usage

For more detailed examples and advanced usage, please refer to the [Permify documentation](https://docs.permify.co).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Permify](https://permify.co) - For their excellent authorization system
- [NestJS](https://nestjs.com) - For the progressive Node.js framework
