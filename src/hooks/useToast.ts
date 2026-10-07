import { useCallback, useEffect, useState } from 'react';
import type { ToastMessage } from '../components/Toast';

export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const notify = useCallback((message: string, type: ToastMessage['type'] = 'success') => setToast({ id: Date.now(), message, type }), []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), toast.type === 'error' ? 8000 : 4000); return () => clearTimeout(timer); }, [toast]);
  return { toast, notify, dismiss: () => setToast(null) };
}
