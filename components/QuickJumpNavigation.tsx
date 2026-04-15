import React from 'react';

export type QuickJumpItem = {
  id: string;
  label: string;
};

type QuickJumpNavigationProps = {
  activeId: string;
  availableIds: string[];
  items: QuickJumpItem[];
  onJump: (id: string) => void;
};

const QuickJumpNavigation: React.FC<QuickJumpNavigationProps> = ({
  activeId,
  availableIds,
  items,
  onJump,
}) => {
  const availableSet = new Set(availableIds);

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        Quick Jump
      </p>

      <div className="space-y-1">
        {items.map((item) => {
          const isAvailable = availableSet.has(item.id);
          const isActive = isAvailable && activeId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (isAvailable) onJump(item.id);
              }}
              aria-current={isActive ? 'true' : undefined}
              aria-disabled={!isAvailable}
              className={[
                'flex h-7 w-full items-center gap-2 border-l-2 pl-3 pr-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
                isActive
                  ? 'border-teal-500 bg-teal-50 font-medium text-slate-900'
                  : isAvailable
                    ? 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    : 'border-transparent text-slate-400',
              ].join(' ')}
            >
              <span
                className={[
                  'text-xs',
                  isActive
                    ? 'text-teal-500'
                    : isAvailable
                      ? 'text-slate-300'
                      : 'text-slate-200',
                ].join(' ')}
                aria-hidden="true"
              >
                {isActive ? '●' : '○'}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickJumpNavigation;
