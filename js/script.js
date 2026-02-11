const canvas = document.getElementById("pipeCanvas");
const ctx = canvas.getContext("2d");
const depthInput = document.getElementById("depthInput");
const saringanDepth = document.getElementById("saringanDepth");
const saringanSize = document.getElementById("saringanSize");
const openHoleDepth = document.getElementById("openHoleDepth");
const groundLevelInput = document.getElementById("groundLevelInput");
const matInput = document.getElementById("matInput");
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
let groundLevel = 0;
let groundLevelSet = false;
let matLevel = null; // MAT level (relatif terhadap groundLevel)
let matSet = false;
const inchToPixel = 6;

let notificationTimeout = null;

// Helper function untuk format angka
function formatNumber(num) {
    if (num === null || num === undefined) return "0";
    // Konversi ke string dan hapus trailing zeros
    const str = num.toString();
    // Jika ada desimal, hapus trailing zeros
    if (str.includes('.')) {
        return str.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.$/, '');
    }
    return str;
}

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
        ctx.fillText(`${formatNumber(depth)}m`, x + width/2, y + totalHeight + 15);
    }

    ctx.textAlign = "left";
}

function drawSaringan(x, y, width, height, depth, size) {
    const saringanColor = "#8B5A2B";
    
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, saringanColor);
    gradient.addColorStop(1, darkenColor(saringanColor, 30));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.fill();

    ctx.strokeStyle = darkenColor(saringanColor, 40);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 0.8;

    const lineSpacing = Math.max(4, height / 15);
    for (let i = lineSpacing; i < height - lineSpacing; i += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(x + 8, y + i);
        ctx.lineTo(x + width - 8, y + i);
        ctx.stroke();
    }

    // Teks di pinggir dengan ukuran
    const saringanRightX = x + width;
    const lineStartX = saringanRightX + 2;
    const lineEndX = lineStartX + 20;
    const centerY = y + height / 2;

    // Garis penghubung
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lineStartX, centerY);
    ctx.lineTo(lineEndX, centerY);
    ctx.stroke();

    // Teks dengan range kedalaman
    ctx.fillStyle = "#000000";
    ctx.font = "bold 12px Inter";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    
    const labelText = `Saringan (${formatNumber(size)}m)`;
    ctx.fillText(labelText, lineEndX + 4, centerY);

    // Teks detail kecil
    ctx.fillStyle = "#64748b";
    ctx.font = "10px Inter";
    const saringanEnd = depth + size;
    const detailText = `${formatNumber(depth)} - ${formatNumber(saringanEnd)}m`;
    ctx.fillText(detailText, lineEndX + 4, centerY + 15);

    // Icon kecil di ujung garis
    ctx.fillStyle = "#8B5A2B";
    ctx.beginPath();
    ctx.arc(lineEndX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Update info untuk tooltip
    let info = `Saringan: ${formatNumber(depth)}m - ${formatNumber(saringanEnd)}m (${formatNumber(size)}m)`;
    if (groundLevelSet) {
        const relativeStart = depth - groundLevel;
        const relativeEnd = saringanEnd - groundLevel;
        info += `\nRelatif ke tanah: ${formatNumber(relativeStart)}m - ${formatNumber(relativeEnd)}m`;
    }
    
    components.push({
        type: "saringan",
        x, y, width, height, 
        depth, size,
        start: depth,  // Atas saringan
        end: depth + size,  // Bawah saringan
        info: info
    });
}

function drawOpenHole(x, y, width, height) {
    const openHoleColor = "#10b981";
    
    // Draw main open hole area
    ctx.fillStyle = openHoleColor;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.fill();

    // Dot pattern
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

    // Border dengan warna lebih gelap
    ctx.strokeStyle = "#047857";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner highlight
    ctx.strokeStyle = "#a7f3d0";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);

    // Teks di pinggir
    const lineStartX = x + width;
    const lineEndX = lineStartX + 20;
    const centerY = y + height / 2;
    
    // Garis horizontal
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lineStartX, centerY);
    ctx.lineTo(lineEndX, centerY);
    ctx.stroke();

    // Teks "Open Hole"
    ctx.fillStyle = "#000000";
    ctx.font = "bold 12px Inter";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const labelText = `Open Hole (${formatNumber(openHole.size)}m)`;
    ctx.fillText(labelText, lineEndX + 4, centerY); 

    // Teks detail kecil
    ctx.fillStyle = "#64748b";
    ctx.font = "10px Inter";
    const detailText = `${formatNumber(openHole.startDepth)} - ${formatNumber(openHole.endDepth)}m`;
    ctx.fillText(detailText, lineEndX + 4, centerY + 15);

    // Icon kecil di ujung garis
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(lineEndX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Add to components for mouse interaction
    let info = `Open Hole: ${formatNumber(openHole.startDepth)}m - ${formatNumber(openHole.endDepth)}m (${formatNumber(openHole.size)}m)`;
    if (groundLevelSet) {
        const relativeStart = openHole.startDepth - groundLevel;
        const relativeEnd = openHole.endDepth - groundLevel;
        info += `\nRelatif ke tanah: ${formatNumber(relativeStart)}m - ${formatNumber(relativeEnd)}m`;
    }
    
    components.push({
        type: "openhole",
        x, y, width, height,
        info: info
    });
}

function drawGroundLevelLine(groundY) {
    if (!groundLevelSet) return;
    
    // Gambar garis putus-putus
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, groundY);
    ctx.lineTo(canvas.width - 20, groundY);
    ctx.stroke();
    
    // Reset line dash
    ctx.setLineDash([]);
    
    // Tambah keterangan kedalaman
    ctx.fillStyle = "#92400e";
    ctx.font = "10px Inter";

    const positionText = groundLevel >= 0 ? 
        `${formatNumber(groundLevel)} m dari dasar sistem` : 
        `${formatNumber(Math.abs(groundLevel))} m di atas dasar sistem`;

    ctx.fillText(positionText, 25, groundY + 15);
    
    // Tambah icon
    ctx.font = "14px Inter";
    ctx.fillText("📍", 5, groundY + 5);
}

function drawMATLine(matY) {
    if (!matSet || !groundLevelSet) return;
    
    // Gambar garis gelombang untuk muka air tanah
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    
    const startX = 20;
    const endX = canvas.width - 20;
    const waveLength = 20;
    const amplitude = 3;
    
    ctx.beginPath();
    ctx.moveTo(startX, matY);
    
    for (let x = startX; x <= endX; x += 2) {
        const wave = Math.sin((x - startX) * Math.PI / waveLength) * amplitude;
        ctx.lineTo(x, matY + wave);
    }
    
    ctx.stroke();
    
    // Reset line dash
    ctx.setLineDash([]);
    
    // Tambah icon tetesan air
    drawWaterDropIcon(canvas.width - 30, matY - 10);
    
    // Tambah keterangan kedalaman MAT
    ctx.fillStyle = "#1d4ed8";
    ctx.font = "10px Inter";
    
    // Hitung posisi MAT relatif terhadap ground level
    const matDepthFromGround = matLevel; // Ini sudah dalam meter dari ground
    const absoluteMATDepth = groundLevel + matLevel; // Posisi absolut dalam sistem
    
    let matText = `MAT: ${formatNumber(matDepthFromGround)}m dari tanah`;
    ctx.fillText(matText, 25, matY + 15);
}

function drawWaterDropIcon(x, y) {
    // Gambar ikon tetesan air sederhana
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    
    // Bentuk tetesan air sederhana
    ctx.arc(x, y + 3, 6, Math.PI * 0.8, Math.PI * 2.2);
    ctx.lineTo(x, y + 12);
    ctx.closePath();
    ctx.fill();
    
    // Highlight kecil
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.beginPath();
    ctx.arc(x - 2, y + 2, 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawTotalPipaLabel(totalPipeLength, firstPipeStart, lastPipeEnd, totalPipeY) {
    // Hitung posisi X yang tepat (di sebelah kanan pipa terakhir)
    const pipeSegmentsRightX = canvas.width / 2; // Posisi tengah canvas (karena pipa ada di tengah)
    const pipeMaxWidth = Math.max(...pipeSegments.map(p => p.widthPx)); // Lebar pipa terlebar
    const lastPipeRightX = pipeSegmentsRightX + (pipeMaxWidth / 2); // Posisi kanan pipa
    
    const lineStartX = lastPipeRightX + 2; // Mulai 2px dari kanan pipa
    const lineEndX = lineStartX + 20; // Panjang garis 20px
    
    // Garis horizontal untuk total pipa
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lineStartX, totalPipeY);
    ctx.lineTo(lineEndX, totalPipeY);
    ctx.stroke();
    
    // Teks total pipa
    ctx.fillStyle = "#000000";
    ctx.font = "bold 12px Inter";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    
    const labelX = lineEndX + 4; // 4px setelah garis
    const labelText = `Total Pipa (${formatNumber(totalPipeLength)}m)`;
    ctx.fillText(labelText, labelX, totalPipeY);
    
    // Teks detail kecil
    ctx.fillStyle = "#64748b";
    ctx.font = "10px Inter";
    const detailText = `${formatNumber(firstPipeStart)} - ${formatNumber(lastPipeEnd)}m`;
    ctx.fillText(detailText, labelX, totalPipeY + 15);
    
    // Icon kecil di ujung garis
    ctx.fillStyle = "#374151";
    ctx.beginPath();
    ctx.arc(lineEndX, totalPipeY, 3, 0, Math.PI * 2);
    ctx.fill();
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
        const saringanEnd = saringan.depth + saringan.size;
        
        // Hitung posisi relatif jika ada ground level
        let relativeInfo = '';
        if (groundLevelSet) {
            const relativeStart = saringan.depth - groundLevel;
            const relativeEnd = saringanEnd - groundLevel;
            const startDesc = relativeStart >= 0 ? 'di bawah' : 'di atas';
            const endDesc = relativeEnd >= 0 ? 'di bawah' : 'di atas';
            relativeInfo = `<div style="font-size: 11px; margin-top: 2px; color: #64748b;">
                Relatif: ${formatNumber(Math.abs(relativeStart))}m ${startDesc} s/d ${formatNumber(Math.abs(relativeEnd))}m ${endDesc} tanah
            </div>`;
        }
        
        const item = document.createElement('div');
        item.className = 'saringan-item';
        item.innerHTML = `
            <div class="saringan-info">
                <span class="saringan-depth">Posisi: ${formatNumber(saringan.depth)}m - ${formatNumber(saringanEnd)} m</span>
                <span class="saringan-details">Ukuran: ${formatNumber(saringan.size)} m</span>
                ${relativeInfo}
            </div>
            <div class="saringan-delete" onclick="hapusSaringan(${index})">Hapus</div>
        `;
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
        // Hitung posisi relatif jika ada ground level
        let relativeInfo = '';
        if (groundLevelSet) {
            const relativeStart = pipe.start - groundLevel;
            const relativeEnd = pipe.end - groundLevel;
            const startDesc = relativeStart >= 0 ? 'di bawah' : 'di atas';
            const endDesc = relativeEnd >= 0 ? 'di bawah' : 'di atas';
            relativeInfo = `<div style="font-size: 11px; margin-top: 2px; color: #64748b;">
                Relatif: ${formatNumber(Math.abs(relativeStart))}m ${startDesc} s/d ${formatNumber(Math.abs(relativeEnd))}m ${endDesc} tanah
            </div>`;
        }
        
        const item = document.createElement('div');
        item.className = 'pipe-item';

        item.innerHTML = `
            <div class="pipe-info">
                <span class="pipe-segment"><strong>Pipa ${index + 1}</strong> (${pipe.diameter}")</span>
                <span class="pipe-range">Kedalaman: ${formatNumber(pipe.start)}m – ${formatNumber(pipe.end)}m</span>
                ${relativeInfo}
            </div>
            <div class="pipe-delete" onclick="hapusPipa(${index})">Hapus</div>
        `;

        pipeList.appendChild(item);
    });
}

function updateGroundLevelInfo() {
    const groundLevelInfo = document.getElementById("groundLevelInfo");
    const groundLevelStatus = document.getElementById("groundLevelStatus");
    const groundLevelDetails = document.getElementById("groundLevelDetails");
    
    if (!groundLevelSet) {
        groundLevelInfo.classList.remove('active');
        groundLevelStatus.textContent = "Belum diatur";
        groundLevelStatus.className = "groundlevel-status inactive";
        groundLevelDetails.innerHTML = `
            <div style="margin-top: 8px;">
                <div style="margin-bottom: 4px;">• Titik acuan relatif terhadap sistem koordinat pipa</div>
                <div>• Bisa negatif (di atas pipa) atau positif (di bawah pipa)</div>
                <div>• Contoh: -2.5 = tanah 2.5m di atas ujung atas pipa</div>
            </div>
        `;
        return;
    }
    
    groundLevelInfo.classList.add('active');
    groundLevelStatus.textContent = "Aktif";
    groundLevelStatus.className = "groundlevel-status active";
    
    let positionDesc = "";
    
    if (groundLevel < 0) {
        positionDesc = `<span style="color: #dc2626;">${formatNumber(Math.abs(groundLevel))}m di atas dasar sistem</span>`;
    } else if (groundLevel > 0) {
        positionDesc = `<span style="color: #059669;">${formatNumber(groundLevel)}m di bawah dasar sistem</span>`;
    } else {
        positionDesc = "sama dengan dasar sistem";
    }
    
    // Hitung posisi pipa relatif terhadap tanah
    let pipePositionInfo = "";
    if (pipeSegments.length > 0) {
        const firstPipe = pipeSegments[0];
        const lastPipe = pipeSegments[pipeSegments.length - 1];
        const pipeTopRel = firstPipe.start - groundLevel;
        const pipeBottomRel = lastPipe.end - groundLevel;
        
        pipePositionInfo = `
            <div style="margin-top: 8px; padding: 8px; background: #f8fafc; border-radius: 6px; border-left: 3px solid #3b82f6;">
                <div style="font-size: 11px; font-weight: 600; margin-bottom: 4px;">Posisi Pipa:</div>
                <div style="font-size: 10px; line-height: 1.4;">
                    <div>• Ujung atas: ${formatNumber(pipeTopRel)}m dari tanah ${pipeTopRel >= 0 ? '(di bawah)' : '(di atas)'}</div>
                    <div>• Ujung bawah: ${formatNumber(pipeBottomRel)}m dari tanah ${pipeBottomRel >= 0 ? '(di bawah)' : '(di atas)'}</div>
                </div>
            </div>
        `;
    }
    
    groundLevelDetails.innerHTML = `
        <div style="margin-top: 8px;">
            <div style="margin-bottom: 4px; font-weight: 600;">Titik Acuan: ${formatNumber(groundLevel)} m</div>
            <div style="font-size: 12px; margin-bottom: 8px;">${positionDesc}</div>
            ${pipePositionInfo}
            <button onclick="hapusGroundLevel()" class="btn-secondary" style="margin-top: 10px; padding: 6px 12px; font-size: 12px; width: 100%;">
                Hapus Titik Acuan
            </button>
        </div>
    `;
}

function updateMATInfo() {
    const matInfo = document.getElementById("matInfo");
    const matStatus = document.getElementById("matStatus");
    const matDetails = document.getElementById("matDetails");
    
    if (!matSet) {
        matInfo.classList.remove('active');
        matStatus.textContent = "Belum diatur";
        matStatus.className = "mat-status inactive";
        matDetails.innerHTML = `
            <div style="margin-top: 8px;">
                <div style="margin-bottom: 4px;">• Muka Air Tanah (MAT) relatif terhadap permukaan tanah</div>
                <div>• Nilai positif = di bawah permukaan tanah</div>
                <div>• Nilai negatif = di atas permukaan tanah (artesis)</div>
                <div>• Contoh: 2.5 = MAT 2.5m di bawah permukaan tanah</div>
            </div>
        `;
        return;
    }
    
    matInfo.classList.add('active');
    matStatus.textContent = "Aktif";
    matStatus.className = "mat-status active";
    
    let matDescription = "";
    const absoluteMATDepth = groundLevel + matLevel;
    
    if (matLevel > 0) {
        matDescription = `<span style="color: #1d4ed8;">${formatNumber(matLevel)}m di bawah permukaan tanah</span>`;
    } else if (matLevel < 0) {
        matDescription = `<span style="color: #dc2626;">${formatNumber(Math.abs(matLevel))}m di atas permukaan tanah (artesis)</span>`;
    } else {
        matDescription = "sama dengan permukaan tanah";
    }
    
    // Info relatif terhadap pipa jika ada
    let pipeRelationInfo = "";
    if (pipeSegments.length > 0) {
        const firstPipe = pipeSegments[0];
        const lastPipe = pipeSegments[pipeSegments.length - 1];
        const matRelToPipeTop = absoluteMATDepth - firstPipe.start;
        const matRelToPipeBottom = absoluteMATDepth - lastPipe.end;
        
        pipeRelationInfo = `
            <div style="margin-top: 8px; padding: 8px; background: #eff6ff; border-radius: 6px; border-left: 3px solid #3b82f6;">
                <div style="font-size: 11px; font-weight: 600; margin-bottom: 4px; color: #1d4ed8;">Posisi MAT terhadap Pipa:</div>
                <div style="font-size: 10px; line-height: 1.4; color: #1e40af;">
                    <div>• Dari ujung atas pipa: ${formatNumber(matRelToPipeTop)}m ${matRelToPipeTop >= 0 ? 'di bawah' : 'di atas'}</div>
                    <div>• Dari ujung bawah pipa: ${formatNumber(matRelToPipeBottom)}m ${matRelToPipeBottom >= 0 ? 'di bawah' : 'di atas'}</div>
                </div>
            </div>
        `;
    }
    
    matDetails.innerHTML = `
        <div style="margin-top: 8px;">
            <div style="margin-bottom: 4px; font-weight: 600;">Muka Air Tanah: ${formatNumber(matLevel)} m</div>
            <div style="font-size: 12px; margin-bottom: 8px;">${matDescription}</div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
                Posisi absolut: ${formatNumber(absoluteMATDepth)}m (dalam sistem koordinat)
            </div>
            ${pipeRelationInfo}
            <button onclick="hapusMAT()" class="btn-secondary" style="margin-top: 10px; padding: 6px 12px; font-size: 12px; width: 100%; background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe;">
                Hapus MAT
            </button>
        </div>
    `;
}

function updateOpenHoleInfo() {
    if (!openHole) {
        openHoleInfo.classList.remove('active');
        openHoleStatus.textContent = "Belum diatur";
        openHoleStatus.className = "openhole-status inactive";
        openHoleDetails.innerHTML = `
            <div style="margin-top: 8px;">
                <div style="margin-bottom: 4px;">• Open hole adalah bagian terbuka di bawah pipa terakhir</div>
                <div>• Diukur dari ujung bawah pipa ke atas</div>
                <div>• Pastikan tidak ada saringan di area open hole</div>
            </div>
        `;
        return;
    }

    openHoleInfo.classList.add('active');
    openHoleStatus.textContent = "Aktif";
    openHoleStatus.className = "openhole-status active";
    
    // Hitung posisi relatif jika ada ground level
    let relativeInfo = '';
    if (groundLevelSet) {
        const relativeStart = openHole.startDepth - groundLevel;
        const relativeEnd = openHole.endDepth - groundLevel;
        relativeInfo = `
            <div style="font-size: 11px; margin-top: 4px; color: #64748b;">
                Relatif ke tanah: ${formatNumber(relativeStart)}m - ${formatNumber(relativeEnd)}m
            </div>
        `;
    }
    
    openHoleDetails.innerHTML = `
        <div class="openhole-item">
            <div class="openhole-info-details">
                <span class="openhole-depth">Open Hole: ${formatNumber(openHole.startDepth)}m - ${formatNumber(openHole.endDepth)}m</span>
                <span class="openhole-description">Ukuran: ${formatNumber(openHole.size)}m (di bawah pipa)</span>
                ${relativeInfo}
            </div>
            <div class="openhole-delete" onclick="hapusOpenHole()">Hapus</div>
        </div>
    `;
}

function updateDetailInfo(minDepth, maxDepth) {
    const saringanDetails = saringanPosisi.length
        ? saringanPosisi
            .sort((a, b) => a.depth - b.depth)
            .map(s => {
                const saringanEnd = s.depth + s.size;
                let info = `${formatNumber(s.depth)}m - ${formatNumber(saringanEnd)}m`;
                if (groundLevelSet) {
                    const relStart = s.depth - groundLevel;
                    const relEnd = saringanEnd - groundLevel;
                    info += ` (${formatNumber(relStart)}-${formatNumber(relEnd)}m relatif)`;
                }
                return info;
            })
            .join(', ')
        : '-';

    let openHoleDetail = openHole 
        ? `${formatNumber(openHole.startDepth)}m-${formatNumber(openHole.endDepth)}m` 
        : '-';

    if (openHole && groundLevelSet) {
        const relStart = openHole.startDepth - groundLevel;
        const relEnd = openHole.endDepth - groundLevel;
        openHoleDetail += ` (${formatNumber(relStart)}-${formatNumber(relEnd)}m relatif)`;
    }

    let detailHTML = `<strong>Detail Pipa Sumur Bor:</strong>`;
    
    if (pipeSegments.length > 0) {
        const firstPipe = pipeSegments[0];
        const lastPipe = pipeSegments[pipeSegments.length - 1];
        
        // Hitung total panjang pipa
        const totalPipeLength = pipeSegments.reduce((total, pipe) => {
            return total + (pipe.end - pipe.start);
        }, 0);
        
        detailHTML += `<div>• Sistem koordinat: ${formatNumber(minDepth)}m s/d ${formatNumber(maxDepth)}m</div>`;
        detailHTML += `<div>• Total panjang pipa: ${formatNumber(totalPipeLength)} m</div>`;
        detailHTML += `<div>• Kedalaman total: ${formatNumber(currentDepth)} m</div>`;
        
        if (groundLevelSet) {
            const pipeTopRel = firstPipe.start - groundLevel;
            const pipeBottomRel = lastPipe.end - groundLevel;
            
            detailHTML += `<div>• Pipa relatif ke tanah: ${formatNumber(pipeTopRel)}m s/d ${formatNumber(pipeBottomRel)}m</div>`;
            
            if (pipeTopRel < 0) {
                detailHTML += `<div>• Pipa memanjang ${formatNumber(Math.abs(pipeTopRel))}m di atas tanah</div>`;
            }
        }
    }
    
    if (groundLevelSet) {
        detailHTML += `<div>• Permukaan tanah: ${formatNumber(groundLevel)} m (dalam sistem koordinat)</div>`;
        
        if (groundLevel < 0) {
            detailHTML += `<div>• Tanah berada ${formatNumber(Math.abs(groundLevel))}m di atas dasar sistem</div>`;
        }
    }
    
    if (matSet) {
        const absoluteMATDepth = groundLevel + matLevel;
        detailHTML += `<div>• Muka Air Tanah: ${formatNumber(matLevel)}m dari tanah`;
        detailHTML += ` (${formatNumber(absoluteMATDepth)}m dalam sistem)`;
        if (matLevel > 0) {
            detailHTML += ` - di bawah tanah</div>`;
        } else if (matLevel < 0) {
            detailHTML += ` - di atas tanah (artesis)</div>`;
        } else {
            detailHTML += ` - sama dengan tanah</div>`;
        }
    }
    
    if (pipeSegments.length > 0) {
        detailHTML += `<div>• Jumlah segmen pipa: ${pipeSegments.length}</div>`;
        detailHTML += `<div>• Jumlah saringan: ${saringanPosisi.length} unit</div>`;
        
        if (saringanPosisi.length > 0) {
            detailHTML += `<div>• Posisi saringan: ${saringanDetails}</div>`;
        }
        
        if (openHole) {
            detailHTML += `<div>• Open hole: ${openHoleDetail} (${formatNumber(openHole.size)}m di bawah pipa)</div>`;
        }
    } else {
        detailHTML += `<div>• Belum ada pipa dibuat</div>`;
    }
    
    detailInfo.innerHTML = detailHTML;
}

// CRUD operations
function setGroundLevel() {
    const groundLevelValue = parseFloat(document.getElementById("groundLevelInput").value);
    
    if (isNaN(groundLevelValue)) {
        showNotification("Masukkan titik acuan permukaan tanah yang valid", "error", 3000);
        return;
    }
    
    // Boleh negatif (untuk di atas pipa) atau positif (untuk di bawah pipa)
    if (groundLevelValue < -50 || groundLevelValue > 100) {
        showNotification("Titik acuan antara -50m sampai 100m", "error", 3000);
        return;
    }
    
    groundLevel = groundLevelValue;
    groundLevelSet = true;
    
    // Update tampilan
    updateGroundLevelInfo();
    
    // Gambar ulang visualisasi
    drawVisualization();
    updatePipeList();
    updateSaringanList();
    
    let positionDesc = "";
    if (groundLevel < 0) {
        positionDesc = `${formatNumber(Math.abs(groundLevel))}m di atas dasar sistem`;
    } else if (groundLevel > 0) {
        positionDesc = `${formatNumber(groundLevel)}m di bawah dasar sistem`;
    } else {
        positionDesc = "sama dengan dasar sistem";
    }
    
    showNotification(`Titik acuan permukaan tanah ditetapkan: ${formatNumber(groundLevel)}m (${positionDesc})`, "success", 4000);
}

function hapusGroundLevel() {
    if (!groundLevelSet) return;
    
    groundLevel = 0;
    groundLevelSet = false;
    // Jika ground level dihapus, MAT juga harus dihapus
    if (matSet) {
        matLevel = null;
        matSet = false;
        updateMATInfo();
    }
    updateGroundLevelInfo();
    drawVisualization();
    
    showNotification("Titik acuan permukaan tanah berhasil dihapus", "success", 3000);
}

function setMAT() {
    if (!groundLevelSet) {
        showNotification("Atur titik acuan permukaan tanah terlebih dahulu", "warning", 3000);
        return;
    }
    
    const matValue = parseFloat(matInput.value);
    
    if (isNaN(matValue)) {
        showNotification("Masukkan level muka air tanah yang valid", "error", 3000);
        return;
    }
    
    // MAT bisa negatif (artesis) atau positif
    if (matValue < -20 || matValue > 100) {
        showNotification("MAT antara -20m sampai 100m dari permukaan tanah", "error", 3000);
        return;
    }
    
    matLevel = matValue;
    matSet = true;
    
    // Update tampilan
    updateMATInfo();
    
    // Gambar ulang visualisasi
    drawVisualization();
    
    let matDesc = "";
    const absoluteMATDepth = groundLevel + matLevel;
    
    if (matLevel > 0) {
        matDesc = `${formatNumber(matLevel)}m di bawah permukaan tanah`;
    } else if (matLevel < 0) {
        matDesc = `${formatNumber(Math.abs(matLevel))}m di atas permukaan tanah (artesis)`;
    } else {
        matDesc = "sama dengan permukaan tanah";
    }
    
    showNotification(`Muka Air Tanah ditetapkan: ${formatNumber(matLevel)}m dari tanah (${matDesc})`, "success", 4000);
}

function hapusMAT() {
    if (!matSet) return;
    
    matLevel = null;
    matSet = false;
    updateMATInfo();
    drawVisualization();
    
    showNotification("Muka Air Tanah berhasil dihapus", "success", 3000);
}

function hapusPipa(index) {
    const deletedSegment = pipeSegments[index];
    
    let deletedSaringanCount = 0;
    const deletedSaringanDepths = [];
    
    for (let i = saringanPosisi.length - 1; i >= 0; i--) {
        const saringanEnd = saringanPosisi[i].depth + saringanPosisi[i].size;
        if (saringanPosisi[i].depth >= deletedSegment.start && 
            saringanEnd <= deletedSegment.end) {
            deletedSaringanDepths.push(saringanPosisi[i].depth);
            saringanPosisi.splice(i, 1);
            deletedSaringanCount++;
        }
    }
    
    pipeSegments.splice(index, 1);
    
    if (pipeSegments.length > 0) {
        // Recalculate segment positions
        let currentStart = pipeSegments[0].start;
        for (let i = 0; i < pipeSegments.length; i++) {
            const segmentLength = pipeSegments[i].end - pipeSegments[i].start;
            pipeSegments[i].start = currentStart;
            pipeSegments[i].end = currentStart + segmentLength;
            currentStart = pipeSegments[i].end;
        }
        currentDepth = pipeSegments[pipeSegments.length - 1].end;
    } else {
        currentDepth = 0;
        openHole = null;
        updateOpenHoleInfo();
    }
    
    drawVisualization();
    updatePipeList();
    updateSaringanList();
    
    let notificationMessage = `Segmen pipa ke-${index + 1} berhasil dihapus`;
    if (deletedSaringanCount > 0) {
        notificationMessage += ` (${deletedSaringanCount} saringan ikut terhapus: ${deletedSaringanDepths.map(d => `${formatNumber(d)}m`).join(', ')})`;
    }
    showNotification(notificationMessage, 'success', 4000);
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

    // Hitung startDepth
    let startDepth;
    if (pipeSegments.length === 0) {
        // Pipa pertama dimulai dari 0 dalam sistem koordinat
        startDepth = 0;
    } else {
        // Pipa berikutnya lanjut dari pipa terakhir
        startDepth = currentDepth;
    }
    
    const endDepth = startDepth + depth;

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

    // Tampilkan notifikasi dengan info posisi relatif
    let message = `Pipa ${diameterInch}" ditambahkan: ${formatNumber(startDepth)}m – ${formatNumber(endDepth)}m`;
    if (groundLevelSet) {
        const pipeTopRel = startDepth - groundLevel;
        const pipeBottomRel = endDepth - groundLevel;
        message += `\n(Posisi relatif: ${formatNumber(pipeTopRel)}m s/d ${formatNumber(pipeBottomRel)}m dari tanah)`;
    }
    showNotification(message, "success", 4000);
}

function addSaringan() {
    if (pipeSegments.length === 0) {
        showNotification("Buat pipa terlebih dahulu dengan mengisi kedalaman dan klik 'Tambah Pipa'", 'warning', 3000);
        return;
    }

    const depth = parseFloat(saringanDepth.value);  // Sekarang ini akan menjadi ATAS saringan
    const size = parseFloat(saringanSize.value);

    // Validasi menggunakan sistem koordinat pipa
    if (!depth || depth < 0 || depth > currentDepth) {
        showNotification(`Masukkan kedalaman yang valid (0-${formatNumber(currentDepth)}m dalam sistem)`, 'error', 3000);
        return;
    }

    if (!size || size <= 0 || size > currentDepth) {
        showNotification(`Masukkan ukuran saringan yang valid (0.1-${formatNumber(currentDepth)}m)`, 'error', 3000);
        return;
    }

    // Hitung batas atas dan bawah saringan
    const saringanStart = depth;  // Atas saringan = kedalaman input
    const saringanEnd = depth + size;  // Bawah saringan = atas + ukuran

    // Cari pipa yang mengandung seluruh rentang saringan ini
    const pipe = pipeSegments.find(p => saringanStart >= p.start && saringanEnd <= p.end);

    if (!pipe) {
        showNotification(`Saringan berada di luar pipa! Pastikan saringan (${formatNumber(saringanStart)}m - ${formatNumber(saringanEnd)}m) berada dalam pipa`, 'error', 3000);
        return;
    }

    // Cek tabrakan dengan saringan lain
    for (const existingSaringan of saringanPosisi) {
        const existingStart = existingSaringan.depth;  // Sudah atas saringan
        const existingEnd = existingSaringan.depth + existingSaringan.size;

        if ((saringanStart >= existingStart && saringanStart <= existingEnd) ||
            (saringanEnd >= existingStart && saringanEnd <= existingEnd) ||
            (saringanStart <= existingStart && saringanEnd >= existingEnd)) {
            showNotification(`Saringan tumpang tindih dengan saringan di kedalaman ${formatNumber(existingSaringan.depth)}m`, 'error', 4000);
            return;
        }
    }

    // Cek tabrakan dengan open hole
    if (openHole) {
        // Open hole berada di BAWAH pipa, jadi cek jika saringan terlalu dekat ke bawah
        const safetyMargin = 2; // Margin aman 2 meter
        if (saringanEnd > (openHole.startDepth - safetyMargin)) {
            showNotification(`Saringan terlalu dekat dengan open hole. Open hole mulai dari ${formatNumber(openHole.startDepth)}m`, 'error', 4000);
            return;
        }
    }

    // Simpan dengan posisi ATAS saringan
    saringanPosisi.push({ depth, size });  // depth sekarang = atas saringan
    saringanDepth.value = '';
    saringanSize.value = '3';

    updateSaringanList();
    drawVisualization();

    // Tampilkan notifikasi dengan info posisi relatif
    let message = `Saringan berhasil ditambahkan: ${formatNumber(saringanStart)}m - ${formatNumber(saringanEnd)}m (ukuran: ${formatNumber(size)}m)`;
    if (groundLevelSet) {
        const relativeStart = depth - groundLevel;
        const relativeEnd = saringanEnd - groundLevel;
        message += `\n(Posisi relatif terhadap tanah: ${formatNumber(relativeStart)}m s/d ${formatNumber(relativeEnd)}m)`;
    }
    showNotification(message, 'success', 4000);
}

function hapusSaringan(index) {
    const saringan = saringanPosisi[index];
    const saringanEnd = saringan.depth + saringan.size;
    saringanPosisi.splice(index, 1);
    updateSaringanList();
    drawVisualization();
    showNotification(`Saringan di posisi ${formatNumber(saringan.depth)}m - ${formatNumber(saringanEnd)}m berhasil dihapus`, 'success', 3000);
}

function setOpenHole() {
    if (pipeSegments.length === 0) {
        showNotification("Buat pipa terlebih dahulu sebelum mengatur open hole", 'warning', 3000);
        return;
    }

    const depth = parseFloat(openHoleDepth.value);

    // VALIDASI BARU: Open hole harus positif dan tidak terlalu besar
    if (!depth || depth <= 0) {
        showNotification("Masukkan ukuran open hole yang valid (angka positif dalam meter)", 'error', 3000);
        return;
    }

    // Open hole dihitung dari BATAS BAWAH pipa
    const pipeBottom = currentDepth; // Ini adalah ujung bawah pipa
    const openHoleStartDepth = pipeBottom; // Open hole mulai dari ujung pipa
    const openHoleEndDepth = pipeBottom + depth; // Berakhir setelah ukuran tertentu

    // Cek apakah ada saringan yang bertabrakan dengan open hole
    for (const saringan of saringanPosisi) {
        const saringanEnd = saringan.depth + saringan.size;
        
        // Cek jika saringan berada di area open hole
        if (saringanEnd >= openHoleStartDepth) {
            showNotification(`Terdapat saringan di posisi ${formatNumber(saringan.depth)}m - ${formatNumber(saringanEnd)}m yang bertabrakan dengan open hole`, 'error', 4000);
            return;
        }
    }

    // Pastikan open hole tidak melebihi batas wajar (misal 100m dari pipa)
    if (depth > 100) {
        showNotification("Open hole terlalu besar! Maksimal 100m dari ujung pipa", 'warning', 3000);
        return;
    }

    openHole = {
        depth: depth, // Ukuran open hole
        startDepth: openHoleStartDepth, // Mulai dari ujung pipa
        endDepth: openHoleEndDepth, // Berakhir setelah depth meter
        size: depth // Ukuran open hole
    };

    openHoleDepth.value = '';
    updateOpenHoleInfo();
    drawVisualization();

    // Notifikasi dengan informasi yang jelas
    let message = `Open hole berhasil diatur: ${formatNumber(depth)}m di bawah ujung pipa`;
    message += `\nPosisi: ${formatNumber(openHoleStartDepth)}m - ${formatNumber(openHoleEndDepth)}m`;
    
    if (groundLevelSet) {
        const relativeStart = openHole.startDepth - groundLevel;
        const relativeEnd = openHole.endDepth - groundLevel;
        message += `\n(Posisi relatif terhadap tanah: ${formatNumber(relativeStart)}m s/d ${formatNumber(relativeEnd)}m)`;
    }
    
    showNotification(message, 'success', 4000);
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

    // Hitung depth maksimum untuk scaling
    let maxDepthInSystem = currentDepth;
    let minDepthInSystem = 0;
    
    // Tambahkan open hole ke perhitungan jika ada
    if (openHole) {
        maxDepthInSystem = Math.max(maxDepthInSystem, openHole.endDepth);
    }
    
    if (groundLevelSet) {
        maxDepthInSystem = Math.max(maxDepthInSystem, groundLevel);
        minDepthInSystem = Math.min(0, groundLevel);
        
        if (matSet) {
            const absoluteMATDepth = groundLevel + matLevel;
            maxDepthInSystem = Math.max(maxDepthInSystem, absoluteMATDepth);
            minDepthInSystem = Math.min(minDepthInSystem, absoluteMATDepth);
        }
        
        if (groundLevel < 0) {
            minDepthInSystem = groundLevel;
        }
    }
    
    const totalDepthRange = maxDepthInSystem - minDepthInSystem;
    
    canvas.height = Math.max(
        MIN_CANVAS_HEIGHT,
        (totalDepthRange / 100) * EXTRA_HEIGHT_PER_100M + 300
    );

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentDepth === 0 && !groundLevelSet && !matSet) {
        detailInfo.innerHTML = `
            <strong>Instruksi Penggunaan:</strong>
            <div>1. Masukkan kedalaman pipa (misal: 45m)</div>
            <div>2. Atur titik acuan permukaan tanah (jika ada)</div>
            <div>3. Atur muka air tanah (MAT) jika diketahui</div>
            <div>4. Klik "Tambah Pipa" untuk membuat pipa</div>
            <div>5. Masukkan kedalaman dan ukuran saringan</div>
            <div>6. Klik "Tambah Saringan" untuk menambah</div>
            <div>7. Atur open hole (opsional) di bagian bawah</div>
            <div>8. Klik "Reset Semua" untuk mulai ulang</div>
        `;
        hoverDetails.innerHTML = "Buat pipa terlebih dahulu";
        return;
    }

    const usableHeight = canvas.height - TOP_MARGIN - BOTTOM_MARGIN;
    const scale = usableHeight / totalDepthRange;

    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw MAT line jika ada
    if (matSet && groundLevelSet) {
        const absoluteMATDepth = groundLevel + matLevel;
        const matY = TOP_MARGIN + (absoluteMATDepth - minDepthInSystem) * scale;
        drawMATLine(matY);
    }

    // Draw ground level line - posisi berdasarkan groundLevel
    if (groundLevelSet) {
        const groundY = TOP_MARGIN + (groundLevel - minDepthInSystem) * scale;
        drawGroundLevelLine(groundY);
    }

    ctx.setLineDash([]);
    ctx.font = "12px Inter";
    ctx.fillStyle = "#334155";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;

    let lastLabelY = -Infinity;
    const MIN_LABEL_DISTANCE = 25;

    // Draw depth markers
    for (let m = Math.floor(minDepthInSystem); m <= Math.ceil(maxDepthInSystem); m++) {
        const y = TOP_MARGIN + (m - minDepthInSystem) * scale;

        ctx.beginPath();
        ctx.moveTo(canvas.width/2 - 15, y);
        ctx.lineTo(canvas.width/2 - 5, y);
        ctx.stroke();

        if (m % SCALE_STEP === 0 && y - lastLabelY > MIN_LABEL_DISTANCE) {
            let label = `${formatNumber(m)}m`;
            ctx.fillStyle = "#334155";
            ctx.fillText(label, canvas.width/2 - 60, y + 4);

            ctx.beginPath();
            ctx.moveTo(canvas.width/2 - 25, y);
            ctx.lineTo(canvas.width/2 - 5, y);
            ctx.stroke();

            lastLabelY = y;
        }
    }

    // Draw pipe segments jika ada
    if (pipeSegments.length > 0) {
        // HITUNG TOTAL PANJANG SEMUA PIPAA
        const totalPipeLength = pipeSegments.reduce((total, pipe) => {
            return total + (pipe.end - pipe.start);
        }, 0);
        
        const firstPipeStart = pipeSegments[0].start;
        const lastPipeEnd = pipeSegments[pipeSegments.length - 1].end;
        
        // Tentukan posisi untuk label total pipa (di tengah-tengah rentang pipa)
        const totalPipeCenter = (firstPipeStart + lastPipeEnd) / 2;
        const totalPipeY = TOP_MARGIN + (totalPipeCenter - minDepthInSystem) * scale;
        
        // Gambar label total pipa
        drawTotalPipaLabel(totalPipeLength, firstPipeStart, lastPipeEnd, totalPipeY);

        // Gambar semua segmen pipa (TANPA label per segmen)
        pipeSegments.forEach((pipe, index) => {
            const segmentHeight = pipe.end - pipe.start;
            const y = TOP_MARGIN + (pipe.start - minDepthInSystem) * scale;
            const heightPx = segmentHeight * scale;
            const x = canvas.width / 2 - pipe.widthPx / 2;

            // Tentukan apakah perlu indikator khusus
            const showTopIndicator = index === 0;
            const showBottomIndicator = index === pipeSegments.length - 1;

            drawPipaUtama(x, y, pipe.widthPx, heightPx, pipe.end, {
                showTopIndicator,
                showBottomIndicator,
                pipeStart: pipe.start
            });

            // Simpan info untuk interaksi
            pipe._render = { 
                x, 
                y, 
                height: heightPx,
                start: pipe.start,
                end: pipe.end
            };
            
            // Tambah ke components untuk tooltip
            const pipeSize = pipe.end - pipe.start;
            let pipeInfo = `Pipa ${pipe.diameter}" - ${formatNumber(pipe.start)}m s/d ${formatNumber(pipe.end)}m (${formatNumber(pipeSize)}m)`;
            if (groundLevelSet) {
                const relativeStart = pipe.start - groundLevel;
                const relativeEnd = pipe.end - groundLevel;
                pipeInfo += `\nRelatif: ${formatNumber(relativeStart)}m s/d ${formatNumber(relativeEnd)}m dari tanah`;
            }
            
            components.push({
                type: "pipe",
                x, y, width: pipe.widthPx, height: heightPx,
                info: pipeInfo
            });
        });

        // Draw open hole if exists - DI BAWAH pipa terakhir
        if (openHole && pipeSegments.length > 0) {
            const openHoleStartY = TOP_MARGIN + (openHole.startDepth - minDepthInSystem) * scale;
            const openHoleHeightPx = openHole.size * scale;
            const lastPipe = pipeSegments[pipeSegments.length - 1];
            
            drawOpenHole(lastPipe._render.x, openHoleStartY, lastPipe.widthPx, openHoleHeightPx);
        }

        // Draw filters
        saringanPosisi.forEach(saringan => {
            const pipe = pipeSegments.find(p => {
                const saringanEnd = saringan.depth + saringan.size;
                return saringan.depth >= p.start && saringanEnd <= p.end;
            });

            if (!pipe || !pipe._render) return;

            const topY = TOP_MARGIN + (saringan.depth - minDepthInSystem) * scale;
            const saringanHeightPx = saringan.size * scale;

            drawSaringan(pipe._render.x, topY, pipe.widthPx, saringanHeightPx, saringan.depth, saringan.size);
        });
    }

    // Update detail info
    updateDetailInfo(minDepthInSystem, maxDepthInSystem);
}

function resetAll() {
    if (currentDepth === 0 && saringanPosisi.length === 0 && !openHole && !groundLevelSet && !matSet) {
        showNotification("Tidak ada data untuk di-reset", 'info', 2000);
        return;
    }
    
    const confirmReset = confirm("Apakah Anda yakin ingin mereset semua data?");
    if (confirmReset) {
        currentDepth = 0;
        saringanPosisi = [];
        pipeSegments = [];
        openHole = null;
        groundLevel = 0;
        groundLevelSet = false;
        matLevel = null;
        matSet = false;
        depthInput.value = "";
        saringanDepth.value = '';
        saringanSize.value = '3';
        openHoleDepth.value = "";
        groundLevelInput.value = "";
        matInput.value = "";
        document.getElementById("pipeDiameter").value = "";
        updateSaringanList();
        updatePipeList();
        updateOpenHoleInfo();
        updateGroundLevelInfo();
        updateMATInfo();
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
        tooltip.innerHTML = foundComponent.info.replace(/\n/g, '<br>');
        tooltip.style.opacity = 1;
        
        hoverDetails.innerHTML = `
            <div><strong>${foundComponent.type.toUpperCase()}</strong></div>
            <div style="font-size: 11px;"><small>${foundComponent.info.split('\n')[0]}</small></div>
        `;
    } else {
        // Hitung posisi dalam sistem koordinat
        const usableHeight = canvas.height - TOP_MARGIN - BOTTOM_MARGIN;
        
        // Tentukan minDepth berdasarkan apakah ada ground level
        let minDepth = 0;
        let maxDepth = currentDepth;
        
        // Tambahkan open hole ke perhitungan
        if (openHole) {
            maxDepth = Math.max(maxDepth, openHole.endDepth);
        }
        
        if (groundLevelSet) {
            minDepth = Math.min(0, groundLevel);
            maxDepth = Math.max(maxDepth, groundLevel);
            
            // Tambahkan MAT ke perhitungan
            if (matSet) {
                const absoluteMATDepth = groundLevel + matLevel;
                maxDepth = Math.max(maxDepth, absoluteMATDepth);
                minDepth = Math.min(minDepth, absoluteMATDepth);
            }
        }
        
        const totalDepthRange = maxDepth - minDepth;
        const scale = totalDepthRange > 0 ? usableHeight / totalDepthRange : 0;
        
        if (mouseY >= TOP_MARGIN && mouseY <= canvas.height - BOTTOM_MARGIN) {
            const depthInSystem = minDepth + ((mouseY - TOP_MARGIN) / scale);
            
            let infoText = `<div><strong>POSISI</strong></div>`;
            infoText += `<div style="font-size: 11px;"><small>Sistem koordinat: ${formatNumber(depthInSystem)} m</small></div>`;
            
            if (groundLevelSet) {
                const relativeToGround = depthInSystem - groundLevel;
                infoText += `<div style="font-size: 11px;"><small>Relatif ke tanah: ${formatNumber(relativeToGround)} m</small></div>`;
                
                // Cek apakah posisi dekat dengan tanah
                if (Math.abs(depthInSystem - groundLevel) < 0.5) {
                    infoText += `<div style="font-size: 11px; color: #d97706;"><small>Tepat di permukaan tanah</small></div>`;
                } 
                // Cek apakah posisi dekat dengan MAT
                else if (matSet && Math.abs(depthInSystem - (groundLevel + matLevel)) < 0.5) {
                    infoText += `<div style="font-size: 11px; color: #3b82f6;"><small>Tepat di Muka Air Tanah (MAT)</small></div>`;
                }
                else if (depthInSystem < groundLevel) {
                    infoText += `<div style="font-size: 11px; color: #dc2626;"><small>${formatNumber(Math.abs(relativeToGround))} m di atas permukaan tanah</small></div>`;
                } else {
                    infoText += `<div style="font-size: 11px; color: #059669;"><small>${formatNumber(relativeToGround)} m di bawah permukaan tanah</small></div>`;
                }
                
                // Info posisi relatif terhadap MAT jika ada
                if (matSet) {
                    const relativeToMAT = depthInSystem - (groundLevel + matLevel);
                    if (Math.abs(relativeToMAT) > 0.5) { // Hanya tampilkan jika tidak tepat di MAT
                        if (relativeToMAT > 0) {
                            infoText += `<div style="font-size: 11px; color: #1e40af;"><small>${formatNumber(relativeToMAT)} m di bawah MAT</small></div>`;
                        } else {
                            infoText += `<div style="font-size: 11px; color: #60a5fa;"><small>${formatNumber(Math.abs(relativeToMAT))} m di atas MAT</small></div>`;
                        }
                    }
                }
            }
            
            hoverDetails.innerHTML = infoText;
        } else {
            hoverDetails.innerHTML = "Arahkan mouse ke area visualisasi";
        }
        tooltip.style.opacity = 0;
    }
});

function downloadPDF() {
    if (currentDepth === 0 && !groundLevelSet && !matSet) {
        showNotification("Buat pipa atau atur titik acuan terlebih dahulu sebelum download PDF", 'warning', 3000);
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
        pdf.text("LAPORAN VISUALISASI PIPA SUMUR BOR", pdfWidth/2, 20, { align: "center" });
        
        pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
        
        let detailY = y + imgHeight + 15;
        
        // Hitung berapa banyak baris yang akan ditampilkan
        let lineCount = 5;
        if (groundLevelSet) lineCount += 2;
        if (matSet) lineCount += 1;
        if (pipeSegments.length > 0) lineCount += 2;
        if (saringanPosisi.length > 0) lineCount += 1;
        if (openHole) lineCount += 1;
        
        const detailHeight = lineCount * 6;
        
        if (detailY + detailHeight > pdfHeight - 20) {
            pdf.addPage();
            detailY = 20;
        }
        
        pdf.setFontSize(12);
        pdf.text("Detail Teknis:", 20, detailY);
        detailY += 8;
        
        pdf.setFontSize(10);
        
        if (pipeSegments.length > 0) {
            // Hitung total panjang pipa untuk PDF
            const totalPipeLength = pipeSegments.reduce((total, pipe) => {
                return total + (pipe.end - pipe.start);
            }, 0);
            
            pdf.text(`• Total panjang pipa: ${formatNumber(totalPipeLength)} m`, 20, detailY);
            detailY += 6;
            pdf.text(`• Kedalaman total: ${formatNumber(currentDepth)} m`, 20, detailY);
            detailY += 6;
        }
        
        if (groundLevelSet) {
            pdf.text(`• Permukaan tanah: ${formatNumber(groundLevel)} m (dalam sistem koordinat)`, 20, detailY);
            detailY += 6;
            
            if (groundLevel < 0) {
                pdf.text(`• Tanah ${formatNumber(Math.abs(groundLevel))}m di atas dasar sistem`, 20, detailY);
                detailY += 6;
            }
            
            // Info posisi relatif pipa
            if (pipeSegments.length > 0) {
                const firstPipe = pipeSegments[0];
                const lastPipe = pipeSegments[pipeSegments.length - 1];
                const pipeTopRel = firstPipe.start - groundLevel;
                const pipeBottomRel = lastPipe.end - groundLevel;
                
                pdf.text(`• Pipa relatif ke tanah: ${formatNumber(pipeTopRel)}m s/d ${formatNumber(pipeBottomRel)}m`, 20, detailY);
                detailY += 6;
            }
        }
        
        if (matSet) {
            const absoluteMATDepth = groundLevel + matLevel;
            let matText = `• Muka Air Tanah: ${formatNumber(matLevel)}m dari tanah`;
            if (matLevel > 0) {
                matText += ` (${formatNumber(absoluteMATDepth)}m dalam sistem, di bawah tanah)`;
            } else if (matLevel < 0) {
                matText += ` (${formatNumber(absoluteMATDepth)}m dalam sistem, di atas tanah - artesis)`;
            } else {
                matText += ` (sama dengan permukaan tanah)`;
            }
            pdf.text(matText, 20, detailY);
            detailY += 6;
        }
        
        if (pipeSegments.length > 0) {
            pdf.text(`• Jumlah segmen pipa: ${pipeSegments.length}`, 20, detailY);
            detailY += 6;
            pdf.text(`• Jumlah saringan: ${saringanPosisi.length} unit`, 20, detailY);
            detailY += 6;
            
            if (openHole) {
                pdf.text(`• Open hole: ${formatNumber(openHole.startDepth)}m - ${formatNumber(openHole.endDepth)}m (${formatNumber(openHole.size)}m di bawah pipa)`, 20, detailY);
                detailY += 6;
                
                if (groundLevelSet) {
                    const relStart = openHole.startDepth - groundLevel;
                    const relEnd = openHole.endDepth - groundLevel;
                    pdf.text(`  (${formatNumber(relStart)}m - ${formatNumber(relEnd)}m relatif ke tanah)`, 25, detailY);
                    detailY += 6;
                }
            }
            
            if (saringanPosisi.length > 0) {
                detailY += 4;
                pdf.text(`• Posisi saringan:`, 20, detailY);
                
                saringanPosisi.sort((a,b)=>a.depth - b.depth).forEach(saringan => {
                    detailY += 6;
                    if (detailY > pdfHeight - 20) {
                        pdf.addPage();
                        detailY = 20;
                    }
                    const saringanEnd = saringan.depth + saringan.size;
                    let saringanInfo = `  - ${formatNumber(saringan.depth)}m - ${formatNumber(saringanEnd)}m (ukuran: ${formatNumber(saringan.size)}m)`;
                    if (groundLevelSet) {
                        const relStart = saringan.depth - groundLevel;
                        const relEnd = saringanEnd - groundLevel;
                        saringanInfo += ` - ${formatNumber(relStart)}-${formatNumber(relEnd)}m dari tanah`;
                    }
                    pdf.text(saringanInfo, 25, detailY);
                });
            }
        }
        
        pdf.save("visualisasi_pipa_sumur_bor.pdf");
        
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
    updateGroundLevelInfo();
    updateMATInfo();
    updateOpenHoleInfo();
});

// Export functions to global scope
window.updateVisualization = updateVisualization;
window.addSaringan = addSaringan;
window.setOpenHole = setOpenHole;
window.setGroundLevel = setGroundLevel;
window.setMAT = setMAT;
window.hapusGroundLevel = hapusGroundLevel;
window.hapusMAT = hapusMAT;
window.hapusSaringan = hapusSaringan;
window.hapusPipa = hapusPipa;
window.hapusOpenHole = hapusOpenHole;
window.resetAll = resetAll;
window.downloadPDF = downloadPDF;
window.closeNotification = closeNotification;
