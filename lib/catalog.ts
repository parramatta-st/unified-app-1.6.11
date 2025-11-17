export type CatalogItem = {
  id: number; subject: string; topic: string; year: string;
  type?: string; item_type?: string; name?: string;
  path?: string; page_count?: number; file_bytes?: number; active?: number;
};

export type Group = { year:string; subject:string; topic:string; items: CatalogItem[] };

export function groupCatalog(items: CatalogItem[]): Group[] {
  const m = new Map<string, Group>();
  for (const it of items || []) {
    const type = (it.type || it.item_type || 'Lesson');
    const name = it.name || type;
    const key = `${it.year}||${it.subject}||${it.topic}`;
    if (!m.has(key)) m.set(key, { year: it.year, subject: it.subject, topic: it.topic, items: [] });
    m.get(key)!.items.push({ ...it, type, name });
  }
  return Array.from(m.values());
}
