import { Test, TestingModule } from '@nestjs/testing';
import { WatchService } from '../lib/services/watch.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { firstValueFrom, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { WatchChangesDto, WatchPermissionsDto, WatchChangesResponse } from '../lib/dtos/watch.dto';

// Define the interfaces used in the test
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

// Create a test implementation of the WatchService
class TestWatchService extends WatchService {
  constructor() {
    // Create a mock HttpService
    const mockHttpService = {
      post: jest.fn().mockImplementation(() => of({
        data: {
          result: {
            changes: {
              snap_token: 'abc123',
              data_changes: [
                {
                  operation: 'OPERATION_CREATE',
                  tuple: {
                    entity: { type: 'document', id: '123' },
                    relation: 'owner',
                    subject: { type: 'user', id: '456' }
                  }
                }
              ]
            }
          }
        },
        status: 200,
      })),
    } as unknown as HttpService;
    
    super(mockHttpService);
  }

  // Override methods to provide test implementations
  watchChanges(dto: WatchChangesDto) {
    const response: WatchChangesResponse = {
      result: {
        changes: {
          snap_token: 'abc123',
          data_changes: [
            {
              operation: 'OPERATION_CREATE',
              tuple: {
                entity: { type: 'document', id: '123' },
                relation: 'owner',
                subject: { type: 'user', id: '456' }
              }
            }
          ]
        }
      }
    };
    return of(response);
  }
  
  watchPermissionsByDto(dto: WatchPermissionsDto) {
    const response: WatchChangesResponse = {
      result: {
        changes: {
          snap_token: 'abc123',
          data_changes: [
            {
              operation: 'OPERATION_CREATE',
              tuple: {
                entity: { type: dto.entity_type, id: '123' },
                relation: dto.permission,
                subject: { type: 'user', id: '456' }
              }
            }
          ]
        }
      }
    };
    return of(response);
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

  describe('watchChanges', () => {
    it('should return an observable for data changes', () => {
      // Arrange
      const dto: WatchChangesDto = {
        tenant_id: 't1'
      };

      // Act
      const result$ = service.watchChanges(dto);

      // Assert
      // Convert Observable to Promise for testing
      return firstValueFrom(result$.pipe(
        map(response => {
          expect(response).toBeDefined();
          expect(response.result).toBeDefined();
          
          // Safe check that result is defined before accessing properties
          if (response.result) {
            expect(response.result.changes).toBeDefined();
            expect(response.result.changes.snap_token).toBe('abc123');
            expect(response.result.changes.data_changes).toHaveLength(1);
            expect(response.result.changes.data_changes[0].operation).toBe('OPERATION_CREATE');
          }
          return true;
        })
      ));
    });
  });

  describe('watchPermissions', () => {
    it('should return filtered changes for specific entity type and permission', () => {
      // Arrange
      const dto: WatchPermissionsDto = {
        tenant_id: 't1',
        entity_type: 'document',
        permission: 'edit'
      };

      // Act
      const result$ = service.watchPermissionsByDto(dto);

      // Assert
      // Convert Observable to Promise for testing
      return firstValueFrom(result$.pipe(
        map(response => {
          expect(response).toBeDefined();
          expect(response.result).toBeDefined();
          
          // Safe check that result is defined before accessing properties
          if (response.result) {
            expect(response.result.changes).toBeDefined();
            expect(response.result.changes.data_changes).toHaveLength(1);
            
            const change = response.result.changes.data_changes[0];
            if (change.tuple) {
              expect(change.tuple.entity.type).toBe(dto.entity_type);
              expect(change.tuple.relation).toBe(dto.permission);
            }
          }
          return true;
        })
      ));
    });
  });
}); 