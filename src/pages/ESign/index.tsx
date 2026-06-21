import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  AlertTriangle,
  Pill,
  Check,
  X,
  Download,
  Home,
  User,
  Eye,
} from 'lucide-react';
import { useSignFlowStore } from '@/store/signFlow';
import PageTransition from '@/components/PageTransition';
import NavBar from '@/components/NavBar';
import StepIndicator from '@/components/StepIndicator';
import SignaturePad, { SignaturePadRef } from '@/components/SignaturePad';
import { cn } from '@/lib/utils';
import { generateId } from '@/utils/idGenerator';
import type { SignerType, SignRecord } from '@/types';

const SIGNER_TABS: { value: SignerType; label: string }[] = [
  { value: 'self', label: '本人签署' },
  { value: 'guardian', label: '监护人签署' },
  { value: 'representative', label: '代签人签署' },
];

interface PreCheckItem {
  key: 'photo' | 'allergy' | 'medication';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRE_CHECK_ITEMS: PreCheckItem[] = [
  { key: 'photo', label: '术前照片已拍摄', icon: Camera },
  { key: 'allergy', label: '过敏史已录入', icon: AlertTriangle },
  { key: 'medication', label: '用药史已确认', icon: Pill },
];

export default function ESign() {
  const navigate = useNavigate();
  const keySentenceRef = useRef<SignaturePadRef>(null);
  const customerSignRef = useRef<SignaturePadRef>(null);

  const {
    currentCustomer,
    selectedProjects,
    currentTemplate,
    signerType,
    signerName,
    guardianRelation,
    preCheckStatus,
    keySentenceDataUrl,
    signatureDataUrl,
    explainedSections,
    confirmedKeyRisks,
    setSignerType,
    setSignerName,
    setGuardianRelation,
    setPreCheck,
    setKeySentenceSignature,
    setCustomerSignature,
    addSignRecord,
    setActiveSignRecordId,
    resetAll,
  } = useSignFlowStore();

  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptRecord, setReceiptRecord] = useState<SignRecord | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // 路由守卫：没有顾客或项目则返回对应步骤
  useEffect(() => {
    if (!currentCustomer) {
      navigate('/', { replace: true });
      return;
    }
    if (selectedProjects.length === 0) {
      navigate('/projects', { replace: true });
    }
  }, [currentCustomer, selectedProjects, navigate]);

  const pendingCount = Object.values(preCheckStatus).filter((v) => !v).length;

  const getEffectiveSignerName = () => {
    if (signerType === 'self') {
      return currentCustomer?.name ?? '';
    }
    return signerName;
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    if (!currentCustomer) {
      errors.push('未选择顾客，请返回核验页面');
    }
    if (selectedProjects.length === 0) {
      errors.push('未选择项目，请返回项目选择页面');
    }
    const effectiveName = getEffectiveSignerName();
    if (!effectiveName || effectiveName.trim().length === 0) {
      errors.push('请填写签署人姓名');
    }
    if (signerType === 'guardian' && (!guardianRelation || guardianRelation.trim().length === 0)) {
      errors.push('请填写监护人与本人关系');
    }
    if (signerType === 'representative' && (!guardianRelation || guardianRelation.trim().length === 0)) {
      errors.push('请填写代签人与本人关系');
    }
    if (!keySentenceDataUrl || keySentenceDataUrl.trim().length === 0) {
      errors.push('请手写抄录关键风险确认句');
    }
    if (!signatureDataUrl || signatureDataUrl.trim().length === 0) {
      errors.push('请完成顾客手写签名');
    }
    return errors;
  };

  const handleSubmit = () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors([]);

    const effectiveName = getEffectiveSignerName();
    const now = new Date().toISOString();
    const recordId = generateId('sign');

    const explainedSectionTitles: string[] = explainedSections
      .map((id) => currentTemplate?.sections?.find((s) => s.id === id)?.title as string | undefined)
      .filter((title): title is string => !!title);

    const confirmedKeyRiskTitles: string[] = confirmedKeyRisks
      .map((id) => currentTemplate?.sections?.find((s) => s.id === id)?.title as string | undefined)
      .filter((title): title is string => !!title);

    const record: SignRecord = {
      id: recordId,
      customerId: currentCustomer?.id ?? '',
      customerName: currentCustomer?.name ?? '',
      customerPhone: currentCustomer?.phone ?? '',
      customerIdCardLast4: currentCustomer?.idCardLast4 ?? '',
      appointmentId: currentCustomer?.appointmentId ?? '',
      projectIds: selectedProjects.map((p) => p.id),
      projectNames: selectedProjects.map((p) => p.name),
      doctor: currentCustomer?.doctor ?? '',
      consentTemplateId: currentTemplate?.id ?? '',
      consentTemplateName: currentTemplate?.name ?? '',
      signerType,
      signerName: effectiveName,
      guardianRelation: signerType !== 'self' ? guardianRelation : undefined,
      explainedSections: [...explainedSections],
      explainedSectionTitles,
      confirmedKeyRisks: [...confirmedKeyRisks],
      confirmedKeyRiskTitles,
      keySentenceSignature: keySentenceDataUrl ?? '',
      customerSignature: signatureDataUrl ?? '',
      preOpPhotoDone: preCheckStatus.photo,
      allergyHistoryDone: preCheckStatus.allergy,
      medicationHistoryDone: preCheckStatus.medication,
      status: 'completed',
      currentStep: 4,
      nextAction: '归档',
      signTime: now,
      createTime: now,
    };

    addSignRecord(record);
    setActiveSignRecordId(recordId);
    setReceiptRecord(record);
    setShowReceipt(true);
  };

  const handleDownloadReceipt = () => {
    if (!receiptRecord) return;
    alert('回执 PDF 下载功能：' + receiptRecord.id);
  };

  const handleBackToHome = () => {
    setShowReceipt(false);
    resetAll();
    navigate('/');
  };

  const formatSignTime = (isoStr: string) => {
    const d = new Date(isoStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  // 前置条件未满足时返回空（跳转中）
  if (!currentCustomer || selectedProjects.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <PageTransition className="pb-32">
        <div className="mx-auto max-w-4xl px-6">
          <div className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">第 4 步 · 电子签署</h1>
            </div>
            <StepIndicator currentStep={3} />
          </div>

          <div className="mt-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-card">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {currentCustomer?.name ?? '未选择顾客'}
                  </div>
                  <div className="text-xs text-gray-500">{currentCustomer?.phone}</div>
                </div>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-2 flex-wrap flex-1">
                <span className="text-sm text-gray-500 shrink-0">已选项目：</span>
                {selectedProjects.length === 0 ? (
                  <span className="text-sm text-gray-400">暂无</span>
                ) : (
                  selectedProjects.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 border border-primary-100"
                    >
                      {p.name}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">签署人信息</h2>

            <div className="inline-flex rounded-xl bg-gray-100 p-1 mb-5">
              {SIGNER_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setSignerType(tab.value)}
                  className={cn(
                    'px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    signerType === tab.value
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {signerType !== 'self' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {signerType === 'guardian' ? '监护人姓名' : '代签人姓名'}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder={`请输入${signerType === 'guardian' ? '监护人' : '代签人'}真实姓名`}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    与本人关系
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={guardianRelation}
                    onChange={(e) => setGuardianRelation(e.target.value)}
                    placeholder="如：父母、子女、配偶、律师等"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  />
                </div>

                {signerType === 'representative' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      授权说明
                    </label>
                    <textarea
                      rows={3}
                      placeholder="请简要说明代签授权情况..."
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none"
                    />
                  </div>
                )}
              </div>
            )}

            {signerType === 'self' && (
              <div className="rounded-lg bg-primary-50 border border-primary-100 p-4">
                <p className="text-sm text-primary-700">
                  本人签署模式：签署人即为顾客本人
                  <span className="font-semibold">「{currentCustomer?.name ?? '未选择'}」</span>
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">术前信息自动检查</h2>

            <div className="space-y-1">
              {PRE_CHECK_ITEMS.map((item) => {
                const Icon = item.icon;
                const checked = preCheckStatus[item.key];
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-lg',
                          checked ? 'bg-primary-100' : 'bg-gray-100'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-4.5 w-4.5',
                            checked ? 'text-primary-600' : 'text-gray-500'
                          )}
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.label}</div>
                        <div
                          className={cn(
                            'text-xs mt-0.5 flex items-center gap-1',
                            checked ? 'text-primary-600 font-medium' : 'text-accent-500'
                          )}
                        >
                          {checked ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              已完成
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-3.5 w-3.5" />
                              未完成 · 建议补录
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreCheck(item.key, !checked)}
                      className={cn(
                        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                        checked ? 'bg-primary-600' : 'bg-gray-200'
                      )}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                          checked ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            {pendingCount > 0 && (
              <div className="mt-4 flex items-start gap-3 rounded-xl bg-accent-50 border border-accent-200 p-4">
                <AlertTriangle className="h-5 w-5 text-accent-600 shrink-0 mt-0.5" />
                <p className="text-sm text-accent-700">
                  有 <span className="font-bold">{pendingCount}</span> 项术前信息未补齐，
                  可稍后补录但系统将标记 ⚠️
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">请手写抄录以下确认句</h2>
            <p className="text-sm text-gray-500 mb-4">请在下方田字格内手写抄录灰色描红引导句</p>

            <div
              className="relative rounded-lg overflow-hidden border-2 border-red-100"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(239, 68, 68, 0.08) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(239, 68, 68, 0.08) 1px, transparent 1px),
                  linear-gradient(to right, rgba(239, 68, 68, 0.05) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(239, 68, 68, 0.05) 1px, transparent 1px)
                `,
                backgroundSize: '100% 100%, 100% 100%, 50% 50%, 50% 50%',
                backgroundPosition: 'center, center, center, center',
                backgroundColor: '#fff5f5',
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-8">
                <p className="text-2xl md:text-3xl text-gray-300 font-medium tracking-widest select-none whitespace-nowrap overflow-hidden text-ellipsis">
                  我已充分了解并接受上述全部医疗风险
                </p>
              </div>
              <div className="relative z-20">
                <SignaturePad
                  ref={keySentenceRef}
                  height={140}
                  penColor="#1f2937"
                  penWidth={3}
                  value={keySentenceDataUrl}
                  onSave={setKeySentenceSignature}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-lg font-semibold text-gray-900">顾客手写签名</h2>
              <div className="text-right">
                <p className="text-xs text-gray-500">请使用正楷或常用签名</p>
                <p className="text-xs text-gray-400 mt-0.5">签名将作为法律有效凭证</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              请
              <span className="font-medium text-gray-700">
                {signerType === 'self'
                  ? currentCustomer?.name ?? '顾客本人'
                  : `${signerName || '签署人'}（${signerType === 'guardian' ? '监护人' : '代签人'}）`}
              </span>
              在下方区域内签名：
            </p>

            <SignaturePad
              ref={customerSignRef}
              height={220}
              penColor="#111827"
              penWidth={3}
              value={signatureDataUrl}
              onSave={setCustomerSignature}
            />
          </div>

          {formErrors.length > 0 && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800 mb-1">请完成以下必填项：</p>
                  <ul className="space-y-0.5">
                    {formErrors.map((err, i) => (
                      <li key={i} className="text-sm text-red-600 flex items-start gap-1">
                        <span>·</span>
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageTransition>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur-sm shadow-lg">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/risk-explain')}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            上一步
          </button>

          <button
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 text-white px-8 py-2.5 text-sm font-semibold hover:bg-primary-700 shadow-lg shadow-primary-600/30 hover:shadow-primary-600/40 transition-all duration-200"
          >
            <Check className="h-4 w-4" />
            提交签署，生成回执
          </button>
        </div>
      </div>

      {showReceipt && receiptRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">签署完成回执</h3>
                  <p className="text-sm text-white/80 mt-0.5">知情同意书已完成电子签署</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-6 w-6 text-white" strokeWidth={3} />
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">签署编号</span>
                <span className="text-sm font-mono font-semibold text-gray-900">
                  {receiptRecord.id}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">顾客姓名</span>
                <span className="text-sm font-semibold text-gray-900">
                  {receiptRecord.customerName}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">项目</span>
                <div className="flex flex-wrap justify-end gap-1">
                  {receiptRecord.projectNames.map((name, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">签署时间</span>
                <span className="text-sm font-medium text-gray-900">
                  {receiptRecord.signTime ? formatSignTime(receiptRecord.signTime) : '-'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">签署状态</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  <Check className="h-3.5 w-3.5" />
                  已完成
                </span>
              </div>

              {pendingCount > 0 && (
                <div className="mt-2 rounded-lg bg-accent-50 border border-accent-200 p-3">
                  <p className="text-xs text-accent-700 flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" />
                    提示：有 {pendingCount} 项术前信息未补录，系统已标记为待完善状态
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
              <button
                onClick={handleDownloadReceipt}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                下载回执PDF
              </button>
              <button
                onClick={() => navigate(`/receipt/${receiptRecord?.id}`)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Eye className="h-4 w-4" />
                查看完整回执
              </button>
              <button
                onClick={handleBackToHome}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-md shadow-primary-600/20"
              >
                <Home className="h-4 w-4" />
                返回首页
              </button>
            </div>

            <button
              onClick={handleBackToHome}
              className="absolute top-4 right-4 rounded-full p-1.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
