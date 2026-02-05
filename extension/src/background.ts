import {
  ProxyRequestMessage,
  ProxyResponseMessage,
  ProxySuccess,
  ProxyFailure
} from './shared/types'

chrome.runtime.onMessage.addListener(
  (msg: ProxyRequestMessage, _sender, sendResponse) => {
    if (msg.type !== 'PROXY_REQUEST') return

    handleRequest(msg)
      .then(sendResponse)
      .catch(sendResponse)

    return true
  }
)

async function handleRequest(
  msg: ProxyRequestMessage
): Promise<ProxyResponseMessage> {
  console.warn(`收到请求:`, msg)
  const { requestId, payload } = msg
  const startTime = Date.now()

  try {
    new URL(payload.url)

    const controller = new AbortController()
    if (payload.timeout) {
      setTimeout(() => controller.abort(), payload.timeout)
    }

    const res = await fetch(payload.url, {
      method: payload.method,
      headers: payload.headers,
      body: buildBody(payload.body),
      signal: controller.signal
    })

    const text = await res.text()
    const endTime = Date.now()

    const success: ProxySuccess = {
      ok: true,
      response: {
        url: res.url,
        status: res.status,
        statusText: res.statusText,
        headers: headersToObject(res.headers),
        body: parseBody(text) as any
      },
      timing: {
        startTime,
        endTime,
        duration: endTime - startTime
      }
    }

    console.error(`[${requestId}] 成功响应`, {
      type: 'PROXY_RESPONSE',
      requestId,
      result: success
    })
    return {
      type: 'PROXY_RESPONSE',
      requestId,
      result: success
    }
  } catch (err: any) {
    const failure: ProxyFailure = {
      ok: false,
      error: {
        type:
          err.name === 'AbortError'
            ? 'TIMEOUT'
            : err instanceof TypeError
              ? 'NETWORK_ERROR'
              : 'UNKNOWN',
        message: err.message || 'Unknown error'
      }
    }
    console.error(`[${requestId}] 失败响应`, err, err.name, err.message)
    console.log(`[${requestId}] 失败响应`, {
      type: 'PROXY_RESPONSE',
      requestId,
      result: failure
    })

    return {
      type: 'PROXY_RESPONSE',
      requestId,
      result: failure
    }
  }
}

function buildBody(body?: any): BodyInit | undefined {
  if (!body) return undefined
  if (body.type === 'json') return JSON.stringify(body.value)
  if (body.type === 'text') return body.value
  if (body.type === 'form')
    return new URLSearchParams(body.value).toString()
}

function headersToObject(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {}
  headers.forEach((v, k) => (obj[k] = v))
  return obj
}

function parseBody(text: string) {
  try {
    return { type: 'json', value: JSON.parse(text) }
  } catch {
    return { type: 'text', value: text }
  }
}
