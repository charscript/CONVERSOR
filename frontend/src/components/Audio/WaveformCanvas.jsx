import { useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';

export default function WaveformCanvas({ workspacePath, filename, audioEl, isPlaying }) {
  const canvasRef = useRef(null);
  const [peaks, setPeaks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const animationRef = useRef(null);

  // Fetch peaks when filename changes
  useEffect(() => {
    if (!workspacePath || !filename) {
      setPeaks([]);
      return;
    }
    
    let isMounted = true;
    const fetchPeaks = async () => {
      setIsLoading(true);
      try {
        const data = await api.getAudioPeaks(workspacePath, filename);
        if (isMounted && data.peaks) {
          setPeaks(data.peaks);
        }
      } catch (err) {
        console.error("Error fetching peaks", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchPeaks();
    return () => { isMounted = false; };
  }, [workspacePath, filename]);

  // Unified Draw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      
      if (isLoading) {
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.fillText('Cargando picos...', 20, h/2 + 5);
        return;
      }
      
      if (!peaks || peaks.length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.fillText(filename ? 'Sin datos de forma de onda' : 'Selecciona una pista para previsualizar', 20, h/2 + 5);
        return;
      }
      
      // Draw Peaks
      const centerY = h / 2;
      const barWidth = w / peaks.length;
      
      ctx.fillStyle = 'rgba(0, 242, 254, 0.7)'; // Cyan color
      for (let i = 0; i < peaks.length; i++) {
        const p = peaks[i];
        const barHeight = p * (h / 2) * 0.95;
        const x = i * barWidth;
        ctx.fillRect(x, centerY - barHeight, Math.max(1, barWidth - 1), barHeight * 2);
      }

      // Draw Playhead if audio is loaded and playing
      if (audioEl && !audioEl.paused && audioEl.duration) {
        const progress = audioEl.currentTime / audioEl.duration;
        const playheadX = progress * w;
        
        // Playhead line
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 10;
        ctx.fillRect(playheadX, 0, 2, h);
        ctx.shadowBlur = 0; // Reset shadow
      }

      // If playing, schedule next frame
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(render);
      }
    };

    // Trigger initial render
    render();

    // Cleanup animation frame
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [peaks, isLoading, filename, audioEl, isPlaying]);

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={90} 
      className="w-full h-full object-fill"
    />
  );
}
