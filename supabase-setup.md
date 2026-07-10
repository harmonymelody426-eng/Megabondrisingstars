# Supabase Integration Guide

## Step 1: Create Supabase Account & Project
1. Go to https://supabase.com
2. Sign up with your email
3. Create a new project (name it "megabond-rising-stars")
4. Set a strong database password
5. Wait for the project to be created

## Step 2: Get Your Credentials
In your Supabase project dashboard:
1. Go to **Settings > API**
2. Copy your:
   - **Project URL** (anon public URL)
   - **Project API Key** (anon key)

## Step 3: Create Database Tables
1. Go to **SQL Editor**
2. Copy and paste the SQL from `supabase-schema.sql`
3. Execute the query

## Step 4: Enable Row Level Security (Optional but Recommended)
1. Go to each table
2. Enable RLS policies for production security

## Step 5: Configure Environment
Create a `.env.local` file:
```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Step 6: Install Supabase Client
```bash
npm install @supabase/supabase-js
```

## Step 7: Update Your App
Replace localStorage calls with Supabase functions (see `supabase-client.js`)

## Troubleshooting
- **CORS Error**: Check Supabase settings > Authentication > URL Configuration
- **Connection Refused**: Verify your project URL is correct
- **Timeout**: Check your database is running in Supabase dashboard
