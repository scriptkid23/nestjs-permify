# NestJS Permify

A NestJS client library for interacting with the Permify authorization service API.

## Installation

```bash
npm install nestjs-permify
```

## Usage

Register the module in your application:

```typescript
import { Module } from '@nestjs/common';
import { PermifyModule } from 'nestjs-permify';

@Module({
  imports: [
    PermifyModule.forRoot({
      baseUrl: 'https://api.permify.co',
      apiKey: 'your-api-key',
    }),
  ],
})
export class AppModule {}
```

Use the services in your controllers and services:

```typescript
import { Injectable } from '@nestjs/common';
import { PermissionService, CheckAccessDto } from 'nestjs-permify';

@Injectable()
export class YourService {
  constructor(private readonly permissionService: PermissionService) {}

  async checkUserAccess(userId: string, resourceId: string): Promise<boolean> {
    const checkDto: CheckAccessDto = {
      tenant_id: 'your-tenant-id',
      entity: 'user',
      id: userId,
      permission: 'read',
      context: { resource: resourceId },
    };
    
    const result = await this.permissionService.checkAccess(checkDto);
    return result.isAllowed;
  }
}
```

## Services

- `PermissionService`: Check permissions and expand permissions
- `SchemaService`: Manage authorization schemas
- `DataService`: Write and manage relation data
- `BundleService`: Work with schema bundles
- `TenancyService`: Manage tenants
- `WatchService`: Watch for changes in authorization data

## License

MIT
