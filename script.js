<script>
  let siswaData = {};
  let fotoBase64 = null;
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");

  // --- UI HELPERS ---
  function showLoading(active, text = "Memproses...") {
    const el = document.getElementById("loadingOverlay");
    document.getElementById("loadingText").innerText = text;
    if (active) el.classList.remove("hidden");
    else el.classList.add("hidden");
  }

  function showToast(msg, type = "normal") {
    const toast = document.getElementById("toast");
    toast.innerText = msg;
    toast.className = "toast show"; 
    if (type === "error") toast.classList.add("error");
    if (type === "success") toast.classList.add("success");
    setTimeout(() => toast.classList.remove("show"), 3000);
  }

  function switchSection(id) {
    document.querySelectorAll('.section-content').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(id);
    target.classList.remove('hidden');
    target.classList.add('fade-in');
  }

  // --- LOGIN ---
  function handleLogin() {
    const nis = document.getElementById("nis").value;
    const pin = document.getElementById("pin").value;

    if (!nis || !pin) return showToast("⚠️ Mohon isi NIS dan PIN", "error");

    showLoading(true, "Memverifikasi...");
    
    google.script.run
      .withSuccessHandler(response => {
        showLoading(false);
        if (response.status) {
          siswaData = response;
          setupAbsenPage();
        } else {
          showToast(response.msg || "Login Gagal", "error");
        }
      })
      .withFailureHandler(err => {
        showLoading(false);
        showToast("❌ Kesalahan Server", "error");
      })
      .loginServer(nis, pin);
  }

  function setupAbsenPage() {
    document.getElementById("dispNama").innerText = siswaData.nama;
    document.getElementById("dispKelas").innerText = siswaData.kelas;
    // Inisial Nama
    document.getElementById("initials").innerText = siswaData.nama.charAt(0).toUpperCase();
    
    switchSection("section-absen");
    startCamera();
  }

  // --- KAMERA ---
  function startCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        .then(stream => { video.srcObject = stream; })
        .catch(() => showToast("❌ Gagal akses kamera", "error"));
    }
  }

  function ambilFoto() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    fotoBase64 = canvas.toDataURL("image/png");
    
    document.getElementById("hasilFoto").src = fotoBase64;
    document.getElementById("hasilFoto").classList.remove("hidden");
    video.classList.add("hidden");
    document.querySelector(".scan-overlay").classList.add("hidden"); // Hide scan line

    document.getElementById("action-buttons").classList.add("hidden");
    document.getElementById("confirm-buttons").classList.remove("hidden");
    document.getElementById("statusText").innerText = "Apakah foto sudah jelas?";
  }

  function ulangFoto() {
    fotoBase64 = null;
    document.getElementById("hasilFoto").classList.add("hidden");
    video.classList.remove("hidden");
    document.querySelector(".scan-overlay").classList.remove("hidden");

    document.getElementById("action-buttons").classList.remove("hidden");
    document.getElementById("confirm-buttons").classList.add("hidden");
    document.getElementById("statusText").innerText = "Posisikan wajah di dalam kotak";
  }

  // --- KIRIM ---
  function kirimAbsen() {
    if (!navigator.geolocation) return showToast("❌ GPS Tidak Aktif", "error");

    showLoading(true, "Mendeteksi Lokasi...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        showLoading(true, "Mengunggah Data...");
        const payload = {
          nis: siswaData.nis,
          nama: siswaData.nama,
          kelas: siswaData.kelas,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          foto: fotoBase64
        };

        google.script.run
          .withSuccessHandler(res => {
            showLoading(false);
            if(res.status) {
              // Animasi Sukses
              document.querySelector(".card").innerHTML = `
                <div style="text-align:center; padding:40px 20px;">
                  <div style="font-size:60px; margin-bottom:20px;">🎉</div>
                  <h2 style="color:var(--text-dark);">Absensi Berhasil!</h2>
                  <p style="color:var(--text-light); margin-top:10px;">${res.msg}</p>
                </div>
              `;
              setTimeout(() => window.location.reload(), 3000);
            } else {
              showToast(res.msg, "error");
            }
          })
          .simpanAbsen(payload);
      },
      (err) => {
        showLoading(false);
        showToast("❌ Gagal mendapatkan lokasi GPS", "error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }
</script>
