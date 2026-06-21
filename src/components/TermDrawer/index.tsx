import { X, Lightbulb, BookOpen } from 'lucide-react';
import { terms } from '@/data/terms';
import { cn } from '@/lib/utils';

interface TermDrawerProps {
  open: boolean;
  onClose: () => void;
  termIds: string[];
  activeId: string;
  onSwitchTermChange?: (id: string) => void;
}

export default function TermDrawer({
  open,
  onClose,
  termIds,
  activeId,
  onSwitchTermChange,
}: TermDrawerProps) {
  const activeTerm = terms.find((t) => t.id === activeId);
  const termList = termIds
    .map((id) => terms.find((t) => t.id === id))
    .filter(Boolean);

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-[400px] transform bg-white shadow-2xl transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="relative border-b border-gray-100 px-6 py-4">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            {termList.length > 1 && (
              <div className="mb-3 flex flex-wrap gap-2 pr-10">
                {termList.map((term) => (
                  <button
                    key={term!.id}
                    onClick={() => onSwitchTermChange?.(term!.id)}
                    className={cn(
                      'rounded-full px-3 py-1 text-sm font-medium transition-colors',
                      activeId === term!.id
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {term!.word}
                  </button>
                ))}
              </div>
            )}

            {activeTerm && (
              <h2 className="text-2xl font-bold text-gray-900">
                {activeTerm.word}
              </h2>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {activeTerm && (
              <>
                <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
                      <Lightbulb className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-semibold text-orange-700">
                      通俗解释
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-700">
                    {activeTerm.simpleExplanation}
                  </p>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-semibold text-blue-700">
                      详细说明
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-700">
                    {activeTerm.detailExplanation}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
