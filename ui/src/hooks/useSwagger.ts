import {useCallback, useMemo, useReducer, useRef, useState} from "react";
import type { OpenAPI } from "openapi-types";
import { request } from "../../../extension/src/shared/proxySdk.ts";
import type { ApiDetail } from "../../types.ts";
import { getApiSlug } from "../utils/getApiSlug.ts";
import {ProxyError} from "../../../extension/src/shared/types.ts";

/* -------------------------------------------------------------------------- */
/*                                   types                                    */
/* -------------------------------------------------------------------------- */

const swaggerConfigUrl = "/api-docs/swagger-config";

export type SwaggerLoadingStage = "idle" | "config" | "document";

type SwaggerConfig = {
  urls: { name: string; url: string }[];
};

type State = {
  config: SwaggerConfig | null;
  document: OpenAPI.Document | null;
  stage: SwaggerLoadingStage;
  error: string | null;
  firstLoad: boolean;
};

type Action =
  | { type: "RESET" }
  | { type: "LOAD_CONFIG" }
  | { type: "LOAD_DOCUMENT" }
  | { type: "CONFIG_SUCCESS"; payload: SwaggerConfig }
  | { type: "DOCUMENT_SUCCESS"; payload: OpenAPI.Document }
  | { type: "ERROR"; payload: string };

export type UseSwaggerOptions = {
  onConfigLoaded?: (config: SwaggerConfig) => void;
  onDocumentLoaded?: (doc: OpenAPI.Document) => void;
};

/* -------------------------------------------------------------------------- */
/*                                  reducer                                   */
/* -------------------------------------------------------------------------- */

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "RESET":
      return {
        config: null,
        document: null,
        stage: "idle",
        error: null,
        firstLoad: true,
      };
    case "LOAD_CONFIG":
      return { ...state, stage: "config", error: null };
    case "LOAD_DOCUMENT":
      return { ...state, stage: "document", error: null };
    case "CONFIG_SUCCESS":
      return { ...state, config: action.payload, stage: "idle" };
    case "DOCUMENT_SUCCESS":
      return {
        ...state,
        document: action.payload,
        stage: "idle",
        firstLoad: false,
      };
    case "ERROR":
      return { ...state, stage: "idle", error: action.payload };
    default:
      return state;
  }
}

/* -------------------------------------------------------------------------- */
/*                                utils                                       */
/* -------------------------------------------------------------------------- */

function normalizeBaseUrl(ip: string) {
  const v = ip.trim();
  if (!v) return "";
  return /^https?:\/\//.test(v) ? v : `http://${v}`;
}

/* -------------------------------------------------------------------------- */
/*                                   hook                                     */
/* -------------------------------------------------------------------------- */

export function useSwagger(options?: UseSwaggerOptions) {
  const [state, dispatch] = useReducer(reducer, {
    config: null,
    document: null,
    stage: "idle",
    error: null,
    firstLoad: true,
  });

  /* --------------------------- concurrency guard --------------------------- */

  const requestIdRef = useRef(0);
  const nextRequestId = () => ++requestIdRef.current;

  /* ------------------------------ search state ----------------------------- */

  const [searchQuery, setSearchQuery] = useState("");

  /* ------------------------------- core api -------------------------------- */

  const loadSwagger = useCallback( async (params: {
    ip: string;
    version?: string;
    serviceUrl?: string;
  }) => {
    const { ip, version = "v3", serviceUrl } = params;
    const baseUrl = normalizeBaseUrl(ip);
    if (!baseUrl) return;

    const rid = nextRequestId();
    dispatch({ type: "RESET" });

    try {
      dispatch({ type: "LOAD_CONFIG" });
      const configUrl = `${baseUrl}/${version}${swaggerConfigUrl}`;
      const res = await request(configUrl)
      if (!res.ok) {
        throw new Error(`Load swagger config failed: ${res.status}`);
      }
      const config = (await res.json()) as SwaggerConfig;
      if (rid !== requestIdRef.current) return;

      dispatch({ type: "CONFIG_SUCCESS", payload: config });
      options?.onConfigLoaded?.(config);

      const finalServiceUrl =
        serviceUrl ?? config.urls?.[0]?.url ?? "";

      if (!finalServiceUrl) return;

      dispatch({ type: "LOAD_DOCUMENT" });
      const docUrl = `${baseUrl}${finalServiceUrl}`;
      const doc = (await request(docUrl).then((r) =>
        r.json(),
      )) as OpenAPI.Document;

      if (rid !== requestIdRef.current) return;

      dispatch({ type: "DOCUMENT_SUCCESS", payload: doc });
      options?.onDocumentLoaded?.(doc);
    } catch (err) {
      if (rid === requestIdRef.current) {
        // 优雅地处理 TypeError: Failed to fetch
        // if (error && error?.name === 'TypeError' && error?.message === 'Failed to fetch') {
        //   console.error('网络不可达或跨域拦截');
        //   // 这里可以返回一个自定义的错误对象，方便前端 UI 展示
        //   dispatch({ type: "ERROR", payload: "无法连接到目标服务器" });
        // } else {
        //   dispatch({ type: "ERROR", payload: "Swagger 加载失败" });
        // }
        let msg: string;
        if (err instanceof ProxyError) {
          // 处理插件定义的特定错误
          switch (err.type) {
            case 'NETWORK_ERROR':
              msg = ('网络连接失败，请检查插件状态');
              break;
            case 'TIMEOUT':
              msg = ('请求超时，请稍后重试');
              break;
            case 'INVALID_URL':
              msg = ('配置的 URL 格式有误');
              break;
            default:
              msg = (`未知错误: ${err.message}`);
          }
          dispatch({ type: "ERROR", payload: msg })
        } else {
          // 处理原生 fetch 或其他代码运行错误
          console.error('Native Error:', err);
          dispatch({ type: "ERROR", payload: "Swagger 加载失败" })
        }
      }
    }
  }, [options]);

  /* ------------------------------- searching -------------------------------- */

  const filteredGroupedApis = useMemo(() => {
    if (!state.document?.paths) return {};

    const query = searchQuery.trim().toLowerCase();
    // if (!query) return {};

    const groups: Record<string, ApiDetail[]> = {};
    console.log('xxx', {
      groups,
      state,
      searchQuery,
    })

    for (const [path, item] of Object.entries(state.document.paths)) {
      for (const method of ["get", "post", "put", "delete", "patch"] as const) {
        const op = item[method];
        if (!op) continue;

        let matchType = "";
        if (path.toLowerCase().includes(query)) matchType = "路径";
        else if (op.summary?.toLowerCase().includes(query)) matchType = "名称";
        else if (op.operationId?.toLowerCase().includes(query)) matchType = "ID";
        else continue;

        const tag = op.tags?.[0] ?? "Default";
        (groups[tag] ||= []).push({
          key: getApiSlug({ path, method, operation: op }),
          path,
          method,
          matchType,
          operation: op,
        });
      }
    }

    return groups;
  }, [state, searchQuery]);

  /* ------------------------------- public api ------------------------------- */

  return {
    // data
    configData: state.config,
    documentData: state.document,
    filteredGroupedApis,

    // state
    stage: state.stage,
    error: state.error,
    firstLoadDocument: state.firstLoad,

    // search
    searchQuery,
    setSearchQuery,

    // actions
    loadSwagger,
  };
}
