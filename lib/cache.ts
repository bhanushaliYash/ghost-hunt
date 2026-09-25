/**
 * Short in-memory cache so a demo refresh does not refetch NVD and RSS
 * on every click. The cache dies with the server process, which is what
 * we want on a free host.
 */

type Entry = { at: number; data: unknown };

const store = new Map<string, Entry>();

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.data as T;
  const data = await load();
  store.set(key, { at: Date.now(), data });
  return data;
}
