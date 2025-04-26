export class SubjectFilterDto {
  tenant_id: string;
  subject_ids: string[];
  subject_type: string;
  permission: string;
  entity_type: string;
  entity_id?: string;
}

export class SubjectFilterResponse {
  subject_ids: string[];
}

export class LookupEntityDto {
  tenant_id: string;
  entity_type: string;
  permission: string;
  subject_type: string;
  subject_id: string;
  subject_relation?: string;
}

export class LookupEntityResponse {
  entity_ids: string[];
}

export class SubjectPermissionListDto {
  tenant_id: string;
  subject_type: string;
  subject_id: string;
  entity_type: string;
  entity_id: string;
}

export class SubjectPermissionListResponse {
  permissions: string[];
} 