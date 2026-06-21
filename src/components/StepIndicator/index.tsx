import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
}

const STEPS = [
  '顾客核验',
  '项目选择',
  '风险讲解',
  '电子签署',
  '完成',
  '归档',
];

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full py-6">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        {STEPS.map((stepName, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={index} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <div className="relative flex flex-col items-center">
                  <div
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                      isCompleted
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : isCurrent
                        ? 'border-primary-600 bg-white'
                        : 'border-gray-300 bg-white text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" strokeWidth={2.5} />
                    ) : (
                      <span
                        className={`text-sm font-semibold ${
                          isCurrent ? 'text-primary-600' : 'text-gray-400'
                        }`}
                      >
                        {index + 1}
                      </span>
                    )}

                    {isCurrent && (
                      <span className="absolute h-10 w-10 animate-ping rounded-full bg-primary-600 opacity-20" />
                    )}
                  </div>

                  <span
                    className={`mt-2 whitespace-nowrap text-xs font-medium transition-colors duration-300 ${
                      isCompleted || isCurrent
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    {stepName}
                  </span>
                </div>

                {index < STEPS.length - 1 && (
                  <div className="mx-1 -mt-4 h-0.5 flex-1 bg-gray-200">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCompleted ? 'w-full bg-primary-600' : 'w-0'
                      }`}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
