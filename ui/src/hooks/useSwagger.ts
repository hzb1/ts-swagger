import { useEffect, useMemo, useState } from 'react'
import type { OpenAPI } from 'openapi-types'
import { request } from '../../../utils/proxySdk.ts'
const swaggerConfigUrl = '/api-docs/swagger-config'

type UseSwaggerOptions = {
  // 在获取 Swagger 配置后触发
  onConfigLoaded?: (config: { urls: { name: string; url: string }[] }) => void
  // 在获取 Swagger JSON 文档后触发
  onDocumentLoaded?: (document: OpenAPI.Document) => void
}

function getBaseUrl(ip: string) {
  let url = ip.trim()
  if (!/^https?:\/\//.test(url)) url = 'http://' + url
  return url
}

export function useSwagger(options?: UseSwaggerOptions) {
  const [config, setConfig] = useState<{ urls: { name: string; url: string }[] } | null>(null)
  const [document, setDocument] = useState<OpenAPI.Document | null>(null)
  const [configLoading, setConfigLoading] = useState(false)
  const [docLoading, setDocLoading] = useState(false)
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
  const onLoadConfig = async (configUrl: string) => {
    setConfigLoading(true)
    setConfig(null)
    try {
      const response = await request(configUrl)
      // if (!response.ok) return
      const res = await response.json()
      setConfig(res)
      options?.onConfigLoaded?.(res)
      return res;
    } catch (err) {
      console.error('配置加载失败:', err)
      setError('配置加载失败')
      setConfig(null)
      setDocument(null)
      return err;
    } finally {
      setConfigLoading(false)
    }
  }

  // 加载具体的 Swagger JSON 文档
  const onLoadDocument = async (fullUrl: string) => {
    setDocLoading(true)
    setDocument(null)
    try {
      const response = await request(fullUrl)
      if (!response.ok) return
      const res = await response.json()
      setDocument(res)
    } catch (err) {
      console.error('文档加载失败:', err)
      setError('文档加载失败')
      setDocument(null)
      return err;
    } finally {
      setDocLoading(false)
    }
  }

  // 加载数据
  const loadData = async (p: {
    // ip 地址
    ip: string;
    // 版本, 默认为 v3
    version?: string;
  }) => {
    try {
      const {ip, version = 'v3'} = p
      const baseUrl = getBaseUrl(ip)
      const configUrl = `${baseUrl}/${version}${swaggerConfigUrl}`
      const res = await onLoadConfig(configUrl)

      if (res?.urls?.length) {
        const fullUrl = `${baseUrl}${res?.urls?.[0].url}`
        await onLoadDocument(fullUrl)
      }
    } catch (err) {
      console.error('loadData 加载数据失败:', err)
      setError('加载数据失败')
      setDocument(null)
      setConfig(null)
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
      ['get', 'post', 'put', 'delete', 'patch'].forEach(method => {
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
    configData: config,
    documentData: document,
    configLoading,
    docLoading,
    error,
    searchQuery,
    setSearchQuery,
    searchHistory,
    filteredGroupedApis,
    loadData,
    onLoadDocument,
    saveHistory,
    clearHistory,
  }
}
