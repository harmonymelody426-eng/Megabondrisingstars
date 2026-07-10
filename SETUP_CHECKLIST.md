# 🚀 MEGABOND Supabase Setup - Interactive Checklist

## Your Project: megabond-rising-stars ✅

Follow this checklist step-by-step. Mark each as complete when done.

---

## ✅ STEP 1: Get Your API Credentials (2 minutes)

### Do This:
1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Find your project "megabond-rising-stars"
   - Click to open it

2. **Navigate to API Settings**
   - Left sidebar > Click **Settings**
   - Click **API** tab
   - You'll see a page with blue boxes containing your credentials

3. **Copy These Two Values** (you'll need them in Step 5)
   ```
   📋 PROJECT URL: https://xxxxx.supabase.co
   🔑 ANON PUBLIC KEY: eyJhbGciOiJIUzI1Ni...
   ```
   - Click the copy icon next to each
   - Save them in a text file temporarily

### ✅ Mark Complete When:
- [ ] You can see your Project URL
- [ ] You can see your Anon Public Key

---

## ✅ STEP 2: Create Database Tables (3 minutes)

### Do This:
1. **Open SQL Editor**
   - In Supabase dashboard > Click **SQL Editor** (left sidebar)
   - Click **New Query** button (top-right)

2. **Paste This SQL Code**
   - Copy the entire code block below
   - Paste into the SQL editor

```sql
-- Create Students Table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  avatar TEXT,
  stars INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create Transactions/History Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('achievement', 'penalty')),
  stars INTEGER NOT NULL CHECK (stars > 0),
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_student_id ON transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_students_stars ON students(stars DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Insert sample data
INSERT INTO students (name, avatar, stars) VALUES
  ('Ahmad Fauzi', 'https://picsum.photos/seed/ahmad/150/150', 28),
  ('Citra Lestari', 'https://picsum.photos/seed/citra/150/150', 23),
  ('Fajar Nugraha', 'https://picsum.photos/seed/fajar/150/150', 14),
  ('Budi Santoso', 'https://picsum.photos/seed/budi/150/150', 12),
  ('Dian Wahyuni', 'https://picsum.photos/seed/dian/150/150', 9),
  ('Gilang Permana', 'https://picsum.photos/seed/gilang/150/150', 8),
  ('Hani Fatimah', 'https://picsum.photos/seed/hani/150/150', 5),
  ('Irfan Hakim', 'https://picsum.photos/seed/irfan/150/150', 3)
ON CONFLICT DO NOTHING;

-- Insert sample transaction history
INSERT INTO transactions (student_id, type, stars, description) 
SELECT id, 'achievement', 20, 'Juara 1 Lomba Cerdas Cermat Nasional' FROM students WHERE name = 'Ahmad Fauzi'
ON CONFLICT DO NOTHING;

INSERT INTO transactions (student_id, type, stars, description)
SELECT id, 'achievement', 10, 'Meraih skor sempurna dalam Ujian Tengah Semester' FROM students WHERE name = 'Ahmad Fauzi'
ON CONFLICT DO NOTHING;

INSERT INTO transactions (student_id, type, stars, description)
SELECT id, 'penalty', 2, 'Terlambat masuk kelas tanpa konfirmasi' FROM students WHERE name = 'Ahmad Fauzi'
ON CONFLICT DO NOTHING;
```

3. **Run the SQL**
   - Click the blue **RUN** button (▶️ icon, top-right)
   - Wait for it to complete

4. **Success Message**
   - You should see: "Success - 8 rows inserted" or similar
   - If error, take a screenshot and share it

### ✅ Mark Complete When:
- [ ] SQL code has been pasted
- [ ] RUN button was clicked
- [ ] You see a success message

---

## ✅ STEP 3: Create Storage Bucket (2 minutes)

### Do This:
1. **Open Storage**
   - Left sidebar > Click **Storage**

2. **Create New Bucket**
   - Click **New Bucket** button (blue)
   - Name: `avatars`
   - **IMPORTANT:** Uncheck the box that says "Private bucket"
   - Click **Create bucket** button

3. **Verify**
   - You should see a bucket called "avatars"
   - It should have a public icon (not a lock)

### ✅ Mark Complete When:
- [ ] "avatars" bucket created
- [ ] Bucket is PUBLIC (not private)
- [ ] You can see it in Storage list

---

## ✅ STEP 4: Create `.env.local` File (3 minutes)

### Do This:
1. **Navigate to Your Project Folder**
   - Open your project folder where `index.html` is located
   - This is the root folder of your project

2. **Create New File**
   - Right-click in the folder
   - Create a new file named: `.env.local` (exactly this name!)

3. **Edit the File**
   - Open `.env.local` in a text editor
   - Copy & paste this:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_URL.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

4. **Replace with YOUR Credentials**
   - Replace `YOUR_PROJECT_URL` with the Project URL from Step 1
   - Replace `YOUR_ANON_KEY_HERE` with the Anon Public Key from Step 1
   - **Example (don't use this!):**
     ```env
     VITE_SUPABASE_URL=https://abcdefg12345.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

5. **Save the File**
   - Press Ctrl+S (or Cmd+S on Mac)
   - Make sure the file is saved

### ✅ Mark Complete When:
- [ ] `.env.local` file exists in project root
- [ ] Your credentials are pasted correctly
- [ ] File is saved

---

## ✅ STEP 5: Install Package (1 minute)

### Do This:
1. **Open Terminal/Command Prompt**
   - In your project folder
   - Type this command:

```bash
npm install @supabase/supabase-js
```

2. **Wait for Installation**
   - It will download and install the Supabase package
   - You'll see progress messages
   - When done, you'll see: `added X packages`

### ✅ Mark Complete When:
- [ ] Command finished running
- [ ] You see "added X packages"

---

## ✅ STEP 6: Test Your App (2 minutes)

### Do This:
1. **Open Your App**
   - Option A: Open `index.html` directly in your browser
   - Option B: Run `npm run dev` in terminal (if you have a dev server)

2. **Check the Status Indicator**
   - Look at the **top-right corner** of the app
   - You should see a green dot and text saying: **"Database Connected"**
   - If it says "Database Offline" (red), something went wrong

3. **Verify Students Load**
   - You should see 8 students in the leaderboard:
     - Ahmad Fauzi (28 stars)
     - Citra Lestari (23 stars)
     - Fajar Nugraha (14 stars)
     - etc.

### ✅ Mark Complete When:
- [ ] App opens without errors
- [ ] Status shows "Database Connected" (green)
- [ ] 8 students appear in leaderboard
- [ ] Top 3 podium shows students

---

## ✅ STEP 7: Test Features (3 minutes)

### Test Admin Features:
1. **Enter Admin Mode**
   - Click **Mode Admin** button (top)
   - Enter password: `megabond123`
   - Click OK

2. **Test Add Student**
   - Click **"Tambah Siswa Baru"** button
   - Enter name: "Test Student"
   - Enter stars: 5
   - Click **"Simpan Siswa"**
   - Should appear in leaderboard

3. **Test Achievement**
   - Click **"Kelola Prestasi / Penalti"** button
   - Select "Test Student"
   - Click **"Prestasi (Tambah)"** button
   - Enter stars: 3
   - Enter description: "Test achievement"
   - Click **"Proses Perubahan"**
   - Student's stars should increase to 8

### ✅ Mark Complete When:
- [ ] Admin password works
- [ ] Can add students
- [ ] Can add achievements
- [ ] Stars update correctly

---

## 🎉 You're Done! Summary:

```
✅ Step 1: Got API Credentials
✅ Step 2: Created Database Tables
✅ Step 3: Created Storage Bucket
✅ Step 4: Created .env.local File
✅ Step 5: Installed Package
✅ Step 6: Tested App
✅ Step 7: Tested Features
```

---

## 🆘 Troubleshooting

### Problem: "Database Offline" (Red indicator)
**Solutions:**
1. Check `.env.local` file exists
2. Check credentials are correct (copy from Supabase again)
3. Check no extra spaces or quotes
4. Refresh the page
5. Check internet connection

### Problem: Students don't show up
**Solutions:**
1. Check SQL ran successfully
2. Go to Supabase > Table Editor
3. Click "students" table
4. Should see 8 rows

### Problem: Can't create `.env.local`
**Solutions:**
1. Use text editor (Notepad, VS Code, etc)
2. Make sure filename is exactly `.env.local`
3. Save in project root (where index.html is)
4. On Mac: You may need to press Cmd+Shift+. to show hidden files

### Problem: Admin password doesn't work
**Solutions:**
1. Password is: `megabond123`
2. Make sure no extra spaces
3. Check Caps Lock is OFF

---

## 📞 Need Help?

1. **Screenshot errors** - Share browser console (F12 > Console tab)
2. **Share error message** - Copy and paste the exact error
3. **Verify steps** - Go back and check each step completed

---

## 🎓 Next Steps After Setup:

Once everything works:
1. Customize student list with real names
2. Add more achievements
3. Deploy to the internet (Netlify, Vercel)
4. Share with your school

---

**Version: 3.0 Supabase Edition**  
**Last Updated: 2026-07-10**
