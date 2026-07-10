// Supabase Client Library
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Initialize Supabase Client dengan URL & Key Asli
const SUPABASE_URL = 'https://cprpizbcfvmwnumhkkwh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcnBpemJjZnZtd251bWhra3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2Nzg3MjIsImV4cCI6MjA5OTI1NDcyMn0.teTEiRY0wA4FKrEN3xGYW8kZ79UTt3y4_m-XNpXGgWo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// STUDENT OPERATIONS
// ============================================

// Fetch all students from Supabase
export async function fetchStudents() {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('stars', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching students:', error.message);
    return [];
  }
}

// Fetch single student with transactions
export async function fetchStudentWithHistory(studentId) {
  try {
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();
    
    if (studentError) throw studentError;

    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    
    if (transError) throw transError;

    return { ...student, history: transactions || [] };
  } catch (error) {
    console.error('Error fetching student:', error.message);
    return null;
  }
}

// Add new student
export async function addStudent(name, stars = 0, avatar = null) {
  try {
    const { data, error } = await supabase
      .from('students')
      .insert([{ name, stars, avatar }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding student:', error.message);
    return null;
  }
}

// Update student stars
export async function updateStudentStars(studentId, newStarCount) {
  try {
    const { data, error } = await supabase
      .from('students')
      .update({ stars: newStarCount, updated_at: new Date() })
      .eq('id', studentId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating stars:', error.message);
    return null;
  }
}

// Update student avatar
export async function updateStudentAvatar(studentId, avatarURL) {
  try {
    const { data, error } = await supabase
      .from('students')
      .update({ avatar: avatarURL, updated_at: new Date() })
      .eq('id', studentId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating avatar:', error.message);
    return null;
  }
}

// Delete student
export async function deleteStudent(studentId) {
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting student:', error.message);
    return false;
  }
}

// ============================================
// TRANSACTION OPERATIONS
// ============================================

// Add achievement or penalty transaction
export async function addTransaction(studentId, type, stars, description) {
  try {
    // Insert transaction
    const { data: transaction, error: transError } = await supabase
      .from('transactions')
      .insert([{ student_id: studentId, type, stars, description }])
      .select()
      .single();
    
    if (transError) throw transError;

    // Get current student stars
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('stars')
      .eq('id', studentId)
      .single();
    
    if (studentError) throw studentError;

    // Update student total stars
    const newStars = type === 'achievement' 
      ? student.stars + stars 
      : Math.max(0, student.stars - stars);

    await updateStudentStars(studentId, newStars);

    return transaction;
  } catch (error) {
    console.error('Error adding transaction:', error.message);
    return null;
  }
}

// Fetch all transactions for a student
export async function fetchStudentTransactions(studentId) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching transactions:', error.message);
    return [];
  }
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

// Subscribe to student changes
export function subscribeToStudents(callback) {
  const subscription = supabase
    .channel('students')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'students' },
      (payload) => {
        console.log('Student change:', payload);
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
}

// Subscribe to transaction changes
export function subscribeToTransactions(callback) {
  const subscription = supabase
    .channel('transactions')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'transactions' },
      (payload) => {
        console.log('Transaction change:', payload);
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
}

// ============================================
// STORAGE OPERATIONS (for avatars)
// ============================================

// Upload avatar image
export async function uploadAvatar(studentId, file) {
  try {
    const fileName = `${studentId}-${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });
    
    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error.message);
    return null;
  }
}

export { supabase };
