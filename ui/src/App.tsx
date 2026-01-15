import React, {useCallback, useEffect, useMemo, useState} from 'react'
import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import {LaptopOutlined, NotificationOutlined, UserOutlined} from '@ant-design/icons';
import {
  AutoComplete,
  Input,
  type AutoCompleteProps,
  type MenuProps,
  Card,
  message,
  Row,
  Col,
  Select,
  Spin,
  Tag, Empty
} from 'antd';
import {Breadcrumb, Layout, Menu, theme} from 'antd';
import './App.css'
import {useSwagger} from "./hooks/useSwagger.ts";
import {useOptions} from "./hooks/useOptions.ts";
import CodeHighlighting from "./components/ui/CodeHighlighting/CodeHighlighting.tsx";
import {SwaggerToTS} from '../../utils/SwaggerParser.ts'
import copyToClipboard from '../../utils/copyToClipboard/copyToClipboard.ts'
import CopyIcon from "./components/CopyIcon.tsx";
import SearchBar from "./components/ui/SearchBar/SearchBar.tsx";

const {Header, Content, Sider} = Layout;

interface SwaggerParameter {
  name: string
  in: 'query' | 'path' | 'header' | 'cookie'
  required: boolean
  schema?: { type: string }
}

interface SwaggerApi {
  path: string
  method: string
  summary?: string
  parameters?: SwaggerParameter[]
  requestBody?: any
}

const swaggerConfigUrl = '/api-docs/swagger-config'

function getBaseUrl(ip: string) {
  let url = ip.trim()
  if (!/^https?:\/\//.test(url)) url = 'http://' + url
  return url
}

// const items2: MenuProps['items'] = [UserOutlined, LaptopOutlined, NotificationOutlined].map(
//   (icon, index) => {
//     const key = String(index + 1);
//
//     return {
//       key: `sub${key}`,
//       icon: React.createElement(icon),
//       label: `subnav ${key}`,
//       children: Array.from({length: 4}).map((_, j) => {
//         const subKey = index * 4 + j + 1;
//         return {
//           key: subKey,
//           label: `option${subKey}`,
//         };
//       }),
//     };
//   },
// );


const App: React.FC = () => {
  const {
    token: {colorBgContainer, borderRadiusLG},
  } = theme.useToken();

  const [messageApi, contextHolder] = message.useMessage();


  const [selectedApi, setSelectedApi] = useState<SwaggerApi>()

  const [options, setOptions] = useState<AutoCompleteProps['options']>([
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
  const [ip, setIp] = useState<string>(options?.[2].value)

  const onIpChange = (value: string) => {
    setIp(value?.trim())
    handleSearch()
  }

  const handleSearch = () => {
    loadSwagger()
  }

  // 1. 调用 Swagger 业务逻辑
  const {
    config,
    document,
    currentServiceUrl,
    loading,
    searchQuery,
    setSearchQuery,
    searchHistory,
    filteredGroupedApis,
    init,
    loadDoc,
    saveHistory,
    clearHistory,
  } = useSwagger({
    apiDomain: () => ip,
  })

// 2. 调用配置持久化逻辑
  const {configState, generatorOptions, resetTemplate} = useOptions()

  const [version, setVersion] = useState('v3')

  const loadSwagger = async () => {
    try {
      const baseUrl = getBaseUrl(ip)
      const configUrl = `${baseUrl}/${version}${swaggerConfigUrl}`
      await init(configUrl)
    } catch (error) {
      console.error('加载 Swagger 失败:', error)
    }
  }

  useEffect(() => {
    if (ip) {
      loadSwagger()
    }
  }, [])

  // @ts-ignore
  const items2: MenuProps['items'] = useMemo(() => {
    return Object.entries(filteredGroupedApis).map(([tag, apis]) => {
      return {
        key: tag,
        label: tag,
        type: 'group',
        children: apis.map((api) => ({
          key: api.path + api.method,
          label: api.summary || '未命名接口',
        })),
      }
    })
  }, [filteredGroupedApis])


  /**
   * 菜单选择回调
   */
  const onMenuSelect: MenuProps['onSelect'] = (data) => {
    const {key} = data;
    // 通过key 找出selectedApi

    const apiList = Object.entries(filteredGroupedApis).map(([_tag, apis]) => apis)

    let findApi;
    apiList?.forEach((apis) => {
      apis.forEach((api) => {
        if (key === api.path + api.method) {
          findApi = api;
        }
      })
    })
    setSelectedApi(findApi)
  };

  const tsCodeParts = useMemo(() => {
    if (!document || !selectedApi) return null
    // 使用 useOptions 提供的 generatorOptions
    const parser = new SwaggerToTS(document, generatorOptions)
    const res = parser.getStructuredTypes(selectedApi.path, selectedApi.method)
    return {
      'Request Function': res.requestFunction,
      Models: res.models,
      'Query Params': res.queryParams,
      'Request Body': res.requestBody,
      'Response Data': res.responseData,
    }
  }, [document, generatorOptions, selectedApi])

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

  const handleCopy = async (content?: string) => {
    const b = await copyToClipboard(content)
    if (b) {
      messageApi.success('已复制');
    }
  }

  const handleServiceChange = async (url: string) => {
    await loadDoc(url)
    // 切换服务清空选中
    setSelectedApi(undefined)
    updateUrl(url)
  }

  const serviceOptions = useMemo(() => {
    return config?.urls.map((item) => ({
      label: item.name,
      value: item.url,
    }))
  }, [config?.urls])

  return (
    <>
      {contextHolder}
      <Layout className={'views'}>
        <Sider width={280} style={{background: colorBgContainer}}>
          <div className={'sidebar'}>
            <div className={'service-select-wrapper'}>
              <Select
                value={currentServiceUrl}
                style={{width: 180}}
                loading={loading}
                onChange={handleServiceChange}
                options={serviceOptions}
              />
            </div>
            <SearchBar value={searchQuery} onChange={setSearchQuery}/>
            <Spin spinning={loading} wrapperClassName={'api-list-wrapper'}>
              <Menu
                mode="inline"
                style={{height: '100%', borderInlineEnd: 0}}
                items={items2}
                onSelect={onMenuSelect}
              />
            </Spin>
          </div>
        </Sider>

        <Layout>
          <Header className={'header-wrapper'} style={{display: 'flex', alignItems: 'justify-content-between'}}>
            {/*<div className="logo-warp">*/}
            {/*  <img className={'logo'} src={reactLogo} alt="logo"/>*/}
            {/*</div>*/}

            <div className={'search-wrapper'}>
              <AutoComplete
                value={ip}
                onChange={onIpChange}
                options={options}
                style={{width: 280}}
                placeholder={"输入 IP 地址 ( 例如: http://localhost:9966 )"}
                showSearch={{onSearch: handleSearch}}
              >
                <Input.Search placeholder="input here" enterButton/>
              </AutoComplete>

            </div>

            <div></div>


          </Header>
          <Layout className={'content-wrapper'}>
            <Breadcrumb
              items={[{title: 'Home'}, {title: 'List'}, {title: 'App'}]}
              className={'breadcrumb'}
            />
            <Content
              style={{
                padding: 16,
                margin: 0,
                minHeight: 280,
                background: colorBgContainer,
                borderRadius: borderRadiusLG,
              }}
              className={'content-container'}
            >
              {
                selectedApi ? (
                  <Row gutter={[16, 16]} style={{height: '100%'}}>
                    <Col span={12}>



                      <div className="api-detail-info">
                        <div className="title-row">
                          <h2>{ selectedApi?.summary }</h2>
                          {/*<button className="copy-all-btn" onClick={() => handleCopy(tsCodeParts?.['Request Function'])}>复制全量代码</button>*/}
                        </div>
                        <div className="api-info">
                          <Tag className="method">{ selectedApi?.method }</Tag>
                          <span className="path">{ selectedApi?.path }</span>
                        </div>
                      </div>

                      <Row gutter={[16, 16]}>
                        <Col span={24}>
                          <Card title="Query Params"
                                extra={<CopyIcon onClick={() => handleCopy(tsCodeParts?.['Query Params'])}/>}>
                            <CodeHighlighting code={tsCodeParts?.["Query Params"]}/>
                          </Card>
                        </Col>
                        <Col span={24}>
                          <Card title="Request Body"
                                extra={<CopyIcon onClick={() => handleCopy(tsCodeParts?.['Request Body'])}/>}>
                            <CodeHighlighting code={tsCodeParts?.["Request Body"]}/>
                          </Card>
                        </Col>

                        <Col span={24}>
                          <Card title="Response Data"
                                extra={<CopyIcon onClick={() => handleCopy(tsCodeParts?.['Response Data'])}/>}>
                            <CodeHighlighting code={tsCodeParts?.["Response Data"]}/>
                          </Card>
                        </Col>
                      </Row>

                    </Col>

                    <Col span={12} style={{height: '100%'}}>
                      <Card title="Models" extra={<CopyIcon onClick={() => handleCopy(tsCodeParts?.Models)}/>} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                      }} styles={{
                        body: {
                          flex: 1,
                          overflow: 'auto',
                          padding: 0,
                        }
                      }}>
                        <CodeHighlighting code={tsCodeParts?.Models}/>
                      </Card>
                    </Col>

                  </Row>
                ) : (
                  <Empty description={'请选择 API'} />
                )
              }
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </>
  )
}

export default App
