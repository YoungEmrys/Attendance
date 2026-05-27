if ("serviceWorker" in navigator) {

  window.addEventListener("load", async () => {

    try {

      const registration =
        await navigator.serviceWorker.register("/sw.js");

      console.log(
        "Service Worker Registered",
        registration
      );

    } catch (err) {

      console.error(
        "Service Worker Registration Failed",
        err
      );

    }

  });

}