/**
 * Custom hook for password strength calculation
 * Evaluates password based on length, case, digits, and special characters
 */

'use client';

import { useMemo } from 'react';

/**
 * Calculates password strength score (0-4)
 *
 * Scoring criteria:
 * - +1 for length >= 8 characters
 * - +1 for uppercase letters
 * - +1 for lowercase letters
 * - +1 for digits
 * - +1 for special characters
 *
 * @param password - Password string to evaluate
 * @returns Strength score from 0 (weak) to 4 (strong)
 *
 * @example
 * ```tsx
 * const strength = usePasswordStrength('MyP@ssw0rd');
 * // strength: 4 (strong)
 * ```
 */
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
