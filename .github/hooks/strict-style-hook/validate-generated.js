#!/usr/bin/env node

/**
 * validate-generated.js
 *
 * Strict style validator for Copilot-generated code.
 * Enforces the project conventions defined in .github/copilot-instructions.md:
 *
 *  - No hardcoded colors (must use semantic tokens)
 *  - Feature-first page architecture (pages are thin wrappers)
 *  - No `any` TypeScript types
 *  - `cn()` used for conditional className merging
 *  - Form fields use FieldGroup / FieldSet / FieldLabel from @/components/ui/field
 *  - Barrel exports in index.ts files are alphabetically ordered
 *  - Icon components follow the IconName convention
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ─── Helpers ────────────────────────────────────────────────────────────────

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function relPath(filePath) {
  return path.relative(process.cwd(), filePath);
}

// ─── Rules ──────────────────────────────────────────────────────────────────

/**
 * Rule: No hardcoded Tailwind color classes.
 * Allowed: bg-background, text-foreground, border-border, bg-primary, etc.
 * Forbidden: bg-white, bg-black, text-black, bg-[#fff], bg-blue-500, etc.
 */
const HARDCODED_COLOR_RE =
  /\b(?:bg|text|border|ring|fill|stroke|from|via|to|shadow|outline|caret|decoration|placeholder|divide|accent)-(?:(?:white|black)(?:\/\d+)?|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?:\/\d+)?)\b|(?:bg|text)-\[#[0-9a-fA-F]{3,8}\]/g;

function checkNoHardcodedColors(filePath, content) {
  const violations = [];
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    const matches = line.match(HARDCODED_COLOR_RE);
    if (matches) {
      violations.push(
        `  Line ${idx + 1}: hardcoded color(s) detected — ${matches.join(", ")}\n    Use semantic tokens (bg-background, text-foreground, …) instead.`
      );
    }
  });
  return violations;
}

/**
 * Rule: Pages must be thin wrappers — no JSX beyond the feature component.
 * A valid page file exports a default function that only renders one element.
 */
function checkFeatureFirstPage(filePath, content) {
  if (!filePath.includes(path.join("app", path.sep)) && !filePath.includes("/app/")) {
    return [];
  }
  if (!filePath.endsWith("page.tsx") && !filePath.endsWith("page.ts")) {
    return [];
  }

  const violations = [];

  // Detect inline JSX element trees (multiple JSX children in a return)
  const hasMultipleJsxElements = /<(?!\/)[A-Z][A-Za-z].*>[\s\S]*<(?!\/)[A-Z][A-Za-z].*>/m.test(
    content
  );
  if (hasMultipleJsxElements) {
    violations.push(
      `  Page file contains multiple JSX elements.\n    Pages must be thin wrappers: import and render only the feature component.\n    See .github/copilot-instructions.md — Feature-First Pages rule.`
    );
  }

  // Detect logic (useState, useEffect, fetch, etc.) directly in page files
  const hasHooks = /\buse(?:State|Effect|Memo|Callback|Ref|Context|Reducer)\s*\(/.test(content);
  if (hasHooks) {
    violations.push(
      `  Page file uses React hooks directly.\n    Move all logic into the feature component under src/components/features/.`
    );
  }

  return violations;
}

/**
 * Rule: No `any` types in TypeScript files.
 */
function checkNoAnyTypes(filePath, content) {
  if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx")) return [];

  const violations = [];
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    // Ignore commented lines
    if (/^\s*\/\//.test(line)) return;
    // Match `: any` or `as any` or `<any>`
    if (/:\s*any\b|as\s+any\b|<any>/.test(line)) {
      violations.push(
        `  Line ${idx + 1}: \`any\` type detected — use explicit types or generics.`
      );
    }
  });
  return violations;
}

/**
 * Rule: className concatenation must use cn() from @/lib/utils, not template literals or string concat.
 */
function checkCnUtility(filePath, content) {
  if (!filePath.endsWith(".tsx")) return [];

  const violations = [];
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    // Detect template literal className concatenation: className={`...${...}...`}
    if (/className=\{`[^`]*\$\{/.test(line)) {
      violations.push(
        `  Line ${idx + 1}: template literal used for className — use cn() from @/lib/utils instead.`
      );
    }
    // Detect string concatenation: className={"base " + ...}
    if (/className=\{["'][^"']*["']\s*\+/.test(line)) {
      violations.push(
        `  Line ${idx + 1}: string concatenation used for className — use cn() from @/lib/utils instead.`
      );
    }
  });
  return violations;
}

/**
 * Rule: Forms must use Field/FieldGroup/FieldSet/FieldLabel from @/components/ui/field.
 * If a file contains <form> or <Form> but imports Label directly, it's a violation.
 */
function checkFormFieldComponents(filePath, content) {
  if (!filePath.endsWith(".tsx")) return [];

  const violations = [];

  const hasForm = /<form[\s>]|<Form[\s>]/.test(content);
  if (!hasForm) return [];

  // Check for direct Label import instead of FieldLabel
  if (/import[^;]*\bLabel\b[^;]*from\s+["']@\/components\/ui\/label["']/.test(content)) {
    violations.push(
      `  Form file imports Label directly — use FieldLabel from @/components/ui/field instead.`
    );
  }

  // Warn if FieldGroup is absent while a form is present
  if (!content.includes("FieldGroup")) {
    violations.push(
      `  Form file is missing FieldGroup — wrap fields in FieldGroup > FieldSet > Field structure.\n    See .github/copilot-instructions.md — Form Standards.`
    );
  }

  return violations;
}

/**
 * Rule: Barrel index.ts exports must be in alphabetical order.
 */
function checkAlphabeticalExports(filePath, content) {
  if (!filePath.endsWith("index.ts") && !filePath.endsWith("index.tsx")) return [];

  const violations = [];
  const exportLines = content
    .split("\n")
    .filter((line) => /^export\s+\{/.test(line.trim()) || /^export\s+\*\s+from/.test(line.trim()));

  if (exportLines.length < 2) return [];

  // Extract the first exported name from each line for ordering comparison
  const getFirstName = (line) => {
    const match = line.match(/export\s+\{\s*([A-Za-z_$][A-Za-z0-9_$]*)/) ||
      line.match(/export\s+\*\s+from\s+["'].*\/([A-Za-z_$][A-Za-z0-9_$.-]*)["']/);
    return match ? match[1].toLowerCase() : line.trim().toLowerCase();
  };

  const names = exportLines.map(getFirstName);
  for (let i = 1; i < names.length; i++) {
    if (names[i] < names[i - 1]) {
      violations.push(
        `  Barrel export not in alphabetical order: "${names[i]}" should come before "${names[i - 1]}".\n    Keep all exports in src/components/ui/index.ts, src/components/shared/index.ts, etc. in alphabetical order.`
      );
      break; // Report first violation only
    }
  }

  return violations;
}

/**
 * Rule: Icon components must be named with the Icon prefix and placed in
 * src/components/shared/icons/ or src/components/icons/.
 */
function checkIconNamingConvention(filePath, content) {
  const isInIconsDir =
    filePath.includes(path.join("components", "icons")) ||
    filePath.includes(path.join("components", "shared", "icons"));

  if (!isInIconsDir) return [];
  if (filePath.endsWith("index.ts") || filePath.endsWith("index.tsx")) return [];

  const violations = [];
  const fileName = path.basename(filePath, path.extname(filePath));

  if (!fileName.startsWith("Icon")) {
    violations.push(
      `  Icon file "${fileName}" does not follow the IconName naming convention.\n    Rename to Icon${fileName}.tsx and update the barrel export.`
    );
  }

  // Must use SVGProps<SVGSVGElement>
  if (!content.includes("SVGProps<SVGSVGElement>") && !content.includes("SVGProps")) {
    violations.push(
      `  Icon component should use SVGProps<SVGSVGElement> for type safety.\n    See .github/copilot-instructions.md — Creating Icons.`
    );
  }

  return violations;
}

// ─── Runner ─────────────────────────────────────────────────────────────────

const RULES = [
  { name: "No hardcoded colors", fn: checkNoHardcodedColors },
  { name: "Feature-first pages", fn: checkFeatureFirstPage },
  { name: "No any types", fn: checkNoAnyTypes },
  { name: "Use cn() for className", fn: checkCnUtility },
  { name: "Form field components", fn: checkFormFieldComponents },
  { name: "Alphabetical barrel exports", fn: checkAlphabeticalExports },
  { name: "Icon naming convention", fn: checkIconNamingConvention },
];

function validateFiles(filePaths) {
  let totalViolations = 0;
  const results = [];

  for (const filePath of filePaths) {
    if (!fs.existsSync(filePath)) continue;

    const ext = path.extname(filePath);
    if (![".ts", ".tsx", ".js", ".jsx"].includes(ext)) continue;

    const content = readFile(filePath);
    const fileViolations = [];

    for (const rule of RULES) {
      const violations = rule.fn(filePath, content);
      if (violations.length > 0) {
        fileViolations.push({ rule: rule.name, violations });
        totalViolations += violations.length;
      }
    }

    if (fileViolations.length > 0) {
      results.push({ filePath, fileViolations });
    }
  }

  return { totalViolations, results };
}

function main() {
  // Accept file paths as CLI args, or fall back to git-staged files
  let filePaths = process.argv.slice(2);

  if (filePaths.length === 0) {
    try {
      const staged = execSync("git diff --cached --name-only --diff-filter=ACMR", {
        encoding: "utf8",
      }).trim();
      filePaths = staged ? staged.split("\n").map((f) => path.resolve(process.cwd(), f)) : [];
    } catch {
      filePaths = [];
    }
  }

  if (filePaths.length === 0) {
    console.log("validate-generated: no files to validate.");
    process.exit(0);
  }

  const { totalViolations, results } = validateFiles(filePaths);

  if (totalViolations === 0) {
    console.log(`✅ validate-generated: all ${filePaths.length} file(s) passed strict style checks.`);
    process.exit(0);
  }

  console.error(`\n❌ validate-generated: ${totalViolations} strict style violation(s) found:\n`);

  for (const { filePath, fileViolations } of results) {
    console.error(`📄 ${relPath(filePath)}`);
    for (const { rule, violations } of fileViolations) {
      console.error(`  [${rule}]`);
      for (const v of violations) {
        console.error(v);
      }
    }
    console.error("");
  }

  console.error(
    "Fix the violations above before committing. See .github/copilot-instructions.md for guidance.\n"
  );
  process.exit(1);
}

main();
