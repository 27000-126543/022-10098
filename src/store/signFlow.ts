import { create } from 'zustand';
import type {
  Customer,
  ProjectItem,
  ConsentTemplate,
  SignerType,
  SignRecord,
} from '@/types';

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
  setPreCheck: (key: 'photo' | 'allergy' | 'medication', value: boolean) => void;
  setSignerType: (type: SignerType) => void;
  setSignerName: (name: string) => void;
  setGuardianRelation: (rel: string) => void;
  setKeySentenceSignature: (url: string) => void;
  setCustomerSignature: (url: string) => void;
  addSignRecord: (record: SignRecord) => void;
  updateSignRecord: (id: string, patch: Partial<SignRecord>) => void;
  resetAll: () => void;
}

const initialState: SignFlowState = {
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
  signRecords: [],
};

export const useSignFlowStore = create<SignFlowState & SignFlowActions>(
  (set) => ({
    ...initialState,

    setCustomer: (customer) =>
      set({ currentCustomer: customer }),

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

    setCurrentTemplate: (template) =>
      set({ currentTemplate: template }),

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

    setSignerType: (type) =>
      set({ signerType: type }),

    setSignerName: (name) =>
      set({ signerName: name }),

    setGuardianRelation: (rel) =>
      set({ guardianRelation: rel }),

    setKeySentenceSignature: (url) =>
      set({ keySentenceDataUrl: url }),

    setCustomerSignature: (url) =>
      set({ signatureDataUrl: url }),

    addSignRecord: (record) =>
      set((state) => ({
        signRecords: [...state.signRecords, record],
      })),

    updateSignRecord: (id, patch) =>
      set((state) => ({
        signRecords: state.signRecords.map((record) =>
          record.id === id ? { ...record, ...patch } : record
        ),
      })),

    resetAll: () => set(initialState),
  })
);
