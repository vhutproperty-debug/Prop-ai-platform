/**
 * Responsive design verification — structural checks.
 */
import { existsSync, readFileSync } from "node:fs";

const results = [];

function record(check, pass, detail) {
  results.push({ check, pass, detail });
  console.log(
    `[Responsive] ${pass ? "PASS" : "FAIL"} — ${check}${detail ? `: ${detail}` : ""}`
  );
}

const required = [
  "components/admin/admin-shell.tsx",
  "components/admin/admin-sidebar-nav.tsx",
  "components/admin/admin-nav-config.ts",
  "components/ui/responsive-table.tsx",
  "components/layout/site-header.tsx",
  "components/project/project-page-header.tsx",
];

for (const file of required) {
  record(`File exists: ${file}`, existsSync(file));
}

const shell = readFileSync("components/admin/admin-shell.tsx", "utf8");
record("Mobile bottom navigation", shell.includes("Admin mobile navigation"));
record("Mobile drawer menu", shell.includes("setDrawerOpen"));
record("Tablet collapsed sidebar", shell.includes("collapsed") && shell.includes("md:flex lg:hidden"));
record("Desktop full sidebar", shell.includes("hidden w-64 shrink-0 lg:flex"));

const dataTable = readFileSync("components/admin/admin-data-table.tsx", "utf8");
record("AdminDataTable mobile cards", dataTable.includes("lg:hidden"));

const globals = readFileSync("app/globals.css", "utf8");
record("Overflow-x clip", globals.includes("overflow-x: clip"));
record("Touch manipulation utility", globals.includes("touch-manipulation"));
record("iOS input font-size fix", globals.includes("font-size: 16px"));

const layout = readFileSync("app/layout.tsx", "utf8");
record("Viewport meta export", layout.includes("export const viewport"));

const failed = results.filter((r) => !r.pass).length;
console.log(`\n[Responsive] ${results.length - failed}/${results.length} checks passed`);
process.exit(failed > 0 ? 1 : 0);
