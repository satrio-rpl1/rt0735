const DB = {
  KEY: (n) => `rt_${n}`,
  read(n, def = []) { try { const v = localStorage.getItem(DB.KEY(n)); return v ? JSON.parse(v) : def; } catch { return def; } },
  write(n, v) { try { localStorage.setItem(DB.KEY(n), JSON.stringify(v)); localStorage.setItem('rt_sync', Date.now().toString()); } catch {} },
  upsert(n, item, idField = 'id') {
    const list = DB.read(n);
    const i = list.findIndex(x => x[idField] === item[idField]);
    if (i >= 0) list[i] = { ...list[i], ...item }; else list.unshift(item);
    DB.write(n, list);
    return item;
  },
  remove(n, id, idField = 'id') {
    const list = DB.read(n);
    DB.write(n, list.filter(x => x[idField] !== id));
    return true;
  },

  genId(prefix = 'RT') {
    return prefix + Date.now().toString().slice(-6) + Math.random().toString(36).slice(2, 5).toUpperCase();
  },
  today() { return new Date().toISOString().split('T')[0]; },
  nowStr() { return new Date().toLocaleString('id-ID'); },

  // ---------- SETTINGS ----------
  async getSettings() {
    let s = DB.read('settings', null);
    if (!s) {
      s = { themeBg: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop', qrisImage: '', general: {} };
      DB.write('settings', s);
    }
    return s;
  },
  async setSettings(data) {
    const s = { ...(DB.read('settings') || {}), ...data };
    DB.write('settings', s);
    return s;
  },

  // ---------- WARGA ----------
  async getWarga() { return DB.read('warga', []); },
  async getWargaByNIK(nik) {
    const list = DB.read('warga', []);
    return list.find(w => w.nik === nik) || null;
  },
  async addWarga(data) {
    const id = this.genId('WRG');
    const item = { ...data, id, createdAt: this.nowStr() };
    return DB.upsert('warga', item);
  },
  async updateWarga(id, data) { 
    return DB.upsert('warga', { id, ...data });
  },
  async deleteWarga(id) { 
    return DB.remove('warga', id);
  },

  // ---------- PENDAFTARAN ----------
  async getPendaftaran() { return DB.read('pendaftaran', []); },
  async addPendaftaran(data) {
    const id = this.genId('PDT');
    const item = { ...data, id, status: data.status || 'pending', createdAt: this.nowStr() };
    return DB.upsert('pendaftaran', item);
  },
  async updatePendaftaranStatus(id, status) {
    const list = DB.read('pendaftaran', []);
    const item = list.find(p => p.id === id);
    if (!item) return null;
    const res = DB.upsert('pendaftaran', { ...item, status });
    if (res && status === 'disetujui') {
      await this.addWarga({ nik: item.nik, nama: item.nama, alamat: item.alamat, jk: item.jk, pekerjaan: item.pekerjaan, kk: item.kk, ktp: item.ktp });
    }
    return res;
  },
  async deletePendaftaran(id) {
    return DB.remove('pendaftaran', id);
  },

  // ---------- SURAT ----------
  async getSurat() { return DB.read('surat', []); },
  async addSurat(data) {
    const id = this.genId('SRT');
    const item = { ...data, id, status: data.status || 'pending', createdAt: this.nowStr() };
    return DB.upsert('surat', item);
  },
  async updateSuratStatus(id, status, fileSurat = null, balasan = '') {
    const list = DB.read('surat', []);
    const item = list.find(s => s.id === id);
    if (!item) return null;
    return DB.upsert('surat', { ...item, status, fileSurat, balasan, updatedAt: this.nowStr() });
  },
  async deleteSurat(id) {
    return DB.remove('surat', id);
  },

  // ---------- KAS (pemasukan/pengeluaran) ----------
  async getKas() { return DB.read('kas', []); },
  async addKas(data) { const id = this.genId('KAS'); const item = { ...data, id, createdAt: this.nowStr() }; return DB.upsert('kas', item); },
  async updateKas(id,data) { return DB.upsert('kas', { id, ...data }); },
  async deleteKas(id) { return DB.remove('kas', id); },
  async getKasSummary() { 
    const list = DB.read('kas', []);
    const pemasukan = list.filter(x => x.tipe === 'pemasukan').reduce((s,x)=>s+(parseInt(x.jumlah)||0),0);
    const pengeluaran = list.filter(x => x.tipe === 'pengeluaran').reduce((s,x)=>s+(parseInt(x.jumlah)||0),0);
    return { totalPemasukan: pemasukan, totalPengeluaran: pengeluaran, saldo: pemasukan - pengeluaran };
  },

  // ---------- PEMBAYARAN (Iuran) ----------
  async getPembayaran() { return DB.read('pembayaran', []); },
  async getPembayaranByNIK(nik) {
    const list = DB.read('pembayaran', []);
    return list.filter(p => p.nik === nik);
  },
  async bayarIuran(id, metode = 'Tunai', bukti = null) {
    const list = DB.read('pembayaran', []);
    const item = list.find(p => p.id === id);
    if (!item) return null;
    return DB.upsert('pembayaran', { ...item, metodeBayar: metode, buktiBayar: bukti, tglBayar: this.nowStr(), status: 'pending' });
  },
  async validasiPembayaran(id, status) {
    const list = DB.read('pembayaran', []);
    const item = list.find(p => p.id === id);
    if (!item) return null;
    return DB.upsert('pembayaran', { ...item, status });
  },

  // ---------- PENGADUAN ----------
  async getPengaduan() { return DB.read('pengaduan', []); },
  async addPengaduan(data) {
    const id = this.genId('ADU');
    const item = { ...data, id, status: data.status || 'pending', createdAt: this.nowStr() };
    return DB.upsert('pengaduan', item);
  },
  async updatePengaduanStatus(id, status, balasan = '') {
    const list = DB.read('pengaduan', []);
    const item = list.find(p => p.id === id);
    if (!item) return null;
    return DB.upsert('pengaduan', { ...item, status, balasan, updatedAt: this.nowStr() });
  },
  async deletePengaduan(id) {
    return DB.remove('pengaduan', id);
  },

  // ---------- PENGUMUMAN ----------
  async getPengumuman() { return DB.read('pengumuman', []); },
  async addPengumuman(data) {
    const id = this.genId('PNG');
    const item = { ...data, id, tanggal: data.tanggal || this.today(), penulis: data.penulis || 'Admin RT' };
    return DB.upsert('pengumuman', item);
  },
  async updatePengumuman(id, data) {
    return DB.upsert('pengumuman', { id, ...data });
  },
  async deletePengumuman(id) {
    return DB.remove('pengumuman', id);
  },

  // ---------- AGENDA ----------
  async getAgenda() { return DB.read('agenda', []); },
  async addAgenda(data) {
    const id = this.genId('AGD');
    const item = { ...data, id, tanggal: data.tanggal || this.today() };
    return DB.upsert('agenda', item);
  },
  async updateAgenda(id, data) {
    return DB.upsert('agenda', { id, ...data });
  },
  async deleteAgenda(id) {
    return DB.remove('agenda', id);
  },

  // ---------- ADMINS ----------
  async getAdmins() { return DB.read('admins', []); },
  async validateLogin(username, password) {
    const list = DB.read('admins', []);
    const a = list.find(x => x.username === username && x.password === password);
    return a || null;
  },
  async addAdmin(username, password) {
    const a = { username, password, createdAt: this.nowStr() };
    return DB.upsert('admins', a, 'username');
  },
  async updateAdmin(username, data) {
    return DB.upsert('admins', { username, ...data }, 'username');
  },
  async deleteAdmin(username) {
    const list = DB.read('admins', []);
    DB.write('admins', list.filter(a => a.username !== username));
    return true;
  },

  // ---------- STATS ----------
  async getStats() {
    const warga = DB.read('warga', []);
    const pendaftaran = DB.read('pendaftaran', []);
    const surat = DB.read('surat', []);
    const pembayaran = DB.read('pembayaran', []);
    const pengaduan = DB.read('pengaduan', []);
    const now = new Date(); const bln = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const totalIuranBulanIni = pembayaran.filter(p => p.bulan === bln && p.status === 'lunas').reduce((s, p) => s + (parseInt(p.jumlah) || 0), 0);
    const totalIuranAllTime = pembayaran.filter(p => p.status === 'lunas').reduce((s, p) => s + (parseInt(p.jumlah) || 0), 0);
    const kasSummary = await this.getKasSummary();
    return {
      totalWarga: warga.length,
      pendaftaranPending: pendaftaran.filter(p => p.status === 'pending').length,
      suratPending: surat.filter(s => s.status === 'pending').length,
      iuranBulanIni: totalIuranBulanIni,
      totalIuran: totalIuranAllTime,
      totalKasPemasukan: kasSummary.totalPemasukan,
      totalKasPengeluaran: kasSummary.totalPengeluaran,
      kasSaldo: kasSummary.saldo,
      pengaduanBaru: pengaduan.filter(p => p.status === 'pending').length,
    };
  },

  async seed() {
    if (!DB.read('admins').length) {
      DB.write('admins', [{ username: 'admin', password: 'admin123' }]);
    }
    if (!DB.read('warga').length) {
      DB.write('warga', [
        { id: this.genId('WRG'), nik: '3512345678900001', nama: 'Budi Santoso', alamat: 'Jl. Mawar No. 1', jk: 'L', pekerjaan: 'Karyawan', kk: '', ktp: '', createdAt: this.nowStr() },
        { id: this.genId('WRG'), nik: '3512345678900002', nama: 'Siti Aminah', alamat: 'Jl. Melati No. 2', jk: 'P', pekerjaan: 'Wiraswasta', kk: '', ktp: '', createdAt: this.nowStr() }
      ]);
    }
    if (!DB.read('pendaftaran').length) {
      DB.write('pendaftaran', [
        { id: this.genId('PDT'), nik: '3512345678900003', nama: 'Andi', alamat: 'Jl. Kenanga No. 3', jk: 'L', pekerjaan: 'Pelajar', status: 'pending', createdAt: this.nowStr() }
      ]);
    }
    if (!DB.read('pembayaran').length) {
      const now = new Date(); const bln = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      DB.write('pembayaran', [
        { id: this.genId('IUR'), nik: '3512345678900001', nama: 'Budi Santoso', bulan: bln, jumlah: 25000, metodeBayar: 'Tunai', status: 'lunas', tglBayar: this.nowStr() },
        { id: this.genId('IUR'), nik: '3512345678900002', nama: 'Siti Aminah', bulan: bln, jumlah: 25000, metodeBayar: 'Transfer', status: 'pending' }
      ]);
    }
    if (!DB.read('kas').length) {
      DB.write('kas', [
        { id: this.genId('KAS'), tipe: 'pemasukan', jumlah: 500000, deskripsi: 'Donasi warga', tanggal: this.today(), createdAt: this.nowStr() },
        { id: this.genId('KAS'), tipe: 'pengeluaran', jumlah: 200000, deskripsi: 'Biaya kebersihan', tanggal: this.today(), createdAt: this.nowStr() }
      ]);
    }
    if (!DB.read('pengumuman').length) {
      DB.write('pengumuman', [
        { id: this.genId('PNG'), judul: 'Kerja Bakti Minggu Depan', konten: 'Wajib hadir untuk semua warga.', kategori: 'kegiatan', tanggal: this.today(), penulis: 'Admin RT' },
        { id: this.genId('PNG'), judul: 'Iuran Bulanan', konten: 'Iuran bulan ini sebesar Rp 25.000.', kategori: 'penting', tanggal: this.today(), penulis: 'Bendahara' }
      ]);
    }
    if (!DB.read('agenda').length) {
      DB.write('agenda', [
        { id: this.genId('AGD'), judul: 'Rapat RT', lokasi: 'Balai RW', waktu: '19:00', tanggal: this.today() }
      ]);
    }
    if (!DB.read('pengaduan').length) {
      DB.write('pengaduan', [
        { id: this.genId('ADU'), nama: 'Warga A', nik: '3512345678900004', isi: 'Lampu jalan mati', status: 'pending', createdAt: this.nowStr() }
      ]);
    }
    if (!DB.read('surat').length) {
      DB.write('surat', [
        { id: this.genId('SRT'), nama: 'Warga B', nik: '3512345678900005', jenis: 'Surat Keterangan Domisili', status: 'pending', createdAt: this.nowStr() }
      ]);
    }
  },
  async clearAll() {
    ['settings','warga','pendaftaran','surat','kas','pembayaran','pengaduan','pengumuman','agenda','admins'].forEach(k => localStorage.removeItem(DB.KEY(k)));
    localStorage.setItem('rt_sync', Date.now().toString());
    return true;
  }
};

try { DB.seed(); } catch {}
