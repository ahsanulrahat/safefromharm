import { readFile } from "node:fs/promises";

const paths = ["messages/bn.json", "messages/en.json"];
const [bn, en] = await Promise.all(paths.map(async (path) => JSON.parse(await readFile(path, "utf8"))));

function flatten(value, prefix = "") {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === "object" && !Array.isArray(child)
      ? flatten(child, path)
      : [[path, child]];
  });
}

const bnEntries = new Map(flatten(bn));
const enEntries = new Map(flatten(en));
const missingEn = [...bnEntries.keys()].filter((key) => !enEntries.has(key));
const missingBn = [...enEntries.keys()].filter((key) => !bnEntries.has(key));
const empty = [...[...bnEntries, ...enEntries]
  .filter(([, value]) => typeof value !== "string" || value.trim().length === 0)
  .map(([key]) => key)];

if (missingEn.length || missingBn.length || empty.length) {
  console.error(JSON.stringify({ missingEn, missingBn, empty }, null, 2));
  process.exitCode = 1;
} else {
  console.log(`Translation parity OK (${bnEntries.size} keys in each locale).`);
}
