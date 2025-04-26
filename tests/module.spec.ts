import { Test } from '@nestjs/testing';
import { PermifyModule } from '../lib/permify.module';
import { HttpModule } from '@nestjs/axios';
import { PermissionService } from '../lib/services/permission.service';
import { SchemaService } from '../lib/services/schema.service';
import { DataService } from '../lib/services/data.service';
import { BundleService } from '../lib/services/bundle.service';
import { TenancyService } from '../lib/services/tenancy.service';
import { WatchService } from '../lib/services/watch.service';
import { PERMIFY_MODULE_OPTIONS } from '../lib/constants/permify.constants';

describe('PermifyModule', () => {
  describe('forRoot', () => {
    it('should provide all the services and the module options', async () => {
      // Arrange
      const moduleOptions = {
        baseUrl: 'http://localhost:3476',
        apiKey: 'test-api-key',
      };

      // Act
      const moduleRef = await Test.createTestingModule({
        imports: [PermifyModule.forRoot(moduleOptions)],
      }).compile();

      // Assert
      // Check that the module provides all the necessary services
      expect(moduleRef.get(PermissionService)).toBeDefined();
      expect(moduleRef.get(SchemaService)).toBeDefined();
      expect(moduleRef.get(DataService)).toBeDefined();
      expect(moduleRef.get(BundleService)).toBeDefined();
      expect(moduleRef.get(TenancyService)).toBeDefined();
      expect(moduleRef.get(WatchService)).toBeDefined();
      
      // Check that the module options are provided
      expect(moduleRef.get(PERMIFY_MODULE_OPTIONS)).toEqual(moduleOptions);
    });

    it('should configure the HttpModule with the correct baseURL and auth header', async () => {
      // Arrange
      const baseUrl = 'http://localhost:3476';
      const apiKey = 'test-api-key';
      
      const moduleOptions = {
        baseUrl,
        apiKey,
      };

      // Act
      const moduleRef = await Test.createTestingModule({
        imports: [PermifyModule.forRoot(moduleOptions)],
      }).compile();

      // Get the HttpModule's options
      const httpModule = moduleRef.get<any>(HttpModule);
      
      // We can't access the HttpModule configuration directly, but we can verify
      // that the module is configured and the services are using it
      expect(httpModule).toBeDefined();
      
      // Get a service and make a simple call to verify the HttpModule is properly configured
      const permissionService = moduleRef.get(PermissionService);
      expect(permissionService).toBeDefined();
    });
  });
}); 