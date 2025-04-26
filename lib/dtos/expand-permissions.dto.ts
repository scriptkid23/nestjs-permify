export class ExpandPermissionsDto {
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

export class ExpandPermissionsResponse {
  subjects: Array<{ relation: string; object: string }>;
}
