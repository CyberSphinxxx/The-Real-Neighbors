import React, { useEffect, useRef } from 'react';

interface WPMGraphProps {
  history: { second: number; wpm: number }[];
  errors: number[]; // the seconds where errors occurred
  ghostHistory?: { second: number; wpm: number }[];
}

export const WPMGraph: React.FC<WPMGraphProps> = ({ history, errors, ghostHistory }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = 40;

    const maxTime = history[history.length - 1].second;
    const minTime = 0;
    
    // Find max WPM across user and ghost
    let maxWPM = Math.max(...history.map(h => h.wpm));
    if (ghostHistory && ghostHistory.length > 0) {
      maxWPM = Math.max(maxWPM, ...ghostHistory.map(h => h.wpm));
    }
    // Add some headroom
    maxWPM = Math.ceil(maxWPM / 10) * 10 + 20;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Get primary color from CSS var or fallback
    const style = getComputedStyle(document.body);
    const primaryColor = style.getPropertyValue('--color-primary').trim() || '#3b82f6';
    const mutedColor = style.getPropertyValue('--color-muted').trim() || '#9ca3af';
    const gridColor = style.getPropertyValue('--color-border-subtle').trim() || '#e5e7eb';
    const dangerColor = style.getPropertyValue('--color-danger').trim() || '#ef4444';

    // Helper coordinates
    const getX = (sec: number) => padding + ((sec - minTime) / (maxTime === 0 ? 1 : maxTime)) * (width - padding * 2);
    const getY = (wpm: number) => height - padding - (wpm / maxWPM) * (height - padding * 2);

    // Draw Grid and Y-axis labels
    ctx.beginPath();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.fillStyle = mutedColor;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= maxWPM; i += 20) {
      const y = getY(i);
      ctx.moveTo(padding - 5, y);
      ctx.lineTo(width - padding, y);
      ctx.fillText(i.toString(), padding - 10, y);
    }
    ctx.stroke();

    // X-axis labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const step = Math.max(1, Math.ceil(maxTime / 10));
    for (let i = 0; i <= maxTime; i += step) {
      const x = getX(i);
      ctx.fillText(i.toString() + 's', x, height - padding + 10);
    }

    // Draw Ghost History
    if (ghostHistory && ghostHistory.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = mutedColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]); // Dashed line for ghost
      ctx.moveTo(getX(ghostHistory[0].second), getY(ghostHistory[0].wpm));
      for (let i = 1; i < ghostHistory.length; i++) {
        ctx.lineTo(getX(ghostHistory[i].second), getY(ghostHistory[i].wpm));
      }
      ctx.stroke();
      ctx.setLineDash([]); // Reset
    }

    // Draw User History Line
    ctx.beginPath();
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    // Gradient fill under the curve
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, `${primaryColor}40`); // 25% opacity
    gradient.addColorStop(1, `${primaryColor}00`);

    ctx.moveTo(getX(history[0].second), getY(history[0].wpm));
    for (let i = 1; i < history.length; i++) {
      // Smooth curve logic could go here, but straight lines are fine for WPM
      ctx.lineTo(getX(history[i].second), getY(history[i].wpm));
    }
    ctx.stroke();

    // Fill under curve
    ctx.lineTo(getX(history[history.length - 1].second), getY(0));
    ctx.lineTo(getX(history[0].second), getY(0));
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw Errors
    errors.forEach(sec => {
      const h = history.find(item => item.second === sec);
      if (h) {
        ctx.beginPath();
        ctx.arc(getX(sec), getY(h.wpm), 4, 0, 2 * Math.PI);
        ctx.fillStyle = dangerColor;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

  }, [history, errors, ghostHistory]);

  return (
    <div className="w-full h-64 bg-surface rounded-xl border border-border-subtle overflow-hidden relative">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />
      <div className="absolute top-2 right-4 flex gap-4 text-xs font-medium">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-primary" /> You
        </div>
        {ghostHistory && ghostHistory.length > 0 && (
          <div className="flex items-center gap-1 text-muted">
            <div className="w-3 h-1 border-b-2 border-dashed border-muted" /> Ghost
          </div>
        )}
        <div className="flex items-center gap-1 text-muted">
          <div className="w-2 h-2 rounded-full bg-danger" /> Error
        </div>
      </div>
    </div>
  );
};
