import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreateTenantDto, CreateTenantResponse, ListTenantsDto, ListTenantsResponse, GetTenantResponse } from '../dtos/tenancy.dto';

@Injectable()
export class TenancyService {
  constructor(private readonly httpService: HttpService) {
    // Log warning if HttpService is not available
    if (!httpService) {
      console.warn('HttpService is not properly injected in TenancyService.');
    }
  }

  /**
   * Create a new tenant
   * @see https://docs.permify.co/api-reference/tenancy/create-tenant
   */
  async createTenant(dto: CreateTenantDto): Promise<CreateTenantResponse> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    const url = '/v1/tenants/create';
    const requestData = {
      id: dto.id,
      name: dto.name || dto.id
    };
    
    const response = await firstValueFrom(this.httpService.post(url, requestData));
    return response.data;
  }

  /**
   * Delete a tenant by ID
   * @see https://docs.permify.co/api-reference/tenancy/delete-tenant
   */
  async deleteTenant(tenantId: string): Promise<any> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    const url = `/v1/tenants/${tenantId}`;
    const response = await firstValueFrom(this.httpService.delete(url));
    return response.data;
  }

  /**
   * List all tenants with pagination
   * @see https://docs.permify.co/api-reference/tenancy/list-tenants
   */
  async listTenants(dto: ListTenantsDto = {}): Promise<ListTenantsResponse> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    const url = '/v1/tenants/list';
    const requestData = {
      page_size: dto.page_size || 20,
      continuous_token: dto.continuous_token || ''
    };
    
    const response = await firstValueFrom(this.httpService.post(url, requestData));
    return response.data;
  }

  /**
   * Get tenant information by ID
   */
  async getTenant(tenantId: string): Promise<GetTenantResponse> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    const url = `/v1/tenants/${tenantId}`;
    const response = await firstValueFrom(this.httpService.get(url));
    return response.data;
  }
}
