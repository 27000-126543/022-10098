import { create } from 'zustand';
import type {
  Customer,
  ProjectItem,
  ConsentTemplate,
  SignerType,
  SignRecord,
} from '@/types';

const STORAGE_KEY = 'medical_sign_flow_records_v1';

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
  resetAll: () => void;
}

const initialInnerState: Omit<SignFlowState, 'signRecords'> = {
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
};

export const useSignFlowStore = create<SignFlowState & SignFlowActions>(
  (set) => ({
    ...initialInnerState,
    signRecords: loadPersistedRecords(),

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
        return { signRecords: next };
      }),

    updateSignRecord: (id, patch) =>
      set((state) => {
        const next = state.signRecords.map((record) =>
          record.id === id ? { ...record, ...patch } : record
        );
        persistRecords(next);
        return { signRecords: next };
      }),

    resetAll: () =>
      set((state) => {
        // 重置时不清除已签署的持久化记录，只清空流程状态
        persistRecords(state.signRecords);
        return {
          ...initialInnerState,
          signRecords: state.signRecords,
        };
      }),
  })
);
