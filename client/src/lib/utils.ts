/**
 * Generate initials from a user's name
 * @param name - The user's full name
 * @returns Initials (1-2 characters)
 */

export function getInitials(name: string): string {
  if (!name) return 'U';
  
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  } else {
    return words.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');
  }
}

/**
 * Combine class names conditionally
 * @param classes - Array of class names (can include falsy values)
 * @returns Combined class string
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
