# 01: Setup Proyek & Grid Ketersediaan Lapangan (7-Day Rolling Calendar)

**What to build:** Pelanggan dapat membuka web aplikasi untuk melihat kalender ketersediaan lapangan secara real-time dalam rentang rolling 7 hari ke depan. Pengguna dapat memilih tanggal dan melihat matriks jadwal per lapangan (Indoor vs. Outdoor) yang menampilkan harga berdasarkan Time Band (Regular vs. Peak) serta status slot terkini (Open, Held, Booked).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Project Next.js App Router terinisialisasi dengan TypeScript, Tailwind CSS, PostgreSQL (Drizzle ORM), dan Redis client
- [ ] Skema database untuk Venue, Court, dan Schedule Slot beserta seed data realistis untuk konfigurasi lapangan dan jadwal
- [ ] Tampilan antarmuka kalender publik yang menampilkan grid jadwal lapangan harian dalam rentang rolling 7 hari ke depan
- [ ] Setiap slot jadwal menampilkan harga yang akurat sesuai kombinasi tipe lapangan (Indoor/Outdoor) dan Time Band (Regular/Peak)
- [ ] Indikator visual membedakan status slot yang open, held, dan booked
- [ ] Pengujian otomatis memverifikasi kueri ketersediaan slot mengembalikan data akurat dan menolak query tanggal di luar batas 7 hari advance window
