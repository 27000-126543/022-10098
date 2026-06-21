export type ProjectCategory = "hyaluronic" | "photoelectric" | "thread";

export interface Project {
  id: string;
  name: string;
  category: ProjectCategory;
  categoryLabel: string;
  description: string;
  duration: string;
}

export const projects: Project[] = [
  {
    id: "PROJ001",
    name: "玻尿酸填充",
    category: "hyaluronic",
    categoryLabel: "注射类",
    description: "通过注射玻尿酸改善面部轮廓、填充凹陷、抚平皱纹，达到年轻化效果",
    duration: "30-60分钟",
  },
  {
    id: "PROJ002",
    name: "肉毒素除皱",
    category: "hyaluronic",
    categoryLabel: "注射类",
    description: "注射肉毒素放松表情肌，改善鱼尾纹、抬头纹、眉间纹等动态皱纹",
    duration: "20-40分钟",
  },
  {
    id: "PROJ003",
    name: "光子嫩肤",
    category: "photoelectric",
    categoryLabel: "光电类",
    description: "利用强脉冲光技术改善肤色暗沉、色斑、红血丝，收缩毛孔，提亮肤色",
    duration: "40-60分钟",
  },
  {
    id: "PROJ004",
    name: "热玛吉",
    category: "photoelectric",
    categoryLabel: "光电类",
    description: "单极射频技术深层加热真皮层，刺激胶原再生，实现紧致提拉抗衰效果",
    duration: "60-120分钟",
  },
  {
    id: "PROJ005",
    name: "蛋白线提升",
    category: "thread",
    categoryLabel: "埋线类",
    description: "植入可吸收蛋白线，提拉松弛组织，刺激胶原新生，改善面部下垂",
    duration: "60-90分钟",
  },
  {
    id: "PROJ006",
    name: "埋线双眼皮",
    category: "thread",
    categoryLabel: "埋线类",
    description: "通过缝合方式将缝线埋藏于皮肤及睑板之间，形成重睑效果",
    duration: "30-45分钟",
  },
];

export default projects;
