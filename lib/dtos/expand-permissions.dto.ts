export class ExpandPermissionsDto {
  tenant_id: string;
  entity: string;
  id: string;
}

export class ExpandPermissionsResponse {
  subjects: Array<{ relation: string; object: string }>;
}
