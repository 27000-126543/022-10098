import { create } from 'zustand';
import type {
  Customer,
  ProjectItem,
  ConsentTemplate,
  SignerType,
  SignRecord,
  ExceptionRecord,
  SignStatus,
  ExceptionProgress,
} from '@/types';
import { customers } from '@/data/customers';
import { projects } from '@/data/projects';
import { templates } from '@/data/templates';
import { records as mockRecords } from '@/data/records';
import { STEP_ROUTE_MAP } from '@/types';
import type { SignRecord as MockSignRecord } from '@/data/records';

const STORAGE_KEY = 'medical_sign_flow_records_v1';
const EXCEPTION_STORAGE_KEY = 'medical_sign_flow_exceptions_v1';

function convertMockRecord(r: MockSignRecord): SignRecord {
  const statusStepMap: Record<string, number> = {
    pending: 0,
    explaining: 2,
    ready_to_sign: 3,
    completed: 4,
    exception: 0,
  };

  return {
    id: r.id,
    customerId: r.customerId,
    customerName: r.customerName,
    customerPhone: r.phone,
    customerIdCardLast4: '0000',
    appointmentId: r.id,
    projectIds: [r.projectId],
    projectNames: [r.projectName],
    doctor: r.doctor,
    consentTemplateId: r.templateId,
    consentTemplateName: r.templateName,
    preOpPhotoDone: false,
    allergyHistoryDone: false,
    medicationHistoryDone: false,
    signerType: 'self',
    signerName: r.customerName,
    explainedSections: [],
    explainedSectionTitles: [],
    confirmedKeyRisks: [],
    confirmedKeyRiskTitles: [],
    keySentenceSignature: '',
    customerSignature: '',
    currentStep: statusStepMap[r.status] ?? 0,
    nextAction: r.nextAction ?? '',
    exceptionType: r.exceptionType,
    exceptionTypeLabel: r.exceptionType,
    exceptionDescription: r.exceptionRemark,
    status: r.status,
    createTime: r.signDate + (r.signTime && r.signTime !== '-' ? ' ' + r.signTime : ''),
    signTime: r.completedAt,
  };
}

function convertMockRecords(): SignRecord[] {
  return mockRecords.map(convertMockRecord);
}

function mergeRecords(persisted: SignRecord[], mock: SignRecord[]): SignRecord[] {
  const map = new Map<string, SignRecord>();
  mock.forEach((r) => map.set(r.id, r));
  persisted.forEach((r) => map.set(r.id, r));
  return Array.from(map.values());
}

function loadPersistedRecords(): SignRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as SignRecord[];
    return [];
  } catch {
    return [];
  }
}

function persistRecords(records: SignRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    /* noop */
  }
}

function loadPersistedExceptions(): ExceptionRecord[] {
  try {
    const raw = localStorage.getItem(EXCEPTION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as ExceptionRecord[];
    return [];
  } catch {
    return [];
  }
}

function persistExceptions(records: ExceptionRecord[]) {
  try {
    localStorage.setItem(EXCEPTION_STORAGE_KEY, JSON.stringify(records));
  } catch {
    /* noop */
  }
}

interface SignFlowState {
  currentCustomer: Customer | null;
  selectedProjects: ProjectItem[];
  currentTemplate: ConsentTemplate | null;
  explainedSections: string[];
  confirmedKeyRisks: string[];
  preCheckStatus: { photo: boolean; allergy: boolean; medication: boolean };
  signerType: SignerType;
  signerName: string;
  guardianRelation: string;
  keySentenceDataUrl: string | null;
  signatureDataUrl: string | null;
  signRecords: SignRecord[];
  exceptionRecords: ExceptionRecord[];
  activeSignRecordId: string | null;
}

interface SignFlowActions {
  setCustomer: (customer: Customer) => void;
  toggleProject: (projectId: string, allProjects: ProjectItem[]) => void;
  setCurrentTemplate: (template: ConsentTemplate | null) => void;
  toggleExplainedSection: (sectionId: string) => void;
  toggleKeyRisk: (sectionId: string) => void;
  setPreCheck: (
    key: 'photo' | 'allergy' | 'medication',
    value: boolean
  ) => void;
  setSignerType: (type: SignerType) => void;
  setSignerName: (name: string) => void;
  setGuardianRelation: (rel: string) => void;
  setKeySentenceSignature: (url: string) => void;
  setCustomerSignature: (url: string) => void;
  addSignRecord: (record: SignRecord) => void;
  updateSignRecord: (id: string, patch: Partial<SignRecord>) => void;
  resumeSignRecord: (recordId: string) => boolean;
  addExceptionRecord: (record: ExceptionRecord) => void;
  updateExceptionRecord: (id: string, patch: Partial<ExceptionRecord>) => void;
  resolveException: (exceptionId: string, measures: string) => void;
  restartSignFromException: (exceptionId: string) => string;
  setActiveSignRecordId: (id: string | null) => void;
  resetAll: () => void;
}

const initialInnerState: Omit<SignFlowState, 'signRecords' | 'exceptionRecords'> = {
  currentCustomer: null,
  selectedProjects: [],
  currentTemplate: null,
  explainedSections: [],
  confirmedKeyRisks: [],
  preCheckStatus: { photo: false, allergy: false, medication: false },
  signerType: 'self',
  signerName: '',
  guardianRelation: '',
  keySentenceDataUrl: null,
  signatureDataUrl: null,
  activeSignRecordId: null,
};

export const useSignFlowStore = create<SignFlowState & SignFlowActions>(
  (set, get) => ({
    ...initialInnerState,
    signRecords: mergeRecords(loadPersistedRecords(), convertMockRecords()),
    exceptionRecords: loadPersistedExceptions(),

    setCustomer: (customer) => set({ currentCustomer: customer }),

    toggleProject: (projectId, allProjects) =>
      set((state) => {
        const exists = state.selectedProjects.some((p) => p.id === projectId);
        if (exists) {
          return {
            selectedProjects: state.selectedProjects.filter(
              (p) => p.id !== projectId
            ),
          };
        } else {
          const project = allProjects.find((p) => p.id === projectId);
          if (project) {
            return {
              selectedProjects: [...state.selectedProjects, project],
            };
          }
          return state;
        }
      }),

    setCurrentTemplate: (template) => set({ currentTemplate: template }),

    toggleExplainedSection: (sectionId) =>
      set((state) => {
        const exists = state.explainedSections.includes(sectionId);
        if (exists) {
          return {
            explainedSections: state.explainedSections.filter(
              (id) => id !== sectionId
            ),
          };
        } else {
          return {
            explainedSections: [...state.explainedSections, sectionId],
          };
        }
      }),

    toggleKeyRisk: (sectionId) =>
      set((state) => {
        const exists = state.confirmedKeyRisks.includes(sectionId);
        if (exists) {
          return {
            confirmedKeyRisks: state.confirmedKeyRisks.filter(
              (id) => id !== sectionId
            ),
          };
        } else {
          return {
            confirmedKeyRisks: [...state.confirmedKeyRisks, sectionId],
          };
        }
      }),

    setPreCheck: (key, value) =>
      set((state) => ({
        preCheckStatus: { ...state.preCheckStatus, [key]: value },
      })),

    setSignerType: (type) => set({ signerType: type }),

    setSignerName: (name) => set({ signerName: name }),

    setGuardianRelation: (rel) => set({ guardianRelation: rel }),

    setKeySentenceSignature: (url) => set({ keySentenceDataUrl: url }),

    setCustomerSignature: (url) => set({ signatureDataUrl: url }),

    addSignRecord: (record) =>
      set((state) => {
        const next = [...state.signRecords, record];
        persistRecords(next);
        return { signRecords: next, activeSignRecordId: record.id };
      }),

    updateSignRecord: (id, patch) =>
      set((state) => {
        const next = state.signRecords.map((record) =>
          record.id === id ? { ...record, ...patch } : record
        );
        persistRecords(next);
        return { signRecords: next };
      }),

    resumeSignRecord: (recordId) => {
      const state = get();
      const record = state.signRecords.find((r) => r.id === recordId);
      if (!record) return false;

      let customer = customers.find((c) => c.id === record.customerId);
      if (!customer) {
        customer = customers.find((c) => c.name === record.customerName);
      }
      if (!customer) {
        customer = {
          id: record.customerId,
          name: record.customerName,
          phone: record.customerPhone ?? record.customerId,
          idCardLast4: record.customerIdCardLast4 ?? '0000',
          appointmentId: record.appointmentId ?? record.id,
          appointmentDate: record.createTime?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
          doctor: record.doctor,
        };
      }

      let selectedProjs: ProjectItem[] = projects.filter((p) =>
        record.projectIds?.includes(p.id)
      ) as unknown as ProjectItem[];
      if (selectedProjs.length === 0 && record.projectNames) {
        selectedProjs = projects.filter((p) =>
          record.projectNames.some((name) => p.name === name)
        ) as unknown as ProjectItem[];
      }
      if (selectedProjs.length === 0 && record.projectNames) {
        selectedProjs = record.projectNames.map((name, idx) => ({
          id: record.projectIds?.[idx] ?? `PROJ-MOCK-${idx}`,
          name,
          category: 'other' as const,
          categoryLabel: '其他',
          consentTemplateId: record.consentTemplateId ?? '',
        }));
      }

      let template = templates.find(
        (t) => t.id === record.consentTemplateId
      );
      if (!template && record.consentTemplateName) {
        template = templates.find(
          (t) => t.name === record.consentTemplateName
        );
      }
      if (!template && selectedProjs.length > 0) {
        const category = selectedProjs[0].category;
        template = templates.find((t) =>
          t.applicableProjects.includes(selectedProjs[0].id)
        );
      }
      if (!template) {
        template = templates[0];
      }

      set({
        currentCustomer: customer,
        selectedProjects: selectedProjs as unknown as ProjectItem[],
        currentTemplate: template as unknown as ConsentTemplate,
        explainedSections: record.explainedSections ?? [],
        confirmedKeyRisks: record.confirmedKeyRisks ?? [],
        preCheckStatus: {
          photo: record.preOpPhotoDone ?? false,
          allergy: record.allergyHistoryDone ?? false,
          medication: record.medicationHistoryDone ?? false,
        },
        signerType: record.signerType ?? 'self',
        signerName: record.signerName ?? record.customerName,
        guardianRelation: record.guardianRelation ?? '',
        keySentenceDataUrl: record.keySentenceSignature ?? null,
        signatureDataUrl: record.customerSignature ?? null,
        activeSignRecordId: recordId,
      });

      return true;
    },

    addExceptionRecord: (record) =>
      set((state) => {
        const nextExceptions = [...state.exceptionRecords, record];
        persistExceptions(nextExceptions);

        let nextSignRecords = state.signRecords;
        if (record.signRecordId) {
          nextSignRecords = state.signRecords.map((r) =>
            r.id === record.signRecordId
              ? {
                  ...r,
                  status: 'exception' as SignStatus,
                  exceptionId: record.id,
                  exceptionType: record.type,
                  exceptionTypeLabel: record.typeLabel,
                  exceptionDescription: record.description,
                  exceptionMeasures: record.measures,
                  exceptionProgress: record.progress,
                  exceptionResolved: false,
                }
              : r
          );
          persistRecords(nextSignRecords);
        }

        return {
          exceptionRecords: nextExceptions,
          signRecords: nextSignRecords,
        };
      }),

    updateExceptionRecord: (id, patch) =>
      set((state) => {
        const next = state.exceptionRecords.map((record) =>
          record.id === id ? { ...record, ...patch } : record
        );
        persistExceptions(next);
        return { exceptionRecords: next };
      }),

    resolveException: (exceptionId, measures) =>
      set((state) => {
        const now = new Date().toISOString();
        const nextExceptions = state.exceptionRecords.map((record) =>
          record.id === exceptionId
            ? {
                ...record,
                resolved: true,
                resolvedTime: now,
                progress: 'resolved' as ExceptionProgress,
                measures,
                timeline: [
                  ...record.timeline,
                  {
                    time: now,
                    action: '异常已解决',
                    operator: record.handler,
                  },
                ],
              }
            : record
        );
        persistExceptions(nextExceptions);

        const exception = state.exceptionRecords.find(
          (e) => e.id === exceptionId
        );
        let nextSignRecords = state.signRecords;
        if (exception?.signRecordId) {
          nextSignRecords = state.signRecords.map((r) =>
            r.id === exception.signRecordId
              ? {
                  ...r,
                  exceptionMeasures: measures,
                  exceptionProgress: 'resolved' as ExceptionProgress,
                  exceptionResolved: true,
                }
              : r
          );
          persistRecords(nextSignRecords);
        }

        return {
          exceptionRecords: nextExceptions,
          signRecords: nextSignRecords,
        };
      }),

    restartSignFromException: (exceptionId) => {
      const state = get();
      const exception = state.exceptionRecords.find(
        (e) => e.id === exceptionId
      );

      if (!exception?.signRecordId) {
        return '/';
      }

      let signRecord = state.signRecords.find(
        (r) => r.id === exception.signRecordId
      );

      if (!signRecord) {
        signRecord = state.signRecords.find(
          (r) => r.customerId === exception.customerId
        );
      }

      if (!signRecord) {
        return '/';
      }

      const stepStatus: SignStatus =
        signRecord.currentStep <= 1
          ? 'pending'
          : signRecord.currentStep === 2
          ? 'explaining'
          : 'ready_to_sign';

      const updatedRecord = {
        ...signRecord,
        status: stepStatus,
      };
      const nextSignRecords = state.signRecords.map((r) =>
        r.id === signRecord.id ? updatedRecord : r
      );
      persistRecords(nextSignRecords);

      const now = new Date().toISOString();
      const nextExceptions = state.exceptionRecords.map((e) =>
        e.id === exceptionId
          ? {
              ...e,
              progress: 'sign_resumed' as ExceptionProgress,
              timeline: [
                ...e.timeline,
                {
                  time: now,
                  action: '重启签署流程',
                  operator: e.handler,
                },
              ],
            }
          : e
      );
      persistExceptions(nextExceptions);

      set({
        signRecords: nextSignRecords,
        exceptionRecords: nextExceptions,
      });

      get().resumeSignRecord(signRecord.id);

      return STEP_ROUTE_MAP[signRecord.currentStep] ?? '/';
    },

    setActiveSignRecordId: (id) => set({ activeSignRecordId: id }),

    resetAll: () =>
      set((state) => {
        persistRecords(state.signRecords);
        persistExceptions(state.exceptionRecords);
        return {
          ...initialInnerState,
          signRecords: state.signRecords,
          exceptionRecords: state.exceptionRecords,
        };
      }),
  })
);
