import './ApiList.css'

type ApiItem = {
  path: string
  method: string
  summary?: string
  requestBody?: any
}

type Props = {
  apis: ApiItem[]
}

const ApiList = ({apis}: Props) => {
  return <>
    <div className={'api-list-wrapper'}>
      {apis.map((item) => (
        <div key={item.path + item.method} className={'api-item'}>
          <div className={'api-item-method'}>{item.method}</div>
          <div className={'api-item-path'}>{item.path}</div>
        </div>
      ))}
    </div>
  </>
}

export default ApiList;
