import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  FileSearch,
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Stethoscope,
  CalendarDays,
  FileCheck,
  ShieldAlert,
  MessageSquare,
  Image as ImageIcon,
  Search,
  RotateCcw,
  FileText,
  Copy,
  AlertCircle,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import NavBar from '@/components/NavBar';
import PageTransition from '@/components/PageTransition';
import StatusBadge from '@/components/StatusBadge';
import { records as mockRecords } from '@/data/records';
import { useSignFlowStore } from '@/store/signFlow';
import type { SignStatus, SignRecord as StoreSignRecord, SignerType } from '@/types';
import { SIGNER_TYPE_LABELS, STEP_ROUTE_MAP } from '@/types';

type UnifiedRecord = {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  appointmentId: string;
  projectNames: string[];
  doctor: string;
  status: SignStatus;
  createTime: string;
  signerType?: SignerType;
  signerName?: string;
  guardianRelation?: string;
  explainedSections?: string[];
  explainedSectionTitles?: string[];
  confirmedKeyRisks?: string[];
  confirmedKeyRiskTitles?: string[];
  customerSignature?: string;
  keySentenceSignature?: string;
  preCheckStatus?: { photo: boolean; allergy: boolean; medication: boolean };
  templateName?: string;
  consentTemplateName?: string;
  exceptionType?: string;
  exceptionRemark?: string;
  customerPhone?: string;
  customerIdCardLast4?: string;
  currentStep?: number;
  signTime?: string;
  exceptionId?: string;
  exceptionResolved?: boolean;
  exceptionDescription?: string;
  exceptionMeasures?: string;
};

const DOCTOR_OPTIONS = ['全部', '张医生', '李医生', '王医生'] as const;
const CATEGORY_OPTIONS = ['全部', '玻尿酸类', '光电类', '埋线类'] as const;
const STATUS_OPTIONS = [
  { value: '全部', label: '全部' },
  { value: 'pending', label: '待核验' },
  { value: 'explaining', label: '讲解中' },
  { value: 'ready_to_sign', label: '待签署' },
  { value: 'completed', label: '已完成' },
  { value: 'exception', label: '异常' },
] as const;

const NEXT_ACTION_MAP: Record<SignStatus, { label: string; dotColor: string }> = {
  pending: { label: '去核验', dotColor: 'bg-gray-500' },
  explaining: { label: '去讲解', dotColor: 'bg-blue-500' },
  ready_to_sign: { label: '去签署', dotColor: 'bg-purple-500' },
  completed: { label: '已归档', dotColor: 'bg-green-500' },
  exception: { label: '去处理异常', dotColor: 'bg-red-500' },
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  玻尿酸类: ['玻尿酸', '肉毒素'],
  光电类: ['热玛吉', '光子'],
  埋线类: ['蛋白线', '埋线'],
};

function getToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateTime(s: string): string {
  return s;
}

function getProjectCategory(projectName: string): string {
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => projectName.includes(k))) return cat;
  }
  return '全部';
}

function normalizeStoreRecord(r: StoreSignRecord): UnifiedRecord {
  return {
    id: r.id,
    customerId: r.customerId,
    customerName: r.customerName,
    phone: r.customerPhone ?? '-',
    appointmentId: r.appointmentId ?? r.customerId,
    projectNames: r.projectNames,
    doctor: r.doctor,
    status: r.status,
    createTime: r.createTime,
    signerType: r.signerType,
    signerName: r.signerName,
    guardianRelation: r.guardianRelation,
    explainedSections: r.explainedSections,
    explainedSectionTitles: r.explainedSectionTitles,
    confirmedKeyRisks: r.confirmedKeyRisks,
    confirmedKeyRiskTitles: r.confirmedKeyRiskTitles,
    customerSignature: r.customerSignature,
    keySentenceSignature: r.keySentenceSignature,
    preCheckStatus: {
      photo: r.preOpPhotoDone,
      allergy: r.allergyHistoryDone,
      medication: r.medicationHistoryDone,
    },
    templateName: r.consentTemplateName,
    consentTemplateName: r.consentTemplateName,
    exceptionType: r.exceptionTypeLabel ?? r.exceptionType,
    exceptionRemark: r.exceptionResolved ? '已解决' : undefined,
    customerPhone: r.customerPhone,
    customerIdCardLast4: r.customerIdCardLast4,
    currentStep: r.currentStep,
    signTime: r.signTime,
    exceptionId: r.exceptionId,
    exceptionResolved: r.exceptionResolved,
    exceptionDescription: undefined,
    exceptionMeasures: undefined,
  };
}

function normalizeMockRecord(r: (typeof mockRecords)[number]): UnifiedRecord {
  return {
    id: r.id,
    customerId: r.customerId,
    customerName: r.customerName,
    phone: r.phone,
    appointmentId: r.customerId,
    projectNames: [r.projectName],
    doctor: r.doctor,
    status: r.status,
    createTime: r.signDate + (r.signTime && r.signTime !== '-' ? ' ' + r.signTime : ''),
    templateName: r.templateName,
    exceptionType: r.exceptionType,
    exceptionRemark: r.exceptionRemark,
    exceptionDescription: r.exceptionRemark,
    exceptionMeasures: undefined,
    exceptionResolved: r.exceptionRemark === '已解决',
  };
}

function getPlaceholderSignature(name: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80"><rect width="200" height="80" fill="#FAFAFA" stroke="#E5E7EB" stroke-width="1" rx="6"/><text x="100" y="48" text-anchor="middle" font-family="cursive" font-size="28" fill="#0F766E" opacity="0.7">${name}</text><text x="100" y="68" text-anchor="middle" font-size="10" fill="#9CA3AF">（签名缩略图）</text></svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

export default function Archive() {
  const navigate = useNavigate();
  const storeRecords = useSignFlowStore((s) => s.signRecords);

  const [startDate, setStartDate] = useState(getDateDaysAgo(7));
  const [endDate, setEndDate] = useState(getToday());
  const [doctor, setDoctor] = useState<string>('全部');
  const [category, setCategory] = useState<string>('全部');
  const [status, setStatus] = useState<string>('全部');
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: getDateDaysAgo(7),
    endDate: getToday(),
    doctor: '全部',
    category: '全部',
    status: '全部',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [detailRecord, setDetailRecord] = useState<UnifiedRecord | null>(null);

  const allRecords = useMemo<UnifiedRecord[]>(() => {
    const normalizedStore = storeRecords.map(normalizeStoreRecord);
    const normalizedMock = mockRecords.map(normalizeMockRecord);
    const seen = new Set<string>();
    const merged: UnifiedRecord[] = [];
    for (const r of [...normalizedStore, ...normalizedMock]) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        merged.push(r);
      }
    }
    return merged.sort((a, b) => (a.createTime < b.createTime ? 1 : -1));
  }, [storeRecords]);

  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      if (appliedFilters.doctor !== '全部' && r.doctor !== appliedFilters.doctor) return false;
      if (appliedFilters.status !== '全部' && r.status !== appliedFilters.status) return false;
      if (appliedFilters.category !== '全部') {
        const matched = r.projectNames.some((p) => getProjectCategory(p) === appliedFilters.category);
        if (!matched) return false;
      }
      const recordDate = r.createTime.slice(0, 10);
      if (appliedFilters.startDate && recordDate < appliedFilters.startDate) return false;
      if (appliedFilters.endDate && recordDate > appliedFilters.endDate) return false;
      return true;
    });
  }, [allRecords, appliedFilters]);

  const stats = useMemo(() => {
    const total = filteredRecords.length;
    let pending = 0;
    let completed = 0;
    let exception = 0;
    for (const r of filteredRecords) {
      if (r.status === 'completed') completed++;
      else if (r.status === 'exception') exception++;
      else pending++;
    }
    return { total, pending, completed, exception };
  }, [filteredRecords]);

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const pageRecords = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const handleQuery = () => {
    setAppliedFilters({ startDate, endDate, doctor, category, status });
    setCurrentPage(1);
  };

  const handleReset = () => {
    const sd = getDateDaysAgo(7);
    const ed = getToday();
    setStartDate(sd);
    setEndDate(ed);
    setDoctor('全部');
    setCategory('全部');
    setStatus('全部');
    setAppliedFilters({ startDate: sd, endDate: ed, doctor: '全部', category: '全部', status: '全部' });
    setCurrentPage(1);
  };

  const handleNextAction = (r: UnifiedRecord) => {
    if (r.status === 'completed') return;
    if (r.status === 'exception') {
      navigate('/exception');
      return;
    }
    const resumeSuccess = useSignFlowStore.getState().resumeSignRecord(r.id);
    if (resumeSuccess) {
      const targetRoute = STEP_ROUTE_MAP[r.currentStep ?? 0];
      navigate(targetRoute);
    } else {
      alert('恢复签署记录失败，请重新进入流程');
    }
  };

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      alert('签署编号已复制到剪贴板');
    } catch {
      alert('复制失败，请手动复制');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <PageTransition className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">归档查询 · 签署状态跟踪</h1>
          <p className="mt-1 text-sm text-gray-500">查询历史签署记录，跟踪流程进度与异常情况</p>
        </div>

        <div className="mb-6 rounded-xl bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">日期范围</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                  />
                  <span className="text-sm text-gray-500">至</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">主治医生</label>
              <select
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                className="w-36 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
              >
                {DOCTOR_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">项目类型</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-36 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">签署状态</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-36 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={handleQuery}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-primary-700 active:scale-[0.98]"
              >
                <Search className="h-4 w-4" />
                查询
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 active:scale-[0.98]"
              >
                <RotateCcw className="h-4 w-4" />
                重置
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">总数</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50">
                <ClipboardList className="h-5 w-5 text-primary-600" />
              </div>
            </div>
            <div className="mt-3 h-1 rounded-full bg-gray-100">
              <div className="h-full w-full rounded-full bg-primary-500" style={{ width: '100%' }} />
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">待处理</div>
                <div className="mt-2 text-3xl font-bold text-amber-600">{stats.pending}</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="mt-3 h-1 rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{ width: stats.total ? `${(stats.pending / stats.total) * 100}%` : '0%' }}
              />
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">已完成</div>
                <div className="mt-2 text-3xl font-bold text-green-600">{stats.completed}</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-3 h-1 rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-green-500"
                style={{ width: stats.total ? `${(stats.completed / stats.total) * 100}%` : '0%' }}
              />
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">异常</div>
                <div className="mt-2 text-3xl font-bold text-red-600">{stats.exception}</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="mt-3 h-1 rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-red-500"
                style={{ width: stats.total ? `${(stats.exception / stats.total) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white shadow-card overflow-hidden">
          {filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                <FileSearch className="h-10 w-10 text-gray-400" />
              </div>
              <div className="mt-4 text-base font-medium text-gray-600">暂无匹配的签署记录</div>
              <div className="mt-1 text-sm text-gray-400">请尝试调整筛选条件</div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">
                        序号
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        顾客姓名
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        预约号
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        项目
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        主治医生
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        签署状态
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        创建时间
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        下一步操作
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                        详情
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pageRecords.map((r, idx) => {
                      const needAttention = r.status !== 'completed' && r.status !== 'exception';
                      const action = NEXT_ACTION_MAP[r.status];
                      const seqNo = (currentPage - 1) * PAGE_SIZE + idx + 1;
                      return (
                        <tr
                          key={r.id}
                          className={cn(
                            'transition-colors',
                            needAttention && 'bg-red-50 animate-pulse-soft hover:bg-red-100',
                            !needAttention && 'hover:bg-gray-50'
                          )}
                        >
                          <td className="px-4 py-3 text-gray-500">{seqNo}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{r.customerName}</div>
                            <div className="mt-0.5 text-xs text-gray-400">{r.phone}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 font-mono text-xs">{r.appointmentId}</td>
                          <td className="px-4 py-3 text-gray-700 max-w-[180px] truncate">
                            {r.projectNames.join('、')}
                          </td>
                          <td className="px-4 py-3 text-gray-700">{r.doctor}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{formatDateTime(r.createTime)}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleNextAction(r)}
                              disabled={r.status === 'completed'}
                              className={cn(
                                'inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-sm transition-all',
                                r.status !== 'completed'
                                  ? 'text-primary-700 hover:bg-primary-50 cursor-pointer'
                                  : 'text-gray-400 cursor-default'
                              )}
                            >
                              <span className={cn('h-2 w-2 rounded-full', action.dotColor)} />
                              <span>{action.label}</span>
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setDetailRecord(r)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-gray-100 hover:text-primary-600"
                              title="查看详情"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4">
                <div className="text-sm text-gray-500">
                  共 <span className="font-medium text-gray-700">{filteredRecords.length}</span> 条记录，第{' '}
                  <span className="font-medium text-gray-700">{currentPage}</span> /{' '}
                  <span className="font-medium text-gray-700">{totalPages}</span> 页
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={cn(
                      'inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-all',
                      currentPage === 1
                        ? 'cursor-not-allowed border-gray-200 text-gray-300'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-primary-600'
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        'inline-flex h-9 min-w-[36px] items-center justify-center rounded-lg border px-3 text-sm font-medium transition-all',
                        currentPage === page
                          ? 'border-primary-600 bg-primary-600 text-white'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-primary-600'
                      )}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={cn(
                      'inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-all',
                      currentPage === totalPages
                        ? 'cursor-not-allowed border-gray-200 text-gray-300'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-primary-600'
                    )}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </PageTransition>

      {detailRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setDetailRecord(null)}
        >
          <div
            className="mx-4 w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">签署记录详情</h3>
                  <StatusBadge status={detailRecord.status} />
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-xs text-gray-500 font-mono">编号：{detailRecord.id}</p>
                  <button
                    onClick={() => handleCopyId(detailRecord.id)}
                    className="inline-flex h-6 items-center gap-1 rounded px-1.5 text-[11px] text-gray-500 hover:bg-gray-100 transition-colors"
                    title="复制编号"
                  >
                    <Copy className="h-3 w-3" />
                    复制
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDetailRecord(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-5" style={{ maxHeight: 'calc(85vh - 72px)' }}>
              {detailRecord.consentTemplateName && (
                <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-primary-700 mb-1">
                    <FileText className="h-3.5 w-3.5" />
                    知情同意书
                  </div>
                  <div className="text-sm font-medium text-primary-900">
                    {detailRecord.consentTemplateName}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                    <User className="h-3.5 w-3.5" />
                    顾客信息
                  </div>
                  <div className="mt-2 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">姓名：</span>
                      <span className="font-medium text-gray-900">{detailRecord.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">电话：</span>
                      <span className="text-gray-700 font-mono text-xs">{detailRecord.phone}</span>
                    </div>
                    {detailRecord.customerIdCardLast4 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">身份证：</span>
                        <span className="text-gray-700 font-mono text-xs">****{detailRecord.customerIdCardLast4}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">预约号：</span>
                      <span className="font-mono text-gray-700 text-xs">{detailRecord.appointmentId}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                    <Stethoscope className="h-3.5 w-3.5" />
                    就诊信息
                  </div>
                  <div className="mt-2 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">主治医生：</span>
                      <span className="font-medium text-gray-900">{detailRecord.doctor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">项目：</span>
                      <span className="text-gray-700 text-right">{detailRecord.projectNames.join('、')}</span>
                    </div>
                    {detailRecord.signTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">签署时间：</span>
                        <span className="text-gray-700 text-xs">{detailRecord.signTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {detailRecord.signerName && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-3">
                    <User className="h-3.5 w-3.5" />
                    签署人信息
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">类型</div>
                      <div className="font-medium text-gray-900">
                        {detailRecord.signerType
                          ? SIGNER_TYPE_LABELS[detailRecord.signerType]
                          : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">姓名</div>
                      <div className="font-medium text-gray-900">{detailRecord.signerName}</div>
                    </div>
                    {detailRecord.guardianRelation && (
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5">与本人关系</div>
                        <div className="font-medium text-gray-900">{detailRecord.guardianRelation}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-3">
                  <FileCheck className="h-3.5 w-3.5" />
                  术前检查项状态
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  {[
                    {
                      key: 'photo',
                      label: '术前照片',
                      done: detailRecord.preCheckStatus?.photo ?? false,
                    },
                    {
                      key: 'allergy',
                      label: '过敏史',
                      done: detailRecord.preCheckStatus?.allergy ?? false,
                    },
                    {
                      key: 'medication',
                      label: '用药史',
                      done: detailRecord.preCheckStatus?.medication ?? false,
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-3 py-2',
                        item.done ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                      )}
                    >
                      <Check
                        className={cn(
                          'h-4 w-4',
                          item.done ? 'text-green-500' : 'text-red-400 opacity-50'
                        )}
                      />
                      <span>{item.label}</span>
                      <span className="ml-auto text-xs font-medium">
                        {item.done ? '已完成' : '未完成'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-3">
                  <MessageSquare className="h-3.5 w-3.5" />
                  讲解完成情况
                </div>
                {detailRecord.explainedSectionTitles && detailRecord.explainedSectionTitles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {detailRecord.explainedSectionTitles.map((title, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 border border-green-200"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        {title}
                      </span>
                    ))}
                  </div>
                ) : detailRecord.explainedSections && detailRecord.explainedSections.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {detailRecord.explainedSections.map((s, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 border border-green-200"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        已讲解
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    无讲解记录，未完成知情告知
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-red-700 mb-3">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  关键风险确认
                </div>
                {detailRecord.confirmedKeyRiskTitles && detailRecord.confirmedKeyRiskTitles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {detailRecord.confirmedKeyRiskTitles.map((title, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-md bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 border border-red-300"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        {title} 已确认
                      </span>
                    ))}
                  </div>
                ) : detailRecord.confirmedKeyRisks && detailRecord.confirmedKeyRisks.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {detailRecord.confirmedKeyRisks.map((s, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-md bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 border border-red-300"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        关键风险已确认
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    关键风险未确认，不符合签署要求
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-3">
                  <ImageIcon className="h-3.5 w-3.5" />
                  签名缩略图
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="mb-2 text-xs font-medium text-gray-600">关键句签名</div>
                    <div className="rounded-lg border border-gray-200 p-2 bg-gray-50 flex items-center justify-center h-24">
                      {detailRecord.keySentenceSignature ? (
                        <img
                          src={detailRecord.keySentenceSignature}
                          alt="关键句签名"
                          className="max-h-20 object-contain"
                        />
                      ) : (
                        <img
                          src={getPlaceholderSignature(detailRecord.customerName)}
                          alt="关键句签名(示例)"
                          className="max-h-20 object-contain opacity-60"
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-medium text-gray-600">顾客签名</div>
                    <div className="rounded-lg border border-gray-200 p-2 bg-gray-50 flex items-center justify-center h-24">
                      {detailRecord.customerSignature ? (
                        <img
                          src={detailRecord.customerSignature}
                          alt="顾客签名"
                          className="max-h-20 object-contain"
                        />
                      ) : (
                        <img
                          src={getPlaceholderSignature(detailRecord.customerName)}
                          alt="顾客签名(示例)"
                          className="max-h-20 object-contain opacity-60"
                        />
                      )}
                    </div>
                  </div>
                </div>
                {detailRecord.signerName && (
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      签署人类型：
                      <span className="font-medium text-gray-700">
                        {detailRecord.signerType === 'self'
                          ? '本人'
                          : detailRecord.signerType === 'guardian'
                          ? '监护人'
                          : '委托代理人'}
                      </span>
                    </span>
                    <span>
                      签署人：
                      <span className="font-medium text-gray-700">{detailRecord.signerName}</span>
                    </span>
                  </div>
                )}
              </div>

              {detailRecord.status === 'exception' && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-red-600">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      异常信息
                    </div>
                    {detailRecord.exceptionResolved ? (
                      <span className="inline-flex items-center rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 border border-green-200">
                        <Check className="h-3 w-3 mr-1" />
                        已解决
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 border border-red-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        处理中
                      </span>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {detailRecord.exceptionType && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-gray-500 mt-0.5 w-16 shrink-0">异常类型</span>
                        <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                          {detailRecord.exceptionType}
                        </span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-gray-500 mt-0.5 w-16 shrink-0">解决状态</span>
                      <span className={cn(
                        'text-sm font-medium',
                        detailRecord.exceptionResolved ? 'text-green-700' : 'text-red-600'
                      )}>
                        {detailRecord.exceptionResolved ? '已解决' : '未解决'}
                      </span>
                    </div>
                    {(detailRecord.exceptionDescription || detailRecord.exceptionRemark) && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-gray-500 mt-0.5 w-16 shrink-0">异常描述</span>
                        <span className="text-sm text-gray-700">
                          {detailRecord.exceptionDescription || detailRecord.exceptionRemark}
                        </span>
                      </div>
                    )}
                    {detailRecord.exceptionMeasures && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-gray-500 mt-0.5 w-16 shrink-0">处理措施</span>
                        <span className="text-sm text-gray-700">{detailRecord.exceptionMeasures}</span>
                      </div>
                    )}
                  </div>
                  {!detailRecord.exceptionResolved && (
                    <button
                      onClick={() => navigate('/exception')}
                      className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      去处理
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <CalendarDays className="h-3.5 w-3.5" />
                  创建时间：{detailRecord.createTime}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="h-3.5 w-3.5" />
                  打印时间：{new Date().toLocaleString('zh-CN')}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              {detailRecord.status === 'completed' ? (
                <button
                  onClick={() => navigate(`/receipt/${detailRecord.id}`)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  查看完整回执
                </button>
              ) : detailRecord.status === 'exception' ? (
                <button
                  onClick={() => navigate('/exception')}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                >
                  <AlertTriangle className="h-4 w-4" />
                  处理异常
                </button>
              ) : (
                <button
                  onClick={() => {
                    const resumeSuccess = useSignFlowStore.getState().resumeSignRecord(detailRecord.id);
                    if (resumeSuccess) {
                      const targetRoute = STEP_ROUTE_MAP[detailRecord.currentStep ?? 0];
                      navigate(targetRoute);
                    } else {
                      alert('恢复签署记录失败，请重新进入流程');
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  继续签署流程
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
