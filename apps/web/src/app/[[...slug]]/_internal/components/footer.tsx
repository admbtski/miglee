'use client';

import { Github, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="rounded-2xl border border-zinc-200 bg-white/90 p-6 text-sm text-zinc-600 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-indigo-500 to-cyan-500" />
          <span className="font-semibold text-zinc-800 dark:text-zinc-100">
            MeetUp Template
          </span>
          <span className="mx-2 text-zinc-400">•</span>
          <span>© {new Date().getFullYear()} All rights reserved</span>
        </div>

        <nav className="flex items-center gap-3">
          <a className="hover:underline" href="#">
            About
          </a>
          <a className="hover:underline" href="#">
            Privacy
          </a>
          <a className="hover:underline" href="#">
            Terms
          </a>
          <span className="mx-2 hidden text-zinc-400 sm:inline">•</span>
          <div className="flex items-center gap-2">
            <a
              className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              href="#"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              href="#"
              aria-label="Twitter / X"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              href="#"
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
