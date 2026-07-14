import { supabase } from './supabase-client.js';

// Variabel untuk menyimpan data role aktif (default: user/siswa)
let currentRole = 'user';
// Menyimpan salinan data siswa yang berhasil diambil dari database
let localStudentsData = [];
// Menyimpan tipe transaksi yang aktif saat admin memilih kategori catatan
window.currentTransactionType = 'achievement'; 
// Flag untuk mencegah multiple call viewUserDetail
window._isLoadingUserDetail = false;

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

        // ==========================================
        // 1. --- UPDATE PODIUM JUARA 1 ---
        // ==========================================
        if (siswa && siswa.length >= 1) {
            const info = hitungTierDanBintang(siswa[0].stars);
            const p1Name = document.getElementById('p1-name');
            const p1Stars = document.getElementById('p1-stars');
            const p1Avatar = document.getElementById('p1-avatar');
            
            if (p1Name) p1Name.innerText = siswa[0].name;
            if (p1Stars) {
                p1Stars.innerHTML = `
                    <span class="text-[10px] font-medium text-purple-300 block">${info.tierName}</span>
                    ${buatHtmlBintangTier(info)}
                    <span class="text-[11px] text-yellow-400 font-bold block mt-0.5"><i class="fa-solid fa-star text-[9px]"></i> ${siswa[0].stars}</span>
                `;
            }
            // PERBAIKAN: Gunakan avatar_url
            if (p1Avatar && siswa[0].avatar_url) {
                p1Avatar.src = siswa[0].avatar_url;
            }
            
            // Pasang fungsi klik dinamis ke elemen podium 1
            const podium1 = document.getElementById('podium-1');
            if (podium1) {
                const clickTarget = podium1.querySelector('.cursor-pointer') || podium1;
                clickTarget.setAttribute('onclick', 'window.viewUserDetail(1)');
            }
        } else {
            if (document.getElementById('p1-name')) document.getElementById('p1-name').innerText = 'Belum Ada';
            if (document.getElementById('p1-stars')) document.getElementById('p1-stars').innerText = '0';
        }

        // ==========================================
        // 2. --- UPDATE PODIUM JUARA 2 ---
        // ==========================================
        if (siswa && siswa.length >= 2) {
            const info = hitungTierDanBintang(siswa[1].stars);
            const p2Name = document.getElementById('p2-name');
            const p2Stars = document.getElementById('p2-stars');
            const p2Avatar = document.getElementById('p2-avatar');

            if (p2Name) p2Name.innerText = siswa[1].name;
            if (p2Stars) {
                p2Stars.innerHTML = `
                    <span class="text-[10px] font-medium text-purple-300 block">${info.tierName}</span>
                    ${buatHtmlBintangTier(info)}
                    <span class="text-[11px] text-yellow-400 font-bold block mt-0.5"><i class="fa-solid fa-star text-[9px]"></i> ${siswa[1].stars}</span>
                `;
            }
            // PERBAIKAN: Gunakan avatar_url
            if (p2Avatar && siswa[1].avatar_url) {
                p2Avatar.src = siswa[1].avatar_url;
            }
            
            // Pasang fungsi klik dinamis ke elemen podium 2
            const podium2 = document.getElementById('podium-2');
            if (podium2) {
                const clickTarget = podium2.querySelector('.cursor-pointer') || podium2;
                clickTarget.setAttribute('onclick', 'window.viewUserDetail(2)');
            }
        } else {
            if (document.getElementById('p2-name')) document.getElementById('p2-name').innerText = 'Belum Ada';
            if (document.getElementById('p2-stars')) document.getElementById('p2-stars').innerText = '0';
        }

        // ==========================================
        // 3. --- UPDATE PODIUM JUARA 3 ---
        // ==========================================
        if (siswa && siswa.length >= 3) {
            const info = hitungTierDanBintang(siswa[2].stars);
            const p3Name = document.getElementById('p3-name');
            const p3Stars = document.getElementById('p3-stars');
            const p3Avatar = document.getElementById('p3-avatar');

            if (p3Name) p3Name.innerText = siswa[2].name;
            if (p3Stars) {
                p3Stars.innerHTML = `
                    <span class="text-[10px] font-medium text-purple-300 block">${info.tierName}</span>
                    ${buatHtmlBintangTier(info)}
                    <span class="text-[11px] text-yellow-400 font-bold block mt-0.5"><i class="fa-solid fa-star text-[9px]"></i> ${siswa[2].stars}</span>
                `;
            }
            // PERBAIKAN: Gunakan avatar_url
            if (p3Avatar && siswa[2].avatar_url) {
                p3Avatar.src = siswa[2].avatar_url;
            }
            
            // Pasang fungsi klik dinamis ke elemen podium 3
            const podium3 = document.getElementById('podium-3');
            if (podium3) {
                const clickTarget = podium3.querySelector('.cursor-pointer') || podium3;
                clickTarget.setAttribute('onclick', 'window.viewUserDetail(3)');
            }
        } else {
            if (document.getElementById('p3-name')) document.getElementById('p3-name').innerText = 'Belum Ada';
            if (document.getElementById('p3-stars')) document.getElementById('p3-stars').innerText = '0';
        }

        // --- UPDATE RUNNER UP RANK 4 & 5 ---
        const p4Name = document.getElementById('p4-name');
        const p4Stars = document.getElementById('p4-stars');
        if (siswa && siswa.length >= 4) {
            const info4 = hitungTierDanBintang(siswa[3].stars);
            if (p4Name) p4Name.innerText = siswa[3].name;
            if (p4Stars) {
                p4Stars.innerHTML = `
                    <span class="text-[9px] font-medium text-purple-300 block mb-0.5">${info4.tierName}</span>
                    <div class="flex items-center gap-0.5 justify-center">${buatHtmlBintangTier(info4)}</div>
                    <span class="text-[11px] text-yellow-400 font-bold block mt-0.5"><i class="fa-solid fa-star text-[9px]"></i> ${siswa[3].stars}</span>
                `;
            }
            
            // Perbaikan Target: Ambil langsung berdasarkan ID Card-nya dan kirimkan angka rank 4
            const card4 = document.getElementById('card-rank-4');
            if (card4) card4.setAttribute('onclick', 'window.viewUserDetail(4)');
            
            // PERBAIKAN: Tambahkan avatar untuk rank 4
            const p4Avatar = document.getElementById('p4-avatar');
            if (p4Avatar && siswa[3].avatar_url) {
                p4Avatar.src = siswa[3].avatar_url;
            }
        } else {
            if (p4Name) p4Name.innerText = '-';
            if (p4Stars) p4Stars.innerText = '0';
        }

        const p5Name = document.getElementById('p5-name');
        const p5Stars = document.getElementById('p5-stars');
        if (siswa && siswa.length >= 5) {
            const info5 = hitungTierDanBintang(siswa[4].stars);
            if (p5Name) p5Name.innerText = siswa[4].name;
            if (p5Stars) {
                p5Stars.innerHTML = `
                    <span class="text-[9px] font-medium text-purple-300 block mb-0.5">${info5.tierName}</span>
                    <div class="flex items-center gap-0.5 justify-center">${buatHtmlBintangTier(info5)}</div>
                    <span class="text-[11px] text-yellow-400 font-bold block mt-0.5"><i class="fa-solid fa-star text-[9px]"></i> ${siswa[4].stars}</span>
                `;
            }
            
            const card5 = document.getElementById('card-rank-5');
            if (card5) {
                card5.setAttribute('onclick', 'window.viewUserDetail(5)');
            }
            
            // PERBAIKAN: Tambahkan avatar untuk rank 5
            const p5Avatar = document.getElementById('p5-avatar');
            if (p5Avatar && siswa[4].avatar_url) {
                p5Avatar.src = siswa[4].avatar_url;
            }
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
                
                // PERBAIKAN: Gunakan avatar_url
                row.innerHTML = `
                    <div class="flex items-center gap-3">
                        <span class="font-bold text-xs text-slate-500 w-5">#${index + 1}</span>
                        <img src="${itemSiswa.avatar_url || 'https://picsum.photos/seed/' + index + '/100/100'}" class="w-8 h-8 rounded-full object-cover">
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
    // Cegah multiple call (loading berlapis)
    if (window._isLoadingUserDetail) {
        console.log("⏳ Masih memproses permintaan sebelumnya...");
        return;
    }
    window._isLoadingUserDetail = true;

    try {
        // ==========================================
        // 1. AMBIL DATA SISWA DARI LOCAL STORAGE
        // ==========================================
        const index = parseInt(rankNumber) - 1;
        const dataSiswa = localStudentsData[index];

        if (!dataSiswa) {
            console.error("❌ Siswa pada peringkat ini tidak ditemukan!");
            window._isLoadingUserDetail = false;
            return;
        }

        console.log(`📊 Menampilkan detail: ${dataSiswa.name} (Rank #${rankNumber})`);

        const infoTier = hitungTierDanBintang(dataSiswa.stars);

        // ==========================================
        // 2. ISI KONTEN TEKS KE MODAL
        // ==========================================
        const elements = {
            modalName: document.getElementById('modalName'),
            modalRankLabel: document.getElementById('modalRankLabel'),
            modalTotalStarsText: document.getElementById('modalTotalStarsText'),
            modalTierName: document.getElementById('modalTierName'),
            modalAvatar: document.getElementById('modalAvatar'),
            modalStarIcons: document.getElementById('modalStarIcons'),
            detailModal: document.getElementById('userDetailModal') || document.getElementById('UserDetailModal')
        };

        // Isi nama
        if (elements.modalName) {
            elements.modalName.innerText = dataSiswa.name;
        }

        // Isi rank
        if (elements.modalRankLabel) {
            elements.modalRankLabel.innerText = `#${rankNumber}`;
        }

        // Isi total bintang
        if (elements.modalTotalStarsText) {
            elements.modalTotalStarsText.innerHTML = 
                `<i class="fa-solid fa-star"></i> Total: ${dataSiswa.stars} Bintang`;
        }

        // Isi tier name
        if (elements.modalTierName) {
            elements.modalTierName.innerText = infoTier.tierName;
        }

        // ==========================================
        // 3. SET AVATAR
        // ==========================================
        if (elements.modalAvatar) {
            const defaultAvatar = 'https://picsum.photos/seed/' + 
                encodeURIComponent(dataSiswa.name) + '/150/150';
            elements.modalAvatar.src = dataSiswa.avatar_url || defaultAvatar;
        }

        // ==========================================
        // 4. RENDER BINTANG DI MODAL
        // ==========================================
        if (elements.modalStarIcons) {
            elements.modalStarIcons.innerHTML = '';
            
            // Tampilkan bintang yang terisi (warna kuning)
            for (let i = 0; i < infoTier.starsInTier; i++) {
                elements.modalStarIcons.innerHTML += 
                    `<i class="fa-solid fa-star text-yellow-400 text-xs animate-pulse"></i>`;
            }
            
            // Tampilkan bintang kosong (jika bukan Rising Star)
            if (infoTier.tierName !== "Rising Star") {
                const sisaSlotKosong = 5 - infoTier.starsInTier;
                for (let i = 0; i < sisaSlotKosong; i++) {
                    elements.modalStarIcons.innerHTML += 
                        `<i class="fa-regular fa-star text-slate-700 text-xs opacity-60"></i>`;
                }
            }
        }

        // ==========================================
        // 5. TAMPILKAN MODAL
        // ==========================================
        if (elements.detailModal) {
            elements.detailModal.classList.remove('hidden');
        }

        // ==========================================
        // 6. TAMPILKAN/SEMBUNYIKAN TOMBOL EDIT NAMA
        // ==========================================
        const btnEditNama = document.getElementById('btnEditNama');
        if (btnEditNama) {
            if (window.currentRole === 'admin') {
                btnEditNama.classList.remove('hidden');
            } else {
                btnEditNama.classList.add('hidden');
            }
        }

        // ==========================================
        // 7. MUAT RIWAYAT TRANSAKSI SISWA
        // ==========================================
        const riwayatContainer = document.getElementById('modalHistoryContainer') || 
            (elements.detailModal ? elements.detailModal.querySelector('div.mt-4 div') : null);

        if (riwayatContainer) {
            // Tampilkan loading
            riwayatContainer.innerHTML = 
                `<p class="text-[11px] text-slate-500 text-center py-2 animate-pulse">⏳ Memuat riwayat...</p>`;
            
            try {
                const { data: logs, error: logsError } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('student_id', dataSiswa.id)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (logsError) throw logsError;

                // Jika tidak ada riwayat
                if (!logs || logs.length === 0) {
                    riwayatContainer.innerHTML = 
                        `<p class="text-[11px] text-slate-500 text-center py-2">📭 Tidak ada riwayat.</p>`;
                    return;
                }

                // Render riwayat
                riwayatContainer.innerHTML = '';
                
                logs.forEach(log => {
                    const isPenalty = ['penalti', 'penalty', 'minus'].includes(log.type);
                    const icon = isPenalty ? 
                        '<i class="fa-solid fa-circle-minus text-rose-400"></i>' : 
                        '<i class="fa-solid fa-award text-emerald-400"></i>';
                    const sign = isPenalty ? '-' : '+';
                    const textClass = isPenalty ? 'text-rose-400' : 'text-emerald-400';
                    const isiCatatan = log.description || 'Tanpa keterangan';
                    const jumlahBintang = log.stars || 0;
                    
                    const itemLog = document.createElement('div');
                    itemLog.className = 'flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800/40 mb-1.5 text-[11px]';
                    itemLog.innerHTML = `
                        <div class="flex items-center gap-2">
                            ${icon}
                            <span class="text-slate-300 font-medium">${isiCatatan}</span>
                        </div>
                        <span class="font-bold ${textClass}">${sign}${jumlahBintang} Bintang</span>
                    `;
                    riwayatContainer.appendChild(itemLog);
                });

            } catch (err) {
                console.error('❌ Error ambil riwayat:', err);
                riwayatContainer.innerHTML = 
                    `<p class="text-[11px] text-rose-400 text-center py-2">❌ Gagal memuat riwayat.</p>`;
            }
        }

    } catch (error) {
        console.error("❌ Error di viewUserDetail:", error);
    } finally {
        // Reset flag setelah selesai
        window._isLoadingUserDetail = false;
    }
};

// =======================================================
// 5. PENGATUR MODE (USER / ADMIN)
// =======================================================
window.setRole = function(role) {
    const adminPanel = document.getElementById('adminPanel');
    const btnUser = document.getElementById('btnRoleUser');
    const btnAdmin = document.getElementById('btnRoleAdmin');

    if (role === 'admin') {
        const passwordBenar = "min3bondowoso"; 
        const inputPassword = prompt("Masukkan Password Khusus Admin:");

        if (inputPassword === null) return;
        if (inputPassword !== passwordBenar) {
            alert("❌ Password Salah! Akses Admin Ditolak.");
            return;
        }

        currentRole = 'admin';
        window.currentRole = 'admin';
        console.log("Akses Admin Diterima.");

        if (adminPanel) adminPanel.classList.remove('hidden');
        if (btnAdmin) btnAdmin.className = "px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 bg-brand-600 text-white shadow-md";
        if (btnUser) btnUser.className = "px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 text-purple-300 hover:text-white";
    } else {
        currentRole = 'user';
        window.currentRole = 'user';
        
        if (adminPanel) adminPanel.classList.add('hidden');
        if (btnUser) btnUser.className = "px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 bg-brand-600 text-white shadow-md";
        if (btnAdmin) btnAdmin.className = "px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 text-purple-300 hover:text-white";
    }

    if (typeof ambilDanTampilkanRanking === 'function') {
        ambilDanTampilkanRanking();
    }
};

// =======================================================
// 6. FUNGSI MODAL & PROSES SIMPAN SISWA
// =======================================================
window.openAddStudentModal = function() { document.getElementById('addStudentModal').classList.remove('hidden'); }
window.closeAddStudentModal = function() { document.getElementById('addStudentModal').classList.add('hidden'); }
window.openTransactionModal = function() { document.getElementById('TransactionModal').classList.remove('hidden'); }
window.closeTransactionModal = function() { document.getElementById('TransactionModal').classList.add('hidden'); }

window.handleAddStudent = async function(event) {
    event.preventDefault();
    const namaSiswa = document.getElementById('newStudentName').value;
    const linkAvatar = document.getElementById('newStudentAvatar').value.trim();
    const bintangAwal = parseInt(document.getElementById('newStudentStars').value) || 0;

    const studentPayload = { name: namaSiswa, stars: bintangAwal };
    if (linkAvatar !== "") studentPayload.avatar_url = linkAvatar;

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
// 7. FITUR TAMBAHAN: EDIT FOTO SISWA LANGSUNG (LINK URL)
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

    const urlBaru = prompt("Masukkan Link URL Foto baru untuk " + namaSiswaAktif + ":", dataSiswa.avatar_url || "");
    if (urlBaru === null) return; 

    if (urlBaru.trim() === "") {
        alert("URL tidak boleh kosong!");
        return;
    }

    try {
        const { error } = await supabase
            .from('students')
            .update({ avatar_url: urlBaru.trim() })
            .eq('id', dataSiswa.id);

        if (error) throw error;

        alert("Foto profil " + namaSiswaAktif + " berhasil diperbarui!");
        
        const modalDetail = document.getElementById('UserDetailModal');
        if (modalDetail) modalDetail.classList.add('hidden');
        
        await ambilDanTampilkanRanking();

    } catch (err) {
        alert("Gagal memperbarui foto: " + err.message);
    }
};

// =======================================================
// 7.5. FITUR EDIT NAMA SISWA (DARI MODAL DETAIL)
// =======================================================
window.editNamaSiswa = async function() {
    // Cek apakah user adalah admin
    const isAdmin = window.currentRole === 'admin';
    if (!isAdmin) {
        alert("❌ Hanya admin yang bisa mengedit nama siswa!");
        return;
    }

    // Ambil nama siswa yang sedang aktif di modal
    const namaLama = document.getElementById('modalName').innerText;
    const dataSiswa = localStudentsData.find(s => s.name === namaLama);
    
    if (!dataSiswa) {
        alert("❌ Gagal mendeteksi data siswa!");
        return;
    }

    // Prompt untuk input nama baru
    const namaBaru = prompt(
        "✏️ Edit Nama Siswa\n\n" +
        "Nama lama: " + namaLama + "\n\n" +
        "Masukkan nama baru:",
        namaLama
    );

    // Jika user klik Cancel atau nama kosong
    if (namaBaru === null) return;
    if (namaBaru.trim() === "") {
        alert("❌ Nama tidak boleh kosong!");
        return;
    }

    // Jika nama sama dengan nama lama, tidak perlu update
    if (namaBaru.trim() === namaLama) {
        alert("ℹ️ Nama tidak berubah.");
        return;
    }

    // Cek apakah nama sudah digunakan oleh siswa lain
    const namaSudahAda = localStudentsData.some(s => 
        s.name.toLowerCase() === namaBaru.trim().toLowerCase() && 
        s.id !== dataSiswa.id
    );

    if (namaSudahAda) {
        alert("❌ Nama '" + namaBaru.trim() + "' sudah digunakan oleh siswa lain!");
        return;
    }

    try {
        // Update nama di database
        const { error } = await supabase
            .from('students')
            .update({ name: namaBaru.trim() })
            .eq('id', dataSiswa.id);

        if (error) throw error;

        alert("✅ Nama siswa berhasil diubah menjadi: " + namaBaru.trim());
        
        // Tutup modal
        const modalDetail = document.getElementById('UserDetailModal');
        if (modalDetail) modalDetail.classList.add('hidden');
        
        // Refresh data
        await ambilDanTampilkanRanking();
        
        // Buka kembali modal dengan data baru (opsional)
        const updatedIndex = localStudentsData.findIndex(s => s.id === dataSiswa.id);
        if (updatedIndex !== -1) {
            setTimeout(() => {
                window.viewUserDetail(updatedIndex + 1);
            }, 300);
        }

    } catch (err) {
        console.error('❌ Error edit nama:', err);
        alert("❌ Gagal mengubah nama: " + err.message);
    }
};

// =======================================================
// 7.6. FUNGSI BUKA EDIT NAMA DARI PANEL ADMIN
// =======================================================
window.bukaEditNama = function() {
    // Cek apakah user adalah admin
    const isAdmin = window.currentRole === 'admin';
    if (!isAdmin) {
        alert("❌ Hanya admin yang bisa mengedit nama siswa!");
        return;
    }

    // Cek apakah ada data siswa
    if (!localStudentsData || localStudentsData.length === 0) {
        alert("❌ Belum ada data siswa!");
        return;
    }

    // Buat daftar pilihan siswa
    let daftarSiswa = "📋 PILIH SISWA YANG INGIN DIEDIT:\n\n";
    daftarSiswa += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    
    localStudentsData.forEach((s, i) => {
        const rank = i + 1;
        const bintang = s.stars || 0;
        const starIcon = bintang >= 15 ? '⭐⭐⭐' : bintang >= 10 ? '⭐⭐' : bintang >= 5 ? '⭐' : '☆';
        daftarSiswa += `${rank}. ${s.name} ${starIcon} (${bintang} bintang)\n`;
    });
    
    daftarSiswa += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    daftarSiswa += "\nMasukkan NOMOR URUT siswa (1-" + localStudentsData.length + "):";

    // Prompt untuk memilih siswa
    const pilihan = prompt(daftarSiswa);
    if (pilihan === null) return;

    // Validasi input
    const index = parseInt(pilihan) - 1;
    if (isNaN(index) || index < 0 || index >= localStudentsData.length) {
        alert("❌ Pilihan tidak valid! Masukkan angka antara 1 - " + localStudentsData.length);
        return;
    }

    const dataSiswa = localStudentsData[index];
    
    // Prompt untuk input nama baru
    const namaBaru = prompt(
        "✏️ EDIT NAMA SISWA\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        "Nama lama: " + dataSiswa.name + "\n" +
        "Ranking: #" + (index + 1) + "\n" +
        "Bintang: " + dataSiswa.stars + " ⭐\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
        "Masukkan NAMA BARU:",
        dataSiswa.name
    );

    // Jika user klik Cancel atau nama kosong
    if (namaBaru === null) return;
    
    if (namaBaru.trim() === "") {
        alert("❌ Nama tidak boleh kosong!");
        return;
    }

    // Jika nama sama dengan nama lama
    if (namaBaru.trim() === dataSiswa.name) {
        alert("ℹ️ Nama tidak berubah.");
        return;
    }

    // Cek apakah nama sudah digunakan oleh siswa lain
    const namaSudahAda = localStudentsData.some(s => 
        s.name.toLowerCase() === namaBaru.trim().toLowerCase() && 
        s.id !== dataSiswa.id
    );

    if (namaSudahAda) {
        alert("❌ Nama '" + namaBaru.trim() + "' sudah digunakan oleh siswa lain!");
        return;
    }

    // Konfirmasi perubahan
    const konfirmasi = confirm(
        "⚠️ KONFIRMASI PERUBAHAN NAMA\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        "Nama lama: " + dataSiswa.name + "\n" +
        "Nama baru: " + namaBaru.trim() + "\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
        "Apakah Anda yakin ingin mengubah nama siswa ini?"
    );

    if (!konfirmasi) return;

    // Proses update nama di database
    try {
        const { error } = await supabase
            .from('students')
            .update({ name: namaBaru.trim() })
            .eq('id', dataSiswa.id);

        if (error) throw error;

        alert("✅ Nama siswa berhasil diubah menjadi: " + namaBaru.trim());
        
        // Refresh data
        ambilDanTampilkanRanking();

    } catch (err) {
        console.error('❌ Error edit nama:', err);
        alert("❌ Gagal mengubah nama: " + err.message);
    }
};

// =======================================================
// 8. FUNGSI UPLOAD FOTO DARI FILE (DENGAN AUTO-DELETE)
// =======================================================
window.handleModalPhotoUpload = async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validasi file
    if (!file.type.startsWith('image/')) {
        alert('❌ File harus berupa gambar!');
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        alert('❌ Ukuran file maksimal 2MB!');
        return;
    }

    // Cek apakah user adalah admin
    const isAdmin = window.currentRole === 'admin';
    if (!isAdmin) {
        alert("❌ Hanya admin yang bisa mengganti foto!");
        return;
    }

    const namaSiswaAktif = document.getElementById('modalName').innerText;
    let dataSiswa = localStudentsData.find(s => s.name === namaSiswaAktif);
    if (!dataSiswa) return alert("❌ Gagal mendeteksi data siswa!");

    try {
        // ==============================================
        // 1. HAPUS FOTO LAMA JIKA ADA (AUTO-DELETE)
        // ==============================================
        if (dataSiswa.avatar_url) {
            const oldFilePath = dataSiswa.avatar_url.split('/').pop();
            if (oldFilePath) {
                const oldPath = `avatars/${oldFilePath}`;
                console.log('Menghapus foto lama:', oldPath);
                
                const { error: deleteError } = await supabase.storage
                    .from('student-avatars')
                    .remove([oldPath]);
                
                if (deleteError) {
                    console.warn('Gagal hapus foto lama:', deleteError.message);
                } else {
                    console.log('✅ Foto lama berhasil dihapus');
                }
            }
        }

        // ==============================================
        // 2. UPLOAD FOTO BARU
        // ==============================================
        const fileExt = file.name.split('.').pop();
        const fileName = `avatar_${dataSiswa.id}_${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('student-avatars')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            if (uploadError.message.includes('bucket not found')) {
                throw new Error('Bucket storage belum dibuat. Silakan gunakan metode link URL.');
            }
            throw uploadError;
        }

        // Dapatkan URL public
        const { data: urlData } = supabase.storage
            .from('student-avatars')
            .getPublicUrl(filePath);

        const publicUrl = urlData.publicUrl;

        // ==============================================
        // 3. UPDATE DATABASE DENGAN URL BARU
        // ==============================================
        const { error: updateError } = await supabase
            .from('students')
            .update({ avatar_url: publicUrl })
            .eq('id', dataSiswa.id);

        if (updateError) throw updateError;

        alert("✅ Foto profil berhasil diupload dan foto lama dihapus!");
        
        // Refresh data
        await ambilDanTampilkanRanking();
        
        // Tutup modal
        const modalDetail = document.getElementById('UserDetailModal');
        if (modalDetail) modalDetail.classList.add('hidden');

    } catch (err) {
        console.error('Upload error:', err);
        alert("❌ Gagal upload foto: " + err.message);
    }
    
    // Reset input
    event.target.value = '';
};

// =======================================================
// 9. FUNGSI CLEANUP UNUSED AVATARS (HAPUS FOTO TIDAK TERPAKAI)
// =======================================================
window.cleanupUnusedAvatars = async function() {
    // Konfirmasi sebelum menjalankan
    const konfirmasi = confirm(
        "⚠️ PERINGATAN!\n\n" +
        "Fungsi ini akan menghapus semua file foto di storage\n" +
        "yang TIDAK TERPAKAI oleh siswa di database.\n\n" +
        "Apakah Anda yakin ingin melanjutkan?"
    );
    
    if (!konfirmasi) return;

    try {
        // 1. Ambil semua file di bucket 'student-avatars'
        console.log("📁 Mengambil daftar file dari storage...");
        const { data: files, error: listError } = await supabase.storage
            .from('student-avatars')
            .list('avatars/');

        if (listError) throw listError;

        if (!files || files.length === 0) {
            alert("📁 Storage kosong! Tidak ada file untuk dibersihkan.");
            return;
        }

        console.log(`📁 Ditemukan ${files.length} file di storage`);

        // 2. Ambil semua avatar_url dari database (yang sedang terpakai)
        console.log("📊 Mengambil data siswa dari database...");
        const { data: students, error: studentError } = await supabase
            .from('students')
            .select('avatar_url');

        if (studentError) throw studentError;

        // 3. Buat daftar nama file yang TERPAKAI
        const usedFileNames = new Set();
        students.forEach(s => {
            if (s.avatar_url) {
                const fileName = s.avatar_url.split('/').pop();
                if (fileName) {
                    usedFileNames.add(fileName);
                }
            }
        });

        console.log(`📊 ${usedFileNames.size} file terpakai oleh siswa`);

        // 4. Cari file yang TIDAK terpakai
        const unusedFiles = [];
        for (const file of files) {
            if (!usedFileNames.has(file.name)) {
                unusedFiles.push(file);
            }
        }

        if (unusedFiles.length === 0) {
            alert("✅ Semua file storage terpakai! Tidak ada yang perlu dibersihkan.");
            return;
        }

        console.log(`🗑️ Menemukan ${unusedFiles.length} file tidak terpakai`);

        // 5. Konfirmasi lagi sebelum hapus
        const konfirmasiHapus = confirm(
            `📊 Ringkasan:\n\n` +
            `📁 Total file di storage: ${files.length}\n` +
            `✅ File terpakai: ${usedFileNames.size}\n` +
            `🗑️ File tidak terpakai: ${unusedFiles.length}\n\n` +
            `Apakah Anda yakin ingin menghapus ${unusedFiles.length} file tidak terpakai?`
        );

        if (!konfirmasiHapus) return;

        // 6. Hapus file yang tidak terpakai
        let deletedCount = 0;
        let failedCount = 0;

        for (const file of unusedFiles) {
            const filePath = `avatars/${file.name}`;
            const { error: deleteError } = await supabase.storage
                .from('student-avatars')
                .remove([filePath]);

            if (deleteError) {
                console.error(`❌ Gagal hapus ${file.name}:`, deleteError.message);
                failedCount++;
            } else {
                deletedCount++;
                console.log(`✅ Berhasil hapus: ${file.name}`);
            }
        }

        // 7. Tampilkan hasil
        alert(
            `✅ CLEANUP SELESAI!\n\n` +
            `🗑️ Berhasil dihapus: ${deletedCount} file\n` +
            `❌ Gagal dihapus: ${failedCount} file\n` +
            `📁 Sisa file di storage: ${files.length - deletedCount} file`
        );

        console.log(`✅ Cleanup selesai! Terhapus: ${deletedCount}, Gagal: ${failedCount}`);

    } catch (err) {
        console.error('❌ Error cleanup:', err);
        alert("❌ Gagal membersihkan storage: " + err.message);
    }
};

// =======================================================
// 10. FUNGSI CEK STORAGE USAGE
// =======================================================
window.checkStorageUsage = async function() {
    try {
        const { data: files, error } = await supabase.storage
            .from('student-avatars')
            .list('avatars/');

        if (error) throw error;

        let totalSize = 0;
        if (files && files.length > 0) {
            files.forEach(file => {
                totalSize += file.metadata?.size || 0;
            });
        }

        const sizeInMB = (totalSize / 1024 / 1024).toFixed(2);
        const fileCount = files?.length || 0;

        alert(
            `📊 STATUS STORAGE\n\n` +
            `📁 Total File: ${fileCount} foto\n` +
            `💾 Total Ukuran: ${sizeInMB} MB\n` +
            `📌 Rata-rata: ${fileCount > 0 ? (totalSize / fileCount / 1024).toFixed(0) : 0} KB/foto\n\n` +
            `🆓 Free Tier Supabase: 1 GB\n` +
            `📊 Terpakai: ${((totalSize / 1024 / 1024 / 1024) * 100).toFixed(2)}% dari 1 GB`
        );

    } catch (err) {
        console.error('Error cek storage:', err);
        alert("❌ Gagal cek storage: " + err.message);
    }
};

// =======================================================
// 11. INITIALIZATION & RUN ON LOAD
// =======================================================
window.ambilDanTampilkanRanking = ambilDanTampilkanRanking;

// Jalankan fungsi saat web dibuka
ambilDanTampilkanRanking();

// =======================================================
// 12. FUNGSI PENYELAMAT UNTUK MENUTUP MODAL
// =======================================================
window.closeUserDetailModal = function() {
    const modal = document.getElementById('UserDetailModal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

window.closeTransactionModal = function() {
    const modal = document.getElementById('TransactionModal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

window.closeAddStudentModal = function() {
    const modal = document.getElementById('addStudentModal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

// =======================================================
// 13. FITUR IMPORT SISWA DARI TEMPLATE EXCEL (VERSI TERBARU)
// =======================================================
window.handleExcelImport = async function(event) {
    const file = event.target.files[0];
    if (!file) {
        alert("❌ Pilih file terlebih dahulu!");
        return;
    }

    // Cek ekstensi file
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(fileExt)) {
        alert("❌ Format file harus .xlsx atau .xls!");
        return;
    }

    // Cek apakah user adalah admin
    const isAdmin = window.currentRole === 'admin';
    if (!isAdmin) {
        alert("❌ Hanya admin yang bisa import data!");
        return;
    }

    // Konfirmasi sebelum import
    const konfirmasi = confirm(
        `⚠️ Anda akan mengimpor data dari file:\n\n` +
        `${file.name}\n\n` +
        `Pastikan format file sudah benar:\n` +
        `- Kolom "nama" (WAJIB)\n` +
        `- Kolom "avatar_url" (Opsional)\n` +
        `- Kolom "bintang_awal" (Opsional)\n\n` +
        `Lanjutkan?`
    );
    if (!konfirmasi) {
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonRows = XLSX.utils.sheet_to_json(worksheet);
            
            console.log("📊 Data Excel terbaca:", jsonRows);
            console.log("📊 Jumlah baris:", jsonRows.length);
            
            if (jsonRows.length === 0) {
                alert("❌ File Excel kosong atau format tidak sesuai!");
                event.target.value = '';
                return;
            }

            // Validasi format: kolom 'nama' wajib ada
            const rowSampel = jsonRows[0];
            console.log("📊 Kolom yang ditemukan:", Object.keys(rowSampel));
            
            if (!rowSampel.hasOwnProperty('nama')) {
                alert(
                    "❌ Format Excel salah!\n\n" +
                    "Kolom yang ditemukan: " + Object.keys(rowSampel).join(', ') + "\n\n" +
                    "Pastikan kolom header ada 'nama' (huruf kecil semua).\n\n" +
                    "Gunakan tombol 'Download Template' untuk contoh format yang benar."
                );
                event.target.value = '';
                return;
            }

            let jumlahSukses = 0;
            let jumlahGagal = 0;
            let daftarSukses = [];
            let daftarGagal = [];

            // Loop setiap baris
            for (let i = 0; i < jsonRows.length; i++) {
                const row = jsonRows[i];
                const namaSiswa = row.nama ? row.nama.toString().trim() : '';
                const avatarSiswa = row.avatar_url ? row.avatar_url.toString().trim() : '';
                const bintangAwal = row.bintang_awal ? parseInt(row.bintang_awal) : 0;

                console.log(`📝 Baris ${i+1}:`, { namaSiswa, avatarSiswa, bintangAwal });

                if (namaSiswa === '') {
                    jumlahGagal++;
                    daftarGagal.push(`Baris ${i+1}: Nama kosong`);
                    continue;
                }

                try {
                    // Cek apakah siswa sudah ada
                    const { data: existingStudent, error: checkError } = await supabase
                        .from('students')
                        .select('id')
                        .eq('name', namaSiswa)
                        .maybeSingle();

                    if (checkError) {
                        console.error('Error cek siswa:', checkError);
                        jumlahGagal++;
                        daftarGagal.push(`${namaSiswa}: Error cek data`);
                        continue;
                    }

                    let result;
                    if (existingStudent) {
                        // UPDATE jika sudah ada
                        console.log(`📝 Mengupdate siswa: ${namaSiswa}`);
                        const updatePayload = { stars: bintangAwal };
                        if (avatarSiswa && avatarSiswa !== '') {
                            updatePayload.avatar_url = avatarSiswa;
                        }
                        result = await supabase
                            .from('students')
                            .update(updatePayload)
                            .eq('id', existingStudent.id);
                    } else {
                        // INSERT jika baru
                        console.log(`➕ Menambah siswa baru: ${namaSiswa}`);
                        const payload = { name: namaSiswa, stars: bintangAwal };
                        if (avatarSiswa && avatarSiswa !== '') {
                            payload.avatar_url = avatarSiswa;
                        }
                        result = await supabase.from('students').insert([payload]);
                    }

                    if (result.error) {
                        console.error(`❌ Gagal ${existingStudent ? 'update' : 'insert'} ${namaSiswa}:`, result.error);
                        jumlahGagal++;
                        daftarGagal.push(`${namaSiswa}: ${result.error.message}`);
                    } else {
                        console.log(`✅ Berhasil ${existingStudent ? 'update' : 'insert'} ${namaSiswa}`);
                        jumlahSukses++;
                        daftarSukses.push(namaSiswa + (existingStudent ? ' (update)' : ' (baru)'));
                    }

                } catch (err) {
                    console.error(`❌ Error proses ${namaSiswa}:`, err);
                    jumlahGagal++;
                    daftarGagal.push(`${namaSiswa}: ${err.message}`);
                }
            }

            // Tampilkan hasil
            let pesan = `✅ IMPORT SELESAI!\n\n`;
            pesan += `📊 Total data: ${jsonRows.length} baris\n`;
            pesan += `✅ Berhasil: ${jumlahSukses} siswa\n`;
            pesan += `❌ Gagal: ${jumlahGagal} siswa\n\n`;
            
            if (daftarSukses.length > 0 && daftarSukses.length <= 10) {
                pesan += `📋 Berhasil:\n`;
                daftarSukses.forEach(item => {
                    pesan += `  ✅ ${item}\n`;
                });
            } else if (daftarSukses.length > 10) {
                pesan += `📋 ${daftarSukses.length} siswa berhasil diproses\n`;
            }
            
            if (daftarGagal.length > 0) {
                pesan += `\n❌ Gagal:\n`;
                daftarGagal.slice(0, 5).forEach(item => {
                    pesan += `  ❌ ${item}\n`;
                });
                if (daftarGagal.length > 5) {
                    pesan += `  ... dan ${daftarGagal.length - 5} lainnya`;
                }
            }

            alert(pesan);
            
            // Reset input file
            event.target.value = '';

            // Refresh data
            if (jumlahSukses > 0) {
                console.log("🔄 Refresh data...");
                await ambilDanTampilkanRanking();
                console.log("✅ Refresh selesai!");
            }

        } catch (error) {
            console.error('❌ Error import:', error);
            alert("❌ Gagal membaca file Excel: " + error.message);
            event.target.value = '';
        }
    };
    
    reader.onerror = function() {
        alert("❌ Gagal membaca file!");
        event.target.value = '';
    };
    
    reader.readAsArrayBuffer(file);
};

// =======================================================
// 14. FITUR DOWNLOAD TEMPLATE EXCEL
// =======================================================
window.downloadExcelTemplate = function() {
    try {
        console.log("Memulai proses pembuatan template Excel...");
        
        if (typeof XLSX === 'undefined') {
            alert("❌ Library Excel belum siap! Pastikan CDN SheetJS sudah terpasang di index.html");
            return;
        }

        const templateData = [
            {
                "nama": "Contoh Nama Siswa",
                "avatar_url": "https://picsum.photos/seed/siswa/150/150",
                "bintang_awal": 5
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template Siswa");

        XLSX.writeFile(workbook, "Template_Import_Siswa_Megabond.xlsx");
        console.log("✅ Template Excel sukses diunduh.");
    } catch (error) {
        console.error("Eror download template:", error);
        alert("❌ Gagal membuat template Excel! Periksa log console.");
    }
};

console.log("✅ app.js berhasil dimuat dengan semua fitur!");
