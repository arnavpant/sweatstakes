// Phase 5 SETT-02 — Web Push service worker.
// Lives at /sw.js (served from public/) so registration scope covers the whole origin.
// No TypeScript: service workers are loaded by URL, not via the bundler.

self.addEventListener('push', function (event) {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(self.location.origin))
      if (existing) {
        existing.focus()
        existing.navigate(targetUrl)
      } else {
        clients.openWindow(targetUrl)
      }
    })
  )
})
