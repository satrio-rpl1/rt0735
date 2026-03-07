// ============================================================
//  main.js — UI interactions for user-facing pages
// ============================================================

// ---- TOAST ----
function showToast(msg, type = 'success', duration = 4000) {
    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info', warning: 'fa-triangle-exclamation' };
    const container = document.getElementById('toast-container') || (() => {
        const el = document.createElement('div');
        el.id = 'toast-container';
        el.className = 'toast-container';
        document.body.appendChild(el);
        return el;
    })();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info} toast-icon"></i><span>${msg}</span><button class="toast-close" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('hiding'); setTimeout(() => toast.remove(), 300); }, duration);
}

// ---- MODAL ----
function openModal(id) { document.getElementById(id)?.classList.add('show'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('show'); }
document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('show');
    if (e.target.classList.contains('modal-close') || e.target.closest('.modal-close')) {
        e.target.closest('.modal-overlay')?.classList.remove('show');
    }
});

// ---- HAMBURGER NAV ----
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
    document.addEventListener('click', e => { if (!e.target.closest('.navbar')) navLinks.classList.remove('open'); });
}

// ---- ANIMATE ON SCROLL ----
const animObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('animated'); animObserver.unobserve(e.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('.animate-on-scroll').forEach(el => animObserver.observe(el));

// ---- COUNTER ANIMATION ----
function animateCounter(el, target, duration = 1500) {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
        start += step;
        if (start >= target) { el.textContent = target.toLocaleString('id-ID'); clearInterval(timer); }
        else { el.textContent = Math.floor(start).toLocaleString('id-ID'); }
    }, 16);
}
function initCounters() {
    document.querySelectorAll('[data-count]').forEach(el => {
        const obs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) { animateCounter(el, parseInt(el.dataset.count)); obs.unobserve(el); }
        });
        obs.observe(el);
    });
}

// ---- SET ACTIVE NAV ----
function setActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(a => {
        const href = a.getAttribute('href');
        if (href && (href === path || href.includes(path))) a.classList.add('active');
    });
}

// ---- FILE UPLOAD HANDLER ----
function setupFileUpload(inputId, previewId, maxMB = 5) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;
    const area = input.closest('.upload-area');
    area?.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('dragover'); });
    area?.addEventListener('dragleave', () => area.classList.remove('dragover'));
    area?.addEventListener('drop', e => { e.preventDefault(); area.classList.remove('dragover'); if (e.dataTransfer.files[0]) { input.files = e.dataTransfer.files; handleFile(input.files[0]); } });
    input.addEventListener('change', () => { if (input.files[0]) handleFile(input.files[0]); });
    function handleFile(file) {
        if (file.size > maxMB * 1024 * 1024) { showToast(`File terlalu besar. Maksimal ${maxMB}MB`, 'error'); input.value = ''; return; }
        const allowed = ['image/jpeg', 'image/png', 'application/pdf', 'image/jpg'];
        if (!allowed.includes(file.type)) { showToast('Format file tidak didukung', 'error'); input.value = ''; return; }
        const icon = file.type === 'application/pdf' ? 'fa-file-pdf' : 'fa-file-image';
        preview.innerHTML = `<i class="fa-solid ${icon}"></i>${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
        preview.classList.add('show');
    }
}

// ---- COMPRESS IMAGE ----
async function compressImage(base64, maxWidth = 1200, quality = 0.7) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(base64); // Fallback if error
    });
}

// ---- CONVERT FILE TO BASE64 ----
function fileToBase64(file) {
    return new Promise((res, rej) => {
        if (!file) { res(null); return; }
        const reader = new FileReader();
        reader.onload = async () => {
            let result = reader.result;
            // Auto compress if image and large
            if (file.type.startsWith('image/')) {
                result = await compressImage(result, 1200, 0.7);
            }
            res(result);
        };
        reader.onerror = rej;
        reader.readAsDataURL(file);
    });
}

// ---- FORMAT CURRENCY ----
function formatRp(num) { return 'Rp ' + Number(num).toLocaleString('id-ID'); }

// ---- FORMAT DATE ----
function formatDate(str) {
    if (!str) return '-';
    const d = new Date(str);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
function formatDateShort(str) {
    if (!str) return '-';
    const d = new Date(str);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ---- MONTH MAP ----
const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
function bulanToIndo(bulan) {
    const [y, m] = bulan.split('-');
    return `${MONTHS_ID[parseInt(m) - 1]} ${y}`;
}

// ---- LOAD PENGUMUMAN on home ----
async function loadLatestPengumuman(containerId, limit = 3) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const all = await DB.getPengumuman() || [];
    const list = all.slice(0, limit);
    if (!list.length) { el.innerHTML = '<div class="empty-state"><i class="fa-solid fa-bell-slash"></i><h3>Belum ada pengumuman</h3></div>'; return; }
    el.innerHTML = list.map(p => pengumumanCardHTML(p)).join('');
    el.querySelectorAll('.animate-on-scroll').forEach(c => animObserver.observe(c));
}

function pengumumanCardHTML(p) {
    const badgeMap = { penting: 'badge-penting', info: 'badge-info', kegiatan: 'badge-kegiatan', umum: 'badge-umum' };
    const badgeLabel = { penting: '⚠️ Penting', info: 'ℹ️ Info', kegiatan: '📅 Kegiatan', umum: '📢 Umum' };
    return `<div class="pengumuman-card animate-on-scroll" onclick="showPengumumanDetail('${p.id}')">
    <div class="peng-header">
      <div><div class="peng-title">${p.judul}</div></div>
      <span class="peng-badge ${badgeMap[p.kategori] || 'badge-umum'}">${badgeLabel[p.kategori] || p.kategori}</span>
    </div>
    <div class="peng-desc">${p.konten}</div>
    <div class="peng-footer">
      <span class="peng-date"><i class="fa-regular fa-calendar"></i> ${formatDate(p.tanggal)}</span>
      <button class="btn-detail">Baca Selengkapnya <i class="fa-solid fa-arrow-right"></i></button>
    </div>
  </div>`;
}

async function showPengumumanDetail(id) {
    const all = await DB.getPengumuman();
    const p = all.find(x => x.id === id);
    if (!p) return;
    const badgeMap = { penting: 'badge-penting', info: 'badge-info', kegiatan: 'badge-kegiatan', umum: 'badge-umum' };
    const modal = document.getElementById('modal-pengumuman');
    if (modal) {
        modal.querySelector('.modal-body').innerHTML = `
      <span class="peng-badge ${badgeMap[p.kategori] || 'badge-umum'} mb-2" style="display:inline-flex;margin-bottom:1rem">${p.kategori}</span>
      <h2 style="font-size:1.3rem;font-weight:800;margin-bottom:.5rem">${p.judul}</h2>
      <p style="font-size:.85rem;color:var(--text-gray);margin-bottom:1.5rem"><i class="fa-regular fa-calendar"></i> ${formatDate(p.tanggal)} &bull; Oleh: ${p.penulis || 'Admin RT'}</p>
      <p style="line-height:1.8;color:var(--text-dark)">${p.konten}</p>`;
        openModal('modal-pengumuman');
    }
}

// ---- LOAD AGENDA ----
async function loadAgendaList(containerId, limit = 4) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const all = await DB.getAgenda() || [];
    const list = all.slice(0, limit);
    if (!list.length) { el.innerHTML = '<div class="empty-state"><i class="fa-regular fa-calendar-xmark"></i><h3>Belum ada agenda</h3></div>'; return; }
    el.innerHTML = list.map(a => agendaItemHTML(a)).join('');
    el.querySelectorAll('.animate-on-scroll').forEach(c => animObserver.observe(c));
}

function agendaItemHTML(a) {
    const d = a.tanggal ? new Date(a.tanggal) : new Date();
    const isInvalid = isNaN(d.getTime());
    const day = isInvalid ? '-' : d.getDate();
    const monthStr = isInvalid ? '---' : MONTHS_ID[d.getMonth()].slice(0, 3);

    return `<div class="agenda-item animate-on-scroll">
    <div class="agenda-date-box">
      <span class="day">${day}</span>
      <span class="month">${monthStr}</span>
    </div>
    <div class="agenda-info">
      <h4>${a.judul}</h4>
      <p><i class="fa-solid fa-location-dot" style="color:var(--primary);font-size:.8rem"></i> ${a.lokasi}</p>
    </div>
    <span class="agenda-time"><i class="fa-regular fa-clock"></i> ${a.waktu} WIB</span>
  </div>`;
}

// ---- APPLY THEME ----
// ---- PROTOCOL CHECK ----
function checkProtocol() {
    if (window.location.protocol === 'file:') {
        const overlay = document.createElement('div');
        overlay.style = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);z-index:99999;display:flex;align-items:center;justify-content:center;color:white;text-align:center;padding:2rem;font-family:sans-serif';
        overlay.innerHTML = `
            <div style="max-width:600px;background:#1e293b;padding:3rem;border-radius:24px;border:1px solid rgba(255,255,255,0.1);box-shadow:0 25px 50px -12px rgba(0,0,0,0.5)">
                <div style="width:80px;height:80px;background:rgba(239,68,68,0.1);color:#ef4444;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 2rem;font-size:2.5rem"><i class="fa-solid fa-triangle-exclamation"></i></div>
                <h1 style="margin-bottom:1rem;font-size:1.8rem;font-weight:800">Gunakan Localhost!</h1>
                <p style="font-size:1rem;line-height:1.6;opacity:0.9;margin-bottom:2rem">
                    Kamu membuka file ini secara langsung. Karena website ini menggunakan <b>PHP & Database</b>, 
                    kamu wajib menggunakan <b>XAMPP</b> dan mengaksesnya melalui alamat <b>localhost</b>.
                </p>
                <div style="background:rgba(0,0,0,0.3);padding:1.25rem;border-radius:12px;margin-bottom:2rem;border:1px solid rgba(255,255,255,0.05)">
                    <p style="font-size:0.8rem;opacity:0.6;margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.05em">Akses melalui link ini:</p>
                    <code style="color:#10b981;font-size:1.2rem;font-weight:700;word-break:break-all">http://localhost/pakrt/</code>
                </div>
                <p style="font-size:0.85rem;opacity:0.5">Pastikan modul <b>Apache</b> & <b>MySQL</b> di XAMPP sudah berwarna hijau (Running).</p>
            </div>
        `;
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
    }
}
async function applyTheme() {
    const settings = await DB.getSettings();
    if (settings.themeBg) {
        // ONLY apply to hero section on homepage
        const heroBg = document.getElementById('hero-bg');
        if (heroBg) {
            // Apply clear background to the dedicated animated container
            heroBg.style.backgroundImage = `linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1)), url("${settings.themeBg}")`;
        } else {
            // Fallback for sections without hero-bg
            const hero = document.querySelector('.hero');
            if (hero) {
                hero.style.setProperty('background', `linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1)), url("${settings.themeBg}")`, 'important');
                hero.style.backgroundSize = 'cover';
                hero.style.backgroundPosition = 'center';
            }
        }

        // Ensure body background is default and not overridden by previous theme logic
        document.body.style.background = '';
        document.body.style.backgroundImage = '';

        // Ensure other headers are clear and not themed
        const pageHeader = document.querySelector('.page-header');
        if (pageHeader) {
            pageHeader.style.background = '';
        }
    }
}

// ---- ON DOM READY ----
document.addEventListener('DOMContentLoaded', async () => {
    checkProtocol();
    applyTheme();
    setActiveNav();
    // update stats from DB
    const stats = await DB.getStats();
    document.querySelectorAll('[data-stat]').forEach(el => {
        const key = el.dataset.stat;
        if (stats[key] !== undefined) {
            el.dataset.count = stats[key];
            if (key === 'totalIuran' || key === 'iuranBulanIni' || key.startsWith('totalKas') || key === 'kasSaldo') {
                el.textContent = formatRp(stats[key]);
            } else {
                el.textContent = stats[key].toLocaleString('id-ID');
            }
        }
    });
    initCounters(); // Panggil setelah semua data-count diisi
    loadLatestPengumuman('pengumuman-container');
    loadAgendaList('agenda-container');

    // Realtime sync across tabs
    window.addEventListener('storage', async (e) => {
        if (e.key === 'rt_sync') { // Simplified for SQL
            loadLatestPengumuman('pengumuman-container');
            loadAgendaList('agenda-container');
            const s = await DB.getStats();
            document.querySelectorAll('[data-stat]').forEach(el => {
                const k = el.dataset.stat;
                if (s[k] !== undefined) el.textContent = (k === 'totalIuran' || k === 'iuranBulanIni') ? formatRp(s[k]) : s[k].toLocaleString('id-ID');
            });
        }
    });
});
