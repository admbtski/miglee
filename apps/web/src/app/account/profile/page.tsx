'use client';

import {
  Link as LinkIcon,
  Paperclip,
  Pencil,
  Upload,
  Trash2,
  Image as ImageIcon,
  Plus,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ───────────────────────── Profile Page ───────────────────────── */

export default function ProfilePage() {
  // Personal info (demo state)
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState(''); // country or city

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // Cover photo state + simple drag UI
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverDragging, setCoverDragging] = useState(false);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // Password state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [repeatPass, setRepeatPass] = useState('');

  // Social links
  const [links, setLinks] = useState<string[]>(['', '', '']);

  // Create/revoke object URLs for avatar/cover
  useEffect(() => {
    return () => {
      if (avatarUrl?.startsWith('blob:')) URL.revokeObjectURL(avatarUrl);
      if (coverUrl?.startsWith('blob:')) URL.revokeObjectURL(coverUrl);
    };
  }, [avatarUrl, coverUrl]);

  // Simple password strength (0-4)
  const passScore = useMemo(() => {
    let s = 0;
    if (newPass.length >= 8) s++;
    if (/[A-Z]/.test(newPass)) s++;
    if (/[a-z]/.test(newPass)) s++;
    if (/\d/.test(newPass)) s++;
    if (/[^A-Za-z0-9]/.test(newPass)) s++;
    return Math.min(4, s);
  }, [newPass]);

  const handleAvatarPick = (f?: File) => {
    if (!f) return;
    const url = URL.createObjectURL(f);
    if (avatarUrl?.startsWith('blob:')) URL.revokeObjectURL(avatarUrl);
    setAvatarUrl(url);
  };

  const handleCoverPick = (f?: File) => {
    if (!f) return;
    const url = URL.createObjectURL(f);
    if (coverUrl?.startsWith('blob:')) URL.revokeObjectURL(coverUrl);
    setCoverUrl(url);
  };

  const onDropCover: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCoverDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleCoverPick(file);
  };

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Manage your name, password and account settings.
        </p>
      </header>

      {/* Avatar + Cover photo */}
      <section className="mb-6">
        <div className="grid gap-6">
          {/* Avatar row */}
          <div className="flex items-center gap-5">
            <div className="relative grid w-16 h-16 overflow-hidden rounded-full place-items-center ring-1 ring-zinc-200 dark:ring-zinc-700">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="object-cover w-full h-full"
                />
              ) : (
                <ImageIcon className="w-6 h-6 opacity-50" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatarPick(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-500"
              >
                <Upload className="w-4 h-4" />
                Upload photo
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => {
                    if (avatarUrl?.startsWith('blob:'))
                      URL.revokeObjectURL(avatarUrl);
                    setAvatarUrl(null);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 border rounded-xl border-red-300/40 bg-red-50 hover:bg-red-100 dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
              <p className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                Pick a photo up to 10MB.
              </p>
            </div>
          </div>

          {/* Cover photo (dropzone) */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setCoverDragging(true);
            }}
            onDragLeave={() => setCoverDragging(false)}
            onDrop={onDropCover}
            className={[
              'rounded-2xl border-2 border-dashed p-6 transition-colors',
              coverDragging
                ? 'border-indigo-400 bg-indigo-400/10'
                : 'border-zinc-300 dark:border-zinc-700',
            ].join(' ')}
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="grid w-12 h-12 rounded-full place-items-center bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700">
                <ImageIcon className="w-6 h-6" />
              </div>
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="Cover"
                  className="object-cover w-full mt-2 max-h-48 rounded-xl ring-1 ring-zinc-200 dark:ring-zinc-700"
                />
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  <b>Drop your file here</b> or{' '}
                  <button
                    className="text-indigo-600 underline decoration-dotted underline-offset-2 dark:text-indigo-400"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    browse
                  </button>
                  . Pick a photo up to 10MB.
                </p>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleCoverPick(e.target.files?.[0])}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Personal info */}
      <SectionCard title="Personal info">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Name"
            placeholder="Enter full name"
            value={name}
            onChange={setName}
          />
          <Field
            label="Username"
            placeholder="Enter username"
            value={username}
            onChange={setUsername}
            help="Enter your display name on public forums."
          />
          <Field
            label="Email"
            placeholder="Enter email address"
            value={email}
            onChange={setEmail}
            type="email"
            help="Email used to log in."
          />
          <SelectField
            label="Location"
            value={location}
            onChange={setLocation}
            options={[
              { value: '', label: 'Country' },
              { value: 'PL', label: 'Poland' },
              { value: 'DE', label: 'Germany' },
              { value: 'UK', label: 'United Kingdom' },
              { value: 'US', label: 'United States' },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button
            type="button"
            className="px-3 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500"
            onClick={() =>
              console.log('save personal info', {
                name,
                username,
                email,
                location,
              })
            }
          >
            Save changes
          </button>
          <button
            type="button"
            className="px-3 py-2 text-sm border rounded-xl border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900/60"
            onClick={() => {
              setName('');
              setUsername('');
              setEmail('');
              setLocation('');
            }}
          >
            Cancel
          </button>
        </div>
      </SectionCard>

      {/* Password */}
      <SectionCard title="Password">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Current password"
            type="password"
            placeholder="Enter current password"
            value={currentPass}
            onChange={setCurrentPass}
          />
          <div className="grid gap-4">
            <Field
              label="New password"
              type="password"
              placeholder="Enter new password"
              value={newPass}
              onChange={setNewPass}
            />
            <Field
              label="Repeat new password"
              type="password"
              placeholder="Repeat new password"
              value={repeatPass}
              onChange={setRepeatPass}
            />
            <PasswordStrength score={passScore} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button
            type="button"
            className="px-3 py-2 text-sm border rounded-xl border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900/60"
            onClick={() => console.log('forgot password')}
          >
            I forgot my password
          </button>
          <button
            type="button"
            className="px-3 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500"
            onClick={() =>
              console.log('change password', {
                currentPass,
                newPass,
                repeatPass,
              })
            }
          >
            Change
          </button>
        </div>
      </SectionCard>

      {/* Social accounts */}
      <SectionCard title="Social accounts">
        <div className="grid gap-3">
          {links.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                value={v}
                onChange={(e) =>
                  setLinks((prev) =>
                    prev.map((x, idx) => (idx === i ? e.target.value : x))
                  )
                }
                placeholder="Link to social profile"
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900/60"
              />
              <button
                type="button"
                title="Remove"
                aria-label="Remove"
                onClick={() =>
                  setLinks((prev) => prev.filter((_, idx) => idx !== i))
                }
                className="grid h-9 w-9 place-items-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 mt-1 text-sm border border-dashed rounded-xl border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900/60"
            onClick={() => setLinks((prev) => [...prev, ''])}
          >
            <Plus className="w-4 h-4" />
            Add link
          </button>
        </div>
      </SectionCard>
    </>
  );
}

/* ───────────────────────── Reusable bits ───────────────────────── */

/** Generic white/ink card with title and optional action anchor */
function SectionCard({
  title,
  actionBtn,
  children,
}: {
  title: string;
  actionBtn?: { label: string; href?: string };
  children: React.ReactNode;
}) {
  return (
    <section
      className="
        mb-6 rounded-2xl border border-zinc-200 bg-white/95 p-5 shadow-sm
        dark:border-zinc-700 dark:bg-[#171a1f]/80 backdrop-blur-[2px]
      "
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-zinc-700 dark:text-zinc-300">
          {title}
        </h3>
        {actionBtn ? (
          <a
            href={actionBtn.href || '#'}
            className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900/60"
          >
            {actionBtn.label}
          </a>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** Text input with label and optional help text */
function Field({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  help,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  help?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className="w-full px-4 py-3 text-sm bg-white border outline-none rounded-2xl border-zinc-200 placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900/60"
      />
      {help && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{help}</p>
      )}
    </label>
  );
}

/** Select input with label */
function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 text-sm bg-white border outline-none appearance-none rounded-2xl border-zinc-200 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900/60"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="absolute -translate-y-1/2 pointer-events-none right-3 top-1/2 text-zinc-500">
          ▼
        </span>
      </div>
    </label>
  );
}

/** Password strength indicator (0..4) */
function PasswordStrength({ score }: { score: number }) {
  // 4 segments — fill up to score
  return (
    <div className="mt-1">
      <div className="mb-1 text-xs text-zinc-500">Level:</div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={[
              'h-1.5 w-full rounded-full',
              i < score ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-700',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  );
}
