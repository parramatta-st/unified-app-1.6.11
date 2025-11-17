import { useEffect, useMemo, useRef, useState } from 'react';
import Header from '../../components/Header';
import StudentPicker from '../../components/StudentPicker';
import StickyBar from '../../components/StickyBar';
import { CatalogItem, groupCatalog } from '../../lib/catalog';
import type { PronounSet } from '../../lib/tokens';

type Stage = 'year'|'subject'|'topic'|'items';

export default function PrintPage(){
  const [status, setStatus] = useState('Checking…');
  const [qty, setQty] = useState(1);
  const [student, setStudent] = useState('');
  const [pronouns, setPronouns] = useState<PronounSet>('');
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const [stage, setStage] = useState<Stage>('year');
  const [selYear, setSelYear] = useState('');
  const [selSubject, setSelSubject] = useState('');
  const [selTopic, setSelTopic] = useState('');

  const topRef = useRef<HTMLDivElement>(null);
  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth' });

  async function refresh(){
    setMsg('');
    try{
      const h = await fetch('/api/print-proxy?action=health').then(r=>r.json());
      if(!h?.ok) throw new Error('Not connected');
      setStatus(`Connected · ${h.printer || 'Printer'}`);
      const c = await fetch('/api/print-proxy?action=catalog').then(r=>r.json());
      setCatalog(c?.items||[]);
    }catch(e:any){
      setStatus('Not Connected');
    }
  }
  useEffect(()=>{ refresh(); }, []);

  const groups = useMemo(()=>groupCatalog(catalog), [catalog]);

  const years = useMemo(()=>Array.from(new Set(groups.map(g=>g.year))), [groups]);
  const subjects = useMemo(()=>Array.from(new Set(groups.filter(g=>g.year===selYear).map(g=>g.subject))), [groups, selYear]);
  const topics = useMemo(
    ()=>Array.from(new Set(groups.filter(g=>g.year===selYear && g.subject===selSubject).map(g=>g.topic))),
    [groups, selYear, selSubject]
  );

  const currentItems = useMemo(()=>{
    const g = groups.find(x=>x.year===selYear && x.subject===selSubject && x.topic===selTopic);
    return g?.items || [];
  }, [groups, selYear, selSubject, selTopic]);

  function clearAll(){
    setSelYear(''); setSelSubject(''); setSelTopic('');
    setStage('year'); setQty(1); setMsg(''); scrollTop();
  }

  async function printItem(id:number){
    if(!student){ setMsg('Enter student first.'); return; }
    setBusy(true); setMsg('');
    try{
      const body = { material_id: id, qty, meta: { student } };
      const r = await fetch('/api/print-proxy?action=print', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
      const j = await r.json();
      if(!j?.ok) throw new Error(j?.error || 'Print failed');
      setMsg('Sent to printer.');
    }catch(e:any){
      setMsg(e?.message || 'Print failed');
    }finally{ setBusy(false); }
  }

  async function printTopic(){
    if(!student){ setMsg('Enter student first.'); return; }
    setBusy(true); setMsg('');
    try{
      const body = { year: selYear, subject: selSubject, topic: selTopic, qty, meta: { student } };
      const r = await fetch('/api/print-proxy?action=print-topic', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
      if(r.status===404){
        const items = currentItems.filter(i=>['Lesson','Revision','Homework'].includes(i.type || i.item_type || ''));
        for(const it of items){ await printItem(it.id); }
        setBusy(false);
        return;
      }
      const j = await r.json();
      if(!j?.ok) throw new Error(j?.error || 'Print failed');
      setMsg('Topic sent to printer.');
    }catch(e:any){
      setMsg(e?.message || 'Print failed');
    }finally{ setBusy(false); }
  }

  return (
    <div>
      <div ref={topRef} />
      <Header />
      <main className="container">
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="badge-success">{status}</div>
          </div>

          <div className="grid grid-col mt-4">
            <div>
              <div className="label">Quantity</div>
              <input className="input w-28" type="number" min={1} max={50} value={qty} onChange={e=>setQty(parseInt(e.target.value||'1',10))} />
            </div>
            <div>
              <div className="label">Student (required)</div>
              <StudentPicker value={student} onChange={setStudent} onPronouns={()=>{}} required />
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button onClick={refresh} className="btn">Refresh</button>
            <button onClick={clearAll} className="btn">Clear</button>
            <button onClick={scrollTop} className="btn">Return to top</button>
            {msg && <div className="text-sm text-muted" style={{marginLeft:'auto'}}>{msg}</div>}
          </div>
        </div>

        {stage === 'year' && (
          <section className="card mt-6">
            <h2 className="section-title">Select a Year</h2>
            <div className="grid grid-2 grid-col">
              {years.map(y => (
                <button key={y} className={`tile p-6 ${selYear===y?'selected':''}`}
                  onClick={()=>{setSelYear(y); setSelSubject(''); setSelTopic(''); setStage('subject');}}>
                  <div className="text-xl" style={{fontWeight:700}}>{y}</div>
                </button>
              ))}
            </div>
          </section>
        )}
        {stage === 'subject' && (
          <section className="card mt-6">
            <h2 className="section-title">Select a Subject</h2>
            <div className="grid grid-2 grid-col">
              {subjects.map(s => (
                <button key={s} className={`tile p-6 ${selSubject===s?'selected':''}`}
                  onClick={()=>{setSelSubject(s); setSelTopic(''); setStage('topic');}}>
                  <div className="text-xl" style={{fontWeight:700}}>{s}</div>
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button className="btn" onClick={()=>setStage('year')}>Back</button>
              <button className="btn" onClick={clearAll}>Clear</button>
            </div>
          </section>
        )}
        {stage === 'topic' && (
          <section className="card mt-6">
            <h2 className="section-title">Select a Topic</h2>
            <div className="grid grid-3 grid-col">
              {topics.map(t => (
                <button key={t} className={`tile p-6 ${selTopic===t?'selected':''}`}
                  onClick={()=>{setSelTopic(t); setStage('items');}}>
                  <div className="text-xl" style={{fontWeight:700}}>{t}</div>
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button className="btn" onClick={()=>setStage('subject')}>Back</button>
              <button className="btn" onClick={clearAll}>Clear</button>
            </div>
          </section>
        )}
        {stage === 'items' && (
          <section className="card mt-6">
            <div className="flex items-center justify-between">
              <h2 className="section-title" style={{margin:0}}>{selSubject} • {selTopic} • {selYear}</h2>
              <button disabled={busy || !student} onClick={printTopic} className="btn-primary disabled:opacity-60">Print Topic (L+R+H)</button>
            </div>
            <div className="head mt-2">
              <div>Type</div>
              <div>Name</div>
              <div style={{textAlign:'right'}}>Action</div>
            </div>
            {(currentItems||[]).map(it => (
              <div key={it.id} className="row">
                <div>{it.type || it.item_type || 'Lesson'}</div>
                <div>{it.name || (it.type||'')}</div>
                <div style={{textAlign:'right'}}>
                  <button disabled={busy || !student} onClick={()=>printItem(it.id)} className="btn-primary">Print</button>
                </div>
              </div>
            ))}
            <div className="mt-3 flex gap-2">
              <button className="btn" onClick={()=>setStage('topic')}>Back</button>
              <button className="btn" onClick={clearAll}>Clear</button>
            </div>
          </section>
        )}
      </main>

      <StickyBar>
        <button onClick={refresh} className="btn flex-1">Refresh</button>
        <button onClick={clearAll} className="btn flex-1">Clear</button>
        <button onClick={scrollTop} className="btn flex-1">Return to top</button>
      </StickyBar>

      <footer className="container footer mt-8" style={{textAlign:'center'}}>
        © Success Tutoring Parramatta · Theme: dark/orange
      </footer>
    </div>
  );
}
