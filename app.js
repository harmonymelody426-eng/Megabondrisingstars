import { supabase } from './supabase-client.js';

var currentRole = 'user';
var localStudentsData = [];
window.currentTransactionType = 'achievement';
window._isLoadingUserDetail = false;

// =======================================================
// 0. ATUR TIPE TRANSAKSI
// =======================================================
window.setTransactionType = function(type) {
    window.currentTransactionType = type;
    console.log("Tipe transaksi diatur ke:", type);
    var btnAchievement = document.getElementById('typeAchievementBtn');
    var btnPenalty = document.getElementById('typePenaltyBtn');
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
// 1. HITUNG TIER
// =======================================================
function hitungTierDanBintang(totalStars) {
    var stars = parseInt(totalStars) || 0;
    var tierName = "Belum Ada Tier";
    var starsInTier = 0;
    if (stars <= 0) return { tierName: tierName, starsInTier: 0 };
    if (stars <= 5) { tierName = "Bintang Redup"; starsInTier = stars; }
    else if (stars <= 10) { tierName = "Bintang Menyala"; starsInTier = stars - 5; }
    else if (stars <= 15) { tierName = "Bintang Kejora"; starsInTier = stars - 10; }
    else { tierName = "Rising Star"; starsInTier = stars - 15; }
    return { tierName: tierName, starsInTier: starsInTier };
}

function buatHtmlBintangTier(infoTier) {
    var starsInTier = parseInt(infoTier.starsInTier) || 0;
    var tierName = infoTier.tierName || "Belum Ada Tier";
    var htmlBintang = '<div class="flex items-center gap-0.5 justify-center mt-0.5">';
    for (var i = 0; i < starsInTier; i++) {
        htmlBintang += '<i class="fa-solid fa-star text-yellow-400 text-[10px] animate-pulse"></i>';
    }
    if (tierName !== "Rising Star") {
        var sisaSlotKosong = Math.max(0, 5 - starsInTier);
        for (var j = 0; j < sisaSlotKosong; j++) {
            htmlBintang += '<i class="fa-regular fa-star text-slate-500 text-[10px] opacity-60"></i>';
        }
    }
    htmlBintang += '</div>';
    return htmlBintang;
}

// =======================================================
// 2. AMBIL DATA RANKING
// =======================================================
async function ambilDanTampilkanRanking() {
    var statusText = document.getElementById('dbStatusText');
    var statusIndicator = document.getElementById('dbStatusIndicator');
    try {
        var result = await supabase.from('students').select('*').order('stars', { ascending: false });
        var siswa = result.data;
        var error = result.error;
        if (error) throw error;
        localStudentsData = siswa || [];
        window.localStudentsData = siswa || [];
        if (statusText) statusText.innerText = 'Connected';
        if (statusIndicator) statusIndicator.className = 'w-2 h-2 rounded-full bg-emerald-500';
        console.log('Data Siswa Berhasil Diambil:', siswa);
        
        // Podium 1
        if (siswa && siswa.length >= 1) {
            var info = hitungTierDanBintang(siswa[0].stars);
            var p1Name = document.getElementById('p1-name');
            var p1Stars = document.getElementById('p1-stars');
            var p1Avatar = document.getElementById('p1-avatar');
            if (p1Name) p1Name.innerText = siswa[0].name;
            if (p1Stars) {
                p1Stars.innerHTML = '<span class="text-[10px] font-medium text-purple-300 block">' + info.tierName + '</span>' + buatHtmlBintangTier(info) + '<span class="text-[11px] text-yellow-400 font-bold block mt-0.5"><i class="fa-solid fa-star text-[9px]"></i> ' + siswa[0].stars + '</span>';
            }
            if (p1Avatar && siswa[0].avatar_url) p1Avatar.src = siswa[0].avatar_url;
            var podium1 = document.getElementById('podium-1');
            if (podium1) {
                var clickTarget = podium1.querySelector('.cursor-pointer') || podium1;
                clickTarget.setAttribute('onclick', 'window.viewUserDetail(1)');
            }
        } else {
            if (document.getElementById('p1-name')) document.getElementById('p1-name').innerText = 'Belum Ada';
            if (document.getElementById('p1-stars')) document.getElementById('p1-stars').innerText = '0';
        }
        
        // Podium 2
        if (siswa && siswa.length >= 2) {
            var info2 = hitungTierDanBintang(siswa[1].stars);
            var p2Name = document.getElementById('p2-name');
            var p2Stars = document.getElementById('p2-stars');
            var p2Avatar = document.getElementById('p2-avatar');
            if (p2Name) p2Name.innerText = siswa[1].name;
            if (p2Stars) {
                p2Stars.innerHTML = '<span class="text-[10px] font-medium text-purple-300 block">' + info2.tierName + '</span>' + buatHtmlBintangTier(info2) + '<span class="text-[11px] text-yellow-400 font-bold block mt-0.5"><i class="fa-solid fa-star text-[9px]"></i> ' + siswa[1].stars + '</span>';
            }
            if (p2Avatar && siswa[1].avatar_url) p2Avatar.src = siswa[1].avatar_url;
            var podium2 = document.getElementById('podium-2');
            if (podium2) {
                var clickTarget2 = podium2.querySelector('.cursor-pointer') || podium2;
                clickTarget2.setAttribute('onclick', 'window.viewUserDetail(2)');
            }
        } else {
            if (document.getElementById('p2-name')) document.getElementById('p2-name').innerText = 'Belum Ada';
            if (document.getElementById('p2-stars')) document.getElementById('p2-stars').innerText = '0';
        }
        
        // Podium 3
        if (siswa && siswa.length >= 3) {
            var info3 = hitungTierDanBintang(siswa[2].stars);
            var p3Name = document.getElementById('p3-name');
            var p3Stars = document.getElementById('p3-stars');
            var p3Avatar = document.getElementById('p3-avatar');
            if (p3Name) p3Name.innerText = siswa[2].name;
            if (p3Stars) {
                p3Stars.innerHTML = '<span class="text-[10px] font-medium text-purple-300 block">' + info3.tierName + '</span>' + buatHtmlBintangTier(info3) + '<span class="text-[11px] text-yellow-400 font-bold block mt-0.5"><i class="fa-solid fa-star text-[9px]"></i> ' + siswa[2].stars + '</span>';
            }
            if (p3Avatar && siswa[2].avatar_url) p3Avatar.src = siswa[2].avatar_url;
            var podium3 = document.getElementById('podium-3');
            if (podium3) {
                var clickTarget3 = podium3.querySelector('.cursor-pointer') || podium3;
                clickTarget3.setAttribute('onclick', 'window.viewUserDetail(3)');
            }
        } else {
            if (document.getElementById('p3-name')) document.getElementById('p3-name').innerText = 'Belum Ada';
            if (document.getElementById('p3-stars')) document.getElementById('p3-stars').innerText = '0';
        }
        
        // Rank 4
        var p4Name = document.getElementById('p4-name');
        var p4Stars = document.getElementById('p4-stars');
        if (siswa && siswa.length >= 4) {
            var info4 = hitungTierDanBintang(siswa[3].stars);
            if (p4Name) p4Name.innerText = siswa[3].name;
            if (p4Stars) {
                p4Stars.innerHTML = '<span class="text-[9px] font-medium text-purple-300 block mb-0.5">' + info4.tierName + '</span><div class="flex items-center gap-0.5 justify-center">' + buatHtmlBintangTier(info4) + '</div><span class="text-[11px] text-yellow-400 font-bold block mt-0.5"><i class="fa-solid fa-star text-[9px]"></i> ' + siswa[3].stars + '</span>';
            }
            var card4 = document.getElementById('card-rank-4');
            if (card4) card4.setAttribute('onclick', 'window.viewUserDetail(4)');
            var p4Avatar = document.getElementById('p4-avatar');
            if (p4Avatar && siswa[3].avatar_url) p4Avatar.src = siswa[3].avatar_url;
        } else {
            if (p4Name) p4Name.innerText = '-';
            if (p4Stars) p4Stars.innerText = '0';
        }
        
        // Rank 5
        var p5Name = document.getElementById('p5-name');
        var p5Stars = document.getElementById('p5-stars');
        if (siswa && siswa.length >= 5) {
            var info5 = hitungTierDanBintang(siswa[4].stars);
            if (p5Name) p5Name.innerText = siswa[4].name;
            if (p5Stars) {
                p5Stars.innerHTML = '<span class="text-[9px] font-medium text-purple-300 block mb-0.5">' + info5.tierName + '</span><div class="flex items-center gap-0.5 justify-center">' + buatHtmlBintangTier(info5) + '</div><span class="text-[11px] text-yellow-400 font-bold block mt-0.5"><i class="fa-solid fa-star text-[9px]"></i> ' + siswa[4].stars + '</span>';
            }
            var card5 = document.getElementById('card-rank-5');
            if (card5) card5.setAttribute('onclick', 'window.viewUserDetail(5)');
            var p5Avatar = document.getElementById('p5-avatar');
            if (p5Avatar && siswa[4].avatar_url) p5Avatar.src = siswa[4].avatar_url;
        } else {
            if (p5Name) p5Name.innerText = '-';
            if (p5Stars) p5Stars.innerText = '0';
        }
        
        // Leaderboard
        var leaderboardList = document.getElementById('leaderboardList');
        if (leaderboardList) {
            leaderboardList.innerHTML = '';
            for (var i = 0; i < siswa.length; i++) {
                var itemSiswa = siswa[i];
                var info = hitungTierDanBintang(itemSiswa.stars);
                var row = document.createElement('div');
                row.className = 'leaderboard-item flex justify-between items-center bg-slate-900/40 border border-slate-800/60 p-3 rounded-xl cursor-pointer hover:border-brand-500/40 transition-all';
                row.onclick = function(idx) { return function() { window.viewUserDetail(idx + 1); }; }(i);
                row.innerHTML = '<div class="flex items-center gap-3"><span class="font-bold text-xs text-slate-500 w-5">#' + (i + 1) + '</span><img src="' + (itemSiswa.avatar_url || 'https://picsum.photos/seed/' + i + '/100/100') + '" class="w-8 h-8 rounded-full object-cover"><div><span class="text-xs font-semibold text-slate-200 block">' + itemSiswa.name + '</span><span class="text-[9px] text-purple-400 font-medium block">' + info.tierName + '</span></div></div><div class="text-right"><div class="text-yellow-400 font-bold text-xs"><i class="fa-solid fa-star text-[10px]"></i> ' + itemSiswa.stars + '</div>' + buatHtmlBintangTier(info) + '</div>';
                leaderboardList.appendChild(row);
            }
        }
        
        // Admin list
        renderAdminStudentList(siswa);
        
        var selectSiswa = document.getElementById('transactionStudentSelect');
        if (selectSiswa) {
            selectSiswa.innerHTML = '<option value="">-- Pilih Siswa --</option>';
            for (var k = 0; k < siswa.length; k++) {
                var opt = document.createElement('option');
                opt.value = siswa[k].id;
                opt.innerText = siswa[k].name;
                selectSiswa.appendChild(opt);
            }
        }
    } catch (err) {
        console.error('Error:', err.message);
        if (statusText) statusText.innerText = 'Error Connection';
        if (statusIndicator) statusIndicator.className = 'w-2 h-2 rounded-full bg-rose-500';
    }
}

function renderAdminStudentList(siswaArray) {
    var adminStudentList = document.getElementById('adminStudentList');
    if (!adminStudentList) return;
    adminStudentList.innerHTML = '';
    for (var i = 0; i < siswaArray.length; i++) {
        var siswa = siswaArray[i];
        var item = document.createElement('div');
        item.className = 'flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800/80';
        item.innerHTML = '<div><p class="text-xs font-bold text-slate-200">' + siswa.name + '</p><p class="text-[10px] text-yellow-400 font-medium"><i class="fa-solid fa-star"></i> ' + siswa.stars + ' Bintang</p></div><button onclick="window.handleDeleteStudent(\'' + siswa.id + '\', \'' + siswa.name + '\')" class="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-all text-xs" title="Hapus Siswa"><i class="fa-solid fa-trash"></i></button>';
        adminStudentList.appendChild(item);
    }
}

window.handleDeleteStudent = async function(idSiswa, namaSiswa) {
    if (!confirm('Apakah Anda yakin ingin menghapus siswa "' + namaSiswa + '"?')) return;
    try {
        var result = await supabase.from('students').delete().eq('id', idSiswa);
        if (result.error) throw result.error;
        alert('Siswa ' + namaSiswa + ' berhasil dihapus!');
        ambilDanTampilkanRanking();
    } catch (err) {
        alert('Gagal menghapus siswa: ' + err.message);
    }
};

// =======================================================
// 3. PROSES TRANSAKSI
// =======================================================
window.handleTransaction = async function(event) {
    event.preventDefault();
    var studentId = document.getElementById('transactionStudentSelect').value;
    var amount = parseInt(document.getElementById('transactionStars').value) || 0;
    var notes = document.getElementById('transactionDescription').value || '';
    var dbType = window.currentTransactionType === 'penalty' ? 'penalty' : 'achievement';
    if (!studentId) { alert('Pilih siswa!'); return; }
    try {
        var result = await supabase.from('students').select('stars').eq('id', studentId).single();
        if (result.error) throw result.error;
        var currentStars = result.data.stars;
        var newStars = dbType === 'achievement' ? currentStars + amount : currentStars - amount;
        if (newStars < 0) newStars = 0;
        var updateResult = await supabase.from('students').update({ stars: newStars }).eq('id', studentId);
        if (updateResult.error) throw updateResult.error;
        var insertResult = await supabase.from('transactions').insert([{ student_id: studentId, type: dbType, stars: amount, description: notes }]);
        if (insertResult.error) throw insertResult.error;
        alert('Transaksi berhasil!');
        document.getElementById('transactionForm').reset();
        window.setTransactionType('achievement');
        if (typeof window.closeTransactionModal === 'function') window.closeTransactionModal();
        ambilDanTampilkanRanking();
    } catch (err) {
        alert('Gagal: ' + err.message);
    }
};

// =======================================================
// 4. DETAIL PROFIL
// =======================================================
window.viewUserDetail = async function(rankNumber) {
    if (window._isLoadingUserDetail) { console.log("Loading..."); return; }
    window._isLoadingUserDetail = true;
    try {
        var index = parseInt(rankNumber) - 1;
        var dataSiswa = localStudentsData[index];
        if (!dataSiswa) { console.error("Siswa tidak ditemukan"); window._isLoadingUserDetail = false; return; }
        var infoTier = hitungTierDanBintang(dataSiswa.stars);
        
        document.getElementById('modalName').innerText = dataSiswa.name;
        document.getElementById('modalRankLabel').innerText = '#' + rankNumber;
        document.getElementById('modalTotalStarsText').innerHTML = '<i class="fa-solid fa-star"></i> Total: ' + dataSiswa.stars + ' Bintang';
        document.getElementById('modalTierName').innerText = infoTier.tierName;
        
        var modalAvatar = document.getElementById('modalAvatar');
        if (modalAvatar) modalAvatar.src = dataSiswa.avatar_url || 'https://picsum.photos/seed/' + encodeURIComponent(dataSiswa.name) + '/150/150';
        
        var starIcons = document.getElementById('modalStarIcons');
        if (starIcons) {
            starIcons.innerHTML = '';
            for (var i = 0; i < infoTier.starsInTier; i++) {
                starIcons.innerHTML += '<i class="fa-solid fa-star text-yellow-400 text-xs animate-pulse"></i>';
            }
            if (infoTier.tierName !== "Rising Star") {
                for (var j = 0; j < 5 - infoTier.starsInTier; j++) {
                    starIcons.innerHTML += '<i class="fa-regular fa-star text-slate-700 text-xs opacity-60"></i>';
                }
            }
        }
        
        var modal = document.getElementById('UserDetailModal');
        if (modal) modal.classList.remove('hidden');
        
        // Tombol edit nama
        var btnEdit = document.getElementById('btnEditNama');
        if (btnEdit) {
            if (window.currentRole === 'admin') {
                btnEdit.classList.remove('hidden');
                btnEdit.style.display = 'inline-flex';
            } else {
                btnEdit.classList.add('hidden');
                btnEdit.style.display = 'none';
            }
        }
        
        // Riwayat
        var riwayat = document.getElementById('modalHistoryContainer');
        if (riwayat) {
            riwayat.innerHTML = '<p class="text-[11px] text-slate-500 text-center py-2">⏳ Memuat...</p>';
            try {
                var result = await supabase.from('transactions').select('*').eq('student_id', dataSiswa.id).order('created_at', { ascending: false }).limit(50);
                if (result.error) throw result.error;
                var logs = result.data;
                if (!logs || logs.length === 0) {
                    riwayat.innerHTML = '<p class="text-[11px] text-slate-500 text-center py-2">📭 Tidak ada riwayat.</p>';
                } else {
                    riwayat.innerHTML = '';
                    for (var k = 0; k < logs.length; k++) {
                        var log = logs[k];
                        var isPenalty = ['penalti', 'penalty', 'minus'].includes(log.type);
                        var icon = isPenalty ? '<i class="fa-solid fa-circle-minus text-rose-400"></i>' : '<i class="fa-solid fa-award text-emerald-400"></i>';
                        var sign = isPenalty ? '-' : '+';
                        var textClass = isPenalty ? 'text-rose-400' : 'text-emerald-400';
                        var catatan = log.description || 'Tanpa keterangan';
                        var bintang = log.stars || 0;
                        var item = document.createElement('div');
                        item.className = 'flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800/40 mb-1.5 text-[11px]';
                        item.innerHTML = '<div class="flex items-center gap-2">' + icon + '<span class="text-slate-300 font-medium">' + catatan + '</span></div><span class="font-bold ' + textClass + '">' + sign + ' ' + bintang + ' Bintang</span>';
                        riwayat.appendChild(item);
                    }
                }
            } catch (err) {
                riwayat.innerHTML = '<p class="text-[11px] text-rose-400 text-center py-2">❌ Gagal memuat riwayat.</p>';
            }
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        window._isLoadingUserDetail = false;
    }
};

// =======================================================
// 5. SET ROLE
// =======================================================
window.setRole = function(role) {
    var adminPanel = document.getElementById('adminPanel');
    var btnUser = document.getElementById('btnRoleUser');
    var btnAdmin = document.getElementById('btnRoleAdmin');
    if (role === 'admin') {
        var pwd = prompt("Masukkan Password Admin:");
        if (pwd === null) return;
        if (pwd !== "min3bondowoso") { alert("Password Salah!"); return; }
        currentRole = 'admin';
        window.currentRole = 'admin';
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
    if (typeof ambilDanTampilkanRanking === 'function') ambilDanTampilkanRanking();
};

// =======================================================
// 6. MODAL SISWA
// =======================================================
window.openAddStudentModal = function() { document.getElementById('addStudentModal').classList.remove('hidden'); };
window.closeAddStudentModal = function() { document.getElementById('addStudentModal').classList.add('hidden'); };
window.openTransactionModal = function() { document.getElementById('TransactionModal').classList.remove('hidden'); };
window.closeTransactionModal = function() { document.getElementById('TransactionModal').classList.add('hidden'); };
window.closeUserDetailModal = function() { document.getElementById('UserDetailModal').classList.add('hidden'); };

window.handleAddStudent = async function(event) {
    event.preventDefault();
    var nama = document.getElementById('newStudentName').value;
    var avatar = document.getElementById('newStudentAvatar').value.trim();
    var stars = parseInt(document.getElementById('newStudentStars').value) || 0;
    var payload = { name: nama, stars: stars };
    if (avatar) payload.avatar_url = avatar;
    try {
        var result = await supabase.from('students').insert([payload]);
        if (result.error) throw result.error;
        alert('Siswa ' + nama + ' berhasil ditambahkan!');
        document.getElementById('addStudentForm').reset();
        closeAddStudentModal();
        ambilDanTampilkanRanking();
    } catch (err) {
        alert('Gagal: ' + err.message);
    }
};

// =======================================================
// 7. EDIT NAMA & FOTO
// =======================================================
window.editNamaSiswa = async function() {
    if (window.currentRole !== 'admin') { alert("Hanya admin!"); return; }
    var namaLama = document.getElementById('modalName').innerText;
    var dataSiswa = null;
    for (var i = 0; i < localStudentsData.length; i++) {
        if (localStudentsData[i].name === namaLama) { dataSiswa = localStudentsData[i]; break; }
    }
    if (!dataSiswa) { alert("Data tidak ditemukan!"); return; }
    var namaBaru = prompt("Edit Nama Siswa\n\nNama lama: " + namaLama + "\n\nMasukkan nama baru:", namaLama);
    if (namaBaru === null) return;
    if (namaBaru.trim() === "") { alert("Nama tidak boleh kosong!"); return; }
    if (namaBaru.trim() === namaLama) { alert("Nama tidak berubah."); return; }
    try {
        var result = await supabase.from('students').update({ name: namaBaru.trim() }).eq('id', dataSiswa.id);
        if (result.error) throw result.error;
        alert("✅ Nama berhasil diubah menjadi: " + namaBaru.trim());
        document.getElementById('UserDetailModal').classList.add('hidden');
        await ambilDanTampilkanRanking();
        var newIndex = -1;
        for (var j = 0; j < localStudentsData.length; j++) {
            if (localStudentsData[j].id === dataSiswa.id) { newIndex = j; break; }
        }
        if (newIndex !== -1) {
            setTimeout(function() { window.viewUserDetail(newIndex + 1); }, 300);
        }
    } catch (err) {
        alert("Gagal: " + err.message);
    }
};

window.bukaEditNama = function() {
    if (window.currentRole !== 'admin') { alert("Hanya admin!"); return; }
    if (!localStudentsData || localStudentsData.length === 0) { alert("Belum ada data!"); return; }
    var daftar = "📋 PILIH SISWA:\n\n";
    for (var i = 0; i < localStudentsData.length; i++) {
        daftar += (i+1) + ". " + localStudentsData[i].name + " (" + localStudentsData[i].stars + " bintang)\n";
    }
    daftar += "\nMasukkan nomor (1-" + localStudentsData.length + "):";
    var pilihan = prompt(daftar);
    if (pilihan === null) return;
    var idx = parseInt(pilihan) - 1;
    if (isNaN(idx) || idx < 0 || idx >= localStudentsData.length) { alert("Pilihan tidak valid!"); return; }
    var dataSiswa = localStudentsData[idx];
    var namaBaru = prompt("Edit Nama\n\nNama: " + dataSiswa.name + "\n\nNama baru:", dataSiswa.name);
    if (namaBaru === null) return;
    if (namaBaru.trim() === "") { alert("Nama tidak boleh kosong!"); return; }
    if (namaBaru.trim() === dataSiswa.name) { alert("Tidak berubah."); return; }
    (async function() {
        try {
            var result = await supabase.from('students').update({ name: namaBaru.trim() }).eq('id', dataSiswa.id);
            if (result.error) throw result.error;
            alert("✅ Nama berhasil diubah!");
            ambilDanTampilkanRanking();
        } catch (err) {
            alert("Gagal: " + err.message);
        }
    })();
};

// =======================================================
// 8. UPLOAD FOTO
// =======================================================
window.ubahFotoSiswaAdmin = async function() {
    if (window.currentRole !== 'admin') { alert("Hanya admin!"); return; }
    var nama = document.getElementById('modalName').innerText;
    var dataSiswa = null;
    for (var i = 0; i < localStudentsData.length; i++) {
        if (localStudentsData[i].name === nama) { dataSiswa = localStudentsData[i]; break; }
    }
    if (!dataSiswa) { alert("Data tidak ditemukan!"); return; }
    var url = prompt("Masukkan URL foto baru:", dataSiswa.avatar_url || "");
    if (url === null || url.trim() === "") { alert("URL tidak boleh kosong!"); return; }
    try {
        var result = await supabase.from('students').update({ avatar_url: url.trim() }).eq('id', dataSiswa.id);
        if (result.error) throw result.error;
        alert("Foto berhasil diperbarui!");
        document.getElementById('UserDetailModal').classList.add('hidden');
        await ambilDanTampilkanRanking();
    } catch (err) {
        alert("Gagal: " + err.message);
    }
};

window.handleModalPhotoUpload = async function(event) {
    var file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert("File harus gambar!"); return; }
    if (file.size > 2 * 1024 * 1024) { alert("Maksimal 2MB!"); return; }
    if (window.currentRole !== 'admin') { alert("Hanya admin!"); return; }
    var nama = document.getElementById('modalName').innerText;
    var dataSiswa = null;
    for (var i = 0; i < localStudentsData.length; i++) {
        if (localStudentsData[i].name === nama) { dataSiswa = localStudentsData[i]; break; }
    }
    if (!dataSiswa) { alert("Data tidak ditemukan!"); return; }
    try {
        if (dataSiswa.avatar_url) {
            var oldName = dataSiswa.avatar_url.split('/').pop();
            if (oldName) {
                await supabase.storage.from('student-avatars').remove(['avatars/' + oldName]);
            }
        }
        var ext = file.name.split('.').pop();
        var fileName = 'avatar_' + dataSiswa.id + '_' + Date.now() + '.' + ext;
        var uploadResult = await supabase.storage.from('student-avatars').upload('avatars/' + fileName, file);
        if (uploadResult.error) throw uploadResult.error;
        var urlResult = supabase.storage.from('student-avatars').getPublicUrl('avatars/' + fileName);
        var publicUrl = urlResult.data.publicUrl;
        var updateResult = await supabase.from('students').update({ avatar_url: publicUrl }).eq('id', dataSiswa.id);
        if (updateResult.error) throw updateResult.error;
        alert("✅ Foto berhasil diupload!");
        await ambilDanTampilkanRanking();
        document.getElementById('UserDetailModal').classList.add('hidden');
    } catch (err) {
        alert("Gagal: " + err.message);
    }
    event.target.value = '';
};

// =======================================================
// 9. CLEANUP & STORAGE
// =======================================================
window.cleanupUnusedAvatars = async function() {
    if (!confirm("Hapus foto tidak terpakai?")) return;
    try {
        var filesResult = await supabase.storage.from('student-avatars').list('avatars/');
        if (filesResult.error) throw filesResult.error;
        var files = filesResult.data;
        if (!files || files.length === 0) { alert("Storage kosong!"); return; }
        var studentsResult = await supabase.from('students').select('avatar_url');
        if (studentsResult.error) throw studentsResult.error;
        var used = new Set();
        for (var i = 0; i < studentsResult.data.length; i++) {
            var url = studentsResult.data[i].avatar_url;
            if (url) {
                var name = url.split('/').pop();
                if (name) used.add(name);
            }
        }
        var toDelete = [];
        for (var j = 0; j < files.length; j++) {
            if (!used.has(files[j].name)) toDelete.push(files[j]);
        }
        if (toDelete.length === 0) { alert("Semua file terpakai!"); return; }
        if (!confirm("Hapus " + toDelete.length + " file?")) return;
        var deleted = 0;
        for (var k = 0; k < toDelete.length; k++) {
            var result = await supabase.storage.from('student-avatars').remove(['avatars/' + toDelete[k].name]);
            if (!result.error) deleted++;
        }
        alert("✅ " + deleted + " file berhasil dihapus!");
    } catch (err) {
        alert("Gagal: " + err.message);
    }
};

window.checkStorageUsage = async function() {
    try {
        var result = await supabase.storage.from('student-avatars').list('avatars/');
        if (result.error) throw result.error;
        var files = result.data || [];
        var total = 0;
        for (var i = 0; i < files.length; i++) {
            total += files[i].metadata?.size || 0;
        }
        alert("📊 STORAGE\n\nTotal file: " + files.length + "\nTotal ukuran: " + (total/1024/1024).toFixed(2) + " MB");
    } catch (err) {
        alert("Gagal: " + err.message);
    }
};

window.debugStudentData = function() {
    console.log("Data siswa:", localStudentsData);
    alert("Cek console (F12) untuk data!");
};

// =======================================================
// 10. EXCEL
// =======================================================
window.handleExcelImport = function(event) {
    var file = event.target.files[0];
    if (!file) { alert("Pilih file!"); return; }
    if (window.currentRole !== 'admin') { alert("Hanya admin!"); return; }
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var data = new Uint8Array(e.target.result);
            var workbook = XLSX.read(data, { type: 'array' });
            var jsonRows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            if (jsonRows.length === 0) { alert("File kosong!"); return; }
            if (!jsonRows[0].hasOwnProperty('nama')) { alert("Format salah! Kolom 'nama' tidak ditemukan."); return; }
            var sukses = 0;
            (async function() {
                for (var i = 0; i < jsonRows.length; i++) {
                    var row = jsonRows[i];
                    var nama = row.nama ? row.nama.toString().trim() : '';
                    if (!nama) continue;
                    var avatar = row.avatar_url ? row.avatar_url.toString().trim() : '';
                    var stars = parseInt(row.bintang_awal) || 0;
                    var payload = { name: nama, stars: stars };
                    if (avatar) payload.avatar_url = avatar;
                    var result = await supabase.from('students').insert([payload]);
                    if (!result.error) sukses++;
                }
                alert("✅ Import selesai! " + sukses + " siswa berhasil ditambahkan.");
                ambilDanTampilkanRanking();
            })();
        } catch (err) {
            alert("Error: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
};

window.downloadExcelTemplate = function() {
    if (typeof XLSX === 'undefined') { alert("Library Excel belum siap!"); return; }
    var data = [{ "nama": "Contoh Nama Siswa", "avatar_url": "https://picsum.photos/seed/siswa/150/150", "bintang_awal": 5 }];
    var ws = XLSX.utils.json_to_sheet(data);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Import_Siswa.xlsx");
};

// =======================================================
// 11. INIT
// =======================================================
window.ambilDanTampilkanRanking = ambilDanTampilkanRanking;
ambilDanTampilkanRanking();

console.log("✅ app.js berhasil dimuat!");
