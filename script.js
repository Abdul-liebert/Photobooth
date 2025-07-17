const video = document.getElementById("video");
const startBtn = document.getElementById("start");
const downloadBtn = document.getElementById("download");
const countdownEl = document.getElementById("countdown");
const flash = document.getElementById("flash");
const previewDiv = document.getElementById("preview");
const filterSelect = document.getElementById("filter");
const qrDiv = document.getElementById("qrcode");

const photoWidth = 640;
const photoHeight = 360;
const totalPhotos = 8;
let photoCanvases = [];

navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
  video.srcObject = stream;
});

filterSelect.addEventListener("change", () => {
  video.style.filter = filterSelect.value;
});

function triggerFlash() {
  flash.classList.add("show");
  setTimeout(() => flash.classList.remove("show"), 100);
}

function showCountdown(seconds) {
  return new Promise((resolve) => {
    countdownEl.textContent = seconds;
    const interval = setInterval(() => {
      seconds--;
      if (seconds > 0) {
        countdownEl.textContent = seconds;
      } else {
        clearInterval(interval);
        countdownEl.textContent = "";
        resolve();
      }
    }, 1000);
  });
}

function capturePhoto() {
  const canvas = document.createElement("canvas");
  canvas.width = photoWidth;
  canvas.height = photoHeight;
  const ctx = canvas.getContext("2d");

  const filterValue = filterSelect.value || "none"; // ← ini perbaikannya
  ctx.filter = filterValue;

  // Deteksi apakah video sedang mirror
  const isMirrored = video.style.transform === "scaleX(1)";
  if (isMirrored) {
    ctx.translate(canvas.width, 0);
    ctx.scale(1, -1); // Membalik horizontal jika mirror
  }

  ctx.drawImage(video, 0, 0, photoWidth, photoHeight);

  triggerFlash();
  photoCanvases.push(canvas);
}

async function takePhotos() {
  photoCanvases = [];
  previewDiv.innerHTML = "";
  const qrCanvasContainer = document.getElementById("qrcode-canvas-container");
  if (qrCanvasContainer) {
    qrCanvasContainer.innerHTML =
      '<p class="qr-placeholder">QR akan muncul setelah foto selesai</p>';
  }

  // Ambil Strip Pertama
  for (let i = 0; i < 4; i++) {
    await showCountdown(3);
    capturePhoto();
  }

  showPreview(true); // tampilkan preview strip 1

  // Tampilkan tombol lanjut
  const nextBtn = document.getElementById("nextStripBtn");
  nextBtn.style.display = "inline-block";

  // Tunggu sampai tombol "Lanjut" diklik
  await new Promise((resolve) => {
    nextBtn.onclick = () => {
      nextBtn.style.display = "none";
      resolve();
    };
  });

  // Ambil Strip Kedua
  for (let i = 0; i < 4; i++) {
    await showCountdown(3);
    capturePhoto();
  }

  showPreview(false); // tampilkan hasil final
  downloadBtn.disabled = false;
}

function drawQRCode(ctx, text, x, y, size) {
  const qr = new QRious({ value: text, size: size });
  const img = new Image();
  img.src = qr.toDataURL();
  return new Promise((resolve) => {
    img.onload = () => {
      ctx.drawImage(img, x, y, size, size);
      resolve();
    };
  });
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth > maxWidth && i > 0) {
      ctx.fillText(line, x, y);
      line = words[i] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}


async function showPreview(isPartial = false) {
  const canvasWidth = 2400;
  const canvasHeight = 3600;
  const spacing = 30;
  const rows = 4;
  const columns = 2;

  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = canvasWidth;
  finalCanvas.height = canvasHeight;
  const ctx = finalCanvas.getContext("2d");

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const stripWidth = (canvasWidth - spacing * (columns + 1)) / columns;
  const stripHeight = canvasHeight;

  const footerImage = new Image();
  footerImage.src = "/public/aset.png";

  footerImage.onload = async () => {
    const allStrips = [
      photoCanvases.slice(0, 4),
      isPartial ? [] : photoCanvases.slice(4, 8),
    ];

    const qrLinks = [
      "https://example.com/strip1",
      "https://example.com/strip2",
    ];

    for (let col = 0; col < allStrips.length; col++) {
      const stripPhotos = allStrips[col];
      const xBase = spacing + col * (stripWidth + spacing);

      const reservedFooterHeight = 250;
      const reservedQRHeight = 200;
      const photoAreaHeight =
        stripHeight - spacing * 2 - reservedFooterHeight - reservedQRHeight;

      const availableHeight = (photoAreaHeight - (rows - 1) * spacing) / rows;

      let photoHeight = availableHeight;
      let photoWidth = photoHeight * (16 / 9);

      if (photoWidth > stripWidth) {
        const scaleFactor = stripWidth / photoWidth;
        photoWidth = stripWidth;
        photoHeight = photoHeight * scaleFactor;
      }

      // Gambar foto-foto
      stripPhotos.forEach((canvas, i) => {
        const x = xBase + (stripWidth - photoWidth) / 2;
        const y = spacing + i * (photoHeight + spacing);
        ctx.drawImage(canvas, x, y, photoWidth, photoHeight);
      });

      // Gambar footer image (branding) di atas QR dan alamat
      const maxFooterWidth = stripWidth * 1;
      const aspectRatio = footerImage.width / footerImage.height;
      const footerWidth = maxFooterWidth;
      const footerHeight = footerWidth / aspectRatio;
      const footerX = xBase + (stripWidth - footerWidth) / 2;
      const footerY = stripHeight - reservedQRHeight - footerHeight - 220;
      ctx.drawImage(footerImage, footerX, footerY, footerWidth, footerHeight);

      // Gambar QR Code di kanan bawah
      const qrSize = 300;
      const qrX = xBase + stripWidth - qrSize - 40;
      const qrY = stripHeight - qrSize - 80;
      await drawQRCode(ctx, qrLinks[col], qrX, qrY, qrSize);

      // Tampilkan alamat di kiri bawah
     const addressHeading = "SMK TI BAZMA";
const addressSub = "Jl. Raya Kalijati No.88, Subang, Jawa Barat, Indonesia – Energi Masa Depan Indonesia";

// Koordinat dasar kiri bawah
const textX = xBase + 40;
const textYBase = stripHeight - 100;

// Teks Heading
ctx.fillStyle = "#5070B6";
ctx.font = "bold 64px Arial";
ctx.textAlign = "left";
ctx.fillText(addressHeading, textX, textYBase - 80); // heading di atas

// Deskripsi multiline
ctx.fillStyle = "#5070B6";
ctx.font = "italic 32px Arial";
const maxTextWidth = stripWidth -80; // jaga margin kanan
const lineHeight = 30;

wrapText(ctx, addressSub, textX, textYBase - 24, 720, 40);


    }

    // Preview kecil
    finalCanvas.style.width = "300px";
    finalCanvas.style.height = "auto";
    previewDiv.innerHTML = "";
    previewDiv.appendChild(finalCanvas);

    if (!isPartial) {
      const dataURL = finalCanvas.toDataURL("image/png");
      downloadBtn.dataset.image = dataURL;
      uploadImageToCloudinary(dataURL);
    }
  };
}

const printBtn = document.getElementById("printBtn");

printBtn.addEventListener("click", () => {
  const imgDataUrl = downloadBtn.dataset.image;
  if (!imgDataUrl) return alert("Tidak ada gambar untuk dicetak.");

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html>
      <head>
        <title>Print Photo Strip</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            text-align: center;
          }
          img {
            max-width: 100%;
            height: auto;
            margin: 0 auto;
          }
        </style>
      </head>
      <body>
        <img src="${imgDataUrl}" onload="window.print(); window.onafterprint = () => window.close();" />
      </body>
    </html>
  `);
});


async function uploadImageToCloudinary(dataURL) {
  try {
    const blob = await (await fetch(dataURL)).blob();
    const form = new FormData();
    form.append("file", blob);
    form.append("upload_preset", "photobooth");

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/dxp3bnxa0/image/upload",
      {
        method: "POST",
        body: form,
      }
    );

    const result = await response.json();
    console.log("Cloudinary upload result:", result);

    if (result.secure_url) {
      showQRCode(result.secure_url);
    } else {
      alert("Gagal upload ke Cloudinary");
      console.error(result);
    }
  } catch (e) {
    console.error("Upload error:", e);
    // alert("Upload error: " + e.message);
  }
}

function showQRCode(link) {
  const qrContainer = document.getElementById("qrcode-canvas-container");

  // Hapus canvas lama, biarkan petunjuk tetap
  const oldCanvas = qrContainer.querySelector("canvas");
  if (oldCanvas) oldCanvas.remove();

  // Hapus placeholder kalau ada
  const placeholder = qrContainer.querySelector(".qr-placeholder");
  if (placeholder) placeholder.remove();

  // Tambah QR code baru
  const canvas = document.createElement("canvas");
  new QRious({
    element: canvas,
    value: link,
    size: 200,
  });

  qrContainer.appendChild(canvas);

  const p = document.createElement("p");
  p.textContent = "Scan untuk download hasil";
  p.style.fontSize = "14px";
  p.style.marginTop = "10px";
  qrContainer.appendChild(p);
}

startBtn.addEventListener("click", () => {
  if (photoCanvases.length > 0) {
    if (!confirm("Mulai ulang sesi? Semua hasil sebelumnya akan hilang."))
      return;
  }
  downloadBtn.disabled = true;
  takePhotos();
});

downloadBtn.addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = downloadBtn.dataset.image;
  a.download = "photo-strip.png";
  a.click();
});

const mirrorSelect = document.getElementById("mirror"); // ID dari <select> yang kamu buat

mirrorSelect.addEventListener("change", () => {
  if (mirrorSelect.value === "yes") {
    video.style.transform = "scaleX(-1)"; // Normal (tidak mirror)
  } else {
    video.style.transform = "scaleX(1)"; // Mirror
  }
});
