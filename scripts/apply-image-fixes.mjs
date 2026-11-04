import { readFileSync, writeFileSync } from "node:fs";

const base = "C:\\Users\\user\\Documents\\Default Project\\norvex";
const files = [
  `${base}\\ru\\cooperation\\index.html`,
  `${base}\\en\\cooperation\\index.html`,
  `${base}\\ky\\cooperation\\index.html`,
];
const reps = [
  ['src="/assets/cooperation-consulting.png"', 'src="/assets/cooperation-consulting.webp"'],
  ['src="/assets/cooperation-outsourcing.png"', 'src="/assets/cooperation-outsourcing.webp"'],
  ['src="/assets/cooperation-outstaffing.png"', 'src="/assets/cooperation-outstaffing.webp"'],
];

for (const f of files) {
  let s = readFileSync(f, "utf8");
  const before = s;
  for (const [a, b] of reps) s = s.split(a).join(b);
  if (s !== before) {
    writeFileSync(f, s, "utf8");
    console.log("patched:", f);
  } else {
    console.log("no changes:", f);
  }
}
