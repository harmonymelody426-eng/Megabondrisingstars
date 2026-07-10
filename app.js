// ============================================
// MEGABOND RISING STARS - Main Application
// Supabase Integration
// ============================================

import { 
  fetchStudents, 
  fetchStudentWithHistory,
  addStudent,
  updateStudentStars,
  updateStudentAvatar,
  deleteStudent,
  addTransaction,
  fetchStudentTransactions,
  subscribeToStudents,
  subscribeToTransactions,
  uploadAvatar,
  supabase
} from './supabase-client.js';

// ============================================
// APPLICATION STATE
// ============================================

let students = [];
let currentRole = 'user';
let currentActiveUserId = null;
let transactionType = 'achievement';
let rankSnapshot = {};
let dbConnected = false;

// ============================================
// INITIALIZATION
// ============================================

window.addEventListener('DOMContentLoaded', async () => {
  try {
    await initializeApp();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    updateDatabaseStatus(false);
  }
});

async function initializeApp() {
  // Check Supabase connection
  const { data, error } = await supabase.from('students').select('count', { count: 'exact', head: true });
  
  if (error) {
    console.error('Database connection error:', error);
    updateDatabaseStatus(false);
    return;
  }

  updateDatabaseStatus(true);
  
  // Load students from database
  await loadStudents();
  
  // Initialize UI
  initUI();
  
  // Setup real-time subscriptions
  setupRealtimeSubscriptions();
  
  // Render leaderboard
  renderLeaderboard();
}

// ============================================
// DATABASE OPERATIONS
// ============================================

async function loadStudents() {
  try {
    const data = await fetchStudents();
    students = data;
    saveSnapshot();
    console.log(`Loaded ${students.length} students from database`);
  } catch (error) {
    console.error('Error loading students:', error);
    alert('Failed to load students from database. Please check your connection.');
  }
}

async function createNewStudent(name, stars) {
  try {
    const newStudent = await addStudent(name, stars);
    if (newStudent) {
      students.push(newStudent);
      saveSnapshot();
      renderLeaderboard();
      playBeep('success');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error creating student:', error);
    alert('Failed to create student: ' + error.message);
    return false;
  }
}

async function updateStudentStarCount(studentId, stars) {
  try {
    const updated = await updateStudentStars(studentId, stars);
    if (updated) {
      const index = students.findIndex(s => s.id === studentId);
      if (index !== -1) {
        students[index].stars = stars;
        renderLeaderboard();
        playBeep('success');
      }
    }
  } catch (error) {
    console.error('Error updating student stars:', error);
  }
}

async function addNewTransaction(studentId, type, stars, description) {
  try {
    const transaction = await addTransaction(studentId, type, stars, description);
    if (transaction) {
      await loadStudents();
      renderLeaderboard();
      playBeep(type === 'achievement' ? 'success' : 'penalty');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error adding transaction:', error);
    alert('Failed to add transaction: ' + error.message);
    return false;
  }
}

async function removeStudent(studentId) {
  try {
    const success = await deleteStudent(studentId);
    if (success) {
      students = students.filter(s => s.id !== studentId);
      renderLeaderboard();
      closeUserDetailModal();
      playBeep('success');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting student:', error);
    alert('Failed to delete student: ' + error.message);
    return false;
  }
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

function setupRealtimeSubscriptions() {
  // Subscribe to student changes
  subscribeToStudents((payload) => {
    console.log('Student update:', payload);
    loadStudents();
  });

  // Subscribe to transaction changes
  subscribeToTransactions((payload) => {
    console.log('Transaction update:', payload);
    loadStudents();
  });
}

// ============================================
// UI FUNCTIONS
// ============================================

function updateDatabaseStatus(connected) {
  dbConnected = connected;
  const indicator = document.getElementById('dbStatusIndicator');
  const text = document.getElementById('dbStatusText');
  
  if (connected) {
    indicator.classList.remove('bg-yellow-500', 'animate-pulse');
    indicator.classList.add('bg-emerald-500');
    text.textContent = 'Database Connected';
  } else {
    indicator.classList.remove('bg-emerald-500');
    indicator.classList.add('bg-red-500', 'animate-pulse');
    text.textContent = 'Database Offline';
  }
}

function initUI() {
  populateUserDropdown();
  updateHeaderProfile();
  updateAdminPanelVisibility();
  populateTransactionStudentSelect();
}

function populateUserDropdown() {
  const select = document.getElementById('currentUserSelector');
  select.innerHTML = '';
  students.forEach(s => {
    const option = document.createElement('option');
    option.value = s.id;
    option.textContent = s.name;
    if (!currentActiveUserId) {
      currentActiveUserId = s.id;
      option.selected = true;
    } else if (s.id === currentActiveUserId) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

function populateTransactionStudentSelect() {
  const select = document.getElementById('transactionStudentSelect');
  select.innerHTML = '<option value="">-- Pilih Siswa --</option>';
  students.forEach(s => {
    const option = document.createElement('option');
    option.value = s.id;
    option.textContent = s.name;
    select.appendChild(option);
  });
}

function updateHeaderProfile() {
  const activeUser = students.find(s => s.id === currentActiveUserId);
  if (activeUser) {
    document.getElementById('currentActiveAvatar').src = activeUser.avatar || 'https://picsum.photos/seed/default/100/100';
  }
}

function updateAdminPanelVisibility() {
  const panel = document.getElementById('adminPanel');
  const btnUser = document.getElementById('btnRoleUser');
  const btnAdmin = document.getElementById('btnRoleAdmin');
  const headerPhotoUploadLabel = document.getElementById('headerPhotoUploadLabel');

  if (currentRole === 'admin') {
    panel.classList.remove('hidden');
    if (headerPhotoUploadLabel) headerPhotoUploadLabel.classList.remove('hidden');
    btnAdmin.classList.add('bg-brand-600', 'text-white', 'shadow-md');
    btnAdmin.classList.remove('text-purple-300');
    btnUser.classList.remove('bg-brand-600', 'text-white', 'shadow-md');
    btnUser.classList.add('text-purple-300');
  } else {
    panel.classList.add('hidden');
    if (headerPhotoUploadLabel) headerPhotoUploadLabel.classList.add('hidden');
    btnUser.classList.add('bg-brand-600', 'text-white', 'shadow-md');
    btnUser.classList.remove('text-purple-300');
    btnAdmin.classList.remove('bg-brand-600', 'text-white', 'shadow-md');
    btnAdmin.classList.add('text-purple-300');
  }
}

// ============================================
// TIER CALCULATION
// ============================================

function getTierInfo(stars) {
  let tierName, name, starsInTier, color, icon, gradient;

  if (stars <= 10) {
    tierName = 'Bintang Redup';
    name = 'Bintang Redup ☁️';
    starsInTier = Math.min(5, Math.max(1, Math.ceil(stars / 2)));
    color = 'text-slate-400';
    icon = 'fa-solid fa-cloud';
    gradient = 'from-slate-800 to-slate-950';
  } else if (stars <= 30) {
    tierName = 'Bintang Menyala';
    name = 'Bintang Menyala 🔥';
    starsInTier = Math.min(5, Math.max(1, Math.ceil((stars - 10) / 4)));
    color = 'text-orange-400';
    icon = 'fa-solid fa-fire';
    gradient = 'from-orange-900 to-slate-950';
  } else if (stars <= 60) {
    tierName = 'Bintang Kejora';
    name = 'Bintang Kejora ✨';
    starsInTier = Math.min(5, Math.max(1, Math.ceil((stars - 30) / 6)));
    color = 'text-cyan-400';
    icon = 'fa-solid fa-star';
    gradient = 'from-cyan-900 to-slate-950';
  } else {
    tierName = 'RISING STAR';
    name = 'RISING STAR 👑';
    starsInTier = 5;
    color = 'text-yellow-400';
    icon = 'fa-solid fa-crown';
    gradient = 'from-yellow-600 to-slate-950';
  }

  return {
    name,
    tierName,
    starsInTier,
    color,
    icon,
    gradient
  };
}

// ============================================
// AUDIO
// ============================================

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep(type) {
  if (!audioCtx) return;
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === 'success') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  } else if (type === 'penalty') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(110, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  }
}

// ============================================
// SNAPSHOT & RANKING
// ============================================

function saveSnapshot() {
  const sorted = [...students].sort((a, b) => b.stars - a.stars);
  rankSnapshot = {};
  sorted.forEach((student, index) => {
    rankSnapshot[student.id] = index + 1;
  });
}

// ============================================
// LEADERBOARD RENDERING
// ============================================

function renderLeaderboard() {
  const query = document.getElementById('studentSearch').value.toLowerCase();
  let sortedStudents = [...students].sort((a, b) => b.stars - a.stars);

  // Filter
  if (query) {
    sortedStudents = sortedStudents.filter(s => s.name.toLowerCase().includes(query));
  }

  const top5 = sortedStudents.slice(0, 5);

  // Render podium
  for (let i = 1; i <= 3; i++) {
    const student = top5[i - 1] || { name: 'Loading...', stars: 0, avatar: 'https://picsum.photos/seed/default/150/150' };
    document.getElementById(`p${i}-name`).textContent = student.name;
    document.getElementById(`p${i}-stars`).textContent = student.stars || 0;
    document.getElementById(`p${i}-avatar`).src = student.avatar || 'https://picsum.photos/seed/default/150/150';
  }

  // Render ranks 4-5
  for (let i = 4; i <= 5; i++) {
    const student = top5[i - 1];
    const cardId = `card-rank-${i}`;
    if (student) {
      document.getElementById(`p${i}-name`).textContent = student.name;
      document.getElementById(`p${i}-stars`).textContent = student.stars || 0;
      document.getElementById(`p${i}-avatar`).src = student.avatar || 'https://picsum.photos/seed/default/150/150';
    }
  }

  // Render full list
  const listContainer = document.getElementById('leaderboardList');
  listContainer.innerHTML = '';

  sortedStudents.forEach((student, index) => {
    const rank = index + 1;
    const tier = getTierInfo(student.stars);

    const row = document.createElement('div');
    row.id = `row-student-${student.id}`;
    row.className = `leaderboard-item flex items-center justify-between p-3 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/60 hover:border-brand-500/30 cursor-pointer transition-all`;

    if (student.id === currentActiveUserId) {
      row.classList.add('ring-1', 'ring-brand-500/50', 'bg-brand-950/20');
    }

    row.innerHTML = `
      <div class="flex items-center gap-3 flex-grow" onclick="viewUserDetailByStudentId('${student.id}')">
        <div class="heading-font text-xs font-extrabold text-slate-500 w-6 text-center">#${rank}</div>
        <img src="${student.avatar || 'https://picsum.photos/seed/default/100/100'}" class="w-9 h-9 rounded-full object-cover border border-slate-800">
        <div class="flex-grow min-w-0">
          <p class="text-xs font-bold text-slate-100 line-clamp-1">${student.name}</p>
          <p class="text-[10px] text-slate-500">${tier.tierName}</p>
        </div>
      </div>
      <div class="text-right">
        <div class="text-yellow-400 font-black text-xs flex items-center gap-1">
          <i class="fa-solid fa-star"></i> ${student.stars || 0}
        </div>
      </div>
    `;

    row.addEventListener('click', () => viewUserDetailByStudentId(student.id));
    listContainer.appendChild(row);
  });
}

// ============================================
// MODAL FUNCTIONS
// ============================================

async function viewUserDetail(rank) {
  const sorted = [...students].sort((a, b) => b.stars - a.stars);
  const student = sorted[rank - 1];
  if (student) viewUserDetailByStudentId(student.id);
}

async function viewUserDetailByStudentId(studentId) {
  try {
    const student = await fetchStudentWithHistory(studentId);
    if (!student) {
      alert('Failed to load student details');
      return;
    }

    const tier = getTierInfo(student.stars);
    const sorted = [...students].sort((a, b) => b.stars - a.stars);
    const rank = sorted.findIndex(s => s.id === student.id) + 1;

    // Update modal content
    document.getElementById('modalName').textContent = student.name;
    document.getElementById('modalRankLabel').textContent = `#${rank}`;
    document.getElementById('modalTierName').textContent = tier.name;
    document.getElementById('modalAvatar').src = student.avatar || 'https://picsum.photos/seed/default/150/150';
    document.getElementById('modalTotalStarsText').innerHTML = `<i class="fa-solid fa-star"></i> ${student.stars} Bintang`;
    document.getElementById('modalTierIconLarge').className = `fa-solid ${tier.icon.split(' ').pop()}`;

    // Render stars
    const starIcons = document.getElementById('modalStarIcons');
    starIcons.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const star = document.createElement('i');
      star.className = `fa-solid fa-star text-xl ${i < tier.starsInTier ? 'text-yellow-400' : 'text-slate-700'}`;
      starIcons.appendChild(star);
    }

    // Render history
    const timeline = document.getElementById('modalHistoryTimeline');
    timeline.innerHTML = '';

    if (student.history && student.history.length > 0) {
      student.history.forEach(trans => {
        const item = document.createElement('div');
        item.className = `text-xs p-3 rounded-lg ${trans.type === 'achievement' ? 'bg-emerald-950/30 border border-emerald-900/50' : 'bg-rose-950/30 border border-rose-900/50'}`;
        item.innerHTML = `
          <div class="flex items-center justify-between mb-1">
            <span class="font-bold ${trans.type === 'achievement' ? 'text-emerald-400' : 'text-rose-400'}">
              <i class="fa-solid ${trans.type === 'achievement' ? 'fa-award' : 'fa-circle-minus'} mr-1"></i>
              ${trans.type === 'achievement' ? 'Prestasi' : 'Penalti'}
            </span>
            <span class="font-bold text-yellow-400">+${trans.stars} ⭐</span>
          </div>
          <p class="text-slate-400">${trans.description}</p>
          <p class="text-slate-500 text-[10px] mt-1">${new Date(trans.created_at).toLocaleDateString('id-ID')}</p>
        `;
        timeline.appendChild(item);
      });
    } else {
      timeline.innerHTML = '<p class="text-xs text-slate-500">Tidak ada riwayat.</p>';
    }

    // Show/hide admin buttons
    const adminContainer = document.getElementById('modalAdminDeleteBtnContainer');
    const deleteBtn = document.getElementById('btnDeleteStudent');
    const photoLabel = document.getElementById('modalPhotoUploadLabel');

    if (currentRole === 'admin') {
      adminContainer.classList.remove('hidden');
      photoLabel.classList.remove('hidden');
      deleteBtn.onclick = () => {
        if (confirm(`Hapus siswa ${student.name}?`)) {
          removeStudent(student.id);
        }
      };
    } else {
      adminContainer.classList.add('hidden');
      photoLabel.classList.add('hidden');
    }

    // Show modal
    document.getElementById('userDetailModal').classList.remove('hidden');
  } catch (error) {
    console.error('Error viewing user detail:', error);
    alert('Failed to load student details: ' + error.message);
  }
}

function closeUserDetailModal() {
  document.getElementById('userDetailModal').classList.add('hidden');
}

function openAddStudentModal() {
  document.getElementById('addStudentModal').classList.remove('hidden');
}

function closeAddStudentModal() {
  document.getElementById('addStudentModal').classList.add('hidden');
  document.getElementById('addStudentForm').reset();
}

function openTransactionModal() {
  document.getElementById('transactionModal').classList.remove('hidden');
  transactionType = 'achievement';
  updateTransactionTypeButtons();
}

function closeTransactionModal() {
  document.getElementById('transactionModal').classList.add('hidden');
  document.getElementById('transactionForm').reset();
}

// ============================================
// FORM HANDLERS
// ============================================

async function handleAddStudent(event) {
  event.preventDefault();
  const name = document.getElementById('newStudentName').value;
  const stars = parseInt(document.getElementById('newStudentStars').value) || 0;

  if (await createNewStudent(name, stars)) {
    alert('Siswa berhasil ditambahkan!');
    closeAddStudentModal();
    populateTransactionStudentSelect();
  }
}

function setRole(role) {
  if (role === 'admin') {
    const password = prompt('Masukkan Password Admin:');
    if (password !== 'megabond123') {
      alert('Password salah!');
      return;
    }
  }

  currentRole = role;
  updateAdminPanelVisibility();
  renderLeaderboard();
  playBeep('pop');
}

function changeActiveUser(userId) {
  currentActiveUserId = userId;
  updateHeaderProfile();
  renderLeaderboard();
  playBeep('pop');
}

function setTransactionType(type) {
  transactionType = type;
  updateTransactionTypeButtons();
}

function updateTransactionTypeButtons() {
  const achievementBtn = document.getElementById('typeAchievementBtn');
  const penaltyBtn = document.getElementById('typePenaltyBtn');

  if (transactionType === 'achievement') {
    achievementBtn.classList.add('bg-emerald-950/20', 'border-emerald-500/30', 'text-emerald-400');
    penaltyBtn.classList.remove('bg-rose-950/20', 'border-rose-500/30', 'text-rose-400');
    penaltyBtn.classList.add('border-slate-800', 'text-slate-400');
  } else {
    penaltyBtn.classList.add('bg-rose-950/20', 'border-rose-500/30', 'text-rose-400');
    achievementBtn.classList.remove('bg-emerald-950/20', 'border-emerald-500/30', 'text-emerald-400');
    achievementBtn.classList.add('border-slate-800', 'text-slate-400');
  }
}

async function handleTransactionSubmit(event) {
  event.preventDefault();
  
  const studentId = document.getElementById('transactionStudentSelect').value;
  const stars = parseInt(document.getElementById('transactionStars').value);
  const description = document.getElementById('transactionDescription').value;

  if (!studentId) {
    alert('Pilih siswa terlebih dahulu!');
    return;
  }

  if (await addNewTransaction(studentId, transactionType, stars, description)) {
    alert('Perubahan berhasil dicatat!');
    closeTransactionModal();
  }
}

async function handleSelfPhotoUpload(event) {
  const file = event.target.files[0];
  if (file && currentActiveUserId) {
    const url = await uploadAvatar(currentActiveUserId, file);
    if (url) {
      await updateStudentAvatar(currentActiveUserId, url);
      await loadStudents();
      renderLeaderboard();
      playBeep('success');
    }
  }
}

async function handleModalPhotoUpload(event) {
  const file = event.target.files[0];
  const studentId = document.getElementById('modalName').getAttribute('data-student-id') || 
                   [...students].sort((a, b) => b.stars - a.stars)[0]?.id;
  
  if (file && studentId) {
    const url = await uploadAvatar(studentId, file);
    if (url) {
      await updateStudentAvatar(studentId, url);
      document.getElementById('modalAvatar').src = url;
      await loadStudents();
      renderLeaderboard();
      playBeep('success');
    }
  }
}

// ============================================
// EXPORT GLOBAL FUNCTIONS
// ============================================

window.setRole = setRole;
window.changeActiveUser = changeActiveUser;
window.viewUserDetail = viewUserDetail;
window.viewUserDetailByStudentId = viewUserDetailByStudentId;
window.closeUserDetailModal = closeUserDetailModal;
window.openAddStudentModal = openAddStudentModal;
window.closeAddStudentModal = closeAddStudentModal;
window.openTransactionModal = openTransactionModal;
window.closeTransactionModal = closeTransactionModal;
window.handleAddStudent = handleAddStudent;
window.setTransactionType = setTransactionType;
window.handleTransactionSubmit = handleTransactionSubmit;
window.handleSelfPhotoUpload = handleSelfPhotoUpload;
window.handleModalPhotoUpload = handleModalPhotoUpload;
window.renderLeaderboard = renderLeaderboard;
