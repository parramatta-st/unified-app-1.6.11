import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

async function lookupParentEmail(name:string): Promise<string|undefined>{
  const contacts = process.env.NEXT_PUBLIC_CONTACTS_CSV_URL;
  if (!contacts) return undefined;
  const res = await fetch(contacts);
  if (!res.ok) return undefined;
  const text = await res.text();
  // simple parse to find row with firstName/lastName OR Name
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = (lines.shift() || '').split(',');
  const idx = Object.fromEntries(header.map((h,i)=>[h.trim().toLowerCase(), i]));
  const lc = name.toLowerCase();
  for (const line of lines) {
    const cols = line.split(',');
    const first = (cols[idx['firstname'] ?? -1] || '').trim();
    const last  = (cols[idx['lastname'] ?? -1] || '').trim();
    const fullA = `${first} ${last}`.trim().toLowerCase();
    const fullB = (cols[idx['name'] ?? -1] || '').trim().toLowerCase();
    const parentEmail = (cols[idx['parentemail'] ?? -1] || cols[idx['email'] ?? -1] || '').trim();
    if ((fullA && fullA===lc) || (fullB && fullB===lc)) return parentEmail || undefined;
  }
  return undefined;
}

export default async function handler(req:NextApiRequest, res:NextApiResponse){
  if (req.method !== 'POST') return res.status(405).end();
  const { toName, subject, text } = req.body || {};
  if (!toName || !subject || !text) return res.status(400).json({ ok:false, error:'Missing fields' });

  const toEmail = await lookupParentEmail(toName);
  if (!toEmail) return res.status(400).json({ ok:false, error:'Parent email not found for selected student' });

  const user = process.env.MAIL_USER || '';
  const pass = process.env.MAIL_PASS || '';
  const replyTo = process.env.REPLY_TO || user;
  const campusName = process.env.NEXT_PUBLIC_CAMPUS_NAME || 'Success Tutoring Parramatta';

  if (!user || !pass) return res.status(500).json({ ok:false, error:'MAIL_USER/PASS not configured' });

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });

    const from = `${campusName} <${user}>`;
    await transporter.sendMail({
      from,
      to: toEmail,
      replyTo,
      subject,
      text
    });

    return res.status(200).json({ ok:true });
  } catch (e:any) {
    return res.status(500).json({ ok:false, error: e?.message || 'send failed' });
  }
}
