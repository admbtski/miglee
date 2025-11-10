/**
 * Custom hook for password strength calculation
 */

'use client';

import { useMemo } from 'react';

export function usePasswordStrength(password: string): number {
  return useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(4, score);
  }, [password]);
}
