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
    if (!url || !key) {
      console.error('Missing SUPABASE service role or url in .env');
      process.exit(2);
    }

    const supabaseAdmin = createClient(url, key);

    const email = process.argv[2];
    const password = process.argv[3];
    const firstName = process.argv[4];
    const lastName = process.argv[5];

    console.log('Attempting admin.createUser...');
    try {
      const res = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName }
      });
      console.log('createUser response:', JSON.stringify(res, Object.getOwnPropertyNames(res), 2));
    } catch (err) {
      console.error('createUser threw:', err && err.toString());
      console.error('full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    }

    console.log('\nAttempting admin.inviteUserByEmail...');
    try {
      const res2 = await supabaseAdmin.auth.admin.inviteUserByEmail(email, { user_metadata: { first_name: firstName, last_name: lastName }, redirect_to: '' });
      console.log('inviteUserByEmail response:', JSON.stringify(res2, Object.getOwnPropertyNames(res2), 2));
    } catch (err) {
      console.error('inviteUserByEmail threw:', err && err.toString());
      console.error('full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    }

    console.log('\nListing auth users matching email...');
    try {
      const { data } = await supabaseAdmin.auth.admin.listUsers({ per_page: 100 });
      const found = (data?.users || []).filter(u => u.email === email);
      console.log('found:', JSON.stringify(found, null, 2));
    } catch (err) {
      console.error('listUsers error:', err);
    }

  } catch (err) {
    console.error('Script fatal error:', err);
    process.exit(1);
  }
})();
