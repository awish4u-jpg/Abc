import { useState } from 'react';

export default function TechCard({
  areaTech,
  onToggle,
  onSwapOpen,
  onNotesOpen,
  isActive,
}) {
  const selected = !!areaTech.is_selected;

  return (
    <div
      className={`relative bg-white rounded-lg border transition-all duration-200 ${
        selected
          ? 'border-[#C5A572] shadow-md shadow-[#C5A572]/10'
          : 'border-[#E8E0D4] opacity-75'
      } ${isActive ? 'ring-2 ring-[#C5A572]' : ''}`}
    >
      {/* Gold top accent */}
      <div className={`h-1 rounded-t-lg ${selected ? 'bg-[#C5A572]' : 'bg-gray-200'}`} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-gray-900 text-sm truncate">
              {areaTech.technology_name}
            </h4>
            {areaTech.vendor && (
              <p className="text-xs text-gray-500">{areaTech.vendor}</p>
            )}
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Notes */}
            <button
              onClick={(e) => { e.stopPropagation(); onNotesOpen(areaTech); }}
              className="p-1.5 rounded-md hover:bg-[#F5F0EB] text-[#C5A572] transition-colors"
              title="Edit notes (N)"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>

            {/* Swap */}
            <button
              onClick={(e) => { e.stopPropagation(); onSwapOpen(areaTech); }}
              className="p-1.5 rounded-md hover:bg-[#F5F0EB] text-[#C5A572] transition-colors"
              title="Swap technology (S)"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>

            {/* Toggle */}
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(areaTech); }}
              className={`p-1 rounded-full border-2 transition-all duration-200 ${
                selected
                  ? 'bg-[#C5A572] border-[#C5A572] text-white'
                  : 'bg-white border-gray-300 text-transparent hover:border-[#C5A572]'
              }`}
              title="Toggle selection (T)"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* COE badge */}
        {areaTech.coe_name && (
          <span className="inline-block text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F5F0EB] text-[#8B7355] mb-2">
            {areaTech.coe_name}
          </span>
        )}

        {/* Description */}
        {areaTech.technology_description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">
            {areaTech.technology_description}
          </p>
        )}

        {/* Notes indicator */}
        {areaTech.notes && (
          <div className="mt-2 pt-2 border-t border-[#F5F0EB]">
            <p className="text-xs text-[#8B7355] italic line-clamp-1">
              {areaTech.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
