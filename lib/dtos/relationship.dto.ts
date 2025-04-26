export class ReadRelationshipsDto {
  tenant_id: string;
  entity: string;
  id: string;
}

export class ReadRelationshipsResponse {
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

export class DeleteRelationshipDto {
  tenant_id: string;
  entity: string;
  id: string;
  relation: string;
}

export class DeleteRelationshipResponse {
  success: boolean;
}

export class LookupSubjectsDto {
  tenant_id: string;
  entity: string;
  id: string;
  relation: string;
  subject_type?: string;
}

export class LookupSubjectsResponse {
  subjects: string[];
}

export class LookupResourcesDto {
  tenant_id: string;
  permission: string;
  entity: string;
  subject: string;
  context?: Record<string, any>;
}

export class LookupResourcesResponse {
  entity_ids: string[];
} 