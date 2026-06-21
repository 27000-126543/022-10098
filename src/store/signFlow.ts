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
import { STEP_ROUTE_MAP } from '@/types';

const STORAGE_KEY = 'medical_sign_flow_records_v1';
const EXCEPTION_STORAGE_KEY = 'medical_sign_flow_exceptions_v1';

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
  restartSignFromException: (exceptionId: string) => string | null;
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
    signRecords: loadPersistedRecords(),
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

      const customer = customers.find((c) => c.id === record.customerId);
      const selectedProjs = projects.filter((p) =>
        record.projectIds.includes(p.id)
      );
      const template = templates.find(
        (t) => t.id === record.consentTemplateId
      );

      if (!customer || selectedProjs.length === 0 || !template) return false;

      set({
        currentCustomer: customer,
        selectedProjects: selectedProjs as unknown as ProjectItem[],
        currentTemplate: template as unknown as ConsentTemplate,
        explainedSections: record.explainedSections,
        confirmedKeyRisks: record.confirmedKeyRisks,
        preCheckStatus: {
          photo: record.preOpPhotoDone,
          allergy: record.allergyHistoryDone,
          medication: record.medicationHistoryDone,
        },
        signerType: record.signerType,
        signerName: record.signerName,
        guardianRelation: record.guardianRelation ?? '',
        keySentenceDataUrl: record.keySentenceSignature,
        signatureDataUrl: record.customerSignature,
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
              ? { ...r, exceptionResolved: true }
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
      if (!exception?.signRecordId) return null;

      const signRecord = state.signRecords.find(
        (r) => r.id === exception.signRecordId
      );
      if (!signRecord) return null;

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

      const resumed = get().resumeSignRecord(signRecord.id);
      if (!resumed) return null;

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
