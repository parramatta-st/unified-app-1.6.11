import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req:NextApiRequest, res:NextApiResponse){
  if (req.method !== 'POST') return res.status(405).end();
  const url = process.env.PRINT_LOG_WEBHOOK_URL;
  if (!url) return res.status(500).json({ ok:false, error:'PRINT_LOG_WEBHOOK_URL missing' });
  try {
    const r = await fetch(url, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(req.body || {})
    });
    const txt = await r.text();
    return res.status(200).json({ ok:true, status:r.status, result: txt });
  } catch (e:any) {
    return res.status(500).json({ ok:false, error: e?.message || 'failed' });
  }
}
