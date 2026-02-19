import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function ReportPreviewModal({ sessionId, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getReport(sessionId)
      .then(setReport)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleDownload = () => {
    window.open(`/api/sessions/${sessionId}/report/pdf`, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#F5F0EB] rounded-xl shadow-2xl w-[90%] max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-[#E8E0D4]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E8E0D4] flex items-center justify-between bg-white">
          <div>
            <h2
              className="text-lg font-bold text-gray-900"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Report Preview
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Review before downloading</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 rounded-full border-3 border-[#C5A572] border-t-transparent animate-spin" />
              <p className="text-sm text-gray-400 mt-4">Generating report...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          ) : report ? (
            <div className="space-y-8">
              {/* Cover preview */}
              <div className="text-center pb-6 border-b border-[#E8E0D4]">
                <h3
                  className="text-3xl font-bold text-gray-900"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {report.session.project_name}
                </h3>
                <div className="w-12 h-0.5 bg-[#C5A572] mx-auto mt-3 mb-3" />
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                  Technology Selection Report
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(report.session.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>

              {/* Summary cards */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  Executive Summary
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Areas Reviewed', value: `${report.summary.areas_reviewed}/${report.summary.total_areas}` },
                    { label: 'Technologies Selected', value: report.summary.technologies_selected },
                    { label: 'Total Changes', value: report.summary.total_decisions },
                  ].map((m) => (
                    <div key={m.label} className="bg-white rounded-lg p-4 border border-[#E8E0D4]">
                      <div className="h-0.5 bg-[#C5A572] rounded-full w-8 mb-3" />
                      <p className="text-2xl font-bold text-[#C5A572]">{m.value}</p>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 mt-1">{m.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 mt-3 text-sm text-gray-500">
                  <span>Added: <strong className="text-gray-700">{report.summary.add}</strong></span>
                  <span>Removed: <strong className="text-gray-700">{report.summary.remove}</strong></span>
                  <span>Swapped: <strong className="text-gray-700">{report.summary.swap}</strong></span>
                </div>
              </div>

              {/* Area breakdown */}
              {report.areas && report.areas.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                    Area Breakdown
                  </h4>
                  <div className="space-y-4">
                    {report.areas.map((area) => (
                      <div key={area.id} className="bg-white rounded-lg border border-[#E8E0D4] overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E8E0D4]">
                          <div className="w-1 h-5 bg-[#C5A572] rounded-full" />
                          <h5
                            className="font-semibold text-gray-900 text-sm"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                          >
                            {area.name}
                          </h5>
                          <span className={`ml-auto text-[10px] uppercase tracking-wider ${area.reviewed ? 'text-[#C5A572]' : 'text-gray-400'}`}>
                            {area.reviewed ? 'Reviewed' : 'Pending'}
                          </span>
                        </div>

                        {area.technologies.length > 0 ? (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-[#C5A572] text-white">
                                <th className="text-left px-4 py-2 font-medium">Technology</th>
                                <th className="text-left px-4 py-2 font-medium">Vendor</th>
                                <th className="text-left px-4 py-2 font-medium">COE</th>
                                <th className="text-left px-4 py-2 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {area.technologies.map((tech, idx) => (
                                <tr
                                  key={tech.id}
                                  className={idx % 2 === 0 ? 'bg-[#F9F6F2]' : 'bg-white'}
                                >
                                  <td className={`px-4 py-2 ${tech.is_selected ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                    {tech.technology_name}
                                  </td>
                                  <td className="px-4 py-2 text-gray-500">{tech.vendor || '—'}</td>
                                  <td className="px-4 py-2 text-gray-500">{tech.coe_name || '—'}</td>
                                  <td className="px-4 py-2">
                                    <span className={`font-medium ${tech.is_selected ? 'text-[#C5A572]' : 'text-gray-400'}`}>
                                      {tech.is_selected ? 'Selected' : 'Available'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="px-4 py-3 text-xs text-gray-400">No technologies assigned</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Change log */}
              {report.decisions && report.decisions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                    Change Log
                  </h4>
                  <div className="bg-white rounded-lg border border-[#E8E0D4] overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#C5A572] text-white">
                          <th className="text-left px-4 py-2 font-medium">Date</th>
                          <th className="text-left px-4 py-2 font-medium">Action</th>
                          <th className="text-left px-4 py-2 font-medium">Technology</th>
                          <th className="text-left px-4 py-2 font-medium">Area</th>
                          <th className="text-left px-4 py-2 font-medium">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.decisions.map((d, idx) => (
                          <tr
                            key={d.id}
                            className={idx % 2 === 0 ? 'bg-[#F9F6F2]' : 'bg-white'}
                          >
                            <td className="px-4 py-2 text-gray-400 whitespace-nowrap">
                              {new Date(d.created_at).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                              })}
                            </td>
                            <td className="px-4 py-2">
                              <span className={`font-semibold uppercase ${
                                d.action === 'add' ? 'text-green-700'
                                : d.action === 'remove' ? 'text-red-700'
                                : 'text-blue-700'
                              }`}>
                                {d.action}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-700">{d.technology_name || '—'}</td>
                            <td className="px-4 py-2 text-gray-500">{d.area_name || '—'}</td>
                            <td className="px-4 py-2 text-gray-500 truncate max-w-[200px]">{d.details || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!loading && !error && report && (
          <div className="px-6 py-4 border-t border-[#E8E0D4] bg-white flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {report.areas?.length || 0} areas &middot; {report.summary.total_decisions} changes
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleDownload}
                className="px-6 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F] transition-colors"
              >
                Download PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
