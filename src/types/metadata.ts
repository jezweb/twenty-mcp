export interface ObjectMetadata {
  id: string;
  nameSingular: string;
  namePlural: string;
  labelSingular: string;
  labelPlural: string;
  description?: string;
  icon?: string;
  isCustom: boolean;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  fields: FieldMetadata[];
}

export interface FieldMetadata {
  id: string;
  name: string;
  label: string;
  description?: string;
  type: FieldType;
  isCustom: boolean;
  isActive: boolean;
  isNullable: boolean;
  isSystem: boolean;
  defaultValue?: any;
  options?: FieldOption[];
  settings?: FieldSettings;
  createdAt: string;
  updatedAt: string;
}

export type FieldType = 
  | 'UUID'
  | 'TEXT'
  | 'PHONE'
  | 'EMAIL'
  | 'DATE_TIME'
  | 'DATE'
  | 'BOOLEAN'
  | 'NUMBER'
  | 'CURRENCY'
  | 'FULL_NAME'
  | 'LINK'
  | 'LINKS'
  | 'ADDRESS'
  | 'RATING'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'RELATION'
  | 'RICH_TEXT'
  | 'POSITION'
  | 'RAW_JSON';

export interface FieldOption {
  id: string;
  value: string;
  label: string;
  color?: string;
  position: number;
}

export interface FieldSettings {
  displayedAs?: string;
  precision?: number;
  scale?: number;
  relationObjectMetadataId?: string;
  relationFieldMetadataId?: string;
}

export interface ObjectSchema {
  object: ObjectMetadata;
  fields: FieldMetadata[];
  relationships: RelationshipMetadata[];
}

export interface RelationshipMetadata {
  id: string;
  fromObjectMetadataId: string;
  toObjectMetadataId: string;
  fromFieldMetadataId: string;
  toFieldMetadataId: string;
  relationType: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';
}

export interface MetadataQueryOptions {
  includeCustom?: boolean;
  includeSystem?: boolean;
  activeOnly?: boolean;
}

export interface ObjectSummary {
  standard: ObjectMetadata[];
  custom: ObjectMetadata[];
  system: ObjectMetadata[];
  totalCount: number;
  customCount: number;
  standardCount: number;
  systemCount: number;
}

export interface FieldQueryOptions {
  objectId?: string;
  objectName?: string;
  includeCustom?: boolean;
  includeSystem?: boolean;
  fieldType?: FieldType;
  activeOnly?: boolean;
}