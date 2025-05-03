import { SetMetadata } from '@nestjs/common';
import { PermissionMetadata } from '../interfaces/permission-metadata.interface';

export const PERMISSION_KEY = 'permission_metadata';

/**
 * Decorator to mark controller methods that require permission checks
 * 
 * @example
 * ```typescript
 * @RequirePermission({
 *   entity: 'document',
 *   idParam: 'documentId',
 *   permission: 'read',
 *   contextFields: ['organization'],
 * })
 * @Get(':documentId')
 * getDocument(@Param('documentId') id: string) {
 *   // Method implementation
 * }
 * ```
 */
export const RequirePermission = (metadata: PermissionMetadata) => 
  SetMetadata(PERMISSION_KEY, metadata); 