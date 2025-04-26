import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { WriteDataDto, WriteDataResponse } from '../dtos/write-data.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DataService {
  constructor(private readonly httpService: HttpService) {}

  async writeData(dto: WriteDataDto): Promise<any> {
    const url = `/v1/tenants/${dto.tenant_id}/relationships/write`;
    const response = await firstValueFrom(this.httpService.post(url, {
      metadata: {
        schema_version: "",
      },
      tuples: [{
        entity: {
          type: dto.entity.split(':')[0],
          id: dto.entity.split(':')[1]
        },
        relation: dto.subject.relation,
        subject: {
          type: "user",
          id: dto.subject.id
        }
      }]
    }));
    return response.data;
  }

  async deleteRelationship(tenantId: string, entity: string, id: string, relation: string): Promise<any> {
    const url = `/v1/tenants/${tenantId}/relationships/delete`;
    const response = await firstValueFrom(this.httpService.post(url, {
      tenant_id: tenantId,
      filter: {
        entity: {
          type: entity,
          ids: [id]
        },
        relation: relation
      }
    }));
    return response.data;
  }

  async readRelationships(tenantId: string, entity: string, id: string): Promise<any> {
    const url = `/v1/tenants/${tenantId}/relationships/read`;
    const response = await firstValueFrom(this.httpService.post(url, {
      tenant_id: tenantId,
      entity: {
        type: entity,
        id: id
      }
    }));
    return response.data;
  }

  // Additional methods for data management would go here
}
