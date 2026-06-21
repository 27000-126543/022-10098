import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Upload,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  RefreshCw,
  Eye,
  Trash2,
  User,
  Calendar,
  X,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import NavBar from '@/components/NavBar';
import PageTransition from '@/components/PageTransition';
import { records as mockRecords } from '@/data/records';
import { useSignFlowStore } from '@/store/signFlow';
import type {
  SignRecord,
  ExceptionRecord,
  ExceptionProgress,
  SignStatus,
} from '@/types';
import { EXCEPTION_TYPE_LABELS, EXCEPTION_PROGRESS_LABELS } from '@/types';

type ExceptionType = ExceptionRecord['type'];
type UrgencyLevel = ExceptionRecord['urgency'];
type TabKey = 'all' | 'unresolved' | 'resolved';

interface ExceptionTimelineNode {
  label: string;
  time?: string;
  done: boolean;
}

const EXCEPTION_TYPE_OPTIONS: { value: ExceptionType; label: string }[] = [
  { value: 'info_mismatch', label: '顾客信息与预约不符' },
  { value: 'customer_refused', label: '顾客放弃签署/拒签' },
  { value: 'device_failure', label: '设备/系统故障' },
  { value: 'incomplete_info', label: '术前信息无法补齐' },
  { value: 'other', label: '其他异常' },
];

const URGENCY_CONFIG: Record<
  UrgencyLevel,
  { label: string; dotColor: string; badgeClass: string }
> = {
  normal: {
    label: '普通',
    dotColor: 'bg-gray-400',
    badgeClass: 'bg-gray-100 text-gray-700',
  },
  urgent: {
    label: '紧急',
    dotColor: 'bg-amber-500',
    badgeClass: 'bg-amber-100 text-amber-700',
  },
  critical: {
    label: '非常紧急',
    dotColor: 'bg-red-500',
    badgeClass: 'bg-red-100 text-red-700',
  },
};

const EXCEPTION_TYPE_COLORS: Record<ExceptionType, string> = {
  info_mismatch: 'bg-blue-100 text-blue-700',
  customer_refused: 'bg-orange-100 text-orange-700',
  device_failure: 'bg-purple-100 text-purple-700',
  incomplete_info: 'bg-yellow-100 text-yellow-700',
  other: 'bg-slate-100 text-slate-700',
};

const SIGN_STATUS_LABELS: Record<SignStatus, string> = {
  pending: '待处理',
  explaining: '告知中',
  ready_to_sign: '待签署',
  completed: '已完成',
  exception: '异常',
};

const SIGN_STATUS_COLORS: Record<SignStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  explaining: 'bg-blue-100 text-blue-700',
  ready_to_sign: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  exception: 'bg-red-100 text-red-700',
};

function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return isoString;
  }
}

function buildTimeline(item: ExceptionRecord): ExceptionTimelineNode[] {
  const nodes: ExceptionTimelineNode[] = [];
  const registered = item.timeline.find((t) => t.action === '异常登记');
  const resolved = item.timeline.find((t) => t.action === '异常已解决');
  const resumed = item.timeline.find((t) => t.action === '重启签署流程');

  nodes.push({ label: '异常登记', time: registered ? formatDateTime(registered.time) : formatDateTime(item.handleTime), done: true });

  if (resumed) {
    nodes.push({ label: '重启签署', time: formatDateTime(resumed.time), done: true });
  }

  if (resolved) {
    nodes.push({ label: '解决完成', time: formatDateTime(resolved.time), done: true });
  } else if (item.progress === 'investigating') {
    nodes.push({ label: '处理中', done: true });
  } else if (item.progress === 'sign_resumed') {
    nodes.push({ label: '已重启签署', done: true });
  } else {
    nodes.push({ label: '待处理', done: false });
  }

  return nodes;
}

function Toast({
  message,
  visible,
  onClose,
}: {
  message: string;
  visible: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <div
      className={cn(
        'fixed top-20 right-6 z-[100] transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      )}
    >
      <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 px-5 py-3 shadow-lg">
        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
        <span className="text-sm font-medium text-green-800">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-green-600 hover:text-green-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Timeline({ nodes }: { nodes: ExceptionTimelineNode[] }) {
  return (
    <div className="relative pl-1 py-1">
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />
      <ul className="space-y-3">
        {nodes.map((node, idx) => (
          <li key={idx} className="relative flex items-start gap-3">
            <span
              className={cn(
                'relative z-10 mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded-full border-2',
                node.done
                  ? 'bg-primary-500 border-primary-500'
                  : 'bg-white border-gray-300'
              )}
            />
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  'text-xs font-medium',
                  node.done ? 'text-gray-800' : 'text-gray-400'
                )}
              >
                {node.label}
              </div>
              {node.time && (
                <div className="text-xs text-gray-500 mt-0.5">{node.time}</div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ExceptionPage() {
  const navigate = useNavigate();
  const {
    signRecords,
    exceptionRecords,
    addExceptionRecord,
    resolveException,
    restartSignFromException,
    setActiveSignRecordId,
    updateExceptionRecord,
  } = useSignFlowStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [matchedRecord, setMatchedRecord] = useState<SignRecord | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const [exceptionType, setExceptionType] = useState<ExceptionType | ''>('');
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [urgency, setUrgency] = useState<UrgencyLevel>('normal');
  const [handler, setHandler] = useState('前台管理员');
  const [measures, setMeasures] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolvingExceptionId, setResolvingExceptionId] = useState<string | null>(null);
  const [resolveMeasures, setResolveMeasures] = useState('');

  const searchResults = useMemo(() => {
    if (!searchKeyword.trim()) return [];
    const kw = searchKeyword.trim().toLowerCase();
    
    const seenIds = new Set<string>();
    const uniqueRecords: SignRecord[] = [];
    
    for (const r of signRecords) {
      if (!seenIds.has(r.id)) {
        seenIds.add(r.id);
        uniqueRecords.push(r);
      }
    }
    
    for (const r of mockRecords) {
      if (!seenIds.has(r.id)) {
        seenIds.add(r.id);
        const converted: SignRecord = {
          id: r.id,
          customerId: r.customerId,
          customerName: r.customerName,
          customerPhone: r.phone,
          customerIdCardLast4: '',
          appointmentId: '',
          projectIds: [r.projectId],
          projectNames: [r.projectName],
          doctor: r.doctor,
          consentTemplateId: r.templateId,
          consentTemplateName: r.templateName,
          signerType: 'self',
          signerName: r.customerName,
          explainedSections: [],
          explainedSectionTitles: [],
          confirmedKeyRisks: [],
          confirmedKeyRiskTitles: [],
          keySentenceSignature: '',
          customerSignature: '',
          preOpPhotoDone: false,
          allergyHistoryDone: false,
          medicationHistoryDone: false,
          status: r.status,
          currentStep: r.status === 'completed' ? 4 : r.status === 'exception' ? 0 : 1,
          nextAction: r.nextAction || '',
          signTime: r.signTime,
          createTime: r.signDate,
        };
        uniqueRecords.push(converted);
      }
    }
    
    return uniqueRecords
      .filter(
        (r) =>
          r.customerPhone.toLowerCase().includes(kw) ||
          r.id.toLowerCase().includes(kw) ||
          r.customerName.toLowerCase().includes(kw) ||
          r.appointmentId.toLowerCase().includes(kw)
      )
      .slice(0, 5);
  }, [searchKeyword, signRecords]);

  const filteredList = useMemo(() => {
    return exceptionRecords.filter((item) => {
      if (activeTab === 'unresolved') return !item.resolved;
      if (activeTab === 'resolved') return item.resolved;
      return true;
    });
  }, [exceptionRecords, activeTab]);

  const stats = useMemo(() => {
    const unresolved = exceptionRecords.filter((e) => !e.resolved).length;
    const today = new Date().toISOString().split('T')[0];
    const todayNew = exceptionRecords.filter((e) =>
      e.handleTime.startsWith(today)
    ).length;
    const resolvedItems = exceptionRecords.filter((e) => e.resolved && e.resolvedTime);
    let avgHours = 0;
    if (resolvedItems.length > 0) {
      const totalMs = resolvedItems.reduce((sum, item) => {
        const start = new Date(item.handleTime).getTime();
        const end = new Date(item.resolvedTime!).getTime();
        return sum + (end - start);
      }, 0);
      avgHours = Math.round(totalMs / resolvedItems.length / (1000 * 60 * 60));
    }
    return { unresolved, todayNew, avgHours };
  }, [exceptionRecords]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  const getSignRecordById = (id?: string): SignRecord | undefined => {
    if (!id) return undefined;
    return signRecords.find((r) => r.id === id);
  };

  const handleSelectRecord = (record: SignRecord) => {
    setMatchedRecord(record);
    setSearchKeyword(record.customerName + ' ' + record.customerPhone);
    setShowSearchDropdown(false);
  };

  const handleUploadMock = () => {
    const mockNames = [
      '异常情况截图_20260622.png',
      '顾客签字确认单.pdf',
      '设备错误日志.txt',
    ];
    const newFile = mockNames[Math.floor(Math.random() * mockNames.length)];
    setUploadedFiles((prev) => [...prev, newFile]);
    showToast('凭证上传成功');
  };

  const handleRemoveFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const now = () => new Date().toISOString();

  const handleSubmit = (markResolved: boolean) => {
    if (!exceptionType) {
      showToast('请选择异常类型');
      return;
    }
    if (!description.trim()) {
      showToast('请填写异常描述');
      return;
    }

    const typeLabel =
      EXCEPTION_TYPE_OPTIONS.find((o) => o.value === exceptionType)?.label || '';

    const currentNow = now();
    const newItem: ExceptionRecord = {
      id: 'EXC' + Date.now().toString().slice(-10),
      customerId: matchedRecord?.customerId || 'CUSTOMER-NO-LINK',
      customerName: matchedRecord?.customerName || '未关联顾客',
      signRecordId: matchedRecord?.id || undefined,
      type: exceptionType,
      typeLabel,
      description: description.trim(),
      handler: handler.trim() || '前台管理员',
      handleTime: currentNow,
      measures: measures.trim(),
      resolved: markResolved,
      resolvedTime: markResolved ? currentNow : undefined,
      progress: markResolved ? 'resolved' : 'reported',
      urgency,
      timeline: [
        {
          time: currentNow,
          action: '异常登记',
          operator: handler.trim() || '前台管理员',
        },
      ],
    };

    if (markResolved) {
      newItem.timeline.push({
        time: currentNow,
        action: '异常已解决',
        operator: handler.trim() || '前台管理员',
      });
    }

    addExceptionRecord(newItem);
    showToast(markResolved ? '异常已登记并标记解决' : '异常登记提交成功');

    setMatchedRecord(null);
    setSearchKeyword('');
    setExceptionType('');
    setDescription('');
    setUploadedFiles([]);
    setUrgency('normal');
    setHandler('前台管理员');
    setMeasures('');
  };

  const handleRestartSign = (item: ExceptionRecord) => {
    const targetRoute = restartSignFromException(item.id);
    if (targetRoute) {
      showToast(`已为 ${item.customerName} 重启签署流程`);
      setTimeout(() => navigate(targetRoute), 500);
    } else {
      showToast('重启签署流程失败，请检查关联记录');
    }
  };

  const handleViewSignRecord = (signRecordId: string) => {
    setActiveSignRecordId(signRecordId);
    navigate('/archive', { state: { highlightId: signRecordId } });
  };

  const handleOpenResolveModal = (exceptionId: string) => {
    setResolvingExceptionId(exceptionId);
    setResolveMeasures('');
    setResolveModalVisible(true);
  };

  const handleConfirmResolve = () => {
    if (!resolvingExceptionId) return;
    if (!resolveMeasures.trim()) {
      showToast('请填写处理措施');
      return;
    }

    resolveException(resolvingExceptionId, resolveMeasures.trim());
    showToast('异常已标记为已解决');
    setResolveModalVisible(false);
    setResolvingExceptionId(null);
    setResolveMeasures('');
  };

  const handleDelete = (id: string) => {
    const exception = exceptionRecords.find((e) => e.id === id);
    if (exception?.signRecordId) {
      updateExceptionRecord(id, { signRecordId: undefined });
    }
    const updated = exceptionRecords.filter((e) => e.id !== id);
    useSignFlowStore.setState({ exceptionRecords: updated });
    localStorage.setItem('medical_sign_flow_exceptions_v1', JSON.stringify(updated));
    showToast('异常记录已删除');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <PageTransition className="mx-auto max-w-7xl px-6 py-8">
        <Toast
          visible={toastVisible}
          message={toastMessage}
          onClose={() => setToastVisible(false)}
        />

        <div className="mb-6 text-center text-2xl font-bold text-gray-900">
          异常处理中心
        </div>

        <div className="flex gap-6">
          {/* 左侧表单 w-2/5 */}
          <div className="w-2/5 flex-shrink-0">
            <div className="rounded-xl bg-white p-6 shadow-card">
              <div className="mb-5 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary-600" />
                <h2 className="text-base font-semibold text-gray-900">
                  异常登记表单
                </h2>
              </div>

              {/* 关联签署记录/顾客 */}
              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  关联签署记录/顾客
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => {
                      setSearchKeyword(e.target.value);
                      setShowSearchDropdown(true);
                    }}
                    onFocus={() => setShowSearchDropdown(true)}
                    onBlur={() => setTimeout(() => setShowSearchDropdown(false), 150)}
                    placeholder="输入手机号、预约号或预约号搜索"
                    className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                  />
                  {showSearchDropdown && searchResults.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                      {searchResults.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onMouseDown={() => handleSelectRecord(r)}
                          className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
                            <User className="h-4 w-4 text-primary-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {r.customerName}
                              <span className="ml-2 text-xs text-gray-500">
                                {r.customerPhone}
                              </span>
                            </div>
                            <div className="mt-0.5 text-xs text-gray-500">
                              {r.projectNames.join('、')} · {r.id}
                            </div>
                            <div className="mt-0.5">
                              <span
                                className={cn(
                                  'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded',
                                  SIGN_STATUS_COLORS[r.status]
                                )}
                              >
                                {SIGN_STATUS_LABELS[r.status]}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {matchedRecord && (
                  <div className="mt-2 rounded-lg bg-primary-50 px-3 py-2">
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="h-3.5 w-3.5 text-primary-600" />
                      <span className="font-medium text-primary-700">
                        已匹配：
                      </span>
                      <span className="text-gray-700">
                        {matchedRecord.customerName} · {matchedRecord.projectNames.join('、')}
                      </span>
                      <span
                        className={cn(
                          'ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium rounded',
                          SIGN_STATUS_COLORS[matchedRecord.status]
                        )}
                      >
                        {SIGN_STATUS_LABELS[matchedRecord.status]}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 异常类型 */}
              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  异常类型 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-left transition-all duration-200 hover:border-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <span
                      className={cn(
                        exceptionType ? 'text-gray-900' : 'text-gray-400'
                      )}
                    >
                      {exceptionType
                        ? EXCEPTION_TYPE_OPTIONS.find((o) => o.value === exceptionType)?.label
                        : '请选择异常类型'}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-gray-400 transition-transform',
                        showTypeDropdown && 'rotate-180'
                      )}
                    />
                  </button>
                  {showTypeDropdown && (
                    <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                      {EXCEPTION_TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setExceptionType(opt.value);
                            setShowTypeDropdown(false);
                          }}
                          className={cn(
                            'flex w-full items-center px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0',
                            exceptionType === opt.value
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-700'
                          )}
                        >
                          {exceptionType === opt.value && (
                            <CheckCircle className="mr-2 h-4 w-4 text-primary-600" />
                          )}
                          <span className={exceptionType === opt.value ? '' : 'ml-6'}>
                            {opt.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 异常描述 */}
              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  异常描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="请详细描述异常发生的时间、场景、原因等信息..."
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                />
              </div>

              {/* 上传凭证 */}
              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  上传凭证（可选）
                </label>
                <button
                  type="button"
                  onClick={handleUploadMock}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm text-gray-500 transition-all duration-200 hover:border-primary-400 hover:bg-primary-50/50 hover:text-primary-600"
                >
                  <Upload className="h-6 w-6" />
                  <span className="font-medium">
                    点击上传异常截图/凭证（图片/PDF）
                  </span>
                </button>
                {uploadedFiles.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {uploadedFiles.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 flex-shrink-0 text-gray-400" />
                          <span className="truncate text-gray-700">{f}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(i)}
                          className="ml-2 flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 紧急程度 */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  紧急程度
                </label>
                <div className="flex gap-2">
                  {(Object.keys(URGENCY_CONFIG) as UrgencyLevel[]).map((level) => (
                    <label
                      key={level}
                      className={cn(
                        'flex-1 cursor-pointer rounded-lg border px-3 py-2 text-center text-sm font-medium transition-all duration-200',
                        urgency === level
                          ? 'border-transparent shadow-sm ' + URGENCY_CONFIG[level].badgeClass
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      )}
                    >
                      <input
                        type="radio"
                        name="urgency"
                        value={level}
                        checked={urgency === level}
                        onChange={() => setUrgency(level)}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={cn(
                            'h-2 w-2 rounded-full',
                            URGENCY_CONFIG[level].dotColor
                          )}
                        />
                        {URGENCY_CONFIG[level].label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 处理人 */}
              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  处理人
                </label>
                <input
                  type="text"
                  value={handler}
                  onChange={(e) => setHandler(e.target.value)}
                  placeholder="请输入处理人姓名"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                />
              </div>

              {/* 处理措施 */}
              <div className="mb-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  处理措施
                </label>
                <textarea
                  value={measures}
                  onChange={(e) => setMeasures(e.target.value)}
                  rows={3}
                  placeholder="请描述拟采取的处理措施和跟进方案..."
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                />
              </div>

              {/* 底部按钮 */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-primary-700 active:scale-[0.98]"
                >
                  提交异常登记
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  className="flex-1 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 transition-all duration-200 hover:bg-green-100 active:scale-[0.98]"
                >
                  标记已解决
                </button>
              </div>
            </div>
          </div>

          {/* 右侧栏 w-3/5 */}
          <div className="flex-1 min-w-0">
            {/* Tab 切换 */}
            <div className="mb-5 flex w-fit items-center gap-1 rounded-xl bg-gray-100 p-1">
              {(
                [
                  { key: 'all', label: '全部异常' },
                  { key: 'unresolved', label: '未解决' },
                  { key: 'resolved', label: '已解决' },
                ] as { key: TabKey; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'rounded-lg px-5 py-2 text-sm font-medium transition-all duration-200',
                    activeTab === tab.key
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 统计卡 */}
            <div className="mb-5 grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-white p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-gray-500">未解决数</div>
                    <div className="mt-2 text-2xl font-bold text-gray-900">
                      {stats.unresolved}
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-white p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-gray-500">今日新增</div>
                    <div className="mt-2 text-2xl font-bold text-gray-900">
                      {stats.todayNew}
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-white p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-gray-500">平均处理时长</div>
                    <div className="mt-2 text-2xl font-bold text-gray-900">
                      {stats.avgHours}
                      <span className="ml-1 text-sm font-medium text-gray-500">h</span>
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                    <Clock className="h-5 w-5 text-primary-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* 异常列表 */}
            <div className="space-y-4">
              {filteredList.length === 0 && (
                <div className="rounded-xl bg-white p-12 text-center shadow-card">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="text-sm text-gray-500">暂无异常记录</div>
                </div>
              )}

              {filteredList.map((item) => {
                const signRecord = getSignRecordById(item.signRecordId);
                return (
                  <div
                    key={item.id}
                    className="rounded-xl bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-card-hover"
                  >
                    {/* 顶部行 */}
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md',
                            EXCEPTION_TYPE_COLORS[item.type]
                          )}
                        >
                          {item.typeLabel}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full',
                            URGENCY_CONFIG[item.urgency].badgeClass
                          )}
                        >
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              URGENCY_CONFIG[item.urgency].dotColor
                            )}
                          />
                          {URGENCY_CONFIG[item.urgency].label}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
                            item.progress === 'resolved'
                              ? 'bg-green-100 text-green-700'
                              : item.progress === 'sign_resumed'
                              ? 'bg-blue-100 text-blue-700'
                              : item.progress === 'investigating'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-700'
                          )}
                        >
                          {EXCEPTION_PROGRESS_LABELS[item.progress]}
                        </span>
                        {item.resolved && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3" />
                            已解决
                          </span>
                        )}
                        {signRecord && (
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded',
                              SIGN_STATUS_COLORS[signRecord.status]
                            )}
                          >
                            签署状态：{SIGN_STATUS_LABELS[signRecord.status]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDateTime(item.handleTime)}
                      </div>
                    </div>

                    {/* 顾客信息 */}
                    <div className="mb-2 flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                        <User className="h-4 w-4 text-gray-400" />
                        {item.customerName}
                      </div>
                      {signRecord && (
                        <>
                          <span className="text-gray-300">|</span>
                          <div className="text-sm text-gray-700">
                            {signRecord.projectNames.join('、')}
                          </div>
                        </>
                      )}
                      <span className="text-gray-300">|</span>
                      <div className="text-xs text-gray-500 font-mono">
                        {item.signRecordId || '无关联记录'}
                      </div>
                    </div>

                    {/* 异常描述 snippet */}
                    <div className="mb-3 text-sm text-gray-600 line-clamp-2">
                      {item.description}
                    </div>

                    {/* 处理人信息 */}
                    <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
                      <span>处理人：</span>
                      <span className="font-medium text-gray-700">{item.handler}</span>
                      {item.measures && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="line-clamp-1">措施：{item.measures}</span>
                        </>
                      )}
                    </div>

                    {/* 时间线 + 操作按钮 */}
                    <div className="flex gap-6 pt-4 border-t border-gray-100">
                      <div className="flex-1 min-w-0">
                        <Timeline nodes={buildTimeline(item)} />
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0 justify-start">
                        {!item.resolved && (
                          <button
                            type="button"
                            onClick={() => handleRestartSign(item)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition-all duration-200 hover:bg-primary-100"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            重启签署流程
                          </button>
                        )}
                        {signRecord && (
                          <button
                            type="button"
                            onClick={() => handleViewSignRecord(signRecord.id)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            查看签署记录
                          </button>
                        )}
                        {!item.resolved && (
                          <button
                            type="button"
                            onClick={() => handleOpenResolveModal(item.id)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition-all duration-200 hover:bg-green-100"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            标记已解决
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-all duration-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 标记已解决弹窗 */}
        {resolveModalVisible && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                标记异常为已解决
              </h3>
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  处理措施 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={resolveMeasures}
                  onChange={(e) => setResolveMeasures(e.target.value)}
                  rows={4}
                  placeholder="请填写已采取的处理措施和解决方案..."
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setResolveModalVisible(false)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResolve}
                  className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-green-700"
                >
                  确认标记已解决
                </button>
              </div>
            </div>
          </div>
        )}
      </PageTransition>
    </div>
  );
}
