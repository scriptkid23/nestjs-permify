import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { WriteSchemaDto, WriteSchemaResponse } from '../dtos/write-schema.dto';
import { 
  ReadSchemaDto, 
  ReadSchemaResponse,
  ListSchemaDto,
  ListSchemaResponse,
  PartialUpdateSchemaDto,
  PartialUpdateSchemaResponse,
  ValidateSchemaDto,
  ValidateSchemaResponse
} from '../dtos/schema.dto';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

/**
 * Service for managing schemas in Permify
 */
@Injectable()
export class SchemaService {
  private readonly logger = new Logger(SchemaService.name);

  constructor(private readonly httpService: HttpService) {
    // Log warning if HttpService is not available
    if (!httpService) {
      this.logger.warn('HttpService is not properly injected in SchemaService.');
    }
  }

  /**
   * Check if the HttpService is available
   * @throws Error if HttpService is not available
   */
  private checkHttpService() {
    if (!this.httpService) {
      throw new Error('HttpService is not available. Check your PermifyModule configuration.');
    }
  }

  /**
   * Handle HTTP errors with proper logging
   * @param error The error that occurred
   * @param operation The operation that was being performed
   * @param url The URL that was being accessed
   */
  private handleHttpError(error: any, operation: string, url: string): never {
    this.logger.error(`Error ${operation}: ${error.message}, URL: ${url}`);
    
    // Log additional information if available
    if (error.response) {
      this.logger.error(`Response status: ${error.response.status}, data: ${JSON.stringify(error.response.data)}`);
    }
    
    if (error.config) {
      this.logger.error(`Request config: ${JSON.stringify({
        url: error.config.url,
        baseURL: error.config.baseURL,
        method: error.config.method,
      })}`);
    }
    
    throw error;
  }

  /**
   * Write a schema to Permify
   * @see https://docs.permify.co/api-reference/schema/write-schema
   */
  async writeSchema(dto: WriteSchemaDto): Promise<WriteSchemaResponse> {
    this.checkHttpService();

    const url = `/v1/tenants/${dto.tenant_id}/schemas/write`;
    
    try {
      this.logger.debug(`Writing schema for tenant ${dto.tenant_id}`);
      const response = await firstValueFrom(this.httpService.post(url, dto));
      return response.data;
    } catch (error: any) {
      return this.handleHttpError(error, 'writing schema', url);
    }
  }

  /**
   * Read a schema from Permify
   * @see https://docs.permify.co/api-reference/schema/read-schema
   */
  async readSchema(dto: ReadSchemaDto): Promise<ReadSchemaResponse> {
    this.checkHttpService();

    const url = `/v1/tenants/${dto.tenant_id}/schemas/read`;
    const requestData = {
      metadata: {
        schema_version: dto.schema_version || ""
      }
    };
    
    try {
      this.logger.debug(`Reading schema for tenant ${dto.tenant_id}, version: ${dto.schema_version || 'latest'}`);
      const response = await firstValueFrom(this.httpService.post(url, requestData));
      return response.data;
    } catch (error: any) {
      return this.handleHttpError(error, 'reading schema', url);
    }
  }

  /**
   * List available schemas in Permify
   * @see https://docs.permify.co/api-reference/schema/list-schema
   */
  async listSchemas(dto: ListSchemaDto): Promise<ListSchemaResponse> {
    this.checkHttpService();

    const url = `/v1/tenants/${dto.tenant_id}/schemas/list`;
    const requestData = {
      page_size: dto.page_size || 20,
      continuous_token: dto.continuous_token || ""
    };
    
    try {
      this.logger.debug(`Listing schemas for tenant ${dto.tenant_id}`);
      const response = await firstValueFrom(this.httpService.post(url, requestData));
      return response.data;
    } catch (error: any) {
      return this.handleHttpError(error, 'listing schemas', url);
    }
  }

  /**
   * Perform a partial update on a schema
   * @see https://docs.permify.co/api-reference/schema/partial-write
   */
  async partialUpdate(dto: PartialUpdateSchemaDto): Promise<PartialUpdateSchemaResponse> {
    this.checkHttpService();

    const url = `/v1/tenants/${dto.tenant_id}/schemas/partial-write`;
    const requestData = {
      metadata: {
        schema_version: dto.schema_version || ""
      },
      entities: dto.entities
    };
    
    try {
      this.logger.debug(`Updating schema for tenant ${dto.tenant_id}, version: ${dto.schema_version || 'latest'}`);
      const response = await firstValueFrom(this.httpService.patch(url, requestData));
      return response.data;
    } catch (error: any) {
      return this.handleHttpError(error, 'updating schema', url);
    }
  }

  /**
   * Validate a schema before writing it
   */
  async validateSchema(dto: ValidateSchemaDto): Promise<ValidateSchemaResponse> {
    this.checkHttpService();

    const url = `/v1/tenants/${dto.tenant_id}/schemas/validate`;
    const requestData = {
      schema: dto.schema
    };
    
    try {
      this.logger.debug(`Validating schema for tenant ${dto.tenant_id}`);
      const response = await firstValueFrom(this.httpService.post(url, requestData));
      return response.data;
    } catch (error: any) {
      return this.handleHttpError(error, 'validating schema', url);
    }
  }
}
