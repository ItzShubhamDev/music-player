import express from "express";
import ViteExpress from "vite-express";
import ytdl from "@distube/ytdl-core";
import YTMusic from "ytmusic-api";
const ytmusic = new YTMusic();
import { Readable } from "stream";
let agent: ytdl.Agent | undefined;

try {
    const cookies = await import("./cookies.json");
    agent = ytdl.createAgent(cookies.default);
} catch (e) {
    console.log("Error settings cookies, proceeding without cookies", e);
}

const app = express();

app.get("/info", async (req, res) => {
    const v = req.query.v as string;
    if (!v) return res.status(400).send("Missing video ID.");
    try {
        const info = await ytdl.getBasicInfo(
            `https://www.youtube.com/watch?v=${v}`,
            { agent }
        );
        res.json(info);
    } catch (err) {
        console.error("Error getting video info:", err);
        res.status(500).send("Error fetching YouTube video.");
    }
});

app.get("/song", async (req, res) => {
    const v = req.query.v as string;
    if (!v) return res.status(400).send("Missing video ID.");

    try {
        const response = ytdl(`https://www.youtube.com/watch?v=${v}`, {
            filter: "audioonly",
            quality: "highestaudio",
            agent,
        });
        const buffer = await streamToBuffer(response);
        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Content-Disposition", 'attachment; filename="song.mp3"');
        res.setHeader("Content-Length", buffer.length);
        res.end(buffer);
    } catch (err) {
        console.error("Error getting the stream:", err);
        res.status(500).send("Error fetching YouTube video.");
    }
});

app.get("/search", async (req, res) => {
    const query = req.query.q as string;
    const results = await ytmusic.search(query);
    const songs = results.filter(
        (song) =>
            (song.type == "SONG" || song.type == "VIDEO") &&
            song.videoId &&
            song.videoId != "" &&
            song.duration! < 1200
    );
    res.json(songs);
});

app.get("/suggest", async (req, res) => {
    const query = req.query.q as string;
    const results = await ytmusic.getSearchSuggestions(query);
    res.json(results);
});

app.get("/thumbnail", async (req, res) => {
    const v = req.query.v as string;
    if (!v) return res.status(400).send("Missing video ID.");
    const info = await ytdl.getBasicInfo(
        `https://www.youtube.com/watch?v=${v}`,
        { agent }
    );
    const thumbnail = bestThumbnail(info.videoDetails.thumbnails);
    const r = await fetch(thumbnail.url);
    const arr = await r.arrayBuffer();
    const buffer = Buffer.from(arr);
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Content-Length", buffer.length);
    res.end(buffer);
});

ytmusic.initialize().then(() => {
    ViteExpress.listen(app, 3000, () => console.log("Server is listening..."));
});

async function streamToBuffer(readableStream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        readableStream.on("data", (data) => {
            if (typeof data === "string") {
                chunks.push(Buffer.from(data, "utf-8"));
            } else if (data instanceof Buffer) {
                chunks.push(data);
            } else {
                const jsonData = JSON.stringify(data);
                chunks.push(Buffer.from(jsonData, "utf-8"));
            }
        });
        readableStream.on("end", () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on("error", reject);
    });
}

function bestThumbnail(
    thumbnails: ytdl.videoInfo["videoDetails"]["thumbnails"]
) {
    return thumbnails.reduce((a, b) => {
        return b.width * b.height > a.width * a.height ? b : a;
    });
}
