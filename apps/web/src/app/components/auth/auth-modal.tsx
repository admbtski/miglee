'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useCallback, useEffect, useId, useState } from 'react';
import { SignInPanel } from './sign-in-panel';
import { SignUpPanel } from './sign-up-panel'; // zakładam, że już masz

export type AuthMode = 'signin' | 'signup';

type SubmitPayload = {
  email?: string;
  password?: string;
  mode: AuthMode;
  username?: string;
  remember?: boolean;
};

type Props = {
  open?: boolean;
  mode?: AuthMode;
  onModeChange?: (m: AuthMode) => void;
  defaultTab?: 'signin' | 'signup';
  onClose: () => void;
  onSubmit?: (payload: SubmitPayload) => void;
  onSocial?: (
    p: 'google' | 'github' | 'linkedin' | 'facebook' | 'apple' | 'twitter'
  ) => void;
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
} as const;
const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', duration: 0.5, bounce: 0.28 },
  },
  exit: { opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.2 } },
} as const;
const panelVariants = {
  hidden: { opacity: 0, x: 12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', duration: 0.45, bounce: 0.25 },
  },
  exit: { opacity: 0, x: -12, transition: { duration: 0.18 } },
} as const;

export function AuthModal({
  open = true,
  mode,
  onModeChange,
  defaultTab,
  onClose = () => {},
  onSubmit = () => {},
  onSocial = () => {},
}: Props) {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(open);
  const [internalMode, setInternalMode] = useState<AuthMode>(mode ?? 'signin');

  useEffect(() => {
    if (mode) setInternalMode(mode);
  }, [mode]);
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);
  useEffect(() => {
    if (open && !mode && defaultTab) setInternalMode(defaultTab);
  }, [open, defaultTab, mode]);

  const setMode = useCallback(
    (m: AuthMode) => {
      if (!mode) setInternalMode(m);
      onModeChange?.(m);
    },
    [mode, onModeChange]
  );

  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [username, setUsername] = useState('');
  const [remember, setRemember] = useState(true);

  const handleSubmit = useCallback(() => {
    onSubmit?.({
      email: internalMode === 'signup' && email ? email : undefined,
      username,
      password: pwd,
      mode: internalMode,
      remember: internalMode === 'signin' ? remember : undefined,
    });
  }, [email, pwd, internalMode, username, remember, onSubmit]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'enter') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, handleSubmit]);

  useEffect(() => {
    if (!mounted) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    if (sbw > 0) document.body.style.paddingRight = `${sbw}px`;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [mounted]);

  const titleId = useId();
  const descId = useId();
  const onBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.currentTarget === e.target) onClose();
  };

  const title = internalMode === 'signin' ? 'Zaloguj się' : 'Utwórz konto';
  if (!mounted && !open) return null;

  return (
    <AnimatePresence
      initial={false}
      mode="wait"
      onExitComplete={() => setMounted(false)}
    >
      {open && (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          onMouseDown={onBackdropMouseDown}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={prefersReducedMotion ? { duration: 0 } : {}}
        >
          <motion.div
            key="card"
            className="w-[92vw] max-w-md rounded-3xl border shadow-2xl outline-none
                       border-zinc-200 bg-white text-zinc-900
                       dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={prefersReducedMotion ? { duration: 0 } : {}}
          >
            <div className="flex items-center justify-between px-6 py-5">
              <h2 id={titleId} className="text-2xl font-semibold">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-lg p-2
                           text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900
                           dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Zamknij"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6">
              <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800" />
            </div>

            <div className="px-6 pb-6">
              <p id={descId} className="sr-only">
                {internalMode === 'signin'
                  ? 'Formularz logowania'
                  : 'Formularz tworzenia konta'}
              </p>

              <AnimatePresence mode="popLayout" initial={false}>
                {internalMode === 'signin' ? (
                  <motion.div
                    key="signin"
                    variants={panelVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    transition={prefersReducedMotion ? { duration: 0 } : {}}
                  >
                    <SignInPanel
                      username={username}
                      setUsername={setUsername}
                      password={pwd}
                      setPassword={setPwd}
                      remember={remember}
                      setRemember={setRemember}
                      onSubmit={handleSubmit}
                      onGotoSignup={() => setMode('signup')}
                      onSocial={onSocial}
                      requirePassword={false}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="signup"
                    variants={panelVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    transition={prefersReducedMotion ? { duration: 0 } : {}}
                  >
                    <SignUpPanel
                      username={username}
                      setUsername={setUsername}
                      email={email}
                      setEmail={setEmail}
                      password={pwd}
                      setPassword={setPwd}
                      onSubmit={handleSubmit}
                      onGotoSignin={() => setMode('signin')}
                      onSocial={onSocial}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
