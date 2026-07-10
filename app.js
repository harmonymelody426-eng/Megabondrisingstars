import { supabase } from './supabase-client.js';

// ============================================
// FUNGSI UTAMA: TAMPILKAN RANKING & KLASEMEN
// ============================================
async function ambilDanTampilkanRanking() {
    const statusText = document.getElementById('dbStatusText');
    const statusIndicator = document.getElementById('dbStatusIndicator');

    try {
        // Ambil data dari tabel 'students' diurutkan berdasarkan bintang ('stars') terbanyak
        const { data: siswa, error } = await supabase
            .from('students')
            .select('*')
            .order('stars', { ascending: false });

        if (error) throw error;

        // Update Indikator Koneksi Database di Header
        if (statusText) statusText.innerText = 'Connected';
        if (statusIndicator) {
            statusIndicator.className = 'w-2 h-2 rounded-full bg-emerald-500';
        }

        console.log('Data Siswa Berhasil Diambil:', siswa);

        // --- RENDER PODIUM UTAMA (JUARA 1, 2, 3) ---
        if (siswa && siswa.length >= 1) {
            document.getElementById('p1-name').innerText = siswa[0].name || 'Tanpa Nama';
            document.getElementById('p1-stars').innerText = siswa[0].stars || 0;
            if (siswa[0].avatar) document.getElementById('p1-avatar').src = siswa[0].avatar;
        }
        if (siswa && siswa.length >= 2) {
            document.getElementById('p2-name').innerText = siswa[1].name || 'Tanpa Nama';
            document.getElementById('p2-stars').innerText = siswa[1].stars || 0;
            if (siswa[1].avatar) document.getElementById('p2-avatar').src = siswa[1].avatar;
        }
        if (siswa && siswa.length >= 3) {
            document.getElementById('p3-name').innerText = siswa[2].name || 'Tanpa Nama';
            document.getElementById('p3-stars').innerText = siswa[2].stars || 0;
            if (siswa[2].avatar) document.getElementById('p3-avatar').src = siswa[2].avatar;
        }

        // --- RENDER RUNNER UP (RANK 4 & 5) ---
        if (siswa && siswa.length >= 4) {
            document.getElementById('p4-name').innerText = siswa[3].name || 'Tanpa Nama';
            document.getElementById('p4-stars').innerText = siswa[3].stars || 0;
            if (siswa[3].avatar) document.getElementById('p4-avatar').src = siswa[3].avatar;
        }
        if (siswa && siswa.length >= 5) {
            document.getElementById('p5-name').innerText = siswa[4].name || 'Tanpa Nama';
            document.getElementById('p5-stars').innerText = siswa[4].stars || 0;
            if (siswa[4].avatar) document.getElementById('p5-avatar').src = siswa[4].avatar;
        }

        // --- RENDER KLASEMEN UMUM (SEMUA SISWA) ---
        const leaderboardList = document.getElementById('leaderboardList');
        if (leaderboardList) {
            leaderboardList.innerHTML = ''; // Menghilangkan spinner loading awal

            if (siswa.length === 0) {
                leaderboardList.innerHTML = `<p class="text-xs text-slate-500 text-center py-4">Belum ada data siswa.</p>`;
            } else {
                siswa.forEach((itemSiswa, index) => {
                    const row = document.createElement('div');
                    row.className = 'leaderboard-item flex justify-between items-center bg-slate-900/40 border border-slate-800/60 p-3 rounded-xl hover:border-purple-500/30 transition-all';
                    row.innerHTML = `
                        <div class="flex items-center gap-3">
                            <span class="font-bold text-xs text-slate-500 w-5">#${index + 1}</span>
                            <img src="${itemSiswa.avatar || 'https://picsum.photos/seed/' + index + '/100/100'}" class="w-8 h-8 rounded-full object-cover border border-slate-700">
                            <span class="text-xs font-semibold text-slate-200">${itemSiswa.name}</span>
                        </div>
                        <div class="text-yellow-400 font-bold text-xs">
                            <i class="fa-solid fa-star"></i> ${itemSiswa.stars || 0}
                        </div>
                    `;
                    leaderboardList.appendChild(row);
                });
            }
        }

    } catch (err) {
        console.error('Koneksi Gagal:', err.message);
        if (statusText) statusText.innerText = 'Error Connection';
        if (statusIndicator) statusIndicator.className = 'w-2 h-2 rounded-full bg-rose-500';
    }
}

// Jalankan fungsi otomatis saat halaman web selesai dimuat browser
document.addEventListener('DOMContentLoaded', () => {
    ambilDanTampilkanRanking();
});
