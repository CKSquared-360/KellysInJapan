/* Japan 2026 — offline helper. Network-first so you always get the newest app when online; falls back to the last copy offline. */
const CACHE='japan2026-v2026-10-06-maps';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
const CDN=['https://unpkg.com/leaflet@1.9.4/dist/leaflet.css','https://unpkg.com/leaflet@1.9.4/dist/leaflet.js','https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css','https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js','https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.1.4/leaflet-maplibre-gl.js'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(async c=>{
    await c.addAll(CORE).catch(()=>{});
    await Promise.all(CDN.map(u=>fetch(u,{mode:'no-cors'}).then(r=>c.put(u,r)).catch(()=>{})));
  }).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request, url=new URL(req.url);
  if(req.method!=='GET') return;
  const sameOrigin=url.origin===location.origin, cdn=CDN.includes(req.url);
  if(!sameOrigin&&!cdn) return;                       /* maps tiles, Firebase, weather etc. go straight to the network */
  e.respondWith(
    fetch(req).then(res=>{ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{}); return res; })
      .catch(()=>caches.match(req).then(r=>r||(req.mode==='navigate'?caches.match('./index.html'):undefined)))
  );
});
