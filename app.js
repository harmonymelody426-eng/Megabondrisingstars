import { supabase } from './supabase-client.js';

// Variabel untuk menyimpan data role aktif (default: user/siswa)
let currentRole = 'user';
// Menyimpan salinan data siswa yang berhasil diambil dari database
let localStudentsData = [];

// =======================================================
// 1. LOGIKA KONVERSI TOTAL BINTANG KE SISTEM TIER ML
// =======================================================
function hitungTierDanBintang(totalStars) {
    let tierName = "Belum Ada Tier";
    let starsInTier = 0;

    if (totalStars <= 0) {
        return { tierName, starsInTier: 0 };
    }

    if (totalStars <= 5) {
        tierName = "Bintang Redup";
        starsInTier = totalStars;
    } else if (totalStars <= 10) {
        tierName = "Bintang Menyala";
        starsInTier = totalStars - 5;
    } else if (totalStars <= 15) {
        tierName = "Bintang Kejora";
        starsInTier = totalStars - 10;
    } else {
        tierName = "Rising Star";
        // Untuk Rising Star, bintang berjalan terus di atas 15
        starsInTier = totalStars - 15; 
    }

    return { tierName, starsInTier };
}

// Fungsi bantu untuk membuat deretan 5 ikon bintang (penuh vs transparan)
function buatHtmlBintangTier(infoTier) {
    let htmlBintang = '<div class="flex items-center gap-0.5 justify-center mt-0.5">';
    
    // 1. Gambar bintang yang menyala kuning penuh
    for (let i = 0; i < infoTier.starsInTier; i++) {
        htmlBintang += `<i class="fa-solid fa-star text-yellow-400 text-[10px] animate-pulse"></i>`;
    }
    
    // 2. Jika bukan Rising Star, sisa slot kosongnya diberi bintang transparan/garis tepi (fa-regular)
    if (infoTier.tierName !== "Rising Star") {
        const sisaSlotKosong = 5 - infoTier.starsInTier;
        for (let i = 0; i < sisaSlotKosong; i++) {
            htmlBintang += `<i class="fa-regular fa-star text-slate-500 text-[10px] opacity-60"></i>`;
        }
    } else {
        // Khusus Rising Star jika bintangnya lebih dari 5, sisa penambahannya bisa ditampilkan text "+X" jika mau
        if (infoTier.starsInTier > 5) {
            // Opsional: batasi render ikon maksimal 5 saja, lalu beri penanda text
        }
    }
    
    htmlBintang += '</div>';
    return htmlBintang;
}

// =======================================================
// 2. FUNGSI UTAMA: AMBIL DATA & TAMPILKAN RANKING + TIER
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
        if (statusIndicator) {
            statusIndicator.className = 'w-2 h-2 rounded-full bg-emerald-500';
        }

        console.log('Data Siswa Berhasil Diambil:', siswa);
        
        localStudentsData = siswa || [];

        // --- UPDATE PODIUM JUARA 1 ---
        if (siswa && siswa.length >= 1) {
            const info = hitungTierDanBintang(siswa[0].stars);
            document.getElementById('p1-name').innerText = siswa[0].name;
            // Menampilkan nama tier & deretan ikon bintang di bawah nama podium
            document.getElementById('p1-stars').innerHTML = `
                <span class="text-[10px] font-medium text-purple-300 block">${info.tierName}</span>
                ${buatHtmlBintangTier(info)}
                <span class="text-[11px] text-yellow-400 font-bold block mt-0.5"><i class="fa-solid fa-star text-[9px]"></i> ${siswa[0].stars}</span>
            `;
            if (siswa[0].avatar) document.getElementById('p1-avatar').src = siswa[0].avatar;
        } else {
            document.getElementById('p1-name').innerText = 'Belum Ada';
            document.getElementById('p1-stars').innerText = '0';
        }

        // --- UPDATE PODIUM JUARA 2 ---
        if (siswa && siswa.length >= 2) {
            const info = hitungTierDanBintang(siswa[1].stars);
            document.getElementById('p2-name').innerText = siswa[1].name;
            document.getElementById('p2-stars').innerHTML = `
                <span class="text-[10px] font-medium text-purple-300 block">${info.tierName}</span>
                ${buatHtmlBintangTier(info)}
                <span class="text-[11px] text-yellow-400 font-bold block mt-0.5"><i class="fa-solid fa-star text-[9px]"></i> ${siswa[1].stars}</span>
            `;
            if (siswa[1].avatar) document.getElementById('p2-avatar').src = siswa[1].avatar;
        } else {
            document.getElementById('p2-name').innerText = 'Belum Ada';
            document.getElementById('p2-stars').innerText = '0';
        }

        // --- UPDATE PODIUM JUARA 3 ---
        if (siswa && siswa.length >= 3) {
            const info = hitungTierDanBintang(siswa[2].stars);
            document.getElementById('p3-name').innerText = siswa[2].name;
            document.getElementById('p3-stars').innerHTML = `
                <span class="text-[10px] font-medium text-purple-300 block">${info.tierName}</span>
                ${buatHtmlBintangTier(info)}
                <span class="text-[11px] text-yellow-400 font-bold block mt-0.5"><i class="fa-solid fa-star text-[9px]"></i> ${siswa[2].stars}</span>
            `;
            if (siswa[2].avatar) document.getElementById('p3-avatar').src = siswa[2].avatar;
        } else {
            document.getElementById('p3-name').innerText = 'Belum Ada';
            document.getElementById('p3-stars').innerText = '0';
        }

        // --- UPDATE RUNNER UP RANK 4 & 5 ---
        if (siswa && siswa.length >= 4) {
            document.getElementById('p4-name').innerText = siswa[3].name;
            document.getElementById('p4-stars').innerText = siswa[3].stars;
        } else {
            document.getElementById('p4-name').innerText = '-';
            document.getElementById('p4-stars').innerText = '0';
        }
        if (siswa && siswa.length >= 5) {
            document.getElementById('p5-name').innerText = siswa[4].name;
            document.getElementById('p5-stars').innerText = siswa[4].stars;
        } else {
            document.getElementById('p5-name').innerText = '-';
            document.getElementById('p5-stars').innerText = '0';
        }

        // --- UPDATE KLASEMEN UMUM (RANK 6+) ---
        const leaderboardList = document.getElementById('leaderboardList');
        if (leaderboardList) {
            leaderboardList.innerHTML = '';
            if (siswa.length === 0) {
                leaderboardList.innerHTML = `<p class="text-xs text-slate-500 text-center py-4">Database kosong.</p>`;
            } else {
                siswa.forEach((itemSiswa, index) => {
                    const info = hitungTierDanBintang(itemSiswa.stars);
                    const row = document.createElement('div');
                    row.className = 'leaderboard-item flex justify-between items-center bg-slate-900/40 border border-slate-800/60 p-3 rounded-xl cursor-pointer hover:border-brand-500/40 transition-all';
                    row.onclick = () => window.viewUserDetail(index + 1);
                    
                    row.innerHTML = `
                        <div class="flex items-center gap-3">
                            <span class="font-bold text-xs text-slate-500 w-5">#${index + 1}</span>
                            <img src="${itemSiswa.avatar || 'https://picsum.photos/seed/' + index + '/100/100'}" class="w-8 h-8 rounded-full object-cover">
                            <div>
                                <span class="text-xs font-semibold text-slate-200 block">${itemSiswa.name}</span>
                                <span class="text-[9px] text-purple-400 font-medium block">${info.tierName}</span>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-yellow-400 font-bold text-xs">
                                <i class="fa-solid fa-star text-[10px]"></i> ${itemSiswa.stars}
                            </div>
                            ${buatHtmlBintangTier(info)}
                        </div>
                    `;
                    leaderboardList.appendChild(row);
                });
            }
        }

        // --- UPDATE LIST KELOLA SISWA DI PANEL ADMIN ---
        renderAdminStudentList(siswa);

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

// Fungsi internal untuk membuat daftar list kelola siswa di dalam panel admin
function renderAdminStudentList(siswaArray) {
    const adminStudentList = document.getElementById('adminStudentList');
    if (!adminStudentList) return;

    adminStudentList.innerHTML = '';
    if (siswaArray.length === 0) {
        adminStudentList.innerHTML = '<p class="text-xs text-slate-500 text-center col-span-full">Belum ada siswa.</p>';
        return;
    }

    siswaArray.forEach((siswa) => {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800/80';
        item.innerHTML = `
            <div>
                <p class="text-xs font-bold text-slate-200">${siswa.name}</p>
                <p class="text-[10px] text-yellow-400 font-medium"><i class="fa-solid fa-star"></i> ${siswa.stars} Bintang</p>
            </div>
            <button onclick="window.handleDeleteStudent('${siswa.id}', '${siswa.name}')" class="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-all text-xs" title="Hapus Siswa">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        adminStudentList.appendChild(item);
    });
}

// =======================================================
// 3. FUNGSI UNTUK MENGHAPUS DATA SISWA DARI SUPABASE
// =======================================================
window.handleDeleteStudent = async function(idSiswa, namaSiswa) {
    const konfirmasi = confirm(`Apakah Anda yakin ingin menghapus siswa bernama "${namaSiswa}"?`);
    if (!konfirmasi) return;

    try {
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', idSiswa);

        if (error) throw error;

        alert(`Siswa bernama ${namaSiswa} berhasil dihapus!`);
        ambilDanTampilkanRanking();
    } catch (err) {
        alert('Gagal menghapus siswa: ' + err.message);
    }
}

// =======================================================
// 4. FUNGSI MELIHAT DETAIL PROFIL SISWA (SISTEM TIER ML)
// =======================================================
window.viewUserDetail = function(rankNumber) {
    const indexSiswa = rankNumber - 1;
    const dataSiswa = localStudentsData[indexSiswa];

    if (!dataSiswa) return;

    const infoTier = hitungTierDanBintang(dataSiswa.stars);

    document.getElementById('modalName').innerText = dataSiswa.name;
    document.getElementById('modalRankLabel').innerText = `#${rankNumber}`;
    document.getElementById('modalTotalStarsText').innerHTML = `<i class="fa-solid fa-star"></i> Total: ${dataSiswa.stars} Bintang`;
    
    if (dataSiswa.avatar) {
        document.getElementById('modalAvatar').src = dataSiswa.avatar;
    } else {
        document.getElementById('modalAvatar').src = 'https://picsum.photos/seed/' + indexSiswa + '/150/150';
    }

    document.getElementById('modalTierName').innerText = infoTier.tierName;

    const starIconsContainer = document.getElementById('modalStarIcons');
    if (starIconsContainer) {
        starIconsContainer.innerHTML = '';
        
        for (let i = 0; i < infoTier.starsInTier; i++) {
            starIconsContainer.innerHTML += `<i class="fa-solid fa-star text-yellow-400 text-xs animate-pulse"></i>`;
        }
        
        if (infoTier.tierName !== "Rising Star") {
            const sisaSlotKosong = 5 - infoTier.starsInTier;
            for (let i = 0; i < sisaSlotKosong; i++) {
                starIconsContainer.innerHTML += `<i class="fa-regular fa-star text-slate-700 text-xs opacity-60"></i>`;
            }
        }
    }

    document.getElementById('userDetailModal').classList.remove('hidden');
}

window.closeUserDetailModal = function() {
    document.getElementById('userDetailModal').classList.add('hidden');
}

// =======================================================
// 5. FUNGSI PENGATUR MODE (USER / ADMIN)
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
// 6. FUNGSI MODAL DI PANEL ADMIN
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
// 7. FUNGSI PROSES SIMPAN DATA KE SUPABASE
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
