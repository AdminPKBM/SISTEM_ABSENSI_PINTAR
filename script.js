<script>
let dataSiswa = null;
let fotoData = null;

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");

// 1. FUNGSI LOGIN
function login() {
  const nis = document.getElementById("nis").value;
  const pin = document.getElementById("pin").value;
  const btn = document.getElementById("btnLogin");
  const msg = document.getElementById("msgLogin");

  if(!nis || !pin) { msg.innerText = "Isi semua data!"; return; }

  btn.innerText = "Memeriksa...";
  btn.disabled = true;
  msg.innerText = "";

  google.script.run.withSuccessHandler(res => {
    btn.disabled = false;
    btn.innerText = "Masuk";
    
    if (res.status) {
      dataSiswa = res;
      bukaHalamanAbsen();
    } else {
      msg.innerText = res.msg || "Login Gagal";
    }
  }).loginServer(nis, pin);
}

function bukaHalamanAbsen() {
  document.getElementById("loginBox").classList.add("hidden");
  document.getElementById("absenBox").classList.remove("hidden");
  document.getElementById("namaDisplay").innerText = dataSiswa.nama;
  document.getElementById("kelasDisplay").innerText = dataSiswa.kelas;
  mulaiKamera();
}

// 2. KAMERA
function mulaiKamera() {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
    .then(stream => { video.srcObject = stream; })
    .catch(err => alert("Gagal akses kamera: " + err));
}

function ambilFoto() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  fotoData = canvas.toDataURL("image/png");

  // UI Change
  document.getElementById("video").classList.add("hidden");
  document.getElementById("btnFoto").classList.add("hidden");
  
  const img = document.getElementById("hasilFoto");
  img.src = fotoData;
  
  document.getElementById("previewContainer").classList.remove("hidden");
}

function ulangFoto() {
  fotoData = null;
  document.getElementById("video").classList.remove("hidden");
  document.getElementById("btnFoto").classList.remove("hidden");
  document.getElementById("previewContainer").classList.add("hidden");
}

// 3. KIRIM ABSEN + GPS
function kirimAbsen() {
  if (!navigator.geolocation) {
    alert("Browser tidak mendukung GPS.");
    return;
  }

  showLoading(true);

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const payload = {
        nis: dataSiswa.nis,
        nama: dataSiswa.nama,
        kelas: dataSiswa.kelas,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        foto: fotoData
      };

      google.script.run.withSuccessHandler(hasil => {
        showLoading(false);
        alert(hasil.msg);
        if(hasil.status) {
            window.location.reload(); // Refresh halaman setelah sukses
        }
      }).simpanAbsen(payload);
    },
    (error) => {
      showLoading(false);
      alert("❌ Gagal mengambil lokasi! Pastikan GPS aktif.\nError: " + error.message);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

function showLoading(show) {
  const el = document.getElementById("loading");
  if(show) el.classList.remove("hidden");
  else el.classList.add("hidden");
}
</script>
