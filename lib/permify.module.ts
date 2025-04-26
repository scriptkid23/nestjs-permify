import { DynamicModule, Module, Logger, Provider } from '@nestjs/common';
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

/**
 * NestJS module for integrating with Permify authorization service
 * Provides services for schema management, permission checking, relationship management, etc.
 */
@Module({})
export class PermifyModule {
  private static readonly logger = new Logger('PermifyModule');
  private static readonly services = [
    SchemaService,
    PermissionService,
    DataService,
    BundleService,
    TenancyService,
    WatchService,
  ];

  /**
   * Register the module with static configuration
   * @param options Configuration options for Permify
   * @returns DynamicModule configuration
   */
  static forRoot(options: PermifyModuleOptions): DynamicModule {
    // Normalize URL to prevent double slashes
    if (options.baseUrl && options.baseUrl.endsWith('/')) {
      options.baseUrl = options.baseUrl.slice(0, -1);
    }

    // Configure HTTP headers with optional API key
    const httpConfig: any = {
      baseURL: options.baseUrl,
    };
    
    if (options.apiKey) {
      httpConfig.headers = { Authorization: `Bearer ${options.apiKey}` };
    }

    // Create service factory providers
    const serviceProviders = this.createServiceProviders();

    return {
      module: PermifyModule,
      imports: [
        HttpModule.register(httpConfig),
      ],
      providers: [
        { provide: PERMIFY_MODULE_OPTIONS, useValue: options },
        this.createHealthCheckProvider(options),
        ...serviceProviders,
      ],
      exports: this.services,
    };
  }

  /**
   * Register the module with async configuration
   * @param options Async configuration options for Permify
   * @returns DynamicModule configuration
   */
  static forRootAsync(options: any): DynamicModule {
    // Create service factory providers
    const serviceProviders = this.createServiceProviders();

    return {
      module: PermifyModule,
      imports: [
        ...(options.imports || []),
        HttpModule.registerAsync({
          imports: options.imports || [],
          inject: options.inject || [],
          useFactory: async (...args: any[]) => {
            const moduleOptions = await options.useFactory(...args);
            
            // Normalize URL to prevent double slashes
            if (moduleOptions.baseUrl && moduleOptions.baseUrl.endsWith('/')) {
              moduleOptions.baseUrl = moduleOptions.baseUrl.slice(0, -1);
            }
            
            this.logger.log(`Configuring Permify with baseUrl: ${moduleOptions.baseUrl}`);
            
            // Configure HTTP headers with optional API key
            const httpConfig: any = {
              baseURL: moduleOptions.baseUrl,
            };
            
            if (moduleOptions.apiKey) {
              httpConfig.headers = { Authorization: `Bearer ${moduleOptions.apiKey}` };
            }
            
            return httpConfig;
          },
        }),
      ],
      providers: [
        {
          provide: PERMIFY_MODULE_OPTIONS,
          useFactory: async (...args: any[]) => {
            const moduleOptions = await options.useFactory(...args);
            
            // Normalize URL to prevent double slashes
            if (moduleOptions.baseUrl && moduleOptions.baseUrl.endsWith('/')) {
              moduleOptions.baseUrl = moduleOptions.baseUrl.slice(0, -1);
            }
            
            return moduleOptions;
          },
          inject: options.inject || [],
        },
        this.createAsyncHealthCheckProvider(),
        ...serviceProviders,
      ],
      exports: this.services,
    };
  }

  /**
   * Create service provider factories
   * @returns Array of service providers
   */
  private static createServiceProviders(): Provider[] {
    return this.services.map(service => ({
      provide: service,
      useFactory: (httpService: HttpService) => new service(httpService),
      inject: [HttpService],
    }));
  }

  /**
   * Create the health check provider for static configuration
   * @param options Module options
   * @returns Provider for health check
   */
  private static createHealthCheckProvider(options: PermifyModuleOptions): Provider {
    return {
      provide: 'PERMIFY_HEALTH_CHECK',
      useFactory: async (httpService: HttpService) => {
        if (options.skipHealthCheck) {
          this.logger.log('Permify health check skipped based on configuration');
          return true;
        }

        return this.performHealthCheck(httpService, options.baseUrl);
      },
      inject: [HttpService],
    };
  }

  /**
   * Create the health check provider for async configuration
   * @returns Provider for health check
   */
  private static createAsyncHealthCheckProvider(): Provider {
    return {
      provide: 'PERMIFY_HEALTH_CHECK',
      useFactory: async (httpService: HttpService, moduleOptions: PermifyModuleOptions) => {
        if (moduleOptions.skipHealthCheck) {
          this.logger.log('Permify health check skipped based on configuration');
          return true;
        }

        return this.performHealthCheck(httpService, moduleOptions.baseUrl);
      },
      inject: [HttpService, PERMIFY_MODULE_OPTIONS],
    };
  }

  /**
   * Perform the health check
   * @param httpService The HTTP service to use
   * @param baseUrl The base URL of the Permify server
   * @returns true if the server is healthy
   */
  private static async performHealthCheck(httpService: HttpService, baseUrl: string): Promise<boolean> {
    try {
      const healthEndpoint = '/healthz';
      this.logger.log(`Checking Permify server health at ${baseUrl}${healthEndpoint}`);
      
      const response = await firstValueFrom(
        httpService.get(healthEndpoint).pipe(
          timeout(5000),
          catchError((error) => {
            const message = `Failed to connect to Permify server: ${error.message}`;
            this.logger.error(message);
            throw new Error(message);
          })
        )
      );
      
      // Check for the specific response format
      if (!response.data || response.data.status !== 'SERVING') {
        const message = `Permify server is not ready. Expected {"status":"SERVING"}, got: ${JSON.stringify(response.data)}`;
        this.logger.error(message);
        throw new Error(message);
      }
      
      this.logger.log('Successfully connected to Permify server');
      return true;
    } catch (error) {
      throw error;
    }
  }
}
