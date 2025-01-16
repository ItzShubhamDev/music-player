import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { Music } from "../types";
import {
    Pause,
    Play,
    Repeat,
    Shuffle,
    SkipBack,
    SkipForward,
    Volume2,
} from "lucide-react";
import { Tooltip } from "react-tooltip";
import Waves from "./Waves";
import { extractColors } from "extract-colors";
import Toast from "./Toast";

const Player = ({
    music,
    setMusic,
    queue,
    setQueue,
    history,
    setHistory,
    colors,
    setColors,
}: {
    music: Music | null;
    setMusic: React.Dispatch<React.SetStateAction<Music | null>>;
    queue: Music[];
    setQueue: React.Dispatch<React.SetStateAction<Music[]>>;
    history: Music[];
    setHistory: React.Dispatch<React.SetStateAction<Music[]>>;
    colors: string[];
    setColors: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const progressRef = useRef<HTMLDivElement | null>(null);
    const volumeRef = useRef<HTMLDivElement | null>(null);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [audioUrl, setAudioUrl] = useState<Record<string, string>>({});
    const [cover, setCover] = useState<string | null>(null);
    const [coverUrl, setCoverUrl] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [shuffle, setShuffle] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getMusic = async (v: string) => {
            try {
                if (coverUrl[v]) {
                    setCover(coverUrl[v]);
                    return;
                }
                const r = await fetch(`/thumbnail?v=${v}`);
                const blob = await r.blob();
                const url = URL.createObjectURL(blob);
                setCover(url);
                setCoverUrl((prev) => ({ ...prev, [v]: url }));
            } catch (error) {
                setError("Error fetching music");
                console.error("Error fetching music:", error);
                return null;
            }
        };
        const getSong = async () => {
            if (!audioRef.current) return;
            if (!music) return;
            setLoading(true);
            setPlaying(false);
            try {
                audioRef.current.pause();
                if (audioUrl[music.id]) {
                    audioRef.current.src = audioUrl[music.id];
                    audioRef.current.load();
                    audioRef.current.play();
                    setPlaying(true);
                    return setLoading(false);
                }
                const res = await fetch(`/song?v=${music?.id}`);
                if (res.ok) {
                    const audioBlob = await res.blob();
                    const url = URL.createObjectURL(audioBlob);
                    audioRef.current.src = url;
                    setAudioUrl((prev) => ({ ...prev, [music.id]: url }));
                    audioRef.current.load();
                    try {
                        await audioRef.current.play();
                        setPlaying(true);
                    } catch {
                        /* empty */
                    }
                } else {
                    if (history.length > 0) {
                        setMusic(history[0]);
                        setHistory((prev) => prev.slice(1));
                    }
                    setError("Error fetching audio");
                }
                setLoading(false);
            } catch (error) {
                setLoading(false);
                setError("Error fetching audio");
                console.error("Error fetching audio:", error);
            }
        };
        if (music) {
            getMusic(music.id);
        }
        getSong();
    }, [music]);

    useEffect(() => {
        if (music) localStorage.setItem("music", JSON.stringify(music));
        if (navigator) {
            if ("mediaSession" in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: music?.name,
                    artist: music?.artist,
                    artwork: [
                        {
                            src: cover || "/icon.png",
                            sizes: "320x180",
                            type: "",
                        },
                    ],
                });
            }
        }
        if (!document) return;
        const link: HTMLLinkElement =
            document.querySelector("link[rel*='icon']") ||
            document.createElement("link");
        link.type = "image/png";
        link.rel = "icon";
        link.href = cover || "/icon.png";
        if (!link.parentNode) {
            document.head.appendChild(link);
        }
        const title = music
            ? `${music.name} - ${music.artist}`
            : "Music Player";
        document.title = title;
    }, [music, cover]);

    useEffect(() => {
        const getColors = async () => {
            if (!cover) return;
            const colors = await extractColors(cover);
            const colorsHex = colors.map((color) => color.hex);
            setColors(colorsHex);
            if (!document) return;
            const root = document.documentElement;
            if (colorsHex.length >= 1)
                root.style.setProperty("--primary", colorsHex[0]);
            if (colorsHex.length >= 2)
                root.style.setProperty("--accent", colorsHex[1]);
        };
        getColors();
    }, [cover]);

    useEffect(() => {
        const progress = progressRef.current;
        if (!progress) return;
        progress.addEventListener("click", (e) => {
            if (!audioRef.current) return;
            const rect = progress.getBoundingClientRect();
            if (!rect) return;
            const x = e.clientX - rect.left;
            const width = rect?.right - rect?.left;
            const value = (x / width) * (music?.duration || 0);
            handleProgress(value);
        });

        const volume = volumeRef.current;
        if (!volume) return;
        volume.addEventListener("click", (e) => {
            if (!audioRef.current) return;
            const rect = volume.getBoundingClientRect();
            if (!rect) return;
            const x = e.clientX - rect.left;
            const width = rect?.right - rect?.left;
            const value = x / width;
            audioRef.current.volume = value;
        });
        return () => {
            if (progress) {
                progress.removeEventListener("click", () => {});
            }
            if (volume) {
                volume.removeEventListener("click", () => {});
            }
        };
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = parseFloat(localStorage.getItem("volume") || "1");

        audio.addEventListener("play", () => setPlaying(true));
        audio.addEventListener("pause", () => setPlaying(false));
        audio.addEventListener("timeupdate", () =>
            setProgress(audio.currentTime)
        );
        audio.addEventListener("error", () => {
            setPlaying(false);
        });
        audio.addEventListener("volumechange", () => {
            localStorage.setItem("volume", audio.volume.toString());
        });
        return () => {
            audio.removeEventListener("play", () => setPlaying(true));
            audio.removeEventListener("pause", () => setPlaying(false));
            audio.removeEventListener("timeupdate", () =>
                setProgress(audio.currentTime)
            );
            audio.removeEventListener("error", () => {
                setPlaying(false);
            });
            audio.removeEventListener("volumechange", () => {
                localStorage.setItem("volume", audio.volume.toString());
            });
        };
    }, []);

    const handleProgress = (value: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = value;
        }
        setProgress(value);
    };

    const playPause = () => {
        if (!audioRef.current) return;
        if (loading) return;
        if (audioRef.current.paused) {
            audioRef.current.play();
        } else {
            audioRef.current.pause();
        }
    };

    const formatDuration = (seconds: number): string => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        const hoursDisplay = hrs > 9 ? `${hrs}:` : hrs > 0 ? `0${hrs}:` : "";
        const minutesDisplay =
            mins > 9 ? `${mins}:` : mins > 0 ? `0${mins}:` : "00:";
        const secondsDisplay =
            secs > 9 ? `${secs}` : secs > 0 ? `0${secs}` : "00";

        return `${hoursDisplay}${minutesDisplay}${secondsDisplay}`.trim();
    };

    const nextSong = useCallback(() => {
        if (loading) return;
        console.log(queue);
        if (queue.length > 0) {
            if (shuffle) {
                const random = Math.floor(Math.random() * queue.length);
                setMusic(queue[random]);
                setQueue((prev) => [
                    ...prev.slice(0, random),
                    ...prev.slice(random + 1),
                ]);
                return;
            }
            setMusic(queue[0]);
            setQueue((prev) => prev.slice(1));
            if (music && !history.some((m) => m.id === music.id)) {
                setHistory((prev) => [music, ...prev]);
            }
        }
    }, [queue, shuffle, music]);

    const prevSong = useCallback(() => {
        if (loading) return;
        if (history.length > 0) {
            if (music && !queue.some((m) => m.id === music.id)) {
                setQueue((prev) => [music, ...prev]);
            }
            setMusic(history[0]);
            setHistory((prev) => prev.slice(1));
        }
    }, [history, music]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.addEventListener("ended", nextSong);
        return () => {
            audio.removeEventListener("ended", nextSong);
        };
    }, [nextSong]);

    useEffect(() => {
        if (!navigator) return;
        if ("mediaSession" in navigator) {
            navigator.mediaSession.setActionHandler("play", playPause);
            navigator.mediaSession.setActionHandler("pause", playPause);
            navigator.mediaSession.setActionHandler("previoustrack", prevSong);
            navigator.mediaSession.setActionHandler("nexttrack", nextSong);
        }
    }, [nextSong, prevSong]);

    const setRepeat = () => {
        if (!audioRef.current) return;
        audioRef.current.loop = !audioRef.current.loop;
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center">
            <audio ref={audioRef} className="hidden" />
            <div className="relative sm:bg-gray-800/20 rounded-lg sm:shadow-xl p-6 w-full sm:w-80 space-y-4 flex flex-col items-center justify-center">
                {loading && (
                    <div className="absolute top-0 w-full h-8 overflow-hidden rounded-t-lg">
                        <div className="w-full animate-progress h-1 bg-[var(--primary)] origin-left-right rounded" />
                    </div>
                )}

                <div className="w-72 aspect-square">
                    <img
                        src={cover || "/icon.png"}
                        alt="Album Cover"
                        className="w-full h-full object-cover rounded-lg shadow-md bg-gray-800/50"
                    />
                </div>

                <div className="w-full text-center">
                    <Tooltip
                        id={music?.id}
                        place="top"
                        noArrow
                        opacity={1}
                        offset={2}
                    />
                    <div
                        className="text-lg font-bold text-white truncate"
                        data-tooltip-id={music?.id}
                        data-tooltip-content={music?.name}
                    >
                        {music?.name}
                    </div>
                    <Tooltip
                        id={music?.artist}
                        place="top"
                        noArrow
                        opacity={1}
                        offset={2}
                    />
                    <p
                        className="text-gray-200 truncate"
                        data-tooltip-id={music?.artist}
                        data-tooltip-content={music?.artist}
                    >
                        {music?.artist}
                    </p>
                </div>

                <div className="w-full">
                    <div
                        className="w-full h-2 bg-gray-200 rounded-full cursor-pointer"
                        ref={progressRef}
                    >
                        <div
                            className="h-2 bg-[var(--primary)] rounded-full max-w-full"
                            style={{
                                width: `${
                                    (progress / (music?.duration || 100)) * 100
                                }%`,
                            }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-200 mt-1">
                        <span>{formatDuration(progress)}</span>
                        <span>{formatDuration(music?.duration || 0)}</span>
                    </div>
                </div>

                <div className="flex items-center justify-center space-x-4 text-gray-200">
                    <button
                        className={
                            "hover:text-[var(--primary)] transition-colors " +
                            (shuffle ? "text-[var(--primary)]" : "")
                        }
                        onClick={() => setShuffle(true)}
                    >
                        <Shuffle size={20} />
                    </button>
                    <button
                        className="hover:text-[var(--primary)] transition-colors"
                        onClick={prevSong}
                    >
                        <SkipBack size={24} />
                    </button>
                    <button
                        className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--primary)] text-white hover:bg-[var(--accent)] transition-colors"
                        onClick={playPause}
                        disabled={loading || !music}
                    >
                        {playing ? <Pause size={24} /> : <Play size={24} />}
                    </button>
                    <button
                        className="hover:text-[var(--primary)] transition-colors"
                        onClick={nextSong}
                    >
                        <SkipForward size={24} />
                    </button>
                    <button
                        className={
                            "hover:text-[var(--primary)] transition-colors " +
                            (audioRef.current?.loop
                                ? "text-[var(--primary)]"
                                : "")
                        }
                        onClick={setRepeat}
                    >
                        <Repeat size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-2 w-full">
                    <Volume2 size={20} className="text-gray-400" />
                    <div
                        className="flex-1 h-2 bg-gray-200 rounded-full cursor-pointer"
                        ref={volumeRef}
                    >
                        <div
                            className="h-2 bg-[var(--primary)] rounded-full"
                            style={{
                                width:
                                    (audioRef.current?.volume || 0) * 100 + "%",
                            }}
                        ></div>
                    </div>
                </div>
            </div>
            <Toast message={error} type="error" />
            {colors && (
                <div className="absolute w-full bottom-0 max-h:translate-y-5">
                    {audioRef.current && (
                        <Waves
                            colors={colors}
                            audioElement={audioRef.current}
                            playing={playing}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default memo(Player);
