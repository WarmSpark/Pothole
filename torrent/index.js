const express = require('express');
const cors = require('cors');
const torrentStream = require('torrent-stream');

const app = express();
app.use(cors());

const activeEngines = {};
const activeStreams = {};
const lastActivity = {};

let WebTorrent;
let client;

// Initialize WebTorrent via dynamic import to bypass ESM require restrictions
(async () => {
    try {
        const wtModule = await import('webtorrent');
        WebTorrent = wtModule.default;
        client = new WebTorrent({
            maxConns: 200 // Increase max connections for faster seeking
        });
        
        const PORT = process.env.PORT || 3005;
        app.listen(PORT, () => console.log(`Torrent streaming engine listening on port ${PORT}`));
    } catch (e) {
        console.error("Failed to load WebTorrent:", e);
    }
})();

app.get('/stats', (req, res) => {
    const magnet = req.query.magnet;
    if (!magnet) return res.status(400).send('Magnet required');
    
    lastActivity[magnet] = Date.now();
    
    const torrent = activeEngines[magnet];
    if (!torrent) {
        return res.json({ peers: 0, speed: 0, downloaded: 0, progress: 0 });
    }
    
    res.json({
        peers: torrent.numPeers,
        speed: torrent.downloadSpeed,
        downloaded: torrent.downloaded,
        progress: torrent.progress
    });
});
app.get('/stream', (req, res) => {
    const magnet = req.query.magnet;
    if (!magnet) return res.status(400).send('Magnet required');

    lastActivity[magnet] = Date.now();
    let torrent = activeEngines[magnet];

    // Function to handle the stream once the torrent is ready
    const handleStream = (torrent) => {
        let file;
        const fileIdx = req.query.fileIdx;
        
        if (fileIdx !== undefined && !isNaN(parseInt(fileIdx))) {
            file = torrent.files[parseInt(fileIdx)];
        }
        
        // Fallback to largest file if fileIdx is invalid or not provided
        if (!file) {
            file = torrent.files.reduce((a, b) => a.length > b.length ? a : b);
        }
        
        console.log('Streaming file:', file.name, 'Size:', file.length);
        
        // Let WebTorrent handle the HTTP Range requests natively!
        // This solves the moov atom problem and prevents dropping connections during seeks.
        const path = require('path');
        const ext = path.extname(file.name).toLowerCase();
        let contentType = 'video/mp4';
        if (ext === '.mkv') contentType = 'video/x-matroska';
        else if (ext === '.webm') contentType = 'video/webm';
        else if (ext === '.avi') contentType = 'video/x-msvideo';

        const range = req.headers.range;
        if (!range) {
            res.writeHead(200, {
                'Content-Length': file.length,
                'Content-Type': contentType,
                'Accept-Ranges': 'bytes'
            });
            if (req.method === 'HEAD') {
                return res.end();
            }
            const stream = file.createReadStream();
            stream.on('error', (err) => { console.log('Stream error (expected):', err.message); });
            
            const activityInterval = setInterval(() => { lastActivity[magnet] = Date.now(); }, 5000);
            stream.pipe(res);
            
            req.on('close', () => {
                clearInterval(activityInterval);
                stream.destroy();
            });
            return;
        }

        const positions = range.replace(/bytes=/, "").split("-");
        const start = parseInt(positions[0], 10);
        const end = positions[1] ? parseInt(positions[1], 10) : file.length - 1;
        const chunksize = (end - start) + 1;

        res.writeHead(206, {
            'Content-Range': 'bytes ' + start + '-' + end + '/' + file.length,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': contentType
        });
        
        if (req.method === 'HEAD') {
            return res.end();
        }

        const stream = file.createReadStream({ start: start, end: end });
        stream.on('error', (err) => { console.log('Stream error (expected):', err.message); });
        
        const activityInterval = setInterval(() => { lastActivity[magnet] = Date.now(); }, 5000);
        stream.pipe(res);
        
        req.on('close', () => {
            clearInterval(activityInterval);
            stream.destroy();
        });
    };

    if (torrent) {
        if (torrent.ready) {
            handleStream(torrent);
        } else {
            torrent.on('ready', () => handleStream(torrent));
        }
    } else {
        console.log('Starting WebTorrent engine for:', magnet);
        const trackers = [
            'udp://tracker.opentrackr.org:1337/announce',
            'udp://9.rarbg.com:2810/announce',
            'udp://tracker.openbittorrent.com:6969/announce',
            'http://tracker.openbittorrent.com:80/announce',
            'udp://tracker.torrent.eu.org:451/announce',
            'udp://exodus.desync.com:6969/announce',
            'udp://open.stealth.si:80/announce',
            'udp://tracker.moeking.me:6969/announce'
        ];
        
        let enhancedMagnet = magnet;
        trackers.forEach(t => {
            if (!enhancedMagnet.includes(encodeURIComponent(t))) {
                enhancedMagnet += `&tr=${encodeURIComponent(t)}`;
            }
        });

        torrent = client.add(enhancedMagnet, {
            path: '/tmp/torrents',
            announce: trackers
        }, (t) => {
            console.log('WebTorrent engine ready for', magnet);
            // WebTorrent automatically prioritizes the front and back of the file 
            // for the moov atom!
            handleStream(t);
        });
        
        activeEngines[magnet] = torrent;
        
        torrent.on('error', (err) => {
            console.error('Torrent error:', err);
            delete activeEngines[magnet];
        });
    }
});

// Cleanup idle torrents every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const magnet in activeEngines) {
        if (now - lastActivity[magnet] > 10 * 60 * 1000) {
            console.log('Cleaning up idle torrent to free disk space:', magnet);
            const torrent = activeEngines[magnet];
            if (torrent) {
                torrent.destroy({ destroyStore: true }, (err) => {
                    if (err) console.error('Failed to destroy store:', err);
                    else console.log('Successfully wiped torrent cache for:', magnet);
                });
            }
            delete activeEngines[magnet];
            delete lastActivity[magnet];
        }
    }
}, 5 * 60 * 1000);

