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
