const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data: roles } = await supabase
    .from('roles')
    .select('name, description, permissions')
    .order('name');

  console.log('\n✅ Final Role Structure:\n');
  
  roles.forEach(role => {
    console.log(`📍 ${role.name.toUpperCase()}`);
    console.log(`   Description: ${role.description}`);
    console.log(`   Permissions: ${role.permissions.length > 0 ? role.permissions.join(', ') : 'None (basic access)'}`);
    console.log('');
  });
})();
