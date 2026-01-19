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


// Store collected data
let geojsonData = {
    type: "FeatureCollection",
    features: []
};

let selectedLatLng = null;
let tempMarker = null;



// Handle form submission
document.getElementById('surveyForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const selectedLatLng = map.getCenter();

    const feature = {
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [selectedLatLng.lng, selectedLatLng.lat]
        },
        properties: {
            experience: document.getElementById('theme').value,
            reason: document.getElementById('reason').value,
            comment: document.getElementById('comment').value,
            age: document.getElementById('age').value,
            gender: document.getElementById('gender').value,
            timestamp: new Date().toISOString()
        }


    };

    geojsonData.features.push(feature);

    // Add permanent marker
    L.circleMarker(selectedLatLng, {
        radius: 6,
        color: feature.properties.experience === "comfortable" ? "green" : "red",
        fillOpacity: 0.7
    })
    .addTo(map)
    .bindPopup(`
    <b>${feature.properties.experience}</b><br>
    Reason: ${feature.properties.reason}<br>
    Comment: ${feature.properties.comment}
    `);



    // Reset temp marker
    map.removeLayer(tempMarker);
    tempMarker = null;
    selectedLatLng = null;

    // Reset form
    document.getElementById('surveyForm').reset();
});

// Download GeoJSON
// Utility-Funktion: speichert JSON als Datei
function saveToFile(content, fileName) {
    let blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
    let url = URL.createObjectURL(blob);

    let link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Neuer Download-Button Listener
document.getElementById('downloadBtn').addEventListener('click', function () {
    if (geojsonData.features.length === 0) {
        alert("No points to download!");
        return;
    }

    // Erstelle eine Kopie der Features und füge Socio-Demographics hinzu
    const dataToExport = JSON.parse(JSON.stringify(geojsonData)); // deep copy

    dataToExport.features.forEach(f => {
        // Ihr habt bereits age, gender, experience, reason, timestamp gespeichert
        // Wenn ihr noch was zusätzlich braucht, könnt ihr hier einfügen
    });

    // Dateiname mit Timestamp
    const fileName = `participant_data_${new Date().toISOString().replace(/[:.]/g,'-')}.geojson`;

    // Speichern
    saveToFile(dataToExport, fileName);
    alert("Data downloaded successfully!");

    // Optional: Karte bereinigen & Formular reset
    drawnItems.clearLayers();
    geojsonData.features = [];
    document.getElementById('surveyForm').reset();
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

// Initial fix after page load
setTimeout(() => {
    map.invalidateSize();
}, 200);

// Fix for screen resize / orientation change
window.addEventListener('resize', () => {
    map.invalidateSize();
});

