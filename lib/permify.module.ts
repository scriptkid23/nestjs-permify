import { DynamicModule, Module, Logger } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { PermifyModuleOptions } from './interfaces/permify-options.interface';
import { PERMIFY_MODULE_OPTIONS } from './constants/permify.constants';
import { PermissionService } from './services/permission.service';
import { SchemaService } from './services/schema.service';
import { DataService } from './services/data.service';
import { BundleService } from './services/bundle.service';
import { TenancyService } from './services/tenancy.service';
import { WatchService } from './services/watch.service';
import { firstValueFrom } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Module({})
export class PermifyModule {
  private static readonly logger = new Logger('PermifyModule');

  static forRoot(options: PermifyModuleOptions): DynamicModule {
    const healthCheckProvider = {
      provide: 'PERMIFY_HEALTH_CHECK',
      useFactory: async (httpService: HttpService) => {
        if (options.skipHealthCheck) {
          PermifyModule.logger.log('Permify health check skipped based on configuration');
          return true;
        }

        try {
          const healthEndpoint = '/healthz';
          PermifyModule.logger.log(`Checking Permify server health at ${options.baseUrl}${healthEndpoint}`);
          
          const response = await firstValueFrom(
            httpService.get(healthEndpoint).pipe(
              timeout(5000),
              catchError((error) => {
                const message = `Failed to connect to Permify server: ${error.message}`;
                PermifyModule.logger.error(message);
                throw new Error(message);
              })
            )
          );
          
          // Check for the specific response format
          if (!response.data || response.data.status !== 'SERVING') {
            const message = `Permify server is not ready. Expected {"status":"SERVING"}, got: ${JSON.stringify(response.data)}`;
            PermifyModule.logger.error(message);
            throw new Error(message);
          }
          
          PermifyModule.logger.log('Successfully connected to Permify server');
          return true;
        } catch (error) {
          throw error;
        }
      },
      inject: [HttpService],
    };

    // Configure HTTP headers with optional API key
    const httpConfig: any = {
      baseURL: options.baseUrl,
    };
    
    if (options.apiKey) {
      httpConfig.headers = { Authorization: `Bearer ${options.apiKey}` };
    }

    return {
      module: PermifyModule,
      imports: [
        HttpModule.register(httpConfig),
      ],
      providers: [
        { provide: PERMIFY_MODULE_OPTIONS, useValue: options },
        healthCheckProvider,
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
