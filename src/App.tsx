import { useEffect, useState } from "react";
import Player from "./components/Player";
import Playlist from "./components/Playlist";
import { Music } from "./types";
import Search from "./components/Search";

const App = () => {
    const [music, setMusic] = useState<Music | null>(null);
    const [playlist, setPlaylist] = useState<Music[]>([]);
    const [queue, setQueue] = useState<Music[]>([]);
    const [history, setHistory] = useState<Music[]>([]);
    const [colors, setColors] = useState<string[]>([]);

    useEffect(() => {
        const playlist = localStorage.getItem("playlist") || "[]";
        setPlaylist(JSON.parse(playlist));
        const music = localStorage.getItem("music");
        if (music) setMusic(JSON.parse(music));
    }, []);

    useEffect(() => {
        if (music) localStorage.setItem("music", JSON.stringify(music));
    }, [music]);

    useEffect(() => {
        if (playlist.length > 0) {
            localStorage.setItem("playlist", JSON.stringify(playlist));
        }
    }, [playlist]);

    return (
        <div
            className="h-screen relative flex items-center justify-center w-full bg-blend-multiply overflow-hidden bg-gray-900"
            style={{
                background: `linear-gradient(to left, ${colors.join(
                    ", "
                )}), linear-gradient(to bottom, rgb(17, 24, 39), rgb(17, 24, 39, 0.8))`,
            }}
        >
            <Search setMusic={setMusic} setQueue={setQueue} />
            <div>
                <Player
                    music={music}
                    setMusic={setMusic}
                    queue={queue}
                    setQueue={setQueue}
                    history={history}
                    setHistory={setHistory}
                    colors={colors}
                    setColors={setColors}
                />
            </div>
            <Playlist
                music={music}
                setMusic={setMusic}
                queue={queue}
                setQueue={setQueue}
                setHistory={setHistory}
                playlist={playlist}
                setPlaylist={setPlaylist}
            />
        </div>
    );
};

export default App;
