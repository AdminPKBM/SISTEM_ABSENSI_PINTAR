/**
 * ==========================================
 * BAGIAN 1: KONFIGURASI & ADMIN GITHUB
 * ==========================================
 */
// ⚠️ GANTI DENGAN TOKEN BARU (Token lama sudah tidak aman)
const GITHUB_TOKEN = "ghp_MASUKKAN_TOKEN_BARU_DISINI"; 
const GITHUB_USER  = "AdminPKBM";
const GITHUB_REPO  = "SISTEM_ABSENSI_PINTAR";
const SHEET_ISSUES = "GITHUB_ISSUES";

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🐙 GitHub Manager')
    .addItem('📥 Tarik Daftar Issues', 'getGitHubIssues')
    .addItem('🧹 Bersihkan Data', 'clearSheet')
    .addToUi();
}

function getGitHubIssues() {
  const sheet = setupSheet();
  const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/issues?state=all&per_page=100`;
  
  try {
    const response = UrlFetchApp.fetch(url, {
      "method": "GET",
      "headers": { "Authorization": "Bearer " + GITHUB_TOKEN, "Accept": "application/vnd.github.v3+json" },
      "muteHttpExceptions": true
    });
    
    if (response.getResponseCode() !== 200) {
      SpreadsheetApp.getUi().alert("❌ Error: " + JSON.parse(response.getContentText()).message);
      return;
    }

    const json = JSON.parse(response.getContentText());
    if (json.length === 0) return SpreadsheetApp.getUi().alert("⚠️ Tidak ada issue ditemukan.");

    let rows = [];
    json.forEach(item => {
      if (item.pull_request) return; // Lewati PR
      rows.push([
        item.number,
        item.state === "open" ? "🟢 OPEN" : "🔴 CLOSED",
        item.title,
        item.user.login,
        Utilities.formatDate(new Date(item.created_at), "GMT+7", "dd/MM/yyyy HH:mm"),
        item.assignee ? item.assignee.login : "-",
        item.html_url
      ]);
    });

    if (rows.length > 0) {
      if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow()-1, sheet.getLastColumn()).clearContent();
      sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      formatTable(sheet, rows.length);
      SpreadsheetApp.getUi().alert(`✅ Berhasil menarik ${rows.length} issues!`);
    }
  } catch (e) {
    SpreadsheetApp.getUi().alert("Error: " + e.toString());
  }
}

// Helper GitHub
function setupSheet() {
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_ISSUES);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ISSUES);
    sheet.getRange("A1:G1").setValues([["ID", "STATUS", "JUDUL", "PEMBUAT", "TANGGAL", "ASSIGNED", "LINK"]])
         .setFontWeight("bold").setBackground("#24292f").setFontColor("white");
  }
  return sheet;
}
function clearSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ISSUES);
  if(sheet && sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow()-1, sheet.getLastColumn()).clearContent();
}
function formatTable(sheet, rows) {
  sheet.getRange(2, 1, rows, 7).setVerticalAlignment("middle");
  sheet.setColumnWidth(3, 300);
}

/**
 * ==========================================
 * BAGIAN 2: WEB APP ABSENSI (BACKEND)
 * ==========================================
 */
const SHEET_SISWA = "SISWA";
const SHEET_ABSEN = "ABSENSI";
const ID_FOLDER_FOTO = "MASUKKAN_ID_FOLDER_DRIVE_DISINI"; // ⚠️ WAJIB DIISI

// Lokasi Sekolah (Default: Jakarta Pusat, sesuaikan!)
const LAT_SEKOLAH = -6.2088; 
const LNG_SEKOLAH = 106.8456;
const RADIUS_MAX = 200; 

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle("Absensi Pintar")
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function loginServer(nis, pin) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = ss.getSheetByName(SHEET_SISWA).getDataRange().getDisplayValues();
  
  // Asumsi: Kolom A=NIS, B=Nama, C=Kelas, D=PIN
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(nis) && String(data[i][3]).trim() === String(pin)) {
      return { status: true, nis: data[i][0], nama: data[i][1], kelas: data[i][2] };
    }
  }
  return { status: false, msg: "NIS atau PIN tidak ditemukan!" };
}

function simpanAbsen(data) {
  try {
    // Validasi Jarak
    const jarak = hitungJarak(data.lat, data.lng);
    if (jarak > RADIUS_MAX) return { status: false, msg: `❌ Anda diluar lokasi! Jarak: ${jarak}m (Max ${RADIUS_MAX}m)` };

    // Simpan Foto
    const folder = DriveApp.getFolderById(ID_FOLDER_FOTO);
    const blob = Utilities.newBlob(Utilities.base64Decode(data.foto.split(",")[1]), "image/png", `${data.nis}_${Date.now()}.png`);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Simpan Data
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ABSEN);
    sh.appendRow([new Date(), `'${data.nis}`, data.nama, data.kelas, data.lat, data.lng, jarak, file.getUrl()]);

    return { status: true, msg: "✅ Absensi Berhasil Disimpan!" };
  } catch (e) {
    return { status: false, msg: "Error Server: " + e.toString() };
  }
}

function hitungJarak(lat, lng) {
  const R = 6371000; 
  const dLat = (lat - LAT_SEKOLAH) * Math.PI / 180;
  const dLng = (lng - LNG_SEKOLAH) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(LAT_SEKOLAH*Math.PI/180) * Math.cos(lat*Math.PI/180) * Math.sin(dLng/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
