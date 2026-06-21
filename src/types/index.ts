export interface Customer {
  id: string;
  name: string;
  phone: string;
  idCardLast4: string;
  fullIdCard?: string;
  appointmentId: string;
  appointmentDate: string;
  doctor: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  category: 'hyaluronic' | 'photoelectric' | 'thread' | 'other';
  categoryLabel: string;
  consentTemplateId: string;
}

export interface ConsentTemplate {
  id: string;
  name: string;
  applicableProjects: string[];
  sections: ConsentSection[];
}

export interface ConsentSection {
  id: string;
  title: '适应症' | '禁忌症' | '恢复期' | '并发症';
  content: string;
  keyTerms: TermRef[];
  isKeyRisk: boolean;
}

export interface TermRef {
  word: string;
  termId: string;
}

export interface Term {
  id: string;
  word: string;
  simpleExplanation: string;
  detailExplanation?: string;
  illustrationUrl?: string;
}

export type SignerType = 'self' | 'guardian' | 'representative';

export interface PreCheckStatus {
  photo: boolean;
  allergy: boolean;
  medication: boolean;
}

export type SignStatus =
  | 'pending'
  | 'explaining'
  | 'ready_to_sign'
  | 'completed'
  | 'exception';

export interface SignRecord {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerIdCardLast4: string;
  appointmentId: string;
  projectIds: string[];
  projectNames: string[];
  doctor: string;
  consentTemplateId: string;
  consentTemplateName: string;
  signerType: SignerType;
  signerName: string;
  guardianRelation?: string;
  explainedSections: string[];
  explainedSectionTitles: string[];
  confirmedKeyRisks: string[];
  confirmedKeyRiskTitles: string[];
  keySentenceSignature: string;
  customerSignature: string;
  preOpPhotoDone: boolean;
  allergyHistoryDone: boolean;
  medicationHistoryDone: boolean;
  status: SignStatus;
  currentStep: number;
  nextAction: string;
  signTime?: string;
  createTime: string;
  exceptionId?: string;
  exceptionType?: string;
  exceptionTypeLabel?: string;
  exceptionDescription?: string;
  exceptionMeasures?: string;
  exceptionProgress?: ExceptionProgress;
  exceptionResolved?: boolean;
}

export type ExceptionProgress =
  | 'reported'
  | 'investigating'
  | 'resolved'
  | 'sign_resumed';

export interface ExceptionRecord {
  id: string;
  customerId: string;
  customerName: string;
  signRecordId?: string;
  type:
    | 'info_mismatch'
    | 'customer_refused'
    | 'device_failure'
    | 'incomplete_info'
    | 'other';
  typeLabel: string;
  description: string;
  handler: string;
  handleTime: string;
  measures: string;
  resolved: boolean;
  resolvedTime?: string;
  progress: ExceptionProgress;
  urgency: 'normal' | 'urgent' | 'critical';
  timeline: Array<{
    time: string;
    action: string;
    operator: string;
  }>;
}

export const EXCEPTION_TYPE_LABELS: Record<ExceptionRecord['type'], string> = {
  info_mismatch: '顾客信息与预约不符',
  customer_refused: '顾客放弃签署/拒签',
  device_failure: '设备/系统故障',
  incomplete_info: '术前信息无法补齐',
  other: '其他异常',
};

export const EXCEPTION_PROGRESS_LABELS: Record<ExceptionProgress, string> = {
  reported: '已登记',
  investigating: '处理中',
  resolved: '已解决',
  sign_resumed: '已重启签署',
};

export const STEP_ROUTE_MAP: Record<number, string> = {
  0: '/',
  1: '/projects',
  2: '/risk-explain',
  3: '/sign',
  4: '/archive',
  5: '/archive',
};

export const SIGNER_TYPE_LABELS: Record<SignerType, string> = {
  self: '本人',
  guardian: '监护人',
  representative: '代签人',
};

export interface AppState {
  currentCustomer: Customer | null;
  selectedProjects: ProjectItem[];
  currentTemplate: ConsentTemplate | null;
  explainedSections: string[];
  confirmedKeyRisks: string[];
  preCheckStatus: PreCheckStatus;
  signerType: SignerType;
  signerName: string;
  guardianRelation: string;
  keySentenceDataUrl: string | null;
  signatureDataUrl: string | null;
  currentRoute: string;
}
