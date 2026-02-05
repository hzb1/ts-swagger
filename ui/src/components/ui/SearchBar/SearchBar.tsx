import { SearchOutlined } from "@ant-design/icons";
import "./SearchBar.css";
import { Input } from "antd";

const SearchBar = ({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value: string) => void;
}) => {
  return (
    <>
      <div className={"search-bar-wrapper"}>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={"search-input"}
          placeholder="输入路径或方法"
          prefix={<SearchOutlined size={14} className={"search-icon"} />}
          allowClear
        />
        {/*<span className="search-shortcut">⌘ K</span>*/}
      </div>
    </>
  );
};

export default SearchBar;
