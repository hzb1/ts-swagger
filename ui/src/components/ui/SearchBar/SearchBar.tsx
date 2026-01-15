import {SearchOutlined} from "@ant-design/icons";
import './SearchBar.css'

const SearchBar = ({value, onChange}: { value: string; onChange: (value: string) => void }) => {
  return <>
    <div className={'search-bar-wrapper'}>
      <SearchOutlined size={14} className={'search-icon'}/>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={'search-input'}
        placeholder="输入路径或方法"
      />
      <span className="search-shortcut">⌘ K</span>
    </div>
  </>
}

export default SearchBar
