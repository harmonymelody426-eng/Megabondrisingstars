// 1. Ambil library Supabase murni dari CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// 2. Konfigurasi Kredensial Database
const SUPABASE_URL = 'https://cprpizbcfvmwnumhkkwh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcnBpemJjZnZtd251bWhra3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2Nzg3MjIsImV4cCI6MjA5OTI1NDcyMn0.teTEiRY0wA4FKrEN3xGYW8kZ79UTt3y4_m-XNpXGgWo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 3. Fungsi Ambil Data & Sinkronisasi Langsung ke Elemen HTML Megabond
async function ambilDanTampilkanRanking() {
    const statusText = document.getElementById('dbStatusText');
    const statusIndicator = document.getElementById('dbStatusIndicator');

    try {
        // Ambil data siswa diurutkan berdasarkan bintang terbanyak
        const { data: siswa, error } = await supabase
            .from('students')
            .select('*')
            .order('stars', { ascending: false });

        if (error) throw error;

        // Ubah Indikator Koneksi Menjadi Hijau (Berhasil)
        if (statusText) statusText.innerText = 'Connected';
        if (statusIndicator) {
            statusIndicator.className = 'w-2 h-2 rounded-full bg-emerald-500';
        }

        console.log('Data dari Supabase:', siswa);

        // --- UPDATE PODIUM JUARA 1, 2, 3 ---
        if (siswa && siswa.length >= 1) {
            document.getElementById('p1-name').innerText = siswa[0].name;
            document.getElementById('p1-stars').innerText = siswa[0].stars;
            if(siswa[0].avatar) document.getElementById('p1-avatar').src = siswa[0].avatar;
        }
        if (siswa && siswa.length >= 2) {
            document.getElementById('p2-name').innerText = siswa[1].name;
            document.getElementById('p2-stars').innerText = siswa[1].stars;
            if(siswa[1].avatar) document.getElementById('p2-avatar').src = siswa[1].avatar;
        }
        if (siswa && siswa.length >= 3) {
            document.getElementById('p3-name').innerText = siswa[2].name;
            document.getElementById('p3-stars').innerText = siswa[2].stars;
            if(siswa[2].avatar) document.getElementById('p3-avatar').src = siswa[2].avatar;
        }

        // --- UPDATE RUNNER UP RANK 4 & 5 ---
        if (siswa && siswa.length >= 4) {
            document.getElementById('p4-name').innerText = siswa[3].name;
            document.getElementById('p4-stars').innerText = siswa[3].stars;
            if(siswa[3].avatar) document.getElementById('p4-avatar').src = siswa[3].avatar;
        }
        if (siswa && siswa.length >= 5) {
            document.getElementById('p5-name').innerText = siswa[4].name;
            document.getElementById('p5-stars').innerText = siswa[4].stars;
            if(siswa[4].avatar) document.getElementById('p5-avatar').src = siswa[4].avatar;
        }

        // --- UPDATE KLASEMEN UMUM (RANK 6+) ---
        const leaderboardList = document.getElementById('leaderboardList');
        if (leaderboardList) {
            leaderboardList.innerHTML = ''; // Hapus spinner loading

            siswa.forEach((itemSiswa, index) => {
                const row = document.createElement('div');
                row.className = 'leaderboard-item flex justify-between items-center bg-slate-900/40 border border-slate-800/60 p-3 rounded-xl hover:border-purple-500/30 transition-all';
                row.innerHTML = `
                    <div class="flex items-center gap-3">
                        <span class="font-bold text-xs text-slate-500 w-5">#${index + 1}</span>
                        <img src="${itemSiswa.avatar || 'https://picsum.photos/seed/' + index + '/100/100'}" class="w-8 h-8 rounded-full object-cover">
                        <span class="text-xs font-semibold text-slate-200">${itemSiswa.name}</span>
                    </div>
                    <div class="text-yellow-400 font-bold text-xs">
                        <i class="fa-solid fa-star"></i> ${itemSiswa.stars}
                    </div>
                `;
                leaderboardList.appendChild(row);
            });
        }

    } catch (err) {
        console.error('Error Database:', err.message);
        if (statusText) statusText.innerText = 'Error Connection';
        if (statusIndicator) statusIndicator.className = 'w-2 h-2 rounded-full bg-rose-500';
    }
}

// Jalankan fungsi otomatis saat halaman Megabond dibuka
document.addEventListener('DOMContentLoaded', () => {
    ambilDanTampilkanRanking();
});
