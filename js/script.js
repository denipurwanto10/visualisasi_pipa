const canvas = document.getElementById("pipeCanvas");
const ctx = canvas.getContext("2d");
const depthInput = document.getElementById("depthInput");
const saringanDepth = document.getElementById("saringanDepth");
const saringanSize = document.getElementById("saringanSize");
const openHoleDepth = document.getElementById("openHoleDepth");
const saringanList = document.getElementById("saringanList");
const openHoleInfo = document.getElementById("openHoleInfo");
const openHoleStatus = document.getElementById("openHoleStatus");
const openHoleDetails = document.getElementById("openHoleDetails");
const detailInfo = document.getElementById("detailInfo");
const tooltip = document.getElementById("tooltip");
const hoverDetails = document.getElementById("hoverDetails");

const PIPE_WIDTH = 70;
const TOP_MARGIN = 50;
const BOTTOM_MARGIN = 40;
const SCALE_STEP = 4;

let currentDepth = 0;
let pipeSegments = [];
let saringanPosisi = [];
let openHole = null;
let components = [];
let pipeWidth = 40;
let groundLevel = 0;
const inchToPixel = 6;

let notificationTimeout = null;

// Notification System
function showNotification(message, type = 'info', duration = 4000) {
    const existingNotification = document.querySelector('.modern-notification');
    if (existingNotification) {
        existingNotification.remove();
        clearTimeout(notificationTimeout);
    }
    
    const notification = document.createElement('div');
    notification.className = `modern-notification modern-notification-${type}`;
    
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
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    notificationTimeout = setTimeout(() => {
        closeNotification(notification.querySelector('.notification-close'));
    }, duration);
    
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

function darkenColor(color, percent) {
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);
    
    r = Math.floor(r * (100 - percent) / 100);
    g = Math.floor(g * (100 - percent) / 100);
    b = Math.floor(b * (100 - percent) / 100);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Drawing functions
function drawSaringan(x, y, width, height, depth, size, isOutOfBounds = false) {
    const saringanColor = "#8B5A2B";
    
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, saringanColor);
    gradient.addColorStop(1, darkenColor(saringanColor, 30));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.fill();

    // Jika saringan keluar batas, tambah border merah
    if (isOutOfBounds) {
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Tambah warning pattern
        ctx.strokeStyle = "rgba(239, 68, 68, 0.3)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.rect(x + 2, y + 2, width - 4, height - 4);
        ctx.stroke();
        ctx.setLineDash([]);
    } else {
        ctx.strokeStyle = darkenColor(saringanColor, 40);
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 0.8;

    const lineSpacing = Math.max(4, height / 15);
    for (let i = lineSpacing; i < height - lineSpacing; i += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(x + 8, y + i);
        ctx.lineTo(x + width - 8, y + i);
        ctx.stroke();
    }

    // *** TEKS DI PINGGIR DENGAN UKURAN ***
    const saringanRightX = x + width;
    const lineStartX = saringanRightX + 2;
    const lineEndX = lineStartX + 20;
    const centerY = y + height / 2;

    // Garis penghubung
    ctx.strokeStyle = isOutOfBounds ? "#ef4444" : "#000000";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lineStartX, centerY);
    ctx.lineTo(lineEndX, centerY);
    ctx.stroke();

    // Teks dengan ukuran di pinggir
    ctx.fillStyle = isOutOfBounds ? "#ef4444" : "#000000";
    ctx.font = "bold 12px Inter";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    
    const labelText = `Saringan (${size.toFixed(1)}m)`;
    ctx.fillText(labelText, lineEndX + 4, centerY);

    // Optional: Tambah icon kecil di ujung garis
    ctx.fillStyle = isOutOfBounds ? "#ef4444" : "#8B5A2B";
    ctx.beginPath();
    ctx.arc(lineEndX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();

    components.push({
        type: "saringan",
        x, y, width, height, depth, size, isOutOfBounds,
        info: isOutOfBounds 
            ? `Saringan - PERINGATAN: Keluar dari pipa! - Kedalaman: ${depth}m - Ukuran: ${size}m`
            : `Saringan - Kedalaman: ${depth}m - Ukuran: ${size}m - Fungsi: Menyaring Air`
    });
}

function drawOpenHole(x, y, width, height) {
    const openHoleColor = "#10b981";
    
    ctx.fillStyle = openHoleColor;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.fill();

    // Pattern subtle
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    const patternSize = 4;
    
    for (let i = 0; i < width; i += patternSize * 2) {
        for (let j = 0; j < height; j += patternSize * 2) {
            if ((i + j) % (patternSize * 4) === 0) {
                ctx.beginPath();
                ctx.arc(x + i, y + j, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Border
    ctx.strokeStyle = "#047857";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner highlight
    ctx.strokeStyle = "#a7f3d0";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);

    // *** TEKS DI PINGGIR DENGAN UKURAN OPEN HOLE ***
    const lineStartX = x + width;
    const lineEndX = lineStartX + 20;
    const centerY = y + height / 2;
    
    // Garis
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lineStartX, centerY);
    ctx.lineTo(lineEndX, centerY);
    ctx.stroke();

    // Teks dengan ukuran open hole
    const ohSize = openHole?.size || 0;
    ctx.fillStyle = "#000000";
    ctx.font = "bold 12px Inter";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    
    const labelText = `Open Hole (${ohSize.toFixed(1)}m)`;
    ctx.fillText(labelText, lineEndX + 4, centerY);

    // Optional: Tambah icon kecil
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(lineEndX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();

    components.push({
        type: "openhole",
        x, y, width, height,
        info: `Open Hole: ${openHole?.startDepth || 0}m - ${openHole?.endDepth || 0}m (${ohSize.toFixed(1)}m) - Posisi: Bawah pipa`
    });
}

function drawPipaUtama(x, y, width, totalHeight, depth, options = {}) {
    const showTop = options.showTopIndicator ?? false;
    const showBottom = options.showBottomIndicator ?? false;

    const pipeGradient = ctx.createLinearGradient(x, 0, x + width, 0);
    pipeGradient.addColorStop(0, "#1f2937");
    pipeGradient.addColorStop(0.5, "#6b7280");
    pipeGradient.addColorStop(1, "#1f2937");

    ctx.fillStyle = pipeGradient;
    ctx.beginPath();
    ctx.roundRect(x, y, width, totalHeight, 0);
    ctx.fill();

    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + width/2, y);
    ctx.lineTo(x + width/2, y + totalHeight);
    ctx.stroke();

    ctx.fillStyle = "#3b82f6";
    ctx.font = "bold 10px Inter";
    ctx.textAlign = "center";

    if (showTop) {
        ctx.beginPath();
        ctx.arc(x + width/2, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText("0m", x + width/2, y - 10);
    }

    if (showBottom) {
        ctx.beginPath();
        ctx.arc(x + width/2, y + totalHeight, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(`${depth}m`, x + width/2, y + totalHeight + 15);
    }

    ctx.textAlign = "left";
}

// Validasi saringan
function validateSaringan(depth, size) {
    // Cari pipa yang sesuai
    const pipe = pipeSegments.find(p => depth >= p.start && depth <= p.end);
    
    if (!pipe) {
        return { valid: false, message: `Kedalaman ${depth}m tidak ada dalam pipa manapun` };
    }
    
    // Hitung batas atas dan bawah saringan
    const saringanAtas = depth - (size / 2);
    const saringanBawah = depth + (size / 2);
    
    // Validasi: Saringan tidak boleh keluar dari pipa
    if (saringanAtas < pipe.start) {
        return { 
            valid: false, 
            message: `Saringan terlalu tinggi! Bagian atas (${saringanAtas.toFixed(1)}m) keluar dari pipa (pipa mulai dari ${pipe.start}m)`,
            details: `Ukuran maksimal untuk kedalaman ${depth}m adalah ${((depth - pipe.start) * 2).toFixed(1)}m`
        };
    }
    
    if (saringanBawah > pipe.end) {
        return { 
            valid: false, 
            message: `Saringan terlalu rendah! Bagian bawah (${saringanBawah.toFixed(1)}m) keluar dari pipa (pipa berakhir di ${pipe.end}m)`,
            details: `Ukuran maksimal untuk kedalaman ${depth}m adalah ${((pipe.end - depth) * 2).toFixed(1)}m`
        };
    }
    
    // Hitung ukuran maksimal yang diperbolehkan
    const maxSizeUp = (depth - pipe.start) * 2;
    const maxSizeDown = (pipe.end - depth) * 2;
    const maxSizeInPipe = Math.min(maxSizeUp, maxSizeDown);
    
    if (size > maxSizeInPipe) {
        return { 
            valid: false, 
            message: `Ukuran saringan terlalu besar!`,
            details: `Maksimal ${maxSizeInPipe.toFixed(1)}m untuk posisi ${depth}m dalam pipa ${pipe.start}m-${pipe.end}m`
        };
    }
    
    // Cek tabrakan dengan saringan lain
    for (const existingSaringan of saringanPosisi) {
        const existingStart = existingSaringan.depth - existingSaringan.size / 2;
        const existingEnd = existingSaringan.depth + existingSaringan.size / 2;

        if ((saringanAtas >= existingStart && saringanAtas <= existingEnd) ||
            (saringanBawah >= existingStart && saringanBawah <= existingEnd) ||
            (saringanAtas <= existingStart && saringanBawah >= existingEnd)) {
            return { 
                valid: false, 
                message: `Saringan tumpang tindih dengan saringan di kedalaman ${existingSaringan.depth}m`,
                details: `Saringan lain: ${existingStart.toFixed(1)}m - ${existingEnd.toFixed(1)}m`
            };
        }
    }
    
    // Cek tabrakan dengan open hole
    if (openHole) {
        const openHolePipe = pipeSegments[openHole.pipeIndex];
        if (openHolePipe && pipe.start === openHolePipe.start) {
            if (saringanBawah > openHole.startDepth) {
                return { 
                    valid: false, 
                    message: `Saringan terlalu dekat dengan open hole`,
                    details: `Open hole mulai dari ${openHole.startDepth}m`
                };
            }
        }
    }
    
    return { valid: true, pipe: pipe };
}

// List management functions
function updateSaringanList() {
    if (saringanPosisi.length === 0) {
        saringanList.innerHTML = '<div style="font-size:12px;color:var(--muted);text-align:center;padding:12px;">Belum ada saringan ditambahkan</div>';
        return;
    }
    
    saringanList.innerHTML = '';
    
    saringanPosisi.sort((a, b) => a.depth - b.depth);
    
    saringanPosisi.forEach((saringan, index) => {
        const item = document.createElement('div');
        item.className = 'saringan-item';
        
        // Validasi apakah saringan masih dalam pipa
        const pipe = pipeSegments.find(p => saringan.depth >= p.start && saringan.depth <= p.end);
        const saringanAtas = saringan.depth - (saringan.size / 2);
        const saringanBawah = saringan.depth + (saringan.size / 2);
        const isOutOfBounds = !pipe || saringanAtas < pipe.start || saringanBawah > pipe.end;
        
        if (isOutOfBounds) {
            item.classList.add('saringan-out-of-bounds');
            item.innerHTML = `
                <div class="saringan-info">
                    <span class="saringan-depth" style="color: #ef4444;">⚠️ Kedalaman: ${saringan.depth.toFixed(1)} m</span>
                    <span class="saringan-details" style="color: #ef4444;">Ukuran: ${saringan.size.toFixed(1)} m (KELUAR BATAS)</span>
                </div>
                <div class="saringan-delete" onclick="hapusSaringan(${index})">Hapus</div>
                <div class="saringan-warning"></div>
            `;
        } else {
            item.innerHTML = `
                <div class="saringan-info">
                    <span class="saringan-depth">Kedalaman: ${saringan.depth.toFixed(1)} m</span>
                    <span class="saringan-details">Ukuran: ${saringan.size.toFixed(1)} m (${saringan.size * 100} cm)</span>
                </div>
                <div class="saringan-delete" onclick="hapusSaringan(${index})">Hapus</div>
            `;
        }
        
        saringanList.appendChild(item);
    });
}

function updatePipeList() {
    const pipeList = document.getElementById("pipeList");

    if (pipeSegments.length === 0) {
        pipeList.innerHTML = `<div style="font-size:12px;color:var(--muted);text-align:center;padding:12px;">
            Belum ada pipa dibuat
        </div>`;
        return;
    }

    pipeList.innerHTML = '';

    pipeSegments.sort((a, b) => a.start - b.start);

    pipeSegments.forEach((pipe, index) => {
        const item = document.createElement('div');
        item.className = 'pipe-item';

        item.innerHTML = `
            <div class="pipe-info">
                <span class="pipe-segment"><strong>Pipa ${index + 1}</strong></span>
                <span class="pipe-range">Kedalaman: ${pipe.start}m – ${pipe.end}m</span>
                <span class="pipe-diameter">Diameter: ${pipe.diameter}"</span>
            </div>
            <div class="pipe-delete" onclick="hapusPipa(${index})">Hapus</div>
        `;

        pipeList.appendChild(item);
    });
}

function updateOpenHoleInfo() {
    if (!openHole) {
        openHoleInfo.classList.remove('active');
        openHoleStatus.textContent = "Belum diatur";
        openHoleStatus.className = "openhole-status inactive";
        openHoleDetails.innerHTML = `
            <div style="margin-top: 8px;">
                <div style="margin-bottom: 4px;">• Open hole akan ditampilkan di bagian bawah pipa terakhir</div>
                <div>• Pastikan tidak ada saringan di area open hole</div>
                <div style="margin-top: 6px; font-size: 11px; color: #64748b;">
                    <strong>Note:</strong> Open hole otomatis mengambil dari kedalaman input hingga ujung pipa
                </div>
            </div>
        `;
        return;
    }

    openHoleInfo.classList.add('active');
    openHoleStatus.textContent = "Aktif";
    openHoleStatus.className = "openhole-status active";
    
    openHoleDetails.innerHTML = `
        <div class="openhole-item">
            <div class="openhole-info-details">
                <span class="openhole-depth">Mulai: ${openHole.depth} m</span>
                <span class="openhole-description">Ukuran: ${openHole.size.toFixed(1)} m (hingga ${openHole.endDepth}m)</span>
                <span style="font-size: 11px; color: #475569;">
                    Pipa: ${openHole.pipeIndex + 1} (${pipeSegments[openHole.pipeIndex]?.start || 0}m - ${pipeSegments[openHole.pipeIndex]?.end || 0}m)
                </span>
            </div>
            <div class="openhole-delete" onclick="hapusOpenHole()">Hapus</div>
        </div>
    `;
}

// CRUD operations
function hapusPipa(index) {
    const deletedSegment = pipeSegments[index];
    
    // Hapus open hole jika ada di pipa yang dihapus
    if (openHole && openHole.pipeIndex === index) {
        openHole = null;
        updateOpenHoleInfo();
    }
    
    // Update pipeIndex untuk open hole jika perlu
    if (openHole && openHole.pipeIndex > index) {
        openHole.pipeIndex -= 1;
    }
    
    // Hapus saringan yang ada di pipa yang dihapus
    let deletedSaringanCount = 0;
    const deletedSaringanDepths = [];
    
    for (let i = saringanPosisi.length - 1; i >= 0; i--) {
        if (saringanPosisi[i].depth >= deletedSegment.start && 
            saringanPosisi[i].depth <= deletedSegment.end) {
            deletedSaringanDepths.push(saringanPosisi[i].depth);
            saringanPosisi.splice(i, 1);
            deletedSaringanCount++;
        }
    }
    
    pipeSegments.splice(index, 1);
    
    if (pipeSegments.length > 0) {
        // Sesuaikan semua pipa setelah yang dihapus
        for (let i = index; i < pipeSegments.length; i++) {
            if (i === 0) {
                pipeSegments[i].start = 0;
                pipeSegments[i].end = pipeSegments[i].end - pipeSegments[i].start;
            } else {
                const prevSegment = pipeSegments[i - 1];
                const segmentLength = pipeSegments[i].end - pipeSegments[i].start;
                pipeSegments[i].start = prevSegment.end;
                pipeSegments[i].end = pipeSegments[i].start + segmentLength;
            }
        }
        currentDepth = pipeSegments[pipeSegments.length - 1].end;
    } else {
        currentDepth = 0;
        openHole = null;
        updateOpenHoleInfo();
    }
    
    // Validasi ulang semua saringan setelah penghapusan
    let invalidSaringan = 0;
    for (let i = saringanPosisi.length - 1; i >= 0; i--) {
        const saringan = saringanPosisi[i];
        const validation = validateSaringan(saringan.depth, saringan.size);
        
        if (!validation.valid) {
            saringanPosisi.splice(i, 1);
            invalidSaringan++;
        }
    }
    
    if (invalidSaringan > 0) {
        showNotification(`${invalidSaringan} saringan dihapus karena tidak valid setelah penghapusan pipa`, 'warning', 4000);
    }
    
    drawVisualization();
    updatePipeList();
    updateSaringanList();
    
    let notificationMessage = `Segmen pipa ke-${index + 1} berhasil dihapus`;
    if (deletedSaringanCount > 0) {
        notificationMessage += ` (${deletedSaringanCount} saringan ikut terhapus)`;
    }
    showNotification(notificationMessage, 'success', 4000);
}

function addSaringan() {
    if (pipeSegments.length === 0) {
        showNotification("Buat pipa terlebih dahulu dengan mengisi kedalaman dan klik 'Tambah Pipa'", 'warning', 3000);
        return;
    }

    const depth = parseFloat(saringanDepth.value);
    const size = parseFloat(saringanSize.value);

    if (!depth || depth <= 0) {
        showNotification("Masukkan kedalaman saringan yang valid", 'error', 3000);
        return;
    }

    if (!size || size <= 0) {
        showNotification("Masukkan ukuran saringan yang valid", 'error', 3000);
        return;
    }

    // Validasi saringan
    const validation = validateSaringan(depth, size);
    
    if (!validation.valid) {
        let errorMessage = validation.message;
        if (validation.details) {
            errorMessage += `\n${validation.details}`;
        }
        showNotification(errorMessage, 'error', 5000);
        return;
    }

    saringanPosisi.push({ depth, size });
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

function setOpenHole() {
    if (pipeSegments.length === 0) {
        showNotification("Buat pipa terlebih dahulu sebelum mengatur open hole", 'warning', 3000);
        return;
    }

    const depth = parseFloat(openHoleDepth.value);

    if (!depth || depth <= 0) {
        showNotification("Masukkan kedalaman open hole yang valid", 'error', 3000);
        return;
    }

    // Dapatkan pipa terakhir
    const lastPipe = pipeSegments[pipeSegments.length - 1];
    
    // Validasi: Open hole harus di pipa terakhir
    if (depth < lastPipe.start || depth > lastPipe.end) {
        showNotification(`Open hole harus berada di pipa terakhir (${lastPipe.start}m - ${lastPipe.end}m)`, 'error', 3000);
        return;
    }

    // Hitung ukuran open hole (dari depth hingga ujung pipa terakhir)
    const openHoleSize = lastPipe.end - depth;
    
    // Validasi ukuran minimum
    if (openHoleSize < 1) {
        showNotification("Ukuran open hole minimal 1 meter", 'error', 3000);
        return;
    }

    // Cek tabrakan dengan saringan di area open hole
    let saringanBertabrakan = null;
    for (const saringan of saringanPosisi) {
        const saringanTop = saringan.depth - saringan.size / 2;
        const saringanBottom = saringan.depth + saringan.size / 2;
        
        // Cek jika saringan ada di pipa terakhir dan overlap dengan area open hole
        const saringanPipe = pipeSegments.find(p => saringan.depth >= p.start && saringan.depth <= p.end);
        if (saringanPipe && saringanPipe.start === lastPipe.start) {
            if ((saringanBottom > depth) || 
                (saringanTop > depth && saringanTop < lastPipe.end) ||
                (saringanTop <= depth && saringanBottom >= depth)) {
                saringanBertabrakan = saringan;
                break;
            }
        }
    }

    if (saringanBertabrakan) {
        showNotification(`Terdapat saringan di kedalaman ${saringanBertabrakan.depth}m yang bertabrakan dengan open hole`, 'error', 4000);
        return;
    }

    // Set open hole
    openHole = {
        depth: depth,
        startDepth: depth,
        endDepth: lastPipe.end,
        size: openHoleSize,
        pipeIndex: pipeSegments.length - 1
    };

    openHoleDepth.value = '';
    updateOpenHoleInfo();
    drawVisualization();

    showNotification(`Open hole berhasil diatur di kedalaman ${depth}m (ukuran: ${openHoleSize.toFixed(1)}m)`, 'success', 3000);
}

function hapusOpenHole() {
    if (!openHole) return;
    
    openHole = null;
    updateOpenHoleInfo();
    drawVisualization();
    
    showNotification("Open hole berhasil dihapus", 'success', 3000);
}

// Main visualization function
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
        detailInfo.innerHTML = `
            <strong>Instruksi Penggunaan:</strong>
            <div>1. Masukkan kedalaman pipa (misal: 45m)</div>
            <div>2. Klik "Tambah Pipa" untuk membuat pipa</div>
            <div>3. Masukkan kedalaman dan ukuran saringan</div>
            <div>4. Klik "Tambah Saringan" untuk menambah</div>
            <div>5. Atur open hole (opsional) di bagian bawah</div>
            <div>6. Klik "Reset Semua" untuk mulai ulang</div>
        `;
        hoverDetails.innerHTML = "Buat pipa terlebih dahulu";
        return;
    }

    const usableHeight = canvas.height - TOP_MARGIN - BOTTOM_MARGIN;
    const scale = usableHeight / currentDepth;

    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "12px Inter";
    ctx.fillStyle = "#334155";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;

    let lastLabelY = -Infinity;
    const MIN_LABEL_DISTANCE = 25;

    for (let m = 0; m <= currentDepth; m++) {
        const y = TOP_MARGIN + (m * scale);

        ctx.beginPath();
        ctx.moveTo(canvas.width/2 - 15, y);
        ctx.lineTo(canvas.width/2 - 5, y);
        ctx.stroke();

        if (m % SCALE_STEP === 0 && y - lastLabelY > MIN_LABEL_DISTANCE) {
            ctx.fillText(`${m} m`, canvas.width/2 - 60, y + 4);

            ctx.beginPath();
            ctx.moveTo(canvas.width/2 - 25, y);
            ctx.lineTo(canvas.width/2 - 5, y);
            ctx.stroke();

            lastLabelY = y;
        }
    }

    let currentY = TOP_MARGIN;

    // Draw pipe segments
    pipeSegments.forEach((pipe, index) => {
        const segmentDepth = pipe.end - pipe.start;
        const heightPx = segmentDepth * scale;
        const x = canvas.width / 2 - pipe.widthPx / 2;

        drawPipaUtama(x, currentY, pipe.widthPx, heightPx, pipe.end, {
            showTopIndicator: index === 0,
            showBottomIndicator: index === pipeSegments.length - 1
        });

        pipe._render = { x, y: currentY, height: heightPx };
        currentY += heightPx;
    });

    // Draw open hole if exists (HANYA di pipa terakhir)
    if (openHole && pipeSegments.length > 0) {
        const pipeIndex = openHole.pipeIndex || pipeSegments.length - 1;
        const pipe = pipeSegments[pipeIndex];
        
        if (pipe && pipe._render) {
            // Pastikan open hole hanya di pipa terakhir
            if (pipeIndex === pipeSegments.length - 1) {
                // Hitung posisi open hole relatif terhadap pipa
                const localStart = openHole.startDepth - pipe.start;
                const openHoleHeightPx = openHole.size * scale;
                
                // Pastikan open hole dimulai dari posisi yang benar dan mengisi sampai bawah pipa
                const openHoleY = pipe._render.y + (localStart * scale);
                
                drawOpenHole(pipe._render.x, openHoleY, pipe.widthPx, openHoleHeightPx);
            }
        }
    }

    // Draw filters dengan validasi
    saringanPosisi.forEach(saringan => {
        const pipe = pipeSegments.find(p => saringan.depth >= p.start && saringan.depth <= p.end);

        if (!pipe || !pipe._render) return;

        const localDepth = saringan.depth - pipe.start;
        const centerY = pipe._render.y + (localDepth * scale);
        const saringanHeightPx = saringan.size * scale;
        const topY = centerY - saringanHeightPx / 2;
        
        // Validasi apakah saringan keluar dari pipa
        const saringanAtas = saringan.depth - (saringan.size / 2);
        const saringanBawah = saringan.depth + (saringan.size / 2);
        const isOutOfBounds = saringanAtas < pipe.start || saringanBawah > pipe.end;

        drawSaringan(pipe._render.x, topY, pipe.widthPx, saringanHeightPx, saringan.depth, saringan.size, isOutOfBounds);
    });

    // Update detail info
    const saringanDetails = saringanPosisi.length
        ? saringanPosisi
            .sort((a, b) => a.depth - b.depth)
            .map(s => `${s.depth}m (${s.size}m)`)
            .join(', ')
        : '-';

    let openHoleDetail = openHole 
        ? `${openHole.startDepth}m - ${openHole.endDepth}m (${openHole.size.toFixed(1)}m)` 
        : '-';

    // Hitung saringan yang valid
    const validSaringanCount = saringanPosisi.filter(s => {
        const pipe = pipeSegments.find(p => s.depth >= p.start && s.depth <= p.end);
        if (!pipe) return false;
        const saringanAtas = s.depth - (s.size / 2);
        const saringanBawah = s.depth + (s.size / 2);
        return !(saringanAtas < pipe.start || saringanBawah > pipe.end);
    }).length;

    const invalidSaringanCount = saringanPosisi.length - validSaringanCount;

    detailInfo.innerHTML = `
        <strong>Detail Pipa:</strong>
        <div>• Kedalaman total: ${currentDepth} meter</div>
        <div>• Jumlah segmen pipa: ${pipeSegments.length}</div>
        <div>• Jumlah saringan: ${saringanPosisi.length} unit (${validSaringanCount} valid, ${invalidSaringanCount} invalid)</div>
        <div>• Posisi & ukuran saringan: ${saringanDetails}</div>
        <div>• Open hole: ${openHoleDetail}</div>
        <div>• Skala visualisasi: 1 meter = ${scale.toFixed(2)} pixel</div>
    `;
}

function updateVisualization() {
    const depth = parseFloat(depthInput.value);
    const diameterInch = parseFloat(document.getElementById("pipeDiameter").value);

    if (!depth || depth <= 0) {
        showNotification("Masukkan panjang pipa yang valid", "error");
        return;
    }

    if (!diameterInch || diameterInch <= 0) {
        showNotification("Masukkan diameter pipa yang valid", "error");
        return;
    }

    const startDepth = currentDepth;
    const endDepth = startDepth + depth;

    // Update open hole jika ada
    if (openHole) {
        // Jika open hole ada di pipa terakhir sebelumnya, sesuaikan
        if (openHole.pipeIndex === pipeSegments.length - 1) {
            openHole.endDepth = endDepth;
            openHole.size = endDepth - openHole.startDepth;
            updateOpenHoleInfo();
        }
    }

    pipeSegments.push({
        start: startDepth,
        end: endDepth,
        diameter: diameterInch,
        widthPx: diameterInch * inchToPixel
    });

    currentDepth = endDepth;
    drawVisualization();
    updatePipeList();

    depthInput.value = "";
    document.getElementById("pipeDiameter").value = "";

    showNotification(
        `Pipa ${diameterInch}" ditambahkan (${startDepth}m – ${endDepth}m)`,
        "success",
        3000
    );
}

function resetAll() {
    if (currentDepth === 0 && saringanPosisi.length === 0 && !openHole) {
        showNotification("Tidak ada data untuk di-reset", 'info', 2000);
        return;
    }
    
    const confirmReset = confirm("Apakah Anda yakin ingin mereset semua data?");
    if (confirmReset) {
        currentDepth = 0;
        saringanPosisi = [];
        pipeSegments = [];
        openHole = null;
        depthInput.value = "";
        saringanDepth.value = '';
        saringanSize.value = '3';
        openHoleDepth.value = "";
        document.getElementById("pipeDiameter").value = "";
        updateSaringanList();
        updatePipeList();
        updateOpenHoleInfo();
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
    
    setTimeout(() => {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        const imgData = canvas.toDataURL("image/png");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const maxImgWidth = pdfWidth - 40;
        const maxImgHeight = pdfHeight - 120;
        
        const canvasRatio = canvas.width / canvas.height;
        const maxRatio = maxImgWidth / maxImgHeight;
        
        let imgWidth, imgHeight;
        
        if (canvasRatio > maxRatio) {
            imgWidth = maxImgWidth;
            imgHeight = imgWidth / canvasRatio;
        } else {
            imgHeight = maxImgHeight;
            imgWidth = imgHeight * canvasRatio;
        }
        
        imgWidth = Math.min(imgWidth, maxImgWidth);
        imgHeight = Math.min(imgHeight, maxImgHeight);
        
        const x = (pdfWidth - imgWidth) / 2;
        const y = 40;
        
        pdf.setFontSize(16);
        pdf.text("LAPORAN VISUALISASI PIPA", pdfWidth/2, 20, { align: "center" });
        
        pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
        
        let detailY = y + imgHeight + 15;
        
        const detailLines = 7 + (saringanPosisi.length * 1);
        const detailHeight = detailLines * 6;
        
        if (detailY + detailHeight > pdfHeight - 20) {
            pdf.addPage();
            detailY = 20;
        }
        
        pdf.setFontSize(12);
        pdf.text("Detail Teknis:", 20, detailY);
        detailY += 8;
        
        pdf.setFontSize(10);
        pdf.text(`• Kedalaman pipa: ${currentDepth} meter`, 20, detailY);
        detailY += 6;
        pdf.text(`• Jumlah segmen pipa: ${pipeSegments.length}`, 20, detailY);
        detailY += 6;
        pdf.text(`• Jumlah saringan: ${saringanPosisi.length} unit`, 20, detailY);
        detailY += 6;
        
        if (openHole) {
            pdf.text(`• Open hole: ${openHole.startDepth}m - ${openHole.endDepth}m (${openHole.size.toFixed(1)}m)`, 20, detailY);
            detailY += 6;
        }
        
        if (saringanPosisi.length > 0) {
            detailY += 8;
            pdf.text(`• Posisi & ukuran saringan:`, 20, detailY);
            
            saringanPosisi.sort((a,b)=>a.depth - b.depth).forEach(saringan => {
                detailY += 6;
                if (detailY > pdfHeight - 20) {
                    pdf.addPage();
                    detailY = 20;
                }
                
                // Validasi saringan
                const pipe = pipeSegments.find(p => saringan.depth >= p.start && saringan.depth <= p.end);
                const saringanAtas = saringan.depth - (saringan.size / 2);
                const saringanBawah = saringan.depth + (saringan.size / 2);
                const isValid = pipe && !(saringanAtas < pipe.start || saringanBawah > pipe.end);
                
                const status = isValid ? "" : " (INVALID)";
                pdf.text(`  - ${saringan.depth}m (${saringan.size}m)${status}`, 25, detailY);
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
    updateOpenHoleInfo();
});

window.updateVisualization = updateVisualization;
window.addSaringan = addSaringan;
window.setOpenHole = setOpenHole;
window.hapusSaringan = hapusSaringan;
window.hapusPipa = hapusPipa;
window.hapusOpenHole = hapusOpenHole;
window.resetAll = resetAll;
window.downloadPDF = downloadPDF;
