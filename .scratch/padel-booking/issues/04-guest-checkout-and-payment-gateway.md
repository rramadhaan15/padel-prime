# 04: Guest Checkout & Integrasi Payment Gateway (QRIS & Virtual Account)

**What to build:** Pelanggan menyelesaikan proses checkout tanpa repot registrasi akun menggunakan Nama, Email, dan nomor WhatsApp yang tervalidasi format internasional (E.164). Pelanggan memilih metode pembayaran (QRIS Dinamis atau Virtual Account BCA/Mandiri), melihat rincian pembayaran, dan saat pembayaran berhasil dikonfirmasi oleh webhook gateway pembayaran, booking bertransisi ke status Confirmed.

**Blocked by:** 03: Equipment Pool & Pemilihan Add-on pada Checkout

**Status:** ready-for-agent

- [ ] Formulir guest checkout mengumpulkan Nama, Email, dan nomor WhatsApp dengan validasi dan normalisasi format E.164
- [ ] Tombol bayar membuat transaksi ke gateway pembayaran (Midtrans / Xendit) dan menampilkan QRIS dinamis atau nomor Virtual Account di layar
- [ ] Endpoint webhook memverifikasi cryptographic signature dari gateway pembayaran dan memproses status settlement secara idaman (idempotent)
- [ ] Settlement pembayaran berhasil mengonversi Slot Hold dan alokasi Add-on menjadi record Booking Confirmed di database PostgreSQL
- [ ] Layar checkout langsung menampilkan halaman sukses pembayaran dengan kode booking referensi dan rincian transaksi
- [ ] Pengujian otomatis membuktikan verifikasi signature webhook, penanganan webhook duplikat (tidak terjadi double-confirmation), dan transisi status booking menjadi Confirmed
