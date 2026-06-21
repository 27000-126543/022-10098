import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Syringe,
  Sparkles,
  Scissors,
  FileText,
  Check,
  User,
  Calendar,
  Stethoscope,
  Ticket,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import NavBar from '@/components/NavBar';
import StepIndicator from '@/components/StepIndicator';
import { useSignFlowStore } from '@/store/signFlow';
import { projects as rawProjects } from '@/data/projects';
import { templates } from '@/data/templates';
import type { ProjectItem, ConsentTemplate } from '@/types';
import { cn } from '@/lib/utils';

const categoryIconMap = {
  hyaluronic: Syringe,
  photoelectric: Sparkles,
  thread: Scissors,
  other: Sparkles,
} as const;

const categoryLabelMap: Record<string, string> = {
  hyaluronic: '注射类',
  photoelectric: '光电类',
  thread: '埋线类',
};

export default function ProjectSelect() {
  const navigate = useNavigate();

  const currentCustomer = useSignFlowStore((s) => s.currentCustomer);
  const selectedProjects = useSignFlowStore((s) => s.selectedProjects);
  const toggleProject = useSignFlowStore((s) => s.toggleProject);

  const allProjects: ProjectItem[] = useMemo(() => {
    return rawProjects.map((p) => {
      const matchedTemplate = templates.find((t) =>
        t.applicableProjects.includes(p.id)
      );
      return {
        id: p.id,
        name: p.name,
        category: (p.category as ProjectItem['category']) ?? 'other',
        categoryLabel: p.categoryLabel,
        consentTemplateId: matchedTemplate?.id ?? '',
      };
    });
  }, []);

  useEffect(() => {
    if (!currentCustomer) {
      navigate('/');
    }
  }, [currentCustomer, navigate]);

  const matchedTemplates: ConsentTemplate[] = useMemo(() => {
    const templateIds = new Set(selectedProjects.map((p) => p.consentTemplateId));
    return templates
      .filter((t) => templateIds.has(t.id))
      .map((t) => {
        const applicableProjectNames = allProjects
          .filter((p) => t.applicableProjects.includes(p.id))
          .map((p) => p.name);
        return {
          id: t.id,
          name: t.name,
          applicableProjects: applicableProjectNames,
          sections: t.sections.map((s) => ({
            id: s.id,
            title: s.title as ConsentTemplate['sections'][number]['title'],
            content: s.content,
            keyTerms: s.keyTerms.map((kt) => ({
              word: kt.word,
              termId: kt.termId,
            })),
            isKeyRisk: s.isKeyRisk ?? false,
          })),
        };
      });
  }, [selectedProjects, allProjects]);

  const isProjectSelected = (projectId: string) =>
    selectedProjects.some((p) => p.id === projectId);

  const handleToggleProject = (projectId: string) => {
    toggleProject(projectId, allProjects);
  };

  const selectedCount = selectedProjects.length;
  const templateCount = matchedTemplates.length;
  const canProceed = selectedCount > 0;

  if (!currentCustomer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <PageTransition>
        <main className="mx-auto max-w-5xl px-6 pb-32 pt-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              第 2 步 · 确认本次项目
            </h1>
          </div>

          <StepIndicator currentStep={1} />

          <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50">
                  <User className="h-5 w-5 text-primary-600" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">顾客姓名</div>
                  <div className="truncate text-sm font-semibold text-gray-900">
                    {currentCustomer.name}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50">
                  <Ticket className="h-5 w-5 text-primary-600" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">预约号</div>
                  <div className="truncate text-sm font-semibold text-gray-900">
                    {currentCustomer.appointmentId}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50">
                  <Stethoscope
                    className="h-5 w-5 text-primary-600"
                    strokeWidth={2}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">主治医生</div>
                  <div className="truncate text-sm font-semibold text-gray-900">
                    {currentCustomer.doctor}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50">
                  <Calendar
                    className="h-5 w-5 text-primary-600"
                    strokeWidth={2}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">预约日期</div>
                  <div className="truncate text-sm font-semibold text-gray-900">
                    {currentCustomer.appointmentDate}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                本次预约项目
              </h2>
              <span className="text-sm text-gray-500">
                点击卡片选择/取消项目
              </span>
            </div>

            {allProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-12">
                <AlertCircle className="mb-3 h-10 w-10 text-gray-400" />
                <p className="text-sm text-gray-500">暂无可用项目</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {allProjects.map((project) => {
                  const Icon =
                    categoryIconMap[project.category] ?? Sparkles;
                  const selected = isProjectSelected(project.id);

                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => handleToggleProject(project.id)}
                      className={cn(
                        'group relative flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                        selected
                          ? 'border-primary-600 bg-primary-50 shadow-card-hover'
                          : 'border-gray-200 bg-white shadow-card hover:border-gray-300 hover:shadow-card-hover'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl transition-colors duration-200',
                          selected
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                        )}
                      >
                        <Icon className="h-7 w-7" strokeWidth={2} />
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className={cn(
                              'truncate text-base font-bold',
                              selected ? 'text-gray-900' : 'text-gray-800'
                            )}
                          >
                            {project.name}
                          </h3>
                          {selected && (
                            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 shadow-sm">
                              <Check
                                className="h-4 w-4 text-white"
                                strokeWidth={3}
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                              selected
                                ? 'bg-primary-100 text-primary-700'
                                : 'bg-gray-100 text-gray-600'
                            )}
                          >
                            {project.categoryLabel ??
                              categoryLabelMap[project.category] ??
                              '其他'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                对应同意书模板
              </h2>
              <span className="text-sm text-gray-500">
                共 {templateCount} 份
              </span>
            </div>

            {templateCount === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-10">
                <FileText className="mb-3 h-10 w-10 text-gray-400" />
                <p className="mb-1 text-sm font-medium text-gray-600">
                  暂无匹配的同意书模板
                </p>
                <p className="text-xs text-gray-400">
                  请先选择上方项目，系统将自动匹配对应的知情同意书
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {matchedTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-card"
                  >
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-accent-50">
                      <FileText
                        className="h-5 w-5 text-accent-600"
                        strokeWidth={2}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-gray-900">
                        {template.name}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        适用：
                        {template.applicableProjects.join('、') || '对应类别项目'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </PageTransition>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-sm shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              已选{' '}
              <span className="font-bold text-primary-600">
                {selectedCount}
              </span>{' '}
              个项目 /{' '}
              <span className="font-bold text-primary-600">
                {templateCount}
              </span>{' '}
              份同意书
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              上一步
            </button>

            <button
              type="button"
              disabled={!canProceed}
              onClick={() => canProceed && navigate('/risk-explain')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
                canProceed
                  ? 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md'
                  : 'cursor-not-allowed bg-gray-300 focus:ring-gray-200'
              )}
            >
              开始风险讲解
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
