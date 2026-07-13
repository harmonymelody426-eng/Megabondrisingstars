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
}

// =======================================================
// 1. LOGIKA KONVERSI TOTAL BINTANG KE SISTEM TIER ML (ASLI)
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
            if (p1Avatar && siswa[0].avatar_url) {
                p1Avatar.src = siswa[0].avatar_url;
            }
            
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
            if (p2Avatar && siswa[1].avatar_url) {
                p2Avatar.src = siswa[1].avatar_url;
            }
            
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
            if (p3Avatar && siswa[2].avatar_url) {
                p3Avatar.src = siswa[2].avatar_url;
            }
            
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
            const card4 = document.getElementById('card-rank-4');
            if (card4) card4.setAttribute('onclick', 'window.viewUserDetail(4)');
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
        } else {
            if (p5Name) p5Name.innerText = '-';
            if (p5Stars) p5Stars.innerText = '0';
        }

        // --- KLASEMEN UMUM ---
        const leaderboardList = document.getElementById('leaderboardList');
        if (leaderboardList) {
            leaderboardList.innerHTML = '';
            siswa
