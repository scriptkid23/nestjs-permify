import { DynamicModule, ModuleMetadata, Provider, Type, ForwardReference } from '@nestjs/common';
import { Observable } from 'rxjs';

// Main module interfaces
export interface PermifyOptions {
  baseUrl: string;
  apiKey?: string;
  skipHealthCheck?: boolean;
}

export interface PermifyAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useFactory?: (...args: any[]) => Promise<PermifyOptions> | PermifyOptions;
  useClass?: Type<PermifyOptionsFactory>;
  useExisting?: Type<PermifyOptionsFactory>;
  providers?: Provider[];
}

export interface PermifyOptionsFactory {
  createPermifyOptions(): Promise<PermifyOptions> | PermifyOptions;
}

// Main Module
export class PermifyModule {
  static forRoot(options: PermifyOptions): DynamicModule;
  static forRootAsync(options: PermifyAsyncOptions): DynamicModule;
}

// DTOs
export interface CheckAccessDto {
  tenant_id: string;
  entity: string;
  id: string;
  permission: string;
  context?: Record<string, any>;
  subjectType?: string;
}

export interface CheckAccessResponse {
  can: string;
  metadata?: Record<string, any>;
  isAllowed?: boolean;
}

export interface ExpandPermissionsDto {
  tenant_id: string;
  entity?: string;
  id?: string;
  permission?: string;
  metadata?: Record<string, any>;
}

export interface WriteSchemaDto {
  tenant_id: string;
  schema: string;
}

export interface WriteDataDto {
  tenant_id: string;
  action: string;
  entity: string;
  subject: {
    id: string;
    relation: string;
  };
  context?: Record<string, any>;
}

// Services
export class PermissionService {
  constructor(httpService: any);
  checkAccess(dto: CheckAccessDto): Promise<CheckAccessResponse>;
  expandPermissions(dto: ExpandPermissionsDto): Promise<any>;
}

export class SchemaService {
  constructor(httpService: any);
  writeSchema(dto: WriteSchemaDto): Promise<any>;
  readSchema(tenantId: string): Promise<any>;
  validateSchema(dto: WriteSchemaDto): Promise<any>;
}

export class DataService {
  constructor(httpService: any);
  writeData(dto: WriteDataDto): Promise<any>;
  readData(tenantId: string, entityType?: string, subjectId?: string): Promise<any>;
  deleteRelationship(tenantId: string, entityId: string, relation: string, subjectId: string): Promise<any>;
}

export class BundleService {
  constructor(httpService: any);
  createBundle(tenantId: string, name: string): Promise<any>;
  getBundle(tenantId: string, name: string): Promise<any>;
  listBundles(tenantId: string): Promise<any>;
}

export class TenancyService {
  constructor(httpService: any);
  createTenant(tenantId: string): Promise<any>;
  deleteTenant(tenantId: string): Promise<any>;
  getTenant(tenantId: string): Promise<any>;
  listTenants(): Promise<any>;
}

export class WatchService {
  constructor(httpService: any);
  watchChanges(tenantId: string): Observable<any>;
  watchPermissions(tenantId: string, entityType: string, permission: string): Observable<any>;
} 