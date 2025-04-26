export class CheckAccessDto {
  tenant_id: string;
  entity: string;
  id: string;
  permission: string;
  context?: Record<string, any>;
}

export class CheckAccessResponse {
  can: string;
  isAllowed?: boolean;
  metadata?: {
    check_count: number;
  };
}
