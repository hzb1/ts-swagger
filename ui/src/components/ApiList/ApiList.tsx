import './ApiList.css'
import {Collapse, type CollapseProps } from "antd";
import Method from "../ui/Method/Method.tsx";


export type ApiGroup = {
  name: string;
  children: ApiItem[]
}

type ApiItem = {
  key: string;
  path: string
  method: string
  summary?: string
}

type Props = {
  apis: ApiGroup[];
  onSelect?: (apiItem: ApiItem) => void
}

const ApiList = ({apis, onSelect}: Props) => {

  const items: CollapseProps['items'] = apis.map((item) => ({
    key: item.name,
    label: `${item.name} (${item.children.length})`,
    children: item.children.map((apiItem) => {
      return (
        <div key={apiItem.key} className={'api-item'} onClick={() => onSelect?.(apiItem)}>
          <div className={'tag-wrapper'}>
            <Method method={apiItem.method} className={'api-item-method'} />
          </div>
          <div className={'api-item-info'}>
            <div className={'api-item-summary'}>{apiItem.summary ?? apiItem.path}</div>
          </div>
        </div>
      )
    }),
  }))

  return <>
    <div className={'api-list-wrapper'}>
      <Collapse className={'api-group'} items={items} size={'small'} expandIconPlacement={'end'} bordered={false} styles={{
        body: {
          padding: 0,
          paddingLeft: 6,
          paddingRight: 6,
          backgroundColor: 'white'
        }
      }}>
      </Collapse>
    </div>
  </>
}

export default ApiList;
