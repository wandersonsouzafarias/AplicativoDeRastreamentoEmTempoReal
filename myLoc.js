let watchId = null; // Variável global para armazenar o ID do watch
let map = null; // Variável global do mapa
let pathCoords = []; // Array para armazenar as coordenadas da trilha
let pathLine = null; // Variável global para armazenar a linha da trilha

// Definir opções para a geolocalização
const options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("watch").addEventListener("click", watchLocation);
    document.getElementById("clearWatch").addEventListener("click", clearWatch);
    document.getElementById("clearPath").addEventListener("click", clearPath);
});

function watchLocation() {
    if (!navigator.geolocation) {
        alert("Geolocalização não é suportada pelo seu navegador.");
        return;
    }

    if (watchId === null) {
        watchId = navigator.geolocation.watchPosition(
            displayLocation,
            displayError,
            options
        );
        updateStatus("🛰️ Rastreamento iniciado.");
    }
}

function clearWatch() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        updateStatus("❌ Rastreamento cancelado.");
    }
}

function displayLocation(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;

    var div = document.getElementById("location");
    div.innerHTML = "📍 Você está na Latitude: " + latitude + ", Longitude: " + longitude;

    var km = computeDistance(position.coords, { latitude: 47.624851, longitude: -122.52099 });
    var distance = document.getElementById("distance");
    distance.innerHTML = "📏 Você está a " + km.toFixed(2) + " km do WickedlySmart HQ";

    if (map == null) {
        showMap(position.coords);
    } else {
        scrollMapsToPosition(position.coords);
    }
}

function displayError(error) {
    var errorTypes = {
        0: "Erro desconhecido",
        1: "Permissão negada pelo usuário",
        2: "Posição não disponível",
        3: "Tempo de requisição expirado"
    };
    var errorMessage = errorTypes[error.code];
    if (error.code === 0 || error.code === 2) {
        errorMessage += " " + error.message;
    }

    var div = document.getElementById("location");
    div.innerHTML = "Erro de localização: " + errorMessage;
}

function computeDistance(startCoords, desCoords) {
    var startLaRads = degreesToRadians(startCoords.latitude);
    var startLongRads = degreesToRadians(startCoords.longitude);
    var destLatRads = degreesToRadians(desCoords.latitude);
    var destLongRads = degreesToRadians(desCoords.longitude);

    var Radius = 6371; // km
    var distance = Math.acos(
        Math.sin(startLaRads) * Math.sin(destLatRads) +
        Math.cos(startLaRads) * Math.cos(destLatRads) *
        Math.cos(startLongRads - destLongRads)
    ) * Radius;

    return distance;
}

function degreesToRadians(degrees) {
    return (degrees * Math.PI) / 180;
}

function showMap(coords) {
    var userLatLng = [coords.latitude, coords.longitude];

    map = L.map('map').setView(userLatLng, 13);

    // Camadas de mapa
    var esriStreets = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri'
    });

    var satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri'
    });

    var hybridLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Labels © Esri'
    });

    var hybrid = L.layerGroup([satelliteLayer, hybridLabels]);

    var openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    });

    // Adiciona camada padrão
    esriStreets.addTo(map);

    var baseMaps = {
        "Ruas (moderno)": esriStreets,
        "Satélite": satelliteLayer,
        "Híbrido (Satélite + Nomes)": hybrid,
        "OpenStreetMap": openStreetMap
    };

    L.control.layers(baseMaps).addTo(map);

    L.marker(userLatLng)
        .addTo(map)
        .bindPopup("Você está aqui: " + coords.latitude + ", " + coords.longitude)
        .openPopup();
}

function scrollMapsToPosition(coords) {
    var latlong = L.latLng(coords.latitude, coords.longitude);
    map.panTo(latlong);

    addMarker(latlong, "Nova localização", "Você se moveu para: " + coords.latitude + ", " + coords.longitude);

    pathCoords.push(latlong);

    if (pathLine) {
        map.removeLayer(pathLine);
    }

    pathLine = L.polyline(pathCoords, { color: 'blue' }).addTo(map);
}

function addMarker(latlng, title, content) {
    L.marker(latlng)
        .addTo(map)
        .bindPopup("<b>" + title + "</b><br>" + content)
        .openPopup();
}

function clearPath() {
    pathCoords = [];
    if (pathLine) {
        map.removeLayer(pathLine);
    }
    updateStatus("🧹 Trilha limpa.");
}

function updateStatus(message) {
    var statusDiv = document.getElementById("status");
    statusDiv.innerHTML = message;
    statusDiv.classList.add("show");
    setTimeout(function () {
        statusDiv.classList.remove("show");
    }, 3000);
}
