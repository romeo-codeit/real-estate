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
    const [email, firstName, lastName, timeoutMinutes = 10] = process.argv.slice(2);
    if (!email) {
      console.error('Usage: node scripts/watch-assign-admin.cjs <email> [firstName] [lastName] [timeoutMinutes]');
      process.exit(2);
    }

    const env = parseDotEnv('.env');
    const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error('Missing SUPABASE service role or url in .env');
      process.exit(2);
    }

    const supabaseAdmin = createClient(url, key);

    const timeoutMs = parseInt(timeoutMinutes, 10) * 60 * 1000;
    const intervalMs = 15 * 1000;
    const started = Date.now();

    console.log(`Watching for auth user ${email} for ${timeoutMinutes} minute(s)...`);

    while (Date.now() - started < timeoutMs) {
      try {
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ per_page: 100 });
        if (listError) {
          console.error('Failed to list auth users:', listError);
        } else {
          const found = (listData?.users || []).find(u => u.email === email);
          if (found) {
            console.log('Found auth user, assigning admin...');
            // Call assign script logic inline
            const userId = found.id;
            // Ensure 'admin' role exists
            const { data: rolesData } = await supabaseAdmin.from('roles').select('*').eq('name', 'admin').limit(1);
            let roleId;
            if (rolesData && rolesData.length > 0) roleId = rolesData[0].id;
            else {
              const { data: insertRole } = await supabaseAdmin.from('roles').insert([{ name: 'admin', description: 'Administrator' }]).select().single();
              roleId = insertRole.id;
            }
            // Create profile if missing
            const { data: profileData } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).limit(1);
            if (!profileData || profileData.length === 0) {
              await supabaseAdmin.from('profiles').insert([{ id: userId, email, full_name: (firstName && lastName) ? `${firstName} ${lastName}` : email }]);
            }
            // Assign in user_roles
            const { data: existingUR } = await supabaseAdmin.from('user_roles').select('*').eq('user_id', userId).eq('role_id', roleId).limit(1);
            if (!existingUR || existingUR.length === 0) {
              await supabaseAdmin.from('user_roles').insert([{ user_id: userId, role_id: roleId }]);
            }
            // Upsert into users
            const permissions = ['manage_users','manage_properties','manage_investments','manage_transactions','view_reports','manage_crypto','manage_agents','view_analytics'];
            await supabaseAdmin.from('users').upsert([{ id: userId, email, first_name: firstName || '', last_name: lastName || '', role: 'admin', permissions }], { onConflict: 'id' });

            console.log('Admin role assigned to', email);
            process.exit(0);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }

      await new Promise((r) => setTimeout(r, intervalMs));
      console.log('Still waiting...');
    }

    console.log('Timeout: user not found. Exiting.');
    process.exit(0);
  } catch (err) {
    console.error('Watcher error:', err);
    process.exit(1);
  }
})();
