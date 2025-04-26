import { DynamicModule, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PermifyModuleOptions } from './interfaces/permify-options.interface';
import { PERMIFY_MODULE_OPTIONS } from './constants/permify.constants';
import { PermissionService } from './services/permission.service';
import { SchemaService } from './services/schema.service';
import { DataService } from './services/data.service';
import { BundleService } from './services/bundle.service';
import { TenancyService } from './services/tenancy.service';
import { WatchService } from './services/watch.service';

@Module({})
export class PermifyModule {
  static forRoot(options: PermifyModuleOptions): DynamicModule {
    return {
      module: PermifyModule,
      imports: [
        HttpModule.register({
          baseURL: options.baseUrl,
          headers: { Authorization: `Bearer ${options.apiKey}` },
        }),
      ],
      providers: [
        { provide: PERMIFY_MODULE_OPTIONS, useValue: options },
        PermissionService,
        SchemaService,
        DataService,
        BundleService,
        TenancyService,
        WatchService,
      ],
      exports: [
        PermissionService,
        SchemaService,
        DataService,
        BundleService,
        TenancyService,
        WatchService,
      ],
    };
  }
}
