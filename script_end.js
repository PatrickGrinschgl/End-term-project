// Initialize map
const map = L.map('map').setView([47.071, 15.438], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Innere Stadt boundary (GeoJSON)
fetch('innere_stadt.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: {
                color: '#2c3e50',
                weight: 2,
                fillOpacity: 0.05
            }
        }).addTo(map);
    });

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
            experience: document.getElementById('theme').value,
            reason: document.getElementById('reason').value,
            age: document.getElementById('age').value,
            gender: document.getElementById('gender').value,
            inside_innere_stadt: innereStadtPolygon
                ? isPointInsidePolygon(selectedLatLng, innereStadtPolygon)
                : null,
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

const themeSelect = document.getElementById('theme');
const reasonSelect = document.getElementById('reason');

themeSelect.addEventListener('change', function () {
    const selectedTheme = this.value;

    // Enable / disable reason dropdown
    reasonSelect.disabled = !selectedTheme;

    // Reset selected reason
    reasonSelect.value = "";

    // Show only matching reasons
    Array.from(reasonSelect.options).forEach(option => {
        if (!option.dataset.theme) {
            option.hidden = false;
            return;
        }
        option.hidden = option.dataset.theme !== selectedTheme;
    });
});
