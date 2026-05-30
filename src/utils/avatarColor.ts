/**
 * Returns a CSS variable name for a generated avatar background color
 * based on a simple hash of the display name.
 * The color comes from the --avatar-color-0..5 palette in the theme.
 */
export function getAvatarColor(displayName: string): string {
  let hash = 0;
  for (let i = 0; i < displayName.length; i++) {
    hash = displayName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % 6;
  return `var(--avatar-color-${index})`;
}
