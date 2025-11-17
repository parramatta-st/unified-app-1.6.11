import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import StudentPicker from '../components/StudentPicker';
import StickyBar from '../components/StickyBar';
import { fetchCSV } from '../lib/csv';
import { applyTokens, defaultClosing, PronounSet } from '../lib/tokens';

type Curriculum = {
  Year?: string; Subject?: string; Strand?: string; Lesson?: string; Topic?: string;
  Template1?: string; Template2?: string; Template3?: string;
};

export default function FeedbackPage() {
  const campusName = process.env.NEXT_PUBLIC_CAMPUS_NAME || 'Success Tutoring Parramatta';

  const [student, setStudent] = useState('');
  const [pronouns, setPronouns] = useState<PronounSet>('');
  const [year, setYear] = useState('');
  const [subject, setSubject] = useState('');
  const [strand, setStrand] = useState('');
  const [lesson, setLesson] = useState('');
  const [topic, setTopic] = useState('');

  const [rows, setRows] = useState<Curriculum[]>([]);
  const [template, setTemplate] = useState('');
  const [custom, setCustom] = useState('');

  const tutorName = (typeof window !== 'undefined' && localStorage.getItem('st_tutor')) || '';
  const firstName = useMemo(()=> (student||'').split(' ')[0] || '', [student]);
  const subjectLine = useMemo(() => {
    const t = [firstName, subject, topic].filter(Boolean).join(' — ');
    return t || `${campusName} Feedback`;
  }, [firstName, subject, topic, campusName]);

  const body = useMemo(() => {
    const base = custom || template || '';
    const expanded = applyTokens(base, { name: firstName, topic, subject, lesson, year, tutor: tutorName, pronouns });
    return `Hi Parent,\n\n${expanded}${defaultClosing(campusName)}`;
  }, [custom, template, firstName, topic, subject, lesson, year, tutorName, pronouns, campusName]);

  useEffect(() => {
    (async () => {
      const url = process.env.NEXT_PUBLIC_CURRICULUM_CSV_URL as string | undefined;
      const rows = await fetchCSV<Curriculum>(url);
      setRows(rows);
    })();
  }, []);

  const years = useMemo(() => Array.from(new Set(rows.map(r => r.Year).filter(Boolean))) as string[], [rows]);
  const subjects = useMemo(() => Array.from(new Set(rows.filter(r => r.Year === year).map(r => r.Subject).filter(Boolean))) as string[], [rows, year]);
  const strands = useMemo(() => Array.from(new Set(rows.filter(r => r.Year === year && r.Subject === subject).map(r => r.Strand).filter(Boolean))) as string[], [rows, year, subject]);
  const lessons = useMemo(() => Array.from(new Set(rows.filter(r => r.Year === year && r.Subject === subject && r.Strand === strand).map(r => r.Lesson).filter(Boolean))) as string[], [rows, year, subject, strand]);
  const topics = useMemo(() => Array.from(new Set(rows.filter(r => r.Year === year && r.Subject === subject && r.Strand === strand && r.Lesson === lesson).map(r => r.Topic).filter(Boolean))) as string[], [rows, year, subject, strand, lesson]);
  const current = useMemo(() => rows.find(r => r.Year === year && r.Subject === subject && r.Strand === strand && r.Lesson === lesson && r.Topic === topic), [rows, year, subject, strand, lesson, topic]);

  useEffect(() => {
    setTemplate(current?.Template1 || ''); setCustom('');
  }, [current?.Template1, year, subject, strand, lesson, topic]);

  async function sendEmail() {
    if (!student) { alert('Select a student first.'); return; }
    const res = await fetch('/api/send-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toName: student, subject: subjectLine, text: body })
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j?.ok) {
      alert(j?.error || 'Failed to send.');
    } else {
      alert('Sent!');
    }
  }

  function clearAll() {
    setYear(''); setSubject(''); setStrand(''); setLesson(''); setTopic('');
    setTemplate(''); setCustom('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div>
      <Header />
      <main className="container">
        <div className="card">
          <h2 className="section-title">Feedback Flow</h2>

          <div className="mb-4">
            <label className="label">Student</label>
            <StudentPicker value={student} onChange={setStudent} onPronouns={setPronouns} required />
          </div>

          <div className="grid grid-col">
            <div><label className="label">Year</label>
              <select className="input" value={year} onChange={e=>setYear(e.target.value)}>
                <option value="">Select year…</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div><label className="label">Subject</label>
              <select className="input" value={subject} onChange={e=>setSubject(e.target.value)}>
                <option value="">Select subject…</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">Strand</label>
              <select className="input" value={strand} onChange={e=>setStrand(e.target.value)}>
                <option value="">Select strand…</option>
                {strands.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">Lesson</label>
              <select className="input" value={lesson} onChange={e=>setLesson(e.target.value)}>
                <option value="">Select lesson…</option>
                {lessons.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">Topic</label>
              <select className="input" value={topic} onChange={e=>setTopic(e.target.value)}>
                <option value="">Select topic…</option>
                {topics.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-3 grid-col mt-4">
            <div className="card">
              <div className="label">Template 1</div>
              <textarea className="input" value={current?.Template1 || ''} readOnly />
              <button className="btn mt-2" onClick={()=>{ setTemplate(current?.Template1 || ''); setCustom(''); }}>Use this</button>
            </div>
            <div className="card">
              <div className="label">Template 2</div>
              <textarea className="input" value={current?.Template2 || ''} readOnly />
              <button className="btn mt-2" onClick={()=>{ setTemplate(current?.Template2 || ''); setCustom(''); }}>Use this</button>
            </div>
            <div className="card">
              <div className="label">Template 3</div>
              <textarea className="input" value={current?.Template3 || ''} readOnly />
              <button className="btn mt-2" onClick={()=>{ setTemplate(current?.Template3 || ''); setCustom(''); }}>Use this</button>
            </div>
          </div>

          <div className="mt-4">
            <div className="label">Custom message</div>
            <textarea className="input" placeholder="Write a custom message… Use {they}/{their}/{is_are} tokens if needed." value={custom} onChange={e=>setCustom(e.target.value)} />
            <div className="text-sm text-muted mt-2">
              Tokens: {"{name} {topic} {they} {them} {their} {Theirs} {is_are} {has_have} {does_do}"} (capitalized forms supported)
            </div>
          </div>

          <div className="mt-6">
            <div className="label">Email Preview</div>
            <div className="card">
              <div className="text-sm text-muted mb-2">Subject</div>
              <div className="mb-2">{subjectLine}</div>
              <div className="text-sm text-muted mb-2">Body</div>
              <pre style={{whiteSpace:'pre-wrap', margin:0}}>{body}</pre>
            </div>
          </div>
        </div>
      </main>

      <StickyBar>
        <button className="btn-primary flex-1" onClick={sendEmail}>Send to Parent</button>
        <button className="btn flex-1" onClick={()=>{ setStudent(''); setPronouns(''); }}>Clear student</button>
        <button className="btn flex-1" onClick={()=>window.scrollTo({top:0, behavior:'smooth'})}>Return to top</button>
      </StickyBar>

      <footer className="container footer mt-8" style={{textAlign:'center'}}>
        © Success Tutoring Parramatta · Theme: dark/orange
      </footer>
    </div>
  );
}
