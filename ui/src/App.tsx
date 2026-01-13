import React, {useCallback, useEffect, useMemo, useState} from 'react'
import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import {LaptopOutlined, NotificationOutlined, UserOutlined} from '@ant-design/icons';
import {AutoComplete, Input, type AutoCompleteProps, type MenuProps, Card, message, Row, Col} from 'antd';
import {Breadcrumb, Layout, Menu, theme} from 'antd';
import './App.css'
import {useSwagger} from "./hooks/useSwagger.ts";
import {useOptions} from "./hooks/useOptions.ts";
import CodeHighlighting from "./components/ui/CodeHighlighting/CodeHighlighting.tsx";
import {SwaggerToTS} from '../../utils/SwaggerParser.ts'
import copyToClipboard from '../../utils/copyToClipboard/copyToClipboard.ts'
import CopyIcon from "./components/CopyIcon.tsx";

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
  const [ip, setIp] = useState(options[0].value)

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

  const [loadingSwagger, setLoadingSwagger] = useState(false)

  const [version, setVersion] = useState('v3')

  const loadSwagger = async () => {
    setLoadingSwagger(true)
    try {
      const baseUrl = getBaseUrl(ip)
      const configUrl = `${baseUrl}/${version}${swaggerConfigUrl}`
      await init(configUrl)
      setLoadingSwagger(false)
    } catch (error) {
      console.error('加载 Swagger 失败:', error)
      setLoadingSwagger(false)
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
          label: api.summary,
        })),
      }
    })
  }, [filteredGroupedApis])


  /**
   * 菜单选择回调
   */
  const onMenuSelect: MenuProps['onSelect'] = (data) => {
    console.log(data)
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
    console.log('apis', apiList)
    console.log('findApi', findApi)
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
  }, [document, selectedApi])

  const handleCopy = async (content?: string) => {
    const b = await copyToClipboard(content)
    if (b) {
      messageApi.success('已复制');
    }
  }

  return (
    <>
      {contextHolder}
      <Layout className={'views'}>
        <Header className={'header-wrapper'} style={{display: 'flex', alignItems: 'justify-content-between'}}>
          <div className="logo-warp">
            <img className={'logo'} src={reactLogo} alt="logo"/>
          </div>

          <div className={'search-wrapper'}>
            <AutoComplete
              value={ip}
              onChange={setIp}
              options={options}
              style={{width: 240}}
              placeholder={"输入 IP 地址 ( 例如: http://localhost:9966 )"}
              showSearch={{onSearch: handleSearch}}
            >
              <Input.Search placeholder="input here" enterButton/>
            </AutoComplete>

          </div>

          <div></div>


        </Header>

        <Layout>
          <Sider width={280} style={{background: colorBgContainer}}>
            <Menu
              mode="inline"
              style={{height: '100%', borderInlineEnd: 0}}
              items={items2}
              onSelect={onMenuSelect}
            />
          </Sider>
          <Layout style={{padding: '0 24px 24px'}}>
            <Breadcrumb
              items={[{title: 'Home'}, {title: 'List'}, {title: 'App'}]}
              style={{margin: '16px 0'}}
            />
            <Content
              style={{
                padding: 24,
                margin: 0,
                minHeight: 280,
                background: colorBgContainer,
                borderRadius: borderRadiusLG,
              }}
            >
              {/*<div>{JSON.stringify(tsCodeParts)}</div>*/}
              <Row gutter={16}>
                <Col span={24} lg={24} xl={12} xxl={8}>
                  <Card title="Models" extra={<CopyIcon onClick={() => handleCopy(tsCodeParts?.Models)}/>}>
                    <CodeHighlighting code={tsCodeParts?.Models}/>
                  </Card>
                </Col>

                <Col span={24} lg={24} xl={12} xxl={8}>
                  <Card title="Query Params"
                        extra={<CopyIcon onClick={() => handleCopy(tsCodeParts?.['Query Params'])}/>}>
                    <CodeHighlighting code={tsCodeParts?.["Query Params"]}/>
                  </Card>
                </Col>

                <Col span={24} lg={24} xl={12} xxl={8}>
                  <Card title="Request Body"
                        extra={<CopyIcon onClick={() => handleCopy(tsCodeParts?.['Request Body'])}/>}>
                    <CodeHighlighting code={tsCodeParts?.["Request Body"]}/>
                  </Card>
                </Col>

                <Col span={24} lg={24} xl={12} xxl={8}>
                  <Card title="Response Data"
                        extra={<CopyIcon onClick={() => handleCopy(tsCodeParts?.['Response Data'])}/>}>
                    <CodeHighlighting code={tsCodeParts?.["Response Data"]}/>
                  </Card>
                </Col>

              </Row>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </>
  )
}

export default App
