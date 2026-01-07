export function checkPluginEnabled(timeout = 500) {
  return new Promise<boolean>((resolve) => {
    function handler(event: MessageEvent) {
      if (event.data?.type === 'PLUGIN_PONG') {
        resolve(true)
        window.removeEventListener('message', handler)
      }
    }
    window.addEventListener('message', handler)
    window.postMessage({ type: 'PLUGIN_PING' }, '*')
    setTimeout(() => resolve(false), timeout)
  })
}
