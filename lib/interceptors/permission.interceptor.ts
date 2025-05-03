import { Injectable, ExecutionContext, CallHandler, NestInterceptor, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { PermissionService } from '../services/permission.service';
import { PermissionMetadata } from '../interfaces/permission-metadata.interface';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { CheckAccessDto } from '../dtos/check-access.dto';

@Injectable()
export class PermissionInterceptor implements NestInterceptor {
  private readonly logger = new Logger('PermissionInterceptor');

  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  async intercept(execContext: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    // Get metadata from handler or controller
    const metadata = this.reflector.getAllAndOverride<PermissionMetadata>(
      PERMISSION_KEY,
      [execContext.getHandler(), execContext.getClass()],
    );

    // If no metadata is defined, skip permission check
    if (!metadata) {
      return next.handle();
    }

    const request = execContext.switchToHttp().getRequest();
    
    // Extract entity ID from request params
    const idParam = metadata.idParam || 'id';
    const entityId = request.params[idParam];
    
    if (!entityId) {
      this.logger.warn(`Entity ID parameter '${idParam}' not found in request params`);
      throw new ForbiddenException('Missing entity ID parameter');
    }

    // Extract user ID from request (assumes authentication middleware has added user)
    const userId = request.user?.id || request.user?.sub;
    
    if (!userId) {
      this.logger.warn('User ID not found in request. Make sure authentication is properly configured');
      throw new ForbiddenException('User not authenticated');
    }

    // Get tenant ID from metadata or request
    let tenantId = metadata.tenant;
    
    // If tenant is specified as a request field, extract it
    if (tenantId && tenantId.startsWith('req.')) {
      const tenantPath = tenantId.split('.').slice(1);
      tenantId = tenantPath.reduce((obj, key) => obj?.[key], request);
    } else if (!tenantId) {
      // Default to req.tenant if exists
      tenantId = request.tenant;
    }

    if (!tenantId) {
      this.logger.warn('Tenant ID not found. Specify tenant in metadata or add tenant to request');
      throw new ForbiddenException('Tenant ID not provided');
    }

    // Build context from request based on contextFields
    const requestContext: Record<string, any> = { userId };
    
    if (metadata.contextFields) {
      for (const field of metadata.contextFields) {
        const fieldPath = field.split('.');
        let value = request;
        
        for (const key of fieldPath) {
          value = value?.[key];
          if (value === undefined) break;
        }
        
        if (value !== undefined) {
          // Set nested property from path (e.g., 'user.org' -> { user: { org: value } })
          const keys = field.split('.');
          let current = requestContext;
          
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
              current[keys[i]] = {};
            }
            current = current[keys[i]];
          }
          
          current[keys[keys.length - 1]] = value;
        }
      }
    }

    try {
      // Call Permify to check access
      const result = await this.permissionService.checkAccess({
        tenant_id: tenantId,
        entity: metadata.entity,
        id: entityId,
        permission: metadata.permission,
        subjectType: metadata.subjectType || 'user',
        context: requestContext,
      } as CheckAccessDto);

      if (!result.isAllowed) {
        throw new ForbiddenException(`Permission denied: ${metadata.permission} on ${metadata.entity}:${entityId}`);
      }

      return next.handle();
    } catch (error: any) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      
      this.logger.error(`Error checking permissions: ${error.message}`, error.stack);
      throw new ForbiddenException('Error checking permissions');
    }
  }
} 