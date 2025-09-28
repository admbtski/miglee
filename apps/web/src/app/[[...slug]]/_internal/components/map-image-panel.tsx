'use client';

export function MapImagePanel({
  label,
  fullHeight = false,
}: {
  label: string;
  fullHeight?: boolean;
}) {
  const svg = encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='800' height='800'>
      <defs>
        <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
          <stop offset='0%' stop-color='#fee2e2'/>
          <stop offset='100%' stop-color='#fca5a5'/>
        </linearGradient>
      </defs>
      <rect width='100%' height='100%' fill='url(#g)'/>
      <g fill='none' stroke='#ef4444' stroke-width='2' opacity='0.5'>
        ${Array.from({ length: 20 })
          .map(
            (_, i) => `<line x1='${i * 40}' y1='0' x2='${i * 40}' y2='800'/>`
          )
          .join('')}
        ${Array.from({ length: 20 })
          .map(
            (_, i) => `<line x1='0' y1='${i * 40}' x2='800' y2='${i * 40}'/>`
          )
          .join('')}
      </g>
      <text x='24' y='36' font-size='20' fill='#111827' font-family='Inter, system-ui'>${label}</text>
    </svg>
  `);
  const url = `data:image/svg+xml;charset=UTF-8,${svg}`;
  return (
    <div className="h-full rounded-2xl border bg-white dark:bg-zinc-900 overflow-hidden">
      <img
        src={url}
        alt={`Mapa ${label}`}
        className={`block w-full object-cover ${fullHeight ? 'h-full' : 'h-[420px]'}`}
      />
    </div>
  );
}
