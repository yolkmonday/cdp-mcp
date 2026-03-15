# CDP MCP - Chrome DevTools Protocol untuk Claude

Kontrol browser Chrome langsung dari Claude Code. Navigasi halaman, ekstrak data, ambil screenshot, kelola tab, dan lainnya — semua lewat bahasa natural.

Chrome jalan otomatis — tidak perlu setup manual.

> **[Read in English](README.md)**

## Apa ini?

MCP (Model Context Protocol) server yang memberi Claude Code kemampuan untuk mengontrol browser Chrome lewat Chrome DevTools Protocol (CDP). Setelah diinstall, kamu bisa minta Claude hal-hal seperti:

- "Buka stockbit.com dan ambil data keuangan BBCA"
- "Screenshot halaman ini"
- "Klik tombol login dan isi form"
- "Download laporan PDF"

## Kebutuhan

- [Bun](https://bun.sh) runtime
- Google Chrome (macOS)

## Cara Install

**1. Clone repo**

```bash
git clone https://github.com/yolkmonday/cdp-mcp.git
cd cdp-mcp
```

**2. Install dependencies**

```bash
bun install
```

**3. Tambahkan ke Claude Code**

Buka atau buat file `~/.claude/.mcp.json` dan tambahkan:

```json
{
  "mcpServers": {
    "cdp-agent": {
      "command": "bun",
      "args": ["run", "/PATH/LENGKAP/KE/cdp-mcp/src/index.ts"]
    }
  }
}
```

> Ganti `/PATH/LENGKAP/KE/cdp-mcp` dengan path asli tempat kamu clone repo.

**4. Restart Claude Code**

Tools `cdp_*` akan langsung tersedia. Chrome akan otomatis jalan saat kamu pertama kali pakai tool apa pun.

## Tools yang Tersedia

| Tool | Deskripsi |
|------|-----------|
| `cdp_navigate` | Buka URL |
| `cdp_get_url` | Ambil URL dan judul halaman saat ini |
| `cdp_get_content` | Ekstrak teks dari halaman atau elemen |
| `cdp_get_html` | Ambil HTML halaman atau elemen |
| `cdp_get_table` | Ekstrak data tabel sebagai JSON |
| `cdp_click` | Klik elemen |
| `cdp_type` | Ketik teks di input field |
| `cdp_scroll` | Scroll halaman (atas/bawah/paling atas/bawah atau ke elemen) |
| `cdp_wait` | Tunggu elemen muncul |
| `cdp_screenshot` | Ambil screenshot (viewport, full page, atau elemen) |
| `cdp_list_tabs` | Daftar semua tab yang terbuka |
| `cdp_new_tab` | Buka tab baru |
| `cdp_close_tab` | Tutup tab berdasarkan ID |
| `cdp_switch_tab` | Pindah ke tab berdasarkan ID |
| `cdp_get_cookies` | Ambil semua cookies |
| `cdp_set_cookie` | Set cookie |
| `cdp_clear_cookies` | Hapus semua cookies |
| `cdp_evaluate` | Jalankan JavaScript apa pun |
| `cdp_download` | Download file lewat URL atau klik |

## Contoh Penggunaan

```
Kamu: "Buka google.com"
Claude: pakai cdp_navigate → buka Google di Chrome

Kamu: "Ambil tabel utama dari halaman ini"
Claude: pakai cdp_get_table → return data JSON

Kamu: "Screenshot full page"
Claude: pakai cdp_screenshot → tangkap dan tampilkan gambar

Kamu: "Klik tombol submit dan tunggu hasilnya"
Claude: pakai cdp_click + cdp_wait → interaksi dengan halaman
```

## Cara Kerja

```
Claude Code  <-->  MCP Server (Bun)  <-->  Chrome (CDP port 9222)
```

1. Claude Code mengirim tool calls ke MCP server via stdio
2. MCP server menerjemahkan ke perintah CDP
3. Chrome menjalankan perintah dan mengembalikan hasil
4. Chrome otomatis jalan kalau belum aktif

## Lisensi

MIT
