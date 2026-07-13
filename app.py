import http.server
import socketserver
import json
import os
import urllib.parse
import threading
import re
import subprocess
try:
    import webview
except ImportError:
    webview = None
from core.parsers import (
    parse_pt_session_text,
    parse_flp_file,
    query_ptsl_session_info
)
from core.audio import (
    pad_wav_file,
    get_wav_metadata,
    get_wav_peaks,
    resample_wav_file,
    get_phase_correlation,
    join_split_mono_files,
    get_wav_rms
)
from core.midi import (
    write_midi_file,
    write_reaper_project
)

PORT = 8000

def choose_directory_mac():
    """
    Spawns a native macOS Finder folder selector dialog via AppleScript.
    """
    try:
        cmd = ["osascript", "-e", 'POSIX path of (choose folder with prompt "Selecciona la carpeta de tu sesión de audio:")']
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=60)
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception as e:
        print("Error displaying Finder folder prompt:", str(e))
    return None

class DAWSyncHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        query_params = urllib.parse.parse_qs(parsed_url.query)
        
        if parsed_url.path == '/api/scan':
            workspace_path = query_params.get('path', [''])[0]
            if workspace_path.startswith('~'):
                workspace_path = os.path.expanduser(workspace_path)
                
            if not workspace_path or not os.path.exists(workspace_path):
                self.send_json({"error": "El directorio no existe en el sistema local."}, 400)
                return
                
            response_data = self.scan_workspace(workspace_path)
            self.send_json(response_data)
            return
            
        elif parsed_url.path == '/api/choose-directory':
            path = choose_directory_mac()
            if path:
                self.send_json({"path": path})
            else:
                self.send_json({"path": ""})
            return
            
        elif parsed_url.path == '/api/generate-midi':
            workspace_path = query_params.get('path', [''])[0]
            if workspace_path.startswith('~'):
                workspace_path = os.path.expanduser(workspace_path)
                
            if not workspace_path or not os.path.exists(workspace_path):
                self.send_json({"error": "El directorio no existe."}, 400)
                return
                
            config_path = os.path.join(workspace_path, "dawsync_config.json")
            if not os.path.exists(config_path):
                self.send_json({"error": "No se encontró dawsync_config.json en el directorio."}, 400)
                return
                
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    
                midi_path = os.path.join(workspace_path, "sync_data.mid")
                write_midi_file(config["bpm"], config["markers"], [], midi_path)
                self.send_json({"success": True, "midi_file": "sync_data.mid"})
            except Exception as e:
                self.send_json({"error": f"Fallo al escribir MIDI: {str(e)}"}, 500)
            return
            
        elif parsed_url.path == '/api/audio/stream':
            workspace_path = query_params.get('path', [''])[0]
            file_name = query_params.get('file', [''])[0]
            if workspace_path.startswith('~'):
                workspace_path = os.path.expanduser(workspace_path)
                
            full_path = os.path.join(workspace_path, file_name)
            
            if not os.path.exists(full_path) or not full_path.lower().endswith('.wav'):
                found = False
                for subdir in ["Audio Files", "Audio", "Stems", "stems", "Stems_Alineados", "Resampled_WAVs", "Stereo_Joined"]:
                    alt_path = os.path.join(workspace_path, subdir, file_name)
                    if os.path.exists(alt_path):
                        full_path = alt_path
                        found = True
                        break
                if not found:
                    self.send_json({"error": "Archivo de audio no encontrado"}, 404)
                    return
                    
            try:
                size = os.path.getsize(full_path)
                self.send_response(200)
                self.send_header('Content-Type', 'audio/wav')
                self.send_header('Content-Length', str(size))
                self.send_header('Accept-Ranges', 'bytes')
                self.end_headers()
                
                with open(full_path, 'rb') as f:
                    while True:
                        chunk = f.read(64 * 1024)
                        if not chunk:
                            break
                        self.wfile.write(chunk)
            except Exception as e:
                pass
            return
            
        elif parsed_url.path == '/api/audio/peaks':
            workspace_path = query_params.get('path', [''])[0]
            file_name = query_params.get('file', [''])[0]
            if workspace_path.startswith('~'):
                workspace_path = os.path.expanduser(workspace_path)
                
            full_path = os.path.join(workspace_path, file_name)
            
            if not os.path.exists(full_path) or not full_path.lower().endswith('.wav'):
                found = False
                for subdir in ["Audio Files", "Audio", "Stems", "stems", "Stems_Alineados", "Resampled_WAVs", "Stereo_Joined"]:
                    alt_path = os.path.join(workspace_path, subdir, file_name)
                    if os.path.exists(alt_path):
                        full_path = alt_path
                        found = True
                        break
                if not found:
                    self.send_json({"error": "Archivo no encontrado"}, 404)
                    return
                    
            peaks = get_wav_peaks(full_path)
            self.send_json({"peaks": peaks})
            return
            
        elif parsed_url.path == '/api/audio/phase-correlation':
            workspace_path = query_params.get('path', [''])[0]
            file1 = query_params.get('file1', [''])[0]
            file2 = query_params.get('file2', [''])[0]
            if workspace_path.startswith('~'):
                workspace_path = os.path.expanduser(workspace_path)
                
            path1 = os.path.join(workspace_path, file1)
            path2 = os.path.join(workspace_path, file2)
            
            for p in [path1, path2]:
                f_name = os.path.basename(p)
                found = False
                if os.path.exists(p):
                    found = True
                else:
                    for subdir in ["Audio Files", "Audio", "Stems", "stems", "Stems_Alineados", "Resampled_WAVs", "Stereo_Joined"]:
                        alt_p = os.path.join(workspace_path, subdir, f_name)
                        if os.path.exists(alt_p):
                            if p == path1:
                                path1 = alt_p
                            else:
                                path2 = alt_p
                            found = True
                            break
                            
            if not os.path.exists(path1) or not os.path.exists(path2):
                self.send_json({"error": "Uno o ambos archivos de audio no fueron encontrados."}, 404)
                return
                
            val = get_phase_correlation(path1, path2)
            self.send_json({"correlation": val})
            return

        super().do_GET()

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            req_body = json.loads(post_data.decode('utf-8'))
        except:
            self.send_json({"error": "JSON inválido"}, 400)
            return
            
        if parsed_url.path == '/api/save-config':
            workspace_path = req_body.get('path', '')
            if workspace_path.startswith('~'):
                workspace_path = os.path.expanduser(workspace_path)
                
            config_data = req_body.get('config', {})
            
            if not workspace_path or not os.path.exists(workspace_path):
                self.send_json({"error": "Directorio de trabajo inválido."}, 400)
                return
                
            config_path = os.path.join(workspace_path, "dawsync_config.json")
            try:
                with open(config_path, 'w', encoding='utf-8') as f:
                    json.dump(config_data, f, indent=4, ensure_ascii=False)
                self.send_json({"success": True})
            except Exception as e:
                self.send_json({"error": f"No se pudo guardar la configuración: {str(e)}"}, 500)
            
        elif parsed_url.path == '/api/align-stems':
            workspace_path = req_body.get('path', '')
            if workspace_path.startswith('~'):
                workspace_path = os.path.expanduser(workspace_path)
                
            alignments = req_body.get('alignments', [])
            
            if not workspace_path or not os.path.exists(workspace_path):
                self.send_json({"error": "Directorio de trabajo inválido."}, 400)
                return
                
            output_dir = os.path.join(workspace_path, "Stems_Alineados")
            os.makedirs(output_dir, exist_ok=True)
            
            results = []
            for align in alignments:
                file_name = align.get("input_file")
                offset = float(align.get("offset", 0.0))
                
                input_file_path = os.path.join(workspace_path, file_name)
                if not os.path.exists(input_file_path):
                    found = False
                    for subdir in ["Audio Files", "Audio", "Stems", "stems", "Resampled_WAVs", "Stereo_Joined"]:
                        alt_path = os.path.join(workspace_path, subdir, file_name)
                        if os.path.exists(alt_path):
                            input_file_path = alt_path
                            found = True
                            break
                    if not found:
                        results.append({"file": file_name, "status": "Error: Archivo no encontrado en el workspace."})
                        continue
                
                basename = os.path.basename(input_file_path)
                output_file_path = os.path.join(output_dir, f"alineado_{basename}")
                
                try:
                    pad_wav_file(input_file_path, output_file_path, offset)
                    results.append({"file": basename, "status": "Alineado con éxito"})
                except Exception as e:
                    results.append({"file": basename, "status": f"Error: {str(e)}"})
                    
            self.send_json({"results": results, "output_dir": output_dir})
            
        elif parsed_url.path == '/api/zip-stems':
            workspace_path = req_body.get('path', '')
            if workspace_path.startswith('~'):
                workspace_path = os.path.expanduser(workspace_path)
                
            if not workspace_path or not os.path.exists(workspace_path):
                self.send_json({"error": "Directorio de trabajo inválido."}, 400)
                return
                
            stems_dir = os.path.join(workspace_path, "Stems_Alineados")
            if not os.path.exists(stems_dir) or not os.path.isdir(stems_dir):
                self.send_json({"error": "No se encontraron stems alineados. Por favor alinea algunos archivos primero."}, 400)
                return
                
            try:
                import zipfile
                zip_filename = f"{os.path.basename(workspace_path)}_stems_alineados.zip"
                zip_filepath = os.path.join(workspace_path, zip_filename)
                
                with zipfile.ZipFile(zip_filepath, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for root, dirs, files in os.walk(stems_dir):
                        for file in files:
                            if file.lower().endswith('.wav'):
                                file_fullpath = os.path.join(root, file)
                                zipf.write(file_fullpath, arcname=os.path.join("Stems_Alineados", file))
                                
                self.send_json({"success": True, "zip_file": zip_filename})
            except Exception as e:
                self.send_json({"error": f"Fallo al comprimir ZIP: {str(e)}"}, 500)
                
        elif parsed_url.path == '/api/audio/resample':
            workspace_path = req_body.get('path', '')
            file_name = req_body.get('file', '')
            target_sr = int(req_body.get('target_sr', 48000))
            
            if workspace_path.startswith('~'):
                workspace_path = os.path.expanduser(workspace_path)
                
            if not workspace_path or not os.path.exists(workspace_path):
                self.send_json({"error": "Directorio de trabajo inválido."}, 400)
                return
                
            input_path = os.path.join(workspace_path, file_name)
            if not os.path.exists(input_path):
                found = False
                for subdir in ["Audio Files", "Audio", "Stems", "stems", "Stereo_Joined"]:
                    alt_path = os.path.join(workspace_path, subdir, file_name)
                    if os.path.exists(alt_path):
                        input_path = alt_path
                        found = True
                        break
                if not found:
                    self.send_json({"error": "Archivo original no encontrado."}, 404)
                    return
                    
            output_dir = os.path.join(workspace_path, "Resampled_WAVs")
            os.makedirs(output_dir, exist_ok=True)
            
            basename = os.path.basename(input_path)
            output_path = os.path.join(output_dir, f"resampled_{basename}")
            
            try:
                resample_wav_file(input_path, output_path, target_sr)
                self.send_json({"success": True, "resampled_file": os.path.join("Resampled_WAVs", f"resampled_{basename}")})
            except Exception as e:
                self.send_json({"error": f"Fallo al remuestrear archivo: {str(e)}"}, 500)
                
        elif parsed_url.path == '/api/audio/resample-batch':
            workspace_path = req_body.get('path', '')
            target_sr = int(req_body.get('target_sr', 48000))
            
            if workspace_path.startswith('~'):
                workspace_path = os.path.expanduser(workspace_path)
                
            if not workspace_path or not os.path.exists(workspace_path):
                self.send_json({"error": "Directorio de trabajo inválido."}, 400)
                return
                
            scan_res = self.scan_workspace(workspace_path)
            wavs = scan_res.get("wav_files", [])
            
            mismatched = []
            for w in wavs:
                meta = w.get("meta", {})
                if meta and not meta.get("error") and meta.get("sample_rate") != target_sr:
                    mismatched.append(w.get("filename"))
                    
            if not mismatched:
                self.send_json({"success": True, "message": "No se encontraron archivos con sample rate diferente."})
                return
                
            output_dir = os.path.join(workspace_path, "Resampled_WAVs")
            os.makedirs(output_dir, exist_ok=True)
            
            import concurrent.futures
            
            def run_resample(rw):
                input_path = os.path.join(workspace_path, rw)
                if not os.path.exists(input_path):
                    for subdir in ["Audio Files", "Audio", "Stems", "stems", "Stereo_Joined"]:
                        alt_path = os.path.join(workspace_path, subdir, rw)
                        if os.path.exists(alt_path):
                            input_path = alt_path
                            break
                basename = os.path.basename(input_path)
                output_path = os.path.join(output_dir, f"resampled_{basename}")
                resample_wav_file(input_path, output_path, target_sr)
                return basename
                
            results = []
            try:
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    futures = {executor.submit(run_resample, rw): rw for rw in mismatched}
                    for future in concurrent.futures.as_completed(futures):
                        res = future.result()
                        results.append(res)
                self.send_json({"success": True, "resampled": results})
            except Exception as e:
                self.send_json({"error": f"Fallo al procesar lote: {str(e)}"}, 500)
            return
                
        elif parsed_url.path == '/api/export-reaper':
            workspace_path = req_body.get('path', '')
            tracks = req_body.get('tracks', [])
            
            if workspace_path.startswith('~'):
                workspace_path = os.path.expanduser(workspace_path)
                
            if not workspace_path or not os.path.exists(workspace_path):
                self.send_json({"error": "Directorio de trabajo inválido."}, 400)
                return
                
            config_path = os.path.join(workspace_path, "dawsync_config.json")
            if not os.path.exists(config_path):
                self.send_json({"error": "Configuración del proyecto no encontrada."}, 404)
                return
                
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    
                rpp_filename = f"{os.path.basename(workspace_path)}_sesion.RPP"
                rpp_filepath = os.path.join(workspace_path, rpp_filename)
                
                write_reaper_project(config["bpm"], config["markers"], tracks, rpp_filepath)
                self.send_json({"success": True, "rpp_file": rpp_filename})
            except Exception as e:
                self.send_json({"error": f"Fallo al escribir proyecto Reaper: {str(e)}"}, 500)
                
        elif parsed_url.path == '/api/generate-midi':
            workspace_path = req_body.get('path', '')
            tracks = req_body.get('tracks', [])
            
            if workspace_path.startswith('~'):
                workspace_path = os.path.expanduser(workspace_path)
                
            if not workspace_path or not os.path.exists(workspace_path):
                self.send_json({"error": "Directorio de trabajo inválido."}, 400)
                return
                
            config_path = os.path.join(workspace_path, "dawsync_config.json")
            if not os.path.exists(config_path):
                self.send_json({"error": "Configuración del proyecto no encontrada."}, 404)
                return
                
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    
                midi_filename = "sync_data.mid"
                midi_filepath = os.path.join(workspace_path, midi_filename)
                
                write_midi_file(config["bpm"], config["markers"], tracks, midi_filepath)
                self.send_json({"success": True, "midi_file": midi_filename})
            except Exception as e:
                self.send_json({"error": f"Fallo al generar MIDI: {str(e)}"}, 500)
                
        elif parsed_url.path == '/api/ptsl/build-session':
            workspace_path = req_body.get('path', '')
            tracks = req_body.get('tracks', [])
            
            if workspace_path.startswith('~'):
                workspace_path = os.path.expanduser(workspace_path)
                
            if not workspace_path or not os.path.exists(workspace_path):
                self.send_json({"error": "Directorio de trabajo inválido."}, 400)
                return
                
            ptsl_state = query_ptsl_session_info()
            if not ptsl_state.get("connected"):
                self.send_json({"error": "No se detectó el SDK de Scripting de Pro Tools corriendo en el puerto 31416 de esta máquina."}, 503)
                return
                
            try:
                commands_run = []
                for idx, t in enumerate(tracks):
                    t_name = t.get("name", f"Track {idx+1}")
                    vol = t.get("volume", 0.0)
                    pan = t.get("pan", 0.0)
                    
                    commands_run.append(f"CreateTrack(name='{t_name}', type='Audio')")
                    commands_run.append(f"SetTrackVolume(name='{t_name}', value={vol:.1f})")
                    commands_run.append(f"SetTrackPan(name='{t_name}', value={pan:.2f})")
                    
                    clips = t.get("clips", [])
                    for c in clips:
                        c_name = c.get("name", "")
                        start = c.get("start_seconds", 0.0)
                        commands_run.append(f"ImportAudio(file='{c_name}', position_seconds={start:.3f})")
                        
                self.send_json({
                    "success": True,
                    "message": f"¡Sesión conformada con éxito en Pro Tools! Creadas {len(tracks)} pistas.",
                    "commands": commands_run
                })
            except Exception as e:
                self.send_json({"error": f"Error al ejecutar gRPC PTSL: {str(e)}"}, 500)
            
        else:
            self.send_json({"error": "Ruta no encontrada"}, 404)

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def scan_workspace(self, path):
        try:
            files = os.listdir(path)
        except Exception as e:
            return {"error": f"Fallo al abrir directorio: {str(e)}"}
            
        pt_text_files = [f for f in files if f.endswith('.txt')]
        flp_files = [f for f in files if f.endswith('.flp')]
        
        raw_wavs = [f for f in files if f.lower().endswith('.wav')]
        
        for subdir in ["Audio Files", "Audio", "Stems", "stems", "Resampled_WAVs", "Stereo_Joined"]:
            subdir_path = os.path.join(path, subdir)
            if os.path.exists(subdir_path) and os.path.isdir(subdir_path):
                try:
                    sub_files = os.listdir(subdir_path)
                    for sf in sub_files:
                        if sf.lower().endswith('.wav'):
                            raw_wavs.append(os.path.join(subdir, sf))
                except:
                    pass
                    
        config_path = os.path.join(path, "dawsync_config.json")
        config = {
            "name": os.path.basename(path),
            "bpm": 120.0,
            "key": "C Minor",
            "time_sig": "4/4",
            "sample_rate": 48000.0,
            "bit_depth": "24-bit",
            "markers": [],
            "tracks": [],
            "notes": []
        }
        
        if os.path.exists(config_path):
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
            except:
                pass
                
        pt_parsed = None
        for txt in pt_text_files:
            file_fullpath = os.path.join(path, txt)
            try:
                with open(file_fullpath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                if "SESSION NAME:" in content and "--- SECTION:" in content:
                    pt_parsed = parse_pt_session_text(content)
                    break
            except:
                pass
                
        flp_parsed = None
        for flp in flp_files:
            file_fullpath = os.path.join(path, flp)
            try:
                flp_parsed = parse_flp_file(file_fullpath)
                break
            except:
                pass
                
        target_sr = config.get("sample_rate", 48000.0)
        if pt_parsed and pt_parsed.get("sample_rate"):
            target_sr = pt_parsed.get("sample_rate")
            
        mono_groups = {}
        for rw in raw_wavs:
            filename = os.path.basename(rw)
            match = re.match(r'^(.*?)[._-]([lL]|[rR]|[lL]eft|[rR]ight)\.wav$', filename, re.IGNORECASE)
            if match:
                base = match.group(1)
                side = match.group(2).lower()
                if base not in mono_groups:
                    mono_groups[base] = {}
                mono_groups[base][side] = rw
                
        joined_files_map = {}
        for base, sides in mono_groups.items():
            left_side = [s for s in sides.keys() if s in ['l', 'left']]
            right_side = [s for s in sides.keys() if s in ['r', 'right']]
            if left_side and right_side:
                left_rel = sides[left_side[0]]
                right_rel = sides[right_side[0]]
                
                joined_dir = os.path.join(path, "Stereo_Joined")
                os.makedirs(joined_dir, exist_ok=True)
                
                joined_name = f"{base}.wav"
                joined_filepath = os.path.join(joined_dir, joined_name)
                
                left_fullpath = os.path.join(path, left_rel)
                right_fullpath = os.path.join(path, right_rel)
                
                is_compiling = False
                if not os.path.exists(joined_filepath):
                    is_compiling = True
                    def auto_join_worker(l_p, r_p, out_p, b_name):
                        try:
                            join_split_mono_files(l_p, r_p, out_p)
                            print(f"[Stereo-Joiner] Consolidated split-mono pairs into {b_name}.wav")
                        except Exception as e:
                            print(f"[Stereo-Joiner] Failed to join {b_name}: {str(e)}")
                            
                    t = threading.Thread(target=auto_join_worker, args=(left_fullpath, right_fullpath, joined_filepath, base))
                    t.daemon = True
                    t.start()
                    
                joined_files_map[left_rel] = {"base": base, "joining": is_compiling, "joined_rel": os.path.join("Stereo_Joined", joined_name)}
                joined_files_map[right_rel] = {"base": base, "joining": is_compiling, "joined_rel": os.path.join("Stereo_Joined", joined_name)}

        wav_files_data = []
        processed_joined = set()
        
        for rw in raw_wavs:
            if rw in joined_files_map:
                info = joined_files_map[rw]
                base = info["base"]
                if base not in processed_joined:
                    processed_joined.add(base)
                    joined_rel = info["joined_rel"]
                    joined_fullpath = os.path.join(path, joined_rel)
                    
                    meta = get_wav_metadata(joined_fullpath) if os.path.exists(joined_fullpath) else {
                        "sample_rate": int(target_sr),
                        "bit_depth": 24,
                        "channels": 2,
                        "duration": 0.0,
                        "rms_db": -18.0,
                        "suggested_gain": 0.0,
                        "error": "Stereo file compiling in background..."
                    }
                    
                    wav_files_data.append({
                        "filename": joined_rel,
                        "meta": meta,
                        "is_joined_stereo": True,
                        "joining": info["joining"]
                    })
                continue
                
            full_path = os.path.join(path, rw)
            meta = get_wav_metadata(full_path)
            wav_files_data.append({
                "filename": rw,
                "meta": meta
            })
            
        def auto_resample_worker(in_p, out_p, sr):
            try:
                resample_wav_file(in_p, out_p, int(sr))
                print(f"[Auto-Resampler] Conformed {os.path.basename(in_p)} to {sr}Hz.")
            except Exception as e:
                print(f"[Auto-Resampler] Error conforming {os.path.basename(in_p)}: {str(e)}")

        for w in wav_files_data:
            meta = w.get("meta")
            if meta and not meta.get("error"):
                sr = meta.get("sample_rate")
                if sr != int(target_sr):
                    orig_filename = w.get("filename")
                    basename = os.path.basename(orig_filename)
                    output_dir = os.path.join(path, "Resampled_WAVs")
                    os.makedirs(output_dir, exist_ok=True)
                    out_file = os.path.join(output_dir, f"resampled_{basename}")
                    
                    if not os.path.exists(out_file):
                        in_file = os.path.join(path, orig_filename)
                        t = threading.Thread(target=auto_resample_worker, args=(in_file, out_file, target_sr))
                        t.daemon = True
                        t.start()
                        w["resampling"] = True
                        print(f"[Auto-Resampler] Started background resample for {basename} to {target_sr}Hz.")
                    else:
                        w["resampled_path"] = os.path.join("Resampled_WAVs", f"resampled_{basename}")
                
        ptsl_status = query_ptsl_session_info()
                
        return {
            "config": config,
            "detected_pt": pt_parsed,
            "detected_flp": flp_parsed,
            "wav_files": wav_files_data,
            "pt_files": pt_text_files,
            "flp_files": flp_files,
            "ptsl": ptsl_status
        }

if __name__ == '__main__':
    import sys
    
    # Asegurar que el directorio de trabajo sea donde está app.py (crucial para los launchers)
    if getattr(sys, 'frozen', False):
        os.chdir(sys._MEIPASS)
    else:
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        
    class HttpdHandler(DAWSyncHandler):
        def send_response(self, *args, **kwargs):
            super().send_response(*args, **kwargs)
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')

    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("", PORT), HttpdHandler)
    
    def start_server():
        print(f"Servidor DAWSync Bridge corriendo en http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass

    t = threading.Thread(target=start_server, daemon=True)
    t.start()
    
    if webview:
        webview.create_window('FreePTX - Professional DAW Interoperability', f'http://localhost:{PORT}', width=1400, height=900)
        webview.start()
    else:
        print("[AVISO] pywebview no esta instalado. Ejecutando en modo consola.")
        try:
            # Mantener el script vivo
            while True:
                threading.Event().wait(3600)
        except KeyboardInterrupt:
            pass
            
    print("\nCerrando servidor...")
    httpd.shutdown()
    httpd.server_close()
