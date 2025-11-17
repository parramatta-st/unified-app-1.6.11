import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Header(){
  const [tutor,setTutor] = useState('');
  useEffect(()=>{
    try { setTutor(localStorage.getItem('st_tutor') || ''); } catch {}
  },[]);

  async function doLogout(e: React.MouseEvent){
    e.preventDefault();
    await fetch('/api/logout', { method:'POST' });
    try { localStorage.removeItem('st_tutor'); localStorage.removeItem('st_campus'); } catch {}
    window.location.href = '/login';
  }

  return (
    <header className="header">
      <div className="header-inner container" style={{paddingLeft:'1rem', paddingRight:'1rem'}}>
        <div className="brand"><span className="accent">Success</span> Tutoring<span className="text-muted"> Portal</span></div>
        <nav className="nav">
          <Link className="btn" href="/feedback">Feedback</Link>
          <Link className="btn" href="/print">Print</Link>
          <button className="btn" onClick={doLogout} aria-label="Logout">Logout{tutor ? ` (${tutor})` : ''}</button>
        </nav>
      </div>
    </header>
  );
}
