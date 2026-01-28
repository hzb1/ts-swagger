import type {
  ProxyRequestMessage,
  ProxyResponseMessage,
  RequestSpec,
} from '../extension/src/shared/types'

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
 * 插件可用性检测
 * ---------------------------------- */


let pluginChecking: {
  promise: Promise<boolean>
  cancel: () => void
} | null = null

export function checkPluginEnabled(timeout = 1000): Promise<boolean> {
  // 如果正在检测，直接复用同一次检测
  if (pluginChecking) {
    return pluginChecking.promise
  }

  let finished = false
  let timer: number | null = null

  const promise = new Promise<boolean>((resolve) => {
    function cleanup() {
      if (finished) return
      finished = true

      window.removeEventListener('message', onMessage)

      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }

      pluginChecking = null
    }

    function onMessage(e: MessageEvent) {
      if (e.data?.type === 'PLUGIN_PONG') {
        cleanup()
        resolve(true)
      }
    }

    window.addEventListener('message', onMessage)
    window.postMessage({ type: 'PLUGIN_PING' }, '*')

    timer = window.setTimeout(() => {
      cleanup()
      resolve(false)
    }, timeout)
  })

  pluginChecking = {
    promise,
    cancel() {
      if (!finished) {
        finished = true
        pluginChecking = null
      }
    },
  }

  return promise
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
    method: (init?.method || 'GET'),
    headers: normalizeHeaders(init?.headers),
    body: init?.body ? { type: 'text', value: String(init.body) } : undefined,
  }

  const message: ProxyRequestMessage = {
    type: 'PROXY_REQUEST',
    requestId,
    payload,
  }

  // @ts-ignore
  return new Promise((resolve, reject) => {
    function handler(e: MessageEvent) {
      const msg = e.data as ProxyResponseMessage
      // debugger;
      if (!msg || msg.type !== 'PROXY_RESPONSE') return
      if (msg.requestId !== requestId) return

      if (typeof msg.result !== 'object' || msg.result === null) {
        console.log('插件 fetch 失败:', msg)
        return
      }

      window.removeEventListener('message', handler)

      if (!msg.result.ok) {
        // console.error('插件 fetch 失败:', msg)
        reject(new Error(msg?.result?.error?.message || 'Proxy fetch failed'))
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

type ProxyResponseRaw = {
  status: number
  statusText: string
  headers: Record<string, string>
  bodyText: string
  bodyType: 'json' | 'text'
}

class ProxyResponse {
  private _bodyUsed = false

  private raw:  ProxyResponseRaw

  constructor(raw: ProxyResponseRaw ) {
    this.raw = raw;
  }

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
    // console.warn(this.raw.bodyText)
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

  // const usePlugin = await checkPluginEnabled()
  //
  // if (!usePlugin) {
  //   console.warn('usePlugin', usePlugin)
  //   // 原生 fetch
  //   return fetch(input, init)
  // }

  console.warn('request', url, init)

  // 插件 fetch
  const raw = await proxyFetchRaw(url, init)

  return new ProxyResponse(raw)
}
