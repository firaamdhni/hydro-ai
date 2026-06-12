const sections = [...document.querySelectorAll(".section")];
const video = document.getElementById("cameraVideo");
const canvas = document.getElementById("captureCanvas");
const previewImage = document.getElementById("previewImage");
const placeholder = document.getElementById("cameraPlaceholder");
const message = document.getElementById("cameraMessage");

const startCameraBtn = document.getElementById("startCameraBtn");
const captureBtn = document.getElementById("captureBtn");
const imageInput = document.getElementById("imageInput");
const retakeBtn = document.getElementById("retakeBtn");
const continueBtn = document.getElementById("continueBtn");

const questionPreview = document.getElementById("questionPreview");
const resultPreview = document.getElementById("resultPreview");
const symptomForm = document.getElementById("symptomForm");

let stream = null;
let currentImage = "";
let currentResult = null;

function showSection(id) {
  sections.forEach(section => section.classList.toggle("active", section.id === id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function startCamera() {
  stopCamera();
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 1600 }
      },
      audio: false
    });

    video.srcObject = stream;
    await video.play();

    video.hidden = false;
    previewImage.hidden = true;
    placeholder.hidden = true;
    captureBtn.disabled = false;
    startCameraBtn.textContent = "Aktifkan Ulang Kamera";
    message.textContent = "Kamera aktif. Arahkan ke daun, lalu ambil gambar.";
  } catch (error) {
    console.error(error);
    message.textContent =
      "Kamera tidak dapat dibuka. Pastikan izin kamera diberikan dan web dijalankan melalui HTTPS atau localhost.";
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}

function setCapturedImage(dataUrl) {
  currentImage = dataUrl;
  previewImage.src = dataUrl;
  previewImage.hidden = false;
  video.hidden = true;
  placeholder.hidden = true;
  captureBtn.disabled = true;
  continueBtn.disabled = false;
  retakeBtn.hidden = false;
  message.textContent = "Gambar siap dianalisis. Lanjutkan atau ambil ulang.";
  stopCamera();
}

function captureImage() {
  if (!video.videoWidth) {
    message.textContent = "Kamera belum siap. Coba beberapa saat lagi.";
    return;
  }
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  setCapturedImage(canvas.toDataURL("image/jpeg", 0.86));
}

function handleImageUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    message.textContent = "File yang dipilih bukan gambar.";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => setCapturedImage(reader.result);
  reader.readAsDataURL(file);
}

async function calculateImageStats(dataUrl) {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      const sample = document.createElement("canvas");
      const size = 96;
      sample.width = size;
      sample.height = size;

      const ctx = sample.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(image, 0, 0, size, size);

      const pixels = ctx.getImageData(0, 0, size, size).data;
      let red = 0, green = 0, blue = 0, count = 0;

      for (let i = 0; i < pixels.length; i += 16) {
        red += pixels[i];
        green += pixels[i + 1];
        blue += pixels[i + 2];
        count++;
      }

      red /= count;
      green /= count;
      blue /= count;

      resolve({
        greenRatio: green / Math.max(1, (red + blue) / 2),
        yellowSignal: (red + green) / Math.max(1, blue * 2),
        brownSignal: red / Math.max(1, green)
      });
    };
    image.src = dataUrl;
  });
}

function collectSymptoms(form) {
  const data = new FormData(form);
  const selected = [data.get("leafColor")];
  selected.push(...data.getAll("symptoms"));
  return selected.filter(Boolean);
}

function renderResult(result) {
  currentResult = result;

  resultPreview.src = currentImage;
  document.getElementById("diagnosisTitle").textContent = result.title;
  document.getElementById("diagnosisDescription").textContent = result.description;
  document.getElementById("confidenceText").textContent = `${result.confidence}%`;
  document.getElementById("confidenceBar").style.width = `${result.confidence}%`;

  const badge = document.getElementById("statusBadge");
  badge.textContent = result.status;

  renderList("matchedSymptoms", result.matchedSymptoms);
  renderList("causeList", result.causes);
  renderList("recommendationList", result.recommendations);
}

function renderList(id, items) {
  const element = document.getElementById(id);
  element.innerHTML = items.map(item => `<li>${escapeHtml(item)}</li>`).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resetApp() {
  stopCamera();
  currentImage = "";
  currentResult = null;
  previewImage.src = "";
  previewImage.hidden = true;
  video.hidden = false;
  placeholder.hidden = false;
  captureBtn.disabled = true;
  continueBtn.disabled = true;
  retakeBtn.hidden = true;
  imageInput.value = "";
  symptomForm.reset();
  message.textContent = "Kamera membutuhkan izin dari browser.";
  showSection("cameraSection");
}

function saveCurrentResult() {
  if (!currentResult || !currentImage) return;

  const history = JSON.parse(localStorage.getItem("plantcare-history") || "[]");
  history.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    date: new Date().toISOString(),
    image: currentImage,
    title: currentResult.title,
    confidence: currentResult.confidence,
    status: currentResult.status
  });

  localStorage.setItem("plantcare-history", JSON.stringify(history.slice(0, 12)));
  document.getElementById("saveResultBtn").textContent = "Hasil Tersimpan";
  document.getElementById("saveResultBtn").disabled = true;
}

function renderHistory() {
  const container = document.getElementById("historyList");
  const history = JSON.parse(localStorage.getItem("plantcare-history") || "[]");

  if (!history.length) {
    container.innerHTML = `<div class="history-empty">Belum ada hasil analisis yang disimpan.</div>`;
    return;
  }

  container.innerHTML = history.map(item => `
    <article class="history-item">
      <img src="${item.image}" alt="Foto tanaman" />
      <div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${new Date(item.date).toLocaleString("id-ID")}</p>
        <p>${escapeHtml(item.status)}</p>
      </div>
      <strong>${item.confidence}%</strong>
    </article>
  `).join("");
}

startCameraBtn.addEventListener("click", startCamera);
captureBtn.addEventListener("click", captureImage);
imageInput.addEventListener("change", handleImageUpload);

retakeBtn.addEventListener("click", () => {
  currentImage = "";
  previewImage.hidden = true;
  continueBtn.disabled = true;
  retakeBtn.hidden = true;
  startCamera();
});

continueBtn.addEventListener("click", () => {
  questionPreview.src = currentImage;
  showSection("questionSection");
});

symptomForm.addEventListener("submit", async event => {
  event.preventDefault();
  showSection("loadingSection");

  try {
    const symptoms = collectSymptoms(symptomForm);
    const stats = await calculateImageStats(currentImage);
    const result = analyzeWithExpertRules(symptoms, stats);

    await new Promise(resolve => setTimeout(resolve, 850));
    renderResult(result);
    document.getElementById("saveResultBtn").disabled = false;
    document.getElementById("saveResultBtn").textContent = "Simpan Hasil";
    showSection("resultSection");
  } catch (error) {
    console.error(error);
    alert("Analisis gagal dilakukan. Silakan coba gambar lain.");
    showSection("questionSection");
  }
});

document.querySelectorAll("[data-back]").forEach(button => {
  button.addEventListener("click", () => {
    const target = button.dataset.back;
    if (target === "cameraSection" && currentImage) {
      previewImage.src = currentImage;
      previewImage.hidden = false;
      video.hidden = true;
      placeholder.hidden = true;
      continueBtn.disabled = false;
      retakeBtn.hidden = false;
    }
    showSection(target);
  });
});

document.getElementById("restartBtn").addEventListener("click", resetApp);
document.getElementById("saveResultBtn").addEventListener("click", saveCurrentResult);

document.getElementById("historyBtn").addEventListener("click", () => {
  stopCamera();
  renderHistory();
  showSection("historySection");
});

document.getElementById("clearHistoryBtn").addEventListener("click", () => {
  const confirmed = confirm("Hapus semua riwayat analisis?");
  if (!confirmed) return;
  localStorage.removeItem("plantcare-history");
  renderHistory();
});

window.addEventListener("beforeunload", stopCamera);
