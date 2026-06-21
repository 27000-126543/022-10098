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
  projectIds: string[];
  projectNames: string[];
  doctor: string;
  signerType: SignerType;
  signerName: string;
  guardianRelation?: string;
  explainedSections: string[];
  confirmedKeyRisks: string[];
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
}

export interface ExceptionRecord {
  id: string;
  customerId: string;
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
}

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
