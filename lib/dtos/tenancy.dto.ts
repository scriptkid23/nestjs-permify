export class CreateTenantDto {
  id: string;
  name?: string;
}

export class CreateTenantResponse {
  id: string;
  name: string;
}

export class ListTenantsDto {
  page_size?: number;
  continuous_token?: string;
}

export class ListTenantsResponse {
  tenants: Array<{
    id: string;
    name: string;
  }>;
  continuous_token?: string;
}

export class GetTenantResponse {
  id: string;
  name: string;
} 