# CDP MCP - Chrome DevTools Protocol for Claude

Control your Chrome browser directly from Claude Code. Navigate pages, extract data, take screenshots, manage tabs, and more — all through natural language.

Kontrol browser Chrome langsung dari Claude Code. Navigasi halaman, ekstrak data, ambil screenshot, kelola tab, dan lainnya — semua lewat bahasa natural.

---

## English

### What is this?

An MCP (Model Context Protocol) server that gives Claude Code the ability to control your Chrome browser via the Chrome DevTools Protocol (CDP). Once installed, you can ask Claude things like:

- "Open stockbit.com and extract BBCA financial data"
- "Take a screenshot of this page"
- "Click the login button and fill in the form"
- "Download the PDF report"

Chrome launches automatically — no manual setup needed.

### Requirements

- [Bun](https://bun.sh) runtime
- Google Chrome (macOS)

### Installation

**1. Clone the repo**

```bash
git clone https://github.com/yolkmonday/cdp-mcp.git
cd cdp-mcp
```

**2. Install dependencies**

```bash
bun install
```

**3. Add to Claude Code**

Open or create `~/.claude/.mcp.json` and add:

```json
{
  "mcpServers": {
    "cdp-agent": {
      "command": "bun",
      "args": ["run", "/FULL/PATH/TO/cdp-mcp/src/index.ts"]
    }
  }
}
```

> Replace `/FULL/PATH/TO/cdp-mcp` with the actual path where you cloned the repo.

**4. Restart Claude Code**

The `cdp_*` tools will now be available. Chrome will auto-launch when you first use any tool.

### Available Tools

| Tool | Description |
|------|-------------|
| `cdp_navigate` | Navigate to a URL |
| `cdp_get_url` | Get current page URL and title |
| `cdp_get_content` | Extract text from page or element |
| `cdp_get_html` | Get HTML of page or element |
| `cdp_get_table` | Extract table data as JSON |
| `cdp_click` | Click an element |
| `cdp_type` | Type text into an input field |
| `cdp_scroll` | Scroll page (up/down/top/bottom or to element) |
| `cdp_wait` | Wait for an element to appear |
| `cdp_screenshot` | Take screenshot (viewport, full page, or element) |
| `cdp_list_tabs` | List all open tabs |
| `cdp_new_tab` | Open a new tab |
| `cdp_close_tab` | Close a tab by ID |
| `cdp_switch_tab` | Switch to a tab by ID |
| `cdp_get_cookies` | Get all cookies |
| `cdp_set_cookie` | Set a cookie |
| `cdp_clear_cookies` | Clear all cookies |
| `cdp_evaluate` | Execute arbitrary JavaScript |
| `cdp_download` | Download a file via URL or click |

### Usage Examples

```
You: "Open google.com"
Claude: uses cdp_navigate → opens Google in Chrome

You: "Extract the main table from this page"
Claude: uses cdp_get_table → returns JSON data

You: "Take a full page screenshot"
Claude: uses cdp_screenshot → captures and shows the image

You: "Click the submit button and wait for results"
Claude: uses cdp_click + cdp_wait → interacts with the page
```

### How it Works

```
Claude Code  <-->  MCP Server (Bun)  <-->  Chrome (CDP port 9222)
```

1. Claude Code sends tool calls to the MCP server via stdio
2. MCP server translates them into CDP commands
3. Chrome executes the commands and returns results
4. Chrome auto-launches if not already running

---

## Bahasa Indonesia

### Apa ini?

MCP (Model Context Protocol) server yang memberi Claude Code kemampuan untuk mengontrol browser Chrome lewat Chrome DevTools Protocol (CDP). Setelah diinstall, kamu bisa minta Claude hal-hal seperti:

- "Buka stockbit.com dan ambil data keuangan BBCA"
- "Screenshot halaman ini"
- "Klik tombol login dan isi form"
- "Download laporan PDF"

Chrome jalan otomatis — tidak perlu setup manual.

### Kebutuhan

- [Bun](https://bun.sh) runtime
- Google Chrome (macOS)

### Cara Install

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

### Tools yang Tersedia

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

### Contoh Penggunaan

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

### Cara Kerja

```
Claude Code  <-->  MCP Server (Bun)  <-->  Chrome (CDP port 9222)
```

1. Claude Code mengirim tool calls ke MCP server via stdio
2. MCP server menerjemahkan ke perintah CDP
3. Chrome menjalankan perintah dan mengembalikan hasil
4. Chrome otomatis jalan kalau belum aktif

---

## License

MIT
