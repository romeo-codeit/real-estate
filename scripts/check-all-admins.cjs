const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAdmins() {
  console.log('\n🔍 Scanning for admin accounts...\n');
  
  // Check users table for admin role
  const { data: usersAdmins, error: usersError } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, role, status, created_at')
    .eq('role', 'admin');
  
  if (usersError) {
    console.error('❌ Error querying users table:', usersError.message);
  } else {
    console.log('📊 Admin accounts in users table:');
    if (usersAdmins.length === 0) {
      console.log('   No admins found');
    } else {
      usersAdmins.forEach((user, index) => {
        console.log(`\n   ${index + 1}. ${user.first_name} ${user.last_name}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Status: ${user.status}`);
        console.log(`      Created: ${new Date(user.created_at).toLocaleString()}`);
      });
    }
  }
  
  // Check user_roles table for admin role assignments
  const { data: adminRole, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('name', 'admin')
    .single();
  
  if (roleError) {
    console.error('\n❌ Error querying roles table:', roleError.message);
    return;
  }
  
  const { data: userRoles, error: userRolesError } = await supabase
    .from('user_roles')
    .select(`
      user_id,
      profiles:user_id (
        id,
        email,
        full_name
      )
    `)
    .eq('role_id', adminRole.id);
  
  if (userRolesError) {
    console.error('\n❌ Error querying user_roles table:', userRolesError.message);
  } else {
    console.log('\n\n📊 Admin role assignments in user_roles table:');
    if (userRoles.length === 0) {
      console.log('   No admin role assignments found');
    } else {
      userRoles.forEach((assignment, index) => {
        const profile = assignment.profiles;
        console.log(`\n   ${index + 1}. ${profile?.full_name || 'Unknown'}`);
        console.log(`      Email: ${profile?.email || 'Unknown'}`);
        console.log(`      ID: ${assignment.user_id}`);
      });
    }
  }
  
  // Check auth.users for the specific admin email
  const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('\n❌ Error listing auth users:', authError.message);
  } else {
    const adminAuthUsers = authUser.users.filter(u => 
      u.email === 'reyeskaze10@gmail.com' || 
      u.email === 'timothydivine9@gmail.com'
    );
    
    console.log('\n\n📊 Admin emails in auth.users:');
    if (adminAuthUsers.length === 0) {
      console.log('   No admin emails found in auth');
    } else {
      adminAuthUsers.forEach((user, index) => {
        console.log(`\n   ${index + 1}. ${user.email}`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
        console.log(`      Created: ${new Date(user.created_at).toLocaleString()}`);
      });
    }
  }
  
  console.log('\n✅ Admin scan complete\n');
}

checkAdmins().catch(console.error);
