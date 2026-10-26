import { githubLevel, summarizeGithub, type GithubStats } from '@kei/shared';

// Kartu SVG untuk README profil GitHub. Warna mengikuti token situs
// (primary emerald) supaya README dan portofolio terlihat satu keluarga.
const THEMES = {
  dark: { bg: '#0d1117', border: '#30363d', text: '#e6edf3', muted: '#8b949e', empty: '#161b22', primary: '#2cdd96' },
  light: { bg: '#ffffff', border: '#d0d7de', text: '#1f2328', muted: '#59636e', empty: '#ebedf0', primary: '#0d9664' },
};
const LEVEL_OPACITY = [0, 0.3, 0.55, 0.8, 1];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

const WIDTH = 800;
const PAD = 32;
const CELL = 11;
const STEP = 14;
const GRID_TOP = 160;

function escapeXml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

export function renderGithubCard(stats: GithubStats, themeName: keyof typeof THEMES): string {
  const theme = THEMES[themeName];
  const summary = summarizeGithub(stats.days);
  const level = githubLevel(stats.days);
  const parts: string[] = [];

  parts.push(
    `<text x="${PAD}" y="46" font-size="17" font-weight="700" fill="${theme.text}">@${escapeXml(stats.login)} · GitHub activity</text>`,
    `<text x="${WIDTH - PAD}" y="46" font-size="12" text-anchor="end" fill="${theme.muted}">Last 12 months · public + private repos</text>`
  );

  const tiles = [
    [summary.total, 'commits'],
    [summary.activeDays, 'active days'],
    [summary.currentStreak, 'current streak (days)'],
    [summary.longestStreak, 'longest streak (days)'],
  ] as const;
  tiles.forEach(([value, label], i) => {
    const x = PAD + i * 184;
    parts.push(
      `<text x="${x}" y="96" font-size="28" font-weight="700" fill="${theme.text}">${value}</text>`,
      `<text x="${x}" y="116" font-size="12" fill="${theme.muted}">${label}</text>`
    );
  });

  let lastLabelCol = -4;
  stats.days.forEach((day, i) => {
    const col = Math.floor(i / 7);
    const row = i % 7;
    const x = PAD + col * STEP;
    const y = GRID_TOP + row * STEP;
    const lvl = level(day.count);
    const fill = lvl === 0 ? theme.empty : theme.primary;
    const opacity = lvl === 0 ? '' : ` fill-opacity="${LEVEL_OPACITY[lvl]}"`;
    parts.push(`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2.5" fill="${fill}"${opacity}><title>${day.count} commits · ${day.date}</title></rect>`);

    const date = Number(day.date.slice(8, 10));
    if (row === 0 && date <= 7 && col - lastLabelCol >= 4) {
      lastLabelCol = col;
      parts.push(`<text x="${x}" y="${GRID_TOP - 8}" font-size="10" fill="${theme.muted}">${MONTHS[Number(day.date.slice(5, 7)) - 1]}</text>`);
    }
  });

  const barTop = GRID_TOP + 7 * STEP + 22;
  const barWidth = WIDTH - PAD * 2;
  const totalBytes = stats.languages.reduce((sum, l) => sum + l.bytes, 0) || 1;
  const top = stats.languages.slice(0, 5);
  const rest = totalBytes - top.reduce((sum, l) => sum + l.bytes, 0);
  const segments = [...top.map((l) => ({ name: l.name, color: l.color ?? theme.muted, bytes: l.bytes }))];
  if (rest > 0) segments.push({ name: 'Other', color: theme.border, bytes: rest });

  parts.push(`<text x="${PAD}" y="${barTop}" font-size="12" font-weight="600" fill="${theme.text}">Most used languages</text>`);
  parts.push(`<clipPath id="bar"><rect x="${PAD}" y="${barTop + 12}" width="${barWidth}" height="8" rx="4"/></clipPath><g clip-path="url(#bar)">`);
  let cursor = PAD;
  for (const seg of segments) {
    const w = (seg.bytes / totalBytes) * barWidth;
    parts.push(`<rect x="${cursor.toFixed(2)}" y="${barTop + 12}" width="${w.toFixed(2)}" height="8" fill="${seg.color}"/>`);
    cursor += w;
  }
  parts.push('</g>');
  // SVG tidak bisa mengukur teks; lebar item ditaksir ~7px per karakter pada 12px.
  let legendX = PAD;
  for (const seg of segments) {
    const y = barTop + 42;
    const name = seg.name.slice(0, 14);
    const pct = `${((seg.bytes / totalBytes) * 100).toFixed(1)}%`;
    parts.push(
      `<circle cx="${legendX + 5}" cy="${y - 4}" r="5" fill="${seg.color}"/>`,
      `<text x="${legendX + 15}" y="${y}" font-size="12" fill="${theme.text}">${escapeXml(name)} <tspan fill="${theme.muted}">${pct}</tspan></text>`
    );
    legendX += 15 + (name.length + pct.length + 1) * 7 + 22;
  }

  const height = barTop + 64;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" font-family="${FONT}" role="img" aria-label="GitHub activity of ${escapeXml(stats.login)}: ${summary.total} commits in the last 12 months">
<rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${height - 1}" rx="12" fill="${theme.bg}" stroke="${theme.border}"/>
${parts.join('\n')}
</svg>`;
}
