import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Check,
  User,
  ArrowLeft,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useSignFlowStore } from '@/store/signFlow';
import PageTransition from '@/components/PageTransition';
import NavBar from '@/components/NavBar';
import StepIndicator from '@/components/StepIndicator';
import TermDrawer from '@/components/TermDrawer';
import { cn } from '@/lib/utils';
import type { ConsentSection, TermRef } from '@/types';

export default function RiskExplain() {
  const navigate = useNavigate();
  const {
    currentCustomer,
    selectedProjects,
    currentTemplate,
    explainedSections,
    confirmedKeyRisks,
    toggleExplainedSection,
    toggleKeyRisk,
  } = useSignFlowStore();

  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(
    currentTemplate?.sections?.[0]?.id ?? null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTermIds, setDrawerTermIds] = useState<string[]>([]);
  const [drawerActiveId, setDrawerActiveId] = useState('');

  const sections = currentTemplate?.sections ?? [];
  const keyRiskSections = sections.filter((s) => s.isKeyRisk);

  const allExplained = sections.every((s) =>
    explainedSections.includes(s.id)
  );
  const allKeyRisksConfirmed = keyRiskSections.every((s) =>
    confirmedKeyRisks.includes(s.id)
  );
  const canProceed = allExplained && allKeyRisksConfirmed;

  const getMissingItems = () => {
    const missing: string[] = [];
    const unexplained = sections.filter(
      (s) => !explainedSections.includes(s.id)
    );
    if (unexplained.length > 0) {
      missing.push(`未讲解：${unexplained.map((s) => s.title).join('、')}`);
    }
    const unconfirmed = keyRiskSections.filter(
      (s) => !confirmedKeyRisks.includes(s.id)
    );
    if (unconfirmed.length > 0) {
      missing.push(`关键风险未确认：${unconfirmed.map((s) => s.title).join('、')}`);
    }
    return missing;
  };

  const handleTermClick = (termId: string, sectionKeyTerms: TermRef[]) => {
    const ids = sectionKeyTerms.map((t) => t.termId);
    setDrawerTermIds(ids);
    setDrawerActiveId(termId);
    setDrawerOpen(true);
  };

  const renderHighlightedContent = (
    content: string,
    keyTerms: TermRef[]
  ) => {
    if (!keyTerms || keyTerms.length === 0) {
      return <span>{content}</span>;
    }

    let result: React.ReactNode[] = [content];
    keyTerms.forEach((term) => {
      const next: React.ReactNode[] = [];
      result.forEach((part) => {
        if (typeof part === 'string') {
          const parts = part.split(term.word);
          parts.forEach((p, i) => {
            if (i > 0) {
              next.push(
                <span
                  key={`${term.termId}-${i}`}
                  className="bg-sky-50 text-sky-700 underline cursor-pointer font-medium hover:bg-sky-100 transition-colors rounded px-0.5"
                  onClick={() => handleTermClick(term.termId, keyTerms)}
                >
                  {term.word}
                </span>
              );
            }
            if (p.length > 0) {
              next.push(p);
            }
          });
        } else {
          next.push(part);
        }
      });
      result = next;
    });

    return <>{result}</>;
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSectionId(expandedSectionId === sectionId ? null : sectionId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <PageTransition className="pb-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                第 3 步 · 知情风险讲解
              </h1>
            </div>
            <StepIndicator currentStep={2} />
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
                  <div className="text-xs text-gray-500">
                    {currentCustomer?.phone}
                  </div>
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

          <div className="mt-6 flex gap-6">
            <div className="w-2/3 space-y-4">
              {sections.map((section: ConsentSection) => {
                const isExpanded = expandedSectionId === section.id;
                const isExplained = explainedSections.includes(section.id);
                const isKeyRisk = !!section.isKeyRisk;
                const isKeyRiskConfirmed = confirmedKeyRisks.includes(section.id);

                return (
                  <div
                    key={section.id}
                    className={cn(
                      'rounded-2xl border-2 overflow-hidden transition-all duration-200',
                      isKeyRisk
                        ? 'border-accent-500 bg-accent-50'
                        : 'border-gray-200 bg-white shadow-card hover:shadow-card-hover'
                    )}
                  >
                    <button
                      onClick={() => toggleSection(section.id)}
                      className={cn(
                        'w-full flex items-center gap-4 px-5 py-4 transition-colors',
                        isKeyRisk
                          ? 'hover:bg-accent-100/50'
                          : 'hover:bg-gray-50'
                      )}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-500 shrink-0" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-500 shrink-0" />
                      )}

                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {isKeyRisk && (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-500 shrink-0">
                            <AlertTriangle className="h-3.5 w-3.5 text-white" />
                          </span>
                        )}
                        <h3 className="font-bold text-gray-900 text-lg">
                          {section.title}
                        </h3>
                        {isKeyRisk && (
                          <span className="inline-flex items-center rounded-full bg-accent-500 px-2.5 py-0.5 text-xs font-medium text-white shrink-0">
                            关键风险
                          </span>
                        )}
                      </div>

                      <label
                        className="flex items-center gap-2 shrink-0 select-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-sm text-gray-600 whitespace-nowrap">
                          咨询师确认已讲解
                        </span>
                        <input
                          type="checkbox"
                          checked={isExplained}
                          onChange={() => toggleExplainedSection(section.id)}
                          className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600 cursor-pointer"
                        />
                      </label>
                    </button>

                    {isExpanded && (
                      <div
                        className={cn(
                          'px-5 pb-5 pt-2 border-t',
                          isKeyRisk
                            ? 'border-accent-200'
                            : 'border-gray-100'
                        )}
                      >
                        <p className="text-sm leading-7 text-gray-700 whitespace-pre-line">
                          {renderHighlightedContent(
                            section.content,
                            section.keyTerms ?? []
                          )}
                        </p>

                        {section.keyTerms && section.keyTerms.length > 0 && (
                          <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                            <Info className="h-3.5 w-3.5" />
                            <span>
                              点击蓝色高亮术语可查看详细解释
                            </span>
                          </div>
                        )}

                        {isKeyRisk && (
                          <div className="mt-5 rounded-xl border-2 border-accent-300 bg-white p-4">
                            <label className="flex items-start gap-3 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isKeyRiskConfirmed}
                                onChange={() => toggleKeyRisk(section.id)}
                                className="mt-0.5 h-5 w-5 rounded border-accent-400 text-accent-600 focus:ring-accent-500 cursor-pointer shrink-0"
                              />
                              <span className="text-sm font-semibold text-gray-800 leading-6">
                                顾客确认已理解「{section.title}」中所述的全部关键风险，
                                并对可能发生的不良后果有充分心理准备。
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <aside className="w-1/3 shrink-0">
              <div className="sticky top-4 space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-white shadow-card p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary-600" />
                    讲解进度
                  </h3>
                  <div className="space-y-4">
                    {sections.map((section: ConsentSection) => {
                      const done = explainedSections.includes(section.id);
                      const isKeyRisk = !!section.isKeyRisk;
                      return (
                        <div key={section.id}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                                  done
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-200 text-gray-500'
                                )}
                              >
                                {done ? (
                                  <Check className="h-3 w-3" strokeWidth={3} />
                                ) : (
                                  sections.indexOf(section) + 1
                                )}
                              </span>
                              <span
                                className={cn(
                                  'text-sm font-medium',
                                  done ? 'text-primary-700' : 'text-gray-600'
                                )}
                              >
                                {section.title}
                              </span>
                              {isKeyRisk && (
                                <span className="text-[10px] bg-accent-100 text-accent-700 px-1.5 py-0.5 rounded font-medium">
                                  关键
                                </span>
                              )}
                            </div>
                            <span
                              className={cn(
                                'text-xs font-medium',
                                done ? 'text-primary-600' : 'text-gray-400'
                              )}
                            >
                              {done ? '已讲解' : '待讲解'}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-500',
                                done ? 'w-full bg-primary-600' : 'w-0'
                              )}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">总体进度</span>
                      <span className="font-semibold text-gray-900">
                        {explainedSections.length} / {sections.length}
                      </span>
                    </div>
                  </div>
                </div>

                {keyRiskSections.length > 0 && (
                  <div className="rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 p-5 shadow-lg shadow-accent-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-white" />
                      <h3 className="font-semibold text-white">
                        关键风险提醒
                      </h3>
                    </div>
                    <p className="text-white/90 text-sm mb-3">
                      共 <span className="font-bold text-white text-lg">{keyRiskSections.length}</span> 项关键风险，
                      已确认{' '}
                      <span className="font-bold text-white text-lg">
                        {confirmedKeyRisks.length}
                      </span>{' '}
                      项
                    </p>
                    <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{
                          width: `${(confirmedKeyRisks.length / keyRiskSections.length) * 100}%`,
                        }}
                      />
                    </div>
                    {confirmedKeyRisks.length < keyRiskSections.length && (
                      <p className="text-xs text-white/80 mt-3">
                        请确保顾客充分理解并确认全部关键风险后，再进入签署环节。
                      </p>
                    )}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </PageTransition>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur-sm shadow-lg">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            上一步
          </button>

          <div className="relative">
            <button
              disabled={!canProceed}
              onClick={() => navigate('/sign')}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-8 py-2.5 text-sm font-semibold transition-all duration-200',
                canProceed
                  ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/30 hover:shadow-primary-600/40'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              )}
            >
              进入签署环节
            </button>

            {!canProceed && (
              <div className="absolute bottom-full right-0 mb-2 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-xl opacity-100 pointer-events-none">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-800">
                      请先完成以下事项：
                    </p>
                    <ul className="space-y-0.5">
                      {getMissingItems().map((item, i) => (
                        <li
                          key={i}
                          className="text-xs text-gray-600 flex items-start gap-1"
                        >
                          <span className="text-amber-500">·</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="absolute -bottom-1.5 right-8 h-3 w-3 rotate-45 border-b border-r border-gray-200 bg-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      <TermDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        termIds={drawerTermIds}
        activeId={drawerActiveId}
        onSwitchTermChange={(id) => setDrawerActiveId(id)}
      />
    </div>
  );
}
