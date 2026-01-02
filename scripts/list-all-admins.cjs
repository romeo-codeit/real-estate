const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('\n📊 All admins in database:\n');
  
  const { data: admins, error } = await svc
    .from('users')
    .select('email, role, first_name, last_name')
    .eq('role', 'admin');
  
  if (error) {
    console.log('Error:', error.message);
  } else {
    if (admins && admins.length > 0) {
      admins.forEach((admin, i) => {
        console.log(`${i + 1}. ${admin.first_name} ${admin.last_name} (${admin.email}) - Role: ${admin.role}`);
      });
    } else {
      console.log('No admins found');
    }
  }
})();
