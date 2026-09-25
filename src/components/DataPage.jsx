import { PROVINCES } from '../model';
import { readImageFile } from '../hooks';

const inputFields = [
  { key: 'companyName', label: 'Nama Perusahaan', placeholder: 'Contoh: PT. Geotama Teknik', icon: '🏢' },
  { key: 'shallowWellNumber', label: 'Nomor Urut Sumur Bor Dangkal', placeholder: 'Contoh: SWB-001', icon: '🔢' },
];

export default function DataPage({ well, setWell, notify, onSave, onReset }) {
  const update = (key) => (event) => setWell((current) => ({ ...current, [key]: event.target.value }));

  const onBoreholePhoto = async (event, key) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await readImageFile(file);
      setWell((current) => ({ ...current, boreholeImages: { ...current.boreholeImages, [key]: dataUrl } }));
      notify('Foto borehole berhasil disimpan.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const removePhoto = (key) => setWell((current) => {
    const next = { ...current.boreholeImages };
    delete next[key];
    return { ...current, boreholeImages: next };
  });

  const photos = [
    ['wellPhoto', 'Foto Sumur Bor', 'Tampak keseluruhan sumur'],
    ['borehole1', 'Ujung Pipa Awal', 'Titik awal pipa'],
    ['borehole2', 'Muka Air Tanah', 'Kondisi air tanah'],
    ['borehole3', 'Batas Pipa', 'Ujung bawah pipa'],
    ['borehole4', 'Screen Perforasi', 'Lokasi screen'],
    ['borehole5', 'Dasar Sumur Bor', 'Dasar lubang bor'],
  ];

  return (
    <div className="card">
      <div className="header">
        <div>
          <h1>📋 Data Sumur Bor</h1>
          <p>Informasi perusahaan, lokasi, dan teknis sumur bor</p>
        </div>
      </div>

      <div className="well-data-full">
        <div className="form-section">
          <div className="section-title"><span>🏢</span> Informasi Perusahaan & Lokasi</div>

          <div className="well-data-grid-full">
            {inputFields.map(({ key, label, placeholder, icon }) => (
              <div className="well-data-item" key={key}>
                <label className="well-label"><span>{icon}</span> {label}</label>
                <input className="well-input" placeholder={placeholder} value={well[key] || ''} onChange={update(key)} />
              </div>
            ))}

            <div className="well-data-item full-width">
              <label className="well-label"><span>📍</span> Alamat</label>
              <textarea className="well-textarea" placeholder="Contoh: Jl. Gejayan No. 10, Yogyakarta" value={well.address || ''} onChange={update('address')} />
            </div>

            <div className="well-data-item full-width">
              <label className="well-label"><span>🗺️</span> Provinsi</label>
              <select id="province" value={well.province || ''} onChange={update('province')}>
                <option value="">Pilih Provinsi</option>
                {PROVINCES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            <div className="coordinate-group">
              <div className="well-data-item">
                <label className="well-label">🗺️ Latitude</label>
                <input className="well-input" type="number" step="0.0001" placeholder="-7.7821" value={well.latitude || ''} onChange={update('latitude')} />
              </div>
              <div className="well-data-item">
                <label className="well-label">🗺️ Longitude</label>
                <input className="well-input" type="number" step="0.0001" placeholder="110.3671" value={well.longitude || ''} onChange={update('longitude')} />
              </div>
              <div className="well-data-item">
                <label className="well-label">⛰️ Elevasi (mdpl)</label>
                <input className="well-input" type="number" step="0.1" placeholder="0" value={well.elevation || ''} onChange={update('elevation')} />
              </div>
            </div>

            <div className="well-data-item">
              <label className="well-label"><span>🏙️</span> Kabupaten / kota</label>
              <input className="well-input" placeholder="Contoh: Bandung" value={well.city || ''} onChange={update('city')} />
            </div>
            <div className="well-data-item">
              <label className="well-label"><span>🏘️</span> Kecamatan</label>
              <input className="well-input" placeholder="Contoh: Cicendo" value={well.district || ''} onChange={update('district')} />
            </div>
            <div className="well-data-item">
              <label className="well-label"><span>🏡</span> Desa / kelurahan</label>
              <input className="well-input" placeholder="Contoh: Pasirkaliki" value={well.village || ''} onChange={update('village')} />
            </div>
            <div className="well-data-item">
              <label className="well-label"><span>📅</span> Tanggal pelaksanaan</label>
              <input className="well-input" type="date" value={well.boreholeDate || ''} onChange={update('boreholeDate')} />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-title"><span>⚙️</span> Informasi Teknis Sumur</div>
          <div className="well-data-grid-full">
            <div className="well-data-item">
              <label className="well-label"><span>🔢</span> Nomor urut sumur bor</label>
              <input className="well-input" placeholder="Contoh: SUM-001" value={well.wellNumber || ''} onChange={update('wellNumber')} />
            </div>
            <div className="well-data-item">
              <label className="well-label"><span>📏</span> Jarak piezometer ke sumur (m)</label>
              <div className="input-group">
                <input className="well-input" type="number" step="0.1" min="0" placeholder="Contoh: 12" value={well.piezoDistance || ''} onChange={update('piezoDistance')} />
                <span className="unit">m</span>
              </div>
            </div>
            <div className="well-data-item">
              <label className="well-label"><span>⚙️</span> Jenis / kapasitas pompa</label>
              <input className="well-input" placeholder="Contoh: Submersible 2 HP" value={well.pumpType || ''} onChange={update('pumpType')} />
            </div>
            <div className="well-data-item">
              <label className="well-label"><span>↕️</span> Posisi pompa (m)</label>
              <div className="input-group">
                <input className="well-input" type="number" step="0.1" min="0" placeholder="Kedalaman pompa" value={well.pumpPosition || ''} onChange={update('pumpPosition')} />
                <span className="unit">m</span>
              </div>
              <p className="input-hint">Kedalaman pompa dari permukaan tanah</p>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-title"><span>📸</span> Dokumentasi Borehole</div>
          <div className="well-data-grid-full">
            {photos.map(([key, title, subtitle]) => (
              <div key={key} className="well-data-item">
                <label className="well-label">📸 {title}</label>
                <div className="file-upload-area">
                  <label className="file-upload-label" onClick={() => document.getElementById(`data-${key}`)?.click()}>
                    <input id={`data-${key}`} type="file" accept="image/*" hidden onChange={(e) => onBoreholePhoto(e, key)} />
                    <span className="upload-icon">📷</span>
                    <span className="upload-text">Klik untuk unggah</span>
                    <span className="upload-hint">{subtitle} — foto JPG, PNG, GIF (max 5MB)</span>
                  </label>
                  {well.boreholeImages?.[key] && (
                    <div style={{ marginTop: 12, textAlign: 'center' }}>
                      <img className="photo-preview" src={well.boreholeImages[key]} alt={title} />
                      <button type="button" className="btn-danger" style={{ marginTop: 10 }} onClick={() => removePhoto(key)}>🗑 Hapus Foto</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={onReset}>🔄 Reset</button>
          <button type="button" className="btn-primary" onClick={onSave}>💾 Simpan Data</button>
        </div>
      </div>
    </div>
  );
}
