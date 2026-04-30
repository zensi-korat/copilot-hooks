#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("No files provided to validator.");
  process.exit(0);
}

const hexRegex = /#[0-9a-fA-F]{3,6}\b/g;
const inlineStyleNumberRegex =
  /style\s*=\s*(?:\{[^}]*\}|\"[^\"]*\"|'[^']*')/gim;
const numericInStyleValueRegex =
  /[:\s](?:[0-9]+(?:\.[0-9]+)?)(?:px|rem|em|vh|vw)\b/;
const tailwindArbitraryRegex = /\[[^\]]+\]/g;
const classNameStaticRegex = /className\s*=\s*(?:\"([^\"]+)\"|'([^']+)')/g;

let hadBlockingViolations = false;
let filesFixed = 0;

function uniqueSortedClasses(str) {
  const parts = str.split(/\s+/).filter(Boolean);
  const set = Array.from(new Set(parts));
  set.sort();
  return set.join(" ");
}

for (const file of args) {
  const filePath = path.resolve(file);
  if (!fs.existsSync(filePath)) continue;
  const ext = path.extname(filePath).toLowerCase();
  if (![".ts", ".tsx", ".js", ".jsx", ".css", ".scss"].includes(ext)) continue;

  let src = fs.readFileSync(filePath, "utf8");
  const violations = [];

  const hexMatches = src.match(hexRegex);
  if (hexMatches && hexMatches.length) {
    violations.push({
      type: "hex-colors",
      matches: Array.from(new Set(hexMatches)),
    });
  }

  let m;
  while ((m = inlineStyleNumberRegex.exec(src)) !== null) {
    const styleBlock = m[0];
    if (numericInStyleValueRegex.test(styleBlock)) {
      violations.push({
        type: "inline-numeric-styles",
        context: styleBlock.trim().slice(0, 120),
      });
    }
  }

  const arbitrary = src.match(tailwindArbitraryRegex);
  if (arbitrary && arbitrary.length) {
    violations.push({
      type: "tailwind-arbitrary",
      matches: Array.from(new Set(arbitrary)),
    });
  }

  let newSrc = src;
  let fixedInFile = 0;
  newSrc = newSrc.replace(classNameStaticRegex, (full, g1, g2) => {
    const classes = g1 || g2 || "";
    const fixed = uniqueSortedClasses(classes);
    if (fixed !== classes) {
      fixedInFile++;
      return `className="${fixed}"`;
    }
    return full;
  });

  if (fixedInFile > 0) {
    fs.writeFileSync(filePath, newSrc, "utf8");
    filesFixed += fixedInFile;
    console.log(
      `Auto-fixed ${fixedInFile} static className strings in ${file}`
    );
  }

  if (violations.length > 0) {
    console.error(`\n[STRICT-STYLE] Violations in ${file}:`);
    for (const v of violations) {
      if (v.type === "hex-colors") {
        console.error(
          ` - Found hex color(s): ${v.matches.slice(0, 5).join(", ")}${v.matches.length > 5 ? ", ..." : ""}`
        );
      } else if (v.type === "inline-numeric-styles") {
        console.error(` - Found inline numeric style: ${v.context}`);
      } else if (v.type === "tailwind-arbitrary") {
        console.error(
          ` - Found Tailwind arbitrary value(s): ${v.matches.slice(0, 5).join(", ")}${v.matches.length > 5 ? ", ..." : ""}`
        );
      }
    }
    hadBlockingViolations = true;
  }
}

if (filesFixed > 0) {
  console.log(
    `\n[STRICT-STYLE] Auto-fixed ${filesFixed} className occurrences.`
  );
}

if (hadBlockingViolations) {
  console.error(
    "\n[STRICT-STYLE] Blocking violations detected. Please replace hex colors with design tokens, remove inline numeric styles, and avoid arbitrary Tailwind values."
  );
  process.exitCode = 2;
} else {
  console.log("\n[STRICT-STYLE] Validation passed.");
  process.exitCode = 0;
}
