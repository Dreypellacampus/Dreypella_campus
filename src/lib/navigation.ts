export const LOCATION_CHANGE_EVENT = 'app:location-change';

export function currentLocation(): string {
  return `${window.location.pathname}${window.location.search}`;
}

export function navigate(path: string, options: { replace?: boolean } = {}): void {
  if (options.replace) {
    window.history.replaceState(null, '', path);
  } else {
    window.history.pushState(null, '', path);
    window.scrollTo(0, 0);
  }
  window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
}

export function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard';
  return value;
}
