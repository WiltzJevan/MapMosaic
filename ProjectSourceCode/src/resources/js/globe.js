async function initMap() {
    // Fetch API key from server
    const response = await fetch('/config');
    const config = await response.json();
    const apiKey = config.apiKey;

    // Load Google Maps script dynamically
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=loadMap`;
    script.async = true;
    document.head.appendChild(script);
}

// Callback function for loading the map
function loadMap() {
    const map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 0, lng: 0 },
        zoom: 3,
        mapTypeId: "hybrid",
        tilt: 45,
        gestureHandling: "greedy",
        disableDefaultUI: false,
    });

    // Auto-rotating globe effect
    let angle = 0;
    setInterval(() => {
        angle = (angle + 0.1) % 360;
        map.setCenter({ lat: 0, lng: angle - 180 });
    }, 100);

    // Enable clicking to add markers
    google.maps.event.addListener(map, "click", (event) => {
        new google.maps.Marker({
            position: event.latLng,
            map: map,
        });
    });

    // Example travel path
    const travelPath = new google.maps.Polyline({
        path: [{ lat: 37.7749, lng: -122.4194 }, { lat: 34.0522, lng: -118.2437 }],
        geodesic: true,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 2,
    });
    travelPath.setMap(map);
}

// Initialize map loading
initMap();
