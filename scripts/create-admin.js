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

    const email = process.argv[2];
    const password = process.argv[3];
    const firstName = process.argv[4];
    const lastName = process.argv[5];

    if (!email || !password || !firstName || !lastName) {
      console.error('Usage: node scripts/create-admin.js <email> <password> <firstName> <lastName>');
      process.exit(2);
    }

    console.log('Creating auth user...');
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName }
    });

    if (createError) {
      console.error('Auth create user error:', createError);
      process.exit(1);
    }

    if (!createData || !createData.user) {
      console.error('No user returned from auth create');
      process.exit(1);
    }

    const user = createData.user;
    console.log('Auth user created with id:', user.id);

    // Insert into profiles / users table
    const permissions = [
      'manage_users',
      'manage_properties',
      'manage_investments',
      'manage_transactions',
      'view_reports',
      'manage_crypto',
      'manage_agents',
      'view_analytics',
    ];

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([{ id: user.id, email, first_name: firstName, last_name: lastName, role: 'admin', permissions, status: 'Active', last_login: new Date().toISOString() }]);

    if (insertError) {
      console.error('DB insert error:', insertError);
      // Attempt to clean up by deleting auth user
      try {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        console.log('Rolled back auth user due to DB insert failure.');
      } catch (e) {
        console.error('Failed to delete auth user during rollback:', e);
      }
      process.exit(1);
    }

    console.log('Admin user profile created successfully.');
    console.log({ id: user.id, email });
  } catch (err) {
    console.error('Script error:', err);
    process.exit(1);
  }
})();
