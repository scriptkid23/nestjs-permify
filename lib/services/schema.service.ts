import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { WriteSchemaDto, WriteSchemaResponse } from '../dtos/write-schema.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SchemaService {
  constructor(private readonly httpService: HttpService) {}

  async writeSchema(dto: WriteSchemaDto): Promise<WriteSchemaResponse> {
    const url = `/v1/tenants/${dto.tenant_id}/schemas/write`;
    const response = await firstValueFrom(this.httpService.post(url, dto));
    return response.data as WriteSchemaResponse;
  }

  // Additional methods (listSchema, readSchema, etc.) would follow similar patterns
}
