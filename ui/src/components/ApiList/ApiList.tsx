// import "./ApiList.css";
import type { ApiDetail } from "../../../types.ts";
import React from "react";

export type ApiGroup = {
  id: string;
  name: string;
  children: ApiItem[];
  // 是否展开
  isExpanded?: boolean;
};

type ApiItem = ApiDetail & {
  // 是否选中
  isSelected?: boolean;
};

export type ApiListProps = {
  apis: ApiGroup[];
  // 当前选择的api
  selectedKey?: string | null;
  onSelectKeyChange?: (selectedKey: string) => void;
  // 当前展开的分组索引
  expanded?: string[];
  // 当前展开的分组索引发生变化时的回调
  onExpandChange?: (expanded: string[]) => void;
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
        const isExpanded = expanded?.includes(groupItem.id) ?? false;

        return (
          <div className={"mt-6 lg:mt-8"} key={groupItem.id}>
            <div
              className={
                "sidebar-group-header flex items-center gap-2.5 pl-4 mb-3.5 lg:mb-2.5 text-gray-900 dark:text-gray-200 font-medium"
              }
            >
              <h5>{groupName}</h5>
              <p>{isExpanded ? "收起" : "展开"}</p>
            </div>
            <ul>
              {groupItem.children.map((apiItem) => {
                const apiName = apiItem.operation?.summary ?? apiItem.path;
                const { isSelected } = apiItem;

                return (
                  <li
                    key={apiItem.key}
                    id={apiItem.key}
                    className={"relative scroll-m-4 first:scroll-m-20"}
                  >
                    <a
                      // className={
                      //   "group flex items-center pr-3 " +
                      //   "cursor-pointer gap-x-3 text-left break-words hyphens-auto ml-4 border-l py-2 lg:py-1.5 w-[calc(100%-1rem)] " +
                      //   "border-primary dark:border-primary-light text-primary [text-shadow:-0.2px_0_0_currentColor,0.2px_0_0_currentColor] " +
                      //   "dark:text-primary-light pl-7 pr-7" +
                      //   `${isSelected ? "bg-primary text-white" : ""}`
                      // }
                      className={`
                      group flex items-center pr-3 cursor-pointer gap-x-3 text-left break-words hyphens-auto ml-4 border-l py-2 lg:py-1.5 w-[calc(100%-1rem)] 
                      border-gray-950/5 dark:border-white/10 hover:border-gray-950/20 dark:hover:border-white/20 text-gray-700 
                      hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 pl-7 pr-7
                        ${isSelected ? "bg-primary text-primary " : ""}
                      `}
                      onClick={() => onSelectKeyChange?.(apiItem.key)}
                    >
                      <span className={"method-nav-pill flex items-center w-8"}>
                        <span
                          className={
                            "px-1 py-0.5 rounded-md text-[0.55rem] leading-tight font-bold bg-[#3064E3] text-[#FFFFFF]"
                          }
                        >
                          {apiItem.method}
                        </span>
                      </span>
                      <div className={"flex-1 flex items-center space-x-2.5"}>
                        {apiName}
                      </div>
                    </a>
                  </li>
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
