import unittest
import os
import wave
import struct
import math

from core.parsers import (
    parse_pt_session_text,
    timecode_to_seconds,
    fuzzy_match_track
)

from core.midi import (
    write_midi_file,
    encode_vlq,
    write_reaper_project
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

class TestDAWSync(unittest.TestCase):
    def test_encode_vlq(self):
        self.assertEqual(encode_vlq(0), b'\x00')
        self.assertEqual(encode_vlq(127), b'\x7f')
        self.assertEqual(encode_vlq(128), b'\x81\x00')
        self.assertEqual(encode_vlq(8192), b'\xc0\x00')

    def test_timecode_to_seconds(self):
        self.assertAlmostEqual(timecode_to_seconds("01:00:10:00", 24.0, 120.0, "01:00:00:00"), 10.0)
        self.assertAlmostEqual(timecode_to_seconds("01:00:10:12", 24.0, 120.0, "01:00:00:00"), 10.5)
        self.assertAlmostEqual(timecode_to_seconds("2|1|000", 24.0, 120.0), 2.0)
        self.assertAlmostEqual(timecode_to_seconds("1|3|000", 24.0, 120.0), 1.0)
        self.assertAlmostEqual(timecode_to_seconds("01:30.500"), 90.5)

    def test_parse_pt_session_text(self):
        dummy_content = """SESSION NAME:\tTest_Project
SAMPLE RATE:\t48000.000000
BIT DEPTH:\t24-bit
SESSION START:\t01:00:00:00
TIMECODE FORMAT:\t24 Frame

--- SECTION: MARKERS ---
#\tLOCATION\tNAME\tCOMMENTS
1\t01:00:05:00\tIntro\tStart of track
2\t01:00:15:12\tVerse 1\tVocal starts

--- SECTION: TRACK: Vocal_Main ---
CHANNEL\tEVENT\tCLIP NAME\tSTART TIME\tEND TIME\tDURATION\tTIMESTAMP
1\t1\tVocal_Take1\t01:00:05:00\t01:00:10:00\t00:00:05:00\t01:00:05:00

--- SECTION: PLUGINS LISTING ---
TRACK\tPLUGIN
Vocal_Main\tFabFilter Pro-Q 3
Vocal_Main\tCLA-2A Compressor
"""
        info = parse_pt_session_text(dummy_content)
        self.assertEqual(info["name"], "Test_Project")
        self.assertEqual(info["sample_rate"], 48000.0)
        self.assertEqual(info["bit_depth"], "24-bit")
        
        self.assertEqual(len(info["markers"]), 2)
        self.assertEqual(info["markers"][0]["name"], "Intro")
        self.assertAlmostEqual(info["markers"][0]["location_seconds"], 5.0)
        self.assertEqual(info["markers"][1]["name"], "Verse 1")
        self.assertAlmostEqual(info["markers"][1]["location_seconds"], 15.5)
        
        self.assertEqual(len(info["tracks"]), 1)
        self.assertEqual(info["tracks"][0]["name"], "Vocal_Main")
        self.assertEqual(len(info["tracks"][0]["clips"]), 1)
        self.assertEqual(info["tracks"][0]["clips"][0]["name"], "Vocal_Take1")
        self.assertAlmostEqual(info["tracks"][0]["clips"][0]["start_seconds"], 5.0)
        self.assertAlmostEqual(info["tracks"][0]["clips"][0]["duration_seconds"], 5.0)

    def test_write_midi_file_advanced(self):
        output_mid = "test_markers_adv.mid"
        markers = [
            {"name": "Intro", "location_seconds": 5.0}
        ]
        tracks = [
            {
                "name": "Bass",
                "volume": -6.0,
                "pan": 0.5,
                "clips": [
                    {"start_seconds": 5.0, "duration_seconds": 10.0}
                ]
            }
        ]
        write_midi_file(120.0, markers, tracks, output_mid)
        self.assertTrue(os.path.exists(output_mid))
        
        with open(output_mid, 'rb') as f:
            content = f.read()
            self.assertEqual(content[:4], b'MThd')
            self.assertEqual(content[8:10], b'\x00\x01')
            self.assertIn(b'\xB0\x07', content)
            self.assertIn(b'\xB0\x0A', content)
            
        os.remove(output_mid)

    def test_pad_wav_file(self):
        input_wav = "test_input.wav"
        output_wav = "test_output.wav"
        
        sample_rate = 44100
        nchannels = 1
        sampwidth = 2
        
        with wave.open(input_wav, 'wb') as w:
            w.setparams((nchannels, sampwidth, sample_rate, sample_rate, 'NONE', 'not compressed'))
            w.writeframes(b'\x11\x22' * sample_rate)
            
        pad_wav_file(input_wav, output_wav, 2.5)
        self.assertTrue(os.path.exists(output_wav))
        
        with wave.open(output_wav, 'rb') as w_out:
            params = w_out.getparams()
            self.assertEqual(params.nframes, int(3.5 * sample_rate))
            
        os.remove(input_wav)
        os.remove(output_wav)

    def test_get_wav_metadata(self):
        test_wav = "test_meta.wav"
        sample_rate = 48000
        nchannels = 2
        sampwidth = 3
        
        with wave.open(test_wav, 'wb') as w:
            w.setparams((nchannels, sampwidth, sample_rate, sample_rate * 2, 'NONE', 'not compressed'))
            w.writeframes(b'\x00' * (sample_rate * 2 * nchannels * sampwidth))
            
        meta = get_wav_metadata(test_wav)
        self.assertEqual(meta["sample_rate"], 48000)
        self.assertEqual(meta["bit_depth"], 24)
        self.assertEqual(meta["channels"], 2)
        self.assertAlmostEqual(meta["duration"], 2.0)
        self.assertIn("rms_db", meta)
        self.assertIn("suggested_gain", meta)
        
        os.remove(test_wav)

    def test_get_wav_peaks(self):
        test_wav = "test_peaks.wav"
        sample_rate = 8000
        nchannels = 1
        sampwidth = 2
        
        with wave.open(test_wav, 'wb') as w:
            w.setparams((nchannels, sampwidth, sample_rate, sample_rate, 'NONE', 'not compressed'))
            w.writeframes(b'\x00\x00' * 4000)
            w.writeframes(struct.pack("<4000h", *([16384]*4000)))
            
        peaks = get_wav_peaks(test_wav, num_peaks=10)
        self.assertEqual(len(peaks), 10)
        self.assertAlmostEqual(peaks[0], 0.0)
        self.assertAlmostEqual(peaks[9], 0.5)
        
        os.remove(test_wav)

    def test_resample_wav_file(self):
        input_wav = "test_resample_in.wav"
        output_wav = "test_resample_out.wav"
        
        with wave.open(input_wav, 'wb') as w:
            w.setparams((1, 2, 44100, 44100, 'NONE', 'not compressed'))
            w.writeframes(b'\x11\x22' * 44100)
            
        resample_wav_file(input_wav, output_wav, 48000)
        self.assertTrue(os.path.exists(output_wav))
        
        with wave.open(output_wav, 'rb') as w_out:
            params = w_out.getparams()
            self.assertEqual(params.framerate, 48000)
            self.assertEqual(params.sampwidth, 2)
            self.assertEqual(params.nchannels, 1)
            self.assertEqual(params.nframes, 48000)
            
        os.remove(input_wav)
        os.remove(output_wav)

    def test_write_reaper_project_advanced(self):
        output_rpp = "test_session_adv.RPP"
        markers = [
            {"name": "Intro", "location_seconds": 1.5}
        ]
        tracks = [
            {
                "name": "Kick",
                "category": "category-drums",
                "volume": -6.0,
                "pan": -0.2,
                "mute": True,
                "solo": False,
                "plugins": ["FabFilter Pro-Q 3", "CLA-2A"],
                "clips": [
                    {"name": "kick.wav", "start_seconds": 0.0, "duration_seconds": 20.0, "file_path": "stems/kick.wav"}
                ]
            }
        ]
        
        write_reaper_project(120.0, markers, tracks, output_rpp)
        self.assertTrue(os.path.exists(output_rpp))
        
        with open(output_rpp, 'r', encoding='utf-8') as f:
            content = f.read()
            self.assertIn("<REAPER_PROJECT", content)
            self.assertIn('NAME "[BATERIAS/DRUMS]"', content)
            self.assertIn("ISFOLDER 1 0", content)
            self.assertIn('NAME "Kick"', content)
            self.assertIn("VOL 0.50119", content)
            self.assertIn("PAN -0.2", content)
            self.assertIn("MUTE 1", content)
            self.assertIn("SOLO 0", content)
            self.assertIn("<FXCHAIN", content)
            self.assertIn('VST3: FabFilter Pro-Q 3 (FabFilter)', content)
            self.assertIn('VST: CLA-2A (Waves)', content)
            
        os.remove(output_rpp)

    def test_phase_correlation(self):
        file1 = "test_phase1.wav"
        file2 = "test_phase2.wav"
        file3 = "test_phase3.wav"
        
        sr = 8000
        with wave.open(file1, 'wb') as w:
            w.setparams((1, 2, sr, sr, 'NONE', 'not compressed'))
            data = [int(16000 * math.sin(2 * math.pi * 100 * i / sr)) for i in range(sr)]
            w.writeframes(struct.pack(f"<{sr}h", *data))
            
        with wave.open(file2, 'wb') as w:
            w.setparams((1, 2, sr, sr, 'NONE', 'not compressed'))
            data = [int(16000 * math.sin(2 * math.pi * 100 * i / sr)) for i in range(sr)]
            w.writeframes(struct.pack(f"<{sr}h", *data))
            
        with wave.open(file3, 'wb') as w:
            w.setparams((1, 2, sr, sr, 'NONE', 'not compressed'))
            data = [int(-16000 * math.sin(2 * math.pi * 100 * i / sr)) for i in range(sr)]
            w.writeframes(struct.pack(f"<{sr}h", *data))
            
        corr_in_phase = get_phase_correlation(file1, file2)
        corr_out_phase = get_phase_correlation(file1, file3)
        
        self.assertAlmostEqual(corr_in_phase, 1.0, places=2)
        self.assertAlmostEqual(corr_out_phase, -1.0, places=2)
        
        os.remove(file1)
        os.remove(file2)
        os.remove(file3)

    def test_fuzzy_match_track(self):
        track_list = ["Guitar_Main", "Vocal_Lead", "Kick_Drum", "Bass"]
        
        self.assertEqual(fuzzy_match_track("Guitar_Main.wav", track_list), "Guitar_Main")
        self.assertEqual(fuzzy_match_track("Vocal_Lead_consolidated_01.wav", track_list), "Vocal_Lead")
        self.assertEqual(fuzzy_match_track("Kick Drum Mixdown.wav", track_list), "Kick_Drum")
        self.assertIsNone(fuzzy_match_track("Synth_Arp_02.wav", track_list))

    def test_join_split_mono_files(self):
        left_file = "test_split_mono_l.wav"
        right_file = "test_split_mono_r.wav"
        stereo_file = "test_stereo_joined.wav"
        
        sr = 8000
        with wave.open(left_file, 'wb') as w:
            w.setparams((1, 2, sr, sr, 'NONE', 'not compressed'))
            data = [8000] * sr
            w.writeframes(struct.pack(f"<{sr}h", *data))
            
        with wave.open(right_file, 'wb') as w:
            w.setparams((1, 2, sr, sr, 'NONE', 'not compressed'))
            data = [-8000] * sr
            w.writeframes(struct.pack(f"<{sr}h", *data))
            
        join_split_mono_files(left_file, right_file, stereo_file)
        self.assertTrue(os.path.exists(stereo_file))
        
        with wave.open(stereo_file, 'rb') as w_out:
            params = w_out.getparams()
            self.assertEqual(params.nchannels, 2)
            self.assertEqual(params.framerate, sr)
            self.assertEqual(params.sampwidth, 2)
            self.assertEqual(params.nframes, sr)
            
            frames = w_out.readframes(2)
            samples = struct.unpack("<4h", frames)
            self.assertEqual(samples[0], 8000)
            self.assertEqual(samples[1], -8000)
            self.assertEqual(samples[2], 8000)
            self.assertEqual(samples[3], -8000)
            
        os.remove(left_file)
        os.remove(right_file)
        os.remove(stereo_file)

    def test_get_wav_rms(self):
        test_wav = "test_rms.wav"
        sr = 8000
        # Create a full volume sine wave (peak ~ 1.0, RMS ~ 0.707 => -3.0 dB)
        with wave.open(test_wav, 'wb') as w:
            w.setparams((1, 2, sr, sr, 'NONE', 'not compressed'))
            data = [int(32767 * math.sin(2 * math.pi * 100 * i / sr)) for i in range(sr)]
            w.writeframes(struct.pack(f"<{sr}h", *data))
            
        rms_db = get_wav_rms(test_wav)
        self.assertAlmostEqual(rms_db, -3.0, delta=0.5)
        
        os.remove(test_wav)

if __name__ == '__main__':
    unittest.main()
