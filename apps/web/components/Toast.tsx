'use client';

import React, { useEffect } from 'react';
import { useUIStore, Toast as ToastType } from '~/store/uiStore';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconColorMap = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
};

interface ToastItemProps {
  toast: ToastType;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const Icon = iconMap[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  return (
    <div
      className={`flex items-start space-x-3 p-4 rounded-lg border shadow-lg transition-all ${colorMap[toast.type]}`}
    >
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColorMap[toast.type]}`} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{toast.title}</p>
        {toast.message && (
          <p className="text-sm mt-1 opacity-90">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 opacity-70 hover:opacity-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
