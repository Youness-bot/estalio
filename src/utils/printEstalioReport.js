// Shared, isolated A4 print renderer. All dynamic values are escaped before insertion.
const escapeHtml = (value) => String(value ?? '—').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const printEstalioReport = ({ title, subtitle = '', filters = [], columns = [], rows = [], summary = [] }) => {
  const date = new Date().toLocaleString('fr-FR');
  const metadata = filters.filter(Boolean).map(([label, value]) => '<strong>' + escapeHtml(label) + ' :</strong> ' + escapeHtml(value)).join(' &nbsp; · &nbsp; ');
  const metrics = summary.map(([label, value]) => '<div class="metric"><small>' + escapeHtml(label) + '</small><b>' + escapeHtml(value) + '</b></div>').join('');
  const headings = columns.map(column => '<th>' + escapeHtml(column.label) + '</th>').join('');
  const body = rows.length ? rows.map(row => '<tr>' + columns.map(column => '<td>' + escapeHtml(typeof column.value === 'function' ? column.value(row) : row?.[column.key]) + '</td>').join('') + '</tr>').join('') : '<tr><td colspan="' + columns.length + '">Aucune donnée pour les filtres sélectionnés</td></tr>';
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${escapeHtml(title)} - Estalio</title><style>
  @page{size:A4;margin:13mm}*{box-sizing:border-box}body{font:10px Arial,sans-serif;color:#163152;margin:0}header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #cbd9eb;padding-bottom:14px}.brand{font-size:23px;font-weight:800;color:#06479a}.tag{font-size:8px;color:#6a7f98}.right{text-align:right}h1{font-size:15px;margin:0 0 5px}.meta{background:#eef5fd;padding:12px;margin:14px 0;line-height:1.8}.metrics{display:flex;gap:10px;margin-bottom:14px}.metric{border:1px solid #d7e4f4;padding:10px;flex:1}.metric small{display:block;color:#64748b;margin-bottom:5px}.metric b{font-size:15px}table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}tr{break-inside:avoid}th{background:#e7f1fc;text-align:left;color:#164b86}th,td{border:1px solid #d5e2f2;padding:7px;overflow-wrap:anywhere;vertical-align:top}tbody tr:nth-child(even){background:#f7faff}footer{border-top:1px solid #d7e4f4;margin-top:18px;padding-top:8px;color:#71849a;font-size:8px}@media screen{body{padding:30px;max-width:1100px;margin:auto}}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><header><div><div class="brand">Estalio</div><div class="tag">Hospitality made easy</div></div><div class="right"><h1>${escapeHtml(title)}</h1><div class="tag">${escapeHtml(subtitle)}</div></div></header><div class="meta">${metadata}<div><strong>Date d'édition :</strong> ${escapeHtml(date)}</div></div><div class="metrics">${metrics}</div><table><thead><tr>${headings}</tr></thead><tbody>${body}</tbody></table><footer>Estalio · Hospitality made easy</footer><script>window.onload=function(){window.print();};<\/script></body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none';
  frame.onload = () => { try { frame.contentWindow?.focus(); } catch (_) {} };
  document.body.appendChild(frame);
  frame.src = url;
  const cleanup = () => { URL.revokeObjectURL(url); frame.remove(); };
  frame.addEventListener('load', () => { try { frame.contentWindow?.addEventListener('afterprint', cleanup, { once: true }); } catch (_) {} });
  // Browsers that suppress afterprint still release the temporary document.
  setTimeout(cleanup, 120000);
};
