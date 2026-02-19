import { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function isImage(mimetype) {
  return mimetype && mimetype.startsWith('image/');
}

export default function MediaPage() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const load = () => {
    setLoading(true);
    setError(null);
    const params = {};
    if (filter) params.mimetype = filter;
    api.getMedia(params)
      .then(setMedia)
      .catch((err) => { setMedia([]); setError(err.message || 'Failed to load media'); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      try {
        await api.uploadFile(file);
      } catch (err) {
        console.error('Upload failed:', err.message);
      }
    }
    setUploading(false);
    load();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleDelete = async (id) => {
    await api.deleteMedia(id);
    setMedia((prev) => prev.filter((m) => m.id !== id));
    if (preview?.id === id) setPreview(null);
  };

  return (
    <div>
      <div className="px-8 py-5 bg-white border-b border-[#E8E0D4] flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
          Media Manager
        </h2>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm bg-white focus:outline-none focus:border-[#C5A572] transition-colors"
          >
            <option value="">All types</option>
            <option value="image/">Images</option>
            <option value="application/pdf">PDFs</option>
            <option value="text/csv">CSV</option>
            <option value="application/vnd">Office docs</option>
          </select>
          <button
            onClick={() => fileRef.current?.click()}
            className="px-5 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F] transition-colors"
          >
            Upload Files
          </button>
          <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
        </div>
      </div>

      <div className="p-8">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            dragOver ? 'border-[#C5A572] bg-[#C5A572]/5' : 'border-[#E8E0D4]'
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-[#C5A572] border-t-transparent animate-spin" />
              <span className="text-sm text-gray-500">Uploading...</span>
            </div>
          ) : (
            <div>
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-400">Drag & drop files here, or click Upload</p>
              <p className="text-xs text-gray-300 mt-1">Images, PDFs, CSV, Excel, PowerPoint (max 10MB)</p>
            </div>
          )}
        </div>

        {/* Media grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="bg-white rounded-lg border border-[#E8E0D4] overflow-hidden">
                <div className="aspect-square shimmer-row" />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-24 rounded shimmer-row" />
                  <div className="h-2 w-12 rounded shimmer-row" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 slide-in">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-1 font-medium">Failed to load media</p>
            <p className="text-sm text-gray-400 mb-4">{error}</p>
            <button onClick={load} className="px-5 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F] transition-colors">
              Retry
            </button>
          </div>
        ) : media.length === 0 ? (
          <div className="text-center py-16 slide-in">
            <div className="w-16 h-16 rounded-full bg-[#C5A572]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#C5A572]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-1 font-medium">No media files yet</p>
            <p className="text-sm text-gray-400 mb-4">Upload images, PDFs, or documents to get started.</p>
            <button onClick={() => fileRef.current?.click()} className="px-5 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F] transition-colors">
              Upload Files
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 slide-in">
            {media.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-lg border border-[#E8E0D4] overflow-hidden group hover:shadow-md transition-shadow card-hover"
              >
                {/* Preview */}
                <div
                  className="aspect-square bg-[#FAFAF7] flex items-center justify-center cursor-pointer relative"
                  onClick={() => setPreview(m)}
                >
                  {isImage(m.mimetype) ? (
                    <img src={m.url} alt={m.original_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <svg className="w-10 h-10 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase">{m.mimetype.split('/').pop()}</p>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-xs font-medium text-gray-900 truncate">{m.original_name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-gray-400">{formatSize(m.size)}</span>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-[10px] text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  </div>
                  {(m.coe_name || m.area_name) && (
                    <div className="flex gap-1 mt-1">
                      {m.coe_name && <span className="px-1.5 py-0.5 rounded bg-[#C5A572]/10 text-[#8B7355] text-[10px]">{m.coe_name}</span>}
                      {m.area_name && <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px]">{m.area_name}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm fade-in" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl max-h-[85vh] overflow-hidden scale-in" onClick={(e) => e.stopPropagation()}>
            {isImage(preview.mimetype) ? (
              <img src={preview.url} alt={preview.original_name} className="max-h-[70vh] object-contain" />
            ) : (
              <div className="p-12 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-4 font-medium text-gray-900">{preview.original_name}</p>
              </div>
            )}
            <div className="px-6 py-4 border-t border-[#E8E0D4] flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{preview.original_name}</p>
                <p className="text-xs text-gray-400">{formatSize(preview.size)} &middot; {preview.mimetype}</p>
              </div>
              <div className="flex gap-3">
                <a href={preview.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg border border-[#E8E0D4] text-sm text-gray-700 hover:border-[#C5A572] transition-colors">
                  Open
                </a>
                <button onClick={() => { handleDelete(preview.id); setPreview(null); }} className="px-4 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
