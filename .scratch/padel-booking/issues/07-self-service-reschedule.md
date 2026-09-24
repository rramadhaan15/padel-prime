# 07: Self-Service Reschedule dengan Asymmetric Pricing & 24h Cutoff

**What to build:** Pelanggan dapat mengubah jadwal booking secara mandiri melalui tombol pada tiket digital selama waktu pengajuan minimal 24 jam sebelum jam main. Jika berpindah ke slot yang lebih mahal, pelanggan membayar selisih harga secara instan via QRIS sebelum slot baru dikonfirmasi. Jika berpindah ke slot yang lebih murah, perubahan langsung dikonfirmasi dengan catatan selisih harga hangus tanpa pengembalian uang (zero cash refund). Pengajuan di bawah batas 24 jam ditolak secara tegas.

**Blocked by:** 06: Tiket Digital & Dispatch Dual-Channel (WhatsApp & Invoice Email)

**Status:** ready-for-agent

- [ ] Halaman tiket digital menampilkan opsi "Reschedule Jadwal" hanya jika waktu saat ini masih $\ge 24$ jam sebelum jam slot dimulai
- [ ] Sistem menolak permintaan reschedule yang diajukan dalam kurun waktu kurang dari 24 jam ($T_{\text{now}} > T_{\text{slot\_start}} - 24\text{ jam}$) dengan pesan error penolakan cutoff
- [ ] Reschedule ke slot dengan harga lebih tinggi ($\Delta \text{Price} > 0$) mengunci slot baru sementara dan mewajibkan pembayaran selisih instan sebelum migrasi slot difinalisasi
- [ ] Reschedule ke slot dengan harga lebih rendah atau sama ($\Delta \text{Price} \le 0$) langsung memindahkan booking ke slot baru dan menandai kelebihan harga sebagai hangus (forfeited) tanpa refund tunai
- [ ] Slot jadwal lama secara atomik dilepas kembali ke status Available setelah konfirmasi migrasi slot berhasil
- [ ] Pengujian otomatis memvalidasi penolakan di bawah batas 24 jam, keharusan pembayaran selisih harga pada upgrade, dan pencatatan forfeiture pada downgrade
