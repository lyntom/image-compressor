const qs = (s) => document.querySelector(s);

const fileInput = qs("#file");
const drop = qs("#drop");
const list = qs("#list");
const compressBtn = qs("#compressBtn");
const clearBtn = qs("#clearBtn");
const keepName = qs("#keepName");

drop.addEventListener("click", () => fileInput.click());
["dragenter", "dragover"].forEach((ev) => {
  drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.add("border-blue-400", "bg-blue-50");
  });
});
["dragleave", "drop"].forEach((ev) => {
  drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.remove("border-blue-400", "bg-blue-50");
  });
});
drop.addEventListener("drop", (e) => {
  const dt = e.dataTransfer;
  if (!dt) return;
  handleFiles(dt.files);
});

fileInput.addEventListener("change", (e) => handleFiles(e.target.files));

let files = [];
function handleFiles(fileList) {
  files = Array.from(fileList).filter((f) => /image\/(png|jpeg)/.test(f.type));
  renderFileList();
}

function renderFileList() {
  list.innerHTML = "";
  if (!files.length) {
    list.innerHTML =
      '<p class="text-sm text-gray-600 text-center">Belum ada gambar dipilih</p>';
    return;
  }
  files.forEach((file, idx) => {
    const el = document.createElement("div");
    el.className = "p-3 border rounded-lg flex justify-between items-center";
    el.innerHTML = `<span>${file.name} — ${(file.size / 1024).toFixed(
      1
    )} KB</span>`;
    const removeBtn = document.createElement("button");
    removeBtn.className = "text-red-500 text-xs hover:underline";
    removeBtn.textContent = "Hapus";
    removeBtn.addEventListener("click", () => {
      files.splice(idx, 1);
      renderFileList();
    });
    el.appendChild(removeBtn);
    list.appendChild(el);
  });
}

clearBtn.addEventListener("click", () => {
  files = [];
  renderFileList();
  fileInput.value = "";
});

compressBtn.addEventListener("click", async () => {
  if (!files.length) return alert("Pilih minimal 1 gambar.");
  compressBtn.disabled = true;
  compressBtn.textContent = "Memproses...";

  const q = 0.7; // kualitas
  const maxW = 1920; // batas lebar maksimal (opsional)
  const maxH = 1080; // batas tinggi maksimal (opsional)

  list.innerHTML = "";

  for (const file of files) {
    try {
      const originalSize = file.size;
      const imgURL = URL.createObjectURL(file);
      const img = await loadImage(imgURL);

      const [newW, newH] = calcSize(img.width, img.height, maxW, maxH);

      const canvas = document.createElement("canvas");
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, newW, newH);

      let outType = "image/jpeg";
      let blob = await new Promise((res) => canvas.toBlob(res, outType, q));

      const compressedSize = blob.size;
      const ratio = ((compressedSize / originalSize) * 100).toFixed(0);
      const outName = `compressed-${file.name}`;

      const row = document.createElement("div");
      row.className = "p-3 border rounded-lg flex justify-between items-center";
      row.innerHTML = `<span>${outName} — ${(compressedSize / 1024).toFixed(
        1
      )} KB (${ratio}% dari asli)</span>`;

      const dl = document.createElement("a");
      dl.className =
        "px-3 py-1 bg-green-600 text-white rounded-md text-xs shadow hover:bg-green-700 transition";
      dl.href = URL.createObjectURL(blob);
      dl.download = outName;
      dl.textContent = "Download";

      row.appendChild(dl);
      list.appendChild(row);

      setTimeout(() => {
        URL.revokeObjectURL(imgURL);
      }, 10000);
    } catch (err) {
      console.error(err);
      const errEl = document.createElement("div");
      errEl.className = "p-3 text-red-600";
      errEl.textContent = `Gagal memproses ${file.name}`;
      list.appendChild(errEl);
    }
  }

  compressBtn.disabled = false;
  compressBtn.textContent = "Kompres";
});

function deriveName(origName, outType) {
  const base = origName.replace(/\.[^/.]+$/, "");
  const ext = outType === "image/png" ? ".png" : ".jpg";
  return base + ext;
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

function calcSize(w, h, maxW, maxH) {
  if (!maxW && !maxH) return [w, h];
  let nw = w,
    nh = h;
  if (maxW && nw > maxW) {
    const ratio = maxW / nw;
    nw = Math.round(nw * ratio);
    nh = Math.round(nh * ratio);
  }
  if (maxH && nh > maxH) {
    const ratio = maxH / nh;
    nw = Math.round(nw * ratio);
    nh = Math.round(nh * ratio);
  }
  return [nw, nh];
}

renderFileList();
