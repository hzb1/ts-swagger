import type { OperationObject } from "../../types.ts";

export const stableHash = (input: string): string => {
  let hash = 0;

  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash).toString(16);
};

interface SlugParams {
  path: string;
  method: string;
  operation?: OperationObject;
}

/**
 * 核心逻辑：优先使用 operationId，其次是 path + method 的 hash
 */
export const getApiSlug = ({ path, method, operation }: SlugParams): string => {
  if (operation?.operationId) {
    return operation.operationId;
  }

  const identifier = `${method.toLowerCase()}:${path.toLowerCase()}`;
  return `api-${stableHash(identifier)}`;
};
