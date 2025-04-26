import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TenancyService {
  constructor(private readonly httpService: HttpService) {}

  async createTenant(tenantId: string): Promise<any> {
    const url = '/v1/tenants';
    const response = await firstValueFrom(this.httpService.post(url, { id: tenantId, name: tenantId }));
    return response.data;
  }

  async deleteTenant(tenantId: string): Promise<any> {
    const url = `/v1/tenants/${tenantId}`;
    const response = await firstValueFrom(this.httpService.delete(url));
    return response.data;
  }

  // Additional methods for tenant management
}
