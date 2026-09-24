# 03: Equipment Pool & Pemilihan Add-on pada Checkout

**What to build:** Pada halaman checkout, pelanggan dapat menambahkan opsi sewa raket dan pembelian bola. Sistem membatasi sewa raket maksimal 4 unit per slot jadwal dan memvalidasi ketersediaan stok fisik terhadap Equipment Pool venue pada jam terkait. Pilihan add-on terikat secara atomik ke Slot Hold aktif dan total biaya diperbarui secara dinamis.

**Blocked by:** 02: Pessimistic Slot Hold & Concurrency Control

**Status:** ready-for-agent

- [ ] Antarmuka checkout menyediakan pilihan item add-on untuk sewa raket dan pembelian kaleng bola dengan rincian harga per unit
- [ ] Sistem membatasi jumlah sewa raket maksimal 4 unit untuk satu slot jadwal lapangan
- [ ] Sistem memeriksa ketersediaan stok time-bucketed equipment pool venue; item yang habis ditandai disabled dengan indikator out-of-stock yang jelas
- [ ] Add-on yang dipilih terikat secara atomik dengan data Slot Hold aktif
- [ ] Total harga pada ringkasan checkout otomatis terhitung mencakup biaya slot lapangan dan add-on yang dipilih
- [ ] Pengujian otomatis memverifikasi batas maksimal 4 raket per slot dan penolakan sewa jika stok equipment pool pada jam tersebut sudah habis
