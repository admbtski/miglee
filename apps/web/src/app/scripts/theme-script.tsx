'use client';

import Script from 'next/script';

export function ThemeScript() {
  const code = `
  try {
    var ls = localStorage.getItem('theme'); // 'light' | 'dark' | 'system' | null
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = ls || 'system';
    var wantDark = theme === 'dark' || (theme === 'system' && systemDark);
    var docEl = document.documentElement;
    docEl.classList.toggle('dark', wantDark);
    docEl.dataset.theme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
  } catch(e){}
  `;
  return (
    <Script id="theme-script" strategy="beforeInteractive">
      {code}
    </Script>
  );
}
