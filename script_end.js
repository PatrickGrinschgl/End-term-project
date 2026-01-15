// Initialize map
const map = L.map('map').setView([52.52, 13.405], 12); // Example: Berlin

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Store collected data
let geojsonData = {
    type: "FeatureCollection",
    features: []
};
  
let selectedLatLng = null;
let tempMarker = null;

// Click on map to select location
map.on('click', function (e) {
    selectedLatLng = e.latlng;

    if (tempMarker) {
        map.removeLayer(tempMarker);
    }

    tempMarker = L.marker(selectedLatLng).addTo(map);
});

// Handle form submission
document.getElementById('surveyForm').addEventListener('submit', function (e) {
    e.preventDefault();

    if (!selectedLatLng) {
        alert("Please click on the map to select a location.");
        return;
    }

    const feature = {
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [selectedLatLng.lng, selectedLatLng.lat]
        },
        properties: {
            theme: document.getElementById('theme').value,
            comment: document.getElementById('comment').value,
            age: document.getElementById('age').value,
            gender: document.getElementById('gender').value,
            transport: document.getElementById('transport').value,
            timestamp: new Date().toISOString()
        }
    };

    geojsonData.features.push(feature);

    // Add permanent marker
    L.circleMarker(selectedLatLng, {
        radius: 6,
        color: "#e74c3c"
    }).addTo(map)
      .bindPopup(`<b>${feature.properties.theme}</b><br>${feature.properties.comment}`);

    // Reset temp marker
    map.removeLayer(tempMarker);
    tempMarker = null;
    selectedLatLng = null;

    // Reset form
    document.getElementById('surveyForm').reset();
});

// Download GeoJSON
document.getElementById('downloadBtn').addEventListener('click', function () {
    const dataStr = "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(geojsonData, null, 2));

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "ppgis_data.geojson");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});
