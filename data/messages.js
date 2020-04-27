const help = `
Here's a list of things you can do:
\`- m/help | shows you this

====== Fun Area ======
- m/peekpicture <mention> | take a peek on others 'w'

====== KampungSMP Help Area ======
- m/helpkomporpls | slimefun kompor support
- m/helpaugmentpls | augment crafting tutorial

====== Music (BETA) ======
- m/play <keyword> | I can play a song for you if you want~
- m/leave | just straight up leaving the voice room because you asked me to .w.
- m/skip | skips what's playing right now
\`
`

const refundFormat = `
Format:

1. Nickname dalam game:
2. Waktu Kejadian:
3. Tempat Kejadian:
4. Kronologis Kejadian:
5. Barang yang Hilang: 

Untuk barang hilang yang memiliki enchant, silakan tulis dengan format seperti contoh di bawah.
Apabila nama enchant memiliki spasi, tolong ubah menjadi underscore. Gunakan angka biasa, jangan angka romawi.

\`\`\`
Contoh:

diamond_helmet
aqua_affinity 1
protection 4
blast_protection 3
dst.
customenchant:
wildmark 1
cactus 3
planetarydeathbringer 1
dst.
\`\`\`

**APABILA FORMAT TIDAK DIIKUTI, TIDAK AKAN DILAYANI SAMPAI FORMAT BENAR, KHUSUSNYA UNTUK YANG MEMILIKI ENCHANT YANG BANYAK.**

Sertakan SS bila ada, screenshot akan meningkatkan kemungkinan barangmu direfund dengan utuh, dan akan menjadi prioritas.
`
module.exports = {
    help: help,
    refundFormat: refundFormat
};