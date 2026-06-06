import { useRef, useEffect } from "react";

interface Props { audioBuffer: AudioBuffer | null; height?: number; color?: string; }

export default function WaveformVisualizer({ audioBuffer, height = 72, color = "#1ed760" }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !audioBuffer) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const W = canvas.offsetWidth * window.devicePixelRatio;
        const H = height * window.devicePixelRatio;
        canvas.width = W; canvas.height = H;

        const data = audioBuffer.getChannelData(0);
        const step = Math.ceil(data.length / W);
        const mid = H / 2;
        ctx.clearRect(0, 0, W, H);

        const grad = ctx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0, "rgba(79,70,229,0.7)");
        grad.addColorStop(0.5, `${color}DD`);
        grad.addColorStop(1, "rgba(163,230,53,0.8)");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.moveTo(0, mid);

        for (let x = 0; x < W; x++) {
            let min = 1, max = -1;
            for (let j = 0; j < step; j++) {
                const s = data[x * step + j];
                if (s < min) min = s; if (s > max) max = s;
            }
            ctx.lineTo(x, mid + max * mid * 0.9);
        }
        for (let x = W - 1; x >= 0; x--) {
            let min = 1, max = -1;
            for (let j = 0; j < step; j++) {
                const s = data[x * step + j];
                if (s < min) min = s; if (s > max) max = s;
            }
            ctx.lineTo(x, mid + min * mid * 0.9);
        }
        ctx.closePath(); ctx.fill();

        ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke();
    }, [audioBuffer, height, color]);

    return <canvas ref={canvasRef} className="waveform-canvas" style={{ height: `${height}px` }} />;
}
