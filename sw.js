// 인터넷이 약하거나 끊겨도 앱이 바로 열리게 한다.
// 저장해 둔 것을 먼저 보여 주고(기다리지 않음), 뒤에서 새 버전을 받아 두었다가 다음에 열 때 쓴다.
const CACHE = "shopping-list-v3";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./fonts/list-sans.woff2"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  // 앱 화면 요청은 주소 뒤에 무엇이 붙든 index.html 저장본으로 답한다.
  const key = req.mode === "navigate" ? "./index.html" : req;
  const fresh = fetch(req).then(res => {
    if (res.ok && res.type === "basic" && !res.redirected){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
    return res;
  });
  e.waitUntil(fresh.then(() => {}, () => {}));
  e.respondWith(
    caches.match(key, { ignoreSearch: true })
      .then(hit => hit || fresh)
      .catch(() => caches.match("./index.html"))
  );
});
