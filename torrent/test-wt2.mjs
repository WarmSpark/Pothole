import WebTorrent from 'webtorrent';
const client = new WebTorrent();
const t = client.add('magnet:?xt=urn:btih:465ab07800000000000000000000000000000000');
const t2 = client.get('magnet:?xt=urn:btih:465ab07800000000000000000000000000000000');
console.log('t2 keys:', Object.keys(t2 || {}));
process.exit();
