import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Copy,
  Printer,
  Archive,
  Check,
  X,
  User,
  Stethoscope,
  FileCheck,
  AlertTriangle,
  MessageSquare,
  ShieldAlert,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { useSignFlowStore } from '@/store/signFlow';
import NavBar from '@/components/NavBar';
import PageTransition from '@/components/PageTransition';
import { SIGNER_TYPE_LABELS } from '@/types';
import { signStatusMap } from '@/data/records';
import { cn } from '@/lib/utils';
import { templates } from '@/data/templates';
import { records as mockRecords } from '@/data/records';
import type { SignRecord } from '@/types';

function formatDateTime(isoStr: string): string {
  const d = new Date(isoStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function getPlaceholderSignature(name: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80"><rect width="200" height="80" fill="#FAFAFA" stroke="#E5E7EB" stroke-width="1" rx="6"/><text x="100" y="48" text-anchor="middle" font-family="cursive" font-size="28" fill="#0F766E" opacity="0.7">${name}</text><text x="100" y="68" text-anchor="middle" font-size="10" fill="#9CA3AF">（签名缩略图）</text></svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

function maskPhone(phone: string): string {
  if (phone.length >= 11) {
    return phone.slice(0, 3) + '****' + phone.slice(7);
  }
  return phone;
}

function getGenderFromId(idCardLast4: string): string {
  if (!idCardLast4 || idCardLast4.length < 4) return '-';
  const genderDigit = parseInt(idCardLast4.slice(-2, -1), 10);
  return isNaN(genderDigit) ? '-' : genderDigit % 2 === 0 ? '女' : '男';
}

function calculateAge(): string {
  return '28';
}

export default function ReceiptPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const signRecords = useSignFlowStore((s) => s.signRecords);
  const [copySuccess, setCopySuccess] = useState(false);

  const record = useMemo(() => {
    if (!id) return null;
    const storeRecord = signRecords.find((r) => r.id === id);
    if (storeRecord) return storeRecord;

    const mockRecord = mockRecords.find((r) => r.id === id);
    if (mockRecord) {
      const statusStepMap: Record<string, number> = {
        pending: 0,
        explaining: 2,
        ready_to_sign: 3,
        completed: 4,
        exception: 0,
      };
      const constructed: SignRecord = {
        id: mockRecord.id,
        customerId: mockRecord.customerId,
        customerName: mockRecord.customerName,
        customerPhone: mockRecord.phone,
        customerIdCardLast4: '0000',
        appointmentId: mockRecord.id,
        projectIds: [mockRecord.projectId],
        projectNames: [mockRecord.projectName],
        doctor: mockRecord.doctor,
        consentTemplateId: mockRecord.templateId,
        consentTemplateName: mockRecord.templateName,
        preOpPhotoDone: false,
        allergyHistoryDone: false,
        medicationHistoryDone: false,
        signerType: 'self',
        signerName: mockRecord.customerName,
        explainedSections: [],
        explainedSectionTitles: [],
        confirmedKeyRisks: [],
        confirmedKeyRiskTitles: [],
        keySentenceSignature: '',
        customerSignature: '',
        currentStep: statusStepMap[mockRecord.status] ?? 0,
        nextAction: mockRecord.nextAction ?? '',
        exceptionType: mockRecord.exceptionType,
        exceptionTypeLabel: mockRecord.exceptionType,
        exceptionDescription: mockRecord.exceptionRemark,
        status: mockRecord.status,
        createTime: mockRecord.signDate + (mockRecord.signTime && mockRecord.signTime !== '-' ? ' ' + mockRecord.signTime : ''),
        signTime: mockRecord.completedAt,
      };
      return constructed;
    }
    return null;
  }, [id, signRecords]);

  const allSectionTitles = useMemo(() => {
    if (!record) return { explained: [], unexplained: [], confirmedKeyRisks: [] };
    const template = templates.find((t) => t.id === record.consentTemplateId);
    if (!template) {
      return {
        explained: record.explainedSectionTitles || [],
        unexplained: [],
        confirmedKeyRisks: record.confirmedKeyRiskTitles || [],
      };
    }
    const explained = record.explainedSectionTitles || [];
    const allTitles = template.sections.map((s) => s.title);
    const unexplained = allTitles.filter((t) => !explained.includes(t));
    const confirmedKeyRisks = record.confirmedKeyRiskTitles || [];
    return { explained, unexplained, confirmedKeyRisks };
  }, [record]);

  const handleCopyId = async () => {
    if (!record) return;
    try {
      await navigator.clipboard.writeText(record.id);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      setCopySuccess(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!id || !record) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <PageTransition className="mx-auto max-w-4xl px-6 py-16">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <AlertTriangle className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-gray-900">回执不存在</h2>
            <p className="mt-2 text-sm text-gray-500">未找到编号为「{id || '未知'}」的签署记录</p>
            <button
              onClick={() => navigate('/archive')}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-700"
            >
              <Archive className="h-4 w-4" />
              返回归档
            </button>
          </div>
        </PageTransition>
      </div>
    );
  }

  const gender = getGenderFromId(record.customerIdCardLast4 ?? '');
  const age = calculateAge();
  const printTime = new Date().toISOString();
  const statusInfo = signStatusMap[record.status];
  const fallbackName = record.customerName ?? '未知';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="no-print">
        <NavBar />
      </div>

      <div className="no-print fixed top-20 right-6 z-40 flex items-center gap-2">
        <button
          onClick={handleCopyId}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
            copySuccess
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          )}
        >
          {copySuccess ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copySuccess ? '已复制' : '复制编号'}
        </button>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary-700 shadow-md shadow-primary-600/20"
        >
          <Printer className="h-4 w-4" />
          打印回执
        </button>
        <button
          onClick={() => navigate('/archive')}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
        >
          <Archive className="h-4 w-4" />
          返回归档
        </button>
      </div>

      <PageTransition className="mx-auto max-w-4xl px-6 py-8 pb-20 print:px-0 print:py-0">
        <div className="no-print mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">签署正式回执</h1>
            <p className="mt-0.5 text-xs font-medium tracking-widest text-gray-400">
              PREOPERATIVE INFORMED CONSENT RECEIPT
            </p>
          </div>
        </div>

        <div
          className="mx-auto w-full max-w-[800px] rounded-2xl border border-gray-200 bg-white p-10 shadow-lg print:border-none print:shadow-none print:p-12"
          style={{ aspectRatio: '210 / 297' }}
        >
          <div className="mb-6 flex items-center justify-between border-2 border-gray-800 px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gray-800 bg-gradient-to-br from-primary-50 to-primary-100">
                <Shield className="h-7 w-7 text-primary-700" strokeWidth={2.2} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">星美医疗美容诊所</h2>
                <p className="text-xs text-gray-500">XINGMEI MEDICAL AESTHETIC CLINIC</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-gray-500">正式回执编号</div>
              <div className="font-mono text-lg font-bold text-gray-900">{record.id}</div>
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between rounded-lg bg-gray-50 px-6 py-4 border border-gray-200">
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">签署编号</div>
              <div className="font-mono text-xl font-bold tracking-wider text-gray-900">
                {record.id}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-medium text-gray-500 mb-1">签署状态</div>
                <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: `${statusInfo.color}20`, color: statusInfo.color }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusInfo.color }} />
                  {statusInfo.label}
                </div>
              </div>
              <button
                onClick={handleCopyId}
                className="no-print inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-all hover:bg-gray-50"
              >
                <Copy className="h-3.5 w-3.5" />
                复制
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">
              <User className="h-4 w-4 text-primary-600" />
              <h3 className="text-sm font-bold text-gray-900">顾客基本信息</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="space-y-0.5">
                <div className="text-xs text-gray-500">姓名</div>
                <div className="font-medium text-gray-900">{record.customerName ?? '-'}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-xs text-gray-500">性别</div>
                <div className="font-medium text-gray-900">{gender}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-xs text-gray-500">年龄</div>
                <div className="font-medium text-gray-900">{age} 岁</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-xs text-gray-500">手机号</div>
                <div className="font-mono font-medium text-gray-900">
                  {maskPhone(record.customerPhone ?? '')}
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-xs text-gray-500">身份证后四位</div>
                <div className="font-mono font-medium text-gray-900">
                  {record.customerIdCardLast4 ?? '-'}
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-xs text-gray-500">预约号</div>
                <div className="font-mono font-medium text-gray-900">{record.appointmentId ?? '-'}</div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">
              <Stethoscope className="h-4 w-4 text-primary-600" />
              <h3 className="text-sm font-bold text-gray-900">就诊信息</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-4">
                <div className="w-20 shrink-0 text-xs text-gray-500">主治医生</div>
                <div className="font-medium text-gray-900">{record.doctor ?? '-'}</div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-20 shrink-0 text-xs text-gray-500">签署时间</div>
                <div className="font-mono font-medium text-gray-900">
                  {record.signTime ? formatDateTime(record.signTime) : '-'}
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-20 shrink-0 text-xs text-gray-500">项目列表</div>
                <div className="flex flex-wrap gap-2">
                  {(record.projectNames ?? []).map((name, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 border border-primary-100"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">
              <FileCheck className="h-4 w-4 text-primary-600" />
              <h3 className="text-sm font-bold text-gray-900">知情同意书信息</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-4">
                <div className="w-28 shrink-0 text-xs text-gray-500">同意书名称</div>
                <div className="font-medium text-gray-900">{record.consentTemplateName ?? '-'}</div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-28 shrink-0 text-xs text-gray-500">签署人信息</div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {SIGNER_TYPE_LABELS[record.signerType ?? 'self']}
                  </span>
                  <span className="font-medium text-gray-900">{record.signerName ?? '-'}</span>
                  {record.guardianRelation && (
                    <span className="text-xs text-gray-500">
                      （与本人关系：{record.guardianRelation}）
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">
              <ImageIcon className="h-4 w-4 text-primary-600" />
              <h3 className="text-sm font-bold text-gray-900">术前检查确认</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'photo', label: '术前照片', done: record.preOpPhotoDone },
                { key: 'allergy', label: '过敏史', done: record.allergyHistoryDone },
                { key: 'medication', label: '用药史', done: record.medicationHistoryDone },
              ].map((item) => (
                <div
                  key={item.key}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-4 py-3 border',
                    item.done
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold',
                      item.done ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    )}
                  >
                    {item.done ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  </span>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      item.done ? 'text-green-700' : 'text-red-700'
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">
              <MessageSquare className="h-4 w-4 text-primary-600" />
              <h3 className="text-sm font-bold text-gray-900">讲解完成情况</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <div className="text-xs text-gray-500 mb-2">已讲解段落</div>
                <div className="flex flex-wrap gap-2">
                  {allSectionTitles.explained.length > 0 ? (
                    allSectionTitles.explained.map((title, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-100"
                      >
                        <Check className="h-3 w-3" />
                        {title}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">暂无讲解记录</span>
                  )}
                </div>
              </div>
              {allSectionTitles.unexplained.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2">未讲解段落</div>
                  <div className="flex flex-wrap gap-2">
                    {allSectionTitles.unexplained.map((title, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 border border-red-100"
                      >
                        <X className="h-3 w-3" />
                        {title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              <h3 className="text-sm font-bold text-gray-900">关键风险确认</h3>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-2">已确认的关键风险段落</div>
              <div className="flex flex-wrap gap-2">
                {allSectionTitles.confirmedKeyRisks.length > 0 ? (
                  allSectionTitles.confirmedKeyRisks.map((title, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-700 border border-red-200"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {title}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">无关键风险确认记录</span>
                )}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">
              <Check className="h-4 w-4 text-primary-600" />
              <h3 className="text-sm font-bold text-gray-900">手写签名确认</h3>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="mb-2 text-center text-xs font-medium text-gray-500">
                  关键风险确认句签名
                </div>
                <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
                  <img
                    src={
                      record.keySentenceSignature ||
                      getPlaceholderSignature(fallbackName)
                    }
                    alt="关键句签名"
                    className="max-h-20 max-w-full object-contain"
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 text-center text-xs font-medium text-gray-500">
                  顾客手写签名
                </div>
                <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
                  <img
                    src={
                      record.customerSignature ||
                      getPlaceholderSignature(fallbackName)
                    }
                    alt="顾客签名"
                    className="max-h-20 max-w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="mb-1 text-xs text-gray-500">咨询师签字</div>
                <div className="h-12 border-b border-gray-300" />
              </div>
              <div className="text-center">
                <div className="mb-1 text-xs text-gray-500">护士签字</div>
                <div className="h-12 border-b border-gray-300" />
              </div>
              <div className="text-center">
                <div className="mb-1 text-xs text-gray-500">打印时间</div>
                <div className="h-12 flex items-center justify-center">
                  <span className="font-mono text-xs text-gray-600">
                    {formatDateTime(printTime)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
