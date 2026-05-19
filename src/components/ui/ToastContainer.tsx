import { AnimatePresence, motion } from 'framer-motion';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';

const ICONS = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
const COLORS = {
  success: 'border-green-500/30 bg-green-500/10 text-green-300',
  error:   'border-red-500/30 bg-red-500/10 text-red-300',
  info:    'border-nova-accent/30 bg-nova-accent/10 text-nova-text',
  warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
};

export function ToastContainer() {
  const toasts      = useUserStore(s => s.toasts);
  const removeToast = useUserStore(s => s.removeToast);

  return (
    <div className="fixed bottom-6 right-4 z-[200] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={() => removeToast(t.id)}
            className={cn(
              'pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl',
              'border backdrop-blur-xl shadow-2xl cursor-pointer',
              COLORS[t.type]
            )}>
            <span className="text-base">{ICONS[t.type]}</span>
            <p className="text-sm font-medium flex-1">{t.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
