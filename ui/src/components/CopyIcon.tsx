import {CopyOutlined} from "@ant-design/icons";
import {Tooltip} from "antd";

const CopyIcon = (props: {
  onClick: () => void;
}) => {
  return <Tooltip title="复制"> <CopyOutlined onClick={() => props?.onClick()}/> </Tooltip>
}

export default CopyIcon;
