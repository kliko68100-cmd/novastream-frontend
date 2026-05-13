import { AnimatePresence, motion } from 'framer-motion';
import { useUserStore } from '@/stores/userStore';

const ICONS = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
  warning: '⚠',
};
const COLORS = {
  success: 'border-nova-success text-nova-success',
  error:   'border-nova-accent text-nova-accent',
  info:    'border-blue-500 text-blue-400',
  warning: 'border-nova-gold text-nova-gold',
};

export function ToastContainer() {
  const toasts      = useUserStore(s => s.toasts);
  const removeToast = useUserStore(s => s.removeToast);

  return (
    <div className="fixed bottom-24 right-4 z-[200] flex flex-col gap-2 md:bottom-6">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={() => removeToast(t.id)}
            className={`flex items-center gap-3 cursor-pointer rounded-lg border bg-nova-bg2/95 
              backdrop-blur px-4 py-3 shadow-2xl text-sm font-medium
              ${COLORS[t.type]} max-w-xs`}
          >
            <span className="text-lg">{ICONS[t.type]}</span>
            <span className="text-nova-text">{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
