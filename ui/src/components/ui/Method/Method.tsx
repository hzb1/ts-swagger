import {Tag} from "antd";


const tagColorMap: Record<string, string> = {
  GET: 'blue',
  POST: 'green',
  PUT: 'orange',
  DELETE: 'red',
}

const methodTextMap: Record<string, string> = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DEL',
}

const Method = ({method, className}: { method: string, className?: string }) => {
  const tagColor = tagColorMap[method] ?? 'blue'
  const methodText = methodTextMap[method] ?? method
  return (
    <Tag className={className} color={tagColor}>{methodText}</Tag>
  )
}

export default Method
