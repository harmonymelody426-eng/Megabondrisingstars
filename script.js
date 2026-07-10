// 1. Konfigurasi & Inisialisasi Supabase (Pakai URL & Key milikmu)
const SUPABASE_URL = 'https://cprpizbcfvmwnumhkkwh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcnBpemJjZnZtd251bWhra3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2Nzg3MjIsImV4cCI6MjA5OTI1NDcyMn0.teTEiRY0wA4FKrEN3xGYW8kZ79UTt3y4_m-XNpXGgWo';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Kode Bawaanmu (Fungsi Ganti Warna Background)
document.getElementById("changeColorButton").addEventListener("click", () => {
    const colors = ["#FF5733", "#33FF57", "#3357FF", "#E91E63", "#9C27B0"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    document.body.style.backgroundColor = randomColor;
});

// 3. Fungsi Tambahan untuk Menyimpan Skor/Input ke Supabase
async function simpanSkor keDatabase(namaUser, skorUser) {
    const { data, error } = await supabase
        .from('leaderboard') // Pastikan nama tabel di Supabase sama persis
        .insert([{ nama: namaUser, skor: skorUser }]);

    if (error) {
        console.error('Gagal menyimpan data:', error);
    } else {
        console.log('Data berhasil disimpan!', data);
        ambilDanTampilkanRanking(); // Refresh tampilan ranking setelah input data
    }
}

// 4. Fungsi Tambahan untuk Mengambil & Mengurutkan Data Ranking (Live Sorting)
async function ambilDanTampilkanRanking() {
    const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('skor', { ascending: false }); // Mengurutkan dari skor tertinggi

    if (error) {
        console.error('Gagal mengambil data ranking:', error);
    } else {
        console.log('Data ranking terbaru:', data);
        // Di sini kamu tinggal menulis logika untuk menampilkan data tersebut ke dalam HTML-mu
    }
}

// Jalankan fungsi ambil ranking pertama kali saat halaman web dibuka
window.onload = ambilDanTampilkanRanking;
