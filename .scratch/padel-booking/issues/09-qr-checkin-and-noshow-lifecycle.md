# 09: On-Site QR Check-in & Automated No-Show Lifecycle Sweep

**What to build:** Staf venue dapat memverifikasi kedatangan pelanggan dengan memindai kode QR tiket digital menggunakan kamera perangkat atau mencari booking berdasarkan nomor WhatsApp/nama. Sistem mencatat check-in dengan timestamp. Worker latar belakang terjadwal secara otomatis mengubah booking yang tidak check-in hingga akhir sesi menjadi status No-Show dan menandai (flag) pelanggan yang telah mengumpulkan 3 kali atau lebih insiden No-Show.

**Blocked by:** 06: Tiket Digital & Dispatch Dual-Channel (WhatsApp & Invoice Email), 08: Dashboard Operasional Staf, Walk-in & Slot Blocking

**Status:** ready-for-agent

- [ ] Antarmuka dashboard staf menyediakan modul pemindai QR berbasis kamera dan kolom pencarian instan berdasarkan nomor WhatsApp atau Nama pelanggan
- [ ] Pemindaian kode QR yang valid memverifikasi signature kriptografis dan mengubah status booking menjadi Checked-In dengan stempel waktu real-time
- [ ] Pemindaian tiket yang sudah pernah di-check-in, tiket yang telah di-reschedule, atau kode QR palsu menghasilkan notifikasi peringatan penolakan yang tegas
- [ ] Worker terjadwal (sweep job) mendeteksi booking confirmed yang jam slotnya telah berakhir tanpa adanya check-in, lalu mengubah statusnya menjadi No-Show
- [ ] Profil pelanggan menampilkan label/badge "Flagged" pada dashboard staf jika pelanggan telah tercatat memiliki 3 kali atau lebih insiden No-Show
- [ ] Pengujian otomatis membuktikan verifikasi kriptografis QR, perubahan status check-in, penolakan pemindaian duplikat, dan eksekusi sweep no-show otomatis
