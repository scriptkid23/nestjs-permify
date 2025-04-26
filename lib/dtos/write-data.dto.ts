export class WriteDataDto {
  tenant_id: string;
  action: string;
  entity: string;
  subject: { id: string; relation: string; type?: string };
  context?: any;
}
export class WriteDataResponse {
  success: boolean;
}
