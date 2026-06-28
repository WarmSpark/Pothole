import WebTorrent from 'webtorrent';
const client = new WebTorrent();
const t = client.add('magnet:?xt=urn:btih:465ab07800000000000000000000000000000000');
const t2 = client.get('magnet:?xt=urn:btih:465ab07800000000000000000000000000000000');
console.log('typeof t2:', typeof t2);
console.log('t2 is null?', t2 === null);
console.log('t2:', t2);
process.exit();
