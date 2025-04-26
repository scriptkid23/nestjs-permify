import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CheckAccessDto, CheckAccessResponse } from '../dtos/check-access.dto';
import { ExpandPermissionsDto, ExpandPermissionsResponse } from '../dtos/expand-permissions.dto';
import { 
  SubjectFilterDto, 
  SubjectFilterResponse, 
  LookupEntityDto, 
  LookupEntityResponse,
  SubjectPermissionListDto,
  SubjectPermissionListResponse
} from '../dtos/permission.dto';
import { firstValueFrom } from 'rxjs';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class PermissionService {
  constructor(private readonly httpService: HttpService) {
    // Log warning if HttpService is not available
    if (!httpService) {
      console.warn('HttpService is not properly injected in PermissionService.');
    }
  }

  /**
   * Check if a subject has permission to access an entity
   * @see https://docs.permify.co/api-reference/permission/check-api
   */
  async checkAccess(dto: CheckAccessDto): Promise<CheckAccessResponse> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    const url = `/v1/tenants/${dto.tenant_id}/permissions/check`;
    
    // Format data according to Permify API
    const requestData = {
      metadata: {
        snap_token: "",
        schema_version: "",
        depth: 20,
      },
      entity: {
        type: dto.entity,
        id: dto.id
      },
      permission: dto.permission,
      subject: {
        type: dto.subjectType || "user",
        id: dto.context?.userId || "",
      },
      context: dto.context ? { data: dto.context } : undefined
    };
    
    const response = await firstValueFrom(this.httpService.post(url, requestData));
    
    // Convert the response to CheckAccessResponse format
    const result = response.data as CheckAccessResponse;
    
    // Add isAllowed field based on the can value
    result.isAllowed = (result.can === 'CHECK_RESULT_ALLOWED');
    
    return result;
  }

  /**
   * Expand permissions for an entity
   * @see https://docs.permify.co/api-reference/permission/expand-api
   */
  async expandPermissions(dto: ExpandPermissionsDto): Promise<ExpandPermissionsResponse> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    const url = `/v1/tenants/${dto.tenant_id}/permissions/expand`;
    
    const requestData = {
      metadata: {
        snap_token: dto.metadata?.snap_token || "",
        schema_version: dto.metadata?.schema_version || "",
        depth: dto.metadata?.depth || 20,
      },
      entity: dto.entity ? {
        type: dto.entity,
        id: dto.id || ""
      } : undefined,
      permission: dto.permission || ""
    };
    
    const response = await firstValueFrom(this.httpService.post(url, requestData));
    return response.data;
  }

  /**
   * Filter subjects based on permission
   * @see https://docs.permify.co/api-reference/permission/lookup-subject
   */
  async subjectFilter(dto: SubjectFilterDto): Promise<SubjectFilterResponse> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    const url = `/v1/tenants/${dto.tenant_id}/permissions/subjects`;
    
    const requestData = {
      metadata: {
        snap_token: "",
        schema_version: "",
        depth: 20,
      },
      subject: {
        type: dto.subject_type,
        ids: dto.subject_ids
      },
      permission: dto.permission,
      entity: {
        type: dto.entity_type,
        id: dto.entity_id || ""
      }
    };
    
    const response = await firstValueFrom(this.httpService.post(url, requestData));
    return response.data;
  }

  /**
   * Lookup entities based on permission
   * @see https://docs.permify.co/api-reference/permission/lookup-entity
   */
  async lookupEntity(dto: LookupEntityDto): Promise<LookupEntityResponse> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    const url = `/v1/tenants/${dto.tenant_id}/permissions/entities`;
    
    const requestData = {
      metadata: {
        snap_token: "",
        schema_version: "",
        depth: 20,
      },
      entity_type: dto.entity_type,
      permission: dto.permission,
      subject: {
        type: dto.subject_type,
        id: dto.subject_id,
        relation: dto.subject_relation || ""
      }
    };
    
    const response = await firstValueFrom(this.httpService.post(url, requestData));
    return response.data;
  }

  /**
   * Lookup entities with streaming response
   * @see https://docs.permify.co/api-reference/permission/lookup-entity-stream
   */
  lookupEntityStream(dto: LookupEntityDto): Observable<any> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    const url = `/v1/tenants/${dto.tenant_id}/permissions/entities/stream`;
    
    const requestData = {
      metadata: {
        snap_token: "",
        schema_version: "",
        depth: 20,
      },
      entity_type: dto.entity_type,
      permission: dto.permission,
      subject: {
        type: dto.subject_type,
        id: dto.subject_id,
        relation: dto.subject_relation || ""
      }
    };
    
    return this.httpService.post(url, requestData, { responseType: 'stream' })
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Get subject permissions list
   * @see https://docs.permify.co/api-reference/permission/subject-permission
   */
  async subjectPermissionList(dto: SubjectPermissionListDto): Promise<SubjectPermissionListResponse> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    const url = `/v1/tenants/${dto.tenant_id}/permissions/subject-permission`;
    
    const requestData = {
      metadata: {
        snap_token: "",
        schema_version: "",
        depth: 20,
      },
      subject: {
        type: dto.subject_type,
        id: dto.subject_id
      },
      entity: {
        type: dto.entity_type,
        id: dto.entity_id
      }
    };
    
    const response = await firstValueFrom(this.httpService.post(url, requestData));
    return response.data;
  }
}
