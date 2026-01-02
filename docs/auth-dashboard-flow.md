# Authentication & Dashboard Flow Verification

## ✅ Sign Up Flow (New Users/Agents)

**Process:**
1. User fills signup form at `/signup`
2. `authService.register()` called with user details
3. Supabase `auth.signUp()` creates auth user with metadata
4. **Database trigger `handle_new_user()` automatically:**
   - Creates record in `users` table (role: 'user', permissions: [], status: 'Active')
   - Creates record in `profiles` table (full_name, email)
   - Assigns 'user' role in `user_roles` table
5. User redirected to `/login` to sign in

**✅ Fixed Issue:** Removed duplicate insert attempt from auth service - trigger handles everything!

---

## ✅ Sign In Flow

**Process:**
1. User enters credentials at `/login`
2. `authService.login()` authenticates with Supabase
3. Gets user profile from `users` table (includes role, permissions, status)
4. Checks if account is Active
5. Sets user data in global store
6. **Redirects based on role:**
   - **Admin** → `/dashboard` (admin view)
   - **User/Agent** → `/dashboard`

---

## ✅ Admin Dashboard Access

**Protected by:**
- Middleware checks authentication
- Requires admin permissions (manage_users, etc.)
- Admin layout verifies authentication state

**Admin can access (via `/dashboard` or admin routes):**
- `/dashboard` - Analytics overview (admin view)
- `/admin/users` - User management
- `/admin/properties` - Property management  
- `/admin/investments` - Investment management
- `/admin/transactions` - Transaction management
- `/admin/reports` - Reports
- `/admin/crypto` - Crypto wallets
- `/admin/agents` - Agent management
- `/admin/audit` - Audit logs

**Permissions:** All admin permissions (manage_users, manage_properties, manage_investments, manage_transactions, view_reports, manage_crypto, manage_agents, view_analytics)

---

## ✅ User/Agent Dashboard Access

**Protected by:**
- Middleware checks authentication
- No specific permissions required (empty array = authenticated only)

**Users/Agents can access:**
- `/dashboard` - Main dashboard
- `/dashboard/profile` - Profile settings
- `/dashboard/invested-properties` - Their investments
- Investment pages
- Deposit functionality
- Property browsing

**Permissions:** Empty array (basic access for now - agent same as user)

---

## 🎯 Current Role Structure

| Role  | Description | Permissions | Access Level |
|-------|-------------|-------------|--------------|
| **admin** | Full system access | manage_users, manage_properties, manage_investments, manage_transactions, view_reports, manage_crypto, manage_agents, view_analytics | Full admin dashboard + all features |
| **agent** | Agent access (same as user) | None (basic access) | User dashboard + can invest/deposit |
| **user** | Basic user access | None (basic access) | User dashboard + can invest/deposit |

---

## ✅ What Works

1. **Signup:** New users automatically get 'user' role via database trigger
2. **Login:** Proper authentication and role-based redirect
3. **Admin Dashboard:** Protected, requires admin role with full permissions
4. **User Dashboard:** Protected, requires authentication only
5. **Role Check:** Middleware validates permissions for each route
6. **Status Check:** Suspended/Banned users cannot access protected routes

---

## 🔒 Security Features

- ✅ CSRF protection middleware
- ✅ Input sanitization and validation
- ✅ Rate limiting on auth endpoints
- ✅ Row Level Security (RLS) policies
- ✅ Role-based access control (RBAC)
- ✅ Permission-based route protection
- ✅ Status-based account blocking

---

## 📝 Notes

- **Investor role removed** - only admin, agent, user remain
- **Agent = User** for now (can be expanded later with more permissions)
- **Database trigger** handles all profile creation automatically
- **Single dashboard** for users/agents, content adapts based on role
- **Separate admin dashboard** with full management features
