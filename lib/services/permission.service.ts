import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CheckAccessDto, CheckAccessResponse } from '../dtos/check-access.dto';
import { ExpandPermissionsDto } from '../dtos/expand-permissions.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PermissionService {
  constructor(private readonly httpService: HttpService) {}

  async checkAccess(dto: CheckAccessDto): Promise<CheckAccessResponse> {
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
      }
    };
    
    const response = await firstValueFrom(this.httpService.post(url, requestData));
    
    // Convert the response to CheckAccessResponse format
    const result = response.data as CheckAccessResponse;
    
    // Add isAllowed field based on the can value
    result.isAllowed = (result.can === 'CHECK_RESULT_ALLOWED');
    
    return result;
  }

  async expandPermissions(dto: ExpandPermissionsDto): Promise<any> {
    const url = `/v1/tenants/${dto.tenant_id}/permissions/expand`;
    const response = await firstValueFrom(this.httpService.post(url, dto));
    return response.data;
  }

  // Additional methods (subjectFilter, lookupEntity, etc.)
}
