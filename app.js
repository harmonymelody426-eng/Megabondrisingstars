import { supabase } from './supabase-client.js';

// Variabel untuk menyimpan data role aktif (default: user/siswa)
let currentRole = 'user';

// =======================================================
// 1. FUNGSI UTAMA: AMBIL DATA & TAMPILKAN RANKING
// =======================================================
async function ambilDanTampilkanRanking() {
    const statusText = document.getElementById('dbStatusText');
    const statusIndicator = document.getElementById('dbStatusIndicator');

    try {
        const { data: siswa, error } = await supabase
            .from('students')
            .select('*')
            .order('stars', { ascending: false });

        if (error) throw error;

        if (statusText) statusText.innerText = 'Connected';
        if (statusIndicator) statusIndicator.className = 'w-2 h-2 rounded-full bg-emerald-500';

        console.log('Data Siswa Berhasil Diambil:', siswa);

        // --- UPDATE PODIUM JUARA 1, 2, 3 ---
        if (siswa && siswa.length >= 1) {
            document.getElementById('p1-name').innerText = siswa[0].name;
            document.getElementById('p1-stars').innerText = siswa[0].stars;
            if (siswa[0].avatar) document.getElementById('p1-avatar').src = siswa[0].avatar;
        } else {
            document.getElementById('p1-name').innerText = 'Belum Ada';
        }

        if (siswa && siswa.length >= 2) {
            document.getElementById('p2-name').innerText = siswa[1].name;
            document.getElementById('p2-stars').innerText = siswa[1].stars;
            if (siswa[1].avatar) document.getElementById('p2-avatar').src = siswa[1].avatar;
        } else {
            document.getElementById('p2-name').innerText = 'Belum Ada';
        }

        if (siswa && siswa.length >= 3) {
            document.getElementById('p3-name').innerText = siswa[2].name;
            document.getElementById('p3-stars').innerText = siswa[2].stars;
            if (siswa[2].avatar) document.getElementById('p3-avatar').src = siswa[2].avatar;
        } else {
            document.getElementById('p3-name').innerText = 'Belum Ada';
        }

        // --- UPDATE RUNNER UP RANK 4 & 5 ---
        if (siswa && siswa.length >= 4) {
            document.getElementById('p4-name').innerText = siswa[3].name;
            document.getElementById('p4-stars').innerText = siswa[3].stars;
        } else {
            document.getElementById('p4-name').innerText = '-';
        }
        if (siswa && siswa.length >= 5) {
            document.getElementById('p5-name').innerText = siswa[4].name;
            document.getElementById('p5-stars').innerText = siswa[4].stars;
        } else {
            document.getElementById('p5-name').innerText = '-';
        }

        // --- UPDATE KLASEMEN UMUM (RANK 6+) ---
        const leaderboardList = document.getElementById('leaderboardList');
        if (leaderboardList) {
            leaderboardList.innerHTML = '';
            if (siswa.length === 0) {
                leaderboardList.innerHTML = `<p class="text-xs text-slate-500 text-center py-4">Database kosong. Silakan masuk Mode Admin untuk menambah siswa.</p>`;
            } else {
                siswa.forEach((itemSiswa, index) => {
                    const row = document.createElement('div');
                    row.className = 'leaderboard-item flex justify-between items-center bg-slate-900/40 border border-slate-800/60 p-3 rounded-xl';
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
        }

        // Update selector pilihan siswa di modal transaksi admin
        const selectSiswa = document.getElementById('transactionStudentSelect');
        if (selectSiswa) {
            selectSiswa.innerHTML = '<option value="">-- Pilih Siswa --</option>';
            siswa.forEach(itemSiswa => {
                const opt = document.createElement('option');
                opt.value = itemSiswa.id;
                opt.innerText = itemSiswa.name;
                selectSiswa.appendChild(opt);
            });
        }

    } catch (err) {
        console.error('Koneksi Gagal:', err.message);
        if (statusText) statusText.innerText = 'Error Connection';
        if (statusIndicator) statusIndicator.className = 'w-2 h-2 rounded-full bg-rose-500';
    }
}

// =======================================================
// 2. FUNGSI PENGATUR MODE (USER / ADMIN)
// =======================================================
window.setRole = function(role) {
    currentRole = role;
    const btnUser = document.getElementById('btnRoleUser');
    const btnAdmin = document.getElementById('btnRoleAdmin');
    const adminPanel = document.getElementById('adminPanel');

    if (role === 'admin') {
        // Nyalakan gaya tombol Admin Aktif
        btnAdmin.className = "px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 bg-brand-600 text-white shadow-md";
        btnUser.className = "px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 text-purple-300 hover:text-white";
        // Tampilkan panel kontrol admin
        if (adminPanel) adminPanel.classList.remove('hidden');
    } else {
        // Nyalakan gaya tombol Siswa Aktif
        btnUser.className = "px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 bg-brand-600 text-white shadow-md";
        btnAdmin.className = "px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 text-purple-300 hover:text-white";
        // Sembunyikan panel kontrol admin
        if (adminPanel) adminPanel.classList.add('hidden');
    }
}

// =======================================================
// 3. FUNGSI MODAL DI PANEL ADMIN
// =======================================================
window.openAddStudentModal = function() {
    document.getElementById('addStudentModal').classList.remove('hidden');
}
window.closeAddStudentModal = function() {
    document.getElementById('addStudentModal').classList.add('hidden');
}
window.openTransactionModal = function() {
    document.getElementById('transactionModal').classList.remove('hidden');
}
window.closeTransactionModal = function() {
    document.getElementById('transactionModal').classList.add('hidden');
}

// =======================================================
// 4. FUNGSI PROSES SIMPAN DATA KE SUPABASE
// =======================================================
window.handleAddStudent = async function(event) {
    event.preventDefault();
    const namaSiswa = document.getElementById('newStudentName').value;
    const bintangAwal = parseInt(document.getElementById('newStudentStars').value) || 0;

    try {
        const { error } = await supabase
            .from('students')
            .insert([{ name: namaSiswa, stars: bintangAwal }]);

        if (error) throw error;

        alert(`Siswa bernama ${namaSiswa} berhasil ditambahkan!`);
        document.getElementById('addStudentForm').reset();
        closeAddStudentModal();
        
        // Refresh data tampilan papan ranking
        ambilDanTampilkanRanking();
    } catch (err) {
        alert('Gagal menambah siswa: ' + err.message);
    }
}

// Inisialisasi awal saat halaman dibuka browser
document.addEventListener('DOMContentLoaded', () => {
    ambilDanTampilkanRanking();
});
