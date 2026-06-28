import WebTorrent from 'webtorrent';
const client = new WebTorrent();
async function run() {
  const t = await client.get('magnet:?xt=urn:btih:465ab07800000000000000000000000000000000');
  console.log('not found:', t);
}
run();
