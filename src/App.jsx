import React, { useState, useEffect } from 'react';
import './styles/app.css';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx_Diim9PMzvJnS9938OQOu-1ucedtWuT5-fYolBpzQm5rwuMF7QPhBpZHx74ypb07l/exec';

const questionGroups = [
  {
    title: 'Identitas dan demografi',
    description: 'Informasi dasar responden dan gambaran penduduk.',
    fields: [
      { name: 'tanggal_pengkajian', label: 'Tanggal pengkajian', type: 'date', required: true },
      { name: 'nama_kk', label: 'Nama kepala keluarga / responden', required: true },
      { name: 'alamat', label: 'Alamat lengkap / wilayah', required: true },
      { name: 'rt_rw', label: 'RT / RW / dusun' },
      { name: 'jumlah_penduduk', label: 'Jumlah penduduk di wilayah yang dikaji', type: 'number', min: 0 },
      { name: 'komposisi_penduduk', label: 'Komposisi penduduk (kelompok usia, jenis kelamin, dan kelompok rentan)', multiline: true },
      { name: 'mobilitas_penduduk', label: 'Perpindahan atau mobilitas penduduk', multiline: true }
    ]
  },
  {
    title: 'Lingkungan fisik dan perumahan',
    description: 'Kondisi rumah, sanitasi, sumber air, dan risiko lingkungan.',
    fields: [
      { name: 'kondisi_perumahan', label: 'Kondisi rumah dan kepadatan hunian', multiline: true },
      { name: 'air_bersih', label: 'Sumber dan ketersediaan air bersih', multiline: true },
      { name: 'sanitasi', label: 'Jamban, saluran limbah, dan sanitasi lingkungan', multiline: true },
      { name: 'sampah', label: 'Pengelolaan sampah dan kebersihan lingkungan', multiline: true },
      { name: 'risiko_lingkungan', label: 'Polusi, genangan, bencana, atau risiko lingkungan lainnya', multiline: true }
    ]
  },
  {
    title: 'Pelayanan dan kondisi kesehatan',
    description: 'Akses fasilitas, kebiasaan kesehatan, dan kebutuhan pelayanan.',
    fields: [
      { name: 'fasilitas_kesehatan', label: 'Fasilitas kesehatan yang tersedia dan kemudahan aksesnya', multiline: true },
      { name: 'tenaga_kesehatan', label: 'Tenaga kesehatan, kader, Posyandu, atau kegiatan kesehatan yang tersedia', multiline: true },
      { name: 'masalah_kesehatan', label: 'Masalah kesehatan yang paling sering ditemukan', multiline: true },
      { name: 'kesehatan_ibu_anak', label: 'Kondisi dan layanan kesehatan ibu, bayi, serta balita', multiline: true },
      { name: 'perilaku_kesehatan', label: 'Perilaku hidup bersih dan sehat serta upaya pencegahan penyakit', multiline: true }
    ]
  },
  {
    title: 'Ekonomi dan mata pencaharian',
    description: 'Gambaran pekerjaan, sumber penghasilan, dan kerentanan ekonomi.',
    fields: [
      { name: 'pekerjaan', label: 'Pekerjaan atau mata pencaharian utama', multiline: true },
      { name: 'ekonomi', label: 'Gambaran kondisi ekonomi dan keluarga rentan', multiline: true },
      { name: 'sumber_pangan', label: 'Ketersediaan pangan dan akses kebutuhan pokok', multiline: true }
    ]
  },
  {
    title: 'Pendidikan dan komunikasi',
    description: 'Tingkat pendidikan dan saluran informasi yang digunakan warga.',
    fields: [
      { name: 'pendidikan', label: 'Tingkat pendidikan dan akses pendidikan', multiline: true },
      { name: 'sumber_informasi', label: 'Media atau sumber informasi yang digunakan warga', multiline: true },
      { name: 'akses_komunikasi', label: 'Akses komunikasi, internet, atau hambatan informasi', multiline: true }
    ]
  },
  {
    title: 'Keamanan, transportasi, dan fasilitas umum',
    description: 'Aksesibilitas lingkungan, rasa aman, dan fasilitas yang mendukung warga.',
    fields: [
      { name: 'transportasi', label: 'Transportasi dan akses menuju fasilitas penting', multiline: true },
      { name: 'keamanan', label: 'Keamanan, penerangan, dan risiko sosial', multiline: true },
      { name: 'fasilitas_umum', label: 'Fasilitas umum, ruang terbuka, olahraga, dan rekreasi', multiline: true }
    ]
  },
  {
    title: 'Sosial, budaya, dan pemerintahan',
    description: 'Hubungan sosial, kegiatan warga, nilai budaya, dan dukungan setempat.',
    fields: [
      { name: 'organisasi_sosial', label: 'Organisasi, kelompok warga, dan kegiatan gotong royong', multiline: true },
      { name: 'budaya', label: 'Kebiasaan, nilai, atau budaya yang memengaruhi kesehatan', multiline: true },
      { name: 'dukungan_pemerintah', label: 'Peran pemerintah setempat dan dukungan program', multiline: true }
    ]
  },
  {
    title: 'Potensi dan prioritas komunitas',
    description: 'Rangkum aset komunitas, masalah utama, dan usulan tindak lanjut.',
    fields: [
      { name: 'potensi_komunitas', label: 'Kekuatan, sumber daya, dan potensi komunitas', multiline: true },
      { name: 'masalah_prioritas', label: 'Masalah atau kebutuhan kesehatan yang menjadi prioritas', multiline: true, required: true },
      { name: 'harapan_usulan', label: 'Harapan warga dan usulan kegiatan tindak lanjut', multiline: true },
      { name: 'nama_pengkaji', label: 'Nama pengkaji', required: true }
    ]
  }
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [activeTab, setActiveTab] = useState('input');
  const [formData, setFormData] = useState({});
  const [recapData, setRecapData] = useState([]);
  const [status, setStatus] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) setIsAuthenticated(true);
    
    const today = new Date().toISOString().split('T')[0];
    setFormData({ tanggal_pengkajian: today });
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      setStatus({ message: 'Email dan password wajib diisi!', type: 'error' });
      return;
    }
    setLoading(true);
    setStatus({ message: 'Memverifikasi...', type: '' });

    try {
      // Note: Google Apps Script with no-cors won't let us read the response body.
      // To truly verify, we would need a backend that supports CORS or a different auth flow.
      // For this version, we will perform a client-side check as a first line of defense 
      // while still sending the data to the server.
      
      if (loginData.email === 'miwa' && loginData.password === 'miwa123') {
        const body = new URLSearchParams({ 
          payload: JSON.stringify({ action: 'login', ...loginData }) 
        });
        await fetch(APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body });
        
        localStorage.setItem('auth_token', 'miwa-auth-token-123');
        setIsAuthenticated(true);
        setStatus({ message: 'Login berhasil!', type: 'success' });
      } else {
        setStatus({ message: 'Email atau password salah!', type: 'error' });
      }
    } catch (error) {
      setStatus({ message: 'Terjadi kesalahan koneksi.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setFormData({});
    setStatus({ message: '', type: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ message: 'Menyimpan data...', type: '' });

    const recordId = crypto.randomUUID();
    const payload = { ...formData, record_id: recordId };

    try {
      const body = new URLSearchParams({ payload: JSON.stringify(payload) });
      await fetch(APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body });
      setStatus({ message: 'Data berhasil dikirim!', type: 'success' });
      setFormData({ tanggal_pengkajian: new Date().toISOString().split('T')[0] });
    } catch (error) {
      setStatus({ message: 'Gagal mengirim data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadRecap = async () => {
    setLoading(true);
    setStatus({ message: 'Memuat data...', type: '' });
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?_=${Date.now()}`);
      const data = await response.json();
      setRecapData(Array.isArray(data) ? data : []);
      setStatus({ message: 'Data berhasil dimuat.', type: 'success' });
    } catch (error) {
      setStatus({ message: 'Gagal memuat data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-illustration">
          <div className="character-group">
            <img 
              src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png" 
              className="char-pink"
              alt="Character 1" 
            />
            <img 
              src="https://cdn-icons-png.flaticon.com/512/4712/4712122.png" 
              className="char-cyan"
              alt="Character 2" 
            />
            <img 
              src="https://cdn-icons-png.flaticon.com/512/4712/4712135.png" 
              className="char-blue"
              alt="Character 3" 
            />
          </div>
        </div>
        
        <div className="login-panel">
          <div className="login-header">
            <h1 style={{ margin: 0 }}>Welcome back!</h1>
            <p>Silakan login untuk mengakses data pengkajian.</p>
          </div>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Email</label>
              <input 
                type="text" 
                name="email" 
                value={loginData.email} 
                onChange={(e) => setLoginData({...loginData, email: e.target.value})} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                name="password" 
                value={loginData.password} 
                onChange={(e) => setLoginData({...loginData, password: e.target.value})} 
                required 
              />
            </div>
            
            <button type="submit" className="button-black" disabled={loading}>
              {loading ? 'Memproses...' : 'Log in'}
            </button>
            
            <div style={{ textAlign: 'center', margin: '10px 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
              atau
            </div>
            
            <button type="button" className="button-google" onClick={() => {
              setStatus({ message: 'Fitur Login Google sedang dikembangkan...', type: 'info' });
            }}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" alt="Google" />
              Log in with Google
            </button>
            
            <p className={`form-status ${status.type}`} style={{ textAlign: 'center', marginTop: '15px' }}>{status.message}</p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <main className="container">
      <button onClick={toggleTheme} className="theme-toggle" title="Toggle Dark Mode">
        {theme === 'light' ? (
          <svg className="bubble-anim" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79Z" fill="currentColor"/>
          </svg>
        ) : (
          <svg className="bubble-anim" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="5" fill="currentColor"/>
            <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      </button>
      <header className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ textAlign: 'left' }}>
            <p className="eyebrow">KESEHATAN MASYARAKAT</p>
            <h1 style={{ margin: 0 }}>Pengkajian Komunitas</h1>
            <p className="intro">Catat kondisi, sumber daya, dan prioritas kesehatan komunitas secara terstruktur.</p>
          </div>
          <button onClick={handleLogout} className="button button-secondary" style={{ fontSize: '0.8rem', padding: '8px 12px' }}>
            Keluar
          </button>
        </div>
      </header>

      <nav className="tabs">
        <button 
          className={`tab-link ${activeTab === 'input' ? 'active' : ''}`} 
          onClick={() => setActiveTab('input')}
        >
          Form pengkajian
        </button>
        <button 
          className={`tab-link ${activeTab === 'recap' ? 'active' : ''}`} 
          onClick={() => { setActiveTab('recap'); loadRecap(); }}
        >
          Hasil rekap
        </button>
      </nav>

      {activeTab === 'input' ? (
        <section className="tab-panel active">
          <div className="section-heading">
            <div>
              <p className="eyebrow">FORMULIR</p>
              <h2>Data pengkajian</h2>
            </div>
            <span className="required-note">* Wajib diisi</span>
          </div>
          
          <form onSubmit={handleSubmit}>
            {questionGroups.map((group, idx) => (
              <fieldset key={idx} className="question-group">
                <legend>{`${String(idx + 1).padStart(2, '0')} / ${group.title}`}</legend>
                <p className="group-description">{group.description}</p>
                <div className="field-grid">
                  {group.fields.map(field => (
                    <div key={field.name} className={`form-group ${field.multiline ? 'form-group-wide' : ''}`}>
                      <label htmlFor={field.name}>
                        {field.label} {field.required && <span className="required-marker">*</span>}
                      </label>
                      {field.multiline ? (
                        <textarea 
                          id={field.name} 
                          name={field.name} 
                          value={formData[field.name] || ''} 
                          onChange={handleInputChange}
                          required={field.required}
                          placeholder="Tuliskan hasil pengkajian..."
                        />
                      ) : (
                        <input 
                          id={field.name} 
                          name={field.name} 
                          type={field.type || 'text'} 
                          value={formData[field.name] || ''} 
                          onChange={handleInputChange}
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </fieldset>
            ))}
            <div className="form-actions">
              <button type="reset" className="button button-secondary" onClick={() => setFormData({})}>Bersihkan</button>
              <button type="submit" className="button button-primary" disabled={loading}>
                {loading ? 'Mengirim...' : 'Simpan pengkajian →'}
              </button>
            </div>
            <p className={`form-status ${status.type}`}>{status.message}</p>
          </form>
        </section>
      ) : (
        <section className="tab-panel active">
          <div className="section-heading">
            <div>
              <p className="eyebrow">RINGKASAN</p>
              <h2>Hasil rekap</h2>
            </div>
            <button className="button button-secondary" onClick={loadRecap} disabled={loading}>
              {loading ? 'Memuat...' : '↻ Muat ulang'}
            </button>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Responden</th>
                  <th>Wilayah</th>
                  <th>Prioritas</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {recapData.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.nama_kk}</td>
                    <td>{item.alamat}</td>
                    <td>{item.masalah_prioritas}</td>
                    <td><button className="button button-secondary" style={{padding: '4px 8px', fontSize: '0.7rem'}}>Detail</button></td>
                  </tr>
                ))}
                {recapData.length === 0 && !loading && (
                  <tr><td colSpan="4" className="empty-state">Belum ada data.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <footer>Pengkajian komunitas · Powered by React & Google Sheets</footer>
    </main>
  );
}

export default App;
