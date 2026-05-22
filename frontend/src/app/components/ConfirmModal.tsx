import { X, AlertTriangle, CheckCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'success';
}

export function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Xác nhận", 
  cancelText = "Hủy",
  type = 'info'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger': return <AlertTriangle className="w-6 h-6" />;
      case 'success': return <CheckCircle className="w-6 h-6" />;
      default: return <X className="w-6 h-6" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'danger': return 'bg-rose-50 text-rose-600';
      case 'success': return 'bg-green-50 text-green-600';
      default: return 'bg-blue-50 text-blue-600';
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'danger': return 'bg-rose-800 hover:bg-rose-900 shadow-rose-100';
      case 'success': return 'bg-green-800 hover:bg-green-900 shadow-green-100';
      default: return 'bg-stone-900 hover:bg-stone-800 shadow-stone-100';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="bg-white w-full max-w-sm rounded-sm shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${getIconBg()}`}>
              {getIcon()}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-stone-900">{title}</h3>
              <p className="text-sm text-stone-500 mt-1">{message}</p>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button 
              onClick={onCancel}
              className="flex-1 py-2.5 border border-stone-200 text-stone-600 text-xs font-bold uppercase tracking-widest hover:bg-stone-50 transition-colors rounded-sm"
            >
              {cancelText}
            </button>
            <button 
              onClick={() => {
                onConfirm();
                // Note: we don't call onCancel() here anymore because updateStatus handles closing it
              }}
              className={`flex-1 py-2.5 text-white text-xs font-bold uppercase tracking-widest transition-all rounded-sm shadow-lg ${getButtonClass()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
