import { useState } from 'react';
import { Diagram } from './Diagram';
import { formatNumber, pipeBottom } from '../model';

export default function VisualizationPage({ model, setModel, canvasRef, notify }) {
  const [depth, setDepth] = useState('');
  const [diameter, setDiameter] = useState('6');
  const [saringanDepth, setSaringanDepth] = useState('');
  const [saringanSize, setSaringanSize] = useState('3');
  const [openHoleDepth, setOpenHoleDepth] = useState('');
  const [groundLevel, setGroundLevel] = useState('');
  const [matLevel, setMatLevel] = useState('');
  const [saringanError, setSaringanError] = useState('');

  const bottom = pipeBottom(model);

  const addPipe = (event) => {
    event.preventDefault();
    const value = Number(depth);
    const inch = Number(diameter);
    if (!Number.isFinite(value) || value <= 0) return notify('Masukkan kedalaman pipa yang valid', 'warning');
    if (!Number.isFinite(inch) || inch <= 0 || inch > 24) return notify('Diameter pipa tidak valid', 'warning');
    const start = bottom;
    setModel((current) => ({
      ...current,
      openHole: null,
      pipes: [...current.pipes, {
        id: `pipe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        start,
        end: start + value,
        depth: value,
        diameter: inch,
      }],
    }));
    setDepth('');
    notify(`Pipa ${formatNumber(inch)} inch ditambahkan`, 'success');
  };

  const deletePipe = (id) => {
    setModel((current) => {
      const remaining = current.pipes.filter((pipe) => pipe.id !== id);
      let cursor = 0;
      const pipes = remaining.map((pipe) => {
        const start = cursor;
        cursor += pipe.depth;
        return { ...pipe, start, end: start + pipe.depth };
      });
      const newBottom = pipes.length ? pipes[pipes.length - 1].end : 0;
      return {
        ...current,
        pipes,
        screens: current.screens.filter((screen) => screen.depth + screen.size <= newBottom),
        openHole: current.openHole && current.openHole.start <= newBottom ? current.openHole : null,
      };
    });
    notify('Pipa dihapus', 'success');
  };

  const setGround = (event) => {
    event.preventDefault();
    const value = Number(groundLevel);
    if (!Number.isFinite(value)) return notify('Masukkan nilai titik acuan yang valid', 'warning');
    setModel((current) => ({ ...current, ground: value }));
    setGroundLevel('');
    notify('Titik acuan permukaan tanah diatur', 'success');
  };

  const setMat = (event) => {
    event.preventDefault();
    if (model.ground === null) return notify('Atur titik acuan permukaan tanah terlebih dahulu', 'warning');
    const value = Number(matLevel);
    if (!Number.isFinite(value)) return notify('Masukkan nilai MAT yang valid', 'warning');
    setModel((current) => ({ ...current, mat: value }));
    setMatLevel('');
    notify('Muka air tanah (MAT) diatur', 'success');
  };

  const addSaringan = (event) => {
    event.preventDefault();
    const start = Number(saringanDepth);
    const size = Number(saringanSize);
    if (!Number.isFinite(start) || !Number.isFinite(size) || size <= 0) {
      setSaringanError('Masukkan data saringan yang valid');
      return notify('Masukkan data saringan yang valid', 'warning');
    }
    if (start < 0 || start + size > bottom) {
      setSaringanError('Kedalaman saringan melebihi panjang pipa. Batas pipa: ' + formatNumber(bottom) + ' m');
      return notify('Kedalaman saringan melebihi batas pipa', 'warning');
    }
    // Cek tumpang tindih dengan saringan lain
    const newEnd = start + size;
    for (const screen of model.screens) {
      const screenEnd = screen.depth + screen.size;
      // Tumpang tindih jika rentang tumpang
      if (newEnd > screen.depth && start < screenEnd) {
        setSaringanError('Saringan tumpang tindih dengan saringan di ' + formatNumber(screen.depth) + '-' + formatNumber(screenEnd) + ' m');
        return notify('Saringan tumpang tindih dengan saringan lain', 'warning');
      }
    }
    setSaringanError('');
    setModel((current) => ({
      ...current,
      screens: [...current.screens, {
        id: `screen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        depth: start,
        size,
      }],
    }));
    setSaringanDepth('');
    notify('Saringan ditambahkan', 'success');
  };

  const deleteSaringan = (id) => {
    setModel((current) => ({ ...current, screens: current.screens.filter((screen) => screen.id !== id) }));
    notify('Saringan dihapus', 'success');
  };

  const setOpenHole = (event) => {
    event.preventDefault();
    const size = Number(openHoleDepth);
    if (!Number.isFinite(size) || size <= 0) return notify('Masukkan panjang open hole yang valid', 'warning');
    setModel((current) => ({ ...current, openHole: { start: bottom, end: bottom + size, size } }));
    setOpenHoleDepth('');
    notify('Open hole diatur', 'success');
  };

  const clearGround = () => {
    setModel((current) => ({ ...current, ground: null, mat: null }));
    notify('Titik acuan dihapus', 'success');
  };

  const clearMat = () => setModel((current) => ({ ...current, mat: null }));
  const clearOpenHole = () => setModel((current) => ({ ...current, openHole: null }));

  return (
    <div className="card">
      <div className="header">
        <div>
          <h1>Visualisasi Pipa Sumur Bor</h1>
          <p>Visualisasi pipa dengan titik acuan permukaan tanah, saringan, dan open hole</p>
        </div>
      </div>

      <div className="content">
        {/* PANEL KIRI — INPUT */}
        <div className="panel">
          <form onSubmit={addPipe}>
            <label>1. Kedalaman Pipa (meter)</label>
            <div className="input-group">
              <input type="number" step="0.1" placeholder="Contoh: 45" value={depth} onChange={(e) => setDepth(e.target.value)} />
              <span className="unit">m</span>
            </div>

            <label style={{ marginTop: 18 }}>2. Diameter Pipa</label>
            <div className="input-group">
              <input type="number" step="0.5" min="0.5" value={diameter} onChange={(e) => setDiameter(e.target.value)} />
              <span className="unit">inch</span>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: 18, width: '100%' }}>➕ Tambah Pipa</button>
          </form>

          <div className="pipe-list">
            {model.pipes.length === 0
              ? <p style={{ color: 'var(--muted)', fontSize: 13 }}>Belum ada pipa dibuat</p>
              : model.pipes.map((pipe, index) => (
                <div className="pipe-item" key={pipe.id}>
                  <div className="pipe-info">
                    <div className="pipe-segment">🔵 Pipa {index + 1}</div>
                    <span>{formatNumber(pipe.start)} – {formatNumber(pipe.end)} m · {formatNumber(pipe.diameter)} inch</span>
                  </div>
                  <button type="button" className="pipe-delete" onClick={() => deletePipe(pipe.id)}>🗑 Hapus</button>
                </div>
              ))}
          </div>

          <form onSubmit={setGround}>
            <label style={{ marginTop: 22 }}>3. Titik Acuan Permukaan Tanah</label>
            <div className="input-group">
              <input type="number" step="0.1" placeholder="Contoh: 2.5" value={groundLevel} onChange={(e) => setGroundLevel(e.target.value)} />
              <span className="unit">m</span>
            </div>
            <p className="input-hint">Ketinggian titik acuan dari titik nol (permukaan tanah aktual)</p>
            <button type="submit" className="btn-secondary" style={{ marginTop: 14, width: '100%' }}>➕ Atur Titik Acuan</button>
          </form>

          <div className={`groundlevel-info ${model.ground !== null ? 'active' : ''}`}>
            <strong>Permukaan Tanah</strong>
            <div style={{ marginTop: 8 }}>
              <span className={`groundlevel-status ${model.ground !== null ? 'active' : 'inactive'}`}>
                {model.ground !== null ? 'Sudah diatur' : 'Belum diatur'}
              </span>
              {model.ground !== null && <button type="button" className="btn-danger" style={{ padding: '6px 12px', fontSize: 12, marginLeft: 8 }} onClick={clearGround}>Hapus</button>}
            </div>
            {model.ground !== null && <p style={{ marginTop: 8, color: 'var(--muted)' }}>Nilai: {formatNumber(model.ground)} m</p>}
          </div>

          <form onSubmit={setMat}>
            <label style={{ marginTop: 22 }}>4. Muka Air Tanah (MAT)</label>
            <div className="input-group">
              <input type="number" step="0.1" placeholder="Contoh: 5" value={matLevel} onChange={(e) => setMatLevel(e.target.value)} />
              <span className="unit">m</span>
            </div>
            <p className="input-hint">Level muka air tanah relatif terhadap titik acuan</p>
            <button type="submit" className="btn-secondary" style={{ marginTop: 14, width: '100%' }}>➕ Atur Muka Air Tanah</button>
          </form>

          <div className={`mat-info ${model.mat !== null ? 'active' : ''}`}>
            <strong>Muka Air Tanah (MAT)</strong>
            <div style={{ marginTop: 8 }}>
              <span className={`mat-status ${model.mat !== null ? 'active' : 'inactive'}`}>
                {model.mat !== null ? 'Sudah diatur' : 'Belum diatur'}
              </span>
              {model.mat !== null && <button type="button" className="btn-danger" style={{ padding: '6px 12px', fontSize: 12, marginLeft: 8 }} onClick={clearMat}>Hapus</button>}
            </div>
            {model.mat !== null && <p style={{ marginTop: 8, color: 'var(--muted)' }}>Nilai: {formatNumber(model.mat)} m dari muka tanah</p>}
          </div>

          <form onSubmit={addSaringan} style={{ marginTop: 22 }}>
            <label>5. Tambah Saringan</label>
            <div className="input-group">
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)' }}>Kedalaman (m)</label>
                <input type="number" step="0.1" placeholder="Contoh: 15" value={saringanDepth} onChange={(e) => setSaringanDepth(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)' }}>Ukuran (m)</label>
                <input type="number" step="0.1" value={saringanSize} onChange={(e) => setSaringanSize(e.target.value)} />
              </div>
            </div>
            <p className="input-hint" style={{ color: 'var(--danger)', marginTop: 6, fontSize: 12 }}>
              {saringanError}
            </p>
            <button type="submit" className="btn-secondary" style={{ marginTop: 14, width: '100%' }}>➕ Tambah Saringan</button>
          </form>

          <div className="saringan-list">
            {model.screens.length === 0
              ? <p style={{ color: 'var(--muted)', fontSize: 13 }}>Belum ada saringan ditambahkan</p>
              : model.screens.map((screen, index) => (
                <div className="saringan-item" key={screen.id}>
                  <div className="saringan-info">
                    <div className="saringan-depth">🔲 Saringan {index + 1}</div>
                    <span>{formatNumber(screen.depth)} – {formatNumber(screen.depth + screen.size)} m</span>
                  </div>
                  <button type="button" className="saringan-delete" onClick={() => deleteSaringan(screen.id)}>🗑 Hapus</button>
                </div>
              ))}
          </div>

          <form onSubmit={setOpenHole} style={{ marginTop: 22 }}>
            <label>6. Open Hole (opsional)</label>
            <div className="input-group">
              <input type="number" step="0.1" placeholder="Contoh: 5" value={openHoleDepth} onChange={(e) => setOpenHoleDepth(e.target.value)} />
              <span className="unit">m</span>
            </div>
            <p className="input-hint"><strong>Penjelasan:</strong> Open hole adalah bagian terbuka di bawah pipa terakhir. Contoh: 5m = open hole sepanjang 5m di bawah pipa terakhir</p>
            <button type="submit" className="btn-secondary" style={{ marginTop: 14, width: '100%' }}>➕ Set Open Hole</button>
          </form>

          <div className={`openhole-info ${model.openHole ? 'active' : ''}`}>
            <strong>Open Hole</strong>
            <div style={{ marginTop: 8 }}>
              <span className={`openhole-status ${model.openHole ? 'active' : 'inactive'}`}>
                {model.openHole ? 'Sudah diatur' : 'Belum diatur'}
              </span>
              {model.openHole && <button type="button" className="btn-danger" style={{ padding: '6px 12px', fontSize: 12, marginLeft: 8 }} onClick={clearOpenHole}>Hapus</button>}
            </div>
            {model.openHole && <p style={{ marginTop: 8, color: 'var(--muted)' }}>{formatNumber(model.openHole.start)} – {formatNumber(model.openHole.end)} m</p>}
          </div>
        </div>

        {/* PANEL KANAN — CANVAS */}
        <div className="visual-card">
          <Diagram ref={canvasRef} model={model} />
        </div>
      </div>
    </div>
  );
}
