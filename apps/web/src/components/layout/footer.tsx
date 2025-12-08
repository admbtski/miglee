'use client';

import { Github, Linkedin, Twitter } from 'lucide-react';
import Link from 'next/link';

import { useI18n } from '@/lib/i18n/provider-ssr';

export function Footer() {
  const { locale } = useI18n();

  return (
    <footer className="rounded-2xl border border-zinc-200 bg-white/90 p-6 text-sm text-zinc-600 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-indigo-500 to-cyan-500" />
          <span className="font-semibold text-zinc-800 dark:text-zinc-100">
            {/* TODO: Add i18n key for app name */}
            MeetUp Template
          </span>
          <span className="mx-2 text-zinc-400">•</span>
          {/* TODO: Add i18n key for "All rights reserved" */}
          <span>© {new Date().getFullYear()} All rights reserved</span>
        </div>

        <nav className="flex items-center gap-3">
          {/* TODO: Add i18n keys for footer links */}
          <Link className="hover:underline" href={`/${locale}/about`}>
            About
          </Link>
          <Link className="hover:underline" href={`/${locale}/account/privacy`}>
            Privacy
          </Link>
          <Link className="hover:underline" href={`/${locale}/account/terms`}>
            Terms
          </Link>
          <span className="mx-2 hidden text-zinc-400 sm:inline">•</span>
          <div className="flex items-center gap-2">
            {/* External links - keep as <a> with target="_blank" */}
            <a
              className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter / X"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </nav>
      </div>
    </footer>
  );
}
