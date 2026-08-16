export const OBJECT_TYPES = ['Table', 'View', 'Function', 'StoredProcedure'] as const;

export interface ColumnDto {
  columnId: number;
  sequence: number;
  columnName: string;
  columnDescription: string | null;
  dataType: string;
  isNullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  isIdentity: boolean;
  paramDirection: 'IN' | 'OUT' | null;
  remark: string | null;
}

export interface HeaderDetailDto {
  headerId: number;
  databaseName: string;
  databaseHost: string;
  objectType: string;
  objectName: string;
  tableDescription: string | null;
  otherDescription: string | null;
  remark: string | null;
  connPort: string | null;
  connAccount: string | null;
  connPassword: string | null;
  useWindowsAuth: boolean;
  columns: ColumnDto[];
}

export interface HeaderListItemDto {
  headerId: number;
  databaseHost: string;
  databaseName: string;
  objectType: string;
  objectName: string;
  tableDescription: string | null;
  otherDescription: string | null;
}

export interface HeaderSearchQuery {
  dbName?: string;
  objectName?: string;
  columnName?: string;
  keyword?: string;
}

export interface ProgramUsageDto {
  seqNo: number;
  programName: string;
  description: string | null;
}

export interface CreateTableSqlRequest {
  objectName: string;
  columns: ColumnDto[];
}

export interface ColumnSqlRequest {
  objectName: string;
  column: ColumnDto;
}

export interface SqlTextResult {
  sql: string;
}

export interface SchemaCompareRequest {
  databaseHost: string;
  databaseName: string;
  objectName: string;
  connPort: string | null;
  connAccount: string | null;
  connPassword: string | null;
  useWindowsAuth: boolean;
}

export interface ActualColumnDto {
  sequence: number;
  columnName: string;
  dataType: string;
  isNullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  isIdentity: boolean;
}

export interface SchemaCompareResult {
  columns: ActualColumnDto[];
}

export interface ApiErrorBody {
  message?: string;
  title?: string;
  errors?: Record<string, string[]>;
}
