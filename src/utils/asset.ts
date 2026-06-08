/**
 * Resolve a public asset path against Vite's configured base URL.
 *
 * The build uses a relative base (`./`) so the app can be hosted under any
 * subpath or dropped into an iframe without absolute `/` paths breaking.
 */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}
