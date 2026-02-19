import { useEffect } from 'react';

export function useKeyboardShortcuts(handlers, deps = []) {
  useEffect(() => {
    function onKeyDown(e) {
      // Ignore when typing in inputs/textareas
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        if (e.key === 'Escape' && handlers.Escape) {
          handlers.Escape(e);
        }
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key === 'z') {
        e.preventDefault();
        handlers['mod+z']?.(e);
        return;
      }

      if (e.key === 'Escape') { handlers.Escape?.(e); return; }
      if (e.key === 'ArrowLeft' || e.key === 'p') { handlers.prev?.(e); return; }
      if (e.key === 'ArrowRight' || e.key === 'n') { handlers.next?.(e); return; }
      if (e.key === 't') { handlers.toggle?.(e); return; }
      if (e.key === 's') { handlers.swap?.(e); return; }
      if (e.key === 'a') { handlers.add?.(e); return; }
      if (e.key === 'r') { handlers.report?.(e); return; }
      if (e.key === 'f') { handlers.fullscreen?.(e); return; }
      if (e.key === '?') { handlers.help?.(e); return; }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, deps);
}
