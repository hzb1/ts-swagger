import type { OperationObject } from "../../types.ts";

interface SlugParams {
  path: string;
  method: string;
  operation?: OperationObject;
}

/**
 * 核心逻辑：优先使用 operationId，其次是 path + method 的 hash
 */
export const getApiSlug = ({ path, method, operation }: SlugParams): string => {
  // 1. 优先级最高：开发者显式定义的 operationId
  if (operation?.operationId) {
    return operation.operationId;
  }

  // 2. 兜底方案：对 method + path 进行摘要处理
  // 统一转小写，避免因为大小写导致的 Hash 不一致
  const identifier = `${method.toLowerCase()}:${path.toLowerCase()}`;

  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash << 5) - hash + identifier.charCodeAt(i);
    hash |= 0; // 强制转为 32 位有符号整数
  }

  // 使用 16 进制并加前缀，确保符合 DOM ID 规范（不能数字开头）
  return `api-${Math.abs(hash).toString(16)}`;
};
