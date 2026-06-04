if ("serviceWorker" in navigator) {

  window.addEventListener("load", async () => {

    try {

      const registration = await navigator.serviceWorker.register("/sw.js");

      console.log(
        "Service Worker Registered",
        registration
      );

      // AUTO RELOAD WHEN UPDATED
      registration.addEventListener(
        "updatefound",
        () => {

          const newWorker = registration.installing;

          newWorker.addEventListener(
            "statechange",
            () => {
              if (newWorker.state === "activated") 
                {

                window.location.reload();
              }
            }
          );
        }
      );
      
    } catch (err) {

      console.error(
        "Service Worker Registration Failed",
        err
      );

    }

  });

}