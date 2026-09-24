# 02: Pessimistic Slot Hold & Concurrency Control

**What to build:** Ketika pelanggan memilih slot jadwal yang berstatus Open, sistem seketika mengakuisisi pessimistic lock terdistribusi di Redis (10 menit TTL) dan mengarahkan pelanggan ke layar checkout dengan penghitung mundur (timer 10 menit) live. Jika ada pengguna lain yang mencoba memilih slot yang sama secara bersamaan, permintaan kedua ditolak dengan status HTTP 409 Conflict.

**Blocked by:** 01: Setup Proyek & Grid Ketersediaan Lapangan (7-Day Rolling Calendar)

**Status:** ready-for-agent

- [ ] Memilih slot yang berstatus Open memicu distributed lock Redis (`SET resource_id token NX PX 600000`) dan mencatat record Slot Hold
- [ ] Layar checkout menampilkan countdown timer 10 menit yang berdetak mundur secara real-time
- [ ] Permintaan bersamaan (race condition) pada slot yang persis sama memberikan hak hold hanya kepada pengguna pertama dan menolak pengguna kedua dengan 409 Conflict
- [ ] Grid jadwal pada browser lain langsung menandai slot tersebut sebagai unavailable / held
- [ ] Pengujian otomatis membuktikan mutual exclusion saat dua atau lebih request hold dieksekusi secara paralel (`Promise.all`)
