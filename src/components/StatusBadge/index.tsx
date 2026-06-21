import { cn } from '@/lib/utils';
import type { SignStatus } from '@/types';

interface StatusBadgeProps {
  status: SignStatus;
}

const STATUS_CONFIG: Record<SignStatus, { label: string; className: string }> = {
  pending: {
    label: '待核验',
    className: 'bg-gray-100 text-gray-600',
  },
  explaining: {
    label: '讲解中',
    className: 'bg-blue-100 text-blue-700',
  },
  ready_to_sign: {
    label: '待签署',
    className: 'bg-purple-100 text-purple-700',
  },
  completed: {
    label: '已完成',
    className: 'bg-green-100 text-green-700',
  },
  exception: {
    label: '异常',
    className: 'bg-red-100 text-red-700',
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 text-xs font-medium rounded-full',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
