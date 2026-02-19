import { useState, useRef, useEffect } from 'react';

export default function NotesEditor({ areaTech, onSave, onClose }) {
  const [notes, setNotes] = useState(areaTech.notes || '');
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  function handleBlur() {
    if (notes !== (areaTech.notes || '')) {
      onSave(areaTech, notes);
    }
    onClose();
  }

  return (
    <div className="mt-2 pt-2 border-t border-[#F5F0EB]">
      <textarea
        ref={ref}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            e.target.blur();
          }
        }}
        placeholder="Add notes..."
        rows={2}
        className="w-full text-xs px-2 py-1.5 rounded border border-[#E8E0D4] focus:border-[#C5A572] focus:ring-1 focus:ring-[#C5A572] outline-none resize-none transition-colors"
      />
    </div>
  );
}
