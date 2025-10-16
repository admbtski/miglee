'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { useId, useMemo, useRef, useState } from 'react';

type Social =
  | 'google'
  | 'github'
  | 'linkedin'
  | 'facebook'
  | 'apple'
  | 'twitter';

export function SignInPanel(props: {
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  remember: boolean;
  setRemember: (v: boolean) => void;
  onSubmit: () => void | Promise<void>;
  onGotoSignup: () => void;
  onSocial?: (p: Social) => void;
  /** NEW: allow disabling password validation (for dev login) */
  requirePassword?: boolean;
}) {
  const {
    username,
    setUsername,
    password,
    setPassword,
    remember,
    setRemember,
    onSubmit,
    onGotoSignup,
    onSocial,
    requirePassword = true,
  } = props;

  const prefersReducedMotion = useReducedMotion();

  const isValidUsername = (v: string) => /^[a-zA-Z0-9._-]{3,20}$/.test(v);
  const validate = (u: string, p: string) => {
    const errors: { username?: string; password?: string } = {};
    if (!u) errors.username = 'Wpisz nazwę użytkownika';
    else if (!isValidUsername(u))
      errors.username = '3–20 znaków: litery, cyfry, „.” „_” „-”';

    if (requirePassword) {
      if (!p) errors.password = 'Wpisz hasło';
      else if (p.length < 6) errors.password = 'Hasło musi mieć min. 6 znaków';
    }
    return errors;
  };

  const [touched, setTouched] = useState<{
    username?: boolean;
    password?: boolean;
  }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  const usernameId = useId();
  const pwdId = useId();
  const usernameErrId = useId();
  const pwdErrId = useId();
  const usernameRef = useRef<HTMLInputElement | null>(null);
  const pwdRef = useRef<HTMLInputElement | null>(null);

  const errors = useMemo(
    () => validate(username, password),
    [username, password, requirePassword]
  );
  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const focusFirstInvalid = () => {
    if (errors.username) return usernameRef.current?.focus();
    if (errors.password) return pwdRef.current?.focus();
  };

  const trySubmit = async () => {
    setSubmitAttempted(true);
    if (!isValid) {
      setShake(true);
      window.setTimeout(() => setShake(false), 350);
      focusFirstInvalid();
      return;
    }
    try {
      setSubmitting(true);
      await Promise.resolve(onSubmit());
    } finally {
      setSubmitting(false);
    }
  };

  const errorVariants = {
    initial: { opacity: 0, height: 0, y: -4 },
    animate: {
      opacity: 1,
      height: 'auto',
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.18 },
    },
    exit: {
      opacity: 0,
      height: 0,
      y: -4,
      transition: { duration: prefersReducedMotion ? 0 : 0.15 },
    },
  };

  const SOCIAL: Array<{ key: Social; iconSlug: string; hex: string }> = [
    { key: 'google', iconSlug: 'google', hex: 'EA4335' },
    { key: 'github', iconSlug: 'github', hex: 'ffffff' },
    { key: 'linkedin', iconSlug: 'linkedin', hex: '0A66C2' },
    { key: 'facebook', iconSlug: 'facebook', hex: '1877F2' },
    { key: 'apple', iconSlug: 'apple', hex: 'ffffff' },
    { key: 'twitter', iconSlug: 'x', hex: 'cccccc' },
  ];

  return (
    <motion.form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void trySubmit();
      }}
      animate={shake ? { x: [0, -8, 8, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.35 }}
      className="pt-5"
    >
      {/* Username */}
      <div className="group">
        <label htmlFor={usernameId} className="sr-only">
          Username
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <User
              aria-hidden
              className="h-5 w-5 text-zinc-400 group-focus-within:text-zinc-600 dark:text-zinc-500 dark:group-focus-within:text-zinc-300"
            />
          </div>
          <input
            ref={usernameRef}
            id={usernameId}
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, username: true }))}
            autoFocus
            aria-invalid={
              !!errors.username && (touched.username || submitAttempted)
            }
            aria-describedby={
              errors.username && (touched.username || submitAttempted)
                ? usernameErrId
                : undefined
            }
            placeholder="Nazwa użytkownika"
            className={[
              'w-full rounded-2xl border px-12 py-3.5 text-base shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/40',
              'bg-white text-zinc-900 placeholder:text-zinc-400 border-zinc-300 focus:border-zinc-400',
              'dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:border-zinc-800 dark:focus:border-zinc-700',
              errors.username && (touched.username || submitAttempted)
                ? 'border-red-500 focus:ring-red-500/30'
                : '',
            ].join(' ')}
          />
        </div>

        <AnimatePresence initial={false} mode="wait">
          {errors.username && (touched.username || submitAttempted) && (
            <motion.p
              id={usernameErrId}
              role="alert"
              aria-live="polite"
              className="mt-1 text-sm text-red-500"
              variants={errorVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {errors.username}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Password (może być nie-wymagane) */}
      <div className="group mt-3">
        <label htmlFor={pwdId} className="sr-only">
          Hasło
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <Lock
              aria-hidden
              className="h-5 w-5 text-zinc-400 group-focus-within:text-zinc-600 dark:text-zinc-500 dark:group-focus-within:text-zinc-300"
            />
          </div>

          <input
            ref={pwdRef}
            id={pwdId}
            name="password"
            type={showPwd ? 'text' : 'password'}
            autoComplete="current-password"
            enterKeyHint="go"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            aria-invalid={
              !!errors.password && (touched.password || submitAttempted)
            }
            aria-describedby={
              errors.password && (touched.password || submitAttempted)
                ? pwdErrId
                : undefined
            }
            placeholder={requirePassword ? 'Hasło' : 'Hasło (niewymagane)'}
            className={[
              'w-full rounded-2xl border pl-12 pr-12 py-3.5 text-base shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/40',
              'bg-white text-zinc-900 placeholder:text-zinc-400 border-zinc-300 focus:border-zinc-400',
              'dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:border-zinc-800 dark:focus:border-zinc-700',
              errors.password && (touched.password || submitAttempted)
                ? 'border-red-500 focus:ring-red-500/30'
                : '',
            ].join(' ')}
          />

          <motion.button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.92 }}
            className="absolute inset-y-0 right-2 my-auto grid h-9 w-9 place-items-center rounded-xl
                       text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label={showPwd ? 'Ukryj hasło' : 'Pokaż hasło'}
            title={showPwd ? 'Ukryj hasło' : 'Pokaż hasło'}
          >
            {showPwd ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </motion.button>
        </div>

        <AnimatePresence initial={false} mode="wait">
          {errors.password && (touched.password || submitAttempted) && (
            <motion.p
              id={pwdErrId}
              role="alert"
              aria-live="polite"
              className="mt-1 text-sm text-red-500"
              variants={errorVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {errors.password}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Remember me */}
      <label className="mt-4 inline-flex cursor-pointer select-none items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
        <span
          className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
            remember ? 'bg-indigo-600' : 'bg-zinc-200 dark:bg-zinc-800'
          }`}
          role="switch"
          aria-checked={remember}
          aria-label="Zapamiętaj mnie"
          title="Zapamiętaj mnie"
        >
          <motion.span
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            animate={{ x: remember ? 16 : 0 }}
            className="h-4 w-4 rounded-full bg-white"
          />
        </span>
        Zapamiętaj mnie
      </label>

      {/* Primary CTA */}
      <motion.button
        type="submit"
        whileHover={!submitting && !prefersReducedMotion ? { scale: 1.01 } : {}}
        whileTap={!submitting && !prefersReducedMotion ? { scale: 0.99 } : {}}
        disabled={!isValid || submitting}
        aria-busy={submitting}
        className="mt-5 w-full cursor-pointer rounded-2xl bg-indigo-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        {submitting ? 'Logowanie…' : 'Zaloguj się'}
      </motion.button>

      {/* Secondary CTA */}
      <motion.button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onGotoSignup}
        whileHover={!prefersReducedMotion ? { scale: 1.01 } : {}}
        whileTap={!prefersReducedMotion ? { scale: 0.99 } : {}}
        className="mt-2 w-full cursor-pointer rounded-2xl border px-5 py-3 text-base font-semibold
                   border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50
                   dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100 dark:hover:bg-zinc-900
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        Zarejestruj się
      </motion.button>

      {/* Separator */}
      <div className="my-5 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        albo
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Social */}
      <div className="mb-1 flex items-center justify-between">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Zaloguj się przez
        </div>
        <div className="flex items-center gap-2">
          {SOCIAL.map(({ key, iconSlug, hex }) => (
            <motion.button
              key={key}
              type="button"
              aria-label={key}
              title={key}
              onClick={() => onSocial?.(key)}
              whileHover={!prefersReducedMotion ? { scale: 1.06 } : {}}
              whileTap={!prefersReducedMotion ? { scale: 0.96 } : {}}
              className="inline-grid h-9 w-9 place-items-center rounded-full border shadow-sm
                         border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50
                         dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-900
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <img
                alt=""
                src={`https://cdn.simpleicons.org/${iconSlug}/000000`}
                className="block h-4 w-4 dark:hidden"
              />
              <img
                alt=""
                src={`https://cdn.simpleicons.org/${iconSlug}/${hex}`}
                className="hidden h-4 w-4 dark:block"
              />
            </motion.button>
          ))}
        </div>
      </div>
    </motion.form>
  );
}
