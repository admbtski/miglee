import React from 'react';

interface HybridLocationIconProps {
  className?: string;
  size?: number;
}

/**
 * Custom icon combining WiFi (top-left) and MapPin (bottom-right)
 * to represent hybrid events (both online and onsite)
 */
export function HybridLocationIcon({
  className,
  size = 28,
}: HybridLocationIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* WiFi icon - scaled down and positioned in top-left */}
      <g transform="translate(-2.5, -2) scale(0.9)">
        <path d="M12 20h.01" />
        <path d="M2 8.82a15 15 0 0 1 20 0" />
        <path d="M5 12.859a10 10 0 0 1 14 0" />
        <path d="M8.5 16.429a5 5 0 0 1 7 0" />
      </g>

      {/* MapPin icon - scaled down and positioned in bottom-right */}
      <g transform="translate(6.5, 6) scale(0.9)">
        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
        <circle cx="12" cy="10" r="3" />
      </g>
    </svg>
  );
}
