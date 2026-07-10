// 1. Konfigurasi & Inisialisasi Supabase
const SUPABASE_URL = 'https://cprpizbcfvmwnumhkkwh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcnBpemJjZnZtd251bWhra3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2Nzg3MjIsImV4cCI6MjA5OTI1NDcyMn0.teTEiRY0wA4FKrEN3xGYW8kZ79UTt3y4_m-XNpXGgWo';

// Pastikan library Supabase dari CDN sudah terbaca
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Fungsi Mengambil & Mengurutkan Data Ranking (Live Sorting)
async function ambilDanTampilkanRanking() {
    // Mengambil data dari tabel bernama 'students' atau 'leaderboard' 
    // (Sesuaikan nama tabelmu di Supabase, contoh di bawah ini menggunakan asumsi nama tabel 'students')
    const { data: siswa, error } = await supabase
        .from('students') 
        .select('*')
        .order('stars', { ascending: false }); // Diurutkan berdasarkan bintang terbanyak

    if (error) {
        console.error('Gagal mengambil data ranking:', error);
        return;
    }

    console.log('Data ranking terbaru:', siswa);

    // --- LOGIKA MEMASUKKAN DATA KE HTML PODIUM & KLASEMEN ---
    
    // 1. Update Podium Juara 1, 2, 3 jika datanya tersedia
    if (siswa.length >= 1) {
        const p1 = document.querySelector('.podium-card.rank-1');
        if (p1) {
            p1.querySelector('h3').innerText = siswa[0].name || siswa[0].nama;
            p1.querySelector('.stars-count').innerText = siswa[0].stars || siswa[0].skor;
        }
    }
    if (siswa.length >= 2) {
        const p2 = document.querySelector('.podium-card.rank-2');
        if (p2) {
            p2.querySelector('h3').innerText = siswa[1].name || siswa[1].nama;
            p2.querySelector('.stars-count').innerText = siswa[1].stars || siswa[1].skor;
        }
    }
    if (siswa.length >= 3) {
        const p3 = document.querySelector('.podium-card.rank-3');
        if (p3) {
            p3.querySelector('h3').innerText = siswa[2].name || siswa[2].nama;
            p3.querySelector('.stars-count').innerText = siswa[2].stars || siswa[2].skor;
        }
    }

    // 2. Update Daftar Klasemen Umum
    const leaderboardContainer = document.getElementById('leaderboard-list') || document.querySelector('.leaderboard-section');
    if (leaderboardContainer && siswa.length > 0) {
        // Hapus tulisan "Loading leaderboard..." terlebih dahulu
        leaderboardContainer.innerHTML = ''; 

        // Tampilkan semua siswa ke dalam list klasemen
        siswa.forEach((dataSiswa, index) => {
            const nama = dataSiswa.name || dataSiswa.nama;
            const bintang = dataSiswa.stars || dataSiswa.skor;
            
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            row.innerHTML = `
                <span class="rank-number">#${index + 1}</span>
                <span class="student-name">${nama}</span>
                <span class="student-stars">${bintang} Bintang</span>
            `;
            leaderboardContainer.appendChild(row);
        });
    }
}

// 3. Fungsi Menyimpan/Menambah Siswa Baru ke Supabase
async function simpanSkorKeDatabase(namaUser, skorUser) {
    const { data, error } = await supabase
        .from('students') // Sesuaikan dengan nama tabelmu
        .insert([{ name: namaUser, stars: skorUser }]);

    if (error) {
        console.error('Gagal menyimpan data:', error);
    } else {
        console.log('Data berhasil disimpan!');
        ambilDanTampilkanRanking(); // Otomatis refresh tampilan ranking
    }
}

// Jalankan fungsi saat halaman web selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
    ambilDanTampilkanRanking();
});
