# 🌟 MEGABOND Rising Stars - Supabase Integration Guide

A gamified student leaderboard system with **real-time database synchronization** using Supabase. Track student achievements, manage rankings, and save all data persistently in the cloud.

## 📋 What's New in Version 3.0

✅ **Supabase Database Integration** - Replace localStorage with persistent cloud storage  
✅ **Real-time Synchronization** - Live updates across all browser tabs  
✅ **Cloud Storage for Avatars** - Upload and manage student profile pictures  
✅ **Transaction History** - Track all achievements and penalties in the database  
✅ **Database Connection Status** - Visual indicator showing database connectivity  

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with email or GitHub
4. Create a new project (name it `megabond-rising-stars`)
5. Set a strong database password
6. Wait for project initialization (~2 minutes)

### Step 2: Get Your Credentials
Once your project is ready:
1. Go to **Settings > API** (left sidebar)
2. Copy these two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public API key** (looks like `eyJhbG...`)
3. Save them in a safe place

### Step 3: Set Up Database Tables
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire content from `supabase-schema.sql`
4. Paste it into the SQL editor
5. Click **Run** button
6. Wait for success message

### Step 4: Enable Storage Bucket (for avatar uploads)
1. Go to **Storage** (left sidebar)
2. Click **New Bucket**
3. Name it: `avatars`
4. Uncheck "Private bucket" (make it public)
5. Click **Create bucket**

### Step 5: Configure Your App
Create a `.env.local` file in your project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace with your actual credentials from Step 2.

### Step 6: Install Dependencies
```bash
npm install @supabase/supabase-js
```

### Step 7: Run the App
```bash
npm run dev
# or simply open index.html in your browser
```

---

## 📁 Project Structure

```
megabond-rising-stars/
├── index.html              # Main UI (Tailwind CSS + Font Awesome)
├── app.js                  # Application logic & state management
├── supabase-client.js      # Supabase database operations
├── supabase-schema.sql     # Database schema & initial data
├── supabase-setup.md       # Detailed setup guide
├── style.css               # Legacy styles (kept for compatibility)
└── script.js               # Legacy scripts (kept for compatibility)
```

---

## 🔑 How It Works

### Database Architecture

**Students Table:**
```sql
- id (UUID, Primary Key)
- name (String)
- avatar (Text URL)
- stars (Integer)
- created_at (Timestamp)
- updated_at (Timestamp)
```

**Transactions Table:**
```sql
- id (UUID, Primary Key)
- student_id (UUID, Foreign Key)
- type (achievement | penalty)
- stars (Integer)
- description (Text)
- created_at (Timestamp)
```

### Real-time Features

The app automatically syncs when:
- ✨ A new achievement is added
- ⚠️ A penalty is applied
- 👤 A student is added/deleted
- 📸 An avatar is uploaded
- ⭐ Stars are updated

All connected browser tabs receive updates instantly!

---

## 🎮 Features

### Student Mode
- 👀 View live leaderboard
- 🏆 See top 3 podium rankings
- 📊 View personal stats & history
- 🔍 Search and filter students

### Admin Mode (Password: `megabond123`)
- ➕ Add new students
- ⭐ Award achievements (add stars)
- ⚠️ Apply penalties (reduce stars)
- 🗑️ Delete students
- 📸 Upload student avatars
- 🔐 Full database access

---

## 🛠️ Tier System

Stars are automatically converted to tiers:

| Tier | Stars | Icon |
|------|-------|------|
| Bintang Redup | 0-10 | ☁️ |
| Bintang Menyala | 11-30 | 🔥 |
| Bintang Kejora | 31-60 | ✨ |
| RISING STAR | 61+ | 👑 |

---

## 📝 API Functions Reference

### Fetching Data
```javascript
// Get all students sorted by stars
const students = await fetchStudents();

// Get single student with history
const student = await fetchStudentWithHistory(studentId);

// Get all transactions for a student
const history = await fetchStudentTransactions(studentId);
```

### Modifying Data
```javascript
// Add new student
await addStudent(name, starCount, avatarURL);

// Update student stars
await updateStudentStars(studentId, newStarCount);

// Add achievement or penalty
await addTransaction(studentId, 'achievement', stars, description);

// Delete student
await deleteStudent(studentId);

// Upload avatar
const publicURL = await uploadAvatar(studentId, file);
```

### Real-time Subscriptions
```javascript
// Listen for student changes
subscribeToStudents((payload) => {
  console.log('Student updated:', payload);
});

// Listen for transactions
subscribeToTransactions((payload) => {
  console.log('Transaction added:', payload);
});
```

---

## 🔒 Security & RLS (Row Level Security)

For production, enable RLS policies:

1. Go to **Authentication > Policies**
2. For `students` table:
   - Allow `SELECT` for all (public read)
   - Allow `INSERT/UPDATE/DELETE` for authenticated users only
3. For `transactions` table:
   - Allow `SELECT` for all
   - Allow `INSERT` for authenticated users only

Example policy:
```sql
-- Anyone can read
CREATE POLICY "Enable read access for all users" ON students
  FOR SELECT USING (true);

-- Only admins can modify (implement in your auth)
CREATE POLICY "Enable write access for admins" ON students
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

---

## 🚨 Troubleshooting

### Database Connection Error
**Error:** "Cannot connect to database"

**Solution:**
1. Check `.env.local` credentials are correct
2. Verify project URL ends with `.supabase.co`
3. Check your internet connection
4. Go to Supabase dashboard > Settings > API to re-verify keys

### CORS Error
**Error:** "Access to XMLHttpRequest blocked by CORS"

**Solution:**
1. Go to Supabase > Authentication > URL Configuration
2. Add your app URL to "Allowed URLs"
3. For localhost: add `http://localhost:5173`
4. For production: add your domain

### Storage Upload Fails
**Error:** "Failed to upload avatar"

**Solution:**
1. Check storage bucket "avatars" exists
2. Verify bucket is not private
3. Check file size is < 5MB
4. Ensure image format is supported (jpg, png, gif, webp)

### Real-time Updates Not Working
**Error:** "Changes appear in database but not in UI"

**Solution:**
1. Check browser console for errors
2. Verify WebSocket connection is enabled
3. Try refreshing the page
4. Check your internet connection

---

## 📚 Advanced Configuration

### Custom Database Schema
Edit `supabase-schema.sql` before running to customize:
- Add more student properties
- Add badges/achievements table
- Add notifications table
- Add audit logs

### Authentication
Implement proper user authentication:
```javascript
// Example: Add Supabase Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});
```

### Backup & Export
Export your data from Supabase:
1. Go to **SQL Editor**
2. Run: `SELECT * FROM students;`
3. Click export to download as CSV/JSON

---

## 🤝 Contributing

To extend this project:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🎓 Learning Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [PostgreSQL Basics](https://www.postgresql.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 💡 Tips & Best Practices

1. **Always backup your data** before making schema changes
2. **Test in development** before pushing to production
3. **Monitor database usage** at Supabase dashboard
4. **Use environment variables** for sensitive credentials
5. **Enable RLS** for production security
6. **Set up rate limiting** to prevent abuse
7. **Regular testing** of real-time features

---

## 📞 Support

- 📧 Email: support@megabond.local
- 💬 Issues: Create GitHub issue
- 🐛 Bug reports: Include browser console logs
- 💡 Feature requests: Describe use case

---

## 🎉 Version History

### v3.0 (Current)
- ✨ Complete Supabase integration
- 🔄 Real-time synchronization
- 📸 Cloud storage for avatars
- 📊 Transaction history tracking
- 🎨 Enhanced UI with database status

### v2.5 (Legacy)
- 💾 LocalStorage persistence
- 🎮 Gamified leaderboard
- 🏆 Tier system

---

**Made with ❤️ for MIN 3 BONDOWOSO**

Last Updated: 2026-07-10
