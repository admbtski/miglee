'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useId, useMemo, useRef, useState } from 'react';

export function SignUpPanel({
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  onGotoSignin,
  onSocial,
}: {
  username: string;
  setUsername: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onSubmit: () => void | Promise<void>;
  onGotoSignin: () => void;
  onSocial?: (
    p: 'google' | 'github' | 'linkedin' | 'facebook' | 'apple' | 'twitter'
  ) => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  /** Validation rules */
  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const hasLetter = (v: string) => /[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]/.test(v);
  const hasDigit = (v: string) => /\d/.test(v);
  const hasUpperOrSpecial = (v: string) =>
    /[A-Z!@#$%^&*()[\]{}.,;:_+\-/?\\|~]/.test(v);
  const isValidUsername = (v: string) => /^[a-zA-Z0-9._-]{3,20}$/.test(v);

  const validate = (u: string, e: string, p: string) => {
    const errors: { username?: string; email?: string; password?: string } = {};
    if (!u) errors.username = 'Wpisz nazwę użytkownika';
    else if (!isValidUsername(u))
      errors.username = '3–20 znaków: litery, cyfry, „.” „_” „-”';

    if (!e) errors.email = 'Wpisz adres e-mail';
    else if (!isEmail(e)) errors.email = 'Nieprawidłowy adres e-mail';

    if (!p) errors.password = 'Wpisz hasło';
    else if (p.length < 8) errors.password = 'Hasło musi mieć min. 8 znaków';
    else if (!(hasLetter(p) && hasDigit(p)))
      errors.password = 'Hasło musi zawierać literę i cyfrę';
    return errors;
  };

  /** Password strength (0–3) */
  const passwordScore = useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (hasLetter(password) && hasDigit(password)) s++;
    if (hasUpperOrSpecial(password)) s++;
    return s;
  }, [password]);
  const passwordLabel = ['Słabe', 'OK', 'Dobre', 'Mocne'][passwordScore];

  /** Local UI/validation state */
  const [touched, setTouched] = useState<{
    username?: boolean;
    email?: boolean;
    password?: boolean;
  }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  /** IDs + refs */
  const usernameId = useId();
  const emailId = useId();
  const pwdId = useId();
  const uErrId = useId();
  const eErrId = useId();
  const pErrId = useId();

  const uRef = useRef<HTMLInputElement | null>(null);
  const eRef = useRef<HTMLInputElement | null>(null);
  const pRef = useRef<HTMLInputElement | null>(null);

  /** Derived validation state */
  const errors = useMemo(
    () => validate(username, email, password),
    [username, email, password]
  );
  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  /** Focus first invalid field on failed submit */
  const focusFirstInvalid = () => {
    if (errors.username) return uRef.current?.focus();
    if (errors.email) return eRef.current?.focus();
    if (errors.password) return pRef.current?.focus();
  };

  /** Try submit with shake on invalid */
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

  /** Submit on Enter while focusing inputs */
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void trySubmit();
    }
  };

  /** Animated error paragraph variants */
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
          Nazwa użytkownika
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <User
              aria-hidden
              className="h-5 w-5 text-zinc-400 group-focus-within:text-zinc-600 dark:text-zinc-500 dark:group-focus-within:text-zinc-300"
            />
          </div>
          <input
            ref={uRef}
            id={usernameId}
            name="username"
            type="text"
            inputMode="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, username: true }))}
            onKeyDown={onKeyDown}
            autoFocus
            aria-invalid={
              !!errors.username && (touched.username || submitAttempted)
            }
            aria-describedby={
              errors.username && (touched.username || submitAttempted)
                ? uErrId
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
              id={uErrId}
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

      {/* Email */}
      <div className="group mt-3">
        <label htmlFor={emailId} className="sr-only">
          Adres e-mail
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <Mail
              aria-hidden
              className="h-5 w-5 text-zinc-400 group-focus-within:text-zinc-600 dark:text-zinc-500 dark:group-focus-within:text-zinc-300"
            />
          </div>
          <input
            ref={eRef}
            id={emailId}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            onKeyDown={onKeyDown}
            aria-invalid={!!errors.email && (touched.email || submitAttempted)}
            aria-describedby={
              errors.email && (touched.email || submitAttempted)
                ? eErrId
                : undefined
            }
            placeholder="Adres e-mail"
            className={[
              'w-full rounded-2xl border px-12 py-3.5 text-base shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/40',
              'bg-white text-zinc-900 placeholder:text-zinc-400 border-zinc-300 focus:border-zinc-400',
              'dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:border-zinc-800 dark:focus:border-zinc-700',
              errors.email && (touched.email || submitAttempted)
                ? 'border-red-500 focus:ring-red-500/30'
                : '',
            ].join(' ')}
          />
        </div>
        <AnimatePresence initial={false} mode="wait">
          {errors.email && (touched.email || submitAttempted) && (
            <motion.p
              id={eErrId}
              role="alert"
              aria-live="polite"
              className="mt-1 text-sm text-red-500"
              variants={errorVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {errors.email}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Password */}
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
            ref={pRef}
            id={pwdId}
            type={showPwd ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            enterKeyHint="go"
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            onKeyDown={onKeyDown}
            aria-invalid={
              !!errors.password && (touched.password || submitAttempted)
            }
            aria-describedby={
              errors.password && (touched.password || submitAttempted)
                ? pErrId
                : undefined
            }
            placeholder="Hasło (min. 8, litera + cyfra)"
            className={[
              'w-full rounded-2xl border pl-12 pr-12 py-3.5 text-base shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/40',
              'bg-white text-zinc-900 placeholder:text-zinc-400 border-zinc-300 focus:border-zinc-400',
              'dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:border-zinc-800 dark:focus:border-zinc-700',
              errors.password && (touched.password || submitAttempted)
                ? 'border-red-500 focus:ring-red-500/30'
                : '',
            ].join(' ')}
          />

          {/* Toggle password visibility */}
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

        {/* Password error */}
        <AnimatePresence initial={false} mode="wait">
          {errors.password && (touched.password || submitAttempted) && (
            <motion.p
              id={pErrId}
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

        {/* Strength meter */}
        {password && (
          <div className="mt-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <motion.div
                className="h-full"
                animate={{ width: `${(passwordScore / 3) * 100}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{
                  background:
                    passwordScore < 1
                      ? '#ef4444' // red-500
                      : passwordScore === 1
                        ? '#f59e0b' // amber-500
                        : passwordScore === 2
                          ? '#10b981' // emerald-500
                          : '#22c55e', // green-500
                }}
              />
            </div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              {passwordLabel}
            </div>
          </div>
        )}
      </div>

      {/* Primary CTA */}
      <motion.button
        type="submit"
        whileHover={!submitting && !prefersReducedMotion ? { scale: 1.01 } : {}}
        whileTap={!submitting && !prefersReducedMotion ? { scale: 0.99 } : {}}
        onClick={(e) => {
          e.preventDefault();
          void trySubmit();
        }}
        disabled={!isValid || submitting}
        aria-busy={submitting}
        className="mt-5 w-full cursor-pointer rounded-2xl bg-indigo-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        {submitting ? 'Rejestracja…' : 'Zarejestruj'}
      </motion.button>

      {/* Switch to SignIn (no validation flicker) */}
      <p className="mt-3 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Masz już konto?{' '}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onGotoSignin}
          className="cursor-pointer font-medium text-indigo-600 dark:text-indigo-400 underline underline-offset-4 hover:text-indigo-500 dark:hover:text-indigo-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm"
        >
          Zaloguj się
        </button>
      </p>

      {/* Separator */}
      <div className="my-5 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        albo
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Social sign-up (two icons per brand for contrast) */}
      <div className="mb-1 flex items-center justify-between">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Kontynuuj z
        </div>
        <div className="flex items-center gap-2">
          {(
            [
              ['Google', 'EA4335'],
              ['GitHub', 'ffffff'],
              ['scalar', '0A66C2'],
              ['Facebook', '1877F2'],
              ['Apple', 'ffffff'],
              ['x', 'cccccc'],
            ] as [string, string][]
          ).map(([label, hex]) => (
            <motion.button
              key={label}
              type="button"
              aria-label={label}
              title={label}
              onClick={() =>
                onSocial?.(
                  label.toLowerCase().includes('twitter')
                    ? 'twitter'
                    : (label.toLowerCase() as any)
                )
              }
              whileHover={!prefersReducedMotion ? { scale: 1.06 } : {}}
              whileTap={!prefersReducedMotion ? { scale: 0.96 } : {}}
              className="inline-grid h-9 w-9 place-items-center rounded-full border shadow-sm
                         border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50
                         dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-900
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {/* light */}
              <img
                alt=""
                src={`https://cdn.simpleicons.org/${label.toLowerCase().replace('/x', 'x')}/000000`}
                className="h-4 w-4 block dark:hidden"
              />
              {/* dark */}
              <img
                alt=""
                src={`https://cdn.simpleicons.org/${label.toLowerCase().replace('/x', 'x')}/${hex}`}
                className="h-4 w-4 hidden dark:block"
              />
            </motion.button>
          ))}
        </div>
      </div>
    </motion.form>
  );
}
