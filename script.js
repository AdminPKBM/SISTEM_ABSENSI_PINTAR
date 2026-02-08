<script>
  let siswaData = {};
  let fotoBase64 = null;
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");

  // --- UI Helpers ---
  function showLoading(show) {
    const el = document.getElementById("loadingOverlay");
    if(show) el.classList.remove("hidden");
    else el.classList.add("hidden");
  }

  function showToast(msg, isError = false) {
    const t = document.getElementById("toast");
    t.innerText = msg;
    t.style.background = isError ? "#ef4444" : "#1e293b";
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 3000);
  }

  // --- LOGIN SYSTEM ---
  function handleLogin() {
    const nis = document.getElementById("nis").value;
    const pin = document.getElementById("pin").value;

    if (!nis || !pin) return showToast("⚠️ Harap isi NIS dan PIN", true);

    showLoading(true);
    google.script.run
      .withSuccessHandler(res => {
        showLoading(false);
        if (res.status) {
          siswaData = res;
          bukaHalamanAbsen();
        } else {
          showToast(res.msg, true);
        }
      })
      .withFailureHandler(e => {
        showLoading(false);
        showToast("❌ Gagal terhubung ke server", true);
      })
      .loginServer(nis, pin);
  }

  function bukaHalamanAbsen() {
    document.getElementById("section-login").classList.add("hidden");
    document.getElementById("section-absen").classList.remove("hidden");
    
    // Set Data Siswa
    document.getElementById("dispNama").innerText = siswaData.nama;
    document.getElementById("dispKelas").innerText = siswaData.kelas;
    document.getElementById("avatarLetter").innerText = siswaData.nama.charAt(0).toUpperCase();

    // Nyalakan Kamera
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        .then(stream => { video.srcObject = stream; })
        .catch(err => showToast("❌ Gagal akses kamera: " + err, true));
    } else {
      showToast("❌ Browser tidak mendukung kamera", true);
    }
  }

  // --- CAMERA LOGIC ---
  function ambilFoto() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    fotoBase64 = canvas.toDataURL("image/png");

    document.getElementById("hasilFoto").src = fotoBase64;
    document.getElementById("hasilFoto").classList.remove("hidden");
    video.classList.add("hidden");
    document.querySelector(".scan-line").classList.add("hidden");

    // Toggle Buttons
    document.getElementById("btnCapture").classList.add("hidden");
    document.getElementById("confirm-buttons").classList.remove("hidden");
    document.getElementById("camStatus").innerText = "Apakah foto sudah jelas?";
  }

  function ulangFoto() {
    fotoBase64 = null;
    document.getElementById("hasilFoto").classList.add("hidden");
    video.classList.remove("hidden");
    document.querySelector(".scan-line").classList.remove("hidden");

    document.getElementById("btnCapture").classList.remove("hidden");
    document.getElementById("confirm-buttons").classList.add("hidden");
    document.getElementById("camStatus").innerText = "Pastikan wajah terlihat jelas";
  }

  // --- GPS & SEND LOGIC ---
  function kirimAbsen() {
    if (!navigator.geolocation) return showToast("❌ Perangkat tidak mendukung GPS", true);

    showLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
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
            if (res.status) {
              // Tampilan Sukses
              document.querySelector(".card").innerHTML = `
                <div style="text-align:center; padding:40px 20px;">
                  <div style="font-size:60px; margin-bottom:10px;">🎉</div>
                  <h2 style="color:#1e293b; margin-bottom:10px;">Absensi Berhasil!</h2>
                  <p style="color:#64748b;">${res.msg}</p>
                </div>`;
              setTimeout(() => location.reload(), 3000);
            } else {
              showToast(res.msg, true);
            }
          })
          .simpanAbsen(payload);
      },
      (err) => {
        showLoading(false);
        showToast("❌ Gagal mendapatkan lokasi. Pastikan GPS aktif!", true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }
</script>
