export interface OpenAPISchema {
  openapi?: string;
  swagger?: string;
  info: { title: string; version: string; description?: string };
  paths: Record<string, PathItem>;
  components?: { schemas?: Record<string, SchemaObject> };
  tags?: { name: string; description?: string }[];
  servers?: { url: string; description?: string }[];
}

export interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  delete?: Operation;
  patch?: Operation;
  parameters?: Parameter[];
}

export interface Operation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses?: Record<string, Response>;
}

export interface Parameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  required?: boolean;
  description?: string;
  schema?: SchemaObject;
}

export interface RequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, MediaType>;
}

export interface MediaType {
  schema?: SchemaObject;
  example?: unknown;
}

export interface Response {
  description?: string;
  content?: Record<string, MediaType>;
}

export interface SchemaObject {
  type?: string;
  format?: string;
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  $ref?: string;
  enum?: unknown[];
  example?: unknown;
  required?: string[];
  description?: string;
}

export interface ExecState {
  params: Record<string, string>;
  body: string;
  file: File | null;
  loading: boolean;
  response: { status: number; statusText: string; body: unknown; time: number } | null;
}

export const methodColors: Record<string, string> = {
  get: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  post: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  put: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  patch: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  delete: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
};

export const getExample = (operation: Operation): unknown => {
  const content = operation.requestBody?.content;
  const types = ['application/json', 'multipart/form-data', 'application/x-www-form-urlencoded'];
  for (const type of types) {
    const body = content?.[type];
    if (body?.example) return body.example;
    if (body?.schema?.example) return body.schema.example;
    if (body?.schema?.properties) {
      const obj: Record<string, unknown> = {};
      Object.entries(body.schema.properties).forEach(([key, prop]) => {
        if (prop.example) obj[key] = prop.example;
        else if (prop.enum?.length) obj[key] = prop.enum[0];
        else if (prop.type === 'integer') obj[key] = 0;
        else if (prop.type === 'boolean') obj[key] = false;
        else if (prop.type === 'array') obj[key] = [];
        else obj[key] = '';
      });
      return obj;
    }
  }
  return {};
};