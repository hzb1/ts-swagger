<script setup lang="ts">
import SideBar from '@/views/home/components/SideBar.vue'
import Detail from '@/views/home/components/Detail.vue'
import Response from '@/views/home/components/Response.vue'
import { computed, onMounted, ref } from 'vue'
import { useSwagger } from '@/composables/useSwagger.ts'
import { useOptions } from '@/composables/useOptions.ts'
import { swaggerConfigUrl } from '@/api/swagger.ts'
import { SwaggerToTS } from '@/utils/SwaggerParser.ts'
import hljs from 'highlight.js/lib/core'
import typescript from 'highlight.js/lib/languages/typescript'
// import 'highlight.js/styles/atom-one-dark.css'
import 'highlight.js/styles/atom-one-light.css'
import type { SwaggerApi } from '@/views/proxyFetchDemo/types.ts'

hljs.registerLanguage('typescript', typescript)

const ipOptions = ref<
  {
    label: string
    value: string
  }[]
>([
  {
    label: 'lin',
    value: 'http://172.16.7.22:9999',
  },
  {
    label: 'nong',
    value: 'http://172.16.7.149:9999',
  },
  {
    label: 'localhost:9966',
    value: 'http://localhost:9966',
  },
  {
    label: 'www.lgsoar.cn',
    value: 'https://www.lgsoar.cn/soar-api',
  },
])

/**
 * Swagger 服务 IP 地址
 * 例如: http://localhost:9966
 * 例如: http://172.16.13.93:9000
 */
const ip = ref(ipOptions.value[3].value)

const version = ref<'v2' | 'v3'>('v3')
const selectedApi = ref<SwaggerApi | null>(null)
const loadingSwagger = ref(false)

function getBaseUrl(ip: string) {
  let url = ip.trim()
  if (!/^https?:\/\//.test(url)) url = 'http://' + url
  return url
}

const currentServiceUrl = ref('')

// 1. 调用 Swagger 业务逻辑
const {
  config,
  document,
  loading,
  searchQuery,
  searchHistory,
  filteredGroupedApis,
  init,
  loadDoc,
  saveHistory,
  clearHistory,
  serviceOptions,
} = useSwagger({
  apiDomain: ip,
})

// 2. 调用配置持久化逻辑
const { configState, generatorOptions, resetTemplate } = useOptions()

// 从 URL 获取参数
const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search)
  return {
    service: params.get('service'), // 服务 URL
    path: params.get('path'), // 接口路径
    method: params.get('method'), // 接口方法
  }
}

onMounted(() => {
  if (ip.value) loadSwagger()
})

async function loadSwagger() {
  loadingSwagger.value = true
  try {
    const baseUrl = getBaseUrl(ip.value)
    const configUrl = `${baseUrl}/${version.value}${swaggerConfigUrl}`
    await init(configUrl)
    loadingSwagger.value = false
  } catch (error) {
    console.error('加载 Swagger 失败:', error)
    loadingSwagger.value = false
  }
}

// 更新 URL 参数 (不触发刷新)
const updateUrl = (service: string, api?: any) => {
  const newUrl = new URL(window.location.href)
  newUrl.searchParams.set('service', service)
  if (api) {
    newUrl.searchParams.set('path', api.path)
    newUrl.searchParams.set('method', api.method)
  } else {
    newUrl.searchParams.delete('path')
    newUrl.searchParams.delete('method')
  }
  window.history.replaceState({}, '', newUrl.toString())
}

// 3. 计算最终生成的代码
const tsCodeParts = computed(() => {
  if (!document.value || !selectedApi.value) return null
  // 使用 useOptions 提供的 generatorOptions
  const parser = new SwaggerToTS(document.value, generatorOptions.value)
  const res = parser.getStructuredTypes(selectedApi.value.path, selectedApi.value.method)
  return {
    'Request Function': res.requestFunction,
    Models: res.models,
    'Query Params': res.queryParams,
    'Request Body': res.requestBody,
    'Response Data': res.responseData,
  }
})

const handleSelectApi = (api: any) => {
  selectedApi.value = api
  if (searchQuery.value) saveHistory(searchQuery.value)
  updateUrl(currentServiceUrl.value, api)
}

// 切换服务时的处理
const handleServiceChange = async (ev: Event) => {
  const value = ev?.target?.value as string
  currentServiceUrl.value = value
  const fullUrl = `${getBaseUrl(ip.value)}${value}`
  await loadDoc(fullUrl)
  selectedApi.value = null // 切换服务清空选中
  updateUrl(fullUrl)
}

const highlight = (code: string) => hljs.highlight(code, { language: 'typescript' }).value
const copy = (c: string) => {
  navigator.clipboard.writeText(c)
  alert('已复制')
}

const copyFullFile = () => {
  if (!tsCodeParts.value) return
  const fullCode = Object.values(tsCodeParts.value).join('\n\n')
  copy(fullCode)
}
</script>

<template>
  <div class="home-view flex h-screen bg[#fafafa]">
    <aside class="w-[320px] bg-white border-r border-[#e0e0e0] flex flex-col shrink-0">
      <div class="w-full h-[100] flex items-center justify-center">
        <label for="service-select" class="text-[14px] text-[#1a1a1a]">服务</label>
        <select
          id="service-select"
          :value="currentServiceUrl"
          @change="handleServiceChange"
          class="select"
        >
          <option v-for="item in serviceOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>
      </div>
      <div class="overflow-y-auto">
        <div class="flex-1" v-if="!loading">
          <div
            class="border-b border-[#e0e0e0]"
            v-for="(apis, tag) in filteredGroupedApis"
            :key="tag"
          >
            <button
              class="w-full h-8 px-4 flex items-center gap-2 hover:bg-[#f5f5f5] transition-colors cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-chevron-down w-4 h-4 text-[#616161]"
                data-fg-dqpt8="1.19:1.5600:/src/app/components/Sidebar.tsx:51:17:1628:50:e:ChevronDown::::::6cG"
              >
                <path d="m6 9 6 6 6-6"></path>
              </svg>
              <span class="text-sm text-[#424242]">{{ tag }}</span>
            </button>
            <div class="" v-for="api in apis" :key="api.path + api.method">
              <button
                class="w-full h-10 px-4 pl-8 flex items-center gap-2 hover:bg-[#f5f5f5] transition-colors cursor-pointer"
                @click="handleSelectApi(api)"
              >
                <span
                  class="px-2 py-0.5 text-[10px] font-medium rounded border bg-[#e8f5e9] text-[#2e7d32] border-[#a5d6a7]"
                >
                  {{ api.method }}
                </span>
                <div class="flex-1 flex flex-col p-2 items-start p-2">
                  <span class="text-xs text-[#616161] truncate">{{ api.path }}</span>
                  <div class="text-xs text-[#424242]">{{ api.summary || '未命名接口' }}</div>
                </div>
              </button>
            </div>
          </div>
        </div>
        <div class="" v-else>加载中...</div>
      </div>
    </aside>
    <div class="flex flex-1 flex-col overflow-hidden">
      <header class="h-16 bg-white border-b border-[#e0e0e0] flex items-center px-6 gap-6">
        <div class="font-medium text-[18px] text-[#1a1a1a]">TS Swagger UI</div>
        <div class="flex-1 flex items-center justify-center gap-2">
          <input
            type="text"
            class="w-80 h-8 px-3 border border-[#d0d0d0] rounded-md text-sm focus:outline-none focus:border-[#0066cc] bg-white"
            v-model="ip"
          />
          <button
            class="w-[120px] h-8 bg-[#0066cc] text-white text-sm rounded-md hover:bg-[#0052a3] transition-colors"
            @click="loadSwagger"
          >
            加载 Swagger
          </button>
        </div>
        <div class="flex items-center gap-2">
          <div
            class="flex items-center gap-2 px-3 h-8 bg-[#e8f5e9] text-[#2e7d32] text-sm rounded-md border border-[#a5d6a7]"
          >
            <div class="w-2 h-2 rounded-full bg-[#2e7d32]"></div>
            Plugin Enabled
          </div>
        </div>
      </header>
      <main class="flex-1 overflow-y-auto bg-[#fafafa]">
        <div class="p-8" v-if="selectedApi">
          <div class="bg-white rounded-md border border-[#e0e0e0] p-6 mb-6">
            <div class="flex items-center gap-3 mb-2">
              <span
                class="px-3 py-1 text-sm font-medium rounded-md border bg-[#e8f5e9] text-[#2e7d32] border-[#a5d6a7]"
              >
                {{ selectedApi?.method }}
              </span>
              <span class="text-[15px] text-[#1a1a1a] font-mono">
                {{ selectedApi?.path }}
              </span>
            </div>
            <p class="text-xs text-[#757575]">
              {{ selectedApi?.summary || '未命名接口' }}
            </p>
          </div>

          <div class="bg-white rounded-md border border-[#e0e0e0] mb-6 overflow-hidden">
            <div
              class="flex items-center justify-between px-4 py-2 border-b border-[#e0e0e0] bg-[#fafafa]"
            >
              <span class="text-xs font-medium text-[#424242]">请求代码示例</span>
              <button
                class="flex items-center gap-1.5 px-2 py-1 text-xs text-[#616161] hover:text-[#1a1a1a] hover:bg-white rounded transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="lucide lucide-copy w-3.5 h-3.5"
                  data-fg-bmv27="1.22:1.15554:/src/app/components/MainContent.tsx:168:21:5602:32:e:Copy::::::CwVW"
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                </svg>
                复制代码
              </button>
            </div>
            <pre class="p-4 text-[13px] font-mono leading-[18px] text-[#1a1a1a] overflow-x-auto">
              <code class="hljs" v-html="highlight(tsCodeParts?.['Request Function'])"></code>
            </pre>
          </div>
        </div>
      </main>
    </div>
    <!--    <div class="home-container">-->
    <!--      <SideBar class="sidebar" />-->
    <!--      <section class="main">-->
    <!--        <Detail v-if="selected" :data="selected" />-->
    <!--        <Response-->
    <!--          class="response"-->
    <!--          v-if="swaggerDoc && selected"-->
    <!--          :data="selected"-->
    <!--          :swaggerDoc="swaggerDoc"-->
    <!--        />-->
    <!--      </section>-->
    <!--    </div>-->
  </div>
</template>

<style scoped lang="less">
.home-view {
  .home-container {
    max-width: 1400px;
    margin: 0 auto;
    height: 100vh;
    display: flex;
    justify-content: space-between;
    position: relative;
  }
  .sidebar {
    height: 100vh;
    width: 320px;
    overflow: auto;
    flex-shrink: 0;
    max-height: 100vh;
  }
  .main {
    // margin-left: 300px;
    padding-right: calc(520px + 24px);
    flex: 1;
    overflow: auto;
    max-height: 100vh;

    .response {
      flex-shrink: 0;
      width: 520px;
      overflow: auto;
      max-height: 100vh;
      position: absolute;
      top: 24px;
      right: 24px;
      bottom: 24px;
    }
  }
}
</style>
