import re
import os

def get_fps_from_format(tc_format_str):
    s = tc_format_str.lower()
    if "23.976" in s:
        return 23.976
    elif "24" in s:
        return 24.0
    elif "25" in s:
        return 25.0
    elif "29.97" in s:
        return 29.97
    elif "30" in s:
        return 30.0
    return 24.0


def timecode_to_seconds(tc_str, frame_rate=24.0, bpm=120.0, start_tc="00:00:00:00"):
    tc_str = tc_str.strip()
    if not tc_str:
        return 0.0
        
    if '|' in tc_str:
        parts = tc_str.split('|')
        if len(parts) >= 2:
            bar = int(parts[0])
            beat = int(parts[1])
            tick = int(parts[2]) if len(parts) > 2 else 0
            relative_bars = max(0, bar - 1)
            relative_beats = max(0, beat - 1)
            ticks_offset = relative_bars * 4 * 960 + relative_beats * 960 + tick
            beats = ticks_offset / 960.0
            return beats * (60.0 / bpm)
            
    tc_parts = re.split(r'[:\.]', tc_str)
    if len(tc_parts) == 4:
        try:
            h, m, s, f = map(float, tc_parts)
            total_sec = h * 3600.0 + m * 60.0 + s + f / frame_rate
            
            start_parts = re.split(r'[:\.]', start_tc)
            start_sec = 0.0
            if len(start_parts) == 4:
                sh, sm, ss, sf = map(float, start_parts)
                start_sec = sh * 3600.0 + sm * 60.0 + ss + sf / frame_rate
                
            return max(0.0, total_sec - start_sec)
        except ValueError:
            pass
            
    if ':' in tc_str:
        parts = tc_str.split(':')
        try:
            if len(parts) == 2:
                m = float(parts[0])
                s = float(parts[1])
                return m * 60.0 + s
            elif len(parts) == 3:
                h = float(parts[0])
                m = float(parts[1])
                s = float(parts[2])
                return h * 3600.0 + m * 60.0 + s
        except ValueError:
            pass
            
    try:
        return float(tc_str)
    except ValueError:
        return 0.0


def parse_pt_session_text(content):
    lines = content.splitlines()
    session_info = {
        "name": "Unknown Session",
        "sample_rate": 44100.0,
        "bit_depth": "24-bit",
        "session_start": "00:00:00:00",
        "timecode_format": "24 Frame",
        "markers": [],
        "tracks": [],
        "plugins": {}
    }
    
    for line in lines:
        if line.startswith("SESSION NAME:"):
            session_info["name"] = line.split("SESSION NAME:")[1].strip()
        elif line.startswith("SAMPLE RATE:"):
            try:
                session_info["sample_rate"] = float(line.split("SAMPLE RATE:")[1].strip())
            except:
                pass
        elif line.startswith("BIT DEPTH:"):
            session_info["bit_depth"] = line.split("BIT DEPTH:")[1].strip()
        elif line.startswith("SESSION START:"):
            session_info["session_start"] = line.split("SESSION START:")[1].strip()
        elif line.startswith("TIMECODE FORMAT:"):
            session_info["timecode_format"] = line.split("TIMECODE FORMAT:")[1].strip()
            
    def parse_rows(rows_lines):
        if not rows_lines:
            return []
        header_line = rows_lines[0]
        headers = [h.strip() for h in re.split(r'\t|\s{2,}', header_line) if h.strip()]
        
        parsed_data = []
        for line in rows_lines[1:]:
            if not line.strip() or line.startswith('-') or line.startswith('SESSION NAME'):
                continue
            row = [val.strip() for val in re.split(r'\t', line)]
            if len(row) < len(headers):
                row = [val.strip() for val in re.split(r'\s{2,}', line) if val.strip()]
            
            item = {}
            for i, h in enumerate(headers):
                if i < len(row):
                    item[h.lower()] = row[i]
                else:
                    item[h.lower()] = ""
            if item:
                parsed_data.append(item)
        return parsed_data

    i = 0
    frame_rate = get_fps_from_format(session_info["timecode_format"])
    tempo_map = []
    bpm = 120.0
    
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith("--- SECTION:"):
            current_section = line.replace("---", "").replace("SECTION:", "").strip()
            section_data = []
            i += 1
            while i < len(lines) and not lines[i].startswith("--- SECTION:"):
                if lines[i].strip():
                    section_data.append(lines[i])
                i += 1
            
            if current_section == "MARKERS":
                parsed_markers = parse_rows(section_data)
                for pm in parsed_markers:
                    loc = pm.get("location", pm.get("location(time)", ""))
                    name = pm.get("name", "")
                    comments = pm.get("comments", "")
                    if loc or name:
                        sec = timecode_to_seconds(loc, frame_rate, bpm, session_info["session_start"])
                        session_info["markers"].append({
                            "index": len(session_info["markers"]) + 1,
                            "location_raw": loc,
                            "location_seconds": sec,
                            "name": name,
                            "comments": comments
                        })
            elif current_section.startswith("TRACK:"):
                track_name = current_section.replace("TRACK:", "").strip()
                parsed_clips = parse_rows(section_data)
                clips = []
                for pc in parsed_clips:
                    clip_name = pc.get("clip name", "")
                    start_time = pc.get("start time", "")
                    end_time = pc.get("end time", "")
                    duration = pc.get("duration", "")
                    timestamp = pc.get("timestamp", "")
                    if clip_name:
                        start_sec = timecode_to_seconds(start_time, frame_rate, bpm, session_info["session_start"])
                        duration_sec = timecode_to_seconds(duration, frame_rate, bpm, "00:00:00:00")
                        end_sec = start_sec + duration_sec
                        clips.append({
                            "name": clip_name,
                            "start_raw": start_time,
                            "start_seconds": start_sec,
                            "end_raw": end_time,
                            "end_seconds": end_sec,
                            "duration_raw": duration,
                            "duration_seconds": duration_sec,
                            "timestamp_raw": timestamp
                        })
                session_info["tracks"].append({
                    "name": track_name,
                    "clips": clips
                })
            elif current_section == "PLUGINS LISTING":
                parsed_plugins = parse_rows(section_data)
                for pp in parsed_plugins:
                    tr = pp.get("track", "")
                    pl = pp.get("plugin", "")
                    if tr and pl:
                        if tr not in session_info["plugins"]:
                            session_info["plugins"][tr] = []
                        if pl not in session_info["plugins"][tr]:
                            session_info["plugins"][tr].append(pl)
            continue
        i += 1
        
    return session_info


def fuzzy_match_track(filename, track_list):
    base = os.path.basename(filename).lower().replace(".wav", "")
    base = re.sub(r'(_consolidated|_bip|_mixdown|_take\d*|_\d+|-\d+|\s+)', '', base)
    base = re.sub(r'[^a-z0-9]', '', base)
    
    best_match = None
    best_score = 0.0
    
    for track in track_list:
        t_norm = track.lower()
        t_norm = re.sub(r'(_consolidated|_bip|_mixdown|_take\d*|_\d+|-\d+|\s+)', '', t_norm)
        t_norm = re.sub(r'[^a-z0-9]', '', t_norm)
        
        if not t_norm:
            continue
            
        if base == t_norm:
            return track
        elif t_norm in base or base in t_norm:
            score = min(len(base), len(t_norm)) / max(len(base), len(t_norm))
            if score > best_score:
                best_score = score
                best_match = track
                
    if best_score > 0.4:
        return best_match
    return None


def query_ptsl_session_info():
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.4)
        res = s.connect_ex(('127.0.0.1', 31416))
        s.close()
        return {
            "connected": res == 0,
            "port": 31416,
            "protocol": "gRPC (PTSL)"
        }
    except:
        return {"connected": False}


def parse_flp_file(file_path):
    flp_data = {
        "bpm": 120.0,
        "time_signature": "4/4",
        "markers": [],
        "tracks": [],
        "plugins": [],
        "error": None
    }
    try:
        import pyflp
        try:
            project = pyflp.parse(file_path)
            flp_data["bpm"] = float(round(project.tempo, 3))
            
            if hasattr(project, "time_signature"):
                flp_data["time_signature"] = f"{project.time_signature.numerator}/{project.time_signature.denominator}"
                
            ppq = getattr(project, "ppq", 96)
            
            if hasattr(project, "arrangements") and project.arrangements:
                arr = project.arrangements[0]
                if hasattr(arr, "markers"):
                    for m in arr.markers:
                        sec = (m.position / ppq) * (60.0 / flp_data["bpm"])
                        flp_data["markers"].append({
                            "name": m.name,
                            "location_seconds": sec,
                            "location_raw": f"Tick {m.position}"
                        })
            
            if hasattr(project, "mixer"):
                for m_track in project.mixer:
                    if m_track.name and m_track.name != f"Insert {m_track.index}":
                        track_plugins = []
                        if hasattr(m_track, "effects"):
                            for fx in m_track.effects:
                                if fx.name:
                                    track_plugins.append(fx.name)
                                    if fx.name not in flp_data["plugins"]:
                                        flp_data["plugins"].append(fx.name)
                                        
                        vol_float = getattr(m_track, "volume", 0.8)
                        vol_db = round(20 * math.log10(vol_float / 0.8) if vol_float > 0 else -48.0, 1)
                        pan_val = round(getattr(m_track, "pan", 0.0), 2)
                        
                        flp_data["tracks"].append({
                            "name": m_track.name,
                            "volume": vol_db,
                            "pan": pan_val,
                            "mute": getattr(m_track, "muted", False),
                            "plugins": track_plugins
                        })
            else:
                if hasattr(project, "channels"):
                    for chan in project.channels:
                        flp_data["tracks"].append({
                            "name": chan.name,
                            "volume": 0.0,
                            "pan": 0.0,
                            "mute": False,
                            "plugins": []
                        })
                        
        except Exception as e:
            flp_data["error"] = f"Failed to parse FLP project: {str(e)}"
    except ImportError:
        flp_data["error"] = "pyflp library not installed. Install using 'pip install pyflp'."
        
    return flp_data


