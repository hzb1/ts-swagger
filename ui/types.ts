import type {OpenAPI} from "openapi-types";

export type OperationObject = OpenAPI.Operation;

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
