import { showToast } from './toast.js';

// App State
let state = {
  workspacePath: '',
  config: {
    name: 'Sin Proyecto',
    bpm: 120.0,
    key: 'C Minor',
    time_sig: '4/4',
    sample_rate: 48000.0,
    bit_depth: '24-bit',
    markers: [],
    tracks: [], // mixer track states: { name, filename, category, volume, pan, mute, solo }
    notes: []
  },
  detectedPt: null,
  detectedFlp: null,
  wavFiles: [],
  ptFiles: [],
  flpFiles: [],
  ptsl: { connected: false }
};

// Wizard State Controllers
let currentStep = 1;
let viewMode = 'wizard'; // 'wizard' or 'expert'

// Global audio streaming state
let currentAudio = null;
let currentPlayingIndex = null;
let selectedWavIndex = null;

// Web Audio API context for piano synthesizer
let audioCtx = null;

// DOM Elements
const workspacePathInput = document.getElementById('workspacePathInput');
const chooseDirBtn = document.getElementById('chooseDirBtn');
const scanWorkspaceBtn = document.getElementById('scanWorkspaceBtn');
const syncStatusBadge = document.getElementById('syncStatusBadge');
const ptslBadge = document.getElementById('ptslBadge');
const summaryBpm = document.getElementById('summaryBpm');
const summaryKey = document.getElementById('summaryKey');
const summaryTimeSig = document.getElementById('summaryTimeSig');
const summaryMarkersCount = document.getElementById('summaryMarkersCount');
const timelineTracks = document.getElementById('timelineTracks');
const timelineMarkers = document.getElementById('timelineMarkers');
const timelineTicks = document.getElementById('timelineTicks');
const ptInfoArea = document.getElementById('ptInfoArea');
const flInfoArea = document.getElementById('flInfoArea');
const downloadMidiBtn = document.getElementById('downloadMidiBtn');
const exportReaperBtn = document.getElementById('exportReaperBtn');
const buildPtSessionBtn = document.getElementById('buildPtSessionBtn');
const importFlpDataBtn = document.getElementById('importFlpDataBtn');
const audioFileList = document.getElementById('audioFileList');
const alignAllBtn = document.getElementById('alignAllBtn');
const zipStemsBtn = document.getElementById('zipStemsBtn');
const markersTableBody = document.getElementById('markersTableBody');
const notesList = document.getElementById('notesList');
const newNoteText = document.getElementById('newNoteText');
const addNoteBtn = document.getElementById('addNoteBtn');
const consoleLog = document.getElementById('statusLogConsole');

// Add Marker Form Elements
const newMarkerName = document.getElementById('newMarkerName');
const newMarkerLocation = document.getElementById('newMarkerLocation');
const newMarkerComments = document.getElementById('newMarkerComments');
const addMarkerFormBtn = document.getElementById('addMarkerFormBtn');

// Note Timestamping Elements
const noteMarkerSelect = document.getElementById('noteMarkerSelect');
const noteTimeInput = document.getElementById('noteTimeInput');

// Waveform visualizer elements
const waveformVisualizer = document.getElementById('waveformVisualizer');
const waveformTitle = document.getElementById('waveformTitle');
const waveformInfo = document.getElementById('waveformInfo');
const waveformCanvas = document.getElementById('waveformCanvas');
const waveformOffsetSlider = document.getElementById('waveformOffsetSlider');
const waveformSliderValue = document.getElementById('waveformSliderValue');

// Tabs Views Elements
const alignTabBtn = document.getElementById('alignTabBtn');
const mixerTabBtn = document.getElementById('mixerTabBtn');
const alignerView = document.getElementById('alignerView');
const mixerView = document.getElementById('mixerView');

// Batch resampler button
const batchResampleBtn = document.getElementById('batchResampleBtn');

// Scale guides selectors
const scaleProjectKey = document.getElementById('scaleProjectKey');
const scaleKeyNotes = document.getElementById('scaleKeyNotes');
const originalScaleSelect = document.getElementById('originalScaleSelect');
const originalModeSelect = document.getElementById('originalModeSelect');
const transpositionResult = document.getElementById('transpositionResult');
const pianoKeyboard = document.getElementById('pianoKeyboard');

// Phase Correlation Elements
const phaseFile1 = document.getElementById('phaseFile1');
const phaseFile2 = document.getElementById('phaseFile2');
const checkPhaseBtn = document.getElementById('checkPhaseBtn');
const phasePointer = document.getElementById('phasePointer');
const phaseResultLabel = document.getElementById('phaseResultLabel');

// Phase 10: Wizard View DOM Elements
const expertModeToggle = document.getElementById('expertModeToggle');
const wizardStepper = document.getElementById('wizardStepper');
const wizardNavControls = document.getElementById('wizardNavControls');
const prevStepBtn = document.getElementById('prevStepBtn');
const nextStepBtn = document.getElementById('nextStepBtn');
const welcomeScanPrompt = document.getElementById('welcomeScanPrompt');
const step1SummaryCard = document.getElementById('step1SummaryCard');
const step1DetectionSummary = document.getElementById('step1DetectionSummary');
const mainGridContainer = document.getElementById('mainGridContainer');
const rightColumnAside = document.getElementById('rightColumnAside');
const leftColumnSection = document.getElementById('leftColumnSection');

// Load settings from localStorage if available
document.addEventListener('DOMContentLoaded', () => {
  const savedPath = localStorage.getItem('dawsync_workspace_path');
  
  // Set default view layout mode (Wizard)
  toggleViewMode();
  
  if (savedPath) {
    workspacePathInput.value = savedPath;
    scanWorkspace();
  }
});

// Event Listeners
scanWorkspaceBtn.addEventListener('click', scanWorkspace);
chooseDirBtn.addEventListener('click', chooseWorkspaceDirectory);
downloadMidiBtn.addEventListener('click', generateMidi);
exportReaperBtn.addEventListener('click', exportReaperProject);
buildPtSessionBtn.addEventListener('click', buildProToolsSession);
importFlpDataBtn.addEventListener('click', syncFlpData);
addNoteBtn.addEventListener('click', addNote);
alignAllBtn.addEventListener('click', alignStems);
zipStemsBtn.addEventListener('click', zipStems);
addMarkerFormBtn.addEventListener('click', addMarkerFromForm);
batchResampleBtn.addEventListener('click', executeBatchResampling);
checkPhaseBtn.addEventListener('click', checkPhaseCorrelation);

// Tab switches (only used in Expert mode)
alignTabBtn.addEventListener('click', () => {
  alignTabBtn.className = 'tab-btn active';
  mixerTabBtn.className = 'tab-btn';
  alignerView.style.display = 'block';
  mixerView.style.display = 'none';
});

mixerTabBtn.addEventListener('click', () => {
  alignTabBtn.className = 'tab-btn';
  mixerTabBtn.className = 'tab-btn active';
  alignerView.style.display = 'none';
  mixerView.style.display = 'flex';
  renderMixer();
});

// Transposition Guide selectors events
originalScaleSelect.addEventListener('change', calculateTransposition);
originalModeSelect.addEventListener('change', calculateTransposition);

// Double click on markers bar timeline to add a marker
timelineMarkers.addEventListener('dblclick', (e) => {
  if (!state.workspacePath) return;
  
  const rect = timelineMarkers.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const widthPct = clickX / rect.width;
  
  const maxTime = getTimelineDuration();
  const targetSeconds = widthPct * maxTime;
  
  const markerName = prompt(`Agregar nuevo marcador en ${targetSeconds.toFixed(2)}s. Ingresa el nombre del marcador:`);
  if (!markerName || !markerName.trim()) return;
  
  const newMarker = {
    index: state.config.markers.length + 1,
    location_raw: `${targetSeconds.toFixed(2)}s`,
    location_seconds: targetSeconds,
    name: markerName.trim(),
    comments: 'Añadido desde regla visual'
  };
  
  state.config.markers.push(newMarker);
  state.config.markers.sort((a, b) => a.location_seconds - b.location_seconds);
  state.config.markers.forEach((m, idx) => m.index = idx + 1);
  
  log(`Marcador '${markerName}' agregado en ${targetSeconds.toFixed(2)} segundos.`, 'info');
  saveConfig();
  updateUI();
});

// Waveform offset slider event
waveformOffsetSlider.addEventListener('input', () => {
  if (selectedWavIndex === null) return;
  const seconds = parseFloat(waveformOffsetSlider.value);
  waveformSliderValue.textContent = `${seconds.toFixed(3)}s`;
  
  const offsetInput = document.getElementById(`offset-${selectedWavIndex}`);
  if (offsetInput) {
    offsetInput.value = seconds.toFixed(3);
  }
});

// Wizard navigation button click handlers
expertModeToggle.addEventListener('change', toggleViewMode);
prevStepBtn.addEventListener('click', () => navigateStep(-1));
nextStepBtn.addEventListener('click', () => navigateStep(1));

document.querySelectorAll('.step-item').forEach(item => {
  item.addEventListener('click', () => {
    if (state.workspacePath) {
      const step = parseInt(item.dataset.step);
      goToStep(step);
    } else {
      log('Escanea una carpeta de sesión para activar los pasos.', 'warning');
    }
  });
});

// Toggle between Wizard workflow and Expert dashboard layout
function toggleViewMode() {
  const isExpert = expertModeToggle.checked;
  viewMode = isExpert ? 'expert' : 'wizard';
  
  if (isExpert) {
    wizardStepper.style.display = 'none';
    wizardNavControls.style.display = 'none';
    rightColumnAside.style.display = 'flex';
    
    // Restore two column layout template
    mainGridContainer.style.gridTemplateColumns = '2.2fr 1fr';
    mainGridContainer.classList.remove('wizard-layout');
    
    // Show all wizard screens at once
    document.getElementById('step1View').style.display = 'block';
    document.getElementById('step2View').style.display = 'block';
    document.getElementById('step3View').style.display = 'block';
    document.getElementById('step4View').style.display = 'block';
    document.getElementById('step5View').style.display = 'block';
    
    // Enable tabs selector in expert mode
    document.querySelector('.tab-container').style.display = 'flex';
    
    // Show welcome scan prompt based on scans
    if (state.workspacePath) {
      welcomeScanPrompt.style.display = 'none';
      step1SummaryCard.style.display = 'block';
      alignerView.style.display = 'block';
      mixerView.style.display = 'none';
      alignTabBtn.className = 'tab-btn active';
      mixerTabBtn.className = 'tab-btn';
    } else {
      welcomeScanPrompt.style.display = 'block';
      step1SummaryCard.style.display = 'none';
    }
    
    log('Modo de Vista Experta activado. Todos los paneles expuestos.', 'info');
  } else {
    wizardStepper.style.display = 'flex';
    wizardNavControls.style.display = 'flex';
    rightColumnAside.style.display = 'none';
    
    // Collapse to clean one-column template
    mainGridContainer.style.gridTemplateColumns = '1fr';
    mainGridContainer.classList.add('wizard-layout');
    
    // Hide standard tab selectors (Wizard controls display)
    document.querySelector('.tab-container').style.display = 'none';
    
    log('Modo Asistente Guiado activado.', 'info');
    goToStep(currentStep);
  }
}

// Navigate relative step index
function navigateStep(offset) {
  const target = currentStep + offset;
  if (target >= 1 && target <= 5) {
    goToStep(target);
  }
}

// Set active Step and render panels
function goToStep(step) {
  const previousStep = currentStep;
  currentStep = step;
  
  const isForward = previousStep ? step > previousStep : true;
  
  // Update Stepper badges styling classes
  for (let i = 1; i <= 5; i++) {
    const indicator = document.getElementById(`stepIndicator${i}`);
    if (indicator) {
      indicator.classList.remove('active', 'completed');
      if (i === step) {
        indicator.classList.add('active');
      } else if (i < step) {
        indicator.classList.add('completed');
      }
    }
    
    const line = document.getElementById(`stepLine${i}`);
    if (line) {
      line.classList.remove('active');
      if (i < step) {
        line.classList.add('active');
      }
    }
  }
  
  // Hide all step panels
  document.getElementById('step1View').style.display = 'none';
  document.getElementById('step2View').style.display = 'none';
  document.getElementById('step3View').style.display = 'none';
  document.getElementById('step4View').style.display = 'none';
  document.getElementById('step5View').style.display = 'none';
  
  // Show active step
  const activeView = document.getElementById(`step${step}View`);
  activeView.style.display = 'block';
  if (viewMode === 'wizard') {
    activeView.classList.remove('slide-forward', 'slide-backward');
    // Trigger reflow to restart animation
    void activeView.offsetWidth;
    activeView.classList.add(isForward ? 'slide-forward' : 'slide-backward');
  }
  
  // Update footer button states
  prevStepBtn.disabled = step === 1;
  nextStepBtn.textContent = step === 5 ? '¡Flujo Completado! 🎉' : 'Siguiente ➡️';
  
  // Do not let user proceed past step 1 if they haven't scanned a workspace folder
  nextStepBtn.disabled = (step === 1 && !state.workspacePath);
  
  if (step === 4) {
    renderMixer();
  }
  
  log(`Visualizando Paso ${step}: ${getStepName(step)}`, 'info');
}

function getStepName(step) {
  return ['Origen', 'Diagnóstico', 'Alineación', 'Mezcla', 'Exportación'][step - 1];
}

// Helper: Calculate max duration of project (timeline scaling limit)
function getTimelineDuration() {
  let maxTime = 120.0;
  
  if (state.config.markers && state.config.markers.length > 0) {
    const maxMarker = Math.max(...state.config.markers.map(m => m.location_seconds || 0));
    if (maxMarker > maxTime) maxTime = maxMarker;
  }
  
  if (state.detectedPt && state.detectedPt.tracks) {
    state.detectedPt.tracks.forEach(t => {
      if (t.clips) {
        t.clips.forEach(c => {
          if (c.end_seconds > maxTime) maxTime = c.end_seconds;
        });
      }
    });
  }
  return maxTime + 5.0;
}

// Helper: Assign track classes based on their names (intelligent coloring)
function getTrackCategory(trackName) {
  const name = trackName.toLowerCase();
  
  if (name.includes('vox') || name.includes('vocal') || name.includes('bgv') || 
      name.includes('coro') || name.includes('sing') || name.includes('lead') || 
      name.includes('voice') || name.includes('voz')) {
    return 'category-vocal';
  }
  if (name.includes('drum') || name.includes('kick') || name.includes('snare') || 
      name.includes('hat') || name.includes('clap') || name.includes('perc') || 
      name.includes('battery') || name.includes('bombo') || name.includes('caja') || 
      name.includes('hihat') || name.includes('shaker') || name.includes('tom')) {
    return 'category-drums';
  }
  if (name.includes('bass') || name.includes('bajo') || name.includes('sub')) {
    return 'category-bass';
  }
  if (name.includes('synth') || name.includes('lead') || name.includes('pad') || 
      name.includes('keys') || name.includes('piano') || name.includes('organ') || 
      name.includes('chord') || name.includes('guitar') || name.includes('git') || 
      name.includes('mel') || name.includes('acord') || name.includes('brass')) {
    return 'category-instruments';
  }
  return 'category-other';
}

// Console Logger Helper
function log(message, type = 'info') {
  const time = new Date().toTimeString().split(' ')[0];
  let color = '#00ff66';
  if (type === 'error') color = '#ff0055';
  if (type === 'warning') color = '#ffaa00';
  if (type === 'system') color = '#00ffc8';
  
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `
    <span class="log-time">[${time}]</span>
    <span style="color: ${color}">${message}</span>
  `;
  consoleLog.appendChild(entry);
  consoleLog.scrollTop = consoleLog.scrollHeight;
}

// REST Client: Open native macOS Finder directory selector
async function chooseWorkspaceDirectory() {
  log('Abriendo selector de carpetas de macOS...', 'info');
  chooseDirBtn.disabled = true;
  try {
    const res = await fetch('/api/choose-directory');
    const data = await res.json();
    if (data && data.path) {
      workspacePathInput.value = data.path;
      log(`Carpeta seleccionada: ${data.path}`, 'info');
      scanWorkspace();
    } else {
      log('Selección de carpeta cancelada.', 'warning');
    }
  } catch (err) {
    log(`Error al abrir selector Finder: ${err.message}`, 'error');
  } finally {
    chooseDirBtn.disabled = false;
  }
}

// REST Client: Scan local workspace directory
async function scanWorkspace() {
  const path = workspacePathInput.value.trim();
  if (!path) {
    log('Por favor ingresa una ruta de directorio válida.', 'error');
    return;
  }
  
  log(`Escaneando directorio: ${path}...`, 'system');
  scanWorkspaceBtn.disabled = true;
  
  try {
    const res = await fetch(`/api/scan?path=${encodeURIComponent(path)}`);
    const data = await res.json();
    
    if (!res.ok) {
      log(data.error || 'Fallo al escanear el directorio.', 'error');
      scanWorkspaceBtn.disabled = false;
      return;
    }
    
    state.workspacePath = path;
    localStorage.setItem('dawsync_workspace_path', path);
    
    state.config = data.config || state.config;
    state.detectedPt = data.detected_pt || null;
    state.detectedFlp = data.detected_flp || null;
    state.wavFiles = data.wav_files || [];
    state.ptFiles = data.pt_files || [];
    state.flpFiles = data.flp_files || [];
    state.ptsl = data.ptsl || { connected: false };
    
    // Hide scan welcomes and show summaries
    welcomeScanPrompt.style.display = 'none';
    step1SummaryCard.style.display = 'block';
    
    let detectStr = 'Detectamos: ';
    if (state.detectedPt) detectStr += `una sesión de Pro Tools (${state.detectedPt.name}), `;
    if (state.detectedFlp) detectStr += `una plantilla de FL Studio, `;
    detectStr += `${state.wavFiles.length} stems de audio WAV. `;
    if (state.ptsl && state.ptsl.connected) detectStr += `Pro Tools se encuentra conectado por PTSL en vivo.`;
    
    step1DetectionSummary.textContent = detectStr;
    
    // Display background resample logs
    let resamplingCount = 0;
    state.wavFiles.forEach(w => {
      if (w.resampling) {
        log(`[Auto-Conformer] Remuestreando ${w.filename.split('/').pop()} en segundo plano...`, 'warning');
        resamplingCount++;
      }
      if (w.joining) {
        log(`[Stereo-Joiner] Consolidando pistas split-mono para ${w.filename.split('/').pop()}...`, 'warning');
        resamplingCount++;
      }
    });
    if (resamplingCount > 0) {
      log(`Preparando stems en segundo plano. Se recargará en unos instantes.`, 'system');
    }
    
    log(`Escaneo completado. Detectados: ${state.wavFiles.length} archivos WAV, ${state.ptFiles.length} TXT, ${state.flpFiles.length} FLP.`, 'system');
    
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
      currentPlayingIndex = null;
    }
    
    waveformVisualizer.style.display = 'none';
    selectedWavIndex = null;
    
    syncMixerTracksState();
    
    updateUI();
    
    // Auto-reload scan if background conforming is active to fetch compiled files
    if (resamplingCount > 0) {
      setTimeout(scanWorkspace, 4000);
    }
    
  } catch (err) {
    log(`Error al conectar con el backend: ${err.message}`, 'error');
  } finally {
    scanWorkspaceBtn.disabled = false;
  }
}

// Map scanned WAV files to config mixer tracks
function syncMixerTracksState() {
  if (!state.config.tracks) state.config.tracks = [];
  
  state.wavFiles.forEach(w => {
    const filename = w.filename;
    const basename = filename.split('/').pop();
    
    let existing = state.config.tracks.find(t => t.filename === filename);
    if (!existing) {
      state.config.tracks.push({
        name: basename.replace('.wav', ''),
        filename: filename,
        category: getTrackCategory(basename),
        volume: 0.0,
        pan: 0.0,
        mute: false,
        solo: false
      });
    }
  });
}

// REST Client: Save config to local dawsync_config.json
async function saveConfig() {
  try {
    const res = await fetch('/api/save-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: state.workspacePath,
        config: state.config
      })
    });
    
    const data = await res.json();
    if (!res.ok) {
      log(`Error al guardar configuración: ${data.error}`, 'error');
    }
  } catch (err) {
    log(`Error de conexión al guardar configuración: ${err.message}`, 'error');
  }
}

// REST Client: Trigger MIDI generation compiling tracks, volume faders, and clips notes
async function generateMidi() {
  log('Compilando mapa MIDI con automatizaciones de fader y regiones...', 'system');
  
  const tracksPayload = [];
  
  state.config.tracks.forEach(t => {
    const wavObj = state.wavFiles.find(w => w.filename === t.filename);
    const duration = wavObj && wavObj.meta ? wavObj.meta.duration : 120.0;
    
    const basename = t.filename.split('/').pop();
    let offset = 0.0;
    
    if (state.detectedPt && state.detectedPt.tracks) {
      const pttNames = state.detectedPt.tracks.map(ptt => ptt.name);
      const matchedTrackName = fuzzyMatchTrackJs(basename, pttNames);
      if (matchedTrackName) {
        const matchedPtTrack = state.detectedPt.tracks.find(ptt => ptt.name === matchedTrackName);
        if (matchedPtTrack && matchedPtTrack.clips && matchedPtTrack.clips.length > 0) {
          offset = matchedPtTrack.clips[0].start_seconds;
        }
      }
    }
    
    tracksPayload.push({
      name: t.name,
      volume: t.volume,
      pan: t.pan,
      clips: [{
        start_seconds: offset,
        duration_seconds: duration
      }]
    });
  });
  
  try {
    const res = await fetch('/api/generate-midi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: state.workspacePath,
        tracks: tracksPayload
      })
    });
    const data = await res.json();
    
    if (!res.ok) {
      log(`Fallo al generar MIDI: ${data.error}`, 'error');
    } else {
      log(`¡Archivo MIDI generado con éxito! sync_data.mid guardado.`, 'info');
      log(`Contiene volumen (CC 7) y balance (CC 10) listos para importar a FL Studio.`, 'system');
    }
  } catch (err) {
    log(`Error al generar MIDI: ${err.message}`, 'error');
  }
}

// REST Client: Export Reaper Project
async function exportReaperProject() {
  log('Preparando ruteo, plugins y faders de mezcla para Reaper...', 'info');
  
  const rppTracksPayload = [];
  
  state.config.tracks.forEach(t => {
    const wavObj = state.wavFiles.find(w => w.filename === t.filename);
    const duration = wavObj && wavObj.meta ? wavObj.meta.duration : 120.0;
    
    const basename = t.filename.split('/').pop();
    let offset = 0.0;
    let trackPlugins = [];
    
    if (state.detectedPt) {
      const pttNames = state.detectedPt.tracks.map(ptt => ptt.name);
      const matchedTrackName = fuzzyMatchTrackJs(basename, pttNames);
      if (matchedTrackName) {
        const matchedPtTrack = state.detectedPt.tracks.find(ptt => ptt.name === matchedTrackName);
        if (matchedPtTrack) {
          if (matchedPtTrack.clips && matchedPtTrack.clips.length > 0) {
            offset = matchedPtTrack.clips[0].start_seconds;
          }
          if (state.detectedPt.plugins && state.detectedPt.plugins[matchedPtTrack.name]) {
            trackPlugins = state.detectedPt.plugins[matchedPtTrack.name];
          }
        }
      }
    }
    
    const alignedFilename = `alineado_${basename}`;
    const alignedFilepath = os_join("Stems_Alineados", alignedFilename);
    
    rppTracksPayload.push({
      name: t.name,
      category: t.category,
      volume: t.volume,
      pan: t.pan,
      mute: t.mute,
      solo: t.solo,
      plugins: trackPlugins,
      clips: [{
        name: basename,
        start_seconds: 0.0,
        duration_seconds: duration,
        file_path: alignedFilepath
      }]
    });
  });
  
  log('Generando archivo de proyecto Reaper (.RPP) con cadenas VST...', 'system');
  try {
    const res = await fetch('/api/export-reaper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: state.workspacePath,
        tracks: rppTracksPayload
      })
    });
    const data = await res.json();
    
    if (!res.ok) {
      log(`Fallo al crear proyecto Reaper: ${data.error}`, 'error');
    } else {
      log(`¡Proyecto de Reaper exportado con éxito! Creado como: ${data.rpp_file} en la carpeta.`, 'info');
      log(`Los insertos VST se han mapeado y configurado automáticamente.`, 'system');
    }
  } catch (err) {
    log(`Error al exportar Reaper: ${err.message}`, 'error');
  }
}

// REST Client: Live assembly of Pro Tools sessions using gRPC PTSL scripting API
async function buildProToolsSession() {
  log('Iniciando construcción en vivo de sesión en Pro Tools...', 'system');
  buildPtSessionBtn.disabled = true;
  
  const tracksPayload = [];
  state.config.tracks.forEach(t => {
    const basename = t.filename.split('/').pop();
    let offset = 0.0;
    
    if (state.detectedPt && state.detectedPt.tracks) {
      const pttNames = state.detectedPt.tracks.map(ptt => ptt.name);
      const matchedTrackName = fuzzyMatchTrackJs(basename, pttNames);
      if (matchedTrackName) {
        const matchedPtTrack = state.detectedPt.tracks.find(ptt => ptt.name === matchedTrackName);
        if (matchedPtTrack && matchedPtTrack.clips && matchedPtTrack.clips.length > 0) {
          offset = matchedPtTrack.clips[0].start_seconds;
        }
      }
    }
    
    tracksPayload.push({
      name: t.name,
      volume: t.volume,
      pan: t.pan,
      clips: [{
        name: basename,
        start_seconds: offset
      }]
    });
  });
  
  try {
    const res = await fetch('/api/ptsl/build-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: state.workspacePath,
        tracks: tracksPayload
      })
    });
    
    const data = await res.json();
    if (!res.ok) {
      log(`Fallo al construir sesión: ${data.error}`, 'error');
    } else {
      log(data.message, 'info');
      data.commands.forEach(cmd => log(`[PTSL SDK] Executing: ${cmd}`, 'system'));
    }
  } catch (err) {
    log(`Error de conexión al construir sesión: ${err.message}`, 'error');
  } finally {
    buildPtSessionBtn.disabled = false;
  }
}

// Simple OS Join paths helper
function os_join(part1, part2) {
  const isWindows = state.workspacePath.includes('\\');
  const sep = isWindows ? '\\' : '/';
  return part1 + sep + part2;
}

// Import FL Studio FLP data to central config
function syncFlpData() {
  if (!state.detectedFlp) return;
  
  log('Sincronizando tempo y marcadores desde el archivo de FL Studio...', 'system');
  
  state.config.bpm = state.detectedFlp.bpm || state.config.bpm;
  state.config.time_sig = state.detectedFlp.time_signature || state.config.time_sig;
  if (state.detectedFlp.markers && state.detectedFlp.markers.length > 0) {
    state.config.markers = state.detectedFlp.markers;
  }
  
  log(`Configurado BPM: ${state.config.bpm} e importados ${state.config.markers.length} marcadores.`, 'info');
  saveConfig();
  updateUI();
}

// Add note to collaboration board
function addNote() {
  const text = newNoteText.value.trim();
  if (!text) return;
  
  const producer = state.detectedPt ? 'Pro Tools Engineer' : (state.detectedFlp ? 'FL Studio Beatmaker' : 'Productor');
  const assocMarker = noteMarkerSelect.value;
  const assocTimeStr = noteTimeInput.value.trim();
  
  let seconds = undefined;
  let label = undefined;
  
  if (assocMarker) {
    const m = state.config.markers.find(item => item.name === assocMarker);
    if (m) {
      seconds = m.location_seconds;
      label = m.name;
    }
  } else if (assocTimeStr) {
    const frameRate = state.detectedPt ? getFpsFromFormat(state.detectedPt.timecode_format) : 24.0;
    const startTc = state.detectedPt ? state.detectedPt.session_start : "00:00:00:00";
    seconds = timecodeToSeconds(assocTimeStr, frameRate, state.config.bpm, startTc);
    label = assocTimeStr;
  }
  
  const newNote = {
    author: producer,
    timestamp: new Date().toLocaleString(),
    text: text,
    seconds: seconds,
    label: label
  };
  
  state.config.notes.push(newNote);
  newNoteText.value = '';
  noteMarkerSelect.value = '';
  noteTimeInput.value = '';
  
  log('Nota agregada al panel.', 'info');
  saveConfig();
  renderNotes();
}

// REST Client: Send checked stems to aligner
async function alignStems() {
  const checkedItems = document.querySelectorAll('.align-checkbox:checked');
  if (checkedItems.length === 0) {
    log('No has seleccionado ningún stem para alinear.', 'warning');
    return;
  }
  
  const alignments = [];
  checkedItems.forEach(item => {
    const index = item.dataset.index;
    const fileObj = state.wavFiles[index];
    const offsetInput = document.getElementById(`offset-${index}`);
    const offsetVal = parseFloat(offsetInput.value) || 0.0;
    alignments.push({
      input_file: fileObj.filename,
      offset: offsetVal
    });
  });
  
  log(`Alineando ${alignments.length} stems de audio...`, 'system');
  alignAllBtn.disabled = true;
  
  try {
    const res = await fetch('/api/align-stems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: state.workspacePath,
        alignments: alignments
      })
    });
    
    const data = await res.json();
    if (!res.ok) {
      log(`Error al alinear stems: ${data.error}`, 'error');
      alignAllBtn.disabled = false;
      return;
    }
    
    data.results.forEach(res => {
      if (res.status.includes('con éxito')) {
        log(`[Éxito] ${res.file} alineado.`, 'info');
      } else {
        log(`[Fallo] ${res.file}: ${res.status}`, 'error');
      }
    });
    
    log(`Stems alineados exportados a la carpeta: 'Stems_Alineados/' en el proyecto.`, 'system');
    zipStemsBtn.disabled = false;
    
  } catch (err) {
    log(`Error al enviar solicitud de alineación: ${err.message}`, 'error');
  } finally {
    alignAllBtn.disabled = false;
  }
}

// REST Client: Compress aligned stems into ZIP
async function zipStems() {
  log('Empaquetando stems alineados en archivo ZIP...', 'system');
  zipStemsBtn.disabled = true;
  
  try {
    const res = await fetch('/api/zip-stems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: state.workspacePath })
    });
    const data = await res.json();
    
    if (!res.ok) {
      log(`Error al crear ZIP: ${data.error}`, 'error');
    } else {
      log(`¡Archivo ZIP creado con éxito! Guardado como: ${data.zip_file} en tu carpeta de proyecto.`, 'info');
    }
  } catch (err) {
    log(`Error de conexión al crear ZIP: ${err.message}`, 'error');
  } finally {
    zipStemsBtn.disabled = false;
  }
}

// REST Client: Resample single file
async function resampleAudioFile(filename, targetSr) {
  log(`Iniciando remuestreo para ${filename.split('/').pop()} a ${targetSr}Hz...`, 'system');
  try {
    const res = await fetch('/api/audio/resample', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: state.workspacePath,
        file: filename,
        target_sr: targetSr
      })
    });
    
    const data = await res.json();
    if (!res.ok) {
      log(`Error al remuestrear archivo: ${data.error}`, 'error');
    } else {
      log(`¡Archivo remuestreado con éxito! Guardado como: ${data.resampled_file}`, 'info');
      scanWorkspace();
    }
  } catch (err) {
    log(`Fallo al comunicar remuestreo: ${err.message}`, 'error');
  }
}

// REST Client: Execute batch resampling on all mismatched files concurrently
async function executeBatchResampling() {
  const targetSr = state.config.sample_rate || 48000;
  log(`Iniciando remuestreo por lotes en segundo plano a ${targetSr}Hz...`, 'system');
  batchResampleBtn.disabled = true;
  
  try {
    const res = await fetch('/api/audio/resample-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: state.workspacePath,
        target_sr: targetSr
      })
    });
    const data = await res.json();
    
    if (!res.ok) {
      log(`Fallo en remuestreo por lotes: ${data.error}`, 'error');
    } else {
      if (data.resampled && data.resampled.length > 0) {
        log(`[Éxito] Remuestreados ${data.resampled.length} archivos WAV concurrentemente en el backend.`, 'info');
        scanWorkspace();
      } else {
        log('No se encontraron archivos WAV para remuestrear.', 'warning');
      }
    }
  } catch (err) {
    log(`Error en llamada de lote: ${err.message}`, 'error');
  } finally {
    batchResampleBtn.disabled = false;
  }
}

// REST Client: Fetch WAV amplitude peaks and draw waveform canvas
async function showWaveformVisualizer(filename, index) {
  selectedWavIndex = index;
  const basename = filename.split('/').pop();
  waveformTitle.textContent = basename;
  
  waveformVisualizer.style.display = 'block';
  waveformCanvas.width = waveformCanvas.parentElement.clientWidth - 40;
  
  const offsetInput = document.getElementById(`offset-${index}`);
  const currentVal = parseFloat(offsetInput.value) || 0.0;
  
  waveformOffsetSlider.value = currentVal;
  waveformSliderValue.textContent = `${currentVal.toFixed(3)}s`;
  
  log(`Cargando picos de audio de: ${basename}...`, 'info');
  
  try {
    const res = await fetch(`/api/audio/peaks?path=${encodeURIComponent(state.workspacePath)}&file=${encodeURIComponent(filename)}`);
    const data = await res.json();
    if (!res.ok) {
      log(`Fallo al cargar forma de onda: ${data.error}`, 'error');
    } else {
      drawWaveform(data.peaks);
    }
  } catch (err) {
    log(`Error al conectarpeaks: ${err.message}`, 'error');
  }
}

// Drawing symmetrical peaks mirror waveform on Canvas
function drawWaveform(peaks) {
  const ctx = waveformCanvas.getContext('2d');
  const w = waveformCanvas.width;
  const h = waveformCanvas.height;
  
  ctx.clearRect(0, 0, w, h);
  
  if (!peaks || peaks.length === 0) {
    ctx.fillStyle = 'var(--text-muted)';
    ctx.font = '12px sans-serif';
    ctx.fillText('Forma de onda no disponible', 20, 40);
    return;
  }
  
  const centerY = h / 2;
  const barWidth = w / peaks.length;
  
  ctx.fillStyle = 'rgba(0, 242, 254, 0.7)';
  
  for (let i = 0; i < peaks.length; i++) {
    const p = peaks[i];
    const barHeight = p * (h / 2) * 0.95;
    const x = i * barWidth;
    
    ctx.fillRect(x, centerY - barHeight, barWidth - 1, barHeight * 2);
  }
}

// Local audio streaming toggle control
function toggleAudio(filename, elementId, index) {
  const btn = document.getElementById(elementId);
  
  if (currentPlayingIndex === index) {
    if (currentAudio) {
      currentAudio.pause();
    }
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
    btn.className = 'play-btn';
    currentAudio = null;
    currentPlayingIndex = null;
    log(`Reproducción pausada: ${filename.split('/').pop()}`, 'info');
    return;
  }
  
  if (currentPlayingIndex !== null) {
    const prevBtn = document.getElementById(`play-btn-${currentPlayingIndex}`);
    if (prevBtn) {
      prevBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
      prevBtn.className = 'play-btn';
    }
    if (currentAudio) {
      currentAudio.pause();
    }
  }
  
  log(`Iniciando streaming local para: ${filename.split('/').pop()}`, 'info');
  currentPlayingIndex = index;
  btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
  btn.className = 'play-btn playing';
  
  currentAudio = new Audio(`/api/audio/stream?path=${encodeURIComponent(state.workspacePath)}&file=${encodeURIComponent(filename)}`);
  currentAudio.play().catch(err => {
    log(`Error al reproducir audio: ${err.message}`, 'error');
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
    btn.className = 'play-btn';
    currentAudio = null;
    currentPlayingIndex = null;
  });
  
  currentAudio.onended = () => {
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
    btn.className = 'play-btn';
    currentAudio = null;
    currentPlayingIndex = null;
    log(`Terminó la reproducción de: ${filename.split('/').pop()}`, 'info');
  };
}

// Marker quick addition handler
function addMarkerFromForm() {
  const name = newMarkerName.value.trim();
  const locRaw = newMarkerLocation.value.trim();
  const comments = newMarkerComments.value.trim();
  
  if (!name || !locRaw) {
    log('Por favor completa el nombre y la posición del marcador.', 'warning');
    return;
  }
  
  const frameRate = state.detectedPt ? getFpsFromFormat(state.detectedPt.timecode_format) : 24.0;
  const startTc = state.detectedPt ? state.detectedPt.session_start : "00:00:00:00";
  const seconds = timecodeToSeconds(locRaw, frameRate, state.config.bpm, startTc);
  
  const newMarker = {
    index: state.config.markers.length + 1,
    location_raw: locRaw,
    location_seconds: seconds,
    name: name,
    comments: comments || '--'
  };
  
  state.config.markers.push(newMarker);
  state.config.markers.sort((a, b) => a.location_seconds - b.location_seconds);
  state.config.markers.forEach((m, idx) => m.index = idx + 1);
  
  newMarkerName.value = '';
  newMarkerLocation.value = '';
  newMarkerComments.value = '';
  
  log(`Marcador '${name}' agregado con éxito en ${seconds.toFixed(2)}s.`, 'info');
  saveConfig();
  updateUI();
}

// Delete marker helper
function deleteMarker(index) {
  state.config.markers.splice(index, 1);
  state.config.markers.forEach((m, idx) => m.index = idx + 1);
  
  log('Marcador eliminado de la sesión.', 'info');
  saveConfig();
  updateUI();
}

// REST Client: Analyze phase relationship between two audio channels
async function checkPhaseCorrelation() {
  const f1 = phaseFile1.value;
  const f2 = phaseFile2.value;
  
  if (!f1 || !f2) {
    log('Selecciona dos pistas de audio para el análisis de fase.', 'warning');
    return;
  }
  
  if (f1 === f2) {
    log('Selecciona dos archivos de audio diferentes.', 'warning');
    return;
  }
  
  log(`Analizando relación de fase entre ${f1.split('/').pop()} y ${f2.split('/').pop()}...`, 'system');
  checkPhaseBtn.disabled = true;
  
  try {
    const res = await fetch(`/api/audio/phase-correlation?path=${encodeURIComponent(state.workspacePath)}&file1=${encodeURIComponent(f1)}&file2=${encodeURIComponent(f2)}`);
    const data = await res.json();
    
    if (!res.ok) {
      log(`Fallo al medir correlación de fase: ${data.error}`, 'error');
      checkPhaseBtn.disabled = false;
      return;
    }
    
    const corr = data.correlation;
    
    const pct = ((corr + 1.0) / 2.0) * 100;
    phasePointer.style.left = `${pct}%`;
    
    if (corr < -0.25) {
      phaseResultLabel.innerHTML = `<span style="color: var(--accent-pink); font-weight:700;">⚠️ ¡Peligro de Cancelación! Correlación negativa (${corr}). Se aconseja invertir la fase.</span>`;
      log(`[Fase] Advertencia: correlación negativa (${corr}). Riesgo alto de cancelación.`, 'warning');
    } else if (corr <= 0.25) {
      phaseResultLabel.innerHTML = `<span style="color: #ffaa00; font-weight:600;">Señales independientes / Neutras (${corr}). Compatibilidad de mezcla aceptable.</span>`;
      log(`[Fase] Correlación neutral (${corr}). Pistas independientes.`, 'info');
    } else {
      phaseResultLabel.innerHTML = `<span style="color: #00ff66; font-weight:700;">¡Excelente fase! Correlación positiva (${corr}). Alineadas correctamente.</span>`;
      log(`[Fase] Correlación excelente (${corr}). Pistas alineadas en fase.`, 'info');
    }
    
  } catch (err) {
    log(`Error de conexión al analizar fase: ${err.message}`, 'error');
  } finally {
    checkPhaseBtn.disabled = false;
  }
}

// UI Updating Engine
function updateUI() {
  if (state.detectedPt && state.detectedFlp) {
    syncStatusBadge.textContent = 'PT & FL Detectados';
    syncStatusBadge.className = 'daw-badge pt';
    syncStatusBadge.style.background = 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))';
  } else if (state.detectedPt) {
    syncStatusBadge.textContent = 'Pro Tools Detectado';
    syncStatusBadge.className = 'daw-badge pt';
  } else if (state.detectedFlp) {
    syncStatusBadge.textContent = 'FL Studio Detectado';
    syncStatusBadge.className = 'daw-badge fl';
  } else {
    syncStatusBadge.textContent = 'En Espera';
    syncStatusBadge.className = 'daw-badge';
  }
  
  // Render PTSL Live SDK connection state
  if (state.ptsl && state.ptsl.connected) {
    ptslBadge.textContent = 'PTSL Activo';
    ptslBadge.className = 'ptsl-badge connected';
  } else {
    ptslBadge.textContent = 'PTSL';
    ptslBadge.className = 'ptsl-badge disconnected';
  }
  
  let activeBpm = state.config.bpm;
  let activeTimeSig = state.config.time_sig;
  let activeSampleRate = state.config.sample_rate || 48000.0;
  let activeBitDepth = state.config.bit_depth || '24-bit';
  let activeMarkers = state.config.markers;
  
  if (state.detectedPt) {
    activeBpm = state.detectedPt.bpm || activeBpm;
    activeTimeSig = state.detectedPt.time_sig || activeTimeSig;
    activeSampleRate = state.detectedPt.sample_rate || activeSampleRate;
    activeBitDepth = state.detectedPt.bit_depth || activeBitDepth;
    if (state.detectedPt.markers && state.detectedPt.markers.length > 0 && activeMarkers.length === 0) {
      activeMarkers = state.detectedPt.markers;
    }
  } else if (state.detectedFlp) {
    activeBpm = state.detectedFlp.bpm || activeBpm;
    activeTimeSig = state.detectedFlp.time_signature || activeTimeSig;
    if (state.detectedFlp.markers && state.detectedFlp.markers.length > 0 && activeMarkers.length === 0) {
      activeMarkers = state.detectedFlp.markers;
    }
  }
  
  state.config.bpm = activeBpm;
  state.config.time_sig = activeTimeSig;
  state.config.sample_rate = activeSampleRate;
  state.config.bit_depth = activeBitDepth;
  state.config.markers = activeMarkers;
  
  summaryBpm.textContent = `${activeBpm} BPM`;
  summaryKey.textContent = state.config.key || '--';
  summaryTimeSig.textContent = activeTimeSig;
  summaryMarkersCount.textContent = activeMarkers.length;
  
  updateScaleGuideUI();
  populatePhaseSelectors();
  
  refreshNoteMarkerSelectOptions(activeMarkers);
  
  renderTimeline(activeMarkers);
  renderPtSection();
  renderFlSection();
  renderStemAligner(activeSampleRate, activeBitDepth);
  renderMarkersTable(activeMarkers);
  renderNotes();
  
  checkBatchResampleVisibility(activeSampleRate);
  
  downloadMidiBtn.disabled = !state.workspacePath || activeMarkers.length === 0;
  exportReaperBtn.disabled = !state.workspacePath;
  buildPtSessionBtn.disabled = !state.workspacePath || !state.ptsl.connected;
  alignAllBtn.disabled = state.wavFiles.length === 0;
  zipStemsBtn.disabled = !state.workspacePath;
  
  // Refresh button state in wizard mode
  if (viewMode === 'wizard') {
    nextStepBtn.disabled = (currentStep === 1 && !state.workspacePath);
  }
}

// Populate files lists inside Phase Correlation Selects
function populatePhaseSelectors() {
  const val1 = phaseFile1.value;
  const val2 = phaseFile2.value;
  
  phaseFile1.innerHTML = `<option value="">-- Pista 1 --</option>`;
  phaseFile2.innerHTML = `<option value="">-- Pista 2 --</option>`;
  
  state.wavFiles.forEach(w => {
    const name = w.filename.split('/').pop();
    
    const opt1 = document.createElement('option');
    opt1.value = w.filename;
    opt1.textContent = name;
    if (w.filename === val1) opt1.selected = true;
    phaseFile1.appendChild(opt1);
    
    const opt2 = document.createElement('option');
    opt2.value = w.filename;
    opt2.textContent = name;
    if (w.filename === val2) opt2.selected = true;
    phaseFile2.appendChild(opt2);
  });
}

// Check if batch resampler button should show up
function checkBatchResampleVisibility(targetSr) {
  let hasMismatch = false;
  state.wavFiles.forEach(w => {
    if (w.meta && !w.meta.error && w.meta.sample_rate !== targetSr && !w.resampling) {
      hasMismatch = true;
    }
  });
  batchResampleBtn.style.display = hasMismatch ? 'block' : 'none';
}

// Update Musical Theory & Scales Helper panel details
function updateScaleGuideUI() {
  const currentKey = state.config.key || "C Minor";
  scaleProjectKey.textContent = currentKey;
  
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  
  const projectParts = currentKey.split(' ');
  const rootNote = projectParts[0];
  const mode = projectParts.length > 1 ? projectParts[1] : "Major";
  
  const rootIndex = notes.indexOf(rootNote);
  if (rootIndex === -1) {
    scaleKeyNotes.textContent = "--";
    return;
  }
  
  const steps = mode.toLowerCase() === "minor" ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
  const scaleNotes = steps.map(step => notes[(rootIndex + step) % 12]);
  scaleKeyNotes.textContent = scaleNotes.join(', ');
  
  renderPianoKeyboardLayout(scaleNotes, mode.toLowerCase());
  calculateTransposition();
}

// Draw the dynamic piano keys layout inside sidebar
function renderPianoKeyboardLayout(scaleNotes, scaleMode) {
  pianoKeyboard.innerHTML = '';
  
  const keysDef = [
    { note: "C", black: false, freq: 261.63 },
    { note: "C#", black: true, freq: 277.18 },
    { note: "D", black: false, freq: 293.66 },
    { note: "D#", black: true, freq: 311.13 },
    { note: "E", black: false, freq: 329.63 },
    { note: "F", black: false, freq: 349.23 },
    { note: "F#", black: true, freq: 369.99 },
    { note: "G", black: false, freq: 392.00 },
    { note: "G#", black: true, freq: 415.30 },
    { note: "A", black: false, freq: 440.00 },
    { note: "A#", black: true, freq: 466.16 },
    { note: "B", black: false, freq: 493.88 }
  ];
  
  keysDef.forEach(k => {
    const key = document.createElement('div');
    const isInScale = scaleNotes.includes(k.note);
    
    key.className = `piano-key ${k.black ? 'black' : ''} ${isInScale ? 'in-scale' : ''}`;
    key.title = `${k.note} (${isInScale ? 'En Escala' : 'Fuera de Escala'})`;
    
    key.addEventListener('click', () => {
      playPianoSynthBeep(k.freq);
      
      key.classList.add('active');
      setTimeout(() => key.classList.remove('active'), 120);
    });
    
    pianoKeyboard.appendChild(key);
  });
}

// Tone synthesizer using Web Audio API Oscillators
function playPianoSynthBeep(freq) {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.45);
  } catch (e) {
    console.error("Audio Context playback blocked:", e);
  }
}

// Calculate Pitch Shift semitones
function calculateTransposition() {
  const currentKey = state.config.key || "C Minor";
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  
  const projectParts = currentKey.split(' ');
  const projectRoot = projectParts[0];
  const projectMode = projectParts.length > 1 ? projectParts[1] : "Major";
  
  const origRoot = originalScaleSelect.value;
  const origMode = originalModeSelect.value;
  
  const targetIndex = notes.indexOf(projectRoot);
  const origIndex = notes.indexOf(origRoot);
  
  if (targetIndex === -1 || origIndex === -1) return;
  
  let diff = targetIndex - origIndex;
  
  if (diff > 5) diff -= 12;
  if (diff < -6) diff += 12;
  
  const sign = diff >= 0 ? "+" : "";
  let text = `Pitch shift requerido: ${sign}${diff} semitonos`;
  
  if (projectMode.toLowerCase() !== origMode.toLowerCase()) {
    text += ` (Advertencia: Cambio de escala ${origMode} ↔ ${projectMode})`;
  }
  
  transpositionResult.textContent = text;
}

// Populate note marker select dropdown
function refreshNoteMarkerSelectOptions(markers) {
  const currentSel = noteMarkerSelect.value;
  noteMarkerSelect.innerHTML = `<option value="">(Ninguno)</option>`;
  markers.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.name;
    opt.textContent = m.name;
    if (m.name === currentSel) opt.selected = true;
    noteMarkerSelect.appendChild(opt);
  });
}

// Render Timeline
function renderTimeline(markers) {
  timelineTracks.innerHTML = '';
  timelineMarkers.innerHTML = '';
  
  const maxTime = getTimelineDuration();
  
  timelineTicks.innerHTML = `
    <span>Barra 1 (0s)</span>
    <span>${Math.round(maxTime * 0.25)}s</span>
    <span>${Math.round(maxTime * 0.5)}s</span>
    <span>${Math.round(maxTime * 0.75)}s</span>
    <span>${Math.round(maxTime)}s</span>
  `;
  
  const tracksList = [];
  if (state.detectedPt && state.detectedPt.tracks) {
    state.detectedPt.tracks.forEach(t => {
      if (t.clips && t.clips.length > 0) {
        tracksList.push(t);
      }
    });
  }
  
  if (tracksList.length === 0) {
    state.wavFiles.forEach(w => {
      const name = w.filename.split('/').pop();
      tracksList.push({
        name: name,
        clips: [{ name: 'Audio Stem', start_seconds: 0, duration_seconds: w.meta ? w.meta.duration : maxTime }]
      });
    });
  }
  
  if (tracksList.length === 0) {
    timelineTracks.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 20px 0; font-size: 13px;">
        No hay pistas de audio detectadas para la línea de tiempo.
      </div>
    `;
    return;
  }
  
  tracksList.forEach(track => {
    const categoryClass = getTrackCategory(track.name);
    const trackDiv = document.createElement('div');
    trackDiv.className = `timeline-track ${categoryClass}`;
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'timeline-track-name';
    nameSpan.textContent = track.name;
    trackDiv.appendChild(nameSpan);
    
    const clipsArea = document.createElement('div');
    clipsArea.className = 'timeline-clips-area';
    
    if (track.clips) {
      track.clips.forEach(clip => {
        const clipDiv = document.createElement('div');
        clipDiv.className = 'timeline-clip';
        clipDiv.textContent = clip.name;
        
        const startPct = (clip.start_seconds / maxTime) * 100;
        const durPct = (clip.duration_seconds / maxTime) * 100;
        
        clipDiv.style.left = `${startPct}%`;
        clipDiv.style.width = `${Math.max(2, durPct)}%`;
        clipDiv.title = `${clip.name} (Inicia: ${clip.start_seconds.toFixed(2)}s, Duración: ${clip.duration_seconds.toFixed(2)}s)`;
        
        clipsArea.appendChild(clipDiv);
      });
    }
    
    trackDiv.appendChild(clipsArea);
    timelineTracks.appendChild(trackDiv);
  });
  
  markers.forEach(m => {
    const sec = m.location_seconds || 0;
    const pct = (sec / maxTime) * 100;
    
    const pin = document.createElement('div');
    pin.className = 'timeline-marker-pin';
    pin.style.left = `${pct}%`;
    
    pin.innerHTML = `
      <div class="timeline-marker-flag">${m.name}</div>
      <div class="timeline-marker-line"></div>
    `;
    pin.title = `${m.name} - Posición: ${m.location_raw} (${sec.toFixed(2)}s) ${m.comments ? '- ' + m.comments : ''}`;
    
    timelineMarkers.appendChild(pin);
  });
}

// Render Mixer Panel vertical channel faders
function renderMixer() {
  mixerView.innerHTML = '';
  
  if (!state.config.tracks || state.config.tracks.length === 0) {
    mixerView.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); font-size: 13px; width: 100%; padding: 30px;">
        No hay pistas cargadas. Escanea tu proyecto para cargar faders de mezcla.
      </div>
    `;
    return;
  }
  
  state.config.tracks.forEach((track, index) => {
    const strip = document.createElement('div');
    strip.className = 'mixer-strip';
    
    const panId = `pan-${index}`;
    const faderId = `fader-${index}`;
    const muteId = `mute-${index}`;
    const soloId = `solo-${index}`;
    const faderValId = `fader-val-${index}`;
    
    const categoryBorderHex = {
      "category-vocal": "#ff007f",
      "category-drums": "#00f2fe",
      "category-bass": "#00ff66",
      "category-instruments": "#8e2de2",
      "category-other": "#ffaa00"
    }[track.category] || "#ffaa00";
    
    strip.style.borderTop = `3px solid ${categoryBorderHex}`;
    
    strip.innerHTML = `
      <div class="mixer-track-name" title="${track.name}">${track.name}</div>
      
      <!-- Panning knob -->
      <div class="mixer-pan-container">
        <span class="mixer-pan-label">PAN: ${track.pan === 0 ? 'C' : (track.pan > 0 ? 'R'+track.pan : 'L'+Math.abs(track.pan))}</span>
        <input type="range" id="${panId}" class="mixer-pan-slider" min="-1" max="1" step="0.1" value="${track.pan}">
      </div>
      
      <!-- Volume Fader -->
      <div class="mixer-fader-container">
        <input type="range" id="${faderId}" class="mixer-fader" min="-48" max="12" step="0.5" value="${track.volume}">
        <span class="mixer-fader-value" id="${faderValId}">${track.volume === -48 ? '-inf' : track.volume.toFixed(1)} dB</span>
      </div>
      
      <!-- Mute / Solo -->
      <div class="mixer-buttons">
        <button id="${muteId}" class="mixer-btn mute ${track.mute ? 'active' : ''}">M</button>
        <button id="${soloId}" class="mixer-btn solo ${track.solo ? 'active' : ''}">S</button>
      </div>
    `;
    
    mixerView.appendChild(strip);
    
    // Bind mixers sliders events
    const panSlider = document.getElementById(panId);
    panSlider.addEventListener('input', () => {
      const val = parseFloat(panSlider.value);
      track.pan = val;
      const label = strip.querySelector('.mixer-pan-label');
      label.textContent = `PAN: ${val === 0 ? 'C' : (val > 0 ? 'R'+val.toFixed(1) : 'L'+Math.abs(val).toFixed(1))}`;
      saveConfig();
    });
    
    const fader = document.getElementById(faderId);
    fader.addEventListener('input', () => {
      const val = parseFloat(fader.value);
      track.volume = val;
      const displayVal = document.getElementById(faderValId);
      displayVal.textContent = `${val === -48 ? '-inf' : val.toFixed(1)} dB`;
      saveConfig();
    });
    
    const muteBtn = document.getElementById(muteId);
    muteBtn.addEventListener('click', () => {
      track.mute = !track.mute;
      muteBtn.className = `mixer-btn mute ${track.mute ? 'active' : ''}`;
      saveConfig();
    });
    
    const soloBtn = document.getElementById(soloId);
    soloBtn.addEventListener('click', () => {
      track.solo = !track.solo;
      soloBtn.className = `mixer-btn solo ${track.solo ? 'active' : ''}`;
      saveConfig();
    });
  });
}

// Render Pro Tools details in DAW box
function renderPtSection() {
  if (!state.detectedPt) {
    ptInfoArea.innerHTML = `<span style="color: var(--text-muted);">Sin datos de Pro Tools.</span>`;
    return;
  }
  
  let html = `
    <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 6px; border: 1px solid var(--border-light);">
      <div style="font-weight:600; color:var(--accent-cyan); margin-bottom:6px;">${state.detectedPt.name}</div>
      <div>Sample Rate: ${state.detectedPt.sample_rate} Hz</div>
      <div>Format: ${state.detectedPt.bit_depth} / ${state.detectedPt.timecode_format}</div>
      <div style="margin-top:6px; font-size:12px; color:var(--text-muted);">
        Tracks: ${state.detectedPt.tracks.length} | Marcadores: ${state.detectedPt.markers.length}
      </div>
    </div>
  `;
  ptInfoArea.innerHTML = html;
}

// Render FL Studio details in DAW box including Mixer channels list
function renderFlSection() {
  if (!state.detectedFlp) {
    flInfoArea.innerHTML = `<span style="color: var(--text-muted);">Sin datos de FL Studio (.flp).</span>`;
    importFlpDataBtn.disabled = true;
    return;
  }
  
  let errText = '';
  if (state.detectedFlp.error) {
    errText = `<div style="color: var(--accent-pink); font-size:11px; margin-top:5px;">⚠️ ${state.detectedFlp.error}</div>`;
  }
  
  let tracksHtml = '';
  if (state.detectedFlp.tracks && state.detectedFlp.tracks.length > 0) {
    tracksHtml = `
      <div style="font-size: 11px; font-weight: 600; color: #be8eff; margin-top: 8px; margin-bottom: 4px;">Canales de Mezcla FL Studio:</div>
      <div style="max-height: 120px; overflow-y: auto; background: rgba(0,0,0,0.3); border-radius: 6px; padding: 6px; border: 1px solid var(--border-light); display: flex; flex-direction: column; gap: 4px;">
    `;
    state.detectedFlp.tracks.forEach(t => {
      const panStr = t.pan === 0 ? 'C' : (t.pan > 0 ? 'R'+t.pan : 'L'+Math.abs(t.pan));
      const fxStr = t.plugins && t.plugins.length > 0 ? ` [${t.plugins.join(', ')}]` : '';
      tracksHtml += `
        <div style="display: flex; justify-content: space-between; font-size: 11px; padding: 2px 4px; border-bottom: 1px solid rgba(255,255,255,0.02);">
          <span style="color:#fff; font-weight:500;">${t.name}</span>
          <span style="color:var(--text-muted); font-size:10px;">${t.volume}dB | Pan:${panStr}${fxStr}</span>
        </div>
      `;
    });
    tracksHtml += `</div>`;
  }
  
  let html = `
    <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 6px; border: 1px solid var(--border-light);">
      <div style="font-weight:600; color:#be8eff; margin-bottom:6px;">Project: ${state.detectedFlp.bpm} BPM</div>
      <div>Métrica: ${state.detectedFlp.time_signature}</div>
      <div>Pistas detectadas: ${state.detectedFlp.tracks.length}</div>
      ${tracksHtml}
      ${errText}
    </div>
  `;
  flInfoArea.innerHTML = html;
  importFlpDataBtn.disabled = !!state.detectedFlp.error;
}

// Render Stems Aligner File List with Fuzzy name checkers & background resample markers
function renderStemAligner(targetSampleRate, targetBitDepth) {
  audioFileList.innerHTML = '';
  if (state.wavFiles.length === 0) {
    audioFileList.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); font-size: 12px; padding: 15px 0;">
        No se han detectado archivos WAV en el directorio.
      </div>
    `;
    return;
  }
  
  state.wavFiles.forEach((fileObj, index) => {
    const filename = fileObj.filename;
    const basename = filename.split('/').pop();
    const meta = fileObj.meta;
    
    // Fuzzy matching alignment start offsets suggestions!
    let matchedOffset = 0.0;
    let matchStr = '';
    let isMatched = false;
    
    if (state.detectedPt && state.detectedPt.tracks) {
      const pttNames = state.detectedPt.tracks.map(t => t.name);
      const matchedTrackName = fuzzyMatchTrackJs(basename, pttNames);
      
      if (matchedTrackName) {
        const matchedTrack = state.detectedPt.tracks.find(t => t.name === matchedTrackName);
        if (matchedTrack && matchedTrack.clips && matchedTrack.clips.length > 0) {
          matchedOffset = matchedTrack.clips[0].start_seconds;
          matchStr = `<span style="color:var(--accent-cyan); font-size:10px;">(Auto-sugerido track '${matchedTrackName}')</span>`;
          isMatched = true;
        }
      }
    }
    
    // Format diagnostics check warnings & Auto-Conformer active animations
    let diagnosticHtml = '';
    let resampleButtonId = `resample-btn-${index}`;
    const stBadge = fileObj.is_joined_stereo ? `<span class="stereo-joined-badge" title="Estéreo Consolidado automáticamente">[ST]</span>` : '';
    
    // Auto-Gain staging advice indicators
    const gainStagingHtml = (meta && meta.suggested_gain !== undefined && meta.suggested_gain !== 0) ? `
      <span class="warning-badge" style="background: rgba(0, 255, 102, 0.08); color: #00ff66; border-color: rgba(0, 255, 102, 0.2);" title="Ajuste sugerido en el mezclador virtual para lograr sonoridad de -18dB RMS.">
        Gain Stage: ${meta.suggested_gain > 0 ? '+' : ''}${meta.suggested_gain} dB
      </span>
    ` : '';
    
    if (fileObj.resampling) {
      diagnosticHtml = `
        <div class="warning-badge-container">
          <span class="warning-badge resampling" style="background: linear-gradient(90deg, #ffaa00, #ff5500); animation: pulse 1.5s infinite; color:#fff;" title="Este archivo se está remuestreando automáticamente en segundo plano.">
            🔄 Auto-remuestreando...
          </span>
        </div>
      `;
    } else if (fileObj.joining) {
      diagnosticHtml = `
        <div class="warning-badge-container">
          <span class="warning-badge" style="background: linear-gradient(90deg, #00f2fe, #8e2de2); color:#fff;" title="Uniendo split-mono a estéreo...">
            🔄 Consolidando Estéreo...
          </span>
        </div>
      `;
    } else if (meta && !meta.error) {
      const srMismatch = meta.sample_rate !== targetSampleRate;
      const bdMismatch = meta.bit_depth !== parseInt(targetBitDepth);
      
      if (srMismatch || bdMismatch) {
        let warnText = '';
        if (srMismatch) warnText += `${meta.sample_rate}Hz (Target: ${targetSampleRate}Hz) `;
        if (bdMismatch) warnText += `${meta.bit_depth}-bit `;
        
        diagnosticHtml = `
          <div class="warning-badge-container">
            <span class="warning-badge" title="Este archivo no coincide con los formatos del proyecto y puede causar desfases de velocidad o tono.">
              ⚠️ ${warnText}
            </span>
            ${srMismatch ? `<button id="${resampleButtonId}" class="btn-resample">🔄 Resample</button>` : ''}
            ${gainStagingHtml}
          </div>
        `;
      } else {
        diagnosticHtml = `
          <div style="display:flex; flex-direction:column; gap:4px; margin-top:2px;">
            <div style="font-size:10px; color:rgba(0, 255, 102, 0.6);">Format matches project (${meta.sample_rate}Hz, ${meta.bit_depth}-bit)</div>
            <div style="display:flex; gap:6px;">${gainStagingHtml}</div>
          </div>
        `;
      }
    } else if (meta && meta.error) {
      diagnosticHtml = `<div style="font-size:10px; color:var(--accent-pink); margin-top:2px;">Fallo lectura: ${meta.error}</div>`;
    }
    
    const playBtnId = `play-btn-${index}`;
    const nameId = `file-name-${index}`;
    const fileRow = document.createElement('div');
    fileRow.className = 'file-item';
    fileRow.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px; flex-grow:1; overflow:hidden;">
        <button id="${playBtnId}" class="play-btn" title="Escuchar audio">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <input type="checkbox" class="align-checkbox" data-index="${index}" ${isMatched ? 'checked' : ''}>
        <div style="display:flex; flex-direction:column; overflow:hidden;">
          <span class="file-name" id="${nameId}" title="Click para ver forma de onda">${basename} ${stBadge}</span>
          ${matchStr}
          ${diagnosticHtml}
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:11px; color:var(--text-muted);">Silencio:</span>
        <input type="number" step="0.001" id="offset-${index}" class="input-glow" style="width:75px; padding:4px 8px; text-align:right;" value="${matchedOffset}">
        <span style="font-size:11px; color:var(--text-muted);">s</span>
      </div>
    `;
    
    audioFileList.appendChild(fileRow);
    
    document.getElementById(playBtnId).addEventListener('click', () => toggleAudio(filename, playBtnId, index));
    document.getElementById(nameId).addEventListener('click', () => showWaveformVisualizer(filename, index));
    
    const resampleBtn = document.getElementById(resampleButtonId);
    if (resampleBtn) {
      resampleBtn.addEventListener('click', () => resampleAudioFile(filename, targetSampleRate));
    }
  });
}

// Fuzzy matching JS implementation helper
function fuzzyMatchTrackJs(filename, trackList) {
  let base = filename.toLowerCase().replace(".wav", "");
  base = base.replace(/(_consolidated|_bip|_mixdown|_take\d*|_\d+|-\d+|\s+)/g, '');
  base = base.replace(/[^a-z0-9]/g, '');
  
  let bestMatch = null;
  let bestScore = 0.0;
  
  for (let i = 0; i < trackList.length; i++) {
    let track = trackList[i];
    let tNorm = track.toLowerCase();
    tNorm = tNorm.replace(/(_consolidated|_bip|_mixdown|_take\d*|_\d+|-\d+|\s+)/g, '');
    tNorm = tNorm.replace(/[^a-z0-9]/g, '');
    
    if (!tNorm) continue;
    
    if (base === tNorm) {
      return track;
    } else if (base.includes(tNorm) || tNorm.includes(base)) {
      let score = Math.min(base.length, tNorm.length) / Math.max(base.length, tNorm.length);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = track;
      }
    }
  }
  if (bestScore > 0.4) {
    return bestMatch;
  }
  return null;
}

// Render Markers Table
function renderMarkersTable(markers) {
  markersTableBody.innerHTML = '';
  if (!markers || markers.length === 0) {
    markersTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">
          No hay marcadores cargados en la sesión.
        </td>
      </tr>
    `;
    return;
  }
  
  markers.forEach((m, idx) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="color: var(--accent-cyan); font-weight:600;">${m.index || '#'}</td>
      <td style="font-family: monospace;">${m.location_raw}</td>
      <td>${(m.location_seconds || 0).toFixed(2)}s</td>
      <td style="font-weight: 500; color: #fff;">${m.name}</td>
      <td style="color: var(--text-muted); font-style: italic;">${m.comments || '--'}</td>
      <td style="text-align: center;">
        <button class="delete-btn" data-index="${idx}" title="Eliminar marcador">×</button>
      </td>
    `;
    markersTableBody.appendChild(row);
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      deleteMarker(index);
    });
  });
}

// Render Notes Board with seeking badges
function renderNotes() {
  notesList.innerHTML = '';
  if (!state.config.notes || state.config.notes.length === 0) {
    notesList.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px 0;">
        No hay notas registradas para este proyecto.
      </div>
    `;
    return;
  }
  
  state.config.notes.forEach((note, idx) => {
    const card = document.createElement('div');
    card.className = 'note-card';
    if (note.author.includes('FL Studio')) {
      card.style.borderLeftColor = 'var(--accent-violet)';
    }
    
    let seekBadge = '';
    if (note.seconds !== undefined) {
      seekBadge = `<span class="timestamp-badge note-seek-badge" data-seconds="${note.seconds}" title="Click para escuchar desde aquí">⏱️ ${note.label || note.seconds.toFixed(1) + 's'}</span>`;
    }
    
    card.innerHTML = `
      <div class="note-header">
        <span class="note-author" style="color: ${note.author.includes('FL Studio') ? '#be8eff' : 'var(--accent-cyan)'}">${note.author}</span>
        <span>${note.timestamp}</span>
      </div>
      <div class="note-content">
        ${note.text} ${seekBadge}
      </div>
    `;
    notesList.appendChild(card);
  });
  
  document.querySelectorAll('.note-seek-badge').forEach(badge => {
    badge.addEventListener('click', (e) => {
      const seconds = parseFloat(e.target.dataset.seconds);
      if (currentAudio) {
        currentAudio.currentTime = seconds;
        log(`Buscando reproducción en segundo: ${seconds.toFixed(2)}`, 'info');
      } else {
        log('Inicia la reproducción de una pista para poder saltar al segundo indicado.', 'warning');
      }
    });
  });
  
  notesList.scrollTop = notesList.scrollHeight;
}

// Parser support functions
function getFpsFromFormat(tcFormatStr) {
  const s = tcFormatStr.toLowerCase();
  if (s.includes("23.976")) return 23.976;
  if (s.includes("24")) return 24.0;
  if (s.includes("25")) return 25.0;
  if (s.includes("29.97")) return 29.97;
  if (s.includes("30")) return 30.0;
  return 24.0;
}

function timecodeToSeconds(tcStr, frameRate = 24.0, bpm = 120.0, startTc = "00:00:00:00") {
  tcStr = tcStr.trim();
  if (!tcStr) return 0.0;
  
  if (tcStr.includes('|')) {
    const parts = tcStr.split('|');
    if (parts.length >= 2) {
      const bar = parseInt(parts[0]) || 1;
      const beat = parseInt(parts[1]) || 1;
      const tick = parts.length > 2 ? parseInt(parts[2]) : 0;
      const relativeBars = Math.max(0, bar - 1);
      const relativeBeats = Math.max(0, beat - 1);
      const ticksOffset = relativeBars * 4 * 960 + relativeBeats * 960 + tick;
      return (ticksOffset / 960.0) * (60.0 / bpm);
    }
  }
  
  const tcParts = tcStr.split(/[:\.]/);
  if (tcParts.length === 4) {
    try {
      const h = parseFloat(tcParts[0]);
      const m = parseFloat(tcParts[1]);
      const s = parseFloat(tcParts[2]);
      const f = parseFloat(tcParts[3]);
      const totalSec = h * 3600.0 + m * 60.0 + s + f / frameRate;
      
      const startParts = startTc.split(/[:\.]/);
      let startSec = 0.0;
      if (startParts.length === 4) {
        const sh = parseFloat(startParts[0]);
        const sm = parseFloat(startParts[1]);
        const ss = parseFloat(startParts[2]);
        const sf = parseFloat(startParts[3]);
        startSec = sh * 3600.0 + sm * 60.0 + ss + sf / frameRate;
      }
      return Math.max(0.0, totalSec - startSec);
    } catch (e) {}
  }
  
  if (tcStr.includes(':')) {
    const parts = tcStr.split(':');
    try {
      if (parts.length === 2) return parseFloat(parts[0]) * 60.0 + parseFloat(parts[1]);
      if (parts.length === 3) return parseFloat(parts[0]) * 3600.0 + parseFloat(parts[1]) * 60.0 + parseFloat(parts[2]);
    } catch(e) {}
  }
  
  return parseFloat(tcStr) || 0.0;
}
