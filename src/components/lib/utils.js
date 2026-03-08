import { PAY_TAG } from "./constants";

const mkid = () => "x" + Math.random().toString(36).slice(2, 10);
const gCount = (g) => Math.max(1, Number(g?.count) || 1);
const sumGuests = (list) => list.reduce((a, g) => a + gCount(g), 0);
const gTypeLabel = (g) => { const c = gCount(g); if (c === 1) return "Single"; if (c === 2) return "Cuplu"; return `Familie (${c})`; };
const gTypeIcon = (g) => { const c = gCount(g); if (c === 1) return "👤"; if (c === 2) return "👫"; return "👨‍👩‍👧"; };
const fmtD = (d) => { try { return new Date(d).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" }); } catch { return d; } };
const fmtC = (n) => new Intl.NumberFormat("ro-RO", { style: "currency", currency: "EUR" }).format(n || 0);
const parseBudgetNotes = (raw) => {
  const txt = raw || "";
  const i = txt.indexOf(PAY_TAG);
  if (i < 0) return { cleanNotes: txt, payments: [] };
  const j = txt.indexOf("-->", i);
  if (j < 0) return { cleanNotes: txt, payments: [] };
  const payload = txt.slice(i + PAY_TAG.length, j).trim();
  let payments = [];
  try {
    const decoded = decodeURIComponent(payload);
    const parsed = JSON.parse(decoded);
    if (Array.isArray(parsed)) payments = parsed;
  } catch {}
  const cleanNotes = (txt.slice(0, i) + txt.slice(j + 3)).trim();
  return { cleanNotes, payments };
};
const serializeBudgetNotes = (cleanNotes, payments) => {
  const base = (cleanNotes || "").trim();
  if (!payments || payments.length === 0) return base;
  const packed = encodeURIComponent(JSON.stringify(payments));
  return `${base}${base ? "\n\n" : ""}${PAY_TAG}${packed}-->`;
};

async function loadTheme() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return localStorage.getItem("wedify_theme") || "light";
  } catch {}
  return "light";
}
async function saveTheme(t) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) localStorage.setItem("wedify_theme", t);
  } catch {}
}

function generateGuestsPDF(guests, wedding, tables = []) {
  const conf = guests.filter(g => g.rsvp === "confirmed");
  const confirmedPeople = sumGuests(conf);
  const totalPeople = sumGuests(guests);
  const dietaryCount = guests.filter(g => !!g.dietary).length;
  const tableMap = new Map(tables.map(t => [t.id, t.name]));
  const unallocatedConfirmed = conf.filter(g => !g.tid);
  const groups = {};
  conf.forEach(g => { const k = g.group || "Altele"; if (!groups[k]) groups[k] = []; groups[k].push(g); });

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lista Invitați - ${wedding.couple}</title>
  <style>
    body{font-family:'Segoe UI',sans-serif;padding:40px;color:#1a1a1a;max-width:860px;margin:0 auto}
    h1{font-family:Georgia,serif;font-size:28px;font-weight:400;color:#8A6D47;margin-bottom:4px}
    .sub{color:#999;font-size:13px;margin-bottom:30px}
    .stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:30px;padding:16px;background:#FAF6F0;border-radius:12px}
    .stat{text-align:center;flex:1}.stat-v{font-size:24px;font-weight:700;color:#B8956A}.stat-l{font-size:11px;color:#999;text-transform:uppercase}
    h2{font-size:16px;color:#8A6D47;margin:24px 0 10px;border-bottom:1px solid #E5DFD5;padding-bottom:6px}
    h3{font-size:14px;color:#8A6D47;margin:20px 0 8px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    th{text-align:left;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:.05em;padding:6px 10px;border-bottom:2px solid #E5DFD5}
    td{padding:8px 10px;border-bottom:1px solid #F0EAE0;font-size:13px}
    .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700}
    .b-conf{background:rgba(107,158,104,.12);color:#6B9E68}
    .b-pend{background:rgba(90,130,180,.12);color:#5A82B4}
    .b-decl{background:rgba(184,92,92,.1);color:#B85C5C}
    .b-diet{background:rgba(212,160,160,.12);color:#B07070;margin-left:4px}
    .group-total{font-size:12px;color:#7A746D;margin:-2px 0 12px}
    .warn-box{border:1px dashed #D4B388;background:#FFF9EF;border-radius:10px;padding:12px;margin-top:20px}
    .footer{margin-top:40px;text-align:center;font-size:11px;color:#ccc}
    @media print{body{padding:20px}.stats{break-inside:avoid}}
  </style></head><body>
  <h1>Lista Invitați</h1>
  <div class="sub">${wedding.couple} · ${fmtD(wedding.date)} · ${wedding.venue}</div>
  <div class="stats">
    <div class="stat"><div class="stat-v">${guests.length}</div><div class="stat-l">Total invitați</div></div>
    <div class="stat"><div class="stat-v">${totalPeople}</div><div class="stat-l">Total persoane</div></div>
    <div class="stat"><div class="stat-v">${confirmedPeople}</div><div class="stat-l">Confirmați (persoane)</div></div>
    <div class="stat"><div class="stat-v">${dietaryCount}</div><div class="stat-l">Cu restricții alimentare</div></div>
  </div>`;

  Object.entries(groups).forEach(([name, list]) => {
    html += `<h2>${name} (${list.length} invitați)</h2><div class="group-total">Total persoane în grup: <b>${sumGuests(list)}</b></div><table><tr><th>Nr</th><th>Nume</th><th>Persoane</th><th>Masă</th><th>Status</th><th>Restricții</th></tr>`;
    list.forEach((g, i) => {
      const sc = g.rsvp === "confirmed" ? "conf" : g.rsvp === "pending" ? "pend" : "decl";
      const sl = g.rsvp === "confirmed" ? "Confirmat" : g.rsvp === "pending" ? "Așteptare" : "Refuzat";
      html += `<tr><td>${i + 1}</td><td><b>${g.name}</b></td><td>${gCount(g)}</td><td>${tableMap.get(g.tid) || "—"}</td><td><span class="badge b-${sc}">${sl}</span></td><td>${g.dietary ? `<span class="badge b-diet">${g.dietary}</span>` : "—"}</td></tr>`;
    });
    html += `</table>`;
  });

  html += `<div class="warn-box"><h3>Invitați nealocați la mese</h3>`;
  if (unallocatedConfirmed.length === 0) {
    html += `<div>Toți invitații confirmați sunt alocați la mese.</div>`;
  } else {
    html += `<table><tr><th>Nr</th><th>Nume</th><th>Persoane</th><th>Grup</th><th>Restricții</th></tr>`;
    unallocatedConfirmed.forEach((g, i) => {
      html += `<tr><td>${i + 1}</td><td><b>${g.name}</b></td><td>${gCount(g)}</td><td>${g.group || "Altele"}</td><td>${g.dietary || "—"}</td></tr>`;
    });
    html += `</table>`;
  }
  html += `</div>`;

  html += `<div class="footer">Generat de Wedify · ${new Date().toLocaleDateString("ro-RO")}</div></body></html>`;
  return html;
}

function generateTablesPDF(tables, guests, wedding) {
  const seatedGuests = guests.filter(g => g.tid);
  const seatedPeople = sumGuests(seatedGuests);
  const totalSeats = tables.reduce((a, t) => a + t.seats, 0);
  const totalFreeSeats = tables.reduce((a, t) => {
    const tablePeople = sumGuests(guests.filter(g => g.tid === t.id));
    return a + Math.max(0, t.seats - tablePeople);
  }, 0);

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Plan Mese - ${wedding.couple}</title>
  <style>
    body{font-family:'Segoe UI',sans-serif;padding:40px;color:#1a1a1a;max-width:860px;margin:0 auto}
    h1{font-family:Georgia,serif;font-size:28px;font-weight:400;color:#8A6D47;margin-bottom:4px}
    .sub{color:#999;font-size:13px;margin-bottom:30px}
    .table-card{border:1px solid #E5DFD5;border-radius:12px;padding:16px;margin-bottom:14px;break-inside:avoid}
    .table-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
    .table-nm{font-size:16px;font-weight:700}.table-info{font-size:12px;color:#999}
    .table-meta{font-size:12px;color:#7A746D;margin-bottom:8px}
    .guest-chip{display:inline-block;padding:4px 12px;margin:3px;border-radius:14px;font-size:12px;background:#FAF6F0;border:1px solid #E5DFD5}
    .diet-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:#B85C5C;margin-left:4px;vertical-align:middle}
    .empty{color:#ccc;font-style:italic;font-size:12px}
    .summary{display:flex;gap:20px;margin-bottom:24px;padding:16px;background:#FAF6F0;border-radius:10px}
    .sval{font-size:22px;font-weight:700;color:#B8956A}.slbl{font-size:11px;color:#999;text-transform:uppercase}
    .notes{margin-top:10px;padding:8px 10px;border-radius:8px;background:#FCF9F3;font-size:12px;color:#6B645C}
    .footer{margin-top:40px;text-align:center;font-size:11px;color:#ccc}
  </style></head><body>
  <h1>Plan Aranjare Mese</h1>
  <div class="sub">${wedding.couple} · ${fmtD(wedding.date)} · ${wedding.venue}</div>
  <div class="summary">
    <div style="flex:1;text-align:center"><div class="sval">${tables.length}</div><div class="slbl">Mese</div></div>
    <div style="flex:1;text-align:center"><div class="sval">${totalSeats}</div><div class="slbl">Locuri total</div></div>
    <div style="flex:1;text-align:center"><div class="sval">${seatedPeople}</div><div class="slbl">Persoane așezate</div></div>
    <div style="flex:1;text-align:center"><div class="sval">${totalFreeSeats}</div><div class="slbl">Locuri libere total</div></div>
    <div style="flex:1;text-align:center"><div class="sval">${guests.filter(g => !g.tid && g.rsvp === "confirmed").length}</div><div class="slbl">Nealocați</div></div>
  </div>`;

  tables.forEach(t => {
    const seated = guests.filter(g => g.tid === t.id);
    const seatsUsed = sumGuests(seated);
    const freeSeats = Math.max(0, t.seats - seatsUsed);
    const dietaryAgg = seated.reduce((acc, g) => {
      const key = (g.dietary || "").trim();
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + gCount(g);
      return acc;
    }, {});
    const dietarySummary = Object.entries(dietaryAgg).map(([label, count]) => `${count} ${label}`).join(", ");

    html += `<div class="table-card"><div class="table-hd"><div><span class="table-nm">${t.name}</span></div><div class="table-info">${t.shape === "round" ? "Rotundă" : "Dreptunghiulară"} · ${seatsUsed}/${t.seats} locuri (persoane)</div></div><div class="table-meta">Locuri libere: <b>${freeSeats}</b>${dietarySummary ? ` · Restricții: <b>${dietarySummary}</b>` : ""}</div>`;
    if (seated.length > 0) {
      seated.forEach(g => {
        html += `<span class="guest-chip">${g.name} (${gCount(g)})${g.dietary ? '<span class="diet-dot"></span>' : ''}</span>`;
      });
    } else {
      html += `<div class="empty">Niciun invitat alocat</div>`;
    }
    if (t.notes) {
      html += `<div class="notes"><b>Note masă:</b> ${t.notes}</div>`;
    }
    html += `</div>`;
  });

  html += `<div class="footer">Generat de Wedify · ${new Date().toLocaleDateString("ro-RO")} ${new Date().toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}</div></body></html>`;
  return html;
}

function openPDF(html) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (w) {
    w.onload = () => {
      w.print();
    };
  }
  setTimeout(() => URL.revokeObjectURL(url), 120000);
}

export { mkid, gCount, sumGuests, gTypeLabel, gTypeIcon, fmtD, fmtC, parseBudgetNotes, serializeBudgetNotes, loadTheme, saveTheme, generateGuestsPDF, generateTablesPDF, openPDF };
