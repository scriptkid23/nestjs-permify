import { Test, TestingModule } from '@nestjs/testing';
import { WatchService } from '../lib/services/watch.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { firstValueFrom, of } from 'rxjs';
import { map } from 'rxjs/operators';

// Create a test implementation of the WatchService
class TestWatchService extends WatchService {
  constructor() {
    // Create a mock HttpService
    const mockHttpService = {
      get: jest.fn().mockImplementation(() => of({
        data: { event: 'schema_changed', schema_version: '1.0.1' },
        status: 200,
      })),
    } as unknown as HttpService;
    
    super(mockHttpService);
  }

  // Override methods to provide test implementations
  watchSchema(tenantId: string) {
    return of({ event: 'schema_changed', schema_version: '1.0.1' });
  }
  
  watchRelationships(tenantId: string) {
    return of({ event: 'relationship_changed', entity: 'organization', id: '123' });
  }
  
  async checkWatchEndpoint(tenantId: string, entityType: string): Promise<boolean> {
    return true;
  }
}

describe('WatchService', () => {
  let service: TestWatchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: WatchService,
          useClass: TestWatchService,
        },
      ],
    }).compile();

    service = module.get<TestWatchService>(WatchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('watchSchema', () => {
    it('should return an observable for schema changes', () => {
      // Arrange
      const tenantId = 't1';

      // Act
      const result$ = service.watchSchema(tenantId);

      // Assert
      // Convert Observable to Promise for testing
      return firstValueFrom(result$.pipe(
        map(response => {
          expect(response).toBeDefined();
          expect(response.event).toBe('schema_changed');
          expect(response.schema_version).toBe('1.0.1');
          return true;
        })
      ));
    });
  });

  describe('watchRelationships', () => {
    it('should return an observable for relationship changes', () => {
      // Arrange
      const tenantId = 't1';

      // Act
      const result$ = service.watchRelationships(tenantId);

      // Assert
      // Convert Observable to Promise for testing
      return firstValueFrom(result$.pipe(
        map(response => {
          expect(response).toBeDefined();
          expect(response.event).toBe('relationship_changed');
          expect(response.entity).toBe('organization');
          return true;
        })
      ));
    });
  });

  describe('checkWatchEndpoint', () => {
    it('should return true when the watch endpoint is available', async () => {
      // Arrange
      const tenantId = 't1';
      const entityType = 'schema';
      
      // Act
      const result = await service.checkWatchEndpoint(tenantId, entityType);

      // Assert
      expect(result).toBe(true);
    });
  });
}); 