export class WatchChangesDto {
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

export class WatchPermissionsDto {
  tenant_id: string;
  entity_type: string;
  permission: string;
  snap_token?: string;
} 