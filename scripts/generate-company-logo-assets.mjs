import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const logoOutputDir = join(
  process.cwd(),
  "apps",
  "web",
  "public",
  "company-logos",
);

const count = 100;

const logoPalettes = [
  ["#0f172a", "#14b8a6", "#ecfeff"],
  ["#1f2937", "#f59e0b", "#fffbeb"],
  ["#1e3a8a", "#22c55e", "#eff6ff"],
  ["#7c2d12", "#0ea5e9", "#f0f9ff"],
  ["#134e4a", "#fb7185", "#fff1f2"],
  ["#312e81", "#a3e635", "#f7fee7"],
  ["#78350f", "#38bdf8", "#f0f9ff"],
  ["#064e3b", "#c084fc", "#faf5ff"],
  ["#581c87", "#facc15", "#fefce8"],
  ["#0c4a6e", "#fb923c", "#fff7ed"],
  ["#3f1d1d", "#10b981", "#ecfdf5"],
  ["#172554", "#e879f9", "#fdf4ff"],
];

const logoCodes = [
  "AC",
  "BK",
  "CP",
  "DX",
  "EL",
  "FN",
  "GA",
  "HB",
  "IC",
  "JR",
  "KV",
  "LX",
  "MN",
  "OP",
  "QT",
  "RX",
  "SD",
  "TL",
  "UM",
  "VW",
  "AX",
  "BY",
  "CZ",
  "DR",
  "EV",
];

function pad(value) {
  return String(value).padStart(3, "0");
}

function monogram(code, x, y, size, fill = "#ffffff") {
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="900" text-anchor="middle" dominant-baseline="central">${code}</text>`;
}

function simpleLogoMark(index, code, primary, accent) {
  const variant = index % 12;

  switch (variant) {
    case 0:
      return `
        <rect x="22" y="22" width="84" height="84" rx="26" fill="${primary}"/>
        <circle cx="92" cy="36" r="10" fill="${accent}"/>
        ${monogram(code, 64, 66, 34)}
      `;
    case 1:
      return `
        <circle cx="64" cy="64" r="45" fill="${primary}"/>
        <rect x="82" y="30" width="14" height="44" rx="7" fill="${accent}"/>
        ${monogram(code, 57, 67, 32)}
      `;
    case 2:
      return `
        <path d="M64 14l43 25v50l-43 25-43-25V39z" fill="${primary}"/>
        <circle cx="64" cy="64" r="31" fill="${accent}" opacity=".24"/>
        ${monogram(code, 64, 66, 31)}
      `;
    case 3:
      return `
        <rect x="24" y="28" width="80" height="72" rx="18" fill="${primary}"/>
        <path d="M42 83h44" stroke="${accent}" stroke-width="10" stroke-linecap="round"/>
        ${monogram(code, 64, 56, 30)}
      `;
    case 4:
      return `
        <path d="M64 16l48 48-48 48-48-48z" fill="${primary}"/>
        <circle cx="64" cy="64" r="18" fill="${accent}"/>
        ${monogram(code.slice(0, 1), 64, 65, 33)}
      `;
    case 5:
      return `
        <circle cx="64" cy="64" r="47" fill="${primary}"/>
        <circle cx="64" cy="64" r="29" fill="none" stroke="${accent}" stroke-width="9"/>
        ${monogram(code, 64, 65, 27)}
      `;
    case 6:
      return `
        <rect x="28" y="20" width="72" height="88" rx="24" fill="${primary}"/>
        <rect x="43" y="34" width="42" height="12" rx="6" fill="${accent}"/>
        ${monogram(code, 64, 70, 31)}
      `;
    case 7:
      return `
        <path d="M28 98V42l36-22 36 22v56z" fill="${primary}"/>
        <path d="M43 97V62h42v35" fill="${accent}" opacity=".9"/>
        ${monogram(code.slice(0, 1), 64, 53, 31)}
      `;
    case 8:
      return `
        <rect x="18" y="38" width="92" height="52" rx="26" fill="${primary}"/>
        <circle cx="42" cy="64" r="18" fill="${accent}"/>
        ${monogram(code, 73, 65, 30)}
      `;
    case 9:
      return `
        <path d="M64 18c27 0 46 18 46 43 0 31-46 50-46 50S18 92 18 61c0-25 19-43 46-43z" fill="${primary}"/>
        <path d="M45 64l13 13 26-31" fill="none" stroke="${accent}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
      `;
    case 10:
      return `
        <rect x="20" y="20" width="88" height="88" rx="44" fill="${primary}"/>
        <path d="M40 76c10-24 38-24 48 0" fill="none" stroke="${accent}" stroke-width="10" stroke-linecap="round"/>
        ${monogram(code.slice(0, 1), 64, 55, 30)}
      `;
    default:
      return `
        <rect x="26" y="26" width="76" height="76" rx="20" fill="${primary}"/>
        <path d="M41 76h46M41 55h46" stroke="${accent}" stroke-width="10" stroke-linecap="round"/>
        ${monogram(code.slice(0, 1), 64, 66, 28)}
      `;
  }
}

function logoSvg(index) {
  const [primary, accent, background] =
    logoPalettes[index % logoPalettes.length];
  const code = logoCodes[index % logoCodes.length];
  const mark = simpleLogoMark(index, code, primary, accent)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-labelledby="title desc">
  <title id="title">Generated company logo ${pad(index + 1)}</title>
  <desc id="desc">A simple synthetic company logo for Accountit seed data.</desc>
  <rect width="128" height="128" rx="28" fill="${background}"/>
  ${mark}
</svg>
`;
}

await mkdir(logoOutputDir, { recursive: true });

await Promise.all(
  Array.from({ length: count }, (_, index) =>
    writeFile(
      join(logoOutputDir, `generated-logo-${pad(index + 1)}.svg`),
      logoSvg(index),
      "utf8",
    ),
  ),
);

console.log(`Generated ${count} simple company logo SVGs in ${logoOutputDir}`);
console.log(
  "Company backgrounds use the photorealistic PNG pool in apps/web/public/company-backgrounds.",
);
