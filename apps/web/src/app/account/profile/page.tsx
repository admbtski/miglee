'use client';

import {
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import React, { useRef, useState } from 'react';

// Global components
import { SectionCard } from '@/components/ui/section-card';
import { TextField } from '@/components/forms/text-field';
import { SelectField } from '@/components/forms/select-field';
import { PasswordStrength } from '@/components/forms/password-strength';

// Local hooks
import { useFileUpload } from './_hooks/use-file-upload';
import { usePasswordStrength } from './_hooks/use-password-strength';

/* ───────────────────────── Profile Page ───────────────────────── */

export default function ProfilePage() {
  // Personal info
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');

  // Avatar
  const {
    url: avatarUrl,
    handlePick: handleAvatarPick,
    handleRemove: handleAvatarRemove,
  } = useFileUpload();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // Cover photo
  const {
    url: coverUrl,
    handlePick: handleCoverPick,
    handleRemove: handleCoverRemove,
  } = useFileUpload();
  const [coverDragging, setCoverDragging] = useState(false);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // Password
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [repeatPass, setRepeatPass] = useState('');
  const passScore = usePasswordStrength(newPass);

  // Social links
  const [links, setLinks] = useState<string[]>(['', '', '']);

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
                  onClick={handleAvatarRemove}
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
          <TextField
            label="Name"
            placeholder="Enter full name"
            value={name}
            onChange={setName}
          />
          <TextField
            label="Username"
            placeholder="Enter username"
            value={username}
            onChange={setUsername}
            help="Enter your display name on public forums."
          />
          <TextField
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
          <TextField
            label="Current password"
            type="password"
            placeholder="Enter current password"
            value={currentPass}
            onChange={setCurrentPass}
          />
          <div className="grid gap-4">
            <TextField
              label="New password"
              type="password"
              placeholder="Enter new password"
              value={newPass}
              onChange={setNewPass}
            />
            <TextField
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
