import type {
  ColumnSqlRequest,
  CreateTableSqlRequest,
  HeaderDetailDto,
  HeaderListItemDto,
  HeaderSearchQuery,
  ProgramUsageDto,
  SchemaCompareRequest,
  SchemaCompareResult,
  SqlTextResult,
  ApiErrorBody,
} from '../types/dtos';

const BASE_URL = 'http://localhost:5230';

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string[]>;

  constructor(status: number, message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let body: ApiErrorBody = {};
    try {
      body = await res.json();
    } catch {
      // response had no JSON body
    }
    const message = body.message ?? body.title ?? `請求失敗（HTTP ${res.status}）`;
    throw new ApiError(res.status, message, body.errors);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

function buildQuery(query: HeaderSearchQuery): string {
  const params = new URLSearchParams();
  if (query.dbName) params.set('dbName', query.dbName);
  if (query.objectName) params.set('objectName', query.objectName);
  if (query.columnName) params.set('columnName', query.columnName);
  if (query.keyword) params.set('keyword', query.keyword);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const headersApi = {
  search: (query: HeaderSearchQuery) =>
    request<HeaderListItemDto[]>(`/api/headers${buildQuery(query)}`),

  getById: (id: number) => request<HeaderDetailDto>(`/api/headers/${id}`),

  create: (header: HeaderDetailDto) =>
    request<HeaderDetailDto>('/api/headers', {
      method: 'POST',
      body: JSON.stringify(header),
    }),

  update: (id: number, header: HeaderDetailDto) =>
    request<HeaderDetailDto>(`/api/headers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(header),
    }),

  remove: (id: number) =>
    request<void>(`/api/headers/${id}`, { method: 'DELETE' }),
};

export const programUsageApi = {
  getAll: (headerId: number) =>
    request<ProgramUsageDto[]>(`/api/headers/${headerId}/program-usage`),

  replaceAll: (headerId: number, items: ProgramUsageDto[]) =>
    request<ProgramUsageDto[]>(`/api/headers/${headerId}/program-usage`, {
      method: 'POST',
      body: JSON.stringify(items),
    }),
};

export const sqlApi = {
  createTable: (req: CreateTableSqlRequest) =>
    request<SqlTextResult>('/api/sql/create-table', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  addColumn: (req: ColumnSqlRequest) =>
    request<SqlTextResult>('/api/sql/column/add', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  dropColumn: (req: ColumnSqlRequest) =>
    request<SqlTextResult>('/api/sql/column/drop', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  alterColumn: (req: ColumnSqlRequest) =>
    request<SqlTextResult>('/api/sql/column/alter', {
      method: 'POST',
      body: JSON.stringify(req),
    }),
};

export const schemaApi = {
  compare: (req: SchemaCompareRequest) =>
    request<SchemaCompareResult>('/api/schema/compare', {
      method: 'POST',
      body: JSON.stringify(req),
    }),
};
