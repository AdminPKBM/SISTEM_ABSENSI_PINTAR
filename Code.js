/**
 * BACKEND SERVER (Google Apps Script)
 * -----------------------------------
 * Konfigurasi Utama
 */

const SHEET_SISWA = "SISWA";
const SHEET_ABSEN = "ABSENSI";

// ⚠️ GANTI KOORDINAT DI BAWAH INI (Cek Google Maps)
const LAT_SEKOLAH = -6.2088; // Contoh: Jakarta
const LNG_SEKOLAH = 106.8456;
const RADIUS_MAX = 200; // Dalam meter

// ⚠️ GANTI DENGAN ID FOLDER GOOGLE DRIVE ANDA
const ID_FOLDER_FOTO = "MASUKKAN_ID_FOLDER_DISINI"; 

function doGet() {
  return HtmlService.createHtmlOutputFromFile("index")
    .setTitle("Sistem Absensi Pintar")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(file) {
  return HtmlService.createHtmlOutputFromFile(file).getContent();
}

/* --- LOGIC LOGIN --- */
function loginServer(nis, pin) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_SISWA);
  const data = sh.getDataRange().getDisplayValues(); 

  for (let i = 1; i < data.length; i++) {
    if (data[i][0].trim() == nis && data[i][3].trim() == pin) {
      return {
        status: true,
        nis: data[i][0],
        nama: data[i][1],
        kelas: data[i][2]
      };
    }
  }
  return { status: false, msg: "NIS atau PIN tidak ditemukan!" };
}

/* --- LOGIC JARAK (Haversine) --- */
function hitungJarak(lat, lng) {
  const R = 6371000; 
  const dLat = (lat - LAT_SEKOLAH) * Math.PI / 180;
  const dLng = (lng - LNG_SEKOLAH) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(LAT_SEKOLAH*Math.PI/180) * Math.cos(lat*Math.PI/180) * Math.sin(dLng/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/* --- LOGIC SIMPAN ABSEN --- */
function simpanAbsen(data) {
  try {
    const jarak = hitungJarak(data.lat, data.lng);
    if (jarak > RADIUS_MAX) return { status: false, msg: `❌ Kejauhan! Jarak: ${jarak}m (Max ${RADIUS_MAX}m)` };

    const folder = DriveApp.getFolderById(ID_FOLDER_FOTO);
    const blob = Utilities.newBlob(Utilities.base64Decode(data.foto.split(",")[1]), "image/png", `${data.nis}_${Date.now()}.png`);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ABSEN);
    sh.appendRow([new Date(), `'${data.nis}`, data.nama, data.kelas, data.lat, data.lng, jarak, file.getUrl()]);

    return { status: true, msg: "✅ Absensi Berhasil Disimpan!" };
  } catch (e) {
    return { status: false, msg: "Error Server: " + e.toString() };
  }
}
