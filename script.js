<script>
  let siswa = {};
  let foto = null;
  const vid = document.getElementById("video");

  function showLoading(show) { document.getElementById("loadingOverlay").classList.toggle("hidden", !show); }

  function handleLogin() {
    const nis = document.getElementById("nis").value;
    const pin = document.getElementById("pin").value;
    showLoading(true);
    google.script.run.withSuccessHandler(res => {
      showLoading(false);
      if (res.status) {
        siswa = res;
        document.getElementById("section-login").classList.add("hidden");
        document.getElementById("section-absen").classList.remove("hidden");
        document.getElementById("dispNama").innerText = res.nama;
        navigator.mediaDevices.getUserMedia({video:{facingMode:"user"}}).then(s => vid.srcObject = s);
      } else alert(res.msg);
    }).loginServer(nis, pin);
  }

  function ambilFoto() {
    const cvs = document.getElementById("canvas");
    cvs.width = vid.videoWidth; cvs.height = vid.videoHeight;
    cvs.getContext("2d").drawImage(vid, 0, 0);
    foto = cvs.toDataURL("image/png");
    document.getElementById("hasilFoto").src = foto;
    document.getElementById("hasilFoto").classList.remove("hidden");
    vid.classList.add("hidden");
    document.getElementById("btnCapture").classList.add("hidden");
    document.getElementById("confirm-buttons").classList.remove("hidden");
  }

  function kirimAbsen() {
    if(!navigator.geolocation) return alert("GPS Mati");
    showLoading(true);
    navigator.geolocation.getCurrentPosition(pos => {
      google.script.run.withSuccessHandler(res => {
        showLoading(false);
        alert(res.msg);
        if(res.status) location.reload();
      }).simpanAbsen({ ...siswa, lat: pos.coords.latitude, lng: pos.coords.longitude, foto: foto });
    });
  }
  
  function ulangFoto() {
    foto = null;
    document.getElementById("hasilFoto").classList.add("hidden");
    vid.classList.remove("hidden");
    document.getElementById("btnCapture").classList.remove("hidden");
    document.getElementById("confirm-buttons").classList.add("hidden");
  }
</script>
