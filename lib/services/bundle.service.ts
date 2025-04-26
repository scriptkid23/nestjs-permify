import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  DataBundleDto,
  WriteBundleDto,
  WriteBundleResponse,
  ReadBundleDto,
  ReadBundleResponse,
  DeleteBundleDto,
  DeleteBundleResponse,
  RunBundleDto,
  RunBundleResponse
} from '../dtos/bundle.dto';

@Injectable()
export class BundleService {
  constructor(private readonly httpService: HttpService) {
    // Log warning if HttpService is not available
    if (!httpService) {
      console.warn('HttpService is not properly injected in BundleService.');
    }
  }

  /**
   * Write a data bundle to define relationship and attribute operations
   * @see https://docs.permify.co/api-reference/bundle/write-bundle
   */
  async createBundle(tenantId: string, bundle: DataBundleDto): Promise<WriteBundleResponse> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    const url = `/v1/tenants/${tenantId}/bundle/write`;
    const requestData = {
      bundles: [bundle]
    };
    
    const response = await firstValueFrom(this.httpService.post(url, requestData));
    return response.data;
  }

  /**
   * Read a bundle by name
   * @see https://docs.permify.co/api-reference/bundle/read-bundle
   */
  async getBundle(dto: ReadBundleDto): Promise<ReadBundleResponse> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    const url = `/v1/tenants/${dto.tenant_id}/bundle/read`;
    const requestData = {
      name: dto.name
    };
    
    const response = await firstValueFrom(this.httpService.post(url, requestData));
    return response.data;
  }

  /**
   * Delete a bundle by name
   * @see https://docs.permify.co/api-reference/bundle/delete-bundle
   */
  async deleteBundle(dto: DeleteBundleDto): Promise<DeleteBundleResponse> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    const url = `/v1/tenants/${dto.tenant_id}/bundle/delete`;
    const requestData = {
      name: dto.name
    };
    
    const response = await firstValueFrom(this.httpService.post(url, requestData));
    return response.data;
  }

  /**
   * Create a bundle with multiple operations
   * @see https://docs.permify.co/api-reference/bundle/write-bundle
   */
  async createBundles(dto: WriteBundleDto): Promise<WriteBundleResponse> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    const url = `/v1/tenants/${dto.tenant_id}/bundle/write`;
    const requestData = {
      bundles: dto.bundles
    };
    
    const response = await firstValueFrom(this.httpService.post(url, requestData));
    return response.data;
  }

  /**
   * Run a bundle with the specified arguments
   * This executes the operations defined in the bundle
   */
  async runBundle(dto: RunBundleDto): Promise<RunBundleResponse> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    const url = `/v1/tenants/${dto.tenant_id}/bundle/run`;
    const requestData = {
      name: dto.name,
      arguments: dto.arguments
    };
    
    const response = await firstValueFrom(this.httpService.post(url, requestData));
    return response.data;
  }
}
