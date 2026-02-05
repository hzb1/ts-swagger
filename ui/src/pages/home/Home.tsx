import React, { useEffect, useMemo, useState } from "react";
import { AutoComplete, Input, Row, Col, Spin, Tag, Empty } from "antd";
import { Layout, theme } from "antd";
import "./Home.css";
import { useSwagger } from "@/hooks/useSwagger.ts";
import { useOptions } from "@/hooks/useOptions.ts";
import {
  CheckCircleOutlined,
  LoadingOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { usePluginEnabled } from "@/hooks/usePluginEnabled.ts";
import { useSearchParams } from "react-router";
import SideBar, {
  type SideBarProps,
} from "@/components/sidebar/SideBar.tsx";
import ApiInfo from "@/components/api-info/ApiInfo.tsx";
import CodeCard from "@/components/code-card/CodeCard.tsx";
import type { ApiDetail } from "../../../types.ts";
import { stableHash } from "@/utils/getApiSlug.ts";
import {SwaggerToTS} from "@/utils/SwaggerParser.ts";
import type {ApiGroup} from "./utils.ts";
const { Header, Sider } = Layout;

const Home: React.FC = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const [searchParams, setSearchParams] = useSearchParams();

  const [options] = useState([
    {
      label: "lin",
      value: "http://172.16.7.22:9999",
    },
    {
      label: "nong",
      value: "http://172.16.7.149:9999",
    },
    {
      label: "huang",
      value: "http://172.16.7.21:9999",
    },
    {
      label: "localhost:9966",
      value: "http://localhost:9966",
    },
    {
      label: "localhost:huang",
      value: "http://localhost:9966/huang",
    },
    {
      label: "www.lgsoar.cn",
      value: "https://www.lgsoar.cn/soar-api",
    },
  ]);

  const ip = searchParams.get("ip") ?? options[3].value;
  const serviceUrl = searchParams.get("service") ?? undefined;
  const selectedApiKey = searchParams.get("api");

  const queryApiKey = searchParams.get("api");

  // 调用 Swagger 业务逻辑
  const {
    configData,
    documentData,
    stage,
    searchQuery,
    setSearchQuery,
    filteredGroupedApis,
    loadSwagger,
    error,
  } = useSwagger();

  const configLoading = stage === 'config';
  const docLoading = stage === 'document';

  // 2. 调用配置持久化逻辑
  const { generatorOptions } = useOptions();

  const selectedApi = useMemo(() => {
    if (!selectedApiKey) return null;
    const apiList = Object.entries(filteredGroupedApis).map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_tag, apis]) => apis,
    );
    let findApi: ApiDetail;
    apiList?.forEach((apis) => {
      apis.forEach((api) => {
        if (selectedApiKey === api.key) {
          findApi = api;
        }
      });
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return findApi;
  }, [filteredGroupedApis, selectedApiKey]);

  // 展开的分组
  const [expandedGroupList, setExpandedGroupList] = useState<string[]>(() => {
    const api = searchParams.get("api");
    if (!api) return [];
    return [];
  });

  const handleGroupTitleClick = (groupItem: ApiGroup) => {
    const groupId = groupItem.id;
    setExpandedGroupList((prev) => {
      if (prev.includes(groupId)) {
        return prev.filter((id) => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  const { pluginEnabled, checking } = usePluginEnabled();


// 2. effect：监听状态 → 发请求
  useEffect(() => {
    if (!ip) return;
    loadSwagger({ ip, serviceUrl });
  }, [ip, serviceUrl]);

  const handleSearch = (nextIp: string) => {
    setSearchParams({ ip: nextIp });
  };

  /**
   * 菜单选择回调
   */
  const onMenuSelect = (key: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("api", key);
      return next;
    });
  };

  const tsCodeParts = useMemo(() => {
    if (!documentData || !selectedApi) return;
    // 使用 useOptions 提供的 generatorOptions
    const parser = new SwaggerToTS(documentData, generatorOptions);
    const res = parser.getStructuredTypes(selectedApi.path, selectedApi.method);
    return {
      "Request Function": res.requestFunction,
      Models: res.models,
      "Query Params": res.queryParams,
      "Request Body": res.requestBody,
      "Response Data": res.responseData,
    };
  }, [documentData, generatorOptions, selectedApi]);

  const handleServiceChange = (url: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("service", url);
      next.delete("api");
      return next;
    });
  };

  const serviceOptions = useMemo(() => {
    return (
      configData?.urls.map((item) => ({
        label: item.name,
        value: item.url,
      })) || []
    );
  }, [configData?.urls]);

  const apiGroups: SideBarProps["apis"] = useMemo(() => {
    return Object.entries(filteredGroupedApis).map(([tag, apis]) => {
      const id = stableHash(tag);
      const isExpanded = expandedGroupList.includes(id);

      const children = apis.map((api) => ({
        ...api,
        isSelected: Boolean(selectedApiKey) && api.key === selectedApiKey,
      }));

      return {
        id,
        isExpanded,
        children,
        name: tag,
      };
    });
  }, [filteredGroupedApis, expandedGroupList, selectedApiKey]);

  /**
   * 在初始化时 设置默认展开的分组
   */
  if (expandedGroupList.length === 0 && queryApiKey && apiGroups) {
    // 找出当前接口所在的分组
    const currentGroup = apiGroups.find((group) =>
      group.children.some((api) => api.key === queryApiKey),
    );
    if (currentGroup) {
      setExpandedGroupList([currentGroup.id]);
    }
  }

  return (
    <>
      <Spin spinning={configLoading || docLoading}>
        <Layout className={"views"}>
          <Sider width={324} style={{ background: colorBgContainer }}>
            <SideBar
              currentServiceUrl={serviceUrl}
              onCurrentServiceUrlChange={handleServiceChange}
              configLoading={configLoading}
              serviceOptions={serviceOptions}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              docLoading={docLoading}
              apis={apiGroups}
              onSelectKeyChange={onMenuSelect}
              onGroupTitleClick={handleGroupTitleClick}
            />
          </Sider>

          <Layout className={"flex flex-col h-full"}>
            <Header
              className={"header-wrapper border-b border-gray-950/5"}
              style={{
                display: "flex",
                alignItems: "justify-content-between",
                backgroundColor: colorBgContainer,
              }}
            >
              <div className={"search-wrapper"}>
                <AutoComplete
                  value={ip}
                  onChange={(value) => {
                    setSearchParams({ ip: value });
                  }}
                  onSelect={handleSearch}
                  options={options}
                  style={{ width: 304 }}
                  placeholder={"输入 IP 地址 ( 例如: http://localhost:9966 )"}
                  showSearch={{ onSearch: handleSearch }}
                >
                  <Input.Search placeholder="input here" enterButton />
                </AutoComplete>
              </div>

              <div>
                {checking ? (
                  <Tag
                    color="success"
                    variant={"solid"}
                    icon={<LoadingOutlined />}
                  >
                    检查中
                  </Tag>
                ) : pluginEnabled ? (
                  <Tag
                    color="success"
                    variant={"solid"}
                    icon={<CheckCircleOutlined />}
                  >
                    已连接
                  </Tag>
                ) : (
                  <Tag
                    color="error"
                    variant={"solid"}
                    icon={<WarningOutlined />}
                  >
                    未连接
                  </Tag>
                )}
              </div>
            </Header>
            <Layout className={"content-wrapper overflow-y-auto"}>
              {error && <span>{error}</span>}
              {selectedApi ? (
                <Row gutter={[16, 16]} style={{ height: "100%" }}>
                  <Col span={12} className={"left-main"}>
                    <ApiInfo api={selectedApi} codeMap={tsCodeParts} />
                  </Col>

                  <Col span={12} style={{ height: "100%" }}>
                    <CodeCard
                      title="Models"
                      code={tsCodeParts?.Models}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                      }}
                      styles={{
                        body: {
                          flex: 1,
                          overflow: "auto",
                          padding: 0,
                        },
                      }}
                    ></CodeCard>
                  </Col>
                </Row>
              ) : (
                <Empty description={"请选择 API"} />
              )}
            </Layout>
          </Layout>
        </Layout>
      </Spin>
    </>
  );
};

export default Home;
