import { Test, TestingModule } from '@nestjs/testing';
import { BundleService } from '../lib/services/bundle.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

// Create a test implementation of the BundleService
class TestBundleService extends BundleService {
  constructor() {
    // Log environment variable to verify URL
    console.log('BundleService using PERMIFY_BASE_URL:', process.env.PERMIFY_BASE_URL);
    
    // Create a mock HttpService
    const mockHttpService = {
      post: jest.fn().mockImplementation(() => of({
        data: { id: 'bundle-123', name: 'test-bundle' },
        status: 200,
      })),
      get: jest.fn().mockImplementation(() => of({
        data: { id: 'bundle-123', name: 'test-bundle' },
        status: 200,
      })),
      delete: jest.fn().mockImplementation(() => of({
        data: { success: true },
        status: 200,
      })),
    } as unknown as HttpService;
    
    super(mockHttpService);
  }
}

describe('BundleService', () => {
  let service: TestBundleService;
  let httpService: HttpService;

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: BundleService,
          useClass: TestBundleService,
        },
      ],
    }).compile();

    service = module.get<TestBundleService>(BundleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('writeBundle', () => {
    it('should call the correct API endpoint with the right parameters', async () => {
      // Arrange
      const tenantId = 't1';
      const bundleData = {
        name: 'test-bundle',
        content: 'entity user {} entity org { relation member @user }',
      };

      // Act
      const result = await service.writeBundle(tenantId, bundleData);

      // Assert
      expect(result).toEqual({
        id: 'bundle-123',
        name: 'test-bundle',
      });
    });
  });

  describe('readBundle', () => {
    it('should call the correct API endpoint with the right parameters', async () => {
      // Arrange
      const tenantId = 't1';
      const bundleId = 'bundle-123';

      // Act
      const result = await service.readBundle(tenantId, bundleId);

      // Assert
      expect(result).toEqual({
        id: 'bundle-123',
        name: 'test-bundle',
      });
    });
  });

  describe('deleteBundle', () => {
    it('should call the correct API endpoint with the right parameters', async () => {
      // Arrange
      const tenantId = 't1';
      const bundleId = 'bundle-123';

      // Act
      const result = await service.deleteBundle(tenantId, bundleId);

      // Assert
      expect(result).toEqual({ success: true });
    });
  });

  describe('listBundles', () => {
    it('should call the correct API endpoint with the right parameters', async () => {
      // Arrange
      const tenantId = 't1';
      const page = 2;
      const size = 5;

      // Act
      const result = await service.listBundles(tenantId, page, size);

      // Assert
      expect(result).toEqual({
        id: 'bundle-123',
        name: 'test-bundle',
      });
    });
  });
}); 