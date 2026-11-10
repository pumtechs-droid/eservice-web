
"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log(
            "E-SERVICE HUB service worker registered:",
            registration.scope
          );
        })
        .catch((error) => {
          console.error(
            "Service worker registration failed:",
            error
          );
        });
    }
  }, []);

  return null;
}
