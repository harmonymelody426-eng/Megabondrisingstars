// ==========================================
// APP.JS - FINAL REVISED TOTAL CODE
// ==========================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Menggunakan Project URL dan Anon Key baru milik Anda
const SUPABASE_URL = "https://cprpizbcfvmwnumhkkwh.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcnBpemJjZnZtd251bWhra3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2Nzg3MjIsImV4cCI6MjA5OTI1NDcyMn0.teTEiRY0wA4FKrEN3xGYW8kZ79UTt3y4_m-XNpXGgWo"

const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// STATE UTAMA APP
window.currentRole = 'user'; // 'user' atau 'admin'
window.studentsData = [];
window.currentActiveUserId = null; // ID Siswa yang sedang "Masuk Sebagai"
window.currentSelectedUserForModal = null; // Data siswa yang sedang dibuka di modal detail
let activeTransactionType = 'achievement'; // 'achievement' atau 'penalty'

// TIER CONFIGURATION
const TIERS = [
  { name: 'Legend', min: 41, icon: 'fa-solid fa-bolt text-red-500 animate-pulse', color: 'from-red-600 to-amber-600', textGlow: 'text-glow-legend' },
  { name: 'Diamond', min: 31, icon: 'fa-solid fa-gem text-purple-400', color: 'from-violet-600 to-indigo-600', textGlow: 'text-glow-diamond' },
  { name: 'Platinum', min: 21, icon: 'fa-solid fa-shield-halved text-teal-400', color: 'from-teal-600 to-cyan-600', textGlow: 'text-glow-platinum' },
  { name: 'Gold', min: 11, icon: 'fa-solid fa-medal text-yellow-400', color: 'from-amber-500 to-yellow-400', textGlow: 'text-glow-gold' },
  { name: 'Silver', min: 6, icon: 'fa-solid fa-award text-slate-300', color: 'from-slate-500 to-slate-400', textGlow: 'text-glow-silver' },
  { name: 'Bronze', min: 0, icon: 'fa-solid fa-star text-amber-700', color: 'from-amber-800 to-orange-700', textGlow: 'text-glow-bronze' }
];

function getTier(stars) {
  return TIERS.find(t => stars >= t.min) || TIERS[TIERS.length - 1];
}

// ON LOAD INITIALIZATION
document.addEventListener('DOMContentLoaded', async () => {
  updateDbStatus('Connecting...', 'yellow');
  await ambilDanTampilkanRanking();
  setupRealtimeSubscription();
  
  // Bind events ke window agar bisa diakses HTML inline
  window.changeActiveUser = changeActiveUser;
  window.viewUserDetail = viewUserDetail;
  window.closeUserDetailModal = closeUserDetailModal;
  window.openAddStudentModal = openAddStudentModal;
  window.closeAddStudentModal = closeAddStudentModal;
  window.handleAddStudent = handleAddStudent;
  window.openTransactionModal = openTransactionModal;
  window.closeTransactionModal = closeTransactionModal;
  window.setTransactionType = setTransactionType;
  window.deleteStudent = deleteStudent;
});

// STATUS INDIKATOR
function updateDbStatus(text, colorClass) {
  const indicator = document.getElementById('dbStatusIndicator');
  const statusText = document.getElementById('dbStatusText');
  if(!indicator || !statusText) return;
  
  indicator.className = `w-2 h-2 rounded-full bg-${colorClass}-500 animate-pulse`;
  statusText.innerText = text;
}

// AMBIL DATA UTAMA DARI SUPABASE
async function ambilDanTampilkanRanking() {
  try {
    const { data, error } = await _supabase
      .from('students')
      .select('*')
      .order('stars', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;

    window.studentsData = data || [];
    updateDbStatus('Connected', 'emerald');
    
    // Inisialisasi User Switcher pertama kali jika belum ada yang terpilih
    if (!window.currentActiveUserId && window.studentsData.length > 0) {
      window.currentActiveUserId = window.studentsData[0].id;
    }

    renderUserSelector();
    renderPodiumAndCards();
    renderLeaderboard();
    renderAdminStudentManagementList();
    updateHeaderAvatarDisplay();

  } catch (err) {
    console.error("Gagal mengambil data ranking:", err.message);
    updateDbStatus('Error Sync', 'rose');
  }
}

// REALTIME SUBSCRIPTION
function setupRealtimeSubscription() {
  _supabase
    .channel('schema-db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
      ambilDanTampilkanRanking();
    })
    .subscribe();
}

// RENDER USER SELECTOR (SWITCHER MODE SISWA)
function renderUserSelector() {
  const selector = document.getElementById('currentUserSelector');
  if(!selector) return;
  
  selector.innerHTML = window.studentsData.map(st => 
    `<option value="${st.id}" ${st.id === window.currentActiveUserId ? 'selected' : ''}>${st.name}</option>`
  ).join('');
}

function changeActiveUser(id) {
  window.currentActiveUserId = parseInt(id) || id;
  updateHeaderAvatarDisplay();
}

function updateHeaderAvatarDisplay() {
  const activeUser = window.studentsData.find(st => st.id === window.currentActiveUserId);
  const avatarImg = document.getElementById('currentActiveAvatar');
  const cameraLabel = document.getElementById('headerPhotoUploadLabel');

  if (activeUser && avatarImg) {
    avatarImg.src = activeUser.avatar_url || `https://picsum.photos/seed/${activeUser.id}/100/100`;
  }
  
  // Kamera hanya muncul di mode siswa
  if (cameraLabel) {
    if (window.currentRole === 'user') {
      cameraLabel.classList.remove('hidden');
    } else {
      cameraLabel.classList.add('hidden');
    }
  }
}

// RENDER PODIUM UTAMA TOP 1-3 & HIGHLIGHT CARD 4-5
function renderPodiumAndCards() {
  const top1 = window.studentsData[0];
  const top2 = window.studentsData[1];
  const top3 = window.studentsData[2];
  const rank4 = window.studentsData[3];
  const rank5 = window.studentsData[4];

  // Top 1
  if (top1) {
    document.getElementById('p1-name').innerText = top1.name;
    document.getElementById('p1-stars').innerText = top1.stars;
    document.getElementById('p1-avatar').src = top1.avatar_url || `https://picsum.photos/seed/${top1.id}/150/150`;
    document.getElementById('podium-1').style.opacity = '1';
  } else {
    document.getElementById('podium-1').style.opacity = '0';
  }

  // Top 2
  if (top2) {
    document.getElementById('p2-name').innerText = top2.name;
    document.getElementById('p2-stars').innerText = top2.stars;
    document.getElementById('p2-avatar').src = top2.avatar_url || `https://picsum.photos/seed/${top2.id}/150/150`;
    document.getElementById('podium-2').style.opacity = '1';
  } else {
    document.getElementById('podium-2').style.opacity = '0';
  }

  // Top 3
  if (top3) {
    document.getElementById('p3-name').innerText = top3.name;
    document.getElementById('p3-stars').innerText = top3.stars;
    document.getElementById('p3-avatar').src = top3.avatar_url || `https://picsum.photos/seed/${top3.id}/150/150`;
    document.getElementById('podium-3').style.opacity = '1';
  } else {
    document.getElementById('podium-3').style.opacity = '0';
  }

  // Card Rank 4
  const c4 = document.getElementById('card-rank-4');
  if (rank4 && c4) {
    c4.style.display = 'block';
    document.getElementById('p4-name').innerText = rank4.name;
    document.getElementById('p4-stars').innerText = rank4.stars;
    document.getElementById('p4-avatar').src = rank4.avatar_url || `https://picsum.photos/seed/${rank4.id}/100/100`;
  } else if(c4) {
    c4.style.display = 'none';
  }

  // Card Rank 5
  const c5 = document.getElementById('card-rank-5');
  if (rank5 && c5) {
    c5.style.display = 'block';
    document.getElementById('p5-name').innerText = rank5.name;
    document.getElementById('p5-stars').innerText = rank5.stars;
    document.getElementById('p5-avatar').src = rank5.avatar_url || `https://picsum.photos/seed/${rank5.id}/100/100`;
  } else if(c5) {
    c5.style.display = 'none';
  }
}

// RENDER KLASEMEN UMUM (RANK 6+) DENGAN FITUR SEARCH
window.renderLeaderboard = function() {
  const listContainer = document.getElementById('leaderboardList');
  if (!listContainer) return;

  const searchQuery = (document.getElementById('studentSearch')?.value || '').toLowerCase();
  
  // Filter berdasarkan search pencarian nama
  const filtered = window.studentsData.filter(st => st.name.toLowerCase().includes(searchQuery));

  if (filtered.length === 0) {
    listContainer.innerHTML = `<p class="text-xs text-slate-500 text-center py-8">Siswa tidak ditemukan.</p>`;
    return;
  }

  listContainer.innerHTML = filtered.map((st) => {
    // Cari index asli global untuk menentukan peringkat
    const originalRank = window.studentsData.findIndex(s => s.id === st.id) + 1;
    const tier = getTier(st.stars);
    
    // Highlight jika baris ini milik user yang sedang aktif login/pilihan
    const isMe = st.id === window.currentActiveUserId;

    return `
      <div onclick="viewUserDetailByStudentId(${st.id})" class="leaderboard-item flex items-center justify-between p-3 rounded-xl bg-slate-900/40 hover:bg-brand-950/30 border ${isMe ? 'border-brand-500 bg-brand-950/20' : 'border-slate-900'} hover:border-purple-900/40 cursor-pointer transition-all">
        <div class="flex items-center gap-3">
          <span class="heading-font text-xs font-black text-slate-500 w-5 text-center">#${originalRank}</span>
          <img src="${st.avatar_url || `https://picsum.photos/seed/${st.id}/80/80`}" class="w-8 h-8 rounded-full object-cover border border-slate-800">
          <div>
            <h4 class="text-xs font-bold ${isMe ? 'text-brand-300' : 'text-slate-200'} line-clamp-1">${st.name}</h4>
            <p class="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
              <i class="${tier.icon}"></i> ${tier.name}
            </p>
          </div>
        </div>
        <div class="text-yellow-400 font-bold text-xs flex items-center gap-1">
          <i class="fa-solid fa-star ${tier.textGlow}"></i> ${st.stars}
        </div>
      </div>
    `;
  }).join('');
};

// RENDER ADMIN LIST MANAGEMENT (DASHBOARD KECIL ADMIN)
function renderAdminStudentManagementList() {
  const container = document.getElementById('adminStudentList');
  if(!container) return;
  
  container.innerHTML = window.studentsData.map(st => `
    <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 overflow-hidden">
        <img src="${st.avatar_url || `https://picsum.photos/seed/${st.id}/50/50`}" class="w-7 h-7 rounded-full object-cover flex-shrink-0">
        <span class="text-xs font-bold text-slate-300 truncate">${st.name}</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="text-[10px] bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded font-extrabold"><i class="fa-solid fa-star text-yellow-500"></i> ${st.stars}</span>
        <button onclick="viewUserDetailByStudentId(${st.id})" class="text-[10px] bg-slate-800 hover:bg-brand-600 text-white p-1 rounded transition-colors" title="Edit/Kelola"><i class="fa-solid fa-pen-to-square"></i></button>
      </div>
    </div>
  `).join('');
}

// POPUP VIEW DETAIL USER (BERDASARKAN POSISI RANK 1-5 DI PODIUM)
function viewUserDetail(podiumRank) {
  const student = window.studentsData[podiumRank - 1];
  if (student) bukaModalDetailSiswa(student, podiumRank);
}

// POPUP VIEW DETAIL USER (BERDASARKAN ID SISWA DI LIST KLASEMEN)
function viewUserDetailByStudentId(id) {
  const index = window.studentsData.findIndex(s => s.id === id);
  if (index !== -1) {
    bukaModalDetailSiswa(window.studentsData[index], index + 1);
  }
}

// LOGIKA OPEN MODAL & LOAD TRANSACTION HISTORY
async function bukaModalDetailSiswa(student, rank) {
  window.currentSelectedUserForModal = student;
  
  const tier = getTier(student.stars);
  
  // Terapkan data ke modal DOM
  document.getElementById('modalName').innerText = student.name;
  document.getElementById('modalRankLabel').innerText = `#${rank}`;
  document.getElementById('modalTierName').innerHTML = `<i class="${tier.icon}"></i> Tier ${tier.name}`;
  document.getElementById('modalTotalStarsText').innerHTML = `<i class="fa-solid fa-star"></i> ${student.stars} Bintang`;
  
  const avatarElement = document.getElementById('modalAvatar');
  avatarElement.src = student.avatar_url || `https://picsum.photos/seed/${student.id}/150/150`;

  // Tampilkan/Sembunyikan tombol upload khusus admin di dalam modal
  const adminPhotoUploadLabel = document.getElementById('modalPhotoUploadLabel');
  if (adminPhotoUploadLabel) {
    if (window.currentRole === 'admin') {
      adminPhotoUploadLabel.classList.remove('hidden');
    } else {
      adminPhotoUploadLabel.classList.add('hidden');
    }
  }

  // Render visual bintang mini
  const starIconsContainer = document.getElementById('modalStarIcons');
  starIconsContainer.innerHTML = '';
  const starLimit = Math.min(student.stars, 15); // Maksimal render 15 icon bintang agar rapi
  for (let i = 0; i < starLimit; i++) {
    starIconsContainer.innerHTML += `<i class="fa-solid fa-star text-yellow-400 text-xs animate-float" style="animation-delay: ${i * 0.1}s"></i>`;
  }
  if (student.stars > 15) {
    starIconsContainer.innerHTML += `<span class="text-xs font-bold text-yellow-500 ml-1">+${student.stars - 15}</span>`;
  }

  // Tampilkan / Sembunyikan Tombol Hapus Siswa berdasarkan role admin
  const deleteBtnContainer = document.getElementById('modalAdminDeleteBtnContainer');
  if(deleteBtnContainer) {
    if (window.currentRole === 'admin') {
      deleteBtnContainer.classList.remove('hidden');
      document.getElementById('btnDeleteStudent').onclick = () => deleteStudent(student.id);
    } else {
      deleteBtnContainer.classList.add('hidden');
    }
  }

  // Tampilkan modal
  document.getElementById('UserDetailModal').classList.remove('hidden');

  // Ambil data histori dari database table 'star_logs'
  const historyContainer = document.getElementById('modalHistoryContainer');
  historyContainer.innerHTML = `<p class="text-[10px] text-slate-500 text-center py-2">Memuat riwayat...</p>`;

  try {
    const { data: logs, error } = await _supabase
      .from('star_logs')
      .select('*')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!logs || logs.length === 0) {
      historyContainer.innerHTML = `<p class="text-[11px] text-slate-500 text-center py-2">Tidak ada riwayat catatan.</p>`;
    } else {
      historyContainer.innerHTML = logs.map(log => {
        const isAchievement = log.type === 'achievement';
        const iconLog = isAchievement ? 'fa-solid fa-circle-plus text-emerald-400' : 'fa-solid fa-circle-minus text-rose-400';
        const badgeColor = isAchievement ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' : 'bg-rose-950/40 text-rose-400 border-rose-900/30';
        const tgl = new Date(log.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'});

        return `
          <div class="p-2 rounded-xl border ${badgeColor} flex items-start justify-between gap-2 text-[11px]">
            <div class="flex gap-2 items-start">
              <i class="${iconLog} mt-0.5 flex-shrink-0"></i>
              <div>
                <p class="font-bold text-slate-200">${log.description}</p>
                <p class="text-[9px] text-slate-500 mt-0.5">${tgl}</p>
              </div>
            </div>
            <span class="font-black">${isAchievement ? '+' : '-'}${log.amount} ⭐</span>
          </div>
        `;
      }).join('');
    }
  } catch(e) {
    historyContainer.innerHTML = `<p class="text-[11px] text-rose-400 text-center py-2">Gagal memuat riwayat.</p>`;
  }
}

function closeUserDetailModal() {
  document.getElementById('UserDetailModal').classList.add('hidden');
  window.currentSelectedUserForModal = null;
}

// MODE ADMIN: TAMBAH SISWA BARU BARU
function openAddStudentModal() { document.getElementById('addStudentModal').classList.remove('hidden'); }
function closeAddStudentModal() { document.getElementById('addStudentModal').classList.add('hidden'); document.getElementById('addStudentForm').reset(); }

async function handleAddStudent(e) {
  e.preventDefault();
  showLoading();

  const name = document.getElementById('newStudentName').value;
  let avatarUrl = document.getElementById('newStudentAvatar').value.trim();
  const stars = parseInt(document.getElementById('newStudentStars').value) || 0;

  if(!avatarUrl) {
    avatarUrl = `https://picsum.photos/seed/${encodeURIComponent(name)}/150/150`;
  }

  try {
    const { data, error } = await _supabase
      .from('students')
      .insert([{ name, avatar_url: avatarUrl, stars }])
      .select();

    if (error) throw error;

    alert(`✅ Berhasil menambahkan siswa baru: ${name}`);
    closeAddStudentModal();
    await ambilDanTampilkanRanking();

  } catch (error) {
    alert("❌ Gagal menambah siswa: " + error.message);
  } finally {
    hideLoading();
  }
}

// MODE ADMIN: KELOLA PRESTASI / PENALTI (TRANSAKSI BINTANG)
function openTransactionModal() {
  const select = document.getElementById('transactionStudentSelect');
  if(!select) return;

  select.innerHTML = '<option value="">-- Pilih Siswa --</option>' + window.studentsData.map(st => 
    `<option value="${st.id}">${st.name} (Sekarang: ${st.stars} ⭐)</option>`
  ).join('');

  document.getElementById('TransactionModal').classList.remove('hidden');
}

function closeTransactionModal() {
  document.getElementById('TransactionModal').classList.add('hidden');
  document.getElementById('transactionForm').reset();
  setTransactionType('achievement');
}

function setTransactionType(type) {
  activeTransactionType = type;
  const actBtn = document.getElementById('typeAchievementBtn');
  const penBtn = document.getElementById('typePenaltyBtn');

  if (type === 'achievement') {
    actBtn.className = "py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1";
    penBtn.className = "py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center gap-1";
  } else {
    penBtn.className = "py-2.5 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-400 text-xs font-bold flex items-center justify-center gap-1";
    actBtn.className = "py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center gap-1";
  }
}

window.handleTransaction = async function(e) {
  e.preventDefault();
  showLoading();

  const studentId = parseInt(document.getElementById('transactionStudentSelect').value);
  const amount = parseInt(document.getElementById('transactionStars').value) || 1;
  const description = document.getElementById('transactionDescription').value;

  const targetStudent = window.studentsData.find(s => s.id === studentId);
  if (!targetStudent) {
    alert("❌ Siswa tidak ditemukan!");
    hideLoading();
    return;
  }

  // Hitung jumlah kalkulasi bintang baru
  let newStarsValue = targetStudent.stars;
  if (activeTransactionType === 'achievement') {
    newStarsValue += amount;
  } else {
    newStarsValue = Math.max(0, newStarsValue - amount); // Cegah nilai minus di bawah nol
  }

  try {
    // 1. Update total nilai bintang siswa
    const { error: updateError } = await _supabase
      .from('students')
      .update({ stars: newStarsValue })
      .eq('id', studentId);

    if (updateError) throw updateError;

    // 2. Catat histori ke logs
    const { error: logError } = await _supabase
      .from('star_logs')
      .insert([{
        student_id: studentId,
        type: activeTransactionType,
        amount: amount,
        description: description
      }]);

    if (logError) throw logError;

    alert("✅ Berhasil memproses data transaksi bintang!");
    closeTransactionModal();
    await ambilDanTampilkanRanking();

  } catch (error) {
    alert("❌ Terjadi kesalahan sistem: " + error.message);
  } finally {
    hideLoading();
  }
};

// MODE ADMIN: HAPUS SISWA DARI SYSTEM TERMINAL
async function deleteStudent(id) {
  const target = window.studentsData.find(s => s.id === id);
  if (!target) return;

  if (!confirm(`⚠️ Apakah Anda YAKIN akan menghapus siswa "${target.name}" secara permanen dari sistem database? Semua log histori bintang akan terhapus!`)) {
    return;
  }

  showLoading();
  try {
    // Hapus relasi log terlebih dahulu
    await _supabase.from('star_logs').delete().eq('student_id', id);

    // Hapus data utama siswa
    const { error } = await _supabase.from('students').delete().eq('id', id);
    if (error) throw error;

    alert("🗑️ Data siswa telah berhasil dihapus dari database.");
    closeUserDetailModal();
    await ambilDanTampilkanRanking();

  } catch(err) {
    alert("❌ Gagal menghapus data: " + err.message);
  } finally {
    hideLoading();
  }
}

// ==========================================
// LOGIKA UTAMA: PERBAIKAN FUNGSI UPLOAD FOTO
// ==========================================

// 1. HANDLER SISWA (Upload di Header)
window.handleSelfPhotoUpload = async function(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!window.currentActiveUserId) {
    alert("❌ Gagal: Tidak ada identitas siswa aktif terpilih.");
    return;
  }

  showLoading();
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_student.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { data: uploadData, error: uploadError } = await _supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = _supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    const { error: updateError } = await _supabase
      .from('students')
      .update({ avatar_url: publicUrl })
      .eq('id', window.currentActiveUserId);

    if (updateError) throw updateError;

    document.getElementById('currentActiveAvatar').src = publicUrl;

    alert("✅ Foto profil berhasil diperbarui!");
    await ambilDanTampilkanRanking();

  } catch (error) {
    console.error("Error upload foto siswa:", error);
    alert("❌ Gagal mengunggah foto profil: " + error.message);
  } finally {
    hideLoading();
  }
};

// 2. HANDLER DETEKSI KLIK FOTO MODAL DETAIL (OLEH ADMIN)
window.ubahFotoSiswaAdmin = function() {
  if (window.currentRole !== 'admin') {
    alert("🔒 Akses ditolak. Hanya Mode Admin yang dapat mengubah foto siswa.");
    return;
  }
  
  const fileInput = document.getElementById('modalPhotoUploadInput');
  if (fileInput) {
    fileInput.click();
  }
};

// 3. HANDLER INPUT FILE DI DALAM MODAL DETAIL (EKSEKUSI UPLOAD ADMIN)
window.handleModalPhotoUpload = async function(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!window.currentSelectedUserForModal) {
    alert("❌ Gagal: Tidak ada siswa terpilih di modal.");
    return;
  }

  showLoading();
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_admin.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { data: uploadData, error: uploadError } = await _supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = _supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    const studentIdForUpdate = window.currentSelectedUserForModal.id;
    const { error: updateError } = await _supabase
      .from('students')
      .update({ avatar_url: publicUrl })
      .eq('id', studentIdForUpdate);

    if (updateError) throw updateError;

    document.getElementById('modalAvatar').src = publicUrl;
    window.currentSelectedUserForModal.avatar_url = publicUrl;

    alert("✅ Foto profil siswa berhasil diperbarui oleh Admin!");
    await ambilDanTampilkanRanking();

  } catch (error) {
    console.error("Error admin upload foto:", error);
    alert("❌ Gagal memperbarui foto profil siswa: " + error.message);
  } finally {
    hideLoading();
  }
};

// GLOBAL UTILITY LOADING ANIMATION SCREEN
function showLoading() {
  let loader = document.getElementById('global-loader');
  if(!loader){
    loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.className = 'fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center';
    loader.innerHTML = `
      <div class="loading-spinner mb-3 w-10 h-10 border-4 animate-spin rounded-full border-t-purple-500 border-slate-800"></div>
      <p class="text-xs font-bold text-purple-300 tracking-wider uppercase animate-pulse">Memproses Data ke Supabase...</p>
    `;
    document.body.appendChild(loader);
  }
  loader.style.display = 'flex';
}

function hideLoading() {
  const loader = document.getElementById('global-loader');
  if(loader) loader.style.display = 'none';
}

// IMPORT / EXCEL TEMPLATE MANAGEMENT
window.downloadExcelTemplate = function() {
  const worksheetData = [
    ["name", "stars", "avatar_url"],
    ["Ahmad Dhani", 10, ""],
    ["Siti Nurhaliza", 25, "https://picsum.photos/200"],
    ["Budi Doremi", 0, ""]
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  XLSX.utils.book_append_sheet(wb, ws, "Template Siswa");
  XLSX.writeFile(wb, "template_siswa_staracademy.xlsx");
};

window.handleExcelImport = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  showLoading();
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert("❌ File excel kosong atau tidak valid!");
        hideLoading();
        return;
      }

      const firstRow = jsonData[0];
      if (!firstRow.hasOwnProperty('name')) {
        alert("❌ Format kolom Excel salah! Wajib memiliki kolom minimal 'name'.");
        hideLoading();
        return;
      }

      const cleanStudents = jsonData.map(row => ({
        name: String(row.name || '').trim(),
        stars: parseInt(row.stars) || 0,
        avatar_url: row.avatar_url ? String(row.avatar_url).trim() : `https://picsum.photos/seed/${encodeURIComponent(row.name)}/150/150`
      })).filter(r => r.name !== '');

      const { error } = await _supabase.from('students').insert(cleanStudents);
      if (error) throw error;

      alert(`✅ Berhasil mengimpor ${cleanStudents.length} data siswa baru dari Excel!`);
      await ambilDanTampilkanRanking();

    } catch (err) {
      alert("❌ Gagal membaca file Excel: " + err.message);
    } finally {
      document.getElementById('excelFileInput').value = ''; 
      hideLoading();
    }
  };
  reader.readAsArrayBuffer(file);
};
