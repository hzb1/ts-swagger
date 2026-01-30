import './SideBar.css'
import {Empty, Select} from "antd";
import SearchBar from "../ui/SearchBar/SearchBar.tsx";
import type {SwaggerApi} from "../../pages/home/utils.ts";
import ApiList from "../ApiList/ApiList.tsx";

type Option = {
  label: string
  value: string
}

type SideBarProps = {
  currentServiceUrl: string
  onCurrentServiceUrlChange: (url: string) => void
  configLoading: boolean
  serviceOptions: Option[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  docLoading?: boolean
  apiGroups: SwaggerApi[][]
  onMenuSelect: (key: string) => void
}

const SideBar = (props: SideBarProps) => {
  const {
    currentServiceUrl,
    onCurrentServiceUrlChange,
    configLoading,
    serviceOptions,
    searchQuery,
    setSearchQuery,
    docLoading,
    apiGroups,
    onMenuSelect,
  } = props;

  const handleServiceChange = (url: string) => {
    onCurrentServiceUrlChange(url);
  }

  return (
    <div
      className={'sidebar hidden lg:flex fixed flex-col left-0 top-0 bottom-0 w-[19rem] border-r border-gray-200/70 dark:border-white/[0.07] h-full'}>
      <div className={'h-full flex flex-col flex-1 stable-scrollbar-gutter px-7 py-6'}>
        <div className={'flex justify-between items-center'}>
          <a href="/" className={'logo'}>
            Logo
          </a>
        </div>

        <div className={'flex flex-col gap-4 mt-6'}>

          <Select
            value={currentServiceUrl}
            loading={configLoading}
            onChange={handleServiceChange}
            options={serviceOptions}
            placeholder={'选择服务'}
          />

          <div className={'relative hidden lg:flex items-center flex-1 z-20 justify-center'}>
            <SearchBar value={searchQuery} onChange={setSearchQuery}/>
          </div>
        </div>

        <div className={'flex-1 pt-4 overflow-y-hidden flex flex-col'}>
          <div className={'h-full overflow-y-auto flex-1'}>
            {
              apiGroups?.length ? <ApiList apis={apiGroups} onSelect={onMenuSelect}/> :
                <Empty description={'暂无 API 接口'}/>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

export default SideBar;
