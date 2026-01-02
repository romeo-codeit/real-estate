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
    const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey || !serviceKey) {
      console.error('Missing Supabase keys in .env');
      process.exit(2);
    }

    const email = 'reyeskaze10@gmail.com';
    const password = 'Admin1234$';
    const firstName = 'Ebuka';
    const lastName = 'Kelvin';

    // Step 1: Sign up using public client
    console.log('Creating auth user via signUp...');
    const supabasePublic = createClient(url, anonKey);
    const { data: signupData, error: signupError } = await supabasePublic.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    if (signupError) {
      console.error('Signup error:', signupError);
      process.exit(1);
    }

    if (!signupData || !signupData.user) {
      console.error('No user returned from signup');
      process.exit(1);
    }

    const userId = signupData.user.id;
    console.log('Auth user created with id:', userId);

    // Step 2: Use admin client to update role
    console.log('Updating user to admin role...');
    const supabaseAdmin = createClient(url, serviceKey);

    // Ensure admin role exists
    let roleId = null;
    const { data: rolesData, error: rolesErr } = await supabaseAdmin.from('roles').select('*').eq('name', 'admin').limit(1);
    if (!rolesErr && rolesData && rolesData.length > 0) {
      roleId = rolesData[0].id;
    } else {
      const { data: insertRole, error: insertRoleErr } = await supabaseAdmin.from('roles').insert([{ name: 'admin', description: 'Administrator' }]).select().single();
      if (!insertRoleErr && insertRole) {
        roleId = insertRole.id;
      }
    }

    // Update users table
    const permissions = ['manage_users','manage_properties','manage_investments','manage_transactions','view_reports','manage_crypto','manage_agents','view_analytics'];
    const { error: updateErr } = await supabaseAdmin.from('users').update({ 
      role: 'admin', 
      permissions,
      first_name: firstName,
      last_name: lastName 
    }).eq('id', userId);

    if (updateErr) {
      console.error('Failed to update users table:', updateErr);
      process.exit(1);
    }

    console.log('Updated users table with admin role');

    // Create profile if needed
    const { data: profileData } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).limit(1);
    if (!profileData || profileData.length === 0) {
      await supabaseAdmin.from('profiles').insert([{ 
        id: userId, 
        email, 
        full_name: `${firstName} ${lastName}` 
      }]);
      console.log('Created profile');
    }

    // Assign in user_roles if roleId exists
    if (roleId) {
      const { data: existingUR } = await supabaseAdmin.from('user_roles').select('*').eq('user_id', userId).eq('role_id', roleId).limit(1);
      if (!existingUR || existingUR.length === 0) {
        await supabaseAdmin.from('user_roles').insert([{ user_id: userId, role_id: roleId }]);
        console.log('Assigned user_roles mapping');
      }
    }

    console.log('\n✅ Admin account created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', userId);
    console.log('\nYou can now log in at /login');

  } catch (err) {
    console.error('Script error:', err);
    process.exit(1);
  }
})();
