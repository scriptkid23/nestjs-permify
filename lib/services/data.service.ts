import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { WriteDataDto, WriteDataResponse } from '../dtos/write-data.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DataService {
  constructor(private readonly httpService: HttpService) {}

  async writeData(dto: WriteDataDto): Promise<WriteDataResponse> {
    const url = `/v1/tenants/${dto.tenant_id}/data/write`;
    const response = await firstValueFrom(this.httpService.post(url, dto));
    return response.data as WriteDataResponse;
  }

  async deleteRelationship(tenantId: string, entity: string, id: string, relation: string): Promise<any> {
    const url = `/v1/tenants/${tenantId}/data/delete`;
    const payload = {
      tenant_id: tenantId,
      entity: {
        type: entity,
        id: id
      },
      relation: relation
    };
    const response = await firstValueFrom(this.httpService.post(url, payload));
    return response.data;
  }

  async readRelationships(tenantId: string, entity: string, id: string): Promise<any> {
    const url = `/v1/tenants/${tenantId}/data/read`;
    const payload = {
      tenant_id: tenantId,
      entity: {
        type: entity,
        id: id
      }
    };
    const response = await firstValueFrom(this.httpService.post(url, payload));
    return response.data;
  }

  // Additional methods for data management would go here
}
