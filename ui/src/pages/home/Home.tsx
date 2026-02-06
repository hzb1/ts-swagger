import React, { useMemo, useState } from "react";
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
import {getApiSlug, stableHash} from "@/utils/getApiSlug.ts";
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

  const ipFromUrl = searchParams.get("ip") ?? options[3].value;
  const serviceUrl = searchParams.get("service") ?? undefined;
  const selectedApiKey = searchParams.get("api");

  // const queryApiKey = searchParams.get("api");

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') ?? '');
  const [inputIp, setInputIp] = useState(ipFromUrl);

  const { documentData, configData, stage, error } = useSwagger({
    ip: ipFromUrl,
    serviceUrl,
    options: {
      // 当 Hook 发现配置加载好了但 URL 没 service 时触发
      onAutoSelectService: (defaultUrl) => {
        setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          next.set("service", defaultUrl);
          return next;
        }, { replace: true });
      },
      onDocumentLoaded: (doc) => {
        if (doc.paths) {
          const allTags = new Set<string>();
          Object.values(doc.paths).forEach((pathItem: any) => {
            ["get", "post", "put", "delete", "patch"].forEach(method => {
              const op = pathItem[method];
              if (op?.tags?.[0]) {
                // 注意：这里的 ID 生成逻辑应与 apiGroups 保持一致
                // 如果你的 SideBar 使用的是 stableHash(tag)，则存入 hash
                allTags.add(stableHash(op.tags[0]));
              }
            });
          });
          setExpandedGroupList(Array.from(allTags));
        }
      }
    }
  });

  const configLoading = stage === 'config';
  const docLoading = stage === 'document';

  const loading = configLoading || docLoading;

  const filteredGroupedApis = useMemo(() => {
    // 这里的 documentData 来自 useSwagger()
    if (!documentData?.paths) return {};

    const query = searchQuery.trim().toLowerCase();
    const groups: Record<string, ApiDetail[]> = {};

    for (const [path, item] of Object.entries(documentData.paths)) {
      // 遍历所有 HTTP 方法
      for (const method of ["get", "post", "put", "delete", "patch"] as const) {
        const op = (item)[method];
        if (!op) continue;

        let matchType = "";
        // 匹配逻辑：路径、摘要或 OperationId
        if (path.toLowerCase().includes(query)) matchType = "路径";
        else if (op.summary?.toLowerCase().includes(query)) matchType = "名称";
        else if (op.operationId?.toLowerCase().includes(query)) matchType = "ID";
        else if (query !== "") continue; // 如果有搜索词但不匹配则跳过

        const tag = op.tags?.[0] ?? "Default";
        (groups[tag] ||= []).push({
          key: getApiSlug({ path, method, operation: op }),
          path,
          method,
          matchType,
          operation: op,
        });
      }
    }

    return groups;
  }, [documentData, searchQuery]);

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

  const handleCommitIp = (nextIp: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("ip", nextIp);
      next.delete("api"); // 切换 IP 时建议清除旧的 API 选中态
      next.delete("service"); // 切换 IP 时也清除旧的服务，触发 Hook 的自动补全
      return next;
    });
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
  // if (expandedGroupList.length === 0 && queryApiKey && apiGroups) {
  //   // 找出当前接口所在的分组
  //   const currentGroup = apiGroups.find((group) =>
  //     group.children.some((api) => api.key === queryApiKey),
  //   );
  //   if (currentGroup) {
  //     setExpandedGroupList([currentGroup.id]);
  //   }
  // }

  return (
    <>
      <Spin spinning={loading}>
        <Layout className={"views"} hasSider={true}>
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
                  value={inputIp}
                  onChange={(value) => setInputIp(value)}
                  onSelect={handleCommitIp}
                  options={options}
                  style={{ width: 304 }}
                >
                  <Input.Search placeholder="输入 IP 地址" enterButton loading={loading} onSearch={(value) => handleCommitIp(value)} />
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
