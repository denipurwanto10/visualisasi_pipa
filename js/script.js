// Global variables
const canvas = document.getElementById("pipeCanvas");
const ctx = canvas.getContext("2d");
const depthInput = document.getElementById("depthInput");
const saringanDepth = document.getElementById("saringanDepth");
const saringanSize = document.getElementById("saringanSize");
const saringanList = document.getElementById("saringanList");
const statusText = document.getElementById("status");
const detailInfo = document.getElementById("detailInfo");
const tooltip = document.getElementById("tooltip");
const hoverDetails = document.getElementById("hoverDetails");

// Constants
const PIPE_WIDTH = 70;
const TOP_MARGIN = 50;
const BOTTOM_MARGIN = 40;
const SCALE_STEP = 4;

// Data state
let currentDepth = 0;
let saringanPosisi = []; // Array of objects: {depth, size}
let components = [];

// Notifikasi system
let notificationTimeout = null;

function showNotification(message, type = 'info', duration = 4000) {
    // Hapus notifikasi sebelumnya jika ada
    const existingNotification = document.querySelector('.modern-notification');
    if (existingNotification) {
        existingNotification.remove();
        clearTimeout(notificationTimeout);
    }
    
    // Buat notifikasi baru
    const notification = document.createElement('div');
    notification.className = `modern-notification modern-notification-${type}`;
    
    // Ikon berdasarkan tipe
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    if (type === 'error') icon = '❌';
    
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${icon}</span>
            <span class="notification-message">${message}</span>
        </div>
        <button class="notification-close" onclick="closeNotification(this)">×</button>
    `;
    
    // Tambahkan styles inline
    notification.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        background: white;
        padding: 16px 20px;
        border-radius: 14px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 280px;
        max-width: 350px;
        transform: translateX(120%);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        z-index: 1000;
        border-left: 4px solid var(--${type === 'success' ? 'success' : type === 'warning' ? 'danger' : 'primary'});
    `;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Auto close setelah durasi tertentu
    notificationTimeout = setTimeout(() => {
        closeNotification(notification.querySelector('.notification-close'));
    }, duration);
    
    // Tambahkan style untuk konten notifikasi
    const style = document.createElement('style');
    style.textContent = `
        .notification-content {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
        }
        .notification-icon {
            font-size: 20px;
            flex-shrink: 0;
        }
        .notification-message {
            font-size: 14px;
            color: var(--text);
            line-height: 1.4;
        }
        .notification-close {
            background: none;
            border: none;
            font-size: 24px;
            color: var(--muted);
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            margin-left: 10px;
            transition: all 0.2s;
        }
        .notification-close:hover {
            background: #f1f5f9;
            color: var(--danger);
        }
    `;
    document.head.appendChild(style);
}

function closeNotification(button) {
    const notification = button.closest('.modern-notification');
    if (notification) {
        notification.style.transform = 'translateX(120%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 400);
    }
    clearTimeout(notificationTimeout);
}

// Helper functions
function getInfo(depth) {
  if (depth <= 30)
    return { level: "Mudah", class: "low", description: "Sumur dangkal, instalasi relatif mudah" };

  if (depth <= 60)
    return { level: "Sedang", class: "mid", description: "Perlu peralatan dan pengawasan teknis" };

  if (depth <= 150)
    return { level: "Sulit", class: "high", description: "Sumur dalam, risiko teknis tinggi" };

  return { level: "Sangat Sulit", class: "very-high", description: "Butuh studi geologi dan peralatan khusus" };
}


function drawSaringan(x, y, width, height, depth, size) {
    // Warna berdasarkan ukuran saringan
    let saringanColor;
    if (size <= 2) {
        saringanColor = "#10b981"; // Hijau untuk saringan kecil
    } else if (size <= 4) {
        saringanColor = "#f59e0b"; // Kuning untuk saringan sedang
    } else {
        saringanColor = "#ef4444"; // Merah untuk saringan besar
    }
    
    // Body saringan dengan efek 3D
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, saringanColor);
    gradient.addColorStop(1, darkenColor(saringanColor, 30));
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    const radius = Math.min(8, height / 4);
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
    
    // Outline saringan
    ctx.strokeStyle = darkenColor(saringanColor, 40);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Efek tekstur saringan
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 0.8;
    
    // Garis horizontal
    const lineSpacing = Math.max(4, height / 15);
    for (let i = lineSpacing; i < height - lineSpacing; i += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(x + 8, y + i);
        ctx.lineTo(x + width - 8, y + i);
        ctx.stroke();
    }
    
    // Angka ukuran saringan di tengah dengan background
    ctx.fillStyle = "#ffffff";
    const fontSize = Math.min(14, Math.max(10, height / 4));
    ctx.font = `bold ${fontSize}px Inter`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    const text = `${size.toFixed(1)}m`;
    const textY = y + height / 2;
    const textWidth = ctx.measureText(text).width;
    
    // Background untuk teks
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    const padding = 4;
    ctx.beginPath();
    ctx.roundRect(
        x + width / 2 - textWidth / 2 - padding,
        textY - fontSize / 2 - padding,
        textWidth + padding * 2,
        fontSize + padding * 2,
        6
    );
    ctx.fill();
    
    // Teks ukuran
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, x + width / 2, textY);
    
    // Reset
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    
    // Tambahkan ke komponen untuk interaksi
    components.push({
        type: "saringan",
        x: x,
        y: y,
        width: width,
        height: height,
        depth: depth,
        size: size,
        info: `Saringan - Kedalaman: ${depth}m - Ukuran: ${size}m - Fungsi: Menyaring Air`
    });
}

// Helper function untuk menggelapkan warna
function darkenColor(color, percent) {
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);
    
    r = Math.floor(r * (100 - percent) / 100);
    g = Math.floor(g * (100 - percent) / 100);
    b = Math.floor(b * (100 - percent) / 100);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function drawSambungan(x, y, width, depth, posisi = "") {
    const height = 12;
    const sambunganColor = "#6b7280";
    
    // Body sambungan
    ctx.fillStyle = sambunganColor;
    ctx.beginPath();
    ctx.roundRect(x - 4, y - height/2, width + 8, height, 3);
    ctx.fill();
    
    // Baut-baut kecil
    ctx.fillStyle = "#1f2937";
    const bautCount = 4;
    const bautSpacing = (width + 8) / (bautCount + 1);
    
    for (let i = 1; i <= bautCount; i++) {
        ctx.beginPath();
        ctx.arc(x - 4 + bautSpacing * i, y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Tentukan tipe sambungan berdasarkan posisi
    let tipeSambungan = "Sambungan";
    if (posisi === "atas") {
        tipeSambungan = "Sambungan Atas";
    } else if (posisi === "bawah") {
        tipeSambungan = "Sambungan Bawah";
    } else if (posisi === "atas_saringan") {
        tipeSambungan = "Sambungan Atas Saringan";
    } else if (posisi === "bawah_saringan") {
        tipeSambungan = "Sambungan Bawah Saringan";
    }
    
    components.push({
        type: "sambungan",
        x: x - 4,
        y: y - height/2,
        width: width + 8,
        height: height,
        depth: depth,
        posisi: posisi,
        info: `${tipeSambungan} - Kedalaman: ${depth.toFixed(1)}m - Fungsi: Menyambung pipa`
    });
}

function drawPipaUtama(x, y, width, totalHeight, depth) {
    // PERBAIKAN: Tambahkan indikator visual di ujung-ujung pipa
    const pipeY = y; // Posisi Y atas pipa (0m)
    
    // Warna gradient untuk pipa
    const pipeGradient = ctx.createLinearGradient(x, 0, x + width, 0);
    pipeGradient.addColorStop(0, "#1f2937");
    pipeGradient.addColorStop(0.5, "#6b7280");
    pipeGradient.addColorStop(1, "#1f2937");
    
    // Gambar pipa utama
    ctx.fillStyle = pipeGradient;
    ctx.beginPath();
    ctx.roundRect(x, pipeY, width, totalHeight, 15);
    ctx.fill();
    
    // Outline pipa
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Garis tengah pipa
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + width/2, pipeY);
    ctx.lineTo(x + width/2, pipeY + totalHeight);
    ctx.stroke();
    
    // PERBAIKAN: Tambahkan indikator ujung pipa untuk verifikasi
    ctx.fillStyle = "#3b82f6";
    ctx.font = "bold 10px Inter";
    ctx.textAlign = "center";
    
    // Indikator ujung atas pipa (0m)
    ctx.beginPath();
    ctx.arc(x + width/2, pipeY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText("0m", x + width/2, pipeY - 10);
    
    // Indikator ujung bawah pipa (depth m)
    ctx.beginPath();
    ctx.arc(x + width/2, pipeY + totalHeight, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`${depth}m`, x + width/2, pipeY + totalHeight + 15);
    
    ctx.textAlign = "left"; // Reset ke default
}

function updateSaringanList() {
    if (saringanPosisi.length === 0) {
        saringanList.innerHTML = '<div style="font-size:12px;color:var(--muted);text-align:center;padding:12px;">Belum ada saringan ditambahkan</div>';
        return;
    }
    
    saringanList.innerHTML = '';
    
    // Sort berdasarkan kedalaman
    saringanPosisi.sort((a, b) => a.depth - b.depth);
    
    saringanPosisi.forEach((saringan, index) => {
        const item = document.createElement('div');
        item.className = 'saringan-item';
        item.innerHTML = `
            <div class="saringan-info">
                <span class="saringan-depth">Kedalaman: ${saringan.depth.toFixed(1)} m</span>
                <span class="saringan-details">Ukuran: ${saringan.size.toFixed(1)} m (${saringan.size * 100} cm)</span>
            </div>
            <div class="saringan-delete" onclick="hapusSaringan(${index})">Hapus</div>
        `;
        saringanList.appendChild(item);
    });
}

function addSaringan() {
    if (currentDepth === 0) {
        showNotification("Buat pipa terlebih dahulu dengan mengisi kedalaman dan klik 'Buat Pipa'", 'warning', 3000);
        return;
    }
    
    const depth = parseFloat(saringanDepth.value);
    const size = parseFloat(saringanSize.value);
    
    if (!depth || depth <= 0 || depth > currentDepth) {
        showNotification(`Masukkan kedalaman yang valid (0.1-${currentDepth}m)`, 'error', 3000);
        return;
    }
    
    if (!size || size < 0.1 || size > currentDepth) {
        showNotification(`Masukkan ukuran saringan yang valid (0.1-${currentDepth}m)`, 'error', 3000);
        return;
    }
    
    // Validasi agar saringan tidak tumpang tindih
    const saringanStart = depth - (size / 2);
    const saringanEnd = depth + (size / 2);
    
    for (const existingSaringan of saringanPosisi) {
        const existingStart = existingSaringan.depth - (existingSaringan.size / 2);
        const existingEnd = existingSaringan.depth + (existingSaringan.size / 2);
        
        if ((saringanStart >= existingStart && saringanStart <= existingEnd) ||
            (saringanEnd >= existingStart && saringanEnd <= existingEnd) ||
            (saringanStart <= existingStart && saringanEnd >= existingEnd)) {
            showNotification(`Saringan tumpang tindih dengan saringan di kedalaman ${existingSaringan.depth}m (ukuran ${existingSaringan.size}m)`, 'error', 4000);
            return;
        }
    }
    
    // Cek apakah saringan keluar dari pipa
    if (saringanStart < 0 || saringanEnd > currentDepth) {
        showNotification(`Saringan ukuran ${size}m di kedalaman ${depth}m keluar dari pipa!`, 'error', 3000);
        return;
    }
    
    // Cek apakah sudah ada saringan di kedalaman yang sama
    const existingIndex = saringanPosisi.findIndex(s => s.depth === depth);
    if (existingIndex !== -1) {
        showNotification(`Sudah ada saringan di kedalaman ${depth}m. Update ukuran saringan.`, 'info', 3000);
        saringanPosisi[existingIndex].size = size;
        saringanDepth.value = '';
        saringanSize.value = '3';
        updateSaringanList();
        drawVisualization();
        return;
    }
    
    saringanPosisi.push({
        depth: depth,
        size: size
    });
    
    saringanDepth.value = '';
    saringanSize.value = '3';
    updateSaringanList();
    drawVisualization();
    showNotification(`Saringan berhasil ditambahkan di kedalaman ${depth}m (ukuran: ${size}m)`, 'success', 3000);
}

function hapusSaringan(index) {
    const saringan = saringanPosisi[index];
    saringanPosisi.splice(index, 1);
    updateSaringanList();
    drawVisualization();
    showNotification(`Saringan di kedalaman ${saringan.depth}m berhasil dihapus`, 'success', 3000);
}

function drawVisualization() {
    components = [];
    const MIN_CANVAS_HEIGHT = 600;
const EXTRA_HEIGHT_PER_100M = 150;

canvas.height = Math.max(
    MIN_CANVAS_HEIGHT,
    (currentDepth / 100) * EXTRA_HEIGHT_PER_100M + 300
);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (currentDepth === 0) {
        // statusText.innerHTML = "Status: <span class='badge mid'>Belum ada pipa</span>";
        detailInfo.innerHTML = `
            <strong>Instruksi Penggunaan:</strong>
            <div>1. Masukkan kedalaman pipa (misal: 45m)</div>
            <div>2. Klik "Buat Pipa" untuk membuat pipa</div>
            <div>3. Masukkan kedalaman dan ukuran saringan</div>
            <div>4. Klik "Tambah Saringan" untuk menambah</div>
            <div>5. Klik "Reset Semua" untuk mulai ulang</div>
        `;
        hoverDetails.innerHTML = "Buat pipa terlebih dahulu";
        return;
    }
    
    const info = getInfo(currentDepth);
    // statusText.innerHTML = `Status: <span class="badge ${info.class}">${info.level}</span>`;

    // PERBAIKAN: Hitung tinggi yang bisa digunakan untuk pipa
    const usableHeight = canvas.height - TOP_MARGIN - BOTTOM_MARGIN;
    const scale = usableHeight / currentDepth; // Skala: piksel per meter
    const pipeHeight = currentDepth * scale; // Tinggi pipa dalam piksel
    const pipeX = canvas.width/2 - PIPE_WIDTH/2;

    // Background
    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Gambar skala di sisi kiri
    ctx.font = "12px Inter";
    ctx.fillStyle = "#334155";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    
    // PERBAIKAN: Pastikan skala sesuai dengan posisi pipa
   let lastLabelY = -Infinity;
const MIN_LABEL_DISTANCE = 25; // jarak minimal antar teks (pixel)

for (let m = 0; m <= currentDepth; m += 1) {
    const y = TOP_MARGIN + (m * scale);

    // garis kecil tiap 1m
    ctx.beginPath();
    ctx.moveTo(pipeX - 15, y);
    ctx.lineTo(pipeX - 5, y);
    ctx.stroke();

    // label hanya tiap 4m DAN jika jaraknya cukup
    if (m % SCALE_STEP === 0 && y - lastLabelY > MIN_LABEL_DISTANCE) {
        ctx.fillText(`${m} m`, pipeX - 60, y + 4);

        ctx.beginPath();
        ctx.moveTo(pipeX - 25, y);
        ctx.lineTo(pipeX - 5, y);
        ctx.stroke();

        lastLabelY = y;
    }
}


    // Gambar pipa utama - PERBAIKAN: Gunakan TOP_MARGIN sebagai posisi Y
    drawPipaUtama(pipeX, TOP_MARGIN, PIPE_WIDTH, pipeHeight, currentDepth);
    
    
    // Gambar saringan di posisi yang ditentukan
    saringanPosisi.forEach(saringan => {
        if (saringan.depth <= currentDepth) {
            // Hitung tinggi saringan dalam piksel berdasarkan skala
            const saringanHeightInPixels = saringan.size * scale;
            
            // Hitung posisi Y (pusat saringan berada di kedalaman yang diinput)
            const saringanCenterY = TOP_MARGIN + (saringan.depth * scale);
            const saringanTopY = saringanCenterY - (saringanHeightInPixels / 2);
            
            // Pastikan saringan tidak keluar dari pipa
            const minY = TOP_MARGIN;
            const maxY = TOP_MARGIN + pipeHeight - saringanHeightInPixels;
            const finalY = Math.max(minY, Math.min(saringanTopY, maxY));
            
            // Gambar saringan dengan ukuran yang proporsional
            drawSaringan(pipeX, finalY, PIPE_WIDTH, saringanHeightInPixels, saringan.depth, saringan.size);
            
            // Tambahkan indikator kedalaman di garis skala
            ctx.fillStyle = "#dc2626";
            ctx.beginPath();
            ctx.arc(pipeX - 20, saringanCenterY, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Label kedalaman saringan
            ctx.fillStyle = "#dc2626";
            ctx.font = "10px Inter";
            ctx.fillText(`${saringan.depth}m`, pipeX - 50, saringanCenterY + 4);
            
            // Tambahkan sambungan di atas dan bawah saringan jika ada ruang
            if (finalY > TOP_MARGIN + 15) {
                const sambunganDepth = saringan.depth - (saringan.size/2);
                drawSambungan(pipeX, finalY - 10, PIPE_WIDTH, sambunganDepth, "atas_saringan");
            }
            
            if (finalY + saringanHeightInPixels < TOP_MARGIN + pipeHeight - 15) {
                const sambunganDepth = saringan.depth + (saringan.size/2);
                drawSambungan(pipeX, finalY + saringanHeightInPixels + 10, PIPE_WIDTH, sambunganDepth, "bawah_saringan");
            }
        }
    });
    
    // PERBAIKAN: Tambahkan informasi skala di kanan
    ctx.fillStyle = "#475569";
    ctx.font = "10px Inter";
    ctx.textAlign = "right";
    ctx.fillText(`Skala: 1m = ${scale.toFixed(2)}px`, canvas.width - 20, 30);
    ctx.textAlign = "left";
    
    // Detail informasi teknis
    const saringanDetails = saringanPosisi.length > 0 
        ? saringanPosisi.sort((a,b) => a.depth - b.depth)
            .map(s => `${s.depth}m (${s.size}m)`)
            .join(', ')
        : '-';
    
    detailInfo.innerHTML = `
        <strong>Detail Pipa:</strong>
        <div>• Kedalaman pipa: ${currentDepth} meter</div>
        <div>• Jumlah saringan: ${saringanPosisi.length} unit</div>
        <div>• Posisi & ukuran saringan: ${saringanDetails}</div>
        <div>• Skala visualisasi: 1 meter = ${scale.toFixed(2)} pixel</div>
        <div>• Tinggi pipa (canvas): ${pipeHeight.toFixed(1)} pixel</div>
    `;
}

function updateVisualization() {
    const depth = parseInt(depthInput.value);
    
    if (!depth || depth < 5 || depth > 500) {
        showNotification("Masukkan kedalaman pipa yang valid (5-500 m)", 'error', 3000);
        return;
    }
    
    currentDepth = depth;
    // Filter saringan yang kedalamannya melebihi pipa
    saringanPosisi = saringanPosisi.filter(s => s.depth <= depth);
    updateSaringanList();
    drawVisualization();
    
    const info = getInfo(currentDepth);
    showNotification(`Pipa berhasil dibuat! Kedalaman: ${currentDepth}m`, 'success', 4000);
}

function resetAll() {
    if (currentDepth === 0 && saringanPosisi.length === 0) {
        showNotification("Tidak ada data untuk di-reset", 'info', 2000);
        return;
    }
    
    const confirmReset = confirm("Apakah Anda yakin ingin mereset semua data?");
    if (confirmReset) {
        currentDepth = 0;
        saringanPosisi = [];
        depthInput.value = "";
        saringanDepth.value = '';
        saringanSize.value = '3';
        updateSaringanList();
        drawVisualization();
        showNotification("Semua data berhasil direset", 'success', 3000);
    }
}

// Event listeners
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    let foundComponent = null;
    
    for (const component of components) {
        if (mouseX >= component.x && 
            mouseX <= component.x + component.width && 
            mouseY >= component.y && 
            mouseY <= component.y + component.height) {
            foundComponent = component;
            break;
        }
    }
    
    if (foundComponent) {
        tooltip.style.left = (mouseX + 15) + "px";
        tooltip.style.top = (mouseY + 15) + "px";
        tooltip.innerHTML = foundComponent.info;
        tooltip.style.opacity = 1;
        
        hoverDetails.innerHTML = `
            <div><strong>${foundComponent.type.toUpperCase()}</strong></div>
            <div><small>${foundComponent.info}</small></div>
        `;
    } else {
        // PERBAIKAN: Tampilkan informasi kedalaman saat hover di area pipa
        const pipeX = canvas.width/2 - PIPE_WIDTH/2;
        const usableHeight = canvas.height - TOP_MARGIN - BOTTOM_MARGIN;
        const scale = currentDepth > 0 ? usableHeight / currentDepth : 0;
        
        if (mouseX >= pipeX && mouseX <= pipeX + PIPE_WIDTH && 
            mouseY >= TOP_MARGIN && mouseY <= TOP_MARGIN + (currentDepth * scale)) {
            
            const depthAtMouse = ((mouseY - TOP_MARGIN) / scale).toFixed(1);
            hoverDetails.innerHTML = `
                <div><strong>POSISI PIPA</strong></div>
                <div><small>Kedalaman: ${depthAtMouse} meter</small></div>
                <div><small>Koordinat: (${mouseX.toFixed(0)}, ${mouseY.toFixed(0)})</small></div>
            `;
        } else {
            hoverDetails.innerHTML = "Arahkan mouse ke komponen pipa";
        }
        tooltip.style.opacity = 0;
    }
});

function downloadPDF() {
    if (currentDepth === 0) {
        showNotification("Buat pipa terlebih dahulu sebelum download PDF", 'warning', 3000);
        return;
    }
    
    showNotification("Membuat PDF...", 'info', 2000);
    
    // Simulasi proses pembuatan PDF
    setTimeout(() => {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        const imgData = canvas.toDataURL("image/png");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = 140;
        const imgHeight = imgWidth * (canvas.height / canvas.width);
        const x = (pdfWidth - imgWidth) / 2;
        const y = 40;
        
        pdf.setFontSize(16);
        pdf.text("LAPORAN VISUALISASI PIPA", pdfWidth/2, 20, { align: "center" });
        
        const info = getInfo(currentDepth);
        
        pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
        
        let detailY = y + imgHeight + 20;
        pdf.setFontSize(12);
        
        detailY += 8;
        pdf.setFontSize(10);
        pdf.text(`• Kedalaman pipa: ${currentDepth} meter`, 20, detailY);
        detailY += 6;
        pdf.text(`• Kategori risiko: ${info.level}`, 20, detailY);
        detailY += 6;
        pdf.text(`• Jumlah saringan: ${saringanPosisi.length} unit`, 20, detailY);
        
        if (saringanPosisi.length > 0) {
            detailY += 6;
            pdf.text(`• Posisi & ukuran saringan:`, 20, detailY);
            
            saringanPosisi.sort((a,b)=>a.depth - b.depth).forEach(saringan => {
                detailY += 6;
                pdf.text(`  - ${saringan.depth}m (ukuran: ${saringan.size}m)`, 25, detailY);
            });
        }
        
        pdf.save("visualisasi_pipa.pdf");
        
        showNotification("PDF berhasil diunduh!", 'success', 3000);
    }, 1000);
}

// Initialize
window.addEventListener("load", () => {
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
            if (width < 2 * radius) radius = width / 2;
            if (height < 2 * radius) radius = height / 2;
            this.beginPath();
            this.moveTo(x + radius, y);
            this.arcTo(x + width, y, x + width, y + height, radius);
            this.arcTo(x + width, y + height, x, y + height, radius);
            this.arcTo(x, y + height, x, y, radius);
            this.arcTo(x, y, x + width, y, radius);
            this.closePath();
            return this;
        }
    }
    
    drawVisualization();
});


// PERBAIKAN: Tambahkan fungsi verifikasi
function verifyScale() {
    if (currentDepth === 0) {
        alert("Buat pipa terlebih dahulu!");
        return;
    }
    
    const usableHeight = canvas.height - TOP_MARGIN - BOTTOM_MARGIN;
    const scale = usableHeight / currentDepth;
    const pipeHeight = currentDepth * scale;
    
    alert(`=== VERIFIKASI SKALA ===\n
Kedalaman: ${currentDepth} m
Tinggi canvas: ${canvas.height} px
Top margin: ${TOP_MARGIN} px
Bottom margin: ${BOTTOM_MARGIN} px
Tinggi usable: ${usableHeight} px
Skala: ${scale.toFixed(2)} px/m
Tinggi pipa: ${pipeHeight.toFixed(1)} px
Posisi pipa: ${TOP_MARGIN} - ${(TOP_MARGIN + pipeHeight).toFixed(1)} px
Saringan: ${saringanPosisi.length} unit

UJUNG PIPA:
- Atas (0m): ${TOP_MARGIN} px
- Bawah (${currentDepth}m): ${(TOP_MARGIN + pipeHeight).toFixed(1)} px
`);
}
