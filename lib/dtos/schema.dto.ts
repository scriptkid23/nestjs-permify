// Schema service DTOs

/**
 * DTO for reading a schema
 */
export class ReadSchemaDto {
  /**
   * The tenant ID
   */
  tenant_id: string;

  /**
   * Optional schema version to read
   */
  schema_version?: string;
}

/**
 * Response for reading a schema
 */
export class ReadSchemaResponse {
  /**
   * The schema content
   */
  schema: {
    /**
     * Entity definitions in the schema
     */
    entityDefinitions?: Record<string, any>;
    
    /**
     * Rule definitions in the schema
     */
    ruleDefinitions?: Record<string, any>;
    
    /**
     * References in the schema
     */
    references?: Record<string, any>;
  };

  /**
   * The schema version
   */
  schema_version: string;
}

/**
 * DTO for listing schemas
 */
export class ListSchemaDto {
  /**
   * The tenant ID
   */
  tenant_id: string;

  /**
   * Optional page size
   */
  page_size?: number;

  /**
   * Optional continuous token for pagination
   */
  continuous_token?: string;
}

/**
 * Response for listing schemas
 */
export class ListSchemaResponse {
  /**
   * The head value
   */
  head: string;

  /**
   * List of schemas
   */
  schemas: Array<{
    /**
     * Schema version
     */
    version: string;

    /**
     * Creation timestamp
     */
    created_at: string;
  }>;

  /**
   * Optional continuous token for pagination
   */
  continuous_token?: string;
}

/**
 * DTO for partial schema update
 */
export class PartialUpdateSchemaDto {
  /**
   * The tenant ID
   */
  tenant_id: string;

  /**
   * Optional schema version
   */
  schema_version?: string;

  /**
   * Entities to modify
   */
  entities: {
    /**
     * Entities to write
     */
    write?: Record<string, any>;

    /**
     * Entities to delete
     */
    delete?: string[];

    /**
     * Entities to update
     */
    update?: Record<string, any>;
  };
}

/**
 * Response for partial schema update
 */
export class PartialUpdateSchemaResponse {
  /**
   * The new schema version
   */
  schema_version: string;
}

/**
 * DTO for schema validation
 */
export class ValidateSchemaDto {
  /**
   * The tenant ID
   */
  tenant_id: string;

  /**
   * The schema to validate
   */
  schema: string;
}

/**
 * Response for schema validation
 */
export class ValidateSchemaResponse {
  /**
   * Whether the schema is valid
   */
  is_valid: boolean;

  /**
   * Optional error message
   */
  error?: string;
} 