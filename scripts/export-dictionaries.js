import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import MDBReader from 'mdb-reader';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'data');
const password = 'bsf3572';
const letter = /^[A-ZÑ]+$/;

const sources = [
  ['VB6/Spanish_to_English.mdb', 'es-en.json', 'Español → Inglés'],
  ['VB6/English_to_Spanish.mdb', 'en-es.json', 'Inglés → Español'],
];

mkdirSync(outDir, { recursive: true });

for (const [file, outName, label] of sources) {
  const reader = new MDBReader(readFileSync(join(root, file)), { password });
  const rows = reader.getTable('tblDictionary').getData();
  const dict = {};
  for (const row of rows) {
    const word = String(row.tword || '').trim().toUpperCase();
    if (word.length < 1 || word.length > 7 || !letter.test(word)) continue;
    const meaning = String(row.tmeaning || '').replace(/\s+$/g, '').replace(/\n{3,}/g, '\n\n');
    if (!dict[word]) dict[word] = meaning;
  }
  const json = JSON.stringify(dict);
  writeFileSync(join(outDir, outName), json);
  console.log(`${label}: ${Object.keys(dict).length} palabras, ${(json.length / 1024 / 1024).toFixed(2)} MB`);
}
