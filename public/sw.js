const CACHE_NAME = "attendance-v4";

const STATIC_ASSETS = [

  "/",
  "/index.html",
  "/students.html",
  "/registered-students.html",
  "/attendance.html",
  "/performance.html",
  "/users.html",
  "/settings.html",
  "/edit-student.html",
  "/holidays.html",
  "/student-details.html",
  "/login.html",
  "/signup.html",
  "/offline.html",


  "/manifest.json",


  "/js/api.js",
  "/js/auth.js",
  "/js/attendance.js",
  "/js/dashboard.js",
  "/js/holidays.js",
  "/js/importer.js",
  "/js/performance.js",
  "/js/report-export.js",
  "/js/settings.js",
  "/js/students.js",
  "/js/edit-student.js",
  "/js/xlsx.full.min.js",


  "/js/core/settings.js",
  "/js/core/utils.js",
  "/js/core/ui.js",
  "/js/core/notifications.js",
  "/js/core/dom-init.js",
  "/js/core/pwa.js",
  "/js/core/attendance-actions.js",
  "/js/core/attendance-render.js",  
  "/js/core/dashboard-render.js",
  "/js/core/dashboard-reports.js",
  "/js/core/dashboard-utils.js",
  "/js/core/db.js",

  "/css/notifications.css",
  "/css/modal.css",
  "/css/loader.css",


  "/icons/icon-192.png",
  "/icons/icon-512.png"

];

self.addEventListener("install", event => {

  console.log("Service Worker Installed");

  self.skipWaiting();

  event.waitUntil(

    caches.open(CACHE_NAME)
      .then(cache => {

        console.log("Caching App Shell");

        return cache.addAll(STATIC_ASSETS);

      })

  );

});

self.addEventListener("activate", event => {

  console.log("Service Worker Activated");

  self.clients.claim();

  event.waitUntil(

    caches.keys().then(keys => {

      return Promise.all(

        keys.map(key => {

          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }

        })

      );

    })

  );

});

self.addEventListener("fetch", event => {

  event.respondWith(

    caches.match(event.request)

      .then(cachedResponse => {

        // RETURN CACHE FIRST
        if (cachedResponse) {
          return cachedResponse;
        }

        // NETWORK REQUEST
        return fetch(event.request)

          .then(networkResponse => {

            // CACHE GET REQUESTS
            return caches.open(CACHE_NAME)

              .then(cache => {

                if (event.request.method === "GET") {

                  cache.put(
                    event.request,
                    networkResponse.clone()
                  );

                }

                return networkResponse;

              });

          })

          .catch(() => {

            console.warn(
              "Offline fetch failed:",
              event.request.url
            );

            // OFFLINE PAGE
            if (event.request.mode === "navigate") {

              return caches.match("/offline.html");

            }

            // API FALLBACK
            if (event.request.url.includes("/api/")) {

              return new Response(

                JSON.stringify({
                  success: false,
                  offline: true,
                  message: "Offline"
                }),

                {
                  status: 503,
                  headers: {
                    "Content-Type": "application/json"
                  }
                }

              );

            }

            // GENERIC FALLBACK
            return new Response(
              "Offline",
              {
                status: 503
              }
            );

          });

      })

  );

});