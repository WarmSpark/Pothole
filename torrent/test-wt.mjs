import WebTorrent from 'webtorrent';
const client = new WebTorrent();
const t = client.add('magnet:?xt=urn:btih:465ab078');
console.log('Type of add return:', typeof t.on);
const t2 = client.get('magnet:?xt=urn:btih:465ab078');
console.log('Type of get return:', typeof t2.on);
process.exit();
