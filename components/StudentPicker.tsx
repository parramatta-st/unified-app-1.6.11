import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchCSV } from '../lib/csv';
import type { PronounSet } from '../lib/tokens';

type RowA = { id?:string; firstName?:string; lastName?:string; gender?:string; parentName?:string; parentEmail?:string; years?:string };
type RowB = { Name?:string; Email?:string; Year?:string; Gender?:string; Pronouns?:string };

type Student = { name: string; email: string; pronouns: string };

function normalize(rows: any[]): Student[] {
  const out: Student[] = [];
  for (const r of rows) {
    const a = r as RowA;
    const b = r as RowB;
    let name = '';
    let email = '';
    let pron = '';
    if (a.firstName || a.lastName) {
      name = [a.firstName||'', a.lastName||''].join(' ').trim();
      email = (a.parentEmail||'').trim();
      pron = (a.gender||'').trim();
    } else if (b.Name || b.Email) {
      name = (b.Name||'').trim();
      email = (b.Email||'').trim();
      pron = (b.Pronouns || b.Gender || '').trim();
    }
    if (name) out.push({ name, email, pronouns: pron });
  }
  // sort by name
  return out.sort((x,y)=>x.name.localeCompare(y.name));
}

function inferPronouns(p: string): PronounSet {
  const raw = (p||'').toLowerCase();
  if (raw.includes('she')) return 'she/her';
  if (raw.includes('he')) return 'he/him';
  if (raw.includes('they')) return 'they/them';
  return '';
}

export default function StudentPicker({
  value, onChange, onPronouns, required
}:{
  value: string;
  onChange: (v:string)=>void;
  onPronouns?: (p:PronounSet)=>void;
  required?: boolean;
}) {
  const [list, setList] = useState<Student[]>([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    (async()=>{
      try{
        const url = process.env.NEXT_PUBLIC_CONTACTS_CSV_URL as string | undefined;
        const rows = await fetchCSV<any>(url);
        setList(normalize(rows));
      }catch(e){
        console.error('StudentPicker: failed to load contacts', e);
        setList([]);
      }
    })();
  },[]);

  useEffect(()=>{
    const h = (e:MouseEvent)=>{ if(rootRef.current && !rootRef.current.contains(e.target as any)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return ()=>document.removeEventListener('mousedown', h);
  },[]);

  const entries = list;
  const query = q.trim().toLowerCase();
  const filtered = useMemo(()=>{
    if (!query) return entries.slice(0, 100);
    return entries.filter(s=> s.name.toLowerCase().includes(query) || s.email.toLowerCase().includes(query)).slice(0,100);
  }, [entries, query]);

  const pick = (s: Student)=>{
    onChange(s.name);
    onPronouns && onPronouns(inferPronouns(s.pronouns));
    setQ('');
    setOpen(false);
  };

  const displayValue = open ? q : (q || value);

  return (
    <div className="relative" ref={rootRef}>
      <input
        className="input"
        placeholder="Search name or email…"
        value={displayValue}
        onChange={e=>setQ(e.target.value)}
        onFocus={()=>setOpen(true)}
        onKeyDown={e=>{
          if (e.key === 'Enter') {
            e.preventDefault();
            const next = filtered[0];
            if (next) pick(next);
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            setOpen(false);
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        required={required}
      />
      {open && (
        <div className="suggest-panel">
          {filtered.map(s=> (
            <div key={s.name + '|' + s.email} className="suggest-item" onClick={()=>pick(s)}>
              <div>{s.name}</div>
              <div className="suggest-hint">{s.email}</div>
            </div>
          ))}
          {!filtered.length && <div className="suggest-item suggest-hint">No matches</div>}
        </div>
      )}
    </div>
  );
}
