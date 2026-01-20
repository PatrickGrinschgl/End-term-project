/* =====================================================
   MAP INITIALIZATION
===================================================== */

// Create Leaflet map and set initial view (Graz – Innere Stadt)
const map = L.map('map').setView([47.071, 15.438], 15);

// Add OpenStreetMap basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);


/* =====================================================
   LOAD DISTRICT BOUNDARY (GEOJSON)
===================================================== */

// Load Innere Stadt boundary and display it on the map
fetch('data/innere_stadt.geojson')
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


/* =====================================================
   DATA STORAGE (IN-MEMORY)
===================================================== */

// GeoJSON FeatureCollection for participant input
let geojsonData = {
    type: "FeatureCollection",
    features: []
};


/* =====================================================
   FORM SUBMISSION & POINT CREATION
===================================================== */

document
    .getElementById('surveyForm')
    .addEventListener('submit', function (e) {

        // Prevent page reload
        e.preventDefault();

        // Use map center as selected point (crosshair logic)
        const selectedLatLng = map.getCenter();

        // Create GeoJSON feature
        const feature = {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [
                    selectedLatLng.lng,
                    selectedLatLng.lat
                ]
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

        // Store feature in memory
        geojsonData.features.push(feature);


        /* -----------------------------------------------
           MARKER STYLING BASED ON EXPERIENCE
        ----------------------------------------------- */

        let markerColor = "gray"; // default color

        if (feature.properties.experience === "comfortable") {
            markerColor = "green";
        } else if (feature.properties.experience === "stressed") {
            markerColor = "red";
        } else if (feature.properties.experience === "socialize") {
            markerColor = "blue";
        } else if (feature.properties.experience === "alone") {
            markerColor = "purple";
        }

        // Add marker to map
        L.circleMarker(selectedLatLng, {
            radius: 6,
            color: markerColor,
            fillColor: markerColor,
            fillOpacity: 0.7
        })
        .addTo(map)
        .bindPopup(`
            <b>${feature.properties.experience}</b><br>
            <b>Reason:</b> ${feature.properties.reason}<br>
            <b>Comment:</b> ${feature.properties.comment || "—"}
        `);

        // Reset form after submission
        document.getElementById('surveyForm').reset();
    });


/* =====================================================
   GEOJSON DOWNLOAD FUNCTIONALITY
===================================================== */

/**
 * Utility function to save JSON content as a file
 */
function saveToFile(content, fileName) {
    const blob = new Blob(
        [JSON.stringify(content, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Download button listener
document
    .getElementById('downloadBtn')
    .addEventListener('click', function () {

        // Prevent empty downloads
        if (geojsonData.features.length === 0) {
            alert("No points to download!");
            return;
        }

        // Deep copy of collected data
        const dataToExport = JSON.parse(
            JSON.stringify(geojsonData)
        );

        // Filename with timestamp
        const fileName = `participant_data_${new Date()
            .toISOString()
            .replace(/[:.]/g, '-')}.geojson`;

        // Save file
        saveToFile(dataToExport, fileName);
        alert("Data downloaded successfully!");

        // Optional cleanup
        geojsonData.features = [];
        document.getElementById('surveyForm').reset();
    });


/* =====================================================
   DYNAMIC REASON SELECTION
===================================================== */

const themeSelect = document.getElementById('theme');
const reasonSelect = document.getElementById('reason');

// Show only reason options that match the selected experience type
// Disable reason dropdown if no experience is selected
themeSelect.addEventListener('change', function () {
    const selectedTheme = this.value;

    // Enable or disable reason dropdown
    reasonSelect.disabled = !selectedTheme;

    // Reset current selection
    reasonSelect.value = "";

    // Show only reasons matching the selected theme
    Array.from(reasonSelect.options).forEach(option => {
        if (!option.dataset.theme) {
            option.hidden = false;
            return;
        }
        option.hidden = option.dataset.theme !== selectedTheme;
    });
});


/* =====================================================
   MAP RESIZE FIXES
===================================================== */

// Fix for Leaflet not displaying correctly on page load
// Wait 200ms to ensure map container is rendered
setTimeout(() => {
    map.invalidateSize();
}, 200);

// Fix for window resize / orientation changes
window.addEventListener('resize', () => {
    map.invalidateSize();
});