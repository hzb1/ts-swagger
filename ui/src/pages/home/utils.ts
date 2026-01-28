
interface SwaggerParameter {
  name: string
  in: 'query' | 'path' | 'header' | 'cookie'
  required: boolean
  schema?: { type: string }
}

export interface SwaggerApi {
  path: string
  method: string
  summary?: string
  parameters?: SwaggerParameter[]
  requestBody?: never
}


//  通过key 找出selectedApi
export const findSelectedApi = (apiList: SwaggerApi[][], key: string): SwaggerApi | undefined => {
  let findApi;
  apiList?.forEach((apis) => {
    apis.forEach((api) => {
      if (key === api.key) {
        findApi = api;
      }
    })
  })
}
