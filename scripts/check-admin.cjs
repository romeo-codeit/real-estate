const fs = require('fs');
const path = require('path');
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
    const env = parseDotEnv(path.join(__dirname, '..', '.env'));
    const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error('Missing SUPABASE service role or url in .env');
      process.exit(2);
    }

    const supabaseAdmin = createClient(url, key);

    console.log('Checking for existing admin users (role = admin)...');
    const { data, error } = await supabaseAdmin.from('users').select('id, email, role').eq('role', 'admin');
    if (error) {
      console.error('Error querying users table:', error);
      process.exit(1);
    }

    console.log('Found', (data || []).length, 'admin(s):');
    console.log(data);

    console.log('\nChecking for user with provided email...');
    const email = process.argv[2];
    if (email) {
      const { data: byEmail, error: byEmailErr } = await supabaseAdmin.from('users').select('id, email, role').eq('email', email);
      if (byEmailErr) {
        console.error('Error querying by email:', byEmailErr);
        process.exit(1);
      }
      console.log('Users with email', email, ':', byEmail || []);
    }

    process.exit(0);
  } catch (err) {
    console.error('Script error:', err);
    process.exit(1);
  }
})();