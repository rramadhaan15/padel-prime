# 06: Tiket Digital & Dispatch Dual-Channel (WhatsApp & Invoice Email)

**What to build:** Ketika booking terkonfirmasi, sistem menerbitkan tiket digital interaktif dengan QR code bertanda tangan kriptografis (HMAC-SHA256). Sistem kemudian secara otomatis mendispatch ringkasan booking beserta tautan tiket digital ke nomor WhatsApp pelanggan, serta mengirimkan invoice resmi berbentuk PDF via email sebagai bukti formal pembayaran.

**Blocked by:** 04: Guest Checkout & Integrasi Payment Gateway (QRIS & Virtual Account)

**Status:** ready-for-agent

- [ ] Sistem mengenerate tiket digital berisi detail lapangan, waktu slot, ringkasan add-on, dan QR code yang mengenkripsi payload ber-signature HMAC-SHA256
- [ ] Halaman web tiket digital menyajikan tampilan mobile-friendly dengan kode QR kontras tinggi yang siap dipindai di pintu masuk venue
- [ ] Layanan dispatch WhatsApp mengirimkan pesan interaktif berisi ucapan konfirmasi, ringkasan jadwal, dan tautan langsung ke tiket digital
- [ ] Layanan email mengirimkan invoice resmi PDF dengan rincian biaya lengkap untuk keperluan reimbursement atau tanda terima resmi
- [ ] Pengujian otomatis memvalidasi keabsahan signature QR code dan memastikan pemalsuan isi payload (tampering) langsung terdeteksi gagal
- [ ] Pengujian otomatis memverifikasi pemanggilan modul notifikasi WhatsApp dan Email saat status booking beralih ke Confirmed
