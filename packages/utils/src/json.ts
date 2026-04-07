export function safeParse<T = unknown>(value: unknown): T {
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value) as T;
  }
  catch {
    return value as T;
  }
}
