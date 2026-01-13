import type {
  ProxyRequestMessage,
  ProxyResponseMessage,
  RequestSpec,
} from '../extension/src/shared/types'

/* ----------------------------------
 * 内部状态
 * ---------------------------------- */

let pluginEnabled: boolean | null = null
let pluginChecking: Promise<boolean> | null = null

/* ----------------------------------
 * 工具函数
 * ---------------------------------- */

function genRequestId() {
  return 'req_' + Date.now() + '_' + Math.random().toString(16).slice(2)
}

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {}
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries())
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers)
  }
  return headers
}

/* ----------------------------------
 * 插件可用性检测（只检测一次）
 * ---------------------------------- */

export function checkPluginEnabled(timeout = 500): Promise<boolean> {
  if (pluginEnabled !== null) return Promise.resolve(pluginEnabled)
  if (pluginChecking) return pluginChecking

  pluginChecking = new Promise((resolve) => {
    function handler(e: MessageEvent) {
      if (e.data?.type === 'PLUGIN_PONG') {
        cleanup()
        pluginEnabled = true
        resolve(true)
      }
    }

    function cleanup() {
      window.removeEventListener('message', handler)
      pluginChecking = null
    }

    window.addEventListener('message', handler)
    window.postMessage({ type: 'PLUGIN_PING' }, '*')

    setTimeout(() => {
      cleanup()
      pluginEnabled = null
      resolve(false)
    }, timeout)
  })

  return pluginChecking
}

/* ----------------------------------
 * 插件代理 fetch（RAW）
 * ---------------------------------- */

async function proxyFetchRaw(
  url: string,
  init?: RequestInit,
): Promise<{
  status: number
  statusText: string
  headers: Record<string, string>
  bodyText: string
  bodyType: 'json' | 'text'
}> {
  const requestId = genRequestId()

  const payload: RequestSpec = {
    url,
    method: init?.method || 'GET',
    headers: normalizeHeaders(init?.headers),
    body: init?.body ? { type: 'text', value: String(init.body) } : undefined,
  }

  const message: ProxyRequestMessage = {
    type: 'PROXY_REQUEST',
    requestId,
    payload,
  }

  return new Promise((resolve, reject) => {
    function handler(e: MessageEvent) {
      const msg = e.data as ProxyResponseMessage
      if (!msg || msg.type !== 'PROXY_RESPONSE') return
      if (msg.requestId !== requestId) return

      window.removeEventListener('message', handler)

      if (!msg.result.ok) {
        reject(new Error(msg.result.error?.message || 'Proxy fetch failed'))
        return
      }

      const res = msg.result.response
      resolve({
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
        bodyText: res.body.type === 'json' ? JSON.stringify(res.body.value) : res.body.value,
        bodyType: res.body.type,
      })
    }

    window.addEventListener('message', handler)
    window.postMessage(message, '*')
  })
}

/* ----------------------------------
 * Response-like 封装
 * ---------------------------------- */

class ProxyResponse {
  private _bodyUsed = false

  constructor(
    private raw: {
      status: number
      statusText: string
      headers: Record<string, string>
      bodyText: string
      bodyType: 'json' | 'text'
    },
  ) {}

  get ok() {
    return this.raw.status >= 200 && this.raw.status < 300
  }

  get status() {
    return this.raw.status
  }

  get statusText() {
    return this.raw.statusText
  }

  get headers() {
    return new Headers(this.raw.headers)
  }

  get bodyUsed() {
    return this._bodyUsed
  }

  async text(): Promise<string> {
    this._bodyUsed = true
    return this.raw.bodyText
  }

  async json() {
    if (this.raw.bodyType !== 'json') {
      throw new Error('Response is not JSON')
    }
    this._bodyUsed = true
    console.warn(this.raw.bodyText)
    return JSON.parse(this.raw.bodyText)
  }
}

/* ----------------------------------
 * 最终统一 API：request ≈ fetch
 * ---------------------------------- */

export async function request(
  input: RequestInfo,
  init?: RequestInit,
): Promise<Response | ProxyResponse> {
  const url = typeof input === 'string' ? input : input.url

  const usePlugin = await checkPluginEnabled()

  if (!usePlugin) {
    console.warn('usePlugin', usePlugin)
    // 原生 fetch
    return fetch(input, init)
  }

  console.warn('request', url, init)

  // 插件 fetch
  const raw = await proxyFetchRaw(url, init)

  return new ProxyResponse(raw)
}
