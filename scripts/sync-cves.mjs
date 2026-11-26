#!/usr/bin/env node
// Umut Sevinç (VulnSVNC) CVE senkronizasyonu.
//
// 1) Aday CVE ID'leri: NVD 2.0 API (keywordSearch) + mevcut src/data/cves.json kayıtları.
// 2) Doğrulama: Her aday, resmî CVEProject/cvelistV5 kaydından çekilir; yalnızca
//    credits veya references alanında "Umut Sevinç", "Umut SEVİNÇ" veya "VulnSVNC" geçenler kabul edilir.
// 3) Elle düzenlenmiş alanlar (rootCause, poc, impact...) korunur; yeni kayıtlar eklenir.
//    Doğrulanamayan kayıtlar silinmez, uyarı olarak raporlanır (ağ hatası kayıt kaybettirmesin).
//
// Kullanım:  node scripts/sync-cves.mjs        (NVD_API_KEY ortam değişkeni isteğe bağlı)

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'src/data/cves.json');
const NAMES = ['Umut Sevinç', 'Umut SEVİNÇ', 'VulnSVNC'];
const norm = (s) => String(s).toLocaleLowerCase('tr').normalize('NFC');
const NEEDLES = NAMES.map(norm);
const hasName = (v) => NEEDLES.some((n) => norm(JSON.stringify(v ?? '')).includes(n) || norm(JSON.stringify(v ?? '')).includes(n.replace('ç', 'c').replace('i̇', 'i')));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(url, headers = {}, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'vulnsvnc-site-sync', ...headers } });
    if (res.ok) return res.json();
    if (res.status === 404) return null;
    if (i < tries) await sleep(2000 * i);
    else throw new Error(`${res.status} ${res.statusText} — ${url}`);
  }
}

// CVE-2026-134753 -> cves/2026/134xxx/CVE-2026-134753.json
function cvelistUrl(id) {
  const [, year, num] = id.split('-');
  const bucket = Math.floor(Number(num) / 1000) + 'xxx';
  return `https://raw.githubusercontent.com/CVEProject/cvelistV5/main/cves/${year}/${bucket}/${id}.json`;
}

async function nvdCandidates() {
  const ids = new Set();
  const headers = process.env.NVD_API_KEY ? { apiKey: process.env.NVD_API_KEY } : {};
  for (const name of NAMES) {
    try {
      const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(name)}&resultsPerPage=200`;
      const json = await getJson(url, headers);
      for (const v of json?.vulnerabilities ?? []) ids.add(v.cve.id);
    } catch (e) {
      console.warn(`! NVD araması başarısız (${name}): ${e.message}`);
    }
    await sleep(process.env.NVD_API_KEY ? 700 : 6500); // NVD rate limit
  }
  return ids;
}

function verify(record) {
  const cna = record?.containers?.cna ?? {};
  const adp = record?.containers?.adp ?? [];
  const creditHit = hasName(cna.credits) || adp.some((a) => hasName(a.credits));
  const refHit = hasName(cna.references) || adp.some((a) => hasName(a.references));
  return creditHit || refHit;
}

function toEntry(record) {
  const id = record.cveMetadata.cveId;
  const cna = record.containers.cna;
  const en = (cna.descriptions ?? []).find((d) => d.lang?.startsWith('en'))?.value ?? '';
  const product = cna.affected?.[0]?.product ?? 'Unknown';
  const metrics = cna.metrics ?? [];
  const cvss = {};
  for (const m of metrics) {
    if (m.cvssV4_0) cvss.v4 = m.cvssV4_0.baseScore;
    if (m.cvssV3_1) cvss.v31 = m.cvssV3_1.baseScore;
  }
  const cwe = (cna.problemTypes ?? [])
    .flatMap((p) => p.descriptions ?? [])
    .map((d) => d.cweId)
    .filter(Boolean);
  const refs = (cna.references ?? []).map((r) => ({ label: r.name || r.url, url: r.url }));
  return {
    id,
    product,
    title: cna.title || `${product}: ${en.slice(0, 90)}`,
    vulnType: cna.title || en.slice(0, 140),
    cwe,
    cvss: Object.keys(cvss).length ? cvss : null,
    language: [],
    status: 'unknown',
    affected: cna.affected?.[0]?.versions?.[0]?.version ?? null,
    fixedIn: null,
    repo: null,
    rootCause: en ? { en, tr: en } : null,
    impact: null,
    poc: null,
    references: refs,
  };
}

async function main() {
  const existing = JSON.parse(await readFile(DATA, 'utf8'));
  const byId = new Map(existing.map((c) => [c.id, c]));
  const candidates = new Set([...byId.keys(), ...(await nvdCandidates())]);

  const out = new Map();
  const unverified = [];
  const added = [];

  for (const id of [...candidates].sort()) {
    let record = null;
    try {
      record = await getJson(cvelistUrl(id));
    } catch (e) {
      console.warn(`! ${id} cvelistV5 okunamadı: ${e.message}`);
    }
    if (record && verify(record)) {
      const prev = byId.get(id);
      if (prev) out.set(id, prev);
      else { out.set(id, toEntry(record)); added.push(id); }
    } else if (byId.has(id)) {
      out.set(id, byId.get(id)); // kaybetme; sadece raporla
      unverified.push(id);
    }
  }

  const list = [...out.values()].sort((a, b) => b.id.localeCompare(a.id));
  await writeFile(DATA, JSON.stringify(list, null, 2) + '\n');

  console.log(`Toplam: ${list.length} | Yeni: ${added.length ? added.join(', ') : '-'}`);
  if (unverified.length)
    console.warn(`Uyarı: cvelistV5'te henüz doğrulanamayan (korunan) kayıtlar: ${unverified.join(', ')}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
