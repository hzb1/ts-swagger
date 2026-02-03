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
  // 当前选择的api
  selectedKey?: string | null;
  onSelectKeyChange?: (selectedKey: string) => void;
  // 当前展开的分组索引
  expanded?: string[];
  // 当前展开的分组索引发生变化时的回调
  onExpandChange: (expanded: string[]) => void;
};

const ApiList: React.FC<ApiListProps> = ({
  apis,
  selectedKey,
  onSelectKeyChange,
  onExpandChange,
  expanded,
}) => {
  return (
    <>
      {apis.map((groupItem) => {
        const groupName = groupItem.children.length
          ? `${groupItem.name} (${groupItem.children.length})`
          : groupItem.name;

        // 是否展开
        const isExpanded = groupItem.isExpanded;

        return (
          <div className={"mt-6 lg:mt-8"} key={groupItem.id}>
            <div
              className={
                "sidebar-group-header flex items-center gap-2.5 mb-3.5 lg:mb-2.5 text-gray-900 dark:text-gray-200 font-medium"
              }
            >
              <h5>{groupName}</h5>
              <p>{JSON.stringify(isExpanded)}</p>
            </div>
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
          </div>
        );
      })}
    </>
  );
};

// const ApiList = ({ apis, onSelect }: Props) => {
//   const items: CollapseProps["items"] = apis.map((item) => ({
//     key: item.name,
//     label: `${item.name} (${item.children.length})`,
//     children: item.children.map((apiItem) => {
//       const operation = apiItem.operation;
//       return (
//         <div
//           key={apiItem.key}
//           className={"api-item"}
//           onClick={() => onSelect?.(apiItem)}
//         >
//           <div className={"tag-wrapper"}>
//             <Method method={apiItem.method} className={"api-item-method"} />
//           </div>
//           <div className={"api-item-info"}>
//             <div className={"api-item-summary"}>
//               {operation?.summary ?? apiItem.path}
//             </div>
//           </div>
//         </div>
//       );
//     }),
//   }));
//
//   return (
//     <>
//       <div className={"api-list-wrapper"}>
//         <Collapse
//           className={"api-group"}
//           items={items}
//           size={"small"}
//           expandIconPlacement={"end"}
//           bordered={false}
//           styles={{
//             body: {
//               padding: 0,
//               paddingLeft: 6,
//               paddingRight: 6,
//               backgroundColor: "white",
//             },
//           }}
//         ></Collapse>
//       </div>
//     </>
//   );
// };

export default ApiList;
