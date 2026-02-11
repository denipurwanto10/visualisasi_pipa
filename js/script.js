const canvas = document.getElementById("pipeCanvas");
const ctx = canvas.getContext("2d");
const depthInput = document.getElementById("depthInput");
const saringanDepth = document.getElementById("saringanDepth");
const saringanSize = document.getElementById("saringanSize");
const openHoleDepth = document.getElementById("openHoleDepth");
const groundLevelInput = document.getElementById("groundLevelInput");
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
    
    const labelText = `Saringan (${size.toFixed(1)}m)`;
    ctx.fillText(labelText, lineEndX + 4, centerY);

    // Teks detail kecil
    ctx.fillStyle = "#64748b";
    ctx.font = "10px Inter";
    const detailText = `${depth.toFixed(1)} - ${(depth + size).toFixed(1)}m`;
    ctx.fillText(detailText, lineEndX + 4, centerY + 15);

    // Icon kecil di ujung garis
    ctx.fillStyle = "#8B5A2B";
    ctx.beginPath();
    ctx.arc(lineEndX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Update info untuk tooltip
    const saringanEnd = depth + size;
    let info = `Saringan: ${depth.toFixed(1)}m - ${saringanEnd.toFixed(1)}m (${size.toFixed(1)}m)`;
    if (groundLevelSet) {
        const relativeStart = depth - groundLevel;
        const relativeEnd = saringanEnd - groundLevel;
        info += `\nRelatif ke tanah: ${relativeStart.toFixed(1)}m - ${relativeEnd.toFixed(1)}m`;
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
    ctx.fillText("Open Hole", lineEndX + 4, centerY);

    // Icon kecil di ujung garis
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(lineEndX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Add to components for mouse interaction
    let info = `Open Hole: ${openHole.startDepth.toFixed(1)}m - ${openHole.endDepth.toFixed(1)}m (${openHole.size.toFixed(1)}m)`;
    if (groundLevelSet) {
        const relativeStart = openHole.startDepth - groundLevel;
        const relativeEnd = openHole.endDepth - groundLevel;
        info += `\nRelatif ke tanah: ${relativeStart.toFixed(1)}m - ${relativeEnd.toFixed(1)}m`;
    }
    
    components.push({
        type: "openhole",
        x, y, width, height,
        info: info
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
        // Tampilkan hanya kedalaman meter saja
        ctx.fillText(`${depth.toFixed(1)}m`, x + width/2, y + totalHeight + 15);
    }

    ctx.textAlign = "left";
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
    
    // Tambah label "Permukaan Tanah"
    ctx.fillStyle = "#d97706";
    ctx.font = "bold 12px Inter";
    ctx.textAlign = "left";
    ctx.fillText("Permukaan Tanah", 25, groundY - 8);
    
    // Tambah keterangan kedalaman
    ctx.fillStyle = "#92400e";
    ctx.font = "10px Inter";
    const positionText = groundLevel >= 0 ? 
        `${groundLevel.toFixed(1)}m dari dasar sistem` : 
        `${Math.abs(groundLevel).toFixed(1)}m di atas dasar sistem`;
    ctx.fillText(positionText, 25, groundY + 15);
    
    // Tambah icon
    ctx.font = "14px Inter";
    ctx.fillText("📍", 5, groundY + 5);
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
                Relatif: ${Math.abs(relativeStart).toFixed(1)}m ${startDesc} s/d ${Math.abs(relativeEnd).toFixed(1)}m ${endDesc} tanah
            </div>`;
        }
        
        const item = document.createElement('div');
        item.className = 'saringan-item';
        item.innerHTML = `
            <div class="saringan-info">
                <span class="saringan-depth">Posisi: ${saringan.depth.toFixed(1)}m - ${saringanEnd.toFixed(1)} m</span>
                <span class="saringan-details">Ukuran: ${saringan.size.toFixed(1)} m</span>
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
                Relatif: ${Math.abs(relativeStart).toFixed(1)}m ${startDesc} s/d ${Math.abs(relativeEnd).toFixed(1)}m ${endDesc} tanah
            </div>`;
        }
        
        const item = document.createElement('div');
        item.className = 'pipe-item';

        item.innerHTML = `
            <div class="pipe-info">
                <span class="pipe-segment"><strong>Pipa ${index + 1}</strong> (${pipe.diameter}")</span>
                <span class="pipe-range">Kedalaman: ${pipe.start.toFixed(1)}m – ${pipe.end.toFixed(1)}m</span>
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
        positionDesc = `<span style="color: #dc2626;">${Math.abs(groundLevel).toFixed(1)}m di atas dasar sistem</span>`;
    } else if (groundLevel > 0) {
        positionDesc = `<span style="color: #059669;">${groundLevel.toFixed(1)}m di bawah dasar sistem</span>`;
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
                    <div>• Ujung atas: ${pipeTopRel.toFixed(1)}m dari tanah ${pipeTopRel >= 0 ? '(di bawah)' : '(di atas)'}</div>
                    <div>• Ujung bawah: ${pipeBottomRel.toFixed(1)}m dari tanah ${pipeBottomRel >= 0 ? '(di bawah)' : '(di atas)'}</div>
                </div>
            </div>
        `;
    }
    
    groundLevelDetails.innerHTML = `
        <div style="margin-top: 8px;">
            <div style="margin-bottom: 4px; font-weight: 600;">Titik Acuan: ${groundLevel.toFixed(1)} m</div>
            <div style="font-size: 12px; margin-bottom: 8px;">${positionDesc}</div>
            ${pipePositionInfo}
            <button onclick="hapusGroundLevel()" class="btn-secondary" style="margin-top: 10px; padding: 6px 12px; font-size: 12px; width: 100%;">
                Hapus Titik Acuan
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
                <div style="margin-bottom: 4px;">• Open hole akan ditampilkan di bagian bawah pipa</div>
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
                Relatif ke tanah: ${relativeStart.toFixed(1)}m - ${relativeEnd.toFixed(1)}m
            </div>
        `;
    }
    
    openHoleDetails.innerHTML = `
        <div class="openhole-item">
            <div class="openhole-info-details">
                <span class="openhole-depth">Open Hole: ${openHole.startDepth.toFixed(1)}m - ${openHole.endDepth.toFixed(1)}m</span>
                <span class="openhole-description">Ukuran: ${openHole.size.toFixed(1)}m</span>
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
                let info = `${s.depth}m - ${saringanEnd}m`;
                if (groundLevelSet) {
                    const relStart = s.depth - groundLevel;
                    const relEnd = saringanEnd - groundLevel;
                    info += ` (${relStart.toFixed(1)}-${relEnd.toFixed(1)}m relatif)`;
                }
                return info;
            })
            .join(', ')
        : '-';

    let openHoleDetail = openHole 
        ? `${openHole.startDepth}m-${openHole.endDepth}m` 
        : '-';

    if (openHole && groundLevelSet) {
        const relStart = openHole.startDepth - groundLevel;
        const relEnd = openHole.endDepth - groundLevel;
        openHoleDetail += ` (${relStart.toFixed(1)}-${relEnd.toFixed(1)}m relatif)`;
    }

    let detailHTML = `<strong>Detail Pipa Sumur Bor:</strong>`;
    
    if (pipeSegments.length > 0) {
        const firstPipe = pipeSegments[0];
        const lastPipe = pipeSegments[pipeSegments.length - 1];
        
        detailHTML += `<div>• Sistem koordinat: ${minDepth.toFixed(1)}m s/d ${maxDepth.toFixed(1)}m</div>`;
        detailHTML += `<div>• Kedalaman total pipa: ${currentDepth} m</div>`;
        
        if (groundLevelSet) {
            const pipeTopRel = firstPipe.start - groundLevel;
            const pipeBottomRel = lastPipe.end - groundLevel;
            
            detailHTML += `<div>• Pipa relatif ke tanah: ${pipeTopRel.toFixed(1)}m s/d ${pipeBottomRel.toFixed(1)}m</div>`;
            
            if (pipeTopRel < 0) {
                detailHTML += `<div>• Pipa memanjang ${Math.abs(pipeTopRel).toFixed(1)}m di atas tanah</div>`;
            }
        }
    }
    
    if (groundLevelSet) {
        detailHTML += `<div>• Permukaan tanah: ${groundLevel} m (dalam sistem koordinat)</div>`;
        
        if (groundLevel < 0) {
            detailHTML += `<div>• Tanah berada ${Math.abs(groundLevel).toFixed(1)}m di atas dasar sistem</div>`;
        }
    }
    
    if (pipeSegments.length > 0) {
        detailHTML += `<div>• Jumlah segmen pipa: ${pipeSegments.length}</div>`;
        detailHTML += `<div>• Jumlah saringan: ${saringanPosisi.length} unit</div>`;
        
        if (saringanPosisi.length > 0) {
            detailHTML += `<div>• Posisi saringan: ${saringanDetails}</div>`;
        }
        
        if (openHole) {
            detailHTML += `<div>• Open hole: ${openHoleDetail}</div>`;
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
        positionDesc = `${Math.abs(groundLevel).toFixed(1)}m di atas dasar sistem`;
    } else if (groundLevel > 0) {
        positionDesc = `${groundLevel.toFixed(1)}m di bawah dasar sistem`;
    } else {
        positionDesc = "sama dengan dasar sistem";
    }
    
    showNotification(`Titik acuan permukaan tanah ditetapkan: ${groundLevel}m (${positionDesc})`, "success", 4000);
}

function hapusGroundLevel() {
    if (!groundLevelSet) return;
    
    groundLevel = 0;
    groundLevelSet = false;
    updateGroundLevelInfo();
    drawVisualization();
    
    showNotification("Titik acuan permukaan tanah berhasil dihapus", "success", 3000);
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
        notificationMessage += ` (${deletedSaringanCount} saringan ikut terhapus: ${deletedSaringanDepths.map(d => `${d}m`).join(', ')})`;
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
    let message = `Pipa ${diameterInch}" ditambahkan: ${startDepth}m – ${endDepth}m`;
    if (groundLevelSet) {
        const pipeTopRel = startDepth - groundLevel;
        const pipeBottomRel = endDepth - groundLevel;
        message += `\n(Posisi relatif: ${pipeTopRel.toFixed(1)}m s/d ${pipeBottomRel.toFixed(1)}m dari tanah)`;
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
        showNotification(`Masukkan kedalaman yang valid (0-${currentDepth}m dalam sistem)`, 'error', 3000);
        return;
    }

    if (!size || size <= 0 || size > currentDepth) {
        showNotification(`Masukkan ukuran saringan yang valid (0.1-${currentDepth}m)`, 'error', 3000);
        return;
    }

    // Hitung batas atas dan bawah saringan
    const saringanStart = depth;  // Atas saringan = kedalaman input
    const saringanEnd = depth + size;  // Bawah saringan = atas + ukuran

    // Cari pipa yang mengandung seluruh rentang saringan ini
    const pipe = pipeSegments.find(p => saringanStart >= p.start && saringanEnd <= p.end);

    if (!pipe) {
        showNotification(`Saringan berada di luar pipa! Pastikan saringan (${saringanStart}m - ${saringanEnd}m) berada dalam pipa`, 'error', 3000);
        return;
    }

    // Cek tabrakan dengan saringan lain
    for (const existingSaringan of saringanPosisi) {
        const existingStart = existingSaringan.depth;  // Sudah atas saringan
        const existingEnd = existingSaringan.depth + existingSaringan.size;

        if ((saringanStart >= existingStart && saringanStart <= existingEnd) ||
            (saringanEnd >= existingStart && saringanEnd <= existingEnd) ||
            (saringanStart <= existingStart && saringanEnd >= existingEnd)) {
            showNotification(`Saringan tumpang tindih dengan saringan di kedalaman ${existingSaringan.depth}m`, 'error', 4000);
            return;
        }
    }

    // Cek tabrakan dengan open hole
    if (openHole) {
        if (saringanEnd >= openHole.startDepth) {
            showNotification(`Saringan terlalu dekat dengan open hole (open hole mulai dari ${openHole.startDepth}m)`, 'error', 4000);
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
    let message = `Saringan berhasil ditambahkan: ${saringanStart}m - ${saringanEnd}m (ukuran: ${size}m)`;
    if (groundLevelSet) {
        const relativeStart = depth - groundLevel;
        const relativeEnd = saringanEnd - groundLevel;
        message += `\n(Posisi relatif terhadap tanah: ${relativeStart.toFixed(1)}m s/d ${relativeEnd.toFixed(1)}m)`;
    }
    showNotification(message, 'success', 4000);
}

function hapusSaringan(index) {
    const saringan = saringanPosisi[index];
    const saringanEnd = saringan.depth + saringan.size;
    saringanPosisi.splice(index, 1);
    updateSaringanList();
    drawVisualization();
    showNotification(`Saringan di posisi ${saringan.depth}m - ${saringanEnd}m berhasil dihapus`, 'success', 3000);
}

function setOpenHole() {
    if (pipeSegments.length === 0) {
        showNotification("Buat pipa terlebih dahulu sebelum mengatur open hole", 'warning', 3000);
        return;
    }

    const depth = parseFloat(openHoleDepth.value);

    // Validasi dalam sistem koordinat pipa
    if (!depth || depth < 0 || depth > currentDepth) {
        showNotification(`Masukkan kedalaman open hole yang valid (0-${currentDepth}m dalam sistem)`, 'error', 3000);
        return;
    }

    // Pastikan tidak ada saringan di area open hole
    const openHoleStart = depth;
    for (const saringan of saringanPosisi) {
        const saringanEnd = saringan.depth + saringan.size;
        
        if (saringanEnd >= openHoleStart) {
            showNotification(`Terdapat saringan di posisi ${saringan.depth}m - ${saringanEnd}m yang bertabrakan dengan open hole`, 'error', 4000);
            return;
        }
    }

    openHole = {
        depth: depth,
        startDepth: depth,
        endDepth: currentDepth,
        size: currentDepth - depth
    };

    openHoleDepth.value = '';
    updateOpenHoleInfo();
    drawVisualization();

    // Tampilkan notifikasi dengan info posisi relatif
    let message = `Open hole berhasil diatur di kedalaman ${depth}m - ${currentDepth}m (${currentDepth - depth}m)`;
    if (groundLevelSet) {
        const relativeStart = depth - groundLevel;
        const relativeEnd = currentDepth - groundLevel;
        message += `\n(Posisi relatif terhadap tanah: ${relativeStart.toFixed(1)}m s/d ${relativeEnd.toFixed(1)}m)`;
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
    // Sekarang perlu mempertimbangkan posisi ground level dan pipa
    let maxDepthInSystem = currentDepth;
    let minDepthInSystem = 0;
    
    if (groundLevelSet) {
        // Tentukan range yang perlu ditampilkan
        maxDepthInSystem = Math.max(currentDepth, groundLevel);
        minDepthInSystem = Math.min(0, groundLevel);
        
        // Jika ada pipa di atas ground level, perlu ruang negatif
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

    if (currentDepth === 0 && !groundLevelSet) {
        detailInfo.innerHTML = `
            <strong>Instruksi Penggunaan:</strong>
            <div>1. Masukkan kedalaman pipa (misal: 45m)</div>
            <div>2. Atur titik acuan permukaan tanah (jika ada)</div>
            <div>3. Klik "Tambah Pipa" untuk membuat pipa</div>
            <div>4. Masukkan kedalaman dan ukuran saringan</div>
            <div>5. Klik "Tambah Saringan" untuk menambah</div>
            <div>6. Atur open hole (opsional) di bagian bawah</div>
            <div>7. Klik "Reset Semua" untuk mulai ulang</div>
        `;
        hoverDetails.innerHTML = "Buat pipa terlebih dahulu";
        return;
    }

    const usableHeight = canvas.height - TOP_MARGIN - BOTTOM_MARGIN;
    const scale = usableHeight / totalDepthRange;

    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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

    // Draw depth markers - sekarang dengan range negatif jika ada
    for (let m = Math.floor(minDepthInSystem); m <= Math.ceil(maxDepthInSystem); m++) {
        const y = TOP_MARGIN + (m - minDepthInSystem) * scale;

        // Gambar marker di kiri
        ctx.beginPath();
        ctx.moveTo(canvas.width/2 - 15, y);
        ctx.lineTo(canvas.width/2 - 5, y);
        ctx.stroke();

        // Label setiap SCALE_STEP
        if (m % SCALE_STEP === 0 && y - lastLabelY > MIN_LABEL_DISTANCE) {
            let label = `${m}m`;
            if (groundLevelSet && m === Math.round(groundLevel)) {
                label = "Tanah";
            }
            
            ctx.fillStyle = "#334155";
            ctx.fillText(label, canvas.width/2 - 60, y + 4);

            // Garis lebih panjang untuk major markers
            ctx.beginPath();
            ctx.moveTo(canvas.width/2 - 25, y);
            ctx.lineTo(canvas.width/2 - 5, y);
            ctx.stroke();

            lastLabelY = y;
        }
    }

    // Draw pipe segments jika ada
    if (pipeSegments.length > 0) {
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
                showBottomIndicator
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
            let pipeInfo = `Pipa ${pipe.diameter}" - ${pipe.start.toFixed(1)}m s/d ${pipe.end.toFixed(1)}m`;
            if (groundLevelSet) {
                const relativeStart = pipe.start - groundLevel;
                const relativeEnd = pipe.end - groundLevel;
                pipeInfo += `\nRelatif: ${relativeStart.toFixed(1)}m s/d ${relativeEnd.toFixed(1)}m dari tanah`;
            }
            
            components.push({
                type: "pipe",
                x, y, width: pipe.widthPx, height: heightPx,
                info: pipeInfo
            });
        });

        // Draw open hole if exists
        if (openHole && pipeSegments.length > 0) {
            const openHoleStartY = TOP_MARGIN + (openHole.startDepth - minDepthInSystem) * scale;
            const openHoleHeightPx = openHole.size * scale;
            const lastPipe = pipeSegments[pipeSegments.length - 1];
            
            drawOpenHole(lastPipe._render.x, openHoleStartY, lastPipe.widthPx, openHoleHeightPx);
        }

        // Draw filters - sekarang menggunakan ATAS saringan sebagai referensi
        saringanPosisi.forEach(saringan => {
            const pipe = pipeSegments.find(p => {
                const saringanEnd = saringan.depth + saringan.size;
                return saringan.depth >= p.start && saringanEnd <= p.end;
            });

            if (!pipe || !pipe._render) return;

            const topY = TOP_MARGIN + (saringan.depth - minDepthInSystem) * scale;  // ATAS saringan
            const saringanHeightPx = saringan.size * scale;  // Tinggi berdasarkan ukuran

            drawSaringan(pipe._render.x, topY, pipe.widthPx, saringanHeightPx, saringan.depth, saringan.size);
        });
    }

    // Update detail info
    updateDetailInfo(minDepthInSystem, maxDepthInSystem);
}

function resetAll() {
    if (currentDepth === 0 && saringanPosisi.length === 0 && !openHole && !groundLevelSet) {
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
        depthInput.value = "";
        saringanDepth.value = '';
        saringanSize.value = '3';
        openHoleDepth.value = "";
        groundLevelInput.value = "";
        document.getElementById("pipeDiameter").value = "";
        updateSaringanList();
        updatePipeList();
        updateOpenHoleInfo();
        updateGroundLevelInfo();
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
        if (groundLevelSet) {
            minDepth = Math.min(0, groundLevel);
            maxDepth = Math.max(currentDepth, groundLevel);
        }
        const totalDepthRange = maxDepth - minDepth;
        const scale = totalDepthRange > 0 ? usableHeight / totalDepthRange : 0;
        
        if (mouseY >= TOP_MARGIN && mouseY <= canvas.height - BOTTOM_MARGIN) {
            const depthInSystem = minDepth + ((mouseY - TOP_MARGIN) / scale);
            
            let infoText = `<div><strong>POSISI</strong></div>`;
            infoText += `<div style="font-size: 11px;"><small>Sistem koordinat: ${depthInSystem.toFixed(1)} m</small></div>`;
            
            if (groundLevelSet) {
                const relativeToGround = depthInSystem - groundLevel;
                infoText += `<div style="font-size: 11px;"><small>Relatif ke tanah: ${relativeToGround.toFixed(1)} m</small></div>`;
                
                if (Math.abs(depthInSystem - groundLevel) < 0.5) {
                    infoText += `<div style="font-size: 11px; color: #d97706;"><small>Tepat di permukaan tanah</small></div>`;
                } else if (depthInSystem < groundLevel) {
                    infoText += `<div style="font-size: 11px; color: #dc2626;"><small>${Math.abs(relativeToGround).toFixed(1)} m di atas permukaan tanah</small></div>`;
                } else {
                    infoText += `<div style="font-size: 11px; color: #059669;"><small>${relativeToGround.toFixed(1)} m di bawah permukaan tanah</small></div>`;
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
    if (currentDepth === 0 && !groundLevelSet) {
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
            pdf.text(`• Kedalaman total pipa: ${currentDepth} m`, 20, detailY);
            detailY += 6;
        }
        
        if (groundLevelSet) {
            pdf.text(`• Permukaan tanah: ${groundLevel} m (dalam sistem koordinat)`, 20, detailY);
            detailY += 6;
            
            if (groundLevel < 0) {
                pdf.text(`• Tanah ${Math.abs(groundLevel).toFixed(1)}m di atas dasar sistem`, 20, detailY);
                detailY += 6;
            }
            
            // Info posisi relatif pipa
            if (pipeSegments.length > 0) {
                const firstPipe = pipeSegments[0];
                const lastPipe = pipeSegments[pipeSegments.length - 1];
                const pipeTopRel = firstPipe.start - groundLevel;
                const pipeBottomRel = lastPipe.end - groundLevel;
                
                pdf.text(`• Pipa relatif ke tanah: ${pipeTopRel.toFixed(1)}m s/d ${pipeBottomRel.toFixed(1)}m`, 20, detailY);
                detailY += 6;
            }
        }
        
        if (pipeSegments.length > 0) {
            pdf.text(`• Jumlah segmen pipa: ${pipeSegments.length}`, 20, detailY);
            detailY += 6;
            pdf.text(`• Jumlah saringan: ${saringanPosisi.length} unit`, 20, detailY);
            detailY += 6;
            
            if (openHole) {
                pdf.text(`• Open hole: ${openHole.startDepth}m - ${openHole.endDepth}m`, 20, detailY);
                detailY += 6;
                
                if (groundLevelSet) {
                    const relStart = openHole.startDepth - groundLevel;
                    const relEnd = openHole.endDepth - groundLevel;
                    pdf.text(`  (${relStart.toFixed(1)}m - ${relEnd.toFixed(1)}m relatif ke tanah)`, 25, detailY);
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
                    let saringanInfo = `  - ${saringan.depth.toFixed(1)}m - ${saringanEnd.toFixed(1)}m (ukuran: ${saringan.size.toFixed(1)}m)`;
                    if (groundLevelSet) {
                        const relStart = saringan.depth - groundLevel;
                        const relEnd = saringanEnd - groundLevel;
                        saringanInfo += ` - ${relStart.toFixed(1)}-${relEnd.toFixed(1)}m dari tanah`;
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
    updateOpenHoleInfo();
});

// Export functions to global scope
window.updateVisualization = updateVisualization;
window.addSaringan = addSaringan;
window.setOpenHole = setOpenHole;
window.setGroundLevel = setGroundLevel;
window.hapusGroundLevel = hapusGroundLevel;
window.hapusSaringan = hapusSaringan;
window.hapusPipa = hapusPipa;
window.hapusOpenHole = hapusOpenHole;
window.resetAll = resetAll;
window.downloadPDF = downloadPDF;
window.closeNotification = closeNotification;
