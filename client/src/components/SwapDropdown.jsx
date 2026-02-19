import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';

export default function SwapDropdown({ areaTech, onSwap, onClose }) {
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);

  useEffect(() => {
    if (!areaTech.coe_id) {
      setAlternatives([]);
      setLoading(false);
      return;
    }
    api.getTechnologies({ coe_id: areaTech.coe_id })
      .then((techs) => {
        setAlternatives(techs.filter((t) => t.id !== areaTech.technology_id));
      })
      .catch(() => setAlternatives([]))
      .finally(() => setLoading(false));
  }, [areaTech.coe_id, areaTech.technology_id]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border-2 border-[#C5A572] rounded-lg shadow-xl overflow-hidden"
    >
      <div className="px-3 py-2 bg-[#F5F0EB] border-b border-[#E8E0D4]">
        <p className="text-xs font-medium uppercase tracking-wider text-[#8B7355]">
          Swap with alternative
        </p>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-400">Loading...</div>
        ) : alternatives.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-400">No alternatives in this COE</div>
        ) : (
          alternatives.map((tech) => (
            <button
              key={tech.id}
              onClick={() => onSwap(areaTech, tech)}
              className="w-full text-left px-3 py-2.5 hover:bg-[#F5F0EB] border-b border-[#F5F0EB] last:border-0 transition-colors"
            >
              <p className="text-sm font-medium text-gray-900">{tech.name}</p>
              {tech.vendor && (
                <p className="text-xs text-gray-500">{tech.vendor}</p>
              )}
              {tech.description && (
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{tech.description}</p>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
