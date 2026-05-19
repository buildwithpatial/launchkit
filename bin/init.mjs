#!/usr/bin/env node
// One-time scaffolder. Run after cloning launchkit via "Use this template".
// Renames branded references, generates AUTH_SECRET, writes .env.local, deletes itself.

import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

const REPLACEMENTS = [
  { file: "package.json", from: '"name": "launchkit"', to: '"name": "{{name}}"' },
  { file: "app/layout.tsx", from: 'title: "launchkit"', to: 'title: "{{name}}"' },
  { file: "app/page.tsx", from: ">\n          launchkit\n        </Link>", to: ">\n          {{name}}\n        </Link>" },
  { file: "app/page.tsx", from: '<h1 className="text-4xl font-semibold tracking-tight">launchkit</h1>', to: '<h1 className="text-4xl font-semibold tracking-tight">{{name}}</h1>' },
  { file: "app/page.tsx", from: '"A neon sign reading launchkit"', to: '"A neon sign reading {{name}}"' },
  { file: "components/chat/app-sidebar.tsx", from: 'tooltip="launchkit"', to: 'tooltip="{{name}}"' },
  { file: "components/chat/preview.tsx", from: ">launchkit</span>", to: ">{{name}}</span>" },
  { file: "components/launchkit/payment-demo.tsx", from: 'name: "launchkit"', to: 'name: "{{name}}"' },
  { file: "components/launchkit/image-demo.tsx", from: "'launchkit'", to: "'{{name}}'" },
  { file: "lib/razorpay.ts", from: 'id: "launchkit_demo"', to: 'id: "{{name}}_demo"' },
  { file: "lib/razorpay.ts", from: 'description: "Launchkit demo payment"', to: 'description: "{{name}} demo payment"' },
];

function isValidName(name) {
  return /^[a-z][a-z0-9-]{0,38}$/.test(name);
}

async function ensureNotInitialized() {
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  if (pkg.name !== "launchkit") {
    console.error(
      `✗ This project already appears initialized (package name: ${pkg.name}).\n  bin/init.mjs only runs once. Delete it manually if you want to keep it around.`
    );
    process.exit(1);
  }
}

async function ask(rl, question, defaultValue) {
  const suffix = defaultValue ? ` (${defaultValue})` : "";
  const answer = (await rl.question(`${question}${suffix}: `)).trim();
  return answer || defaultValue || "";
}

async function applyReplacement({ file, from, to }, name) {
  const target = to.replaceAll("{{name}}", name);
  const original = await readFile(file, "utf8");
  if (!original.includes(from)) {
    throw new Error(`Expected "${from}" in ${file} but did not find it.`);
  }
  await writeFile(file, original.replaceAll(from, target));
}

async function writeEnvLocal(name) {
  if (existsSync(".env.local")) {
    console.log("• .env.local already exists, leaving it alone.");
    return;
  }
  const example = await readFile(".env.example", "utf8");
  const secret = randomBytes(32).toString("base64");
  const filled = example.replace(/^AUTH_SECRET=.*$/m, `AUTH_SECRET=${secret}`);
  await writeFile(".env.local", filled);
}

async function gitCommit(name) {
  if (!existsSync(".git")) {
    return false;
  }
  try {
    execSync("git add .", { stdio: "ignore" });
    execSync(`git commit -m "Initialize ${name} from launchkit"`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await ensureNotInitialized();

  const rl = createInterface({ input, output });
  const defaultName = path.basename(root);
  let name = "";
  while (!name) {
    const answer = await ask(rl, "Project name", defaultName);
    if (isValidName(answer)) {
      name = answer;
    } else {
      console.log("  → must be lowercase, start with a letter, hyphens ok, max 39 chars");
    }
  }
  rl.close();

  console.log("");
  for (const r of REPLACEMENTS) {
    await applyReplacement(r, name);
  }
  console.log(`✓ Renamed launchkit → ${name} in ${REPLACEMENTS.length} spots`);

  await writeEnvLocal(name);
  console.log("✓ Wrote .env.local with AUTH_SECRET (8 vars still need values)");

  await rm("bin/init.mjs");
  try {
    await rm("bin", { recursive: true });
  } catch {
    // bin/ may have other files later — ignore if not empty
  }
  console.log("✓ Removed bin/init.mjs");

  const committed = await gitCommit(name);
  if (committed) {
    console.log(`✓ git commit "Initialize ${name} from launchkit"`);
  }

  console.log(`
${name} is ready.

Next:
  1. Fill in .env.local (POSTGRES_URL, AI_GATEWAY_API_KEY, REDIS_URL,
     BLOB_READ_WRITE_TOKEN, AUTH_GOOGLE_ID/SECRET, RAZORPAY_KEY_ID/SECRET).
  2. pnpm install        (if you haven't yet)
  3. pnpm db:migrate     (after POSTGRES_URL is set)
  4. pnpm dev
`);
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}`);
  process.exit(1);
});
