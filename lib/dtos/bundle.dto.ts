export interface OperationDto {
  relationships_write?: string[];
  relationships_delete?: string[];
  attributes_write?: string[];
  attributes_delete?: string[];
}

export class DataBundleDto {
  name: string;
  arguments: string[];
  operations: OperationDto[];
}

export class WriteBundleDto {
  tenant_id: string;
  bundles: DataBundleDto[];
}

export class WriteBundleResponse {
  success: boolean;
}

export class ReadBundleDto {
  tenant_id: string;
  name: string;
}

export class ReadBundleResponse {
  bundle: DataBundleDto;
}

export class DeleteBundleDto {
  tenant_id: string;
  name: string;
}

export class DeleteBundleResponse {
  success: boolean;
}

export class RunBundleDto {
  tenant_id: string;
  name: string;
  arguments: Record<string, string>;
}

export class RunBundleResponse {
  success: boolean;
} 