import { useEffect, useMemo, useState } from 'react'
import type { OpenAPI } from 'openapi-types'
import { request } from '../../../utils/proxySdk.ts'

type UseSwaggerOptions = {
  apiDomain?: string
}

export function useSwagger(options?: UseSwaggerOptions) {
  const [config, setConfig] = useState<{ urls: { name: string; url: string }[] } | null>(null)
  const [document, setDocument] = useState<OpenAPI.Document | null>(null)
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
      // if (!response.ok) return
      const res = await response.json()

      console.log('init config: ', options?.apiDomain)
      setConfig(res)
      const fullUrl = `${options?.apiDomain ?? ''}${res.urls?.[0].url}`
      if (res.urls?.length) await loadDoc(fullUrl)
    } catch (err: any) {
      console.error('配置加载失败:', err)
      setError('配置加载失败')
      setConfig(null)
    } finally {
      setLoading(false)
    }
  }

  // 加载具体的 Swagger JSON 文档
  const loadDoc = async (fullUrl: string) => {
    setLoading(true)
    // setCurrentServiceUrl(fullUrl)
    setDocument(null)
    try {
      const response = await request(fullUrl)
      if (!response.ok) return
      const res = await response.json()
      setDocument(res)
    } catch (err: any) {
      console.error('文档加载失败:', err)
      setError('文档加载失败')
      setDocument(null)
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
      key: string;
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
            key: `${method}${path}`,
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
