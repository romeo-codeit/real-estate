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
    const [email, firstName, lastName] = process.argv.slice(2);
    if (!email) {
      console.error('Usage: node scripts/assign-admin-if-exists.cjs <email> [firstName] [lastName]');
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

    console.log('Looking up auth user for', email);
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ per_page: 100 });
    if (listError) {
      console.error('Failed to list auth users:', listError);
      process.exit(1);
    }

    const found = (listData?.users || []).find(u => u.email === email);
    if (!found) {
      console.log('No auth user found for', email);
      process.exit(0);
    }

    const userId = found.id;
    console.log('Found user id:', userId);

    // Ensure 'admin' role exists
    const { data: rolesData, error: rolesErr } = await supabaseAdmin.from('roles').select('*').eq('name', 'admin').limit(1);
    if (rolesErr) {
      console.error('Failed to query roles table:', rolesErr);
      process.exit(1);
    }

    let roleId;
    if (rolesData && rolesData.length > 0) {
      roleId = rolesData[0].id;
      console.log('Found admin role id:', roleId);
    } else {
      const { data: insertRole, error: insertRoleErr } = await supabaseAdmin.from('roles').insert([{ name: 'admin', description: 'Administrator', permissions: null }]).select().single();
      if (insertRoleErr) {
        console.error('Failed to create admin role:', insertRoleErr);
        process.exit(1);
      }
      roleId = insertRole.id;
      console.log('Created admin role id:', roleId);
    }

    // Create profile (if not exists)
    const { data: profileData, error: profileErr } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).limit(1);
    if (profileErr) {
      console.error('Failed to query profiles:', profileErr);
      process.exit(1);
    }

    if (!profileData || profileData.length === 0) {
      const profileInsert = {
        id: userId,
        email,
        full_name: (firstName && lastName) ? `${firstName} ${lastName}` : email,
      };
      const { data: inserted, error: insertErr } = await supabaseAdmin.from('profiles').insert([profileInsert]);
      if (insertErr) {
        console.error('Failed to insert profile:', insertErr);
        process.exit(1);
      }
      console.log('Inserted profile for', email);
    } else {
      console.log('Profile already exists');
    }

    // Assign role in user_roles
    const { data: existingUR, error: exErr } = await supabaseAdmin.from('user_roles').select('*').eq('user_id', userId).eq('role_id', roleId).limit(1);
    if (exErr) {
      console.error('Failed to check user_roles:', exErr);
      process.exit(1);
    }

    if (!existingUR || existingUR.length === 0) {
      const { data: urIns, error: urErr } = await supabaseAdmin.from('user_roles').insert([{ user_id: userId, role_id: roleId }]);
      if (urErr) {
        console.error('Failed to insert user_roles mapping:', urErr);
        process.exit(1);
      }
      console.log('Assigned admin role to user', email);
    } else {
      console.log('User already has admin role');
    }

    // Also upsert into users table for legacy role field
    const permissions = ['manage_users','manage_properties','manage_investments','manage_transactions','view_reports','manage_crypto','manage_agents','view_analytics'];
    const { data: upsertUsers, error: upsertErr } = await supabaseAdmin.from('users').upsert([{ id: userId, email, first_name: firstName || '', last_name: lastName || '', role: 'admin', permissions }], { onConflict: 'id' }).select().single();
    if (upsertErr) {
      console.error('Failed to upsert users table:', upsertErr);
      process.exit(1);
    }

    console.log('Upserted users table with admin role. Done.');
  } catch (err) {
    console.error('Script error:', err);
    process.exit(1);
  }
})();
