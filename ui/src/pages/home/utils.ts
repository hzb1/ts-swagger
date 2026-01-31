import type { ApiDetail } from "../../../types.ts";

interface SwaggerParameter {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  required: boolean;
  schema?: { type: string };
}

export interface SwaggerApi {
  path: string;
  method: string;
  summary?: string;
  parameters?: SwaggerParameter[];
  requestBody?: never;
}

export type ApiGroup = {
  name: string;
  children: ApiDetail[];
};
