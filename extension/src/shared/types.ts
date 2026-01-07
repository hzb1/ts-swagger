// ===== 基础 =====
export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'HEAD'

// ===== Request =====
export interface ProxyRequestMessage {
  type: 'PROXY_REQUEST' | 'PLUGIN_PING'
  requestId: string
  payload: RequestSpec
}

export interface RequestSpec {
  url: string
  method: HttpMethod
  headers?: Record<string, string>
  body?: RequestBody
  timeout?: number
}

export type RequestBody =
  | { type: 'json'; value: any }
  | { type: 'text'; value: string }
  | { type: 'form'; value: Record<string, string> }

// ===== Response =====
export interface ProxyResponseMessage {
  type: 'PROXY_RESPONSE'
  requestId: string
  result: ProxyResult
}

export type ProxyResult = ProxySuccess | ProxyFailure

export interface ProxySuccess {
  ok: true
  response: ResponseSpec
  timing: TimingInfo
}

export interface ProxyFailure {
  ok: false
  error: ErrorSpec
}

export interface ResponseSpec {
  url: string
  status: number
  statusText: string
  headers: Record<string, string>
  body: ResponseBody
}

export type ResponseBody =
  | { type: 'json'; value: any }
  | { type: 'text'; value: string }

export interface TimingInfo {
  startTime: number
  endTime: number
  duration: number
}

export interface ErrorSpec {
  type: 'NETWORK_ERROR' | 'TIMEOUT' | 'INVALID_URL' | 'UNKNOWN'
  message: string
}
