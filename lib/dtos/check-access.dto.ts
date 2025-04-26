export class CheckAccessDto {
  tenant_id: string;
  entity: string;
  id: string;
  permission: string;
  context?: Record<string, any>;
}

export class CheckAccessResponse {
  isAllowed: boolean;
}
