import { useRef } from 'react';
import { ACTIVITY_KEYS } from '../model';
import { readImageFile } from '../hooks';

const CATEGORIES = {
  doc1: { title: 'Papan Nama Lokasi Penyelidikan', description: 'Foto papan nama lokasi' },
  doc2: { title: 'Kenampakan Sumur Bor Produksi', description: 'Kenampakan sumur bor produksi' },
  doc3: { title: 'Persiapan Pengukuran Borehole Camera', description: 'Persiapan pengukuran borehole camera' },
  doc4: { title: 'Kegiatan Pengukuran Borehole Camera', description: 'Kegiatan pengukuran borehole camera' },
  doc5: { title: 'Ukuran Pipa PVC (Casing Sumur)', description: 'Ukuran pipa PVC casing sumur' },
  doc6: { title: 'Pompa Submersible', description: 'Pompa submersible yang digunakan' },
};

const ICONS = {
  doc1: '1️⃣',
  doc2: '2️⃣',
  doc3: '3️⃣',
  doc4: '4️⃣',
  doc5: '5️⃣',
  doc6: '6️⃣',
};

export default function DocsPage({ activity, setActivity, notify, onSave, onReset }) {
  const uploadRef = useRef({});

  const onFiles = async (event, key) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    const current = activity[key] || [];
    const remaining = 3 - current.length;
    if (remaining <= 0) return notify('Maksimal 3 foto per kategori.', 'warning');
    const accepted = files.slice(0, remaining);
    const invalid = files.slice(remaining);
    const previews = [];
    for (const file of accepted) {
      try {
        previews.push({
          id: `${key}-${Date.now()}-${Math.random()}`,
          name: file.name,
          dataUrl: await readImageFile(file),
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        notify(error.message, 'error');
      }
    }
    if (previews.length) {
      setActivity((value) => ({ ...value, [key]: [...(value[key] || []), ...previews] }));
      notify(`${previews.length} foto ditambahkan.`, 'success');
    }
    if (invalid.length) notify(`${invalid.length} file dilewati karena batas 3 foto atau ukuran file.`, 'info');
  };

  const remove = (key, id) => {
    setActivity((value) => ({ ...value, [key]: (value[key] || []).filter((item) => item.id !== id) }));
    notify('Foto dihapus dari dokumentasi.', 'success');
  };

  return (
    <div className="card">
      <div className="header">
        <div>
          <h1>📹 Dokumentasi Kegiatan Borehole</h1>
          <p>Dokumentasi kegiatan borehole camera di lapangan</p>
        </div>
      </div>

      <div className="form-section">
        <div className="section-title"><span>📋</span> Dokumentasi Kegiatan</div>
        <div className="well-data-grid-full">
          {ACTIVITY_KEYS.map((key, index) => {
            const items = activity[key] || [];
            return (
              <div className="well-data-item" key={key}>
                <label className="well-label"><span>{ICONS[key]}</span> {CATEGORIES[key].title}</label>
                <div className="file-upload-area">
                  <label className="file-upload-label" onClick={() => uploadRef.current[key]?.click()}>
                    <input ref={(node) => { uploadRef.current[key] = node; }} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e, key)} />
                    <span className="upload-icon">📷</span>
                    <span className="upload-text">Upload Foto {CATEGORIES[key].description}</span>
                    <span className="upload-hint">{items.length} / 3 foto</span>
                  </label>
                  {items.length > 0 && (
                    <div className="preview-grid" style={{ marginTop: 12 }}>
                      {items.map((item) => (
                        <div className="preview-tile" key={item.id}>
                          <img src={item.dataUrl} alt={`${CATEGORIES[key].title} ${index + 1}`} />
                          <button type="button" className="btn-danger" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => remove(key, item.id)}>🗑 Hapus</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
          <button type="button" className="btn-secondary" onClick={onReset}>🔄 Reset</button>
          <button type="button" className="btn-primary" onClick={onSave}>💾 Simpan Dokumentasi</button>
        </div>
      </div>
    </div>
  );
}
