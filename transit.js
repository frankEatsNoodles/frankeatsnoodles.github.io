const transitApi = "https://desktop-2b6shnm.tailb5236b.ts.net/transit";

const map = L.map("map").setView([45.3845837, -75.6579653], 12.25);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

let vehicleLayer = L.layerGroup().addTo(map);
let fleetFilters = [];

//update the bus view
async function update() {

    try {
        const response = await fetch(transitApi+"/live/vehicleposition");

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        updateRouteFilter(data);

        const newVehicleLayer = L.layerGroup();

        data.forEach(vehicle => {

            if (!vehicleMatchesFilters(vehicle)) {
                return;
            }

            const latitude = vehicle.latitude;
            const longitude = vehicle.longitude;
            const routeId = vehicle.routeId;
            const vehicleId = vehicle.vehicleId;
            const speed = vehicle.speed * 3.6;
            const time = parseInt(vehicle.timestamp);
            const date = new Date(time * 1000);

            const hhmmss = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'America/Toronto',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).format(date);

            const color = getVehicleColor(vehicle);

            const marker = L.marker([latitude, longitude], {
                opacity: 1,
                icon: L.divIcon({
                    className: "vehicle-icon",
                    html: `
                        <div style="
                            background-color: ${color};
                            width: 15px;
                            height: 15px;
                            border-radius: 50%;
                            border: 2px solid white;
                            box-shadow: 0 1px 4px rgba(0,0,0,0.5);
                        "></div>
                    `,
                    iconSize: [22, 22],
                    iconAnchor: [11, 11]
                })
            });

            marker.bindPopup(`
                Route: ${routeId ?? "N/A"}<br>
                Vehicle: ${vehicleId}<br>
                Speed: ${speed != null ? Number(speed).toFixed(1) : "N/A"} km/h<br>
                Timestamp: ${hhmmss}
            `);

            marker.on("click", () => {
                marker.setOpacity(1);
            });

            marker.on("popupclose", () => {
                marker.setOpacity(1);
            });

            newVehicleLayer.addLayer(marker);
        });

        map.removeLayer(vehicleLayer);

        vehicleLayer = newVehicleLayer;
        vehicleLayer.addTo(map);

        console.log("updated map");

    } catch (error) {
        console.error("API request failed:", error);
    }
}

//Set up the filters for the fleet
async function loadFleetFilters() {

    try {
        const response = await fetch(transitApi+"/busfleet/OC%20Transpo");

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        fleetFilters = data;

        const container = document.getElementById("fleetFilter");

        data.forEach(fleet => {
            const label = document.createElement("label");

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = fleet.id;
            checkbox.checked = true;
            checkbox.className = "fleet-checkbox";

            checkbox.addEventListener("change", update);

            label.appendChild(checkbox);
            label.appendChild(
                document.createTextNode(
                    ` ${fleet.manufacturer} - ${fleet.model}`
                )
            );

            container.appendChild(label);
        });

    } catch (error) {
        console.error("Failed to load fleet data:", error);
    }
}

function vehicleMatchesRoute(vehicle) {

    const selectedRoute = document.getElementById("routeFilter").value;

    if (selectedRoute === "all") {
        return true;
    }

    return String(vehicle.routeId) === selectedRoute;
}

function vehicleMatchesFleet(vehicle) {

    const selectedFleetIds = Array.from(
        document.querySelectorAll(".fleet-checkbox:checked")
    ).map(checkbox => Number(checkbox.value));

    if (selectedFleetIds.length === 0) {
        return false;
    }

    const vehicleId = parseInt(vehicle.vehicleId);

    if (isNaN(vehicleId)) {
        return false;
    }

    return fleetFilters.some(fleet =>
        selectedFleetIds.includes(fleet.id) &&
        vehicleId >= fleet.fleetNumberStart &&
        vehicleId <= fleet.fleetNumberEnd
    );
}

function getVehicleColor(vehicle) {

    const vehicleId = parseInt(vehicle.vehicleId);

    const fleet = fleetFilters.find(
        fleet =>
            vehicleId >= fleet.fleetNumberStart &&
            vehicleId <= fleet.fleetNumberEnd
    );

    if (!fleet) {
        return "#808080";
    }

    switch (fleet.model) {
        case "Enviro500 MMC":
            return "#ebae34";

        case "D60LF":
            return "#C2414D";

        case "D60LFR":
            return "#fc5685";

        case "XD60":
            return "#56fce6";

        case "XE40 Xcelsior":
            return "#0088ff";

        case "LFS":
            return "#ba56fc";

        case "LFS (GRT)":
            return "#2f823a";

        case "LFSe+":
            return "#34b7eb";

        default:
            return "#808080";
    }
}

function vehicleMatchesType(vehicle) {

    const selectedType = document.getElementById("vehicleType").value;

    if (selectedType === "all") {
        return true;
    }

    const vehicleId = parseInt(vehicle.vehicleId);

    if (isNaN(vehicleId)) {
        return false;
    }

    const fleet = fleetFilters.find(
        fleet =>
            vehicleId >= fleet.fleetNumberStart &&
            vehicleId <= fleet.fleetNumberEnd
    );

    if (!fleet) {
        return false;
    }

    const model = fleet.model;

    switch (selectedType) {
        case "electric":
            return ["LFSe+", "XE40 Xcelsior"].includes(model);

        case "short":
            return [
                "LFSe+",
                "XE40 Xcelsior",
                "LFS",
                "LFS (GRT)"
            ].includes(model);

        case "long":
            return [
                "XD60",
                "D60LF",
                "D60LFR"
            ].includes(model);

        case "double-decker":
            return model === "Enviro500 MMC";

        default:
            return true;
    }
}

function vehicleMatchesFilters(vehicle) {

    if (!vehicleMatchesFleet(vehicle)) {
        return false;
    }

    if (!vehicleMatchesType(vehicle)) {
        return false;
    }

    if (!vehicleMatchesRoute(vehicle)) {
        return false;
    }

    return true;
}

function updateRouteFilter(data) {

    const select = document.getElementById("routeFilter");
    const currentValue = select.value;

    const routes = [...new Set(
        data
            .map(vehicle => vehicle.routeId)
            .filter(routeId => routeId != null && routeId !== "")
    )].sort((a, b) => {

        const numA = parseInt(a);
        const numB = parseInt(b);

        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }

        return String(a).localeCompare(String(b));
    });

    select.innerHTML = "";

    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "All Routes";
    select.appendChild(allOption);

    routes.forEach(route => {

        const option = document.createElement("option");

        option.value = route;
        option.textContent = route;

        select.appendChild(option);
    });

    if (routes.includes(currentValue)) {
        select.value = currentValue;
    } else {
        select.value = "all";
    }
}

//initial setup
await loadFleetFilters();
update();


//buttons
document.getElementById("fleetFilter").addEventListener("change", update);

document.getElementById("vehicleType").addEventListener("change", update);

document.getElementById("routeFilter").addEventListener("change", update);

document.getElementById("addAllButton").addEventListener("click", () => {

    document.querySelectorAll(".fleet-checkbox").forEach(checkbox => {
        checkbox.checked = true;
    });

    update();
});

document.getElementById("removeAllButton").addEventListener("click", () => {

    document.querySelectorAll(".fleet-checkbox").forEach(checkbox => {
        checkbox.checked = false;
    });

    update();
});

document.getElementById("updateButton").addEventListener("click", update);

window.addEventListener("resize", () => {
    map.invalidateSize();
});