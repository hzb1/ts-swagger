import {
  ProxyRequestMessage,
  ProxyResponseMessage
} from './shared/types'

window.addEventListener('message', (event) => {
  if (event.source !== window) return

  const msg = event.data as ProxyRequestMessage

  if (msg?.type === 'PLUGIN_PING') {
    window.postMessage({ type: 'PLUGIN_PONG' }, '*')
  }

  if (msg?.type !== 'PROXY_REQUEST') return

  chrome.runtime.sendMessage(msg, (response: ProxyResponseMessage) => {
    window.postMessage(response, '*')
  })
})
