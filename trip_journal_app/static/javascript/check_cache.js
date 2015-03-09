window.onload = function() {
    if (window.applicationCache) {
        applicationCache.addEventListener('updateready', function() {
            // if (confirm('An update is available. Reload now?')) {
            //     window.location.reload();
            // }
            window.location.reload();
        });
    }
}