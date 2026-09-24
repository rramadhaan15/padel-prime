# 05: Background Hold Expiry Worker & Active Payment Inquiry

**What to build:** Worker latar belakang (BullMQ) secara presisi memeriksa Slot Hold yang telah mencapai batas 10 menit. Sebelum melepas inventaris lapangan dan peralatan kembali ke publik, worker mengecek status pembayaran langsung (Active Inquiry) ke API gateway pembayaran. Jika transaksi ternyata sudah lunas, status diubah menjadi Confirmed; jika belum lunas, hold dan stok add-on dilepas menjadi Available. Jika terjadi pembayaran terlambat setelah slot diambil pengguna lain, sistem mencatat status Overdue Payment Conflict untuk penanganan staf.

**Blocked by:** 04: Guest Checkout & Integrasi Payment Gateway (QRIS & Virtual Account)

**Status:** ready-for-agent

- [ ] Worker delayed job (BullMQ) aktif tepat saat 10 menit hold berakhir
- [ ] Worker menjalankan Active Payment Inquiry ke gateway pembayaran untuk memastikan status transaksi terakhir sebelum melepas kunci
- [ ] Jika inquiry gateway mengembalikan status settled/paid, booking langsung dikonfirmasi (*Confirmed*) tanpa melepas slot
- [ ] Jika inquiry gateway mengembalikan unpaid/expired, distributed lock Redis dan data hold dilepas sehingga slot dan alokasi peralatan kembali berstatus Available
- [ ] Jika pembayaran terkonfirmasi lunas namun slot ternyata sudah terlanjur diakuisisi pihak lain, sistem menandai insiden `Overdue_Payment_Conflict` dan mencatat alert di log/dashboard staf
- [ ] Pengujian otomatis memverifikasi kedua skenario: pelepasan inventaris untuk hold yang belum dibayar, dan pengonfirmasian booking jika pembayaran lunas pada saat pengecekan aktif
