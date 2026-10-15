// =======================================
// EMPIRE OF CRIME
// GTA-STYLE OPEN WORLD GAME
// =======================================

(() => {
    "use strict";

    // GAME SETTINGS
    const WORLD = {
        width: 2600,
        height: 2600,
        roadWidth: 150,
        blockSize: 400
    };

    const game = {
        money: 2500,
        wanted: 0,
        fuel: 100,
        speed: 0,
        inCar: false,
        garageOpen: false,
        message: "Welcome to Empire of Crime!",
        messageTime: 4
    };

    // CREATE GAME CONTAINER
    let container = document.getElementById("game-container");

    if (!container) {
        container = document.createElement("div");
        container.id = "game-container";
        document.body.appendChild(container);
    }

    // CREATE CANVAS
    let canvas = document.getElementById("gameCanvas");

    if (!canvas) {
        canvas = document.querySelector("canvas");
    }

    if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.id = "gameCanvas";
        container.appendChild(canvas);
    }

    const ctx = canvas.getContext("2d");

    // CREATE HUD
    function createElement(id, tag = "div") {
        let element = document.getElementById(id);

        if (!element) {
            element = document.createElement(tag);
            element.id = id;
            container.appendChild(element);
        }

        return element;
    }

    const hud = createElement("hud");
    const speedDisplay = createElement("speed");
    const fuelFill = createElement("fuel-fill");
    const messageDisplay = createElement("message");
    const controls = createElement("controls");
    const garagePanel = createElement("garage-panel");

    hud.innerHTML = `
        <div class="hud-panel">
            <div class="game-title">EMPIRE OF CRIME</div>
            <div class="hud-text">Cash: $<span id="money">2500</span></div>
            <div class="hud-text">Wanted: <span id="wanted" class="wanted">☆☆☆☆☆</span></div>
        </div>
    `;

    // SPEEDOMETER
    const speedometer = createElement("speedometer");

    speedometer.innerHTML = `
        <div id="speed">0</div>
        <div class="speed-label">KM/H</div>
    `;

    // FUEL DISPLAY
    const fuelBox = createElement("fuel-box");

    fuelBox.innerHTML = `
        <div class="fuel-label">
            FUEL <span id="fuel-percent">100%</span>
        </div>
        <div class="fuel-track">
            <div id="fuel-fill"></div>
        </div>
    `;

    const moneyDisplay = document.getElementById("money");
    const wantedDisplay = document.getElementById("wanted");
    const fuelPercent = document.getElementById("fuel-percent");

    // PLAYER
    const player = {
        x: 350,
        y: 350,
        angle: 0,
        radius: 12,
        walkingSpeed: 190
    };

    // VEHICLE TYPES
    const carTypes = [
        {
            name: "Street Car",
            color: "#e63946",
            speed: 340,
            price: 0,
            fuel: 100
        },
        {
            name: "Sports Car",
            color: "#ffca3a",
            speed: 470,
            price: 800,
            fuel: 100
        },
        {
            name: "Super Car",
            color: "#8338ec",
            speed: 570,
            price: 1800,
            fuel: 100
        },
        {
            name: "Off-Roader",
            color: "#38b000",
            speed: 300,
            price: 1200,
            fuel: 100
        }
    ];

    // CREATE VEHICLES
    const cars = [];

    function createCar(type, x, y, angle = 0) {
        const car = {
            type: type,
            x: x,
            y: y,
            angle: angle,
            speed: 0,
            fuel: 100,
            width: 30,
            height: 52,
            occupied: false
        };

        cars.push(car);
        return car;
    }

    createCar(0, 450, 350, Math.PI / 2);
    createCar(1, 750, 350, Math.PI / 2);
    createCar(2, 1050, 350, Math.PI / 2);
    createCar(3, 1450, 350, Math.PI / 2);
    createCar(0, 450, 750, 0);
    createCar(1, 850, 750, 0);
    createCar(2, 1250, 750, 0);
    createCar(3, 1650, 750, 0);

    let currentCar = null;

    // INPUT
    const keys = {};

    window.addEventListener("keydown", event => {
        keys[event.key.toLowerCase()] = true;

        if (
            ["arrowup", "arrowdown", "arrowleft", "arrowright", " "]
                .includes(event.key.toLowerCase())
        ) {
            event.preventDefault();
        }

        if (event.repeat) return;

        if (event.key.toLowerCase() === "e") {
            toggleVehicle();
        }

        if (event.key.toLowerCase() === "g") {
            toggleGarage();
        }
    });

    window.addEventListener("keyup", event => {
        keys[event.key.toLowerCase()] = false;
    });

    // MOBILE CONTROL BUTTONS
    controls.innerHTML = `
        <div class="control-group">
            <button class="game-btn" data-key="a">◀</button>
            <button class="game-btn" data-key="d">▶</button>
        </div>

        <div class="control-group">
            <button class="game-btn action" id="enter-btn">ENTER</button>
            <button class="game-btn gas" data-key="w">▲</button>
            <button class="game-btn brake" data-key="s">▼</button>
            <button class="game-btn action" id="garage-btn">GARAGE</button>
        </div>
    `;

    controls.querySelectorAll("[data-key]").forEach(button => {
        const key = button.dataset.key;

        button.addEventListener("pointerdown", event => {
            event.preventDefault();
            keys[key] = true;

            try {
                button.setPointerCapture(event.pointerId);
            } catch (_) {}
        });

        const release = () => {
            keys[key] = false;
        };

        button.addEventListener("pointerup", release);
        button.addEventListener("pointercancel", release);
        button.addEventListener("lostpointercapture", release);
    });

    document.getElementById("enter-btn").addEventListener(
        "click",
        toggleVehicle
    );

    document.getElementById("garage-btn").addEventListener(
        "click",
        toggleGarage
    );

    // CITY BUILDINGS
    const buildings = [];

    function generateCity() {
        buildings.length = 0;

        for (let x = 0; x < WORLD.width; x += WORLD.blockSize) {
            for (let y = 0; y < WORLD.height; y += WORLD.blockSize) {
                buildings.push({
                    x: x + WORLD.roadWidth,
                    y: y + WORLD.roadWidth,
                    width: WORLD.blockSize - WORLD.roadWidth - 20,
                    height: WORLD.blockSize - WORLD.roadWidth - 20,
                    color: [
                        "#535b61",
                        "#66605a",
                        "#4b5962",
                        "#686868",
                        "#4c554f"
                    ][Math.floor(Math.random() * 5)]
                });
            }
        }
    }

    generateCity();

    // DRAW CITY
    function drawCity(cameraX, cameraY) {
        ctx.fillStyle = "#426b45";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();

        ctx.translate(-cameraX, -cameraY);

        // ROADS
        ctx.fillStyle = "#303438";

        for (let x = 0; x < WORLD.width; x += WORLD.blockSize) {
            ctx.fillRect(
                x,
                0,
                WORLD.roadWidth,
                WORLD.height
            );
        }

        for (let y = 0; y < WORLD.height; y += WORLD.blockSize) {
            ctx.fillRect(
                0,
                y,
                WORLD.width,
                WORLD.roadWidth
            );
        }

        // ROAD MARKINGS
        ctx.strokeStyle = "#b8b4a0";
        ctx.lineWidth = 3;
        ctx.setLineDash([22, 24]);

        for (let x = 0; x < WORLD.width; x += WORLD.blockSize) {
            ctx.beginPath();
            ctx.moveTo(x + WORLD.roadWidth / 2, 0);
            ctx.lineTo(
                x + WORLD.roadWidth / 2,
                WORLD.height
            );
            ctx.stroke();
        }

        for (let y = 0; y < WORLD.height; y += WORLD.blockSize) {
            ctx.beginPath();
            ctx.moveTo(0, y + WORLD.roadWidth / 2);
            ctx.lineTo(
                WORLD.width,
                y + WORLD.roadWidth / 2
            );
            ctx.stroke();
        }

        ctx.setLineDash([]);

        // BUILDINGS
        buildings.forEach(building => {
            ctx.fillStyle = "#202723";
            ctx.fillRect(
                building.x + 7,
                building.y + 7,
                building.width,
                building.height
            );

            ctx.fillStyle = building.color;
            ctx.fillRect(
                building.x,
                building.y,
                building.width,
                building.height
            );

            // Rooftop details
            ctx.fillStyle = "#777b77";

            ctx.fillRect(
                building.x + 20,
                building.y + 20,
                30,
                25
            );

            ctx.fillStyle = "#b2a77b";

            for (
                let wx = building.x + 20;
                wx < building.x + building.width - 15;
                wx += 45
            ) {
                ctx.fillRect(wx, building.y + 65, 16, 5);
            }
        });

        // GARAGE LOCATION
        ctx.fillStyle = "#111";
        ctx.fillRect(175, 175, 120, 100);

        ctx.fillStyle = "#f5bd38";
        ctx.font = "bold 18px Arial";
        ctx.fillText("GARAGE", 193, 220);

        ctx.restore();
    }

    // DRAW VEHICLES
    function drawCar(car, cameraX, cameraY) {
        const screenX = car.x - cameraX;
        const screenY = car.y - cameraY;

        ctx.save();

        ctx.translate(screenX, screenY);
        ctx.rotate(car.angle);

        // Car shadow
        ctx.fillStyle = "#0008";
        ctx.fillRect(-car.width / 2 + 3, -car.height / 2 + 4,
            car.width, car.height);

        // Body
        ctx.fillStyle = carTypes[car.type].color;
        ctx.fillRect(
            -car.width / 2,
            -car.height / 2,
            car.width,
            car.height
        );

        // Windows
        ctx.fillStyle = "#a9d9e9";

        ctx.fillRect(-car.width / 2 + 4, -car.height / 2 + 8,
            car.width - 8, 12);

        ctx.fillRect(-car.width / 2 + 4, 5,
            car.width - 8, 10);

        // Headlights
        ctx.fillStyle = "#fff5a8";

        ctx.fillRect(-car.width / 2 + 2, -car.height / 2, 7, 4);
        ctx.fillRect(car.width / 2 - 9, -car.height / 2, 7, 4);

        // Tail lights
        ctx.fillStyle = "#ff3434";

        ctx.fillRect(-car.width / 2 + 2, car.height / 2 - 4, 7, 4);
        ctx.fillRect(car.width / 2 - 9, car.height / 2 - 4, 7, 4);

        ctx.restore();
    }

    // DRAW PLAYER
    function drawPlayer(cameraX, cameraY) {
        if (game.inCar) return;

        const x = player.x - cameraX;
        const y = player.y - cameraY;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(player.angle);

        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#f5bd38";
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#222";
        ctx.fillRect(-4, -4, 8, 10);

        ctx.restore();
    }

    // VEHICLE ENTRY AND EXIT
    function toggleVehicle() {
        if (game.inCar) {
            player.x = currentCar.x + 45;
            player.y = currentCar.y;

            currentCar.occupied = false;
            currentCar.speed = 0;

            currentCar = null;
            game.inCar = false;
            game.speed = 0;

            showMessage("You exited the vehicle.");
            return;
        }

        let nearestCar = null;
        let nearestDistance = 65;

        cars.forEach(car => {
            if (car.occupied) return;

            const distance = Math.hypot(
                car.x - player.x,
                car.y - player.y
            );

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestCar = car;
            }
        });

        if (!nearestCar) {
            showMessage("Move closer to a car!");
            return;
        }

        currentCar = nearestCar;
        currentCar.occupied = true;

        player.x = currentCar.x;
        player.y = currentCar.y;

        game.inCar = true;
        game.fuel = currentCar.fuel;

        showMessage(
            "Driving: " + carTypes[currentCar.type].name
        );
    }

    // GARAGE
    function toggleGarage() {
        if (game.garageOpen) {
            closeGarage();
            return;
        }

        const x = game.inCar ? currentCar.x : player.x;
        const y = game.inCar ? currentCar.y : player.y;

        const distance = Math.hypot(x - 235, y - 225);

        if (distance > 130) {
            showMessage("Go to the garage first!");
            return;
        }

        openGarage();
    }

    function openGarage() {
        game.garageOpen = true;
        garagePanel.style.display = "block";

        garagePanel.innerHTML = `
            <h2>🏎️ CITY GARAGE</h2>
            <p style="margin-bottom:10px">
                Cash: $${game.money}
            </p>
            <div id="garage-options"></div>
            <button class="garage-option" id="close-garage">
                CLOSE GARAGE
            </button>
        `;

        const options = garagePanel.querySelector("#garage-options");

        carTypes.forEach((type, index) => {
            const button = document.createElement("button");
            button.className = "garage-option";

            button.textContent =
                `${type.name} — ${
                    type.price === 0 ? "FREE" : "$" + type.price
                }`;

            button.addEventListener("click", () => {
                buyCar(index);
            });

            options.appendChild(button);
        });

        document.getElementById("close-garage")
            .addEventListener("click", closeGarage);
    }

    function closeGarage() {
        game.garageOpen = false;
        garagePanel.style.display = "none";
    }

    function buyCar(index) {
        const type = carTypes[index];

        if (game.money < type.price) {
            showMessage("Not enough cash!");
            return;
        }

        game.money -= type.price;

        if (game.inCar && currentCar) {
            currentCar.occupied = false;
            currentCar = null;
            game.inCar = false;
        }

        // Spawn purchased vehicle near the garage.
        const newCar = createCar(
            index,
            320,
            225,
            Math.PI / 2
        );

        newCar.fuel = 100;

        closeGarage();
        showMessage("Purchased " + type.name + "!");
    }

    // REFUEL
    function refuel() {
        if (!game.inCar || !currentCar) {
            showMessage("Enter a car to refuel.");
            return;
        }

        const cost = Math.ceil((100 - currentCar.fuel) * 2);

        if (cost === 0) {
            showMessage("Your fuel tank is full!");
            return;
        }

        if (game.money < cost) {
            showMessage("Not enough cash to refuel!");
            return;
        }

        game.money -= cost;
        currentCar.fuel = 100;
        game.fuel = 100;

        showMessage("Vehicle refueled!");
    }

    // ADD REFUEL BUTTON
    const refuelButton = document.createElement("button");

    refuelButton.className = "game-btn action";
    refuelButton.textContent = "FUEL";
    refuelButton.style.position = "absolute";
    refuelButton.style.right = "15px";
    refuelButton.style.bottom = "315px";
    refuelButton.style.width = "65px";
    refuelButton.style.height = "42px";
    refuelButton.style.fontSize = "11px";

    container.appendChild(refuelButton);
    refuelButton.addEventListener("click", refuel);

    // COLLISION WITH BUILDINGS
    function hitsBuilding(x, y, radius = 12) {
        return buildings.some(building => {
            return (
                x + radius > building.x &&
                x - radius < building.x + building.width &&
                y + radius > building.y &&
                y - radius < building.y + building.height
            );
        });
    }

    function keepInWorld(object) {
        object.x = Math.max(15, Math.min(WORLD.width - 15, object.x));
        object.y = Math.max(15, Math.min(WORLD.height - 15, object.y));
    }

    // GAME MESSAGES
    function showMessage(text) {
        game.message = text;
        game.messageTime = 2.5;
        messageDisplay.textContent = text;
        messageDisplay.style.display = "block";
    }

    // UPDATE GAME
    function update(dt) {
        const forward =
            keys["w"] || keys["arrowup"];

        const backward =
            keys["s"] || keys["arrowdown"];

        const left =
            keys["a"] || keys["arrowleft"];

        const right =
            keys["d"] || keys["arrowright"];

        if (game.inCar && currentCar) {
            const type = carTypes[currentCar.type];

            if (currentCar.fuel > 0) {
                if (forward) {
                    currentCar.speed += 240 * dt;
                }

                if (backward) {
                    currentCar.speed -= 300 * dt;
                }

                currentCar.fuel -=
                    Math.abs(currentCar.speed) * 0.0015 * dt;

                currentCar.fuel = Math.max(0, currentCar.fuel);
            } else {
                currentCar.speed *= Math.pow(0.94, dt * 60);
            }

            currentCar.speed = Math.max(
                -type.speed * 0.35,
                Math.min(type.speed, currentCar.speed)
            );

            const steering = Math.min(
                1,
                Math.abs(currentCar.speed) / 80
            );

            if (left) {
                currentCar.angle -= 2.3 * steering * dt;
            }

            if (right) {
                currentCar.angle += 2.3 * steering * dt;
            }

            const oldX = currentCar.x;
            const oldY = currentCar.y;

            currentCar.x +=
                Math.sin(currentCar.angle) *
                currentCar.speed * dt;

            currentCar.y -=
                Math.cos(currentCar.angle) *
                currentCar.speed * dt;

            keepInWorld(currentCar);

            if (hitsBuilding(currentCar.x, currentCar.y, 18)) {
                currentCar.x = oldX;
                currentCar.y = oldY;
                currentCar.speed *= -0.2;
            }

            player.x = currentCar.x;
            player.y = currentCar.y;

            game.fuel = currentCar.fuel;
            game.speed = Math.abs(currentCar.speed) * 0.18;

        } else {
            let dx = 0;
            let dy = 0;

            if (forward) dy -= 1;
            if (backward) dy += 1;
            if (left) dx -= 1;
            if (right) dx += 1;

            if (dx !== 0 || dy !== 0) {
                const length = Math.hypot(dx, dy);

                dx /= length;
                dy /= length;

                const oldX = player.x;
                const oldY = player.y;

                player.x += dx * player.walkingSpeed * dt;
                player.y += dy * player.walkingSpeed * dt;

                if (hitsBuilding(player.x, player.y, player.radius)) {
                    player.x = oldX;
                    player.y = oldY;
                }

                player.angle = Math.atan2(dx, -dy);
                keepInWorld(player);
            }

            game.speed = 0;
        }

        if (game.messageTime > 0) {
            game.messageTime -= dt;

            if (game.messageTime <= 0) {
                messageDisplay.style.display = "none";
            }
        }
    }

    // DRAW GAME
    function draw() {
        const focus = game.inCar ? currentCar : player;

        const cameraX = Math.max(
            0,
            Math.min(
                WORLD.width - canvas.width,
                focus.x - canvas.width / 2
            )
        );

        const cameraY = Math.max(
            0,
            Math.min(
                WORLD.height - canvas.height,
                focus.y - canvas.height / 2
            )
        );

        drawCity(cameraX, cameraY);

        cars.forEach(car => {
            drawCar(car, cameraX, cameraY);
        });

        drawPlayer(cameraX, cameraY);

        // HUD
        speedDisplay.textContent = Math.round(game.speed);

        fuelFill.style.width = game.fuel + "%";

        fuelPercent.textContent =
            Math.round(game.fuel) + "%";

        fuelFill.style.background =
            game.fuel < 20 ? "#ff3333" : "#48e77c";

        moneyDisplay.textContent = game.money;

        wantedDisplay.textContent =
            "★".repeat(game.wanted) +
            "☆".repeat(5 - game.wanted);
    }

    // RESPONSIVE CANVAS
    function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.round(container.clientWidth * dpr);
        canvas.height = Math.round(container.clientHeight * dpr);

        // Draw in CSS pixel coordinates.
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // MAIN LOOP
let previousTime = performance.now();

function loop(now) {
    const dt = Math.min((now - previousTime) / 1000, 0.05);
    previousTime = now;

    update(dt);
    draw();

    requestAnimationFrame(loop);
}

// RESPONSIVE CANVAS
function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(container.clientWidth * dpr);
    canvas.height = Math.round(container.clientHeight * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

window.EmpireOfCrime = {
    game,
    player,
    cars,
    carTypes,
    toggleVehicle,
    toggleGarage,
    refuel
};

showMessage("Welcome to Empire of Crime!");

requestAnimationFrame(loop);

        // Camera calculations use CSS pixel dimensions.
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Ensure world drawing uses CSS pixels.
        const originalWidth = canvas.width;
        const originalHeight = canvas.height;

        canvas.width = originalWidth;
        canvas.height = originalHeight;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        draw();

        requestAnimationFrame(loop);
    }

    // START GAME
    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);

    // Make game functions accessible for future updates.
    window.EmpireOfCrime = {
        game,
        player,
        cars,
        carTypes,
        toggleVehicle,
        toggleGarage,
        refuel
    };

    showMessage("Welcome! Find a car and press ENTER.");

    requestAnimationFrame(loop);

})();
