import { motion, AnimatePresence } from 'framer-motion';

export function ClickBurst({ trigger }: { trigger: number }) {
  return (
    <AnimatePresence>
      {trigger > 0 && (
        <motion.span
          key={trigger}
          initial={{ scale: 0.6, opacity: 0.35 }}
          animate={{ scale: 1.6, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0 rounded-xl bg-indigo-400/30"
        />
      )}
    </AnimatePresence>
  );
}
