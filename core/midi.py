import struct
import os
import re

def encode_vlq(value):
    if value == 0:
        return b'\x00'
    bytes_list = []
    while value > 0:
        byte = value & 0x7F
        value >>= 7
        if bytes_list:
            byte |= 0x80
        bytes_list.append(byte)
    return bytes(reversed(bytes_list))


def write_midi_file(bpm, markers, tracks, output_path):
    tpqn = 480
    ticks_per_sec = (tpqn * bpm) / 60.0
    
    track1_events = []
    tempo_event = b'\xFF\x51\x03' + int(60_000_000 / bpm).to_bytes(3, byteorder='big')
    track1_events.append((0, tempo_event))
    time_sig_event = b'\xFF\x58\x04\x04\x02\x18\x08'
    track1_events.append((0, time_sig_event))
    
    for m in markers:
        sec = m.get("location_seconds", 0.0)
        tick = int(sec * ticks_per_sec)
        name_bytes = m["name"].encode('utf-8')
        len_bytes = encode_vlq(len(name_bytes))
        marker_event = b'\xFF\x06' + len_bytes + name_bytes
        track1_events.append((tick, marker_event))
        
    track1_events.sort(key=lambda x: x[0])
    
    track1_data = bytearray()
    last_tick = 0
    for tick, event in track1_events:
        delta = tick - last_tick
        track1_data.extend(encode_vlq(delta))
        track1_data.extend(event)
        last_tick = tick
    track1_data.extend(encode_vlq(480))
    track1_data.extend(b'\xFF\x2F\x00')
    
    midi_tracks = [track1_data]
    
    for t_idx, t in enumerate(tracks):
        track_events = []
        
        track_name = t.get("name", f"Track {t_idx+1}")
        name_bytes = track_name.encode('utf-8')
        track_events.append((0, b'\xFF\x03' + encode_vlq(len(name_bytes)) + name_bytes))
        
        vol_db = float(t.get("volume", 0.0))
        vol_linear = 10.0 ** (vol_db / 20.0)
        vol_midi = max(0, min(127, int(vol_linear * 100)))
        track_events.append((0, b'\xB0\x07' + bytes([vol_midi])))
        
        pan_val = float(t.get("pan", 0.0))
        pan_midi = max(0, min(127, int((pan_val + 1.0) / 2.0 * 127)))
        track_events.append((0, b'\xB0\x0A' + bytes([pan_midi])))
        
        clips = t.get("clips", [])
        for c in clips:
            c_start = c.get("start_seconds", 0.0)
            c_dur = c.get("duration_seconds", 10.0)
            
            start_tick = int(c_start * ticks_per_sec)
            end_tick = int((c_start + c_dur) * ticks_per_sec)
            
            track_events.append((start_tick, b'\x90\x3C\x64'))
            track_events.append((end_tick, b'\x80\x3C\x00'))
            
        track_events.sort(key=lambda x: x[0])
        
        track_data = bytearray()
        last_t_tick = 0
        for tick, event in track_events:
            delta = tick - last_t_tick
            track_data.extend(encode_vlq(delta))
            track_data.extend(event)
            last_t_tick = tick
        track_data.extend(encode_vlq(480))
        track_data.extend(b'\xFF\x2F\x00')
        
        midi_tracks.append(track_data)
        
    num_tracks = len(midi_tracks)
    header = b'MThd' + b'\x00\x00\x00\x06' + b'\x00\x01' + num_tracks.to_bytes(2, byteorder='big') + tpqn.to_bytes(2, byteorder='big')
    
    body = bytearray()
    for t_data in midi_tracks:
        body.extend(b'MTrk' + len(t_data).to_bytes(4, byteorder='big') + t_data)
        
    with open(output_path, 'wb') as f:
        f.write(header + bytes(body))


def write_reaper_project(bpm, markers, tracks, output_path):
    workspace_path = os.path.dirname(output_path)
    
    rpp = []
    rpp.append('<REAPER_PROJECT 0.1 "6.78/mac64" 1689212000')
    rpp.append(f'  BPM {bpm} 4 4')
    rpp.append('  <GRID 12 0 1 0 1 1 0 0')
    
    for idx, m in enumerate(markers):
        sec = m.get("location_seconds", 0.0)
        name = m.get("name", f"Marker {idx+1}")
        rpp.append(f'  MARKER {idx+1} {sec:.4f} "{name}" 0 0 1')
        
    def get_peak_color_value(color_hex):
        try:
            cleaned = color_hex.replace("#", "")
            return int(cleaned, 16) | 0x01000000
        except:
            return 16839422
            
    VST_MAP = {
        "fabfilter pro-q 3": ("VST3: FabFilter Pro-Q 3 (FabFilter)", "FabFilter Pro-Q 3.vst3"),
        "cla-2a": ("VST: CLA-2A (Waves)", "CLA-2A.dll"),
        "valhalla vintage verb": ("VST: ValhallaVintageVerb (Valhalla DSP)", "ValhallaVintageVerb.dll"),
        "eq3 7-band": ("VST: EQ3 7-Band (Avid)", "EQ3 7-Band.dll"),
        "dynamics iii": ("VST: Dynamics III Compressor (Avid)", "Dynamics III Compressor.dll")
    }
            
    categories = {}
    for t in tracks:
        cat = t.get("category", "category-other")
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(t)
        
    cat_meta = {
        "category-vocal": {"label": "[VOCALES]", "color": "#ff007f"},
        "category-drums": {"label": "[BATERIAS/DRUMS]", "color": "#00f2fe"},
        "category-bass": {"label": "[BAJOS/BASS]", "color": "#00ff66"},
        "category-instruments": {"label": "[INSTRUMENTOS/KEYS]", "color": "#8e2de2"},
        "category-other": {"label": "[OTROS/FX]", "color": "#ffaa00"}
    }
    
    for cat_name, cat_tracks in categories.items():
        if not cat_tracks:
            continue
            
        meta = cat_meta.get(cat_name, cat_meta["category-other"])
        folder_color = get_peak_color_value(meta["color"])
        
        rpp.append('  <TRACK')
        rpp.append(f'    NAME "{meta["label"]}"')
        rpp.append('    ISFOLDER 1 0')
        rpp.append(f'    PEAKCOL {folder_color}')
        rpp.append('  >')
        
        for idx, t in enumerate(cat_tracks):
            track_name = t.get("name", "Audio Track")
            vol_db = float(t.get("volume", 0.0))
            pan_val = float(t.get("pan", 0.0))
            mute_state = 1 if t.get("mute") else 0
            solo_state = 1 if t.get("solo") else 0
            
            vol_linear = round(10.0 ** (vol_db / 20.0), 5)
            isfolder_tag = "0 -1" if idx == len(cat_tracks) - 1 else "0 0"
            track_color = get_peak_color_value(meta["color"])
            
            rpp.append('    <TRACK')
            rpp.append(f'      NAME "{track_name}"')
            rpp.append(f'      ISFOLDER {isfolder_tag}')
            rpp.append(f'      PEAKCOL {track_color}')
            rpp.append(f'      VOL {vol_linear}')
            rpp.append(f'      PAN {pan_val}')
            rpp.append(f'      MUTE {mute_state}')
            rpp.append(f'      SOLO {solo_state}')
            
            plugins = t.get("plugins", [])
            if plugins:
                rpp.append('      <FXCHAIN')
                rpp.append('        SHOW 0')
                rpp.append('        LASTSEL 0')
                
                for p_name in plugins:
                    norm_p = p_name.lower().strip()
                    matched_vst = None
                    for key, val in VST_MAP.items():
                        if key in norm_p:
                            matched_vst = val
                            break
                    if matched_vst:
                        rpp.append(f'        <VST "{matched_vst[0]}" "{matched_vst[1]}" 0 ""')
                        rpp.append('        >')
                rpp.append('      >')
            
            clips = t.get("clips", [])
            for c in clips:
                clip_name = c.get("name", "Audio Clip")
                start = c.get("start_seconds", 0.0)
                duration = c.get("duration_seconds", 10.0)
                
                aligned_name = f"alineado_{clip_name}"
                aligned_path = os.path.join(workspace_path, "Stems_Alineados", aligned_name)
                resampled_name = f"resampled_{clip_name}"
                resampled_path = os.path.join(workspace_path, "Resampled_WAVs", resampled_name)
                
                joined_name = clip_name
                joined_path = os.path.join(workspace_path, "Stereo_Joined", joined_name)
                
                if os.path.exists(aligned_path):
                    rel_path = os.path.join("Stems_Alineados", aligned_name)
                elif os.path.exists(resampled_path):
                    rel_path = os.path.join("Resampled_WAVs", resampled_name)
                elif os.path.exists(joined_path):
                    rel_path = os.path.join("Stereo_Joined", joined_name)
                else:
                    rel_path = clip_name
                    found_original = False
                    for root, dirs, files in os.walk(workspace_path):
                        if clip_name in files:
                            rel_path = os.path.relpath(os.path.join(root, clip_name), workspace_path)
                            found_original = True
                            break
                            
                rpp.append('      <ITEM')
                rpp.append(f'        POSITION {start:.4f}')
                rpp.append(f'        NAME "{clip_name}"')
                rpp.append(f'        LENGTH {duration:.4f}')
                rpp.append('        SOFFS 0')
                rpp.append(f'        FILE "{rel_path}"')
                rpp.append('      >')
                    
            rpp.append('    >')
            
    rpp.append('>')
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(rpp))


