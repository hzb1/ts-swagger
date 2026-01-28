import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {
  AutoComplete,
  Input,
  Card,
  message,
  Row,
  Col,
  Select,
  Spin,
  Tag, Empty
} from 'antd';
import {Breadcrumb, Layout, theme} from 'antd';
import './Home.css'
import {useSwagger} from "../../hooks/useSwagger.ts";
import {useOptions} from "../../hooks/useOptions.ts";
import CodeHighlighting from "../../components/ui/CodeHighlighting/CodeHighlighting.tsx";
import {SwaggerToTS} from '../../../../utils/SwaggerParser.ts'
import copyToClipboard from '../../../../utils/copyToClipboard/copyToClipboard.ts'
import CopyIcon from "../../components/CopyIcon.tsx";
import SearchBar from "../../components/ui/SearchBar/SearchBar.tsx";
import ApiList from "../../components/ApiList/ApiList.tsx";
import Method from "../../components/ui/Method/Method.tsx";
import {CheckCircleOutlined, LoadingOutlined, WarningOutlined} from "@ant-design/icons";
import {usePluginEnabled} from "../../hooks/usePluginEnabled.ts";
import { useSearchParams} from "react-router";
import type {SwaggerApi} from "./utils.ts";

const {Header, Content, Sider} = Layout;



const Home: React.FC = () => {
  const {
    token: {colorBgContainer, borderRadiusLG},
  } = theme.useToken();

  const [searchParams, setSearchParams] = useSearchParams();

  const [messageApi, contextHolder] = message.useMessage();

  const [options] = useState([
    {
      label: 'lin',
      value: 'http://172.16.7.22:9999',
    },
    {
      label: 'nong',
      value: 'http://172.16.7.149:9999',
    },
    {
      label: 'huang',
      value: 'http://172.16.7.21:9999',
    },
    {
      label: 'localhost:9966',
      value: 'http://localhost:9966',
    },
    {
      label: 'localhost:huang',
      value: 'http://localhost:9966/huang',
    },
    {
      label: 'www.lgsoar.cn',
      value: 'https://www.lgsoar.cn/soar-api',
    },
  ])

  // 调用 Swagger 业务逻辑
  const {
    configData,
    documentData,
    configLoading,
    docLoading,
    searchQuery,
    setSearchQuery,
    filteredGroupedApis,
    onLoadDocument,
    loadData,
  } = useSwagger({
    // 配置加载完成时的回调
    onConfigLoaded: (configData) => {
      if (!currentServiceUrl) {
        setCurrentServiceUrl(configData?.urls[0].url)
      }
    },
    // 文档加载完成时的回调
    onDocumentLoaded: () => {
    },
  })

// 2. 调用配置持久化逻辑
  const {generatorOptions} = useOptions()


  /**
   * Swagger 服务 IP 地址
   * 例如: http://localhost:9966
   * 例如: http://172.16.13.93:9000
   */
  const [ip, setIp] = useState<string>(searchParams.get('ip') ?? options[0].value!)

  const onIpChange = (value: string) => {
    setIp(value?.trim())
  }

  const [currentServiceUrl, setCurrentServiceUrl] = useState(searchParams.get('service') ?? '')

  const [selectedApi, setSelectedApi] = useState<SwaggerApi>()

  const {pluginEnabled, checking} = usePluginEnabled()

  const [version] = useState('v3')

  const loadSwagger = useCallback(({ip, version}: { ip: string, version?: string }) => {
    if (!ip) {
      messageApi.error('请输入 IP 地址')
      return
    }
    try {
      loadData({
        ip,
        version,
      })
    } catch (error) {
      console.error('加载 Swagger 失败:', error)
    }
  }, [loadData, messageApi])

  useEffect(() => {
    console.log('on useEffect loadSwagger')
    loadSwagger({ip})
  }, [])


  const handleSearch = useCallback((value: string) => {
    const nextIp = value?.trim()
    console.log('搜索', {ip, version, nextIp})
    loadSwagger({ip: nextIp, version})
  }, [ip, version, loadSwagger])


  /**
   * 菜单选择回调
   */
  const onMenuSelect = useCallback((data: { key: string }) => {
    const {key} = data;
    // 通过key 找出selectedApi

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const apiList = Object.entries(filteredGroupedApis).map(([_tag, apis]) => apis)

    let findApi;
    apiList?.forEach((apis) => {
      apis.forEach((api) => {
        if (key === api.key) {
          findApi = api;
        }
      })
    })
    setSelectedApi(findApi)
  }, [filteredGroupedApis]);

  const tsCodeParts = useMemo(() => {
    if (!documentData || !selectedApi) return null
    // 使用 useOptions 提供的 generatorOptions
    const parser = new SwaggerToTS(documentData, generatorOptions)
    const res = parser.getStructuredTypes(selectedApi.path, selectedApi.method)
    return {
      'Request Function': res.requestFunction,
      Models: res.models,
      'Query Params': res.queryParams,
      'Request Body': res.requestBody,
      'Response Data': res.responseData,
    }
  }, [documentData, generatorOptions, selectedApi])

  // 更新 URL 参数 (不触发刷新)
  const updateUrl = (service: string, api?: SwaggerApi) => {
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
    const b = await copyToClipboard(content!)
    if (b) {
      messageApi.success('已复制');
    }
  }

  const handleServiceChange = (serviceUrl: string) => {
    setCurrentServiceUrl(serviceUrl)
    // 切换服务 清空选中
    setSelectedApi(undefined)
    const fullUrl = `${ip}${serviceUrl}`
    onLoadDocument(fullUrl).then(() => {
      updateUrl(serviceUrl)
    })
  }

  const serviceOptions = useMemo(() => {
    return configData?.urls.map((item) => ({
      label: item.name,
      value: item.url,
    })) || []
  }, [configData?.urls])

  const apiGroups = useMemo(() => {
    return Object.entries(filteredGroupedApis).map(([tag, apis]) => ({
      name: tag,
      children: apis,
    }))
  }, [filteredGroupedApis])

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
                loading={configLoading}
                onChange={handleServiceChange}
                options={serviceOptions}
              />
            </div>
            <SearchBar value={searchQuery} onChange={setSearchQuery}/>
            <Spin spinning={docLoading} wrapperClassName={'api-list-wrapper'}>
              {
                apiGroups?.length ? <ApiList apis={apiGroups} onSelect={onMenuSelect}/> :
                  <Empty description={'暂无 API 接口'}/>
              }
            </Spin>
          </div>
        </Sider>

        <Layout>
          <Header className={'header-wrapper'} style={{display: 'flex', alignItems: 'justify-content-between'}}>

            <div className={'search-wrapper'}>
              <AutoComplete
                value={ip}
                onChange={onIpChange}
                onSelect={handleSearch}
                options={options}
                style={{width: 280}}
                placeholder={"输入 IP 地址 ( 例如: http://localhost:9966 )"}
                showSearch={{onSearch: handleSearch}}
              >
                <Input.Search placeholder="input here" enterButton/>
              </AutoComplete>

            </div>

            <div>
              {
                checking ? <Tag color="success" variant={'solid'} icon={<LoadingOutlined/>}>检查中</Tag> : (
                  pluginEnabled ? (
                    <Tag color="success" variant={'solid'} icon={<CheckCircleOutlined/>}>已连接</Tag>
                  ) : (
                    <Tag color="error" variant={'solid'} icon={<WarningOutlined />}>未连接</Tag>
                  )
                )
              }

            </div>

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
                    <Col span={12} className={'left-main'}>


                      <div className="api-detail-info">
                        <div className="title-row">
                          <h2>{selectedApi?.summary}</h2>
                          {/*<button className="copy-all-btn" onClick={() => handleCopy(tsCodeParts?.['Request Function'])}>复制全量代码</button>*/}
                        </div>
                        <div className="api-info">
                          <Method method={selectedApi?.method} className={'method'}/>
                          <span className="path">{selectedApi?.path}</span>
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
                  <Empty description={'请选择 API'}/>
                )
              }
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </>
  )
}

export default Home
