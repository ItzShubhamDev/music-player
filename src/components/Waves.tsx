import { memo, useEffect, useRef, useState } from "react";

const hexToRgba = (hex: string, alpha: number = 1): string => {
    if (hex[0] === "#") {
        hex = hex.slice(1);
    }

    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const Waves = ({
    colors = ["#436EDB"],
    audioElement,
    playing,
}: {
    colors?: string[];
    audioElement?: HTMLAudioElement;
    playing: boolean;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const frequencyDataRef = useRef<Uint8Array | null>(null);

    useEffect(() => {
        if (audioElement) {
            if (!playing) return;
            if (sourceNodeRef.current) return;
            const ctx = audioCtx || new AudioContext();
            audioElement.onplay = () => ctx.resume();
            const source = ctx.createMediaElementSource(audioElement);
            sourceNodeRef.current = source;
            const analyser = ctx.createAnalyser();
            analyserRef.current = analyser;

            analyser.fftSize = 2048;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            frequencyDataRef.current = dataArray;

            source.connect(analyser);
            analyser.connect(ctx.destination);

            setAudioCtx(ctx);
        }
    }, [audioElement, playing]);

    useEffect(() => {
        const updateAudioData = () => {
            if (analyserRef.current && frequencyDataRef.current) {
                analyserRef.current.getByteFrequencyData(
                    frequencyDataRef.current
                );
            }
            requestAnimationFrame(updateAudioData);
        };
        updateAudioData();
    }, []);

    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current as HTMLCanvasElement;
            const parent = canvas.parentElement;
            if (parent) canvas.width = parent.clientWidth;
            const height = window.innerHeight;
            canvas.height = height / 10;
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        let animationFrameId: number;
        const canvas = canvasRef.current as HTMLCanvasElement;
        const ctx = canvas.getContext("2d")!;
        const parent = canvas.parentElement;
        if (parent) canvas.width = parent.clientWidth;
        const { width, height } = canvas;

        const animate = () => {
            const frequencyData = frequencyDataRef.current || new Uint8Array(0);
            analyserRef.current?.getByteFrequencyData(frequencyData);

            ctx.clearRect(0, 0, width, height);
            ctx.beginPath();
            const length = frequencyData.length;

            for (let i = length / 4; i < length * (1 / 2); i++) {
                const x = ((4 * i) / length - 1) * width;
                const y = height - (frequencyData[i] / 255) * height;
                ctx.lineTo(x, y);
            }

            const gradient = ctx.createLinearGradient(
                0,
                height / 2,
                width,
                height / 2
            );
            const stopIncrement =
                colors.length > 1 ? 1 / (colors.length - 1) : 0;
            colors.forEach((color, index) => {
                gradient.addColorStop(stopIncrement * index, hexToRgba(color));
            });

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.stroke();
            if (playing) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animate();
        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [colors, playing, canvasRef]);

    return <canvas ref={canvasRef} width="100%" height="100px"></canvas>;
};

export default memo(Waves);
