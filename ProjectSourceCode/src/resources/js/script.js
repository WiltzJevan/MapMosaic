(WIP)
fetch('/data/world.geojson')
  .then(response => response.json())
  .then(geojson => {
    const countryCoords = {};
    geojson.features.forEach(feature => {
      const name = feature.properties.name;
      const coordinates = feature.geometry.coordinates;
      // Calculate centroid for the country
      const centroid = turf.centroid(feature).geometry.coordinates;
      countryCoords[name] = centroid;
    });

    // Now you can use countryCoords to place markers
    trips.forEach(trip => {
      const country = trip.country_name || trip.location;
      const coords = countryCoords[country];

      if (coords && trip.image_path) {
        const el = document.createElement('div');
        el.className = 'trip-marker';
        el.style.backgroundImage = `url('${trip.image_path}')`;

        new mapboxgl.Marker(el)
          .setLngLat(coords)
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(trip.title || country))
          .addTo(map);
      }
    });
  });
