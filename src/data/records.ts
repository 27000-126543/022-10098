import type { Customer } from "./customers";
import type { Project } from "./projects";
import type { ConsentTemplate } from "./templates";

export type SignStatus =
  | "pending"
  | "explaining"
  | "ready_to_sign"
  | "completed"
  | "exception";

export interface SignRecord {
  id: string;
  customerId: Customer["id"];
  customerName: string;
  phone: string;
  projectId: Project["id"];
  projectName: string;
  templateId: ConsentTemplate["id"];
  templateName: string;
  doctor: string;
  consultant: string;
  status: SignStatus;
  statusLabel: string;
  signDate: string;
  signTime?: string;
  completedAt?: string;
  exceptionType?: string;
  exceptionRemark?: string;
  currentStep?: string;
  nextAction?: string;
}

export const signStatusMap: Record<SignStatus, { label: string; color: string }> = {
  pending: { label: "待核验", color: "#F59E0B" },
  explaining: { label: "讲解中", color: "#3B82F6" },
  ready_to_sign: { label: "待签署", color: "#8B5CF6" },
  completed: { label: "已完成", color: "#10B981" },
  exception: { label: "异常", color: "#EF4444" },
};

export const records: SignRecord[] = [
  {
    id: "REC20260622001",
    customerId: "CUST001",
    customerName: "王美丽",
    phone: "138****5678",
    projectId: "PROJ001",
    projectName: "玻尿酸填充",
    templateId: "TPL-HA-001",
    templateName: "玻尿酸注射类知情同意书",
    doctor: "张医生",
    consultant: "刘咨询师",
    status: "completed",
    statusLabel: "已完成",
    signDate: "2026-06-22",
    signTime: "09:35",
    completedAt: "2026-06-22 10:12",
    currentStep: "签署完成",
    nextAction: "可前往注射室接受治疗",
  },
  {
    id: "REC20260622002",
    customerId: "CUST002",
    customerName: "李芳华",
    phone: "139****2345",
    projectId: "PROJ004",
    projectName: "热玛吉",
    templateId: "TPL-PE-001",
    templateName: "光电类知情同意书",
    doctor: "李医生",
    consultant: "赵咨询师",
    status: "explaining",
    statusLabel: "讲解中",
    signDate: "2026-06-22",
    signTime: "10:20",
    currentStep: "风险讲解环节",
    nextAction: "咨询师正在讲解适应症和禁忌症段落",
  },
  {
    id: "REC20260622003",
    customerId: "CUST003",
    customerName: "陈雅婷",
    phone: "137****8901",
    projectId: "PROJ005",
    projectName: "蛋白线提升",
    templateId: "TPL-TH-001",
    templateName: "埋线类知情同意书",
    doctor: "王医生",
    consultant: "孙咨询师",
    status: "ready_to_sign",
    statusLabel: "待签署",
    signDate: "2026-06-22",
    signTime: "11:05",
    currentStep: "讲解完成，等待签署",
    nextAction: "请顾客确认术前信息齐全后进行电子签署",
  },
  {
    id: "REC20260621001",
    customerId: "CUST-OLD001",
    customerName: "张晓琳",
    phone: "136****4567",
    projectId: "PROJ003",
    projectName: "光子嫩肤",
    templateId: "TPL-PE-001",
    templateName: "光电类知情同意书",
    doctor: "张医生",
    consultant: "刘咨询师",
    status: "completed",
    statusLabel: "已完成",
    signDate: "2026-06-21",
    signTime: "14:30",
    completedAt: "2026-06-21 15:08",
    currentStep: "签署完成",
    nextAction: "治疗已完成，需按医嘱进行术后护理",
  },
  {
    id: "REC20260621002",
    customerId: "CUST-OLD002",
    customerName: "林梦洁",
    phone: "135****7890",
    projectId: "PROJ002",
    projectName: "肉毒素除皱",
    templateId: "TPL-HA-001",
    templateName: "玻尿酸注射类知情同意书",
    doctor: "李医生",
    consultant: "赵咨询师",
    status: "exception",
    statusLabel: "异常",
    signDate: "2026-06-21",
    signTime: "15:45",
    exceptionType: "顾客临时放弃",
    exceptionRemark: "顾客在签署阶段临时决定改期，表示回家与家人商量后再预约",
    currentStep: "签署中止",
    nextAction: "前台需3个工作日内回访确认是否重新安排",
  },
  {
    id: "REC20260621003",
    customerId: "CUST-OLD003",
    customerName: "黄思琪",
    phone: "134****1234",
    projectId: "PROJ006",
    projectName: "埋线双眼皮",
    templateId: "TPL-TH-001",
    templateName: "埋线类知情同意书",
    doctor: "王医生",
    consultant: "孙咨询师",
    status: "completed",
    statusLabel: "已完成",
    signDate: "2026-06-21",
    signTime: "16:20",
    completedAt: "2026-06-21 17:02",
    currentStep: "签署完成",
    nextAction: "治疗已完成，7天后复诊评估双眼皮形态",
  },
  {
    id: "REC20260620001",
    customerId: "CUST-OLD004",
    customerName: "吴佳怡",
    phone: "133****5678",
    projectId: "PROJ001",
    projectName: "玻尿酸填充",
    templateId: "TPL-HA-001",
    templateName: "玻尿酸注射类知情同意书",
    doctor: "张医生",
    consultant: "刘咨询师",
    status: "pending",
    statusLabel: "待核验",
    signDate: "2026-06-20",
    signTime: "-",
    currentStep: "顾客预约未到店",
    nextAction: "前台联系顾客确认是否改期或取消预约",
  },
  {
    id: "REC20260620002",
    customerId: "CUST-OLD005",
    customerName: "郑雨桐",
    phone: "132****9012",
    projectId: "PROJ005",
    projectName: "蛋白线提升",
    templateId: "TPL-TH-001",
    templateName: "埋线类知情同意书",
    doctor: "李医生",
    consultant: "赵咨询师",
    status: "exception",
    statusLabel: "异常",
    signDate: "2026-06-20",
    signTime: "10:15",
    exceptionType: "身份信息不符",
    exceptionRemark: "顾客提供的身份证后四位与预约系统记录不符，需重新核验身份后发起流程",
    currentStep: "核验未通过",
    nextAction: "请顾客携带有效身份证件重新核验后再次发起签署流程",
  },
];

export default records;
