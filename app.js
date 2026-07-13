import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Menggunakan Project URL dan Anon Key baru milik Anda
const SUPABASE_URL = "https://cprpizbcfvmwnumhkkwh.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcnBpemJjZnZtd251bWhra3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2Nzg3MjIsImV4cCI6MjA5OTI1NDcyMn0.teTEiRY0wA4FKrEN3xGYW8kZ79UTt3y4_m-XNpXGgWo"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

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
};

// =======================================================
// 1. ATURAN SKOR & TIER BINTANG (KONFIGURASI UTAMA)
// =======================================================
const TIER_RULES = [
    { name: 'KOSONG', min: 0, icon: 'fa-solid fa-star text-slate-600', textGlow: 'text-shadow-none', color: 'from-slate-800 to-slate-900' },
    { name: 'CHROME TIER', min: 1, icon: 'fa-solid fa-star text-slate-400', textGlow: 'text-glow-chrome', color: 'from-slate-600 to-slate-500' },
    { name: 'BRONZE TIER', min: 6, icon: 'fa-solid fa-star text-amber-600', textGlow: 'text-glow-bronze', color: 'from-amber-800 to-amber-700' },
    { name: 'SILVER TIER', min: 11, icon: 'fa-solid fa-award text-slate-300', textGlow: 'text-glow-silver', color: 'from-slate-400 to-slate-300' },
    { name: 'GOLD TIER', min: 21, icon: 'fa-solid fa-medal text-yellow-400', textGlow: 'text-glow-gold', color: 'from-yellow-600 to-yellow-400' },
    { name: 'PLATINUM TIER', min: 31, icon: 'fa-solid fa-shield-halved text-teal-400', textGlow: 'text-glow-platinum', color: 'from-teal-600 to-teal-400' },
    { name: 'DIAMOND TIER', min: 41, icon: 'fa-solid fa-gem text-purple-400', textGlow: 'text-glow-diamond', color: 'from-purple-600 to-indigo-500' },
    { name: 'LEGEND TIER', min: 51, icon: 'fa-solid fa-bolt text-red-500 animate-pulse', textGlow: 'text-glow-legend', color: 'from-red-600 to-amber-500' }
];

function hitungTierSiswa(bintang) {
    let tierAktif = TIER_RULES[0];
    for (let i = 0; i < TIER_RULES.length; i++) {
        if (bintang >= TIER_RULES[i].min) {
            tierAktif = TIER_RULES[i];
        }
    }
    return tierAktif;
}

// =======================================================
// 2. AMBIL DATA DARI SUPABASE DAN TAMPILKAN KE UI
// =======================================================
window.ambilDanTampilkanRanking = async function() {
    try {
        updateIndikatorKoneksi('Connecting...', 'yellow');

        const { data, error } = await supabase
            .from('students')
            .select('*')
            .order('stars', { ascending: false })
            .order('name', { ascending: true });

        if (error) throw error;

        localStudentsData = data || [];
        updateIndikatorKoneksi('Connected', 'emerald');

        // Jika user aktif belum dipilih, pilih data pertama
        if (!window.currentSelectedStudentId && localStudentsData.length > 0) {
            window.currentSelectedStudentId = localStudentsData[0].id;
        }

        renderUserSwitcherDropdown();
        renderTopPodium();
        renderLeaderboard();
        renderAdminPanelList();
        updateTampilanAvatarHeader();

    } catch (error) {
        console.error("Gagal mengambil data ranking:", error.message);
        updateIndikatorKoneksi('Error Sync', 'rose');
    }
};

function updateIndikatorKoneksi(teks, warnaClass) {
    const indicator = document.getElementById('dbStatusIndicator');
    const statusText = document.getElementById('dbStatusText');
    if (indicator) indicator.className = `w-2 h-2 rounded-full bg-${warnaClass}-500 animate-pulse`;
    if (statusText) statusText.innerText = teks;
}

// =======================================================
// 3. LOGIKA UNTUK DROPDOWN SWITCHER (MASUK SEBAGAI)
// =======================================================
function renderUserSwitcherDropdown() {
    const selector = document.getElementById('currentUserSelector');
    if (!selector) return;

    selector.innerHTML = localStudentsData.map(siswa => 
        `<option value="${siswa.id}" ${siswa.id === window.currentSelectedStudentId ? 'selected' : ''}>${siswa.name}</option>`
    ).join('');
}

window.changeActiveUser = function(id) {
    window.currentSelectedStudentId = isNaN(id) ? id : parseInt(id);
    updateTampilanAvatarHeader();
};

function updateTampilanAvatarHeader() {
    const siswaAktif = localStudentsData.find(s => s.id === window.currentSelectedStudentId);
    const avatarImg = document.getElementById('currentActiveAvatar');
    const uploadLabel = document.getElementById('headerPhotoUploadLabel');

    if (siswaAktif && avatarImg) {
        avatarImg.src = siswaAktif.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${siswaAktif.id}`;
    }

    if (uploadLabel) {
        if (window.currentRole === 'user') {
            uploadLabel.classList.remove('hidden');
        } else {
            uploadLabel.classList.add('hidden');
        }
    }
}

// =======================================================
// 4. RENDER TOP PODIUM (RANK 1, 2, 3) & HIGHLIGHT CARD (4 & 5)
// =======================================================
function renderTopPodium() {
    const r1 = localStudentsData[0];
    const r2 = localStudentsData[1];
    const r3 = localStudentsData[2];
    const r4 = localStudentsData[3];
    const r5 = localStudentsData[4];

    // Podium 1
    const p1 = document.getElementById('podium-1');
    if (r1 && p1) {
        p1.style.opacity = '1';
        document.getElementById('p1-name').innerText = r1.name;
        document.getElementById('p1-stars').innerText = r1.stars;
        document.getElementById('p1-avatar').src = r1.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${r1.id}`;
    } else if (p1) { p1.style.opacity = '0'; }

    // Podium 2
    const p2 = document.getElementById('podium-2');
    if (r2 && p2) {
        p2.style.opacity = '1';
        document.getElementById('p2-name').innerText = r2.name;
        document.getElementById('p2-stars').innerText = r2.stars;
        document.getElementById('p2-avatar').src = r2.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${r2.id}`;
    } else if (p2) { p2.style.opacity = '0'; }

    // Podium 3
    const p3 = document.getElementById('podium-3');
    if (r3 && p3) {
        p3.style.opacity = '1';
        document.getElementById('p3-name').innerText = r3.name;
        document.getElementById('p3-stars').innerText = r3.stars;
        document.getElementById('p3-avatar').src = r3.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${r3.id}`;
    } else if (p3) { p3.style.opacity = '0'; }

    // Card Rank 4
    const c4 = document.getElementById('card-rank-4');
    if (r4 && c4) {
        c4.style.display = 'block';
        document.getElementById('p4-name').innerText = r4.name;
        document.getElementById('p4-stars').innerText = r4.stars;
        document.getElementById('p4-avatar').src = r4.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${r4.id}`;
    } else if (c4) { c4.style.display = 'none'; }

    // Card Rank 5
    const c5 = document.getElementById('card-rank-5');
    if (r5 && c5) {
        c5.style.display = 'block';
        document.getElementById('p5-name').innerText = r5.name;
        document.getElementById('p5-stars').innerText = r5.stars;
        document.getElementById('p5-avatar').src = r5.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${r5.id}`;
    } else if (c5) { c5.style.display = 'none'; }
}

// =======================================================
// 5. RENDER DAFTAR KLASEMEN UTAMA & PENCARIAN
// =======================================================
window.renderLeaderboard = function() {
    const container = document.getElementById('leaderboardList');
    if (!container) return;

    const kataKunci = (document.getElementById('studentSearch')?.value || '').toLowerCase();
    const dataFilter = localStudentsData.filter(s => s.name.toLowerCase().includes(kataKunci));

    if (dataFilter.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 text-center py-8">Siswa tidak ditemukan.</p>`;
        return;
    }

    container.innerHTML = dataFilter.map(siswa => {
        const urutanAsli = localStudentsData.findIndex(s => s.id === siswa.id) + 1;
        const infoTier = hitungTierSiswa(siswa.stars);
        const apakahSaya = siswa.id === window.currentSelectedStudentId;

        return `
            <div onclick="window.viewUserDetailByStudentId(${siswa.id})" class="leaderboard-item flex items-center justify-between p-3 rounded-xl bg-slate-900/40 hover:bg-brand-950/30 border ${apakahSaya ? 'border-brand-500 bg-brand-950/20' : 'border-slate-900'} hover:border-purple-900/40 cursor-pointer transition-all">
                <div class="flex items-center gap-3">
                    <span class="heading-font text-xs font-black text-slate-500 w-5 text-center">#${urutanAsli}</span>
                    <img src="${siswa.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${siswa.id}`}" class="w-8 h-8 rounded-full object-cover border border-slate-800">
                    <div>
                        <h4 class="text-xs font-bold ${apakahSaya ? 'text-brand-300' : 'text-slate-200'} line-clamp-1">${siswa.name}</h4>
                        <p class="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <i class="${infoTier.icon}"></i> ${infoTier.name}
                        </p>
                    </div>
                </div>
                <div class="text-yellow-400 font-bold text-xs flex items-center gap-1">
                    <i class="fa-solid fa-star ${infoTier.textGlow}"></i> ${siswa.stars}
                </div>
            </div>
        `;
    }).join('');
};

// =======================================================
// 6. RENDER DAFTAR SISWA DI PANEL KENDALI ADMIN
// =======================================================
function renderAdminPanelList() {
    const container = document.getElementById('adminStudentList');
    if (!container) return;

    container.innerHTML = localStudentsData.map(siswa => `
        <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 overflow-hidden">
                <img src="${siswa.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${siswa.id}`}" class="w-7 h-7 rounded-full object-cover flex-shrink-0">
                <span class="text-xs font-bold text-slate-300 truncate">${siswa.name}</span>
            </div>
            <div class="flex items-center gap-1">
                <span class="text-[10px] bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded font-extrabold"><i class="fa-solid fa-star text-yellow-500"></i> ${siswa.stars}</span>
                <button onclick="window.viewUserDetailByStudentId(${siswa.id})" class="text-[10px] bg-slate-800 hover:bg-brand-600 text-white p-1 rounded transition-colors" title="Edit/Kelola"><i class="fa-solid fa-pen-to-square"></i></button>
            </div>
        </div>
    `).join('');
}

// =======================================================
// 7. POPUP MODAL DETAIL DATA SISWA & LOG HISTORI
// =======================================================
window.viewUserDetail = function(podiumRank) {
    const dataSiswa = localStudentsData[podiumRank - 1];
    if (dataSiswa) bukaModalDetailSiswa(dataSiswa, podiumRank);
};

window.viewUserDetailByStudentId = function(id) {
    const index = localStudentsData.findIndex(s => s.id === id);
    if (index !== -1) {
        bukaModalDetailSiswa(localStudentsData[index], index + 1);
    }
};

// Objek penampung data siswa yang sedang dibuka di modal detail
window.currentSelectedUserForModal = null;

async function bukaModalDetailSiswa(siswa, rank) {
    window.currentSelectedUserForModal = siswa;
    const infoTier = hitungTierSiswa(siswa.stars);

    document.getElementById('modalName').innerText = siswa.name;
    document.getElementById('modalRankLabel').innerText = `#${rank}`;
    document.getElementById('modalTierName').innerHTML = `<i class="${infoTier.icon}"></i> ${infoTier.name}`;
    document.getElementById('modalTotalStarsText').innerHTML = `<i class="fa-solid fa-star"></i> ${siswa.stars} Bintang`;
    
    const imgAvatar = document.getElementById('modalAvatar');
    if (imgAvatar) imgAvatar.src = siswa.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${siswa.id}`;

    // Menampilkan ikon upload berdasarkan role
    const lblUploadAdmin = document.getElementById('modalPhotoUploadLabel');
    if (lblUploadAdmin) {
        if (window.currentRole === 'admin') {
            lblUploadAdmin.classList.remove('hidden');
        } else {
            lblUploadAdmin.classList.add('hidden');
        }
    }

    // Render Bintang Animasi
    const boxBintang = document.getElementById('modalStarIcons');
    if (boxBintang) {
        boxBintang.innerHTML = '';
        const limitRender = Math.min(siswa.stars, 15);
        for (let i = 0; i < limitRender; i++) {
            boxBintang.innerHTML += `<i class="fa-solid fa-star text-yellow-400 text-xs animate-float" style="animation-delay: ${i * 0.1}s"></i>`;
        }
        if (siswa.stars > 15) {
            boxBintang.innerHTML += `<span class="text-xs font-bold text-yellow-500 ml-1">+${siswa.stars - 15}</span>`;
        }
    }

    // Tombol Hapus khusus admin
    const boxTombolHapus = document.getElementById('modalAdminDeleteBtnContainer');
    if (boxTombolHapus) {
        if (window.currentRole === 'admin') {
            boxTombolHapus.classList.remove('hidden');
            document.getElementById('btnDeleteStudent').onclick = () => window.hapusSiswaDariDatabase(siswa.id);
        } else {
            boxTombolHapus.classList.add('hidden');
        }
    }

    document.getElementById('UserDetailModal').classList.remove('hidden');

    // Load Log Catatan Histori Bintang
    const boxHistori = document.getElementById('modalHistoryContainer');
    if (!boxHistori) return;
    boxHistori.innerHTML = `<p class="text-[10px] text-slate-500 text-center py-2">Memuat riwayat...</p>`;

    try {
        const { data: logs, error } = await supabase
            .from('star_logs')
            .select('*')
            .eq('student_id', siswa.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!logs || logs.length === 0) {
            boxHistori.innerHTML = `<p class="text-[11px] text-slate-500 text-center py-2">Tidak ada riwayat catatan.</p>`;
        } else {
            boxHistori.innerHTML = logs.map(log => {
                const isPlus = log.type === 'achievement';
                const iconClass = isPlus ? 'fa-solid fa-circle-plus text-emerald-400' : 'fa-solid fa-circle-minus text-rose-400';
                const badgeColor = isPlus ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' : 'bg-rose-950/40 text-rose-400 border-rose-900/30';
                const formatTgl = new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

                return `
                    <div class="p-2 rounded-xl border ${badgeColor} flex items-start justify-between gap-2 text-[11px]">
                        <div class="flex gap-2 items-start">
                            <i class="${iconClass} mt-0.5 flex-shrink-0"></i>
                            <div>
                                <p class="font-bold text-slate-200">${log.description}</p>
                                <p class="text-[9px] text-slate-500 mt-0.5">${formatTgl}</p>
                            </div>
                        </div>
                        <span class="font-black">${isPlus ? '+' : '-'}${log.amount} ⭐</span>
                    </div>
                `;
            }).join('');
        }
    } catch (e) {
        boxHistori.innerHTML = `<p class="text-[11px] text-rose-400 text-center py-2">Gagal memuat riwayat.</p>`;
    }
}

window.closeUserDetailModal = function() {
    document.getElementById('UserDetailModal').classList.add('hidden');
    window.currentSelectedUserForModal = null;
};

// =======================================================
// 8. PANEL INPUT DATA SISWA BARU (ADMIN MODE)
// =======================================================
window.openAddStudentModal = function() { document.getElementById('addStudentModal').classList.remove('hidden'); };
window.closeAddStudentModal = function() { document.getElementById('addStudentModal').classList.add('hidden'); document.getElementById('addStudentForm').reset(); };

window.handleAddStudent = async function(e) {
    e.preventDefault();
    tampilkanScreenLoading(true);

    const namaSiswa = document.getElementById('newStudentName').value;
    const inputAvatar = document.getElementById('newStudentAvatar').value.trim();
    const bintangAwal = parseInt(document.getElementById('newStudentStars').value) || 0;

    const urlAvatarFinal = inputAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(namaSiswa)}`;

    try {
        const { error } = await supabase
            .from('students')
            .insert([{ name: namaSiswa, avatar_url: urlAvatarFinal, stars: bintangAwal }]);

        if (error) throw error;

        alert(`✅ Berhasil menambahkan siswa baru: ${namaSiswa}`);
        window.closeAddStudentModal();
        await window.ambilDanTampilkanRanking();
    } catch (err) {
        alert("❌ Gagal menambah siswa: " + err.message);
    } finally {
        tampilkanScreenLoading(false);
    }
};

// =======================================================
// 9. PANEL INPUT TRANSAKSI CATATAN BINTANG (ADMIN MODE)
// =======================================================
window.openTransactionModal = function() {
    const select = document.getElementById('transactionStudentSelect');
    if (!select) return;

    select.innerHTML = '<option value="">-- Pilih Siswa --</option>' + localStudentsData.map(siswa => 
        `<option value="${siswa.id}">${siswa.name} (Sekarang: ${siswa.stars} ⭐)</option>`
    ).join('');

    document.getElementById('TransactionModal').classList.remove('hidden');
};

window.closeTransactionModal = function() {
    document.getElementById('TransactionModal').classList.add('hidden');
    document.getElementById('transactionForm').reset();
    window.setTransactionType('achievement');
};

window.handleTransaction = async function(e) {
    e.preventDefault();
    tampilkanScreenLoading(true);

    const idSiswa = parseInt(document.getElementById('transactionStudentSelect').value);
    const nominalBintang = parseInt(document.getElementById('transactionStars').value) || 1;
    const ketCatatan = document.getElementById('transactionDescription').value;

    const dataTargetSiswa = localStudentsData.find(s => s.id === idSiswa);
    if (!dataTargetSiswa) {
        alert("❌ Siswa tidak ditemukan!");
        tampilkanScreenLoading(false);
        return;
    }

    let hitungBintangBaru = dataTargetSiswa.stars;
    if (window.currentTransactionType === 'achievement') {
        hitungBintangBaru += nominalBintang;
    } else {
        hitungBintangBaru = Math.max(0, hitungBintangBaru - nominalBintang);
    }

    try {
        const { error: errorUpdate } = await supabase
            .from('students')
            .update({ stars: hitungBintangBaru })
            .eq('id', idSiswa);

        if (errorUpdate) throw errorUpdate;

        const { error: errorLog } = await supabase
            .from('star_logs')
            .insert([{
                student_id: idSiswa,
                type: window.currentTransactionType,
                amount: nominalBintang,
                description: ketCatatan
            }]);

        if (errorLog) throw errorLog;

        alert("✅ Catatan transaksi bintang berhasil diproses!");
        window.closeTransactionModal();
        await window.ambilDanTampilkanRanking();

    } catch (err) {
        alert("❌ Terjadi kesalahan sistem: " + err.message);
    } finally {
        tampilkanScreenLoading(false);
    }
};

// =======================================================
// 10. SYSTEM HAPUS SISWA PERMANEN (ADMIN MODE)
// =======================================================
window.hapusSiswaDariDatabase = async function(id) {
    const target = localStudentsData.find(s => s.id === id);
    if (!target) return;

    if (!confirm(`⚠️ Apakah Anda YAKIN menghapus "${target.name}"? Semua data dan log bintangnya akan hilang!`)) {
        return;
    }

    tampilkanScreenLoading(true);
    try {
        await supabase.from('star_logs').delete().eq('student_id', id);
        const { error } = await supabase.from('students').delete().eq('id', id);

        if (error) throw error;

        alert("🗑️ Data siswa telah sukses dihapus.");
        window.closeUserDetailModal();
        await window.ambilDanTampilkanRanking();
    } catch (err) {
        alert("❌ Gagal menghapus data: " + err.message);
    } finally {
        tampilkanScreenLoading(false);
    }
};

// =======================================================
// 11. FIX BAGIAN ERROR: LOGIKA PROSES UPLOAD FOTO PROFIL
// =======================================================

// A. Handler Upload Foto Mandiri (Siswa dari Header)
window.handleSelfPhotoUpload = async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!window.currentSelectedStudentId) {
        alert("❌ Gagal: Identitas siswa aktif belum dipilih.");
        return;
    }

    tampilkanScreenLoading(true);
    try {
        const ekstensi = file.name.split('.').pop();
        const namaFileAcak = `${Date.now()}_siswa.${ekstensi}`;
        const pathFile = `avatars/${namaFileAcak}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(pathFile, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(pathFile);

        const linkPublicUrl = urlData.publicUrl;

        const { error: updateError } = await supabase
            .from('students')
            .update({ avatar_url: linkPublicUrl })
            .eq('id', window.currentSelectedStudentId);

        if (updateError) throw updateError;

        document.getElementById('currentActiveAvatar').src = linkPublicUrl;
        alert("✅ Foto profil Anda berhasil diperbarui!");
        await window.ambilDanTampilkanRanking();

    } catch (err) {
        console.error("Error upload foto siswa:", err);
        alert("❌ Gagal mengunggah foto: " + err.message);
    } finally {
        tampilkanScreenLoading(false);
    }
};

// B. Pemicu Klik dari Admin ke Modal Foto Detail
window.ubahFotoSiswaAdmin = function() {
    if (window.currentRole !== 'admin') {
        alert("🔒 Akses ditolak. Hanya Admin yang dapat mengubah foto siswa.");
        return;
    }
    const fileInput = document.getElementById('modalPhotoUploadInput');
    if (fileInput) fileInput.click();
};

// C. Handler Input File di dalam Modal Detail (Eksekusi Upload oleh Admin)
window.handleModalPhotoUpload = async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!window.currentSelectedUserForModal) {
        alert("❌ Gagal: Tidak ada siswa terpilih di modal detail.");
        return;
    }

    tampilkanScreenLoading(true);
    try {
        const ekstensi = file.name.split('.').pop();
        const namaFileAcak = `${Date.now()}_admin.${ekstensi}`;
        const pathFile = `avatars/${namaFileAcak}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(pathFile, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(pathFile);

        const linkPublicUrl = urlData.publicUrl;
        const idSiswaModal = window.currentSelectedUserForModal.id;

        const { error: updateError } = await supabase
            .from('students')
            .update({ avatar_url: linkPublicUrl })
            .eq('id', idSiswaModal);

        if (updateError) throw updateError;

        // Perbarui tampilan gambar modal secara realtime
        document.getElementById('modalAvatar').src = linkPublicUrl;
        window.currentSelectedUserForModal.avatar_url = linkPublicUrl;

        alert("✅ Foto profil siswa berhasil diperbarui oleh Admin!");
        await window.ambilDanTampilkanRanking();

    } catch (err) {
        console.error("Error admin upload foto:", err);
        alert("❌ Gagal memperbarui foto siswa: " + err.message);
    } finally {
        tampilkanScreenLoading(false);
    }
};

// =======================================================
// 12. ELEMEN VISUAL UTILITY: ANIMASI LAYAR LOADING
// =======================================================
function tampilkanScreenLoading(show) {
    let loader = document.getElementById('global-loader');
    if (!loader && show) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.className = 'fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center';
        loader.innerHTML = `
            <div class="w-10 h-10 border-4 animate-spin rounded-full border-t-purple-500 border-slate-800 mb-3"></div>
            <p class="text-xs font-bold text-purple-300 tracking-wider uppercase animate-pulse">Memproses ke Supabase...</p>
        `;
        document.body.appendChild(loader);
    }
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

// =======================================================
// 13. FITUR EXCEL IMPORT / EXPORT TEMPLATE
// =======================================================
window.downloadExcelTemplate = function() {
    const templateData = [
        ["nama", "bintang_awal", "avatar_url"],
        ["Siswa Contoh A", 10, ""],
        ["Siswa Contoh B", 5, "https://api.dicebear.com/7.x/bottts/svg?seed=example"]
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, "Template Siswa");
    XLSX.writeFile(wb, "template_siswa_megabond.xlsx");
};

window.handleExcelImport = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    tampilkanScreenLoading(true);
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

            let jumlahSukses = 0;
            const bulkDataInput = [];

            sheetData.forEach(row => {
                const namaSiswa = row.nama ? row.nama.toString().trim() : '';
                const avatarSiswa = row.avatar_url ? row.avatar_url.toString().trim() : '';
                const bintangAwal = row.bintang_awal ? parseInt(row.bintang_awal) : 0;

                if (namaSiswa !== '') {
                    bulkDataInput.push({
                        name: namaSiswa,
                        avatar_url: avatarSiswa || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(namaSiswa)}`,
                        stars: bintangAwal
                    });
                    jumlahSukses++;
                }
            });

            if (bulkDataInput.length > 0) {
                const { error } = await supabase.from('students').insert(bulkDataInput);
                if (error) throw error;
            }

            alert(`✅ Berhasil mengimpor ${jumlahSukses} siswa dari Excel!`);
            await window.ambilDanTampilkanRanking();

        } catch (error) {
            console.error("Eror saat import excel:", error);
            alert("❌ Gagal membaca file Excel!");
        } finally {
            event.target.value = '';
            tampilkanScreenLoading(false);
        }
    };
    reader.readAsArrayBuffer(file);
};

// INITIAL LOAD RUNNING
document.addEventListener('DOMContentLoaded', () => {
    window.ambilDanTampilkanRanking();
});
