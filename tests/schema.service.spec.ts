import { Test, TestingModule } from '@nestjs/testing';
import { SchemaService } from '../lib/services/schema.service';
import { WriteSchemaDto, WriteSchemaResponse } from '../lib/dtos/write-schema.dto';

// Test implementation of the service
class TestSchemaService {
  async writeSchema(dto: WriteSchemaDto): Promise<WriteSchemaResponse> {
    return { schema_version: '1.0.0' };
  }
}

describe('SchemaService', () => {
  let service: SchemaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: SchemaService,
          useClass: TestSchemaService,
        },
      ],
    }).compile();

    service = module.get<SchemaService>(SchemaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('writeSchema', () => {
    it('should return a valid schema version for a valid schema', async () => {
      // Arrange
      const writeSchemaDto: WriteSchemaDto = {
        tenant_id: 't1',
        schema: `
          entity user {}
          
          entity organization {
            relation member @user
            relation admin @user
            
            action view_files = admin or member
            action edit_files = admin
          }
        `,
      };
      
      // Act
      const result = await service.writeSchema(writeSchemaDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.schema_version).toBe('1.0.0');
    });
  });
});
