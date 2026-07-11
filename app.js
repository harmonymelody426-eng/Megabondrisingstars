import { supabase } from './supabase-client.js';

// Variabel untuk menyimpan data role aktif (default: user/siswa)
let currentRole = 'user';
// Menyimpan salinan data siswa yang berhasil diambil dari database
let localStudentsData = [];
// Menyimpan tipe transaksi yang aktif saat admin memilih kategori catatan
window.currentTransactionType = 'achievement'; 

// =======================================================
// 0. LOGIKA ATUR TIPE TRANSAKSI (ACHIEVEMENT / PENALTY)
// =======================================================
window.setTransactionType = function(type) {
    window.currentTransactionType = type;
    console.log("Tipe transaksi diatur ke:", type);

    const btnAchievement = document.getElementById('typeAchievementBtn');
    const btnPenalty = document.getElementById('typePenaltyBtn');

    if (!btnAchievement || !btnPenalty) return;

    if (type === 'achievement') {
        btnAchievement.className = "py-2.5 rounded-xl border border-emerald-500 bg-emerald-500/10 text-emerald-400 font-medium text-xs flex items-center justify-center gap-1.5 transition-all w-full";
        btnPenalty.className = "py-2.5 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200 text-xs flex items-center justify-center gap-1.5 transition-all w-full";
    } else {
        btnAchievement.className = "py-2.5 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200 text-xs flex items-center justify-center gap-1.5 transition-all w-full";
        btnPenalty.className = "py-2.5 rounded-xl border border-rose-500 bg-rose-500/10 text-rose-400 font-medium text-xs flex items-center justify-center gap-1.5 transition-all w-full";
    }
}

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
        starsInTier = totalStars - 15; 
    }

    return { tierName, starsInTier };
}

function buatHtmlBintangTier(infoTier) {
    let htmlBintang = '<div class="flex items-center gap-0.5 justify-center mt-0.5">';
    for (let i = 0; i < infoTier.starsInTier; i++) {
        htmlBintang += `<i class="fa-solid fa-star text-yellow-400 text-[10px] animate-pulse"></i>`;
    }
    if (infoTier.tierName !== "Rising Star") {
        const sisaSlotKosong = 5 - infoTier.starsInTier;
        for (let i = 0; i < sisaSlotKosong; i++) {
            htmlBintang += `<i class="fa-regular fa-star text-slate-500 text-[10px] opacity-60"></i>`;
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
    const statusElAlt = document.querySelector('.bg-slate-900\\/80 span');
    const indicatorAlt = document.querySelector('.bg-slate-900\\/80 div');

    try {
        const { data: siswa, error } = await supabase
            .from('students')
            .select('*')
            .order('stars', { ascending: false });

        if (error) throw error;

        // Simpan ke local state (baik local maupun window)
        localStudentsData = siswa || [];
        window.localStudentsData = siswa || [];

        // --- UPDATE STATUS INDIKATOR DATABASE ---
        if (statusText) statusText.innerText = 'Connected';
        if (statusElAlt) statusElAlt.innerText = "Live Database Sync";
        
        if (statusIndicator) statusIndicator.className = 'w-2 h-2 rounded-full bg-emerald-500';
        if (indicatorAlt) indicatorAlt.className = "w-2 h-2 rounded-full bg-emerald-500 animate-pulse";

        console.log('Data Siswa Berhasil Diambil:', siswa);

        // --- RUN FALLBACK EXTERNAL RENDERS (JIKA ADA) ---
        if (typeof window.renderPodium === 'function') window.renderPodium(siswa);
        if (typeof window.renderTable === 'function') window.renderTable(siswa);
        if (typeof window.updateLeaderboardUI === 'function') window.updateLeaderboardUI(siswa);

        // --- UPDATE PODIUM JUARA 1 ---
        if (siswa && siswa.length >= 1) {
            const info = hitungTierDanBintang(siswa[0].stars);
            const p1Name = document.getElementById('p1-name');
            const p1Stars = document.getElementById('p1-stars');
            const p1Avatar = document.getElementById('p1-avatar');
            
            if (p1Name) p1Name.innerText = siswa[0].name;
            if (p1Stars) p1Stars.innerHTML = `
                <span class="text-[10px] font-medium text-purple-300 block">${info.tierName}</span>
                ${buatHtmlBintangTier(info)}
                <span class="text-[11px] text-yellow-400 font-bold block mt-0.5"><i class="fa-solid fa-star text-[9px]"></i> ${siswa[0].stars}</span>
            `;
            if (siswa[0].avatar && p1Avatar) p1Avatar.src = siswa[0].avatar;
        } else {
            if (document.getElementById('p1-name')) document.getElementById('p1-name').innerText = 'Belum Ada';
            if (document.getElementById('p1-stars')) document.getElementById('p1-stars').innerText = '0';
        }

        // --- UPDATE PODIUM JUARA 2 ---
        if (siswa && siswa.length >= 2) {
            const info = hitungTierDanBintang(siswa[1].stars);
            const p2Name = document.getElementById('p2-name');
            const p2Stars = document.getElementById('p2-stars');
            const p2Avatar = document.getElementById('p2-avatar');

            if (p2Name) p2Name.innerText = siswa[1].name;
            if (p2Stars) p2Stars.innerHTML = `
                <span class="text-[10px] font-medium text-purple-300 block">${info.tierName}</span>
                ${buatHtmlBintangTier(info)}
                <span class="text-[11px] text-yellow-400 font-bold block mt-0.5"><i class="fa-solid fa-star text-[9px]"></i> ${siswa[1].stars}</span>
            `;
            if (siswa[1].avatar && p2Avatar) p2Avatar.src = siswa[1].avatar;
        } else {
            if (document.getElementById('p2-name')) document.getElementById('p2-name').innerText = 'Belum Ada';
            if (document.getElementById('p2-stars')) document.getElementById('p2-stars').innerText = '0';
        }

        // --- UPDATE PODIUM JUARA 3 ---
        if (siswa && siswa.length >= 3) {
            const info = hitungTierDanBintang(siswa[2].stars);
            const p3Name = document.getElementById('p3-name');
            const p3Stars = document.getElementById('p3-stars');
            const p3Avatar = document.getElementById('p3-avatar');

            if (p3Name) p3Name.innerText = siswa[2].name;
            if (p3Stars) p3Stars.innerHTML = `
                <span class="text-[10px] font-medium text-purple-300 block">${info.tierName}</span>
                ${buatHtmlBintangTier(info)}
                <span class="text-[11px] text-yellow-400 font-bold block mt-0.5"><i class="fa-solid fa-star text-[9px]"></i> ${siswa[2].stars}</span>
            `;
            if (siswa[2].avatar && p3Avatar) p3Avatar.src = siswa[2].avatar;
        } else {
            if (document.getElementById('p3-name')) document.getElementById('p3-name').innerText = 'Belum Ada';
            if (document.getElementById('p3-stars')) document.getElementById('p3-stars').innerText = '0';
        }

        // --- UPDATE RUNNER UP RANK 4 & 5 ---
        const p4Name = document.getElementById('p4-name');
        const p4Stars = document.getElementById('p4-stars');
        if (siswa && siswa.length >= 4) {
            if (p4Name) p4Name.innerText = siswa[3].name;
            if (p4Stars) p4Stars.innerText = siswa[3].stars;
        } else {
            if (p4Name) p4Name.innerText = '-';
            if (p4Stars) p4Stars.innerText = '0';
        }

        const p5Name = document.getElementById('p5-name');
        const p5Stars = document.getElementById('p5-stars');
        if (siswa && siswa.length >= 5) {
            if (p5Name) p5Name.innerText = siswa[4].name;
            if (p5Stars) p5Stars.innerText = siswa[4].stars;
        } else {
            if (p5Name) p5Name.innerText = '-';
            if (p5Stars) p5Stars.innerText = '0';
        }

        // --- KLASEMEN UMUM ---
        const leaderboardList = document.getElementById('leaderboardList');
        if (leaderboardList) {
            leaderboardList.innerHTML = '';
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

        // Render komponen admin & input dropdown
        renderAdminStudentList(siswa);

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
        console.error('Koneksi/Sinkronisasi Gagal:', err.message);
        if (statusText) statusText.innerText = 'Error Connection';
        if (statusElAlt) statusElAlt.innerText = "Connection Failed";
        if (statusIndicator) statusIndicator.className = 'w-2 h-2 rounded-full bg-rose-500';
    }
}

function renderAdminStudentList(siswaArray) {
    const adminStudentList = document.getElementById('adminStudentList');
    if (!adminStudentList) return;

    adminStudentList.innerHTML = '';
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

window.handleDeleteStudent = async function(idSiswa, namaSiswa) {
    const konfirmasi = confirm(`Apakah Anda yakin ingin menghapus siswa bernama "${namaSiswa}"?`);
    if (!konfirmasi) return;

    try {
        const { error } = await supabase.from('students').delete().eq('id', idSiswa);
        if (error) throw error;
        alert(`Siswa bernama ${namaSiswa} berhasil dihapus!`);
        ambilDanTampilkanRanking();
    } catch (err) {
        alert('Gagal menghapus siswa: ' + err.message);
    }
}

// =======================================================
// 3. PROSES TRANSAKSI PRESTASI / PENALTI (SINKRON SUPABASE)
// =======================================================
window.handleTransaction = async function(event) {
    event.preventDefault();

    const studentId = document.getElementById('transactionStudentSelect').value;
    const starsElement = document.getElementById('transactionStars') || document.getElementById('transactionAmount');
    const amount = parseInt(starsElement.value) || 0;
    
    const notesElement = document.getElementById('transactionNotes') || 
                          document.getElementById('transactionDescription') || 
                          document.getElementById('transactionKeterangan') ||
                          document.querySelector('#transactionForm textarea') ||
                          document.querySelector('textarea');
    const notes = notesElement ? notesElement.value : "";

    let dbType = 'achievement'; 
    if (window.currentTransactionType === 'penalty') {
        dbType = 'penalty';
    }

    if (!studentId) {
        alert('Silakan pilih siswa terlebih dahulu!');
        return;
    }

    try {
        const { data: studentData, error: fetchError } = await supabase
            .from('students')
            .select('stars')
            .eq('id', studentId)
            .single();

        if (fetchError) throw fetchError;

        let currentStars = studentData.stars;
        let newStars = dbType === 'achievement' ? currentStars + amount : currentStars - amount;
        if (newStars < 0) newStars = 0;

        const { error: updateError } = await supabase
            .from('students')
            .update({ stars: newStars })
            .eq('id', studentId);

        if (updateError) throw updateError;

        const { error: insertError } = await supabase
            .from('transactions')
            .insert([
                { 
                    student_id: studentId, 
                    type: dbType,           
                    stars: amount,          
                    description: notes      
                }
            ]);

        if (insertError) throw insertError;

        alert('Transaksi berhasil diproses!');
        document.getElementById('transactionForm').reset();
        window.setTransactionType('achievement');

        if (typeof window.closeTransactionModal === 'function') {
            window.closeTransactionModal();
        }
        
        ambilDanTampilkanRanking();

    } catch (err) {
        console.error(err);
        alert('Gagal memproses transaksi: ' + err.message);
    }
}

// =======================================================
// 4. FUNGSI DETAIL PROFIL + AMBIL RIWAYAT TRANSAKSI
// =======================================================
window.viewUserDetail = async function(rankNumber) {
    const namaTarget = document.getElementById('p' + rankNumber + '-name')?.innerText || "";
    let dataSiswa = localStudentsData.find(s => s.name === namaTarget);
    if (!dataSiswa) {
        dataSiswa = localStudentsData[rankNumber - 1];
    }

    if (!dataSiswa) return;

    const infoTier = hitungTierDanBintang(dataSiswa.stars);

    document.getElementById('modalName').innerText = dataSiswa.name;
    document.getElementById('modalRankLabel').innerText = `#${rankNumber}`;
    document.getElementById('modalTotalStarsText').innerHTML = `<i class="fa-solid fa-star"></i> Total: ${dataSiswa.stars} Bintang`;
    
    if (dataSiswa.avatar) {
        document.getElementById('modalAvatar').src = dataSiswa.avatar;
    } else {
        document.getElementById('modalAvatar').src = 'https://picsum.photos/seed/' + dataSiswa.name + '/150/150';
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

    const riwayatContainer = document.getElementById('modalHistoryContainer') || 
                             document.querySelector('#userDetailModal div.mt-4 div');

    if (riwayatContainer) {
        riwayatContainer.innerHTML = `<p class="text-[11px] text-slate-500 text-center py-2 animate-pulse">Memuat riwayat...</p>`;
        
        try {
            const { data: logs, error: logsError } = await supabase
                .from('transactions')
                .select('*')
                .eq('student_id', dataSiswa.id)
                .order('created_at', { ascending: false });

            if (logsError) throw logsError;

            if (!logs || logs.length === 0) {
                riwayatContainer.innerHTML = `<p class="text-[11px] text-slate-500 text-center py-2">Tidak ada riwayat.</p>`;
            } else {
                riwayatContainer.innerHTML = '';
                
                logs.forEach(log => {
                    const itemLog = document.createElement('div');
                    itemLog.className = 'flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800/40 mb-1.5 text-[11px]';
                    
                    const isPenalty = log.type === 'penalti' || log.type === 'penalty' || log.type === 'minus';
                    const icon = isPenalty ? '<i class="fa-solid fa-circle-minus text-rose-400"></i>' : '<i class="fa-solid fa-award text-emerald-400"></i>';
                    const sign = isPenalty ? '-' : '+';
                    const textClass = isPenalty ? 'text-rose-400' : 'text-emerald-400';
                    
                    const isiCatatan = log.description || 'Tanpa keterangan';
                    const jumlahBintang = log.stars || 0;
                    
                    itemLog.innerHTML = `
                        <div class="flex items-center gap-2">
                            ${icon}
                            <span class="text-slate-300 font-medium">${isiCatatan}</span>
                        </div>
                        <span class="font-bold ${textClass}">${sign}${jumlahBintang} Bintang</span>
                    `;
                    riwayatContainer.appendChild(itemLog);
                });
            }
        } catch (err) {
            riwayatContainer.innerHTML = `<p class="text-[11px] text-rose-400 text-center py-2">Gagal memuat riwayat.</p>`;
        }
    }
}

// =======================================================
// 5. PENGATUR MODE (USER / ADMIN) WITH PASSWORD PROTECT
// =======================================================
window.setRole = function(role) {
    const adminPanel = document.getElementById('adminPanel');
    const btnUser = document.getElementById('btnRoleUser');
    const btnAdmin = document.getElementById('btnRoleAdmin');

    if (role === 'admin') {
        // Tentukan password yang kamu mau di sini (Contoh: "min3bondowoso")
        const passwordBenar = "junexmessi"; 
        const inputPassword = prompt("Masukkan Password Khusus Admin:");

        // Jika batal atau password salah, gagalkan proses masuk admin
        if (inputPassword === null) return; // User menekan tombol cancel
        if (inputPassword !== passwordBenar) {
            alert("❌ Password Salah! Akses Admin Ditolak.");
            return;
        }

        // Jika lolos, set role ke admin
        currentRole = 'admin';
        window.currentRole = 'admin';
        console.log("Akses Admin Diterima.");

        if (adminPanel) adminPanel.classList.remove('hidden');
        if (btnAdmin) btnAdmin.className = "px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 bg-brand-600 text-white shadow-md";
        if (btnUser) btnUser.className = "px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 text-purple-300 hover:text-white";
    } else {
        // Mode Siswa / Balik ke User biasa (tanpa password)
        currentRole = 'user';
        window.currentRole = 'user';
        
        if (adminPanel) adminPanel.classList.add('hidden');
        if (btnUser) btnUser.className = "px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 bg-brand-600 text-white shadow-md";
        if (btnAdmin) btnAdmin.className = "px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 text-purple-300 hover:text-white";
    }
};

// =======================================================
// 6. FUNGSI MODAL & PROSES SIMPAN SISWA (SUPPORT AVATAR)
// =======================================================
window.openAddStudentModal = function() { document.getElementById('addStudentModal').classList.remove('hidden'); }
window.closeAddStudentModal = function() { document.getElementById('addStudentModal').classList.add('hidden'); }
window.openTransactionModal = function() { document.getElementById('transactionModal').classList.remove('hidden'); }
window.closeTransactionModal = function() { document.getElementById('transactionModal').classList.add('hidden'); }

window.handleAddStudent = async function(event) {
    event.preventDefault();
    const namaSiswa = document.getElementById('newStudentName').value;
    const linkAvatar = document.getElementById('newStudentAvatar').value.trim();
    const bintangAwal = parseInt(document.getElementById('newStudentStars').value) || 0;

    const studentPayload = { name: namaSiswa, stars: bintangAwal };
    if (linkAvatar !== "") studentPayload.avatar = linkAvatar;

    try {
        const { error } = await supabase.from('students').insert([studentPayload]);
        if (error) throw error;
        
        alert(`Siswa ${namaSiswa} berhasil ditambahkan!`);
        document.getElementById('addStudentForm').reset();
        closeAddStudentModal();
        ambilDanTampilkanRanking();
    } catch (err) {
        alert('Gagal menambah siswa: ' + err.message);
    }
}

// =======================================================
// 7. FITUR TAMBAHAN: EDIT FOTO SISWA LANGSUNG
// =======================================================
window.ubahFotoSiswaAdmin = async function() {
    const adminPanel = document.getElementById('adminPanel');
    const isPanelAdminTerbuka = adminPanel && !adminPanel.classList.contains('hidden');
    const isAdminVariabel = typeof window.currentRole !== 'undefined' && window.currentRole === 'admin';

    if (!isPanelAdminTerbuka && !isAdminVariabel) {
        alert("Akses ditolak! Fitur ganti foto ini hanya untuk Mode Admin.");
        return;
    }

    const namaSiswaAktif = document.getElementById('modalName').innerText;
    let dataSiswa = localStudentsData.find(s => s.name === namaSiswaAktif);
    if (!dataSiswa) return alert("Gagal mendeteksi data siswa!");

    const urlBaru = prompt("Masukkan Link URL Foto baru untuk " + namaSiswaAktif + ":", dataSiswa.avatar || "");
    if (urlBaru === null) return; 

    try {
        const { error } = await supabase
            .from('students')
            .update({ avatar: urlBaru.trim() })
            .eq('id', dataSiswa.id);

        if (error) throw error;

        alert("Foto profil " + namaSiswaAktif + " berhasil diperbarui!");
        
        const modalDetail = document.getElementById('userDetailModal');
        if (modalDetail) modalDetail.classList.add('hidden');
        
        ambilDanTampilkanRanking();
    } catch (err) {
        alert("Gagal memperbarui foto: " + err.message);
    }
}

// =======================================================
// 8. INITIALIZATION & RUN ON LOAD (OTOMATIS DI JALANKAN)
// =======================================================
window.ambilDanTampilkanRanking = ambilDanTampilkanRanking;

// Jalankan fungsi saat web dibuka biar ga mandek di "Loading..."
ambilDanTampilkanRanking();
