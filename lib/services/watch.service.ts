import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
  WatchChangesDto, 
  WatchChangesResponse, 
  WatchPermissionsDto,
  DataChangeDto
} from '../dtos/watch.dto';

/**
 * Interface representing a data change in Permify
 */
interface DataChange {
  operation: 'OPERATION_UNSPECIFIED' | 'OPERATION_CREATE' | 'OPERATION_DELETE';
  tuple?: {
    entity: {
      type: string;
      id: string;
    };
    relation: string;
    subject: {
      type: string;
      id: string;
      relation?: string;
    };
  };
  attribute?: {
    entity: {
      type: string;
      id: string;
    };
    attribute: string;
    value: any;
  };
}

/**
 * Interface representing a watch response
 */
interface WatchResponse {
  result?: {
    changes: {
      snap_token: string;
      data_changes: DataChange[];
    };
  };
  error?: {
    code: number;
    message: string;
    details?: any[];
  };
}

@Injectable()
export class WatchService {
  constructor(private readonly httpService: HttpService) {
    // Log warning if HttpService is not available
    if (!httpService) {
      console.warn('HttpService is not properly injected in WatchService.');
    }
  }

  /**
   * Watch for changes in Permify data (relationships and attributes)
   * Returns a stream of changes that can be subscribed to
   * 
   * @param dto - Watch changes data transfer object
   * @see https://docs.permify.co/api-reference/watch/watch-changes
   */
  watchChanges(dto: WatchChangesDto): Observable<WatchChangesResponse> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    const url = `/v1/tenants/${dto.tenant_id}/watch`;
    const requestData = {
      snap_token: dto.snap_token || ''
    };
    
    return this.httpService.post(url, requestData, {
      responseType: 'stream'
    }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Watch for specific permission changes using DTO
   * This is a specialized version of watchChanges that filters for permission-related changes
   * 
   * @param dto - Watch permissions data transfer object
   */
  watchPermissionsByDto(dto: WatchPermissionsDto): Observable<WatchChangesResponse> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    // Using the general watch endpoint but will filter for permission-related changes
    return this.watchChanges({
      tenant_id: dto.tenant_id,
      snap_token: dto.snap_token
    }).pipe(
      map(response => {
        if (!response.result?.changes?.data_changes) {
          return response;
        }

        // Filter for changes related to the specified entity type and permission
        const filteredChanges = response.result.changes.data_changes.filter(
          change => change.tuple?.entity?.type === dto.entity_type &&
                    change.tuple?.relation === dto.permission
        );

        return {
          ...response,
          result: {
            changes: {
              snap_token: response.result.changes.snap_token,
              data_changes: filteredChanges
            }
          }
        };
      })
    );
  }

  /**
   * Watch changes to relationship tuples
   * @see https://docs.permify.co/api-reference/watch/relationship-changes
   */
  watchRelationships(tenantId: string, snapToken?: string): Observable<any> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    const url = `/v1/tenants/${tenantId}/relationships/watch`;
    const requestData = {
      metadata: {
        snap_token: snapToken || ""
      }
    };
    
    return this.httpService
      .post(url, requestData, { responseType: 'stream' })
      .pipe(
        map(response => response.data)
      );
  }
  
  /**
   * Watch for schema changes
   * @see https://docs.permify.co/api-reference/watch/schema-changes
   */
  watchSchema(tenantId: string, schemaVersion?: string): Observable<any> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    const url = `/v1/tenants/${tenantId}/schemas/watch`;
    const requestData = {
      metadata: {
        schema_version: schemaVersion || ""
      }
    };
    
    return this.httpService
      .post(url, requestData, { responseType: 'stream' })
      .pipe(
        map(response => response.data)
      );
  }
  
  /**
   * Watch permission changes for an entity-subject pair with individual parameters
   * @see https://docs.permify.co/api-reference/watch/permission-changes
   */
  watchPermissions(
    tenantId: string, 
    entityType: string,
    entityId: string,
    permission: string,
    subjectType: string,
    subjectId: string,
    snapToken?: string,
    schemaVersion?: string
  ): Observable<any> {
    // Handle the case where httpService might be undefined
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }

    const url = `/v1/tenants/${tenantId}/permissions/watch`;
    const requestData = {
      metadata: {
        snap_token: snapToken || "",
        schema_version: schemaVersion || "",
        depth: 20
      },
      entity: {
        type: entityType,
        id: entityId
      },
      permission: permission,
      subject: {
        type: subjectType,
        id: subjectId
      }
    };
    
    return this.httpService
      .post(url, requestData, { responseType: 'stream' })
      .pipe(
        map(response => response.data)
      );
  }
}
