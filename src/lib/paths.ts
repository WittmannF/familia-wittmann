export const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
export function url(path = '/') {
  if (!path || path === '/') return `${basePath || ''}/`;
  return `${basePath}${path.startsWith('/') ? path : `/${path}`}`;
}
export function asset(path = '/') {
  return url(path);
}
