import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import ReportPreviewModal from '../../components/ReportPreviewModal';

export default function SessionsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionsByProject, setSessionsByProject] = useState({});
  const [expandedProject, setExpandedProject] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [showReport, setShowReport] = useState(null);
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const [compareData, setCompareData] = useState(null);

  useEffect(() => {
    setError(null);
    api.getProjects()
      .then(async (projs) => {
        setProjects(projs);
        const map = {};
        for (const p of projs) {
          const sessions = await api.getProjectSessions(p.id);
          if (sessions.length > 0) map[p.id] = sessions;
        }
        setSessionsByProject(map);
      })
      .catch((err) => setError(err.message || 'Failed to load sessions'))
      .finally(() => setLoading(false));
  }, []);

  const loadDecisions = async (session) => {
    setSelectedSession(session);
    const d = await api.getDecisions(session.id);
    setDecisions(d);
  };

  const handleCompare = async () => {
    if (!compareA || !compareB) return;
    const [dA, dB] = await Promise.all([
      api.getDecisions(compareA),
      api.getDecisions(compareB),
    ]);
    setCompareData({ a: dA, b: dB });
  };

  const projectsWithSessions = projects.filter((p) => sessionsByProject[p.id]?.length > 0);

  return (
    <div>
      <div className="px-8 py-5 bg-white border-b border-[#E8E0D4]">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
          Session History
        </h2>
      </div>

      <div className="p-8">
        {error ? (
          <div className="text-center py-12 slide-in">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-3">{error}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F] transition-colors">
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-lg border border-[#E8E0D4] overflow-hidden">
                <div className="px-5 py-4 space-y-2">
                  <div className="h-5 w-40 rounded shimmer-row" />
                  <div className="h-3 w-24 rounded shimmer-row" />
                </div>
              </div>
            ))}
          </div>
        ) : projectsWithSessions.length === 0 ? (
          <div className="text-center py-16 slide-in">
            <div className="w-16 h-16 rounded-full bg-[#C5A572]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#C5A572]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-1 font-medium">No sessions recorded yet</p>
            <p className="text-sm text-gray-400">Start a presentation to begin recording sessions.</p>
          </div>
        ) : (
          <div className="space-y-4 slide-in">
            {projectsWithSessions.map((p) => {
              const sessions = sessionsByProject[p.id] || [];
              const isExpanded = expandedProject === p.id;
              return (
                <div key={p.id} className="bg-white rounded-lg border border-[#E8E0D4] overflow-hidden">
                  <button
                    onClick={() => setExpandedProject(isExpanded ? null : p.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#FAFAF7] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {p.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-[#C5A572]/10 text-[#8B7355] text-xs">
                        {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[#E8E0D4]">
                      {/* Compare selector */}
                      {sessions.length >= 2 && (
                        <div className="px-5 py-3 bg-[#FAFAF7] border-b border-[#E8E0D4] flex items-center gap-3">
                          <span className="text-xs text-gray-500">Compare:</span>
                          <select
                            value={compareA || ''}
                            onChange={(e) => setCompareA(e.target.value ? Number(e.target.value) : null)}
                            className="px-2 py-1 rounded border border-[#E8E0D4] text-xs bg-white"
                          >
                            <option value="">Session A</option>
                            {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <span className="text-xs text-gray-400">vs</span>
                          <select
                            value={compareB || ''}
                            onChange={(e) => setCompareB(e.target.value ? Number(e.target.value) : null)}
                            className="px-2 py-1 rounded border border-[#E8E0D4] text-xs bg-white"
                          >
                            <option value="">Session B</option>
                            {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <button
                            onClick={handleCompare}
                            disabled={!compareA || !compareB || compareA === compareB}
                            className="px-3 py-1 rounded bg-[#C5A572] text-white text-xs font-medium hover:bg-[#B8975F] disabled:opacity-50"
                          >
                            Compare
                          </button>
                        </div>
                      )}

                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[#FAFAF7] border-b border-[#E8E0D4]">
                            <th className="text-left px-5 py-2 font-medium text-gray-500 text-xs uppercase tracking-wider">Session</th>
                            <th className="text-left px-5 py-2 font-medium text-gray-500 text-xs uppercase tracking-wider">Date</th>
                            <th className="text-left px-5 py-2 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                            <th className="text-left px-5 py-2 font-medium text-gray-500 text-xs uppercase tracking-wider">Attendees</th>
                            <th className="text-right px-5 py-2 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.map((s) => (
                            <tr key={s.id} className="border-b border-[#E8E0D4] hover:bg-[#FAFAF7]">
                              <td className="px-5 py-3 font-medium text-gray-900">{s.name}</td>
                              <td className="px-5 py-3 text-gray-500 text-xs">
                                {new Date(s.created_at).toLocaleString()}
                              </td>
                              <td className="px-5 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  s.status === 'active' ? 'bg-green-100 text-green-700'
                                  : s.status === 'completed' ? 'bg-[#C5A572]/10 text-[#8B7355]'
                                  : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {s.status}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-gray-500 text-xs">{s.attendees || '—'}</td>
                              <td className="px-5 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => loadDecisions(s)}
                                    className="text-xs text-[#C5A572] hover:text-[#B8975F] font-medium"
                                  >
                                    Decisions
                                  </button>
                                  <button
                                    onClick={() => setShowReport(s.id)}
                                    className="text-xs text-[#C5A572] hover:text-[#B8975F] font-medium"
                                  >
                                    Report
                                  </button>
                                  <a
                                    href={`/api/sessions/${s.id}/report/pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-gray-400 hover:text-[#C5A572]"
                                  >
                                    PDF
                                  </a>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decision log panel */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm fade-in" onClick={() => setSelectedSession(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[#E8E0D4] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {selectedSession.name}
                </h3>
                <p className="text-xs text-gray-400">{decisions.length} decisions</p>
              </div>
              <button onClick={() => setSelectedSession(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {decisions.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No decisions in this session</p>
              ) : (
                <div className="space-y-2">
                  {decisions.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#E8E0D4] bg-[#FAFAF7]">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        d.action === 'add' ? 'bg-green-100 text-green-700'
                        : d.action === 'remove' ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                      }`}>
                        {d.action}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{d.technology_name || 'N/A'} <span className="text-gray-400">in</span> {d.area_name || 'N/A'}</p>
                        {d.details && <p className="text-xs text-gray-500 truncate">{d.details}</p>}
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {new Date(d.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compare view */}
      {compareData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm fade-in" onClick={() => setCompareData(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[#E8E0D4] flex items-center justify-between">
              <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                Session Comparison
              </h3>
              <button onClick={() => setCompareData(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto grid grid-cols-2 divide-x divide-[#E8E0D4]">
              {[compareData.a, compareData.b].map((decisions, idx) => (
                <div key={idx} className="p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                    Session {idx === 0 ? 'A' : 'B'} ({decisions.length} decisions)
                  </h4>
                  <div className="space-y-2">
                    {decisions.map((d) => (
                      <div key={d.id} className="p-2 rounded border border-[#E8E0D4] bg-[#FAFAF7]">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            d.action === 'add' ? 'bg-green-100 text-green-700'
                            : d.action === 'remove' ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                          }`}>
                            {d.action}
                          </span>
                          <span className="text-xs text-gray-900">{d.technology_name || 'N/A'}</span>
                        </div>
                        {d.details && <p className="text-[10px] text-gray-500 mt-1">{d.details}</p>}
                      </div>
                    ))}
                    {decisions.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No decisions</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report preview */}
      {showReport && (
        <ReportPreviewModal sessionId={showReport} onClose={() => setShowReport(null)} />
      )}
    </div>
  );
}
