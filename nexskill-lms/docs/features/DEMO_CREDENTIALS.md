# Demo Credentials - NexSkill LMS

This document lists all the pre-configured demo accounts for testing different user roles in the NexSkill LMS.

---

## 🔐 How to Use

1. Navigate to the login page at `/auth/login`
2. Select a role from the dropdown
3. Credentials will auto-fill automatically
4. Click **Sign In** to access that role's dashboard

**Note:** All credentials are automatically populated when you select a role. No manual entry required!

---

## 👥 Demo Accounts

All demo accounts use the password: **`demo1234`**

### 1. Student Account
- **Name:** Alex Doe
- **Email:** alex.doe@nexskill.demo
- **Password:** demo1234
- **Access:** Student dashboard, course catalog, learning features

### 2. Coach Account
- **Name:** Jordan Doe
- **Email:** jordan.doe@nexskill.demo
- **Password:** demo1234
- **Access:** Coach dashboard, course builder, student management

### 3. Admin Account
- **Name:** Morgan Doe
- **Email:** morgan.doe@nexskill.demo
- **Password:** demo1234
- **Access:** Admin panel, user management, financial controls, analytics

### 4. Platform Owner Account
- **Name:** Taylor Doe
- **Email:** taylor.doe@nexskill.demo
- **Password:** demo1234
- **Access:** System-wide settings, billing, user roles, platform analytics

### 5. Sub-Coach Account
- **Name:** Casey Doe
- **Email:** casey.doe@nexskill.demo
- **Password:** demo1234
- **Access:** Limited coaching features, student support, moderation

### 6. Content Editor Account
- **Name:** Riley Doe
- **Email:** riley.doe@nexskill.demo
- **Password:** demo1234
- **Access:** Content review queue, resource library, content suggestions

### 7. Community Manager Account
- **Name:** Jamie Doe
- **Email:** jamie.doe@nexskill.demo
- **Password:** demo1234
- **Access:** Community moderation, group management, engagement metrics

### 8. Support Staff Account
- **Name:** Avery Doe
- **Email:** avery.doe@nexskill.demo
- **Password:** demo1234
- **Access:** Support tickets, knowledge base, student lookup, tech status

### 9. Organization Owner Account
- **Name:** Quinn Doe
- **Email:** quinn.doe@nexskill.demo
- **Password:** demo1234
- **Access:** Organization management, team members, billing, branding

---

## 🎭 Character Reference

All demo users share the surname **"Doe"** for easy identification:

| First Name | Role | Icon |
|------------|------|------|
| Alex | Student | 🎓 |
| Jordan | Coach | 👨‍🏫 |
| Morgan | Admin | 🛡️ |
| Taylor | Platform Owner | 🏢 |
| Casey | Sub-Coach | 🎯 |
| Riley | Content Editor | 📝 |
| Jamie | Community Manager | 👥 |
| Avery | Support Staff | 🆘 |
| Quinn | Organization Owner | 🏛️ |

---

## 🚀 Quick Login

The login system includes:

✅ **Auto-fill on role selection** - Credentials populate automatically
✅ **No validation required** - This is a mock authentication system
✅ **Instant access** - Click Sign In and you're in
✅ **Role switching** - Change roles anytime to test different features

---

## 💡 Tips for Testing

### Testing Different Roles
1. Start with the **Student** role to see the learner experience
2. Switch to **Coach** to see course creation tools
3. Try **Admin** for platform management features
4. Test **Platform Owner** for system-wide controls

### Switching Between Roles
- You can switch roles anytime from the developer panel (Platform Owner dashboard)
- Or simply log out and select a different role at login

### Testing Features
- Each role has a unique dashboard with role-specific navigation
- All UI features are complete and responsive
- Backend integration is pending (currently using mock data)

---

## 🔒 Security Note

**Important:** These are demo credentials for a development/testing environment only. 

- Do NOT use these in production
- Real authentication will be implemented with Supabase
- Passwords will be properly hashed and secured
- Email verification will be required
- 2FA will be available for admin roles

---

## 🛠️ Implementation Details

### Code Location
Demo credentials are defined in:
```
src/pages/auth/Login.tsx
```

### Data Structure
```typescript
const dummyCredentials: Record<UserRole, {
  name: string;
  email: string;
  password: string;
}> = {
  STUDENT: {
    name: 'Alex Doe',
    email: 'alex.doe@nexskill.demo',
    password: 'demo1234',
  },
  // ... other roles
};
```

### Auto-fill Mechanism
```typescript
useEffect(() => {
  const credentials = dummyCredentials[selectedRole];
  setFormData(prev => ({
    ...prev,
    name: credentials.name,
    email: credentials.email,
    password: credentials.password,
  }));
}, [selectedRole]);
```

---

## 📞 Support

For questions about demo accounts or role access:
- Check the [Role-Based Documentation](./README.md)
- Review the [Main README](../README.md)
- See individual role docs for feature details

---

**Last Updated:** December 10, 2025
