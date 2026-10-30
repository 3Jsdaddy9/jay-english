// JAY UNITED 통합(2026-10-30): 예전 오프라인 캐시를 지우고 스스로 해제해요.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 for(const k of await caches.keys())if(k.startsWith('jay-united'))await caches.delete(k);
 await self.registration.unregister();
 for(const c of await self.clients.matchAll({type:'window'}))c.navigate(c.url);
})()));
