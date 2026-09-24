# 08: Dashboard Operasional Staf, Walk-in & Slot Blocking

**What to build:** Staf venue dapat mengakses dashboard operasional terproteksi untuk memantau okupansi seluruh lapangan secara real-time, melihat jumlah raket dan bola yang perlu disiapkan di meja depan per jam, membuat reservasi manual untuk pelanggan walk-in atau telepon, serta menerapkan atau mencabut slot block pada jadwal lapangan untuk keperluan perawatan atau turnamen.

**Blocked by:** 04: Guest Checkout & Integrasi Payment Gateway (QRIS & Virtual Account)

**Status:** ready-for-agent

- [ ] Dashboard staf terproteksi menampilkan grid jadwal harian seluruh lapangan dengan indikator status keterisian dan rekapitulasi pendapatan
- [ ] Widget alokasi equipment pool menampilkan total raket dan bola yang wajib disiapkan di meja staf untuk setiap jam slot aktif
- [ ] Staf dapat membuat reservasi manual untuk walk-in atau telepon yang langsung mengonfirmasi slot tanpa alur pembayaran gateway
- [ ] Staf dapat melakukan Slot Block pada slot jadwal yang masih terbuka dengan menyertakan alasan (misal: Maintenance, Turnamen Internal), sehingga slot tidak lagi terlihat/dapat dipesan publik
- [ ] Staf dapat melakukan Unblock pada slot yang diblokir untuk mengembalikannya seketika ke ketersediaan publik
- [ ] Pengujian otomatis memvalidasi otentikasi staf, aksi block/unblock slot jadwal, dan pembuatan reservasi walk-in oleh staf
