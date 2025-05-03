import { Module } from '@nestjs/common';
import { PermissionInterceptor } from './permission.interceptor';
import { PermissionService } from '../services/permission.service';

@Module({
  providers: [PermissionInterceptor, PermissionService],
  exports: [PermissionInterceptor],
})
export class PermissionInterceptorModule {} 