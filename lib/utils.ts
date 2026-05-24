// utils.ts - Shared utility functions

/**
 * Merges class names, filtering out falsy values.
 * Drop-in replacement for clsx/classnames without extra dependencies.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
