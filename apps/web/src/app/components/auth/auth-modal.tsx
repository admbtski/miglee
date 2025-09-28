'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { SignInPanel } from './sign-in-panel';
import { SignUpPanel } from './sign-up-panel';

export type AuthMode = 'signin' | 'signup';

type SubmitPayload = {
  email: string;
  password: string;
  mode: AuthMode;
  username?: string;
  remember?: boolean;
};

type Props = {
  open?: boolean;
  mode?: AuthMode; // opcjonalnie: kontroluj z zewnątrz
  onModeChange?: (m: AuthMode) => void;
  onClose: () => void;

  onSubmit?: (payload: SubmitPayload) => void;
  onSocial?: (
    p: 'google' | 'github' | 'linkedin' | 'facebook' | 'apple' | 'twitter'
  ) => void;
};

export function AuthModal({
  open = true,
  mode,
  onModeChange,
  onClose,
  onSubmit,
  onSocial,
}: Props) {
  // tryb – kontrolowany lub lokalny
  const [internalMode, setInternalMode] = useState<AuthMode>(mode ?? 'signin');
  useEffect(() => {
    if (mode) setInternalMode(mode);
  }, [mode]);

  const setMode = (m: AuthMode) => {
    if (!mode) setInternalMode(m);
    onModeChange?.(m);
  };

  // wspólny stan pól (żeby nie znikały przy przełączaniu paneli)
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [username, setUsername] = useState('');
  const [remember, setRemember] = useState(true);

  // skróty klawiaturowe
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'enter') {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, email, pwd, username, remember, internalMode, onClose]);

  const handleSubmit = () => {
    onSubmit?.({
      email,
      password: pwd,
      mode: internalMode,
      username: internalMode === 'signup' && username ? username : undefined,
      remember: internalMode === 'signin' ? remember : undefined,
    });
  };

  if (!open) return null;

  const title = internalMode === 'signin' ? 'Zaloguj się' : 'Utwórz konto';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <div className="w-[92vw] max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5">
          <h2 id="auth-title" className="text-2xl font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Zamknij"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Panel content */}
        <div className="px-6 pb-6">
          <div className="h-px w-full bg-zinc-800" />

          {internalMode === 'signin' ? (
            <SignInPanel
              email={email}
              setEmail={setEmail}
              password={pwd}
              setPassword={setPwd}
              remember={remember}
              setRemember={setRemember}
              onSubmit={handleSubmit}
              onGotoSignup={() => setMode('signup')}
              onSocial={onSocial}
            />
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
