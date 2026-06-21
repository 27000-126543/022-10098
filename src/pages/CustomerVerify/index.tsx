import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, CreditCard, Check, ScanLine, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import NavBar from '@/components/NavBar';
import PageTransition from '@/components/PageTransition';
import StepIndicator from '@/components/StepIndicator';
import { customers } from '@/data/customers';
import { useSignFlowStore } from '@/store/signFlow';
import type { Customer } from '@/types';

type TabKey = 'scan' | 'manual';

export default function CustomerVerify() {
  const navigate = useNavigate();
  const setCustomer = useSignFlowStore((s) => s.setCustomer);

  const [activeTab, setActiveTab] = useState<TabKey>('scan');
  const [customer, setLocalCustomer] = useState<Customer | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [idCard, setIdCard] = useState('');
  const [formError, setFormError] = useState('');

  const [nameChecked, setNameChecked] = useState(true);
  const [phoneChecked, setPhoneChecked] = useState(true);
  const [idCardChecked, setIdCardChecked] = useState(true);

  const allChecked = nameChecked && phoneChecked && idCardChecked;

  const handleMockScan = () => {
    const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
    setLocalCustomer(randomCustomer);
    setCustomer(randomCustomer);
  };

  const handleQuery = () => {
    setFormError('');

    if (!name.trim()) {
      setFormError('请输入姓名');
      return;
    }
    if (!/^1\d{10}$/.test(phone)) {
      setFormError('请输入正确的11位手机号');
      return;
    }
    if (!/^\d{17}[\dXx]$/.test(idCard)) {
      setFormError('请输入正确的18位身份证号');
      return;
    }

    const idCardLast4 = idCard.slice(-4);
    const maskedPhone = phone.slice(0, 3) + '****' + phone.slice(-4);

    const found = customers.find(
      (c) =>
        c.name === name.trim() &&
        c.phone === maskedPhone &&
        c.idCardLast4 === idCardLast4
    );

    if (found) {
      setLocalCustomer(found);
      setCustomer(found);
    } else {
      setFormError('未找到匹配的预约记录');
    }
  };

  const displayIdCardLast4 = idCard ? idCard.slice(-4) : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <PageTransition className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-2 text-center text-2xl font-bold text-gray-900">
          第 1 步 · 顾客身份核验
        </div>
        <StepIndicator currentStep={0} />

        <div className="mx-auto mb-8 flex w-fit items-center gap-1 rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab('scan')}
            className={cn(
              'flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-200',
              activeTab === 'scan'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <QrCode className="h-4 w-4" />
            扫码核验
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={cn(
              'flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-200',
              activeTab === 'manual'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <ScanLine className="h-4 w-4" />
            手动输入
          </button>
        </div>

        {activeTab === 'scan' && (
          <div className="mx-auto mb-8 flex flex-col items-center">
            <div className="relative flex h-[280px] w-[280px] items-center justify-center rounded-xl border-2 border-dashed border-primary-400 bg-white/50">
              <div className="absolute -left-0.5 -top-0.5 h-8 w-8 border-l-4 border-t-4 rounded-tl-xl border-primary-500" />
              <div className="absolute -right-0.5 -top-0.5 h-8 w-8 border-r-4 border-t-4 rounded-tr-xl border-primary-500" />
              <div className="absolute -bottom-0.5 -left-0.5 h-8 w-8 border-b-4 border-l-4 rounded-bl-xl border-primary-500" />
              <div className="absolute -bottom-0.5 -right-0.5 h-8 w-8 border-b-4 border-r-4 rounded-br-xl border-primary-500" />

              <div className="absolute inset-4 overflow-hidden rounded-lg">
                <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary-500 to-transparent animate-scan-line opacity-80" />
              </div>

              <QrCode className="h-20 w-20 text-primary-400" />
            </div>

            <p className="mt-6 text-sm text-gray-600">
              请使用扫描枪扫描顾客预约二维码
            </p>

            <button
              onClick={handleMockScan}
              className="mt-6 rounded-lg border border-primary-200 bg-primary-50 px-6 py-2.5 text-sm font-medium text-primary-700 transition-all duration-200 hover:bg-primary-100"
            >
              模拟扫码成功
            </button>
          </div>
        )}

        {activeTab === 'manual' && (
          <div className="mx-auto mb-8 max-w-md">
            <div className="rounded-lg bg-white p-6 shadow-card">
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  姓名
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入顾客姓名"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                />
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  手机号
                </label>
                <input
                  type="tel"
                  maxLength={11}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="请输入11位手机号"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                />
              </div>

              <div className="mb-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  身份证号
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={idCard}
                  onChange={(e) => setIdCard(e.target.value)}
                  placeholder="请输入18位身份证号"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                />
                {idCard && (
                  <p className="mt-1.5 text-xs text-gray-500">
                    身份证后四位：
                    <span className="font-mono font-medium text-gray-700">
                      {displayIdCardLast4.padEnd(4, '*')}
                    </span>
                  </p>
                )}
              </div>

              {formError && (
                <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {formError}
                </div>
              )}

              <button
                onClick={handleQuery}
                className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-primary-700 active:scale-[0.98]"
              >
                查询预约
              </button>
            </div>
          </div>
        )}

        {customer && (
          <div className="mx-auto mb-8">
            <div className="mb-4 text-center text-sm font-medium text-gray-700">
              请核对以下信息是否与顾客出示证件一致
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-white p-5 shadow-card">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500">姓名</span>
                </div>
                <div className="mb-4 text-xl font-bold text-gray-900">
                  {customer.name}
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={nameChecked}
                    onChange={(e) => setNameChecked(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className={cn(
                    'font-medium',
                    nameChecked ? 'text-primary-600' : 'text-gray-500'
                  )}>
                    <Check className={cn('mr-0.5 inline h-4 w-4', nameChecked ? '' : 'opacity-0')} />
                    信息一致
                  </span>
                </label>
              </div>

              <div className="rounded-lg bg-white p-5 shadow-card">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100">
                    <Phone className="h-5 w-5 text-primary-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500">手机号</span>
                </div>
                <div className="mb-4 text-xl font-bold text-gray-900">
                  {customer.phone}
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={phoneChecked}
                    onChange={(e) => setPhoneChecked(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className={cn(
                    'font-medium',
                    phoneChecked ? 'text-primary-600' : 'text-gray-500'
                  )}>
                    <Check className={cn('mr-0.5 inline h-4 w-4', phoneChecked ? '' : 'opacity-0')} />
                    信息一致
                  </span>
                </label>
              </div>

              <div className="rounded-lg bg-white p-5 shadow-card">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100">
                    <CreditCard className="h-5 w-5 text-primary-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500">身份证后四位</span>
                </div>
                <div className="mb-4 text-xl font-bold text-gray-900">
                  {customer.idCardLast4}
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={idCardChecked}
                    onChange={(e) => setIdCardChecked(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className={cn(
                    'font-medium',
                    idCardChecked ? 'text-primary-600' : 'text-gray-500'
                  )}>
                    <Check className={cn('mr-0.5 inline h-4 w-4', idCardChecked ? '' : 'opacity-0')} />
                    信息一致
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="sticky bottom-0 -mx-6 mt-auto border-t border-gray-200 bg-gray-50/95 px-6 py-4 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <button
              onClick={() => navigate('/exception')}
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 active:scale-[0.98]"
            >
              信息有误，登记异常
            </button>
            <button
              disabled={!customer || !allChecked}
              onClick={() => navigate('/projects')}
              className={cn(
                'rounded-lg px-8 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.98]',
                customer && allChecked
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400'
              )}
            >
              确认无误，下一步
            </button>
          </div>
        </div>
      </PageTransition>
    </div>
  );
}
