const SHORTCUTS = [
  ['←  /  P', 'Previous area'],
  ['→  /  N', 'Next area'],
  ['T', 'Toggle first technology'],
  ['S', 'Swap first technology'],
  ['A', 'Add technology modal'],
  ['R', 'Generate report'],
  ['F', 'Toggle fullscreen'],
  ['Esc', 'Close modal / panel'],
  ['Ctrl+Z', 'Undo last change'],
  ['?', 'This help overlay'],
];

export default function HelpOverlay({ onClose }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="h-1 bg-[#C5A572]" />
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              Keyboard Shortcuts
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            {SHORTCUTS.map(([key, desc]) => (
              <div key={key} className="flex items-center justify-between py-1">
                <kbd className="px-2 py-0.5 rounded bg-[#F5F0EB] text-[#8B7355] text-xs font-mono font-medium min-w-[60px] text-center">
                  {key}
                </kbd>
                <span className="text-sm text-gray-600">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
