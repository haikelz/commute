function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function transjakartaStopPopupHtml(p: {
  name: string;
  id: string;
  platform: string;
  type: string;
  distance: string;
  routes: string;
}): string {
  const rows: { k: string; v: string }[] = [
    { k: "ID", v: p.id },
    { k: "Peron", v: p.platform },
    { k: "Tipe", v: p.type },
  ];
  if (p.distance) rows.push({ k: "Jarak", v: p.distance });
  if (p.routes && p.routes !== "—") rows.push({ k: "Koridor", v: p.routes });

  const detail = rows
    .map(
      (r) =>
        `<div><span style="opacity:.65">${esc(r.k)}:</span> ${esc(r.v)}</div>`
    )
    .join("");

  return `<div style="font-family:system-ui,sans-serif;font-size:13px;line-height:1.45;color:#18181b">
    <div style="font-weight:600">${esc(p.name)}</div>
    <div style="margin-top:8px;font-size:12px">${detail}</div>
  </div>`;
}
