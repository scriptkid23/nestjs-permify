import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class BundleService {
  constructor(private readonly httpService: HttpService) {}

  async writeBundle(tenantId: string, bundleData: any): Promise<any> {
    const url = `/v1/tenants/${tenantId}/bundles/write`;
    const response = await firstValueFrom(this.httpService.post(url, bundleData));
    return response.data;
  }

  async readBundle(tenantId: string, bundleId: string): Promise<any> {
    const url = `/v1/tenants/${tenantId}/bundles/${bundleId}`;
    const response = await firstValueFrom(this.httpService.get(url));
    return response.data;
  }

  async deleteBundle(tenantId: string, bundleId: string): Promise<any> {
    const url = `/v1/tenants/${tenantId}/bundles/${bundleId}`;
    const response = await firstValueFrom(this.httpService.delete(url));
    return response.data;
  }

  async listBundles(tenantId: string, page = 1, size = 10): Promise<any> {
    const url = `/v1/tenants/${tenantId}/bundles?page=${page}&size=${size}`;
    const response = await firstValueFrom(this.httpService.get(url));
    return response.data;
  }

  // Additional methods for bundle management
}
