import {useCallback, useEffect, useState} from "react";
import {checkPluginEnabled} from "../../../utils/proxySdk.ts";


/**
 * 插件可用性检测 (当页面激活时)
 */
export const usePluginEnabled = () => {
  const [pluginEnabled, setPluginEnabled] = useState<boolean>(false)

  // 检查中
  const [checking, setChecking] = useState<boolean>(false)


  const check = useCallback(() => {
    if (document.visibilityState !== 'visible') return

    // console.warn('页面激活，检查插件可用性')
    setChecking(true)
    checkPluginEnabled().then((enabled) => {
      // console.warn('插件可用性:', enabled)
      setPluginEnabled(enabled)
    }).finally(() => {
      setChecking(false)
    })
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    check()
  }, [check])

  // 当页面激活时
  // useEffect(() => {
  //
  //   // 添加事件监听
  //   document.addEventListener('visibilitychange', check)
  //
  //   // 组件卸载时移除事件监听
  //   return () => {
  //     document.removeEventListener('visibilitychange', check)
  //   }
  // }, [check])

  return {
    pluginEnabled,
    checking,
  }
}
