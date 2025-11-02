import { AnimatePresence, motion } from 'framer-motion';

export const ClickParticle = ({ trigger = 0 }: { trigger: number }) => (
  <AnimatePresence>
    {trigger > 0 && (
      <motion.div
        key={`dots-${trigger}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pointer-events-none absolute inset-0"
      >
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const x = Math.cos(angle) * 22;
          const y = Math.sin(angle) * 22;
          return (
            <motion.span
              key={i}
              initial={{ x: 0, y: 0, scale: 0.6, opacity: 0.8 }}
              animate={{ x, y, scale: 0, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 dark:bg-white/60"
            />
          );
        })}
      </motion.div>
    )}
  </AnimatePresence>
);
