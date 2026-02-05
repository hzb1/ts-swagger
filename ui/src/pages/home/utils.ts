import type { ApiDetail } from "../../../types.ts";

export type ApiGroup = {
  id: string;
  name: string;
  children: ApiItem[];
  // 是否展开
  isExpanded: boolean;
};

export type ApiItem = ApiDetail & {
  // 是否选中
  isSelected: boolean;
};
