import { useEffect, useMemo, useState } from 'react'
import type { OpenAPI } from 'openapi-types'
import { request } from '../../../utils/proxySdk.ts'

type UseSwaggerOptions = {
  // 接口文档域名和端口（可以是字符串或返回字符串的函数，用于兼容 Vue ref 形式）
  apiDomain?: string | (() => string)
}

export function useSwagger(options?: UseSwaggerOptions) {
  const [config, setConfig] = useState<{ urls: { name: string; url: string }[] } | null>(null)
  const [document, setDocument] = useState<OpenAPI.Document | null>(null)
  const [currentServiceUrl, setCurrentServiceUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 搜索相关
  const [searchQuery, setSearchQuery] = useState('')
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const MAX_HISTORY = 12

  // 初始化历史记录（componentDidMount）
  useEffect(() => {
    const saved = localStorage.getItem('swagger_search_history')
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved))
      } catch {
        // ignore parse error
      }
    }
  }, [])

  // 加载 Swagger 配置
  const init = async (configUrl: string) => {
    setLoading(true)
    setConfig(null)
    try {
      const response = await request(configUrl)
      if (!response.ok) return
      const res = await response.json()

      console.log('init config: ', res)
      setConfig(res)
      if (res.urls?.length) await loadDoc(res.urls[0].url)
    } catch (err: any) {
      setError('配置加载失败')
      setConfig(null)
    } finally {
      setLoading(false)
    }
  }

  // 加载具体的 Swagger JSON 文档
  const loadDoc = async (url: string) => {
    setLoading(true)
    setCurrentServiceUrl(url)
    try {
      const apiDomain =
        typeof options?.apiDomain === 'function' ? options!.apiDomain() : options?.apiDomain ?? ''
      const response = await request(apiDomain + url)
      if (!response.ok) return
      const res = await response.json()
      setDocument(res)
    } catch (err: any) {
      setError('文档加载失败')
    } finally {
      setLoading(false)
    }
  }

  // 保存搜索历史
  const saveHistory = (text: string) => {
    const val = text.trim()
    if (!val) return
    setSearchHistory(prev => {
      const list = [...prev]
      const index = list.indexOf(val)
      if (index !== -1) list.splice(index, 1)
      list.unshift(val)
      if (list.length > MAX_HISTORY) list.pop()
      localStorage.setItem('swagger_search_history', JSON.stringify(list))
      return list
    })
  }

  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('swagger_search_history')
  }

  /**
   * 核心搜索逻辑：多维度扫描
   */
  const filteredGroupedApis = useMemo(() => {
    if (!document?.paths) return {}
    const groups: Record<string, {
      path: string;
      method: string;
      matchType: string;
    }[]> = {}
    const query = searchQuery.toLowerCase().trim()

    Object.entries(document.paths).forEach(([path, pathItem]) => {
      ;['get', 'post', 'put', 'delete', 'patch'].forEach(method => {
        const op = pathItem[method]
        if (!op) return

        let matchType = ''
        if (path.toLowerCase().includes(query)) matchType = '路径'
        else if (op.summary?.toLowerCase().includes(query)) matchType = '名称'
        else {
          // 扫描整个接口定义中是否包含该类名 ($ref)
          const opStr = JSON.stringify(op).toLowerCase()
          if (opStr.includes(query)) matchType = '类名'
        }

        if (!query || matchType) {
          const tag = op.tags?.[0] || 'Default'
          if (!groups[tag]) groups[tag] = []
          groups[tag].push({
            path,
            method: method.toUpperCase(),
            matchType: query ? matchType : '',
            ...op,
          })
        }
      })
    })

    return groups
  }, [document, searchQuery])

  return {
    config,
    document,
    currentServiceUrl,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    searchHistory,
    filteredGroupedApis,
    init,
    loadDoc,
    saveHistory,
    clearHistory,
  }
}
