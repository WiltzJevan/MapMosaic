function initMap() {
    const map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 0, lng: 0 },
        zoom: 3,
        mapTypeId: "hybrid", // Hybrid mode for a realistic Earth view
        tilt: 45,
        gestureHandling: "greedy", // Allows smooth drag/swipe
        disableDefaultUI: false,  // Enables default UI
    });

    // Add map rotation using setInterval (for an auto-spinning globe)
    let angle = 0;
    setInterval(() => {
        angle = (angle + 0.1) % 360;
        map.setCenter({
            lat: 0,
            lng: angle - 180, // Slowly rotates around the equator
        });
    }, 100);
}

google.maps.event.addListener(map, "click", (event) => {
    new google.maps.Marker({
        position: event.latLng,
        map: map,
    });
});

const travelPath = new google.maps.Polyline({
    path: [{ lat: 37.7749, lng: -122.4194 }, { lat: 34.0522, lng: -118.2437 }],
    geodesic: true,
    strokeColor: "#FF0000",
    strokeOpacity: 1.0,
    strokeWeight: 2,
});
travelPath.setMap(map);

const express = require("express");
const app = express();
app.use(express.static("public")); // Serve HTML, CSS, and JS from public folder
app.listen(5000, () => console.log("Server running on port 5000"));
