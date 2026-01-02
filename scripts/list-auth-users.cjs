const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

function parseDotEnv(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const txt = fs.readFileSync(envPath, 'utf8');
  const lines = txt.split(/\r?\n/);
  const out = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx);
    const value = trimmed.slice(idx + 1);
    out[key] = value;
  }
  return out;
}

(async () => {
  try {
    const env = parseDotEnv('.env');
    const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = createClient(url, key);

    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ per_page: 100 });
    if (error) {
      console.error('listUsers error:', error);
      process.exit(1);
    }

    const email = process.argv[2];
    if (email) {
      const found = (data?.users || []).filter(u => u.email === email);
      console.log('Found auth users with email', email, ':', found);
    } else {
      console.log('First 100 auth users:', data?.users || []);
    }
  } catch (err) {
    console.error('error:', err);
    process.exit(1);
  }
})();
