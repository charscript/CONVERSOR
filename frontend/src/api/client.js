// API Client connecting React to the Python backend

const handleResponse = async (res) => {
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error! status: ${res.status}`);
  }
  return res.json();
};

export const api = {
  checkUpdate: () => fetch('/api/check-update').then(handleResponse),
  
  chooseDirectory: () => fetch('/api/choose-directory').then(handleResponse),
  
  scanWorkspace: (path) => 
    fetch(`/api/scan?path=${encodeURIComponent(path)}`).then(handleResponse),
    
  saveConfig: (path, config) => 
    fetch('/api/save-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, config })
    }).then(handleResponse),
    
  generateMidi: (path) => 
    fetch(`/api/generate-midi?path=${encodeURIComponent(path)}`).then(handleResponse),
    
  exportReaper: (path, config) => 
    fetch('/api/export-reaper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, config })
    }).then(handleResponse),
    
  buildPtSession: (path, config) => 
    fetch('/api/ptsl/build-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, config })
    }).then(handleResponse),
    
  alignStems: (path, selected_files, offsets) => 
    fetch('/api/align-stems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, selected_files, offsets })
    }).then(handleResponse),
    
  zipStems: (path) => 
    fetch('/api/zip-stems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    }).then(handleResponse),
    
  resampleAudio: (path, file) => 
    fetch('/api/audio/resample', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, file })
    }).then(handleResponse),
    
  resampleBatch: (path) => 
    fetch('/api/audio/resample-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    }).then(handleResponse),
    
  getAudioPeaks: (path, filename) => 
    fetch(`/api/audio/peaks?path=${encodeURIComponent(path)}&file=${encodeURIComponent(filename)}`).then(handleResponse),
    
  getPhaseCorrelation: (path, f1, f2) => 
    fetch(`/api/audio/phase-correlation?path=${encodeURIComponent(path)}&file1=${encodeURIComponent(f1)}&file2=${encodeURIComponent(f2)}`).then(handleResponse),
    
  // Helper for audio stream URLs
  getAudioStreamUrl: (path, filename) => 
    `/api/audio/stream?path=${encodeURIComponent(path)}&file=${encodeURIComponent(filename)}`
};
