import os
import wave
import struct
import math
import subprocess
import array

def _unpack_to_array(data, sampwidth):
    if not data:
        return array.array('f')
    if sampwidth == 2:
        shorts = array.array('h', data)
        return array.array('f', (s / 32768.0 for s in shorts))
    elif sampwidth == 3:
        count = len(data) // 3
        return array.array('f', (
            int.from_bytes(data[j*3 : j*3+3], byteorder='little', signed=True) / 8388608.0
            for j in range(count)
        ))
    elif sampwidth == 4:
        ints = array.array('i', data)
        return array.array('f', (v / 2147483648.0 for v in ints))
    return array.array('f')


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
                    
                interleaved = bytearray(len(data_l) + len(data_r))
                view_out = memoryview(interleaved)
                view_l = memoryview(data_l)
                view_r = memoryview(data_r)
                
                for i in range(sampwidth):
                    view_out[i::sampwidth*2] = view_l[i::sampwidth]
                    view_out[i+sampwidth::sampwidth*2] = view_r[i::sampwidth]
                    
                w_out.writeframes(interleaved)


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
                    
                arr = _unpack_to_array(data, sampwidth)
                sum_squares += sum(x*x for x in arr)
                total_samples += len(arr)
                
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
                    
                arr = _unpack_to_array(data, sampwidth)
                if arr:
                    val = max(abs(x) for x in arr)
                    peaks.append(round(min(1.0, val), 3))
                else:
                    peaks.append(0.0)
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
        
    floats = _unpack_to_array(data, sampwidth)
    if not floats:
        raise ValueError(f"Ancho de muestra WAV no soportado: {sampwidth} bytes.")
        
    ratio = target_sr / float(framerate)
    out_frames = int(nframes * ratio)
    out_floats = array.array('f', (0.0 for _ in range(out_frames * nchannels)))
    
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
                
    out_shorts = array.array('h', (int(max(-1.0, min(1.0, f)) * 32767) for f in out_floats))
    
    with wave.open(output_path, 'wb') as w_out:
        w_out.setparams((nchannels, 2, target_sr, out_frames, 'NONE', 'not compressed'))
        w_out.writeframes(out_shorts.tobytes())


def decode_wav_to_floats(filepath, max_samples=96000):
    with wave.open(filepath, 'rb') as w:
        params = w.getparams()
        sampwidth = params.sampwidth
        nchannels = params.nchannels
        framerate = params.framerate
        nframes = min(params.nframes, max_samples)
        
        if nframes == 0:
            return array.array('f'), framerate
            
        data = w.readframes(nframes)
        
        floats = _unpack_to_array(data, sampwidth)
        if not floats:
            return array.array('f'), framerate
            
        if nchannels > 1:
            mono = array.array('f', (0.0 for _ in range(nframes)))
            for c in range(nchannels):
                ch = floats[c::nchannels]
                for i in range(nframes):
                    mono[i] += ch[i] / nchannels
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
        
        z1 = array.array('f', (x - mean1 for x in y1))
        z2 = array.array('f', (x - mean2 for x in y2))
        
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



