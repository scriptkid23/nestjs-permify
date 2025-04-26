import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CheckAccessDto, CheckAccessResponse } from '../dtos/check-access.dto';
import { ExpandPermissionsDto, ExpandPermissionsResponse } from '../dtos/expand-permissions.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PermissionService {
  constructor(private readonly http: HttpService) {}

  async checkAccess(dto: CheckAccessDto): Promise<CheckAccessResponse> {
    const url = `/v1/tenants/${dto.tenant_id}/check`;
    const response = await firstValueFrom(this.http.post(url, dto));
    return response.data as CheckAccessResponse;
  }

  async expandPermissions(dto: ExpandPermissionsDto): Promise<ExpandPermissionsResponse> {
    const url = `/v1/tenants/${dto.tenant_id}/expand`;
    const response = await firstValueFrom(this.http.post(url, dto));
    return response.data as ExpandPermissionsResponse;
  }

  // Additional methods (subjectFilter, lookupEntity, etc.)
}
