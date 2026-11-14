const VERSION = '2.1.1';
const CACHE_NAME = `canvaspro-${VERSION}-${Date.now()}`;

const ASSETS = [
  './',
  './index.html',
  './site.webmanifest',
  './manifest.json',
  './icons/favicon-16x16.png',
  './icons/favicon-32x32.png',
  './icons/apple-touch-icon.png',
  './icons/android-chrome-192x192.png',
  './icons/android-chrome-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isPage = url.pathname === '/' || url.pathname.endsWith('/index.html');

  if (isPage || url.pathname.endsWith('/site.webmanifest') || url.pathname.endsWith('/manifest.json')) {
    event.respondWith(
      fetch(event.request).then(async response => {
        let responseToCache = response.clone();
        const contentType = response.headers.get('content-type') || '';

        if (isPage && contentType.includes('text/html')) {
          let html = await response.clone().text();
          const footer = '<div id="developer-footer" class="developer-footer">Developer: Serka I Nyoman Arta</div>';
          if (!html.includes('id="developer-footer"')) {
            html = html.replace(/(<div class="btn-group" id="btnGroup">[\s\S]*?<\/div>)/, `$1\n        ${footer}`);
          }
          const addition = `
<style>
  .developer-footer{width:100%;margin:2px auto 10px;text-align:center;color:#176b32;font-size:12px;line-height:1.5;font-weight:600;}
  #header-running-ticker{position:absolute;z-index:5;overflow:hidden;pointer-events:none;white-space:nowrap;transform:translateY(-50%);}
  #header-running-ticker span{display:inline-block;white-space:nowrap;color:#fff;font-weight:800;text-shadow:1px 1px 0 rgba(0,0,0,.65),2px 2px 0 rgba(0,0,0,.28),0 3px 6px rgba(0,0,0,.45);animation:header-ticker-scroll 15s linear infinite;}
  @keyframes header-ticker-scroll{from{transform:translateX(100%)}to{transform:translateX(-100%)}}
  @media(prefers-reduced-motion:reduce){#header-running-ticker span{animation-duration:60s}}
</style>
<script>
(function(){
  var text='Modern dalam Teknologi, Loyal dalam Pengabdian.';
  var headerX=80,headerY=80,headerW=2240,headerH=300,canvasW=2400,canvasH=2000,duration=15000;
  var started=performance.now(),ticker,canvas,wrapper;
  function placeTicker(){
    canvas=document.getElementById('mainCanvas');
    wrapper=document.getElementById('canvasWrapper');
    if(!canvas||!wrapper)return;
    var cr=canvas.getBoundingClientRect(),wr=wrapper.getBoundingClientRect();
    var sx=cr.width/canvasW,sy=cr.height/canvasH;
    if(!ticker){ticker=document.createElement('div');ticker.id='header-running-ticker';ticker.setAttribute('aria-label',text);ticker.innerHTML='<span></span>';wrapper.appendChild(ticker);ticker.firstChild.textContent=text;}
    ticker.style.left=(cr.left-wr.left+headerX*sx)+'px';
    ticker.style.top=(cr.top-wr.top+(headerY+headerH/2)*sy)+'px';
    ticker.style.width=(headerW*sx)+'px';
    ticker.style.fontSize=(56*sy)+'px';
  }
  function drawTicker(target){
    var ctx=target.getContext('2d');
    if(!ctx)return;
    var scale=target.width/canvasW;
    ctx.save();
    ctx.beginPath();
    ctx.rect(headerX*scale,headerY*scale,headerW*scale,headerH*scale);
    ctx.clip();
    ctx.font='800 '+(56*scale)+'px Segoe UI, Arial, sans-serif';
    ctx.textAlign='left';ctx.textBaseline='middle';
    var width=ctx.measureText(text).width;
    var progress=((performance.now()-started)%duration)/duration;
    var x=(headerX+headerW-progress*(headerW+width))*scale;
    var y=(headerY+headerH/2)*scale;
    ctx.shadowColor='transparent';
    ctx.fillStyle='rgba(0,0,0,.28)';
    ctx.fillText(text,x+2*scale,y+3*scale);
    ctx.fillStyle='rgba(0,0,0,.48)';
    ctx.fillText(text,x+1*scale,y+1.5*scale);
    ctx.fillStyle='#fff';
    ctx.shadowColor='rgba(0,0,0,.42)';ctx.shadowBlur=5*scale;ctx.shadowOffsetX=0;ctx.shadowOffsetY=2*scale;
    ctx.fillText(text,x,y);
    ctx.restore();
  }
  var originalToDataURL=HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL=function(){
    if(this!==canvas&&this.width===canvasW&&this.height===canvasH)drawTicker(this);
    return originalToDataURL.apply(this,arguments);
  };
  placeTicker();
  window.addEventListener('resize',placeTicker);
  window.addEventListener('scroll',placeTicker,{passive:true});
  setTimeout(placeTicker,100);
})();
</script>`;
          const updatedHTML = html.includes('</body>')
            ? html.replace('</body>', addition + '\n</body>')
            : html + addition;
          if (updatedHTML !== (await response.clone().text())) {
            const headers = new Headers(response.headers);
            headers.delete('content-length');
            responseToCache = new Response(updatedHTML, { status: response.status, statusText: response.statusText, headers });
          }
        }

        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache.clone()));
        return responseToCache;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
        return response;
      });
    }).catch(() => undefined)
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

console.log(`[SW] CanvasPRO ${VERSION} loaded`);
console.log('[SW] Developer: Koramil Sukasada');
