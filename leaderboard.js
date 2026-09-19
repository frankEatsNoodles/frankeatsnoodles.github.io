const apiUrl = "https://desktop-2b6shnm.tailb5236b.ts.net/transit/live/average";
const container = document.getElementById("leaderboard-data");

let rows = new Map();

async function updateLeaderboard() {
    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const routes = await response.json();

        // Save current positions
        const oldPositions = new Map();

        container.querySelectorAll(".leaderboard-row").forEach(row => {
            oldPositions.set(
                row.dataset.routeId,
                row.getBoundingClientRect()
            );
        });

        // Create or update rows
        routes.forEach((route, index) => {
            let row = rows.get(route.routeId);

            if (!row) {
                row = document.createElement("div");

                row.className = "leaderboard-row";
                row.dataset.routeId = route.routeId;

                row.innerHTML = `
                    <div class="rank"></div>
                    <div class="route-id"></div>
                    <div class="route-name"></div>
                    <div class="speed"></div>
                    `;

                rows.set(route.routeId, row);
            }

            row.querySelector(".rank").textContent =
                `#${index + 1}`;

            const routeIdElement =
                row.querySelector(".route-id");

            routeIdElement.textContent =
                route.routeId;

            // Apply route color
            if (
                route.routeColor &&
                route.routeColor !== "No route color"
            ) {
                routeIdElement.style.backgroundColor =
                    `#${route.routeColor}`;
            } else {
                routeIdElement.style.backgroundColor =
                    "#888";
            }

            row.querySelector(".route-name").textContent =
                route.routeName;

            row.querySelector(".speed").textContent =
                `${Number(route.averageSpeed).toFixed(1)} km/h`;
        });

        // Remove routes no longer returned by API
        const currentRoutes = new Set(
            routes.map(route => route.routeId)
        );

        for (const [routeId, row] of rows) {
            if (!currentRoutes.has(routeId)) {
                row.remove();
                rows.delete(routeId);
            }
        }

        // Reorder rows
        routes.forEach(route => {
            container.appendChild(
                rows.get(route.routeId)
            );
        });

        // Animate movement
        container
            .querySelectorAll(".leaderboard-row")
            .forEach(row => {

                const oldPosition =
                    oldPositions.get(row.dataset.routeId);

                // New route
                if (!oldPosition) {
                    row.animate(
                        [
                            {
                                opacity: 0,
                                transform: "translateY(-10px)"
                            },
                            {
                                opacity: 1,
                                transform: "translateY(0)"
                            }
                        ],
                        {
                            duration: 400,
                            easing: "ease-out"
                        }
                    );

                    return;
                }

                const newPosition =
                    row.getBoundingClientRect();

                const deltaY =
                    oldPosition.top - newPosition.top;

                // Only animate if position changed
                if (Math.abs(deltaY) > 1) {
                    row.animate(
                        [
                            {
                                transform:
                                    `translateY(${deltaY}px)`
                            },
                            {
                                transform:
                                    "translateY(0)"
                            }
                        ],
                        {
                            duration: 500,
                            easing:
                                "cubic-bezier(0.2, 0.8, 0.2, 1)"
                        }
                    );
                }
            });

    } catch (error) {
        console.error(
            "Failed to update leaderboard:",
            error
        );

        if (container.children.length === 0) {
            container.innerHTML = `
        <div class="leaderboard-row">
        <div style="
            grid-column: 1 / -1;
            text-align: center;
        ">
            Unable to load leaderboard
        </div>
        </div>
    `;
        }
    }
}
let updateInterval = null;

//stop updating after 30 minutes
const STOP_TIME = Date.now() + (30 * 60 * 1000);

function startUpdates() {
  if (Date.now() >= STOP_TIME) {
    return;
  }

  if (updateInterval !== null) {
    return;
  }

  updateLeaderboard();

  updateInterval = setInterval(() => {
    if (Date.now() >= STOP_TIME) {
      stopUpdates();
      return;
    }

    updateLeaderboard();
  }, 1500);
}


function stopUpdates() {
    if (updateInterval !== null) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        stopUpdates();
    } else {
        startUpdates();
    }
});

if (!document.hidden) {
    startUpdates();
}