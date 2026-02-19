import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';

export default function AddTechModal({ projectId, areaId, existingTechIds, onAdd, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [allTechs, setAllTechs] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    api.getTechnologies({ project_id: projectId }).then(setAllTechs).catch(() => {});
  }, [projectId]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(allTechs.filter((t) => !existingTechIds.has(t.id)));
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      api.searchTechnologies(query)
        .then((r) => setResults(r.filter((t) => !existingTechIds.has(t.id))))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, allTechs, existingTechIds]);

  // Group by COE
  const grouped = {};
  for (const t of results) {
    const key = t.coe_name || 'Uncategorized';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Gold top bar */}
        <div className="h-1 bg-[#C5A572]" />

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              Add Technology
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search technologies..."
            className="w-full px-4 py-2.5 rounded-lg border border-[#E8E0D4] focus:border-[#C5A572] focus:ring-1 focus:ring-[#C5A572] outline-none text-sm transition-colors"
          />

          {/* Results */}
          <div className="mt-3 max-h-72 overflow-y-auto -mx-1 px-1">
            {loading ? (
              <p className="text-center text-sm text-gray-400 py-6">Searching...</p>
            ) : Object.keys(grouped).length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">
                {query ? 'No matching technologies' : 'All technologies already assigned'}
              </p>
            ) : (
              Object.entries(grouped).map(([coe, techs]) => (
                <div key={coe} className="mb-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[#8B7355] px-1 mb-1">
                    {coe}
                  </p>
                  {techs.map((tech) => (
                    <button
                      key={tech.id}
                      onClick={() => onAdd(tech)}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[#F5F0EB] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{tech.name}</p>
                          {tech.vendor && <p className="text-xs text-gray-500">{tech.vendor}</p>}
                        </div>
                        <svg className="w-4 h-4 text-[#C5A572] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
