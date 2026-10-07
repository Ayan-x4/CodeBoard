import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastMessage { id: number; message: string; type: 'success' | 'error' | 'info' }
export function Toast({ message, onClose }: { message: ToastMessage | null; onClose: () => void }) {
  if (!message) return null;
  return <div className={`toast ${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}<span>{message.message}</span><button aria-label="Dismiss notification" onClick={onClose}><X size={15} /></button></div>;
}
