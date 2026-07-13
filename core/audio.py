import os
import wave
import struct
import math
import subprocess

def join_split_mono_files(left_path, right_path, output_path):
    with wave.open(left_path, 'rb') as w_l, wave.open(right_path, 'rb') as w_r:
        p_l = w_l.getparams()
        p_r = w_r.getparams()
        
        if p_l.framerate != p_r.framerate or p_l.sampwidth != p_r.sampwidth:
            raise ValueError("Frecuencia de muestreo o profundidad de bits no coinciden.")
        if p_l.nchannels != 1 or p_r.nchannels != 1:
            raise ValueError("Ambas pistas de entrada deben ser monoaurales (1 canal).")
            
        nframes = min(p_l.nframes, p_r.nframes)
        
        with wave.open(output_path, 'wb') as w_out:
            w_out.setparams((2, p_l.sampwidth, p_l.framerate, nframes, 'NONE', 'not compressed'))
            
            block_size = 8192
            sampwidth = p_l.sampwidth
            
            for _ in range(0, nframes, block_size):
                frames_to_read = min(block_size, nframes - w_l.tell())
                if frames_to_read <= 0:
                    break
                data_l = w_l.readframes(frames_to_read)
                data_r = w_r.readframes(frames_to_read)
                
                if not data_l or not data_r:
                    break
                    
                interleaved = bytearray()
                for idx in range(frames_to_read):
                    offset = idx * sampwidth
                    interleaved.extend(data_l[offset : offset + sampwidth])
                    interleaved.extend(data_r[offset : offset + sampwidth])
                    
                w_out.writeframes(bytes(interleaved))


def get_wav_rms(file_path):
    """
    Computes standard Root-Mean-Square (RMS) loudness decibel values of WAV channels.
    """
    try:
        with wave.open(file_path, 'rb') as w:
            params = w.getparams()
            nframes = params.nframes
            sampwidth = params.sampwidth
            
            if nframes == 0:
                return -48.0
                
            sum_squares = 0.0
            total_samples = 0
            block_size = 8192
            
            for _ in range(0, nframes, block_size):
                frames_to_read = min(block_size, nframes - w.tell())
                data = w.readframes(frames_to_read)
                if not data:
                    break
                    
                floats = []
                if sampwidth == 2:
                    count = len(data) // 2
                    shorts = struct.unpack(f"<{count}h", data[:count*2])
                    floats = [s / 32768.0 for s in shorts]
                elif sampwidth == 3:
                    count = len(data) // 3
                    for j in range(count):
                        b = data[j*3 : j*3+3]
                        val = int.from_bytes(b, byteorder='little', signed=True)
                        floats.append(val / 8388608.0)
                elif sampwidth == 4:
                    count = len(data) // 4
                    ints = struct.unpack(f"<{count}i", data[:count*4])
                    floats = [v / 2147483648.0 for v in ints]
                    
                for f in floats:
                    sum_squares += f * f
                total_samples += len(floats)
                
            if total_samples == 0:
                return -48.0
                
            rms = math.sqrt(sum_squares / total_samples)
            rms_db = round(20 * math.log10(rms) if rms > 0 else -48.0, 1)
            return rms_db
    except Exception as e:
        print("Error calculating RMS:", str(e))
        return -48.0


def pad_wav_file(input_path, output_path, padding_seconds):
    if padding_seconds <= 0:
        with open(input_path, 'rb') as src, open(output_path, 'wb') as dst:
            dst.write(src.read())
        return
        
    with wave.open(input_path, 'rb') as w_in:
        params = w_in.getparams()
        frames = w_in.readframes(params.nframes)
        
    with wave.open(output_path, 'wb') as w_out:
        w_out.setparams(params)
        pad_frames = int(padding_seconds * params.framerate)
        pad_bytes_len = pad_frames * params.nchannels * params.sampwidth
        silence = b'\x00' * pad_bytes_len
        w_out.writeframes(silence)
        w_out.writeframes(frames)


def get_wav_metadata(file_path):
    try:
        with wave.open(file_path, 'rb') as w:
            params = w.getparams()
            bit_depth = params.sampwidth * 8
            duration = params.nframes / float(params.framerate)
            
            # Compute background RMS
            rms_db = get_wav_rms(file_path)
            suggested_gain = round(-18.0 - rms_db, 1) # suggestions relative to -18dB RMS staging
            
            return {
                "sample_rate": params.framerate,
                "bit_depth": bit_depth,
                "channels": params.nchannels,
                "duration": duration,
                "rms_db": rms_db,
                "suggested_gain": suggested_gain,
                "error": None
            }
    except Exception as e:
        return {
            "sample_rate": 0,
            "bit_depth": 0,
            "channels": 0,
            "duration": 0.0,
            "rms_db": -48.0,
            "suggested_gain": 0.0,
            "error": str(e)
        }


def get_wav_peaks(file_path, num_peaks=300):
    try:
        with wave.open(file_path, 'rb') as w:
            params = w.getparams()
            nframes = params.nframes
            sampwidth = params.sampwidth
            nchannels = params.nchannels
            
            if nframes == 0:
                return []
                
            step = max(1, nframes // num_peaks)
            peaks = []
            
            for i in range(num_peaks):
                pos = i * step
                if pos >= nframes:
                    break
                w.setpos(pos)
                window_size = min(150, step)
                data = w.readframes(window_size)
                if not data:
                    peaks.append(0.0)
                    continue
                    
                if sampwidth == 2:
                    count = len(data) // 2
                    shorts = struct.unpack(f"<{count}h", data[:count*2])
                    val = max(abs(s) for s in shorts) if shorts else 0
                    norm = val / 32768.0
                elif sampwidth == 3:
                    count = len(data) // 3
                    max_abs = 0
                    for j in range(count):
                        b = data[j*3 : j*3+3]
                        s_val = int.from_bytes(b, byteorder='little', signed=True)
                        if abs(s_val) > max_abs:
                            max_abs = abs(s_val)
                    norm = max_abs / 8388608.0
                elif sampwidth == 4:
                    count = len(data) // 4
                    ints = struct.unpack(f"<{count}i", data[:count*4])
                    val = max(abs(v) for v in ints) if ints else 0
                    norm = val / 2147483648.0
                else:
                    norm = 0.0
                    
                peaks.append(round(min(1.0, norm), 3))
            return peaks
    except Exception as e:
        return []


def resample_wav_file(input_path, output_path, target_sr):
    with wave.open(input_path, 'rb') as w_in:
        params = w_in.getparams()
        nchannels = params.nchannels
        sampwidth = params.sampwidth
        framerate = params.framerate
        nframes = params.nframes
        
        if framerate == target_sr:
            pad_wav_file(input_path, output_path, 0)
            return
            
        data = w_in.readframes(nframes)
        
    floats = []
    if sampwidth == 2:
        count = len(data) // 2
        shorts = struct.unpack(f"<{count}h", data[:count*2])
        floats = [s / 32768.0 for s in shorts]
    elif sampwidth == 3:
        count = len(data) // 3
        for j in range(count):
            b = data[j*3 : j*3+3]
            val = int.from_bytes(b, byteorder='little', signed=True)
            floats.append(val / 8388608.0)
    elif sampwidth == 4:
        count = len(data) // 4
        ints = struct.unpack(f"<{count}i", data[:count*4])
        floats = [v / 2147483648.0 for v in ints]
    else:
        raise ValueError(f"Ancho de muestra WAV no soportado: {sampwidth} bytes.")
        
    ratio = target_sr / float(framerate)
    out_frames = int(nframes * ratio)
    out_floats = [0.0] * (out_frames * nchannels)
    
    for c in range(nchannels):
        ch_samples = floats[c::nchannels]
        for j in range(out_frames):
            x = j / ratio
            x0 = int(x)
            x1 = min(x0 + 1, nframes - 1)
            alpha = x - x0
            if x0 < nframes:
                s0 = ch_samples[x0]
                s1 = ch_samples[x1]
                out_floats[j * nchannels + c] = (1.0 - alpha) * s0 + alpha * s1
                
    out_shorts = [int(max(-1.0, min(1.0, f)) * 32767) for f in out_floats]
    out_data = struct.pack(f"<{len(out_shorts)}h", *out_shorts)
    
    with wave.open(output_path, 'wb') as w_out:
        w_out.setparams((nchannels, 2, target_sr, out_frames, 'NONE', 'not compressed'))
        w_out.writeframes(out_data)


def decode_wav_to_floats(filepath, max_samples=96000):
    with wave.open(filepath, 'rb') as w:
        params = w.getparams()
        sampwidth = params.sampwidth
        nchannels = params.nchannels
        framerate = params.framerate
        nframes = min(params.nframes, max_samples)
        
        if nframes == 0:
            return [], framerate
            
        data = w.readframes(nframes)
        
        floats = []
        if sampwidth == 2:
            count = len(data) // 2
            shorts = struct.unpack(f"<{count}h", data[:count*2])
            floats = [s / 32768.0 for s in shorts]
        elif sampwidth == 3:
            count = len(data) // 3
            for j in range(count):
                b = data[j*3 : j*3+3]
                val = int.from_bytes(b, byteorder='little', signed=True)
                floats.append(val / 8388608.0)
        elif sampwidth == 4:
            count = len(data) // 4
            ints = struct.unpack(f"<{count}i", data[:count*4])
            floats = [v / 2147483648.0 for v in ints]
        else:
            return [], framerate
            
        if nchannels > 1:
            mono = []
            for i in range(0, len(floats), nchannels):
                mono.append(sum(floats[i:i+nchannels]) / float(nchannels))
            return mono, framerate
        return floats, framerate


def get_phase_correlation(file1_path, file2_path):
    try:
        y1, sr1 = decode_wav_to_floats(file1_path)
        y2, sr2 = decode_wav_to_floats(file2_path)
        
        if not y1 or not y2:
            return 0.0
            
        n = min(len(y1), len(y2))
        if n == 0:
            return 0.0
            
        y1 = y1[:n]
        y2 = y2[:n]
        
        mean1 = sum(y1) / float(n)
        mean2 = sum(y2) / float(n)
        
        z1 = [x - mean1 for x in y1]
        z2 = [x - mean2 for x in y2]
        
        num = sum(a * b for a, b in zip(z1, z2))
        den1 = sum(a * a for a in z1)
        den2 = sum(b * b for b in z2)
        
        if den1 == 0 or den2 == 0:
            return 0.0
            
        correlation = num / math.sqrt(den1 * den2)
        return round(correlation, 4)
    except Exception as e:
        print("Error checking phase:", str(e))
        return 0.0


