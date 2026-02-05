import "./ApiList.css";
import type { ApiDetail } from "../../../types.ts";
import ApiItem from "./ApiItem.tsx";
import React from "react";

export type ApiGroup = {
  id: string;
  name: string;
  children: ApiItem[];
  // 是否展开
  isExpanded: boolean;
};

type ApiItem = ApiDetail & {
  // 是否选中
  isSelected: boolean;
};

export type ApiListProps = {
  apis: ApiGroup[];
  onSelectKeyChange?: (selectedKey: string) => void;
  // 当前展开的分组索引发生变化时的回调
  // onExpandChange: (expanded: string[]) => void;
  // 点击分组标题时触发
  onGroupTitleClick?: (groupItem: ApiGroup) => void;
};

const ApiList: React.FC<ApiListProps> = ({
  apis,
  onSelectKeyChange,
   onGroupTitleClick,
}) => {

  const handleGroupTitleClick = (groupItem: ApiGroup) => {
    onGroupTitleClick?.(groupItem);
  };

  return (
    <>
      {apis.map((groupItem) => {
        const groupName = groupItem.children.length
          ? `${groupItem.name} (${groupItem.children.length})`
          : groupItem.name;

        // 是否展开
        const isExpanded = groupItem.isExpanded;

        return (
          <div className={"mb-4"} key={groupItem.id}>
            <div
              className={
                "sidebar-group-header flex items-center gap-2.5 mb-3.5 lg:mb-2.5 text-gray-900 dark:text-gray-200 font-medium"
              }
              onClick={() => handleGroupTitleClick(groupItem)}
            >
              <h5>{groupName}</h5>
            </div>
            {
              isExpanded && (
                <ul>
                  {groupItem.children.map((apiItem) => {
                    return (
                      <ApiItem
                        apiItem={apiItem}
                        key={apiItem.key}
                        onClick={() => onSelectKeyChange?.(apiItem.key)}
                      />
                    );
                  })}
                </ul>
              )
            }

          </div>
        );
      })}
    </>
  );
};

export default ApiList;
