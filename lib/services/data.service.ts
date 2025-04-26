import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { WriteDataDto, WriteDataResponse } from '../dtos/write-data.dto';
import { 
  ReadRelationshipsDto, 
  ReadRelationshipsResponse,
  DeleteRelationshipDto,
  DeleteRelationshipResponse,
  LookupSubjectsDto,
  LookupSubjectsResponse,
  LookupResourcesDto,
  LookupResourcesResponse
} from '../dtos/relationship.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DataService {
  constructor(private readonly httpService: HttpService) {
    // Log warning if HttpService is not available
    if (!httpService) {
      console.warn('HttpService is not properly injected in DataService.');
    }
  }

  async writeData(dto: WriteDataDto): Promise<WriteDataResponse> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

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
          type: dto.subject.type || "user",
          id: dto.subject.id
        }
      }]
    }));
    return response.data;
  }

  async deleteRelationship(dto: DeleteRelationshipDto): Promise<DeleteRelationshipResponse> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    const url = `/v1/tenants/${dto.tenant_id}/relationships/delete`;
    const response = await firstValueFrom(this.httpService.post(url, {
      tenant_id: dto.tenant_id,
      filter: {
        entity: {
          type: dto.entity,
          ids: [dto.id]
        },
        relation: dto.relation
      }
    }));
    return response.data;
  }

  async readRelationships(dto: ReadRelationshipsDto): Promise<ReadRelationshipsResponse> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    const url = `/v1/tenants/${dto.tenant_id}/relationships/read`;
    const response = await firstValueFrom(this.httpService.post(url, {
      tenant_id: dto.tenant_id,
      entity: {
        type: dto.entity,
        id: dto.id
      }
    }));
    return response.data;
  }

  /**
   * Lookup subjects that have a specific relation to an entity
   */
  async lookupSubjects(dto: LookupSubjectsDto): Promise<LookupSubjectsResponse> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    const url = `/v1/tenants/${dto.tenant_id}/relationships/lookup/subjects`;
    const response = await firstValueFrom(this.httpService.post(url, {
      tenant_id: dto.tenant_id,
      entity: {
        type: dto.entity,
        id: dto.id
      },
      relation: dto.relation,
      subject_type: dto.subject_type
    }));
    return response.data;
  }

  /**
   * Lookup resources that a subject has a specific permission on
   */
  async lookupResources(dto: LookupResourcesDto): Promise<LookupResourcesResponse> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    const url = `/v1/tenants/${dto.tenant_id}/permissions/lookup/resources`;
    const response = await firstValueFrom(this.httpService.post(url, {
      tenant_id: dto.tenant_id,
      permission: dto.permission,
      entity_type: dto.entity,
      subject: dto.subject,
      context: dto.context
    }));
    return response.data;
  }

  // Additional methods for data management would go here
}
