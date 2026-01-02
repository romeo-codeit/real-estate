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

    console.log('Checking roles table...');
    const { data: rolesData, error: rolesErr } = await supabaseAdmin.from('roles').select('*');
    if (rolesErr) {
      console.error('Error querying roles:', rolesErr);
    } else {
      console.log('Roles found:', rolesData);
    }

    console.log('\nChecking if trigger is the issue by inserting base roles...');
    const baseRoles = [
      { name: 'admin', description: 'Administrator' },
      { name: 'user', description: 'Regular User' },
      { name: 'agent', description: 'Agent' },
      { name: 'investor', description: 'Investor' }
    ];

    for (const role of baseRoles) {
      const { data: existing } = await supabaseAdmin.from('roles').select('*').eq('name', role.name).limit(1);
      if (!existing || existing.length === 0) {
        const { error: insertErr } = await supabaseAdmin.from('roles').insert([role]);
        if (insertErr) {
          console.error(`Failed to insert role ${role.name}:`, insertErr);
        } else {
          console.log(`Inserted role: ${role.name}`);
        }
      } else {
        console.log(`Role ${role.name} already exists`);
      }
    }

    console.log('\nNow attempting to create admin user...');
    const email = 'reyeskaze10@gmail.com';
    const password = 'Admin1234$';
    const firstName = 'Ebuka';
    const lastName = 'Kelvin';

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

    const userId = createData.user.id;
    console.log('✅ Auth user created with id:', userId);

    // Update to admin role
    const { data: adminRole } = await supabaseAdmin.from('roles').select('id').eq('name', 'admin').single();
    if (adminRole) {
      await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
      await supabaseAdmin.from('user_roles').insert([{ user_id: userId, role_id: adminRole.id }]);
      console.log('✅ Assigned admin role in user_roles');
    }

    const permissions = ['manage_users','manage_properties','manage_investments','manage_transactions','view_reports','manage_crypto','manage_agents','view_analytics'];
    await supabaseAdmin.from('users').update({ role: 'admin', permissions }).eq('id', userId);
    console.log('✅ Updated users table with admin role');

    console.log('\n✅ Admin account created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', userId);

  } catch (err) {
    console.error('Script error:', err);
    process.exit(1);
  }
})();
