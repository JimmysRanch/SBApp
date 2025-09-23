const fs = require("fs"); const path = require("path");
const must = [
  "/lib/settings/types.ts",
  "/lib/settings/defaults.ts",
  "/lib/settings/schema.ts",
  "/lib/settings/store.ts",
  "/app/api/settings/route.ts",
  "/components/settings/Field.tsx",
  "/components/settings/SettingsNav.tsx",
  "/components/settings/useSettings.ts",
  "/app/settings/page.tsx",
  "/app/settings/self-test/page.tsx",
  "/supabase/migrations/20250922_app_settings.sql",
  "/supabase/migrations/20250922_payroll_settings.sql",
  "/tests/unit/resolve-settings.test.ts",
  "/tests/e2e/settings.spec.ts",
  "/playwright.config.ts",
  "/.github/workflows/settings-ci.yml"
];
const missing = must.filter(rel => !fs.existsSync(path.join(process.cwd(), rel)));
if (missing.length){
  console.error("Missing required files:\n" + missing.map(s=>" - "+s).join("\n"));
  process.exit(1);
}
console.log("Manifest OK");
