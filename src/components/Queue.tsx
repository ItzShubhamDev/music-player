import { ListCheck, ListPlus, Trash } from "lucide-react";
import { Music } from "../types";
import { Tooltip } from "react-tooltip";
import { memo } from "react";

const Queue = ({
    music,
    setMusic,
    queue,
    playlist,
    setQueue,
    setHistory,
    addToPlaylist,
}: {
    music: Music | null;
    setMusic: React.Dispatch<React.SetStateAction<Music | null>>;
    queue: Music[];
    playlist: Music[];
    setQueue: React.Dispatch<React.SetStateAction<Music[]>>;
    setHistory: React.Dispatch<React.SetStateAction<Music[]>>;
    addToPlaylist: (song: Music) => void;
}) => {
    return (
        <div className="w-full h-1/2 p-4 flex flex-col">
            <h1 className="text-white text-2xl font-semibold">Queue</h1>
            <div className="h0full mt-4 pt-4 w-full flex-1 border-t border-gray-400 overflow-y-scroll">
                {music && (
                    <QueueItem
                        music={music}
                        active={true}
                        inPlaylist={playlist.some((s) => s.id === music.id)}
                        onPlaylistAdd={() => addToPlaylist(music)}
                    />
                )}
                {queue.map((song) => (
                    <QueueItem
                        key={song.id}
                        music={song}
                        onPlay={() => {
                            setMusic(song);
                            setHistory((prev) =>
                                music ? [music, ...prev] : prev
                            );
                            setQueue((prev) =>
                                prev.filter((s) => s.id !== song.id)
                            );
                        }}
                        inPlaylist={playlist.some((s) => s.id === song.id)}
                        onDelete={() => {
                            setQueue((prev) =>
                                prev.filter((s) => s.id !== song.id)
                            );
                        }}
                        onPlaylistAdd={() => {
                            addToPlaylist(song);
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

const QueueItem = ({
    music,
    active,
    inPlaylist,
    onPlay,
    onPlaylistAdd,
    onDelete,
}: {
    music: Music;
    active?: boolean;
    inPlaylist?: boolean;
    onPlay?: () => void;
    onPlaylistAdd?: () => void;
    onDelete?: () => void;
}) => {
    return (
        <div
            className={`w-full flex items-center space-x-4 p-2 rounded-lg cursor-pointer ${
                active ? "bg-gray-800" : ""
            }`}
            onClick={onPlay}
        >
            <img
                src={music.cover}
                alt={music.name}
                className="w-12 h-12 rounded-lg"
            />
            <div className="flex-1 overflow-hidden">
                <Tooltip
                    id={music.id}
                    place="top"
                    noArrow
                    opacity={1}
                    offset={2}
                />
                <h1
                    className="text-white font-semibold truncate"
                    data-tooltip-id={music.id}
                    data-tooltip-content={music.name}
                >
                    {music.name}
                </h1>
                <p className="text-gray-300 truncate">{music.artist}</p>
            </div>
            <div className="flex items-center space-x-1">
                <Tooltip
                    id={music.id + "playlisy"}
                    place="top"
                    noArrow
                    opacity={1}
                />
                <Tooltip
                    id={music.id + "delete"}
                    place="top"
                    noArrow
                    opacity={1}
                />
                {onPlaylistAdd && (
                    <button
                        className={`transition-colors ${
                            inPlaylist
                                ? "text-[var(--primary)]"
                                : "text-white hover:text-[var(--primary)]"
                        }`}
                        disabled={inPlaylist}
                        onClick={(e) => {
                            e.stopPropagation();
                            onPlaylistAdd();
                        }}
                        data-tooltip-content="Add to Playlist"
                        data-tooltip-id="playlist"
                    >
                        {inPlaylist ? (
                            <ListCheck size={20} />
                        ) : (
                            <ListPlus size={20} />
                        )}
                    </button>
                )}
                {onDelete && (
                    <button
                        className="text-white hover:text-[var(--primary)] transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        data-tooltip-content="Delete"
                        data-tooltip-id={music.id + "delete"}
                    >
                        <Trash size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default memo(Queue);
