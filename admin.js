// ============================================================
//  admin.js — Admin auth & dashboard logic for RT website
// ============================================================

// ---- AUTH ----
const Auth = {
    KEY: 'rt_admin_session',
    async login(username, password) {
        const admin = await DB.validateLogin(username, password);
        if (admin) {
            sessionStorage.setItem(this.KEY, JSON.stringify({ username: admin.username, loginAt: new Date().toISOString() }));
            return true;
        }
        return false;
    },
    logout() { sessionStorage.removeItem(this.KEY); window.location.href = 'admin-login.html'; },
    isLoggedIn() { return !!sessionStorage.getItem(this.KEY); },
    require() {
        if (!this.isLoggedIn()) {
            sessionStorage.setItem('rt_redirect', window.location.href);
            window.location.href = 'admin-login.html';
        }
    },
    getUser() { try { return JSON.parse(sessionStorage.getItem(this.KEY)); } catch { return null; } }
};

// ---- ADMIN TOAST ----
function adminToast(msg, type = 'success') {
    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info', warning: 'fa-triangle-exclamation' };
    let c = document.getElementById('admin-toast-container');
    if (!c) { c = document.createElement('div'); c.id = 'admin-toast-container'; c.className = 'toast-container'; document.body.appendChild(c); }
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<i class="fa-solid ${icons[type] || icons.info} toast-icon"></i><span>${msg}</span><button class="toast-close" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>`;
    c.appendChild(t);
    setTimeout(() => { t.classList.add('hiding'); setTimeout(() => t.remove(), 300); }, 4000);
}

// ---- MODAL ----
function openModal(id) { document.getElementById(id)?.classList.add('show'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('show'); }

/**
 * Custom Premium Confirmation Modal
 * @param {string} msg 
 * @param {string} title 
 * @param {string} type - 'danger' or 'warning'
 * @returns {Promise<boolean>}
 */
function adminConfirm(msg, title = 'Konfirmasi Hapus', type = 'danger') {
    return new Promise(resolve => {
        let modal = document.getElementById('admin-confirm-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'admin-confirm-modal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        const icon = type === 'danger' ? 'fa-trash-can' : 'fa-triangle-exclamation';
        const colorClass = type === 'danger' ? '' : 'warning';
        const btnClass = type === 'danger' ? 'btn-danger' : 'btn-warning';

        modal.innerHTML = `
            <div class="admin-modal modal-confirm">
                <div class="modal-confirm-icon ${colorClass}">
                    <i class="fa-solid ${icon}"></i>
                </div>
                <div class="modal-confirm-title">${title}</div>
                <div class="modal-confirm-text">${msg}</div>
                <div class="modal-confirm-btns">
                    <button class="btn btn-secondary" data-confirm="false">Batal</button>
                    <button class="btn ${btnClass}" data-confirm="true">Ya, Hapus</button>
                </div>
            </div>
        `;

        requestAnimationFrame(() => modal.classList.add('show'));

        const handleAction = (val) => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.innerHTML = '';
                resolve(val);
            }, 300);
        };

        modal.querySelectorAll('button').forEach(btn => {
            btn.onclick = () => handleAction(btn.dataset.confirm === 'true');
        });

        modal.onclick = (e) => { if (e.target === modal) handleAction(false); };
    });
}

document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('show');
    if (e.target.classList.contains('modal-close') || e.target.closest('.modal-close')) {
        e.target.closest('.modal-overlay')?.classList.remove('show');
    }
});

// ---- SIDEBAR TOGGLE (mobile) ----
function initSidebar() {
    const toggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const adminContent = document.querySelector('.admin-content'); // Get admin-content

    toggle?.addEventListener('click', () => {
        sidebar?.classList.toggle('open');
        adminContent?.classList.toggle('sidebar-open'); // Toggle class on admin-content
    });
    document.addEventListener('click', e => {
        if (sidebar?.classList.contains('open') && !e.target.closest('#sidebar') && !e.target.closest('#sidebar-toggle')) {
            sidebar.classList.remove('open');
            adminContent?.classList.remove('sidebar-open'); // Remove class from admin-content
        }
    });
}

// ---- IMAGE VIEWER ----
function initImageViewer() {
    let viewer = document.getElementById('img-viewer');
    if (!viewer) {
        viewer = document.createElement('div');
        viewer.id = 'img-viewer';
        viewer.className = 'img-viewer-overlay';
        viewer.innerHTML = `<button class="img-viewer-close" onclick="document.getElementById('img-viewer').classList.remove('show')"><i class="fa-solid fa-xmark"></i></button><img class="img-viewer-img" id="img-viewer-img" src="" alt="Preview">`;
        document.body.appendChild(viewer);
        viewer.addEventListener('click', e => { if (e.target === viewer) viewer.classList.remove('show'); });
    }
}
function viewImage(src) {
    initImageViewer();
    document.getElementById('img-viewer-img').src = src;
    document.getElementById('img-viewer').classList.add('show');
}

// ---- FORMAT HELPERS ----
function formatRp(n) { return 'Rp ' + Number(n).toLocaleString('id-ID'); }
function formatDate(s) { if (!s) return '-'; return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); }
function formatDateShort(s) { if (!s) return '-'; return new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); }
const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
function bulanToIndo(b) { const [y, m] = b.split('-'); return `${MONTHS_ID[parseInt(m) - 1]} ${y}`; }

// ---- STATUS BADGE ----
function statusBadge(status) {
    const map = {
        pending: 'badge-pending ⏳ Menunggu',
        proses: 'badge-proses 🔄 Diproses',
        disetujui: 'badge-selesai ✅ Disetujui',
        selesai: 'badge-selesai ✅ Selesai',
        ditolak: 'badge-ditolak ❌ Data Tidak Valid',
        'uang-tidak-masuk': 'badge-ditolak 💸 Uang Tidak Masuk',
        lunas: 'badge-lunas ✅ Lunas',
        belum: 'badge-belum ❌ Belum Bayar'
    };
    const parts = (map[status] || `badge-umum ${status}`).split(' ');
    const cls = parts.shift(); const label = parts.join(' ');
    return `<span class="badge ${cls}"><span class="badge-dot"></span>${label}</span>`;
}

// ---- SEARCH/FILTER helper ----
function filterTable(rows, query, columns) {
    rows.forEach(row => {
        const text = columns.map(c => (row.dataset[c] || row.cells[c]?.textContent || '').toLowerCase()).join(' ');
        row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
    });
}

// ---- PAGINATION ----
function paginate(items, page, perPage) {
    const start = (page - 1) * perPage;
    return { data: items.slice(start, start + perPage), total: items.length, pages: Math.ceil(items.length / perPage) };
}
function renderPagination(containerId, totalPages, currentPage, onClick) {
    const el = document.getElementById(containerId);
    if (!el || totalPages <= 1) { if (el) el.innerHTML = ''; return; }
    let html = `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="${onClick}(${currentPage - 1})"><i class="fa-solid fa-chevron-left"></i></button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) html += `<button class="page-btn${i === currentPage ? ' active' : ''}" onclick="${onClick}(${i})">${i}</button>`;
        else if (Math.abs(i - currentPage) === 2) html += '<span style="color:var(--text-light);padding:0 .25rem">…</span>';
    }
    html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="${onClick}(${currentPage + 1})"><i class="fa-solid fa-chevron-right"></i></button>`;
    el.innerHTML = html;
}

// ---- STATS COUNTER ----
function animateCounter(el, to, dur = 1200) {
    let v = 0; const s = to / (dur / 16);
    const t = setInterval(() => { v += s; if (v >= to) { el.textContent = to.toLocaleString('id-ID'); clearInterval(t); } else { el.textContent = Math.floor(v).toLocaleString('id-ID'); } }, 16);
}

// ---- COMMON INIT ----
document.addEventListener('DOMContentLoaded', async () => {
    // Protect all admin pages (except login.html)
    if (!window.location.pathname.endsWith('login.html')) {
        Auth.require();
    }
    // Sidebar
    initSidebar();
    // Update stats counters
    const stats = await DB.getStats();
    document.querySelectorAll('[data-stat]').forEach(el => {
        const k = el.dataset.stat;
        if (stats[k] !== undefined) animateCounter(el, stats[k]);
    });
    // Sidebar badges
    document.querySelectorAll('[data-badge-stat]').forEach(el => {
        const k = el.dataset.badgeStat;
        if (stats[k] > 0) el.textContent = stats[k];
        else el.style.display = 'none';
    });
    // Active sidebar link
    const path = window.location.pathname.split('/').pop();
    document.querySelectorAll('.sidebar-link').forEach(a => {
        if (a.getAttribute('href') === path) a.classList.add('active');
    });



    // Logout btn
    document.getElementById('btn-logout')?.addEventListener('click', () => Auth.logout());
});
