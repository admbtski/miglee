'use client';

import { Mail, Lock } from 'lucide-react';
import { useMemo, useState, useCallback } from 'react';

export function SignInPanel({
  email,
  setEmail,
  password,
  setPassword,
  remember,
  setRemember,
  onSubmit,
  onGotoSignup,
  onSocial,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  remember: boolean;
  setRemember: (v: boolean) => void;
  onSubmit: () => void;
  onGotoSignup: () => void;
  onSocial?: (
    p: 'google' | 'github' | 'linkedin' | 'facebook' | 'apple' | 'twitter'
  ) => void;
}) {
  // --- Walidacja ---
  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validate = (e: string, p: string) => {
    const errors: { email?: string; password?: string } = {};
    if (!e) errors.email = 'Wpisz adres e-mail';
    else if (!isEmail(e)) errors.email = 'Nieprawidłowy adres e-mail';
    if (!p) errors.password = 'Wpisz hasło';
    else if (p.length < 6) errors.password = 'Hasło musi mieć min. 6 znaków';
    return errors;
  };

  const [touched, setTouched] = useState<{
    email?: boolean;
    password?: boolean;
  }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const errors = useMemo(() => validate(email, password), [email, password]);
  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const markAllTouched = useCallback(
    () => setTouched({ email: true, password: true }),
    []
  );

  const trySubmit = () => {
    setSubmitAttempted(true);
    if (!isValid) return markAllTouched();
    onSubmit();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      trySubmit();
    }
  };

  return (
    <div className="pt-5">
      {/* Email */}
      <label className="group relative block">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
          <Mail className="h-5 w-5 text-zinc-500 group-focus-within:text-zinc-300" />
        </div>
        <input
          type="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          onKeyDown={onKeyDown}
          aria-invalid={!!errors.email && (touched.email || submitAttempted)}
          aria-describedby={
            errors.email && (touched.email || submitAttempted)
              ? 'signin-email-error'
              : undefined
          }
          placeholder="Adres e-mail"
          className={[
            'w-full rounded-2xl border bg-zinc-900/60 px-12 py-3.5 text-base placeholder:text-zinc-500 shadow-inner focus:outline-none',
            'border-zinc-800 focus:border-zinc-700 focus:ring-2 focus:ring-indigo-500/40',
            errors.email && (touched.email || submitAttempted)
              ? 'border-red-500 focus:ring-red-500/30'
              : '',
          ].join(' ')}
        />
        {errors.email && (touched.email || submitAttempted) && (
          <p id="signin-email-error" className="mt-1 text-sm text-red-500">
            {errors.email}
          </p>
        )}
      </label>

      {/* Password */}
      <label className="group relative mt-3 block">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
          <Lock className="h-5 w-5 text-zinc-500 group-focus-within:text-zinc-300" />
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          onKeyDown={onKeyDown}
          aria-invalid={
            !!errors.password && (touched.password || submitAttempted)
          }
          aria-describedby={
            errors.password && (touched.password || submitAttempted)
              ? 'signin-password-error'
              : undefined
          }
          placeholder="Hasło"
          className={[
            'w-full rounded-2xl border bg-zinc-900/60 px-12 py-3.5 text-base placeholder:text-zinc-500 shadow-inner focus:outline-none',
            'border-zinc-800 focus:border-zinc-700 focus:ring-2 focus:ring-indigo-500/40',
            errors.password && (touched.password || submitAttempted)
              ? 'border-red-500 focus:ring-red-500/30'
              : '',
          ].join(' ')}
        />
        {errors.password && (touched.password || submitAttempted) && (
          <p id="signin-password-error" className="mt-1 text-sm text-red-500">
            {errors.password}
          </p>
        )}
      </label>

      {/* Remember me */}
      <label className="mt-4 inline-flex cursor-pointer select-none items-center gap-3 text-sm text-zinc-300">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
        <span
          className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
            remember ? 'bg-indigo-600' : 'bg-zinc-800'
          }`}
        >
          <span
            className={`h-4 w-4 rounded-full bg-white transition-transform ${
              remember ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </span>
        Zapamiętaj mnie
      </label>

      {/* CTA primary */}
      <button
        onClick={trySubmit}
        disabled={!isValid}
        className="mt-5 w-full cursor-pointer rounded-2xl bg-indigo-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        Zaloguj się
      </button>

      {/* CTA secondary -> przejście do rejestracji */}
      <button
        onClick={onGotoSignup}
        className="mt-2 w-full cursor-pointer rounded-2xl border border-zinc-800 bg-zinc-900/40 px-5 py-3 text-base font-semibold text-zinc-100 hover:bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        Zarejestruj się
      </button>

      {/* Separator */}
      <div className="my-5 flex items-center gap-3 text-xs text-zinc-500">
        <div className="h-px flex-1 bg-zinc-800" />
        albo
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      {/* Social logins (bez zmian) */}
      <div className="mb-1 flex items-center justify-between">
        <div className="text-sm text-zinc-400">Zaloguj się przez</div>
        <div className="flex items-center gap-2">
          <SocialBtn label="Google" onClick={() => onSocial?.('google')}>
            <img
              alt=""
              src="https://cdn.simpleicons.org/google/EA4335"
              className="h-4 w-4"
            />
          </SocialBtn>
          <SocialBtn label="GitHub" onClick={() => onSocial?.('github')}>
            <img
              alt=""
              src="https://cdn.simpleicons.org/github/ffffff"
              className="h-4 w-4"
            />
          </SocialBtn>
          <SocialBtn label="LinkedIn" onClick={() => onSocial?.('linkedin')}>
            <img
              alt=""
              src="https://cdn.simpleicons.org/linkedin/0A66C2"
              className="h-4 w-4"
            />
          </SocialBtn>
          <SocialBtn label="Facebook" onClick={() => onSocial?.('facebook')}>
            <img
              alt=""
              src="https://cdn.simpleicons.org/facebook/1877F2"
              className="h-4 w-4"
            />
          </SocialBtn>
          <SocialBtn label="Apple" onClick={() => onSocial?.('apple')}>
            <img
              alt=""
              src="https://cdn.simpleicons.org/apple/ffffff"
              className="h-4 w-4"
            />
          </SocialBtn>
          <SocialBtn label="Twitter/X" onClick={() => onSocial?.('twitter')}>
            <img
              alt=""
              src="https://cdn.simpleicons.org/x/cccccc"
              className="h-4 w-4"
            />
          </SocialBtn>
        </div>
      </div>
    </div>
  );
}

/* helpers – bez zmian */
function SocialBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-grid h-9 w-9 place-items-center rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-200 shadow-sm hover:bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      {children}
    </button>
  );
}
