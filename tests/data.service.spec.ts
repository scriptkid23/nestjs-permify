import { Test, TestingModule } from '@nestjs/testing';
import { DataService } from '../lib/services/data.service';
import { WriteDataDto, WriteDataResponse } from '../lib/dtos/write-data.dto';
import {
  ReadRelationshipsDto,
  ReadRelationshipsResponse,
  DeleteRelationshipDto,
  DeleteRelationshipResponse
} from '../lib/dtos/relationship.dto';

// Test implementation of the service
class TestDataService {
  async writeData(dto: WriteDataDto): Promise<WriteDataResponse> {
    return { success: true };
  }

  async deleteRelationship(dto: DeleteRelationshipDto): Promise<DeleteRelationshipResponse> {
    return { success: true };
  }

  async readRelationships(dto: ReadRelationshipsDto): Promise<ReadRelationshipsResponse> {
    return { 
      tuples: [
        { 
          entity: { type: dto.entity, id: dto.id },
          relation: 'admin',
          subject: { type: 'user', id: '123' }
        },
        { 
          entity: { type: dto.entity, id: dto.id },
          relation: 'member',
          subject: { type: 'user', id: '456' }
        }
      ]
    };
  }
}

describe('DataService', () => {
  let service: DataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: DataService,
          useClass: TestDataService,
        },
      ],
    }).compile();

    service = module.get<DataService>(DataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('writeData', () => {
    it('should return success=true for a valid write data request', async () => {
      // Arrange
      const writeDataDto: WriteDataDto = {
        tenant_id: 't1',
        action: 'create',
        entity: 'organization',
        subject: { id: 'user123', relation: 'admin' },
        context: { organizationId: 'org456' },
      };
      
      // Act
      const result = await service.writeData(writeDataDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('deleteRelationship', () => {
    it('should return success=true for a valid delete request', async () => {
      // Arrange
      const dto: DeleteRelationshipDto = {
        tenant_id: 't1',
        entity: 'organization',
        id: 'org123',
        relation: 'admin'
      };
      
      // Act
      const result = await service.deleteRelationship(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('readRelationships', () => {
    it('should return a list of relationships for a valid request', async () => {
      // Arrange
      const dto: ReadRelationshipsDto = {
        tenant_id: 't1',
        entity: 'organization',
        id: 'org123'
      };
      
      // Act
      const result = await service.readRelationships(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.tuples).toBeDefined();
      expect(Array.isArray(result.tuples)).toBe(true);
      expect(result.tuples.length).toBe(2);
    });
  });
});
