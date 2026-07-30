#!/usr/bin/env node
// Builds assets/stats-light.svg and assets/stats-dark.svg from GitHub's GraphQL API.
//
// Every number on the card comes from contributionsCollection, which is a
// documented API. Nothing here scrapes profile HTML: the public page reports a
// slightly higher "contributions" figure than the API does, but it exists only
// in markup that GitHub restyles without notice, and a daily cron built on that
// fails silently and publishes wrong numbers.
//
// Usage: GITHUB_TOKEN=<token with repo scope> node scripts/build-stats.mjs
// The token must be able to see private contributions or the totals collapse to
// public-only work. The script refuses to write a card it believes is wrong.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOGIN = process.env.STATS_LOGIN ?? "romankhadka";
const TOKEN = process.env.GITHUB_TOKEN;
const FIRST_YEAR = 2016;

if (!TOKEN) fail("GITHUB_TOKEN is not set.");

const QUERY = `
query($login:String!,$from:DateTime!,$to:DateTime!){
  user(login:$login){
    contributionsCollection(from:$from,to:$to){
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalRepositoryContributions
      contributionCalendar{
        totalContributions
        weeks{ contributionDays{ date contributionCount } }
      }
    }
  }
}`;

function fail(msg) {
  console.error(`build-stats: ${msg}`);
  process.exit(1);
}

async function graphql(variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "romankhadka-profile-stats",
    },
    body: JSON.stringify({ query: QUERY, variables }),
  });
  if (!res.ok) fail(`GraphQL HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = await res.json();
  if (body.errors) fail(`GraphQL errors: ${JSON.stringify(body.errors).slice(0, 400)}`);
  const c = body.data?.user?.contributionsCollection;
  if (!c) fail(`no contributionsCollection for ${LOGIN}. Is the login correct?`);
  return c;
}

// ---------------------------------------------------------------- collection

const today = new Date();
const todayISO = today.toISOString().slice(0, 10);
const thisYear = today.getUTCFullYear();

const days = new Map();
const perYear = new Map();
const totals = { commits: 0, prs: 0, reviews: 0, repos: 0, contributions: 0 };

for (let y = FIRST_YEAR; y <= thisYear; y++) {
  const c = await graphql({
    login: LOGIN,
    from: `${y}-01-01T00:00:00Z`,
    to: `${y}-12-31T23:59:59Z`,
  });
  const year = {
    commits: c.totalCommitContributions,
    prs: c.totalPullRequestContributions,
    reviews: c.totalPullRequestReviewContributions,
    repos: c.totalRepositoryContributions,
    contributions: c.contributionCalendar.totalContributions,
  };
  perYear.set(y, year);
  for (const k of Object.keys(totals)) totals[k] += year[k];
  for (const w of c.contributionCalendar.weeks)
    for (const d of w.contributionDays) days.set(d.date, d.contributionCount);
}

// A token without private visibility silently reports a fraction of the real
// numbers. Publishing that is worse than publishing nothing, so stop instead.
if (totals.prs < 100 || totals.commits < 100) {
  fail(
    `refusing to write: totals look public-only (${totals.prs} PRs, ${totals.commits} commits). ` +
      `The token likely cannot see private contributions.`
  );
}

// ------------------------------------------------------------------ derived

const dated = [...days.entries()]
  .filter(([d]) => d <= todayISO)
  .sort(([a], [b]) => a.localeCompare(b));

let peak = { date: "", count: 0 };
for (const [date, n] of dated) if (n > peak.count) peak = { date, count: n };

// 52-week sparkline of the trailing year.
//
// Bucketing forward from the cutoff would leave a partial final week, which
// renders as a cliff every day except Sunday and reads as "he stopped working".
// Drop the leading remainder instead so every bucket holds exactly 7 days and
// the last one ends today, making the highlighted bar mean "the last 7 days".
const cutoff = new Date(today.getTime() - 364 * 864e5).toISOString().slice(0, 10);
const trailing = dated.filter(([d]) => d >= cutoff);
const weekCount = Math.floor(trailing.length / 7);
const weeks = [];
for (let i = trailing.length - weekCount * 7; i < trailing.length; i += 7)
  weeks.push(trailing.slice(i, i + 7).reduce((s, [, n]) => s + n, 0));

const cur = perYear.get(thisYear) ?? { prs: 0 };
const prev = perYear.get(thisYear - 1) ?? { prs: 0 };
const prRatio = totals.prs ? totals.reviews / totals.prs : 0;

const stats = {
  totals,
  peak,
  prRatio,
  thisYear: { year: thisYear, ...cur },
  lastYear: { year: thisYear - 1, ...prev },
  weeks,
};

// --------------------------------------------------------------- rendering

const n = (v) => v.toLocaleString("en-US");
const esc = (s) =>
  String(s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]);

const THEMES = {
  light: {
    bg0: "#f7f4ec", bg1: "#f1ede3", bg2: "#e8e3d8",
    ink: "#18201c", mute: "#4e5750", faint: "#687069",
    accent: "#c65434", teal: "#1e6d66", grid: "#1a241f",
    speck: "#18201c", wedge: "#d7e5df", wedgeOp: 0.5,
    gridOp: 0.09, microOp: 0.07, barTrack: "#ded8ca",
  },
  dark: {
    bg0: "#121815", bg1: "#101512", bg2: "#0b100d",
    ink: "#ebe7dd", mute: "#a8b0aa", faint: "#9ca69f",
    accent: "#ff7657", teal: "#65b6ab", grid: "#ebe7dd",
    speck: "#ebe7dd", wedge: "#17342f", wedgeOp: 0.62,
    gridOp: 0.07, microOp: 0.05, barTrack: "#1e2621",
  },
};

const W = 1000;
const H = 300;
const SERIF =
  "'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif";
const MONO = "'Courier New',monospace";

const generatedDate = todayISO;

function card(t, s) {
  const tiles = [
    { label: "PULL REQUESTS", value: n(s.totals.prs) },
    { label: "REVIEWED", value: n(s.totals.reviews) },
    { label: "COMMITS", value: n(s.totals.commits) },
    { label: "REPOS CREATED", value: n(s.totals.repos) },
  ];

  // Sparkline geometry. Bars are drawn from a fixed baseline so a quiet week
  // still shows a track mark rather than vanishing.
  const sx = 52, sy = 248, sw = 896, sh = 44;
  const max = Math.max(1, ...s.weeks);
  const gap = 2;
  const bw = (sw - gap * (s.weeks.length - 1)) / s.weeks.length;
  const bars = s.weeks
    .map((v, i) => {
      const h = Math.max(1.5, (v / max) * sh);
      const x = sx + i * (bw + gap);
      return (
        `<rect x="${x.toFixed(1)}" y="${(sy - h).toFixed(1)}" width="${bw.toFixed(1)}" ` +
        `height="${h.toFixed(1)}" fill="${i === s.weeks.length - 1 ? t.accent : t.ink}" ` +
        `opacity="${i === s.weeks.length - 1 ? 1 : 0.55}"/>`
      );
    })
    .join("");

  const tileX = (i) => 52 + i * 232;
  const tileSvg = tiles
    .map(
      (tile, i) => `
    <text x="${tileX(i)}" y="128" fill="${t.faint}" font-family="${MONO}" font-size="13" letter-spacing="2.2">${tile.label}</text>
    <text x="${tileX(i) - 2}" y="184" fill="${t.ink}" font-family="${SERIF}" font-size="52" letter-spacing="-1.5">${tile.value}</text>`
    )
    .join("");

  const trajectory =
    s.lastYear.prs > 0
      ? `${n(s.thisYear.prs)} PRs in ${s.thisYear.year}, ${(s.thisYear.prs / s.lastYear.prs).toFixed(2)}x all of ${s.lastYear.year}`
      : `${n(s.thisYear.prs)} PRs in ${s.thisYear.year}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <title id="t">GitHub activity for ${esc(LOGIN)}</title>
  <desc id="d">${n(s.totals.prs)} pull requests opened, ${n(s.totals.reviews)} reviewed, ${n(s.totals.commits)} commits, across ${n(s.totals.repos)} repositories since ${FIRST_YEAR}. Updated ${generatedDate}.</desc>
  <defs>
    <linearGradient id="p" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.bg0}"/><stop offset="0.55" stop-color="${t.bg1}"/><stop offset="1" stop-color="${t.bg2}"/>
    </linearGradient>
    <pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${t.grid}" stroke-width="0.7" opacity="${t.gridOp}"/>
    </pattern>
    <pattern id="m" width="8" height="8" patternUnits="userSpaceOnUse">
      <path d="M 8 0 L 0 0 0 8" fill="none" stroke="${t.grid}" stroke-width="0.35" opacity="${t.microOp}"/>
    </pattern>
    <pattern id="s" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="7" r="0.45" fill="${t.speck}" opacity="0.14"/>
      <circle cx="17" cy="3" r="0.35" fill="${t.speck}" opacity="0.1"/>
      <circle cx="11" cy="19" r="0.4" fill="${t.speck}" opacity="0.12"/>
      <circle cx="22" cy="14" r="0.3" fill="${t.speck}" opacity="0.09"/>
    </pattern>
    <clipPath id="f"><rect x="16" y="16" width="968" height="268" rx="2"/></clipPath>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#p)"/>
  <g clip-path="url(#f)">
    <rect x="16" y="16" width="968" height="268" fill="url(#g)"/>
    <path d="M 700 -40 L 1040 100 L 1040 340 L 860 340 Z" fill="${t.wedge}" opacity="${t.wedgeOp}"/>
    <path d="M 806 -40 L 1040 60 L 1040 340 L 970 340 Z" fill="url(#m)" opacity="0.9"/>
    <rect width="${W}" height="${H}" fill="url(#s)" opacity="0.55"/>
  </g>
  <rect x="16.5" y="16.5" width="967" height="267" rx="2" fill="none" stroke="${t.ink}" stroke-width="1" opacity="${t === THEMES.dark ? 0.55 : 1}"/>

  <text x="44" y="53" fill="${t.ink}" font-family="${MONO}" font-size="14" letter-spacing="2.6">RK / ACTIVITY</text>
  <path d="M 218 48 H 296" fill="none" stroke="${t.ink}" stroke-width="1" opacity="0.7"/>
  <circle cx="308" cy="48" r="3.5" fill="${t.accent}"/>
  <text x="958" y="53" fill="${t.faint}" text-anchor="end" font-family="${MONO}" font-size="14" letter-spacing="2">SINCE ${FIRST_YEAR}</text>

  <text x="50" y="88" fill="${t.mute}" font-family="${MONO}" font-size="14" letter-spacing="0.5">${esc(trajectory)}</text>
${tileSvg}

  <path d="M 52 ${sy + 0.5} H 948" fill="none" stroke="${t.ink}" stroke-width="1" opacity="0.28"/>
  ${bars}
  <text x="52" y="272" fill="${t.faint}" font-family="${MONO}" font-size="12" letter-spacing="1.6">52 WEEKS &#183; LAST 7 DAYS IN COLOUR</text>
  <text x="948" y="272" fill="${t.faint}" text-anchor="end" font-family="${MONO}" font-size="12" letter-spacing="1.6">UPDATED ${generatedDate}</text>
</svg>
`;
}

mkdirSync(join(ROOT, "assets"), { recursive: true });
for (const [name, theme] of Object.entries(THEMES)) {
  const svg = card(theme, stats);
  if (svg.includes("undefined") || svg.includes("NaN"))
    fail(`rendered ${name} card contains undefined/NaN`);
  writeFileSync(join(ROOT, `assets/stats-${name}.svg`), svg);
}
writeFileSync(join(ROOT, "assets/stats.json"), JSON.stringify(stats, null, 2) + "\n");
// NOTE: stats.json deliberately omits the generated date. The workflow diffs it
// to decide whether anything really changed; including a timestamp would make
// every scheduled run look like a change and commit noise forever.

console.log(
  `build-stats: ${n(totals.prs)} PRs, ${n(totals.reviews)} reviews, ` +
    `${n(totals.commits)} commits, ${n(totals.repos)} repos, ` +
    `${stats.weeks.length} sparkline weeks, peak ${peak.count} on ${peak.date}`
);
