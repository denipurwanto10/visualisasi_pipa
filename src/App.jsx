import { useEffect, useRef, useState } from 'react';
import VisualizationPage from './components/VisualizationPage';
import DataPage from './components/DataPage';
import DocsPage from './components/DocsPage';
import { useBoreholeState } from './hooks';
import { downloadBoreholePdf } from './pdf';
import { makeEmptyActivity } from './model';

const NAV_ITEMS = [
  { id: 'page1', label: '🏠 Visualisasi Pipa' },
  { id: 'page2', label: '📋 Data Sumur Bor' },
  { id: 'page3', label: '📹 Dokumentasi Kegiatan' },
];

const TOAST_ICON = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };

function Notification({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className={`modern-notification modern-notification-${toast.type || 'info'} is-visible`}>
      <div className="notification-content">
        <span className="notification-icon">{TOAST_ICON[toast.type] || 'ℹ️'}</span>
        <span className="notification-message">{toast.message}</span>
      </div>
      <button className="notification-close" type="button" onClick={onClose} aria-label="Tutup notifikasi">×</button>
    </div>
  );
}

export default function App() {
  const { model, setModel, well, setWell, activity, setActivity, page, setPage, toast, setToast, notify, persist } = useBoreholeState();
  const [isDownloading, setIsDownloading] = useState(false);
  const canvasRef = useRef(null);
  const stateRef = useRef({ model, well, activity });
  stateRef.current = { model, well, activity };

  const saveAll = (message = 'Data berhasil disimpan di browser ini.') => {
    const current = stateRef.current;
    persist(current.model, current.well, current.activity);
    try {
      localStorage.setItem('wellData', JSON.stringify({
        ...current.well,
        activityImages: current.activity,
        visualization: current.model,
        timestamp: new Date().toISOString(),
      }));
    } catch {
      // Penyimpanan penuh: data tetap aman di memori.
    }
    notify(message, 'success');
  };

  const resetAll = () => {
    if (!window.confirm('Reset semua data visualisasi, data sumur, dan dokumentasi?')) return;
    setModel({ pipes: [], ground: null, mat: null, screens: [], openHole: null });
    setWell({ companyName: '', shallowWellNumber: '', address: '', province: '', latitude: '', longitude: '', elevation: '', city: '', district: '', village: '', boreholeDate: '', wellNumber: '', piezoDistance: '', pumpType: '', pumpPosition: '', boreholeImages: {} });
    setActivity(makeEmptyActivity());
    notify('Semua data telah direset.', 'success');
  };

  const downloadPdf = async () => {
    if (!model.pipes.length) return notify('Buat pipa terlebih dahulu sebelum download PDF', 'warning');
    setIsDownloading(true);
    try {
      await downloadBoreholePdf({ model, well, activity, canvas: canvasRef.current });
      notify('PDF berhasil diunduh!', 'success');
    } catch (error) {
      console.error(error);
      notify('Gagal membuat PDF. Coba lagi dengan foto yang lebih kecil.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const current = stateRef.current;
    persist(current.model, current.well, current.activity);
  }, [model, well, activity, persist]);

  return (
    <div className="container">
      <nav className="navigation-bar">
        <div className="nav-links">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              type="button"
              className={`nav-btn ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="nav-actions">
          <button type="button" className="btn-primary" onClick={downloadPdf} disabled={isDownloading}>
            {isDownloading ? 'Menyiapkan…' : '📥 Download PDF'}
          </button>
          <button type="button" className="btn-secondary" onClick={resetAll}>🔄 Reset Semua</button>
        </div>
      </nav>

      <div className={`page ${page === 'page1' ? 'active' : ''}`} id="page1">
        <VisualizationPage model={model} setModel={setModel} canvasRef={canvasRef} notify={notify} />
      </div>
      <div className={`page ${page === 'page2' ? 'active' : ''}`} id="page2">
        <DataPage well={well} setWell={setWell} model={model} notify={notify} onSave={() => saveAll('Data sumur bor berhasil disimpan.')} onReset={() => {
          if (!window.confirm('Reset data sumur dan seluruh foto borehole?')) return;
          setWell({ companyName: '', shallowWellNumber: '', address: '', province: '', latitude: '', longitude: '', elevation: '', city: '', district: '', village: '', boreholeDate: '', wellNumber: '', piezoDistance: '', pumpType: '', pumpPosition: '', boreholeImages: {} });
          notify('Data sumur bor telah direset.', 'success');
        }} />
      </div>
      <div className={`page ${page === 'page3' ? 'active' : ''}`} id="page3">
        <DocsPage activity={activity} setActivity={setActivity} notify={notify} onSave={() => saveAll('Dokumentasi kegiatan berhasil disimpan.')} onReset={() => {
          if (!window.confirm('Reset seluruh foto dokumentasi kegiatan?')) return;
          setActivity(makeEmptyActivity());
          notify('Dokumentasi kegiatan telah direset.', 'success');
        }} />
      </div>

      <Notification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
