export function InlineThemeScript() {
  const code = `
    (function () {
      try {
        var ls = localStorage.getItem('theme'); // 'light' | 'dark' | 'system' | null
        var mql = window.matchMedia('(prefers-color-scheme: dark)');
        var sysDark = mql.matches;

        var isDark = ls === 'dark' || (ls !== 'light' && sysDark);
        var el = document.documentElement;
        if (isDark) el.classList.add('dark'); else el.classList.remove('dark');

        el.style.colorScheme = isDark ? 'dark' : 'light';

        el.dataset.theme = isDark ? 'dark' : 'light';

        mql.addEventListener && mql.addEventListener('change', function (e) {
          var lsNow = localStorage.getItem('theme');
          if (lsNow === 'light' || lsNow === 'dark') return;
          var darkNow = e.matches;
          el.classList.toggle('dark', darkNow);
          el.style.colorScheme = darkNow ? 'dark' : 'light';
          el.dataset.theme = darkNow ? 'dark' : 'light';
        });
      } catch (e) {}
    })();
    `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
