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
  subjectType?: string;
  context?: Record<string, any>;
}

export interface CheckAccessResponse {
  can: string;
  isAllowed?: boolean;
  metadata?: {
    check_count: number;
  };
}

export interface ExpandPermissionsDto {
  tenant_id: string;
  entity?: string;
  id?: string;
  permission?: string;
  metadata?: {
    snap_token?: string;
    schema_version?: string;
    depth?: number;
  };
}

export interface ExpandPermissionsResponse {
  subjects: Array<{ relation: string; object: string }>;
}

export interface WriteSchemaDto {
  tenant_id: string;
  schema: string;
}

export interface WriteSchemaResponse {
  schema_version: string;
}

export interface WriteDataDto {
  tenant_id: string;
  action: string;
  entity: string;
  subject: {
    id: string;
    relation: string;
    type?: string;
  };
  context?: Record<string, any>;
}

export interface WriteDataResponse {
  success: boolean;
}

export interface ReadRelationshipsDto {
  tenant_id: string;
  entity: string;
  id: string;
}

export interface ReadRelationshipsResponse {
  tuples: Array<{
    entity: {
      type: string;
      id: string;
    };
    relation: string;
    subject: {
      type: string;
      id: string;
      relation?: string;
    };
  }>;
}

export interface DeleteRelationshipDto {
  tenant_id: string;
  entity: string;
  id: string;
  relation: string;
}

export interface DeleteRelationshipResponse {
  success: boolean;
}

export interface SubjectFilterDto {
  tenant_id: string;
  subject_ids: string[];
  subject_type: string;
  permission: string;
  entity_type: string;
  entity_id?: string;
}

export interface SubjectFilterResponse {
  subject_ids: string[];
}

export interface LookupEntityDto {
  tenant_id: string;
  entity_type: string;
  permission: string;
  subject_type: string;
  subject_id: string;
  subject_relation?: string;
}

export interface LookupEntityResponse {
  entity_ids: string[];
}

export interface SubjectPermissionListDto {
  tenant_id: string;
  subject_type: string;
  subject_id: string;
  entity_type: string;
  entity_id: string;
}

export interface SubjectPermissionListResponse {
  permissions: string[];
}

export interface CreateTenantDto {
  id: string;
  name?: string;
}

export interface CreateTenantResponse {
  id: string;
  name: string;
}

export interface ListTenantsDto {
  page_size?: number;
  continuous_token?: string;
}

export interface ListTenantsResponse {
  tenants: Array<{
    id: string;
    name: string;
  }>;
  continuous_token?: string;
}

export interface GetTenantResponse {
  id: string;
  name: string;
}

export interface DataBundleDto {
  name: string;
  arguments: string[];
  operations: {
    relationships_write?: string[];
    relationships_delete?: string[];
    attributes_write?: string[];
    attributes_delete?: string[];
  }[];
}

export interface WriteBundleDto {
  tenant_id: string;
  bundles: DataBundleDto[];
}

export interface WriteBundleResponse {
  success: boolean;
}

export interface ReadBundleDto {
  tenant_id: string;
  name: string;
}

export interface ReadBundleResponse {
  bundle: DataBundleDto;
}

export interface DeleteBundleDto {
  tenant_id: string;
  name: string;
}

export interface DeleteBundleResponse {
  success: boolean;
}

export interface RunBundleDto {
  tenant_id: string;
  name: string;
  arguments: Record<string, string>;
}

export interface RunBundleResponse {
  success: boolean;
}

export interface WatchChangesDto {
  tenant_id: string;
  snap_token?: string;
}

export interface DataChangeDto {
  operation: 'OPERATION_UNSPECIFIED' | 'OPERATION_CREATE' | 'OPERATION_DELETE';
  tuple?: {
    entity: {
      type: string;
      id: string;
    };
    relation: string;
    subject: {
      type: string;
      id: string;
      relation?: string;
    };
  };
  attribute?: {
    entity: {
      type: string;
      id: string;
    };
    attribute: string;
    value: any;
  };
}

export interface WatchChangesResponse {
  result?: {
    changes: {
      snap_token: string;
      data_changes: DataChangeDto[];
    };
  };
  error?: {
    code: number;
    message: string;
    details?: any[];
  };
}

export interface WatchPermissionsDto {
  tenant_id: string;
  entity_type: string;
  permission: string;
  snap_token?: string;
}

export interface ReadSchemaDto {
  tenant_id: string;
}

export interface ReadSchemaResponse {
  schema: string;
  schema_version: string;
}

export interface ValidateSchemaDto {
  tenant_id: string;
  schema: string;
}

export interface ValidateSchemaResponse {
  is_valid: boolean;
  error?: string;
}

// Services
export class PermissionService {
  constructor(httpService: any);
  checkAccess(dto: CheckAccessDto): Promise<CheckAccessResponse>;
  expandPermissions(dto: ExpandPermissionsDto): Promise<ExpandPermissionsResponse>;
  subjectFilter(dto: SubjectFilterDto): Promise<SubjectFilterResponse>;
  lookupEntity(dto: LookupEntityDto): Promise<LookupEntityResponse>;
  lookupEntityStream(dto: LookupEntityDto): Observable<any>;
  subjectPermissionList(dto: SubjectPermissionListDto): Promise<SubjectPermissionListResponse>;
}

export class SchemaService {
  constructor(httpService: any);
  writeSchema(dto: WriteSchemaDto): Promise<WriteSchemaResponse>;
  readSchema(dto: ReadSchemaDto): Promise<ReadSchemaResponse>;
  validateSchema(dto: ValidateSchemaDto): Promise<ValidateSchemaResponse>;
}

export class DataService {
  constructor(httpService: any);
  writeData(dto: WriteDataDto): Promise<WriteDataResponse>;
  deleteRelationship(dto: DeleteRelationshipDto): Promise<DeleteRelationshipResponse>;
  readRelationships(dto: ReadRelationshipsDto): Promise<ReadRelationshipsResponse>;
  lookupSubjects(dto: LookupSubjectsDto): Promise<LookupSubjectsResponse>;
  lookupResources(dto: LookupResourcesDto): Promise<LookupResourcesResponse>;
}

export interface LookupSubjectsDto {
  tenant_id: string;
  entity: string;
  id: string;
  relation: string;
  subject_type?: string;
}

export interface LookupSubjectsResponse {
  subjects: string[];
}

export interface LookupResourcesDto {
  tenant_id: string;
  permission: string;
  entity: string;
  subject: string;
  context?: Record<string, any>;
}

export interface LookupResourcesResponse {
  entity_ids: string[];
}

export class BundleService {
  constructor(httpService: any);
  createBundle(tenantId: string, bundle: DataBundleDto): Promise<WriteBundleResponse>;
  getBundle(dto: ReadBundleDto): Promise<ReadBundleResponse>;
  deleteBundle(dto: DeleteBundleDto): Promise<DeleteBundleResponse>;
  createBundles(dto: WriteBundleDto): Promise<WriteBundleResponse>;
  runBundle(dto: RunBundleDto): Promise<RunBundleResponse>;
}

export class TenancyService {
  constructor(httpService: any);
  createTenant(dto: CreateTenantDto): Promise<CreateTenantResponse>;
  deleteTenant(tenantId: string): Promise<any>;
  getTenant(tenantId: string): Promise<GetTenantResponse>;
  listTenants(dto?: ListTenantsDto): Promise<ListTenantsResponse>;
}

export class WatchService {
  constructor(httpService: any);
  watchChanges(dto: WatchChangesDto): Observable<WatchChangesResponse>;
  watchPermissions(dto: WatchPermissionsDto): Observable<WatchChangesResponse>;
} 