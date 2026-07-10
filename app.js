import { supabase } from './supabase-client.js';

// Variabel untuk menyimpan data role aktif (default: user/siswa)
let currentRole = 'user';
// Menyimpan salinan data siswa yang berhasil diambil dari database
let localStudentsData = [];

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
        
        // Simpan data siswa ke variabel lokal agar bisa dibaca oleh fungsi detail profil
        localStudentsData = siswa || [];

        // --- UPDATE PODIUM JUARA 1, 2, 3 ---
        if (siswa && siswa.length >= 1) {
            document.getElementById('p1-name').innerText = siswa[0].name;
            document.getElementById('p1-stars').innerText = siswa[0].stars;
            if (siswa[0].avatar) document.getElementById('p1-avatar').src = siswa[0].avatar;
        } else {
            document.getElementById('p1-name').innerText = 'Belum Ada';
            document.getElementById('p1-stars').innerText = '0';
        }

        if (siswa && siswa.length >= 2) {
            document.getElementById('p2-name').innerText = siswa[1].name;
            document.getElementById('p2-stars').innerText = siswa[1].stars;
            if (siswa[1].avatar) document.getElementById('p2-avatar').src = siswa[1].avatar;
        } else {
            document.getElementById('p2-name').innerText = 'Belum Ada';
            document.getElementById('p2-stars').innerText = '0';
        }

        if (siswa && siswa.length >= 3) {
            document.getElementById('p3-name').innerText = siswa[2].name;
            document.getElementById('p3-stars').innerText = siswa[2].stars;
            if (siswa[2].avatar) document.getElementById('p3-avatar').src = siswa[2].avatar;
        } else {
            document.getElementById('p3-name').innerText = 'Belum Ada';
            document.getElementById('p3-stars').innerText = '0';
        }

        // --- UPDATE RUNNER UP RANK 4 & 5 ---
        if (siswa && siswa.length >= 4) {
            document.getElementById('p4-name').innerText = siswa[3].name;
            document.getElementById('p4-stars').innerText = siswa[3].stars;
            if (siswa[3].avatar) document.getElementById('p4-avatar').src = siswa[3].avatar;
        } else {
            document.getElementById('p4-name').innerText = '-';
            document.getElementById('p4-stars').innerText = '0';
        }
        if (siswa && siswa.length >= 5) {
            document.getElementById('p5-name').innerText = siswa[4].name;
            document.getElementById('p5-stars').innerText = siswa[4].stars;
            if (siswa[4].avatar) document.getElementById('p5-avatar').src = siswa[4].avatar;
        } else {
            document.getElementById('p5-name').innerText = '-';
            document.getElementById('p5-stars').innerText = '0';
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
                    row.className = 'leaderboard-item flex justify-between items-center bg-slate-900/40 border border-slate-800/60 p-3 rounded-xl cursor-pointer hover:border-brand-500/40 transition-all';
                    // Berikan fungsi klik untuk baris klasemen umum juga
                    row.onclick = () => window.viewUserDetail(index + 1);
                    
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
// 2. FUNGSI UNTUK MELIHAT DETAIL PROFIL SISWA (YANG ERROR)
// =======================================================
window.viewUserDetail = function(rankNumber) {
    // Kurangi 1 karena array dimulai dari angka 0
    const indexSiswa = rankNumber - 1;
    const dataSiswa = localStudentsData[indexSiswa];

    if (!dataSiswa) {
        console.log("Data siswa pada peringkat ini tidak ditemukan.");
        return;
    }

    // Mengisi data ke elemen-elemen di dalam modal detail profil
    document.getElementById('modalName').innerText = dataSiswa.name;
    document.getElementById('modalRankLabel').innerText = `#${rankNumber}`;
    document.getElementById('modalTotalStarsText').innerHTML = `<i class="fa-solid fa-star"></i> ${dataSiswa.stars} Bintang`;
    
    if (dataSiswa.avatar) {
        document.getElementById('modalAvatar').src = dataSiswa.avatar;
    } else {
        document.getElementById('modalAvatar').src = 'https://picsum.photos/seed/' + indexSiswa + '/150/150';
    }

    // Mengatur Tier secara dinamis berdasarkan jumlah bintang siswa
    let tierName = "Star Beginner";
    if (dataSiswa.stars >= 50) tierName = "Star Legend";
    else if (dataSiswa.stars >= 30) tierName = "Star Diamond";
    else if (dataSiswa.stars >= 15) tierName = "Star Platinum";
    document.getElementById('modalTierName').innerText = tierName;

    // Gambar ikon bintang kecil-kecil di dalam kotak progres modal
    const starIconsContainer = document.getElementById('modalStarIcons');
    if (starIconsContainer) {
        starIconsContainer.innerHTML = '';
        // Batasi maksimal render 10 bintang agar kotak tidak kepenuhan meluap
        const jumlahBintangRender = Math.min(dataSiswa.stars, 10);
        for (let i = 0; i < jumlahBintangRender; i++) {
            starIconsContainer.innerHTML += `<i class="fa-solid fa-star text-yellow-400 text-xs animate-pulse"></i>`;
        }
        if (dataSiswa.stars > 10) {
            starIconsContainer.innerHTML += `<span class="text-xs text-slate-400 font-bold ml-1">+${dataSiswa.stars - 10} lainnya</span>`;
        }
    }

    // Tampilkan modal ke layar dengan menghapus class 'hidden'
    document.getElementById('userDetailModal').classList.remove('hidden');
}

// Fungsi untuk menutup jendela detail profil siswa
window.closeUserDetailModal = function() {
    document.getElementById('userDetailModal').classList.add('hidden');
}

// =======================================================
// 3. FUNGSI PENGATUR MODE (USER / ADMIN)
// =======================================================
window.setRole = function(role) {
    currentRole = role;
    const btnUser = document.getElementById('btnRoleUser');
    const btnAdmin = document.getElementById('btnRoleAdmin');
    const adminPanel = document.getElementById('adminPanel');

    if (role === 'admin') {
        btnAdmin.className = "px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 bg-brand-600 text-white shadow-md";
        btnUser.className = "px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 text-purple-300 hover:text-white";
        if (adminPanel) adminPanel.classList.remove('hidden');
    } else {
        btnUser.className = "px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 bg-brand-600 text-white shadow-md";
        btnAdmin.className = "px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 text-purple-300 hover:text-white";
        if (adminPanel) adminPanel.classList.add('hidden');
    }
}

// =======================================================
// 4. FUNGSI MODAL DI PANEL ADMIN
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
// 5. FUNGSI PROSES SIMPAN DATA KE SUPABASE
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
        
        ambilDanTampilkanRanking();
    } catch (err) {
        alert('Gagal menambah siswa: ' + err.message);
    }
}

// Inisialisasi awal saat halaman dibuka browser
document.addEventListener('DOMContentLoaded', () => {
    ambilDanTampilkanRanking();
});
