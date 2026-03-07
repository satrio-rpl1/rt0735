// ============================================================
//  validation.js — Form validation helpers for RT website
// ============================================================

const Validate = {
    nik(val) {
        if (!val) return 'NIK wajib diisi';
        if (!/^\d{16}$/.test(val)) return 'NIK harus 16 digit angka';
        return null;
    },
    nama(val) {
        if (!val || !val.trim()) return 'Nama wajib diisi';
        if (val.trim().length < 3) return 'Nama minimal 3 karakter';
        if (!/^[a-zA-Z\s'.,-]+$/.test(val)) return 'Nama hanya boleh berisi huruf';
        return null;
    },
    required(val, label = 'Field ini') {
        if (!val || !String(val).trim()) return `${label} wajib diisi`;
        return null;
    },
    tanggal(val) {
        if (!val) return 'Tanggal wajib diisi';
        if (isNaN(Date.parse(val))) return 'Format tanggal tidak valid';
        return null;
    },
    telepon(val) {
        if (!val) return 'Nomor telepon wajib diisi';
        if (!/^(\+62|0)[0-9]{8,13}$/.test(val.replace(/\s/g, ''))) return 'Nomor telepon tidak valid (cth: 08xx / +628xx)';
        return null;
    },
    file(file, required = false) {
        if (!file) return required ? 'File wajib diunggah' : null;
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!allowed.includes(file.type)) return 'Format harus JPG, PNG, atau PDF';
        if (file.size > 5 * 1024 * 1024) return 'Ukuran file maksimal 5MB';
        return null;
    },
    imageFile(file, required = false) {
        if (!file) return required ? 'Foto wajib diunggah' : null;
        const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowed.includes(file.type)) return 'Format harus JPG atau PNG';
        if (file.size > 5 * 1024 * 1024) return 'Ukuran foto maksimal 5MB';
        return null;
    },

    // Show/clear field error
    showError(inputEl, errEl, msg) {
        inputEl.classList.add('error');
        inputEl.classList.remove('success-field');
        if (errEl) { errEl.textContent = (msg ? '⚠ ' : '') + (msg || ''); errEl.classList.toggle('show', !!msg); }
    },
    clearError(inputEl, errEl) {
        inputEl.classList.remove('error');
        inputEl.classList.add('success-field');
        if (errEl) { errEl.textContent = ''; errEl.classList.remove('show'); }
    },

    // Validate a field and show/hide error automatically
    field(inputEl, rules, errElId) {
        const errEl = document.getElementById(errElId);
        const val = inputEl.value.trim();
        let error = null;
        for (const rule of rules) {
            const r = rule(val);
            if (r) { error = r; break; }
        }
        if (error) this.showError(inputEl, errEl, error);
        else this.clearError(inputEl, errEl);
        return !error;
    },

    // Attach real-time validation to a field
    attach(inputId, rules, errElId) {
        const input = document.getElementById(inputId);
        if (!input) return;
        const validate = () => this.field(input, rules, errElId);
        input.addEventListener('blur', validate);
        input.addEventListener('input', () => {
            if (input.classList.contains('error')) validate();
        });
    },

    // Validate entire form
    form(fields) {
        let valid = true;
        fields.forEach(({ inputId, rules, errElId }) => {
            const input = document.getElementById(inputId);
            if (!input) return;
            if (!this.field(input, rules, errElId)) valid = false;
        });
        return valid;
    }
};

// Rule factories
const R = {
    required: (label) => (val) => Validate.required(val, label),
    nik: () => (val) => Validate.nik(val),
    nama: () => (val) => Validate.nama(val),
    tanggal: () => (val) => Validate.tanggal(val),
    telepon: () => (val) => Validate.telepon(val),
    minLen: (n, label = 'Field') => (val) => val && val.length < n ? `${label} minimal ${n} karakter` : null,
    maxLen: (n, label = 'Field') => (val) => val && val.length > n ? `${label} maksimal ${n} karakter` : null,
};
