export interface PermissionMetadata {
  entity: string;           // Entity type (e.g., 'document', 'project')
  idParam?: string;         // Route parameter name for entity ID (default: 'id')
  permission: string;       // Permission to check (e.g., 'read', 'write')
  subjectType?: string;     // Subject type (default: 'user')
  contextFields?: string[]; // Fields to include in context from request
  tenant?: string;          // Tenant ID or parameter name (default: from req.tenant)
} 