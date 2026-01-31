import { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

export type OperationObject =
  | OpenAPIV2.OperationObject
  | OpenAPIV3.OperationObject
  | OpenAPIV3_1.OperationObject;

/**
 * 接口详情模型
 */
export type ApiDetail = {
  key: string;
  path: string;
  method: string;
  operation?: OperationObject;
  matchType?: string;
};
