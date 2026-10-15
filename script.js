const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const $ = id => document.getElementById(id);

const WORLD = 3000;
const ROAD = 110;
const BLOCK = 250;

let W = 0;
let H = 0;
let lastTime = 0;
let cash = 1000;
let wanted = 0;
let missionStage = 0;
let gamePaused = false;
let messageTimer;
let keys = {};

const camera = { x: 0, y: 0 };

const player = {
  x: 360,
  y: 360,
  angle: 0,
  inCar: null,
  speed: 2.6
};

const cars = [];
const people = [];
const bikes = [];
const police = [];
const buildings = [];
const trees = [];
const shops = [];

const colors = [
  "#e6a16c", "#a8bdcf", "#d5c3a0",
  "#e2a6a6", "#c2d3a8", "#b7add8"
];

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  W = window.innerWidth;
  H = window.innerHeight;

  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);

  canvas.style.width = W + "px";
  canvas.style.height = H + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resize);
resize();

/* CITY GENERATION */

function roadAt(x) {
  return Math.abs((x % BLOCK) - BLOCK / 2) < ROAD / 2;
}

function createCity() {
  for (let x = 0; x < WORLD; x += BLOCK) {
    for (let y = 0; y < WORLD; y += BLOCK) {
      const cx = x + BLOCK / 2;
      const cy = y + BLOCK / 2;

      // Leave open space around every road intersection.
      if (Math.abs(cx % BLOCK - BLOCK / 2) < ROAD / 2 + 8) continue;
      if (Math.abs(cy % BLOCK - BLOCK / 2) < ROAD / 2 + 8) continue;

      const bw = 105 + Math.random() * 55;
      const bh = 100 + Math.random() * 55;

      buildings.push({
        x: cx - bw / 2,
        y: cy - bh / 2,
        w: bw,
        h: bh,
        color: colors[Math.floor(Math.random() * colors.length)],
        floors: 1 + Math.floor(Math.random() * 8),
        type: "building"
      });

      // Some buildings become businesses.
      if (Math.random() < 0.24) {
        shops.push({
          x: cx,
          y: cy,
          name: randomShop(),
          type: "shop"
        });
      }

      if (Math.random() < 0.45) {
        trees.push({
          x: x + 30 + Math.random() * 170,
          y: y + 30 + Math.random() * 170,
          size: 10 + Math.random() * 8
        });
      }
    }
  }
}

function randomShop() {
  const names = [
    "CAFE", "MARKET", "RESTAURANT", "CLOTHING",
    "ELECTRONICS", "SUPERMARKET", "HOTEL"
  ];

  return names[Math.floor(Math.random() * names.length)];
}

createCity();

/* IMPORTANT CITY LANDMARKS */

const landmarks = [
  { x: 380, y: 380, name: "BANK", color: "#d3b36a" },
  { x: 880, y: 380, name: "HOSPITAL", color: "#f4f4f4" },
  { x: 1380, y: 380, name: "POLICE", color: "#7db8e9" },
  { x: 1880, y: 380, name: "MALL", color: "#e2b1da" },
  { x: 2380, y: 380, name: "GARAGE", color: "#b9c2c9" },
  { x: 380, y: 880, name: "HOTEL", color: "#d9ad78" },
  { x: 880, y: 880, name: "PETROL", color: "#e3d083" },
  { x: 1380, y: 880, name: "RESTAURANT", color: "#f2a071" },
  { x: 1880, y: 880, name: "BUSINESS", color: "#a5b7d8" },
  { x: 2380, y: 880, name: "HOUSE", color: "#c6d7a8" }
];

/* BEACH DISTRICT */

const BEACH_START = 2500;

function drawBeach() {
  // Ocean
  ctx.fillStyle = "#258eb9";
  ctx.fillRect(BEACH_START, 0, WORLD - BEACH_START, WORLD);

  // Shore and sand
  ctx.fillStyle = "#f0d59a";
  ctx.fillRect(BEACH_START, 0, 70, WORLD);

  // Waves
  ctx.strokeStyle = "#a8e5f2";
  ctx.lineWidth = 2;

  for (let y = 0; y < WORLD; y += 55) {
    ctx.beginPath();
    ctx.moveTo(BEACH_START + 90, y);
    ctx.quadraticCurveTo(
      BEACH_START + 120,
      y + 14,
      BEACH_START + 150,
      y
    );
    ctx.stroke();
  }

  // Palm trees
  for (let y = 70; y < WORLD; y += 180) {
    drawPalm(BEACH_START - 15, y, 1);
  }

  // Beach labels
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 30px Arial";
  ctx.fillText("TROPICAL BEACH", BEACH_START + 95, 100);
}

function drawPalm(x, y, scale) {
  ctx.fillStyle = "#94653d";
  ctx.fillRect(x - 4 * scale, y, 8 * scale, 28 * scale);

  ctx.fillStyle = "#26884c";

  for (let i = 0; i < 5; i++) {
    const angle = i * Math.PI * 2 / 5;

    ctx.beginPath();
    ctx.ellipse(
      x + Math.cos(angle) * 13 * scale,
      y + Math.sin(angle) * 9 * scale,
      17 * scale,
      6 * scale,
      angle,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

/* VEHICLES */

function createCar(x, y, type = "car", color = "#d8493f") {
  return {
    x, y,
    angle: 0,
    speed: 0,
    maxSpeed: type === "bike" ? 3.5 : 5,
    fuel: 100,
    color,
    type,
    parked: true,
    name: type === "bike" ? "MOTORCYCLE" : "CITY CAR"
  };
}

cars.push(createCar(360, 300, "car", "#d8493f"));
cars.push(createCar(650, 300, "car", "#e7bd4c"));
cars.push(createCar(950, 300, "car", "#478bd0"));
cars.push(createCar(1250, 300, "car", "#55ad76"));
cars.push(createCar(1550, 300, "bike", "#222222"));
cars.push(createCar(1850, 300, "bike", "#e2e2e2"));

function drawCar(car) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);

  if (car.type === "bike") {
    ctx.fillStyle = "#17191b";

    ctx.beginPath();
    ctx.arc(-10, 0, 5, 0, Math.PI * 2);
    ctx.arc(10, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = car.color;
    ctx.lineWidth = 5;

    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(0, -2);
    ctx.lineTo(10, 0);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#15191d";
    ctx.fillRect(-21, -13, 42, 26);

    ctx.fillStyle = car.color;
    ctx.fillRect(-23, -10, 46, 20);

    ctx.fillStyle = "#a9d6e9";
    ctx.fillRect(-9, -8, 17, 16);

    ctx.fillStyle = "#fff4c6";
    ctx.fillRect(19, -7, 4, 5);
    ctx.fillRect(19, 2, 4, 5);
  }

  ctx.restore();
}

/* PEDESTRIANS */

for (let i = 0; i < 90; i++) {
  people.push({
    x: 200 + Math.random() * 2200,
    y: 200 + Math.random() * 2200,
    angle: Math.random() * Math.PI * 2,
    speed: 0.35 + Math.random() * 0.45,
    color: colors[Math.floor(Math.random() * colors.length)],
    turn: Math.random() * 100
  });
}

function drawPerson(p) {
  ctx.save();
  ctx.translate(p.x, p.y);

  // Head
  ctx.fillStyle = "#d8a27b";
  ctx.beginPath();
  ctx.arc(0, -7, 4, 0, Math.PI * 2);
  ctx.fill();

  // Shirt
  ctx.fillStyle = p.color;
  ctx.fillRect(-4, -3, 8, 9);

  // Legs
  ctx.strokeStyle = "#252a30";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(-2, 6);
  ctx.lineTo(-3, 11);
  ctx.moveTo(2, 6);
  ctx.lineTo(3, 11);
  ctx.stroke();

  ctx.restore();
}

function updatePeople(dt) {
  for (const p of people) {
    p.turn -= dt;

    if (p.turn <= 0) {
      p.angle += (Math.random() - 0.5) * 1.7;
      p.turn = 50 + Math.random() * 120;
    }

    p.x += Math.cos(p.angle) * p.speed * dt;
    p.y += Math.sin(p.angle) * p.speed * dt;

    p.x = Math.max(30, Math.min(WORLD - 30, p.x));
    p.y = Math.max(30, Math.min(WORLD - 30, p.y));
  }
}

/* MOVING TRAFFIC */

const traffic = [];

for (let i = 0; i < 18; i++) {
  traffic.push({
    x: 120 + Math.random() * 2200,
    y: 300,
    angle: 0,
    speed: 1.0 + Math.random() * 1.1,
    color: colors[Math.floor(Math.random() * colors.length)]
  });
}

function updateTraffic(dt) {
  for (const car of traffic) {
    car.x += car.speed * dt;

    if (car.x > WORLD - 100) car.x = 100;

    // A second traffic stream uses the vertical roads.
    if (car.y === 300 && car.x > WORLD / 2) {
      car.y = 550;
      car.x = 300;
      car.angle = Math.PI / 2;
    }

    if (car.angle === Math.PI / 2) {
      car.y += car.speed * dt;

      if (car.y > WORLD - 100) {
        car.y = 100;
        car.x = 600;
        car.angle = 0;
      }
    }
  }
}

function drawTraffic(car) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);

  ctx.fillStyle = "#222a31";
  ctx.fillRect(-17, -9, 34, 18);

  ctx.fillStyle = car.color;
  ctx.fillRect(-15, -7, 30, 14);

  ctx.fillStyle = "#b7e1ee";
  ctx.fillRect(-4, -6, 9, 12);

  ctx.restore();
}

/* POLICE */

function spawnPolice() {
  if (police.length >= 5) return;

  police.push({
    x: player.x + 220,
    y: player.y + 170,
    speed: 1.2
  });
}

function drawPolice(p) {
  ctx.fillStyle = "#152e61";
  ctx.fillRect(p.x - 13, p.y - 8, 26, 16);

  ctx.fillStyle = "#e8e9ee";
  ctx.fillRect(p.x - 8, p.y - 6, 16, 12);

  ctx.fillStyle = "#f33";
  ctx.fillRect(p.x - 3, p.y - 10, 6, 3);
}

function updatePolice(dt) {
  for (const p of police) {
    const dx = player.x - p.x;
    const dy = player.y - p.y;
    const d = Math.hypot(dx, dy) || 1;

    p.x += dx / d * p.speed * dt;
    p.y += dy / d * p.speed * dt;
  }
}

/* LANDMARK DRAWING */

function drawLandmark(l) {
  ctx.fillStyle = "#0002";
  ctx.fillRect(l.x - 58, l.y - 48, 116, 96);

  ctx.fillStyle = l.color;
  ctx.fillRect(l.x - 53, l.y - 43, 106, 86);

  ctx.fillStyle = "#ffffff";

  ctx.font = "bold 12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(l.name, l.x, l.y + 4);

  ctx.fillStyle = "#cce8f5";

  for (let wx = -35; wx <= 35; wx += 23) {
    ctx.fillRect(l.x + wx, l.y - 26, 9, 10);
    ctx.fillRect(l.x + wx, l.y + 13, 9, 10);
  }

  ctx.textAlign = "left";
}

/* CITY RENDERING */

function drawRoads() {
  // Grass
  ctx.fillStyle = "#83b96e";
  ctx.fillRect(0, 0, WORLD, WORLD);

  // Parks
  for (let x = 20; x < WORLD; x += 500) {
    ctx.fillStyle = "#72ad61";
    ctx.fillRect(x, 30, 75, 65);
  }

  // Horizontal roads
  ctx.fillStyle = "#4d545b";

  for (let y = 0; y < WORLD; y += BLOCK) {
    ctx.fillRect(0, y + 195, WORLD, ROAD);
  }

  // Vertical roads
  for (let x = 0; x < WORLD; x += BLOCK) {
    ctx.fillRect(x + 195, 0, ROAD, WORLD);
  }

  // Road markings
  ctx.strokeStyle = "#e8e0a5";
  ctx.lineWidth = 2;
  ctx.setLineDash([20, 18]);

  for (let y = 0; y < WORLD; y += BLOCK) {
    ctx.beginPath();
    ctx.moveTo(0, y + 250);
    ctx.lineTo(WORLD, y + 250);
    ctx.stroke();
  }

  for (let x = 0; x < WORLD; x += BLOCK) {
    ctx.beginPath();
    ctx.moveTo(x + 250, 0);
    ctx.lineTo(x + 250, WORLD);
    ctx.stroke();
  }

  ctx.setLineDash([]);
}

function drawBuildings() {
  for (const b of buildings) {
    ctx.fillStyle = "#0002";
    ctx.fillRect(b.x + 6, b.y + 6, b.w, b.h);

    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);

    ctx.fillStyle = "#777b82";
    ctx.fillRect(b.x, b.y, b.w, 8);

    // Windows
    ctx.fillStyle = "#a7d7e5";

    for (let wx = b.x + 12; wx < b.x + b.w - 10; wx += 22) {
      for (let wy = b.y + 20; wy < b.y + b.h - 10; wy += 23) {
        ctx.fillRect(wx, wy, 10, 12);
      }
    }

    // Door
    ctx.fillStyle = "#5c4739";
    ctx.fillRect(b.x + b.w / 2 - 8, b.y + b.h - 19, 16, 19);
  }
}

function drawTrees() {
  for (const t of trees) {
    ctx.fillStyle = "#725039";
    ctx.fillRect(t.x - 3, t.y, 6, 12);

    ctx.fillStyle = "#237748";
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#388d4f";
    ctx.beginPath();
    ctx.arc(t.x - 4, t.y - 4, t.size * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawShops() {
  for (const s of shops) {
    ctx.fillStyle = "#18252c";
    ctx.fillRect(s.x - 35, s.y - 25, 70, 18);

    ctx.fillStyle = "#ffffff";
    ctx.font = "9px Arial";
    ctx.textAlign = "center";
    ctx.fillText(s.name, s.x, s.y - 13);
  }

  ctx.textAlign = "left";
}

/* PLAYER */

function drawPlayer() {
  if (player.inCar) return;

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);

  ctx.fillStyle = "#171d25";
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f0c18b";
  ctx.beginPath();
  ctx.arc(0, -2, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f2a52f";
  ctx.fillRect(-4, -6, 8, 8);

  ctx.restore();
}

/* INPUT */

function bindMove(id, key) {
  const el = $(id);

  el.addEventListener("pointerdown", e => {
    e.preventDefault();
    keys[key] = true;
    el.setPointerCapture?.(e.pointerId);
  });

  const release = e => {
    keys[key] = false;
  };

  el.addEventListener("pointerup", release);
  el.addEventListener("pointercancel", release);
  el.addEventListener("lostpointercapture", release);
}

bindMove("up", "up");
bindMove("down", "down");
bindMove("left", "left");
bindMove("right", "right");

window.addEventListener("keydown", e => {
  if (e.key === "ArrowUp" || e.key === "w") keys.up = true;
  if (e.key === "ArrowDown" || e.key === "s") keys.down = true;
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
  if (e.key === "e") enterCar();
  if (e.key === " " && !gamePaused) interact();
});

window.addEventListener("keyup", e => {
  if (e.key === "ArrowUp" || e.key === "w") keys.up = false;
  if (e.key === "ArrowDown" || e.key === "s") keys.down = false;
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
});

/* GAME MOVEMENT */

function updatePlayer(dt) {
  if (player.inCar) {
    const car = player.inCar;

    if (keys.up) car.speed += 0.055 * dt;
    if (keys.down) car.speed -= 0.07 * dt;

    car.speed = Math.max(-2, Math.min(car.maxSpeed, car.speed));

    if (keys.left) car.angle -= 0.045 * dt * (car.speed >= 0 ? 1 : -1);
    if (keys.right) car.angle += 0.045 * dt * (car.speed >= 0 ? 1 : -1);

    car.x += Math.cos(car.angle) * car.speed * dt;
    car.y += Math.sin(car.angle) * car.speed * dt;

    car.x = Math.max(20, Math.min(WORLD - 20, car.x));
    car.y = Math.max(20, Math.min(WORLD - 20, car.y));

    car.fuel = Math.max(0, car.fuel - Math.abs(car.speed) * 0.001 * dt);

    player.x = car.x;
    player.y = car.y;
    player.angle = car.angle;

    if (car.fuel <= 0) car.speed = 0;
  } else {
    let dx = 0;
    let dy = 0;

    if (keys.up) dy -= 1;
    if (keys.down) dy += 1;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;

    if (dx || dy) {
      const length = Math.hypot(dx, dy);

      dx /= length;
      dy /= length;

      player.x += dx * player.speed * dt;
      player.y += dy * player.speed * dt;

      player.angle = Math.atan2(dy, dx);
    }

    player.x = Math.max(20, Math.min(WORLD - 20, player.x));
    player.y = Math.max(20, Math.min(WORLD - 20, player.y));
  }
}

/* INTERACTIONS */

function showPanel(title, text, buttons = []) {
  gamePaused = true;

  $("panelTitle").textContent = title;
  $("panelText").textContent = text;
  $("panelButtons").innerHTML = "";

  buttons.forEach(item => {
    const button = document.createElement("button");
    button.textContent = item.label;

    button.addEventListener("click", () => {
      if (item.action) item.action();
    });

    $("panelButtons").appendChild(button);
  });

  $("panel").classList.add("visible");
}

function closePanel() {
  $("panel").classList.remove("visible");
  gamePaused = false;
}

$("closePanel").addEventListener("click", closePanel);

function notify(text) {
  const el = $("notification");
  el.textContent = text;
  el.style.opacity = "1";

  clearTimeout(messageTimer);

  messageTimer = setTimeout(() => {
    el.style.opacity = "0";
  }, 2400);
}

function nearestCar() {
  let best = null;
  let distance = 65;

  for (const car of cars) {
    const d = Math.hypot(car.x - player.x, car.y - player.y);

    if (d < distance) {
      best = car;
      distance = d;
    }
  }

  return best;
}

function enterCar() {
  if (player.inCar) {
    const car = player.inCar;

    player.x = car.x + Math.cos(car.angle + Math.PI / 2) * 36;
    player.y = car.y + Math.sin(car.angle + Math.PI / 2) * 36;

    car.speed = 0;
    player.inCar = null;

    notify("You left the vehicle.");
    return;
  }

  const car = nearestCar();

  if (!car) {
    notify("Move closer to a parked vehicle.");
    return;
  }

  if (car.fuel <= 0) {
    notify("This vehicle needs fuel.");
    return;
  }

  player.inCar = car;
  car.parked = false;

  notify("Vehicle entered. Drive safely!");
}

$("enterBtn").addEventListener("click", enterCar);

function nearestLandmark() {
  let best = null;
  let distance = 95;

  for (const l of landmarks) {
    const d = Math.hypot(l.x - player.x, l.y - player.y);

    if (d < distance) {
      best = l;
      distance = d;
    }
  }

  for (const s of shops) {
    const d = Math.hypot(s.x - player.x, s.y - player.y);

    if (d < distance) {
      best = s;
      distance = d;
    }
  }

  return best;
}

function interact() {
  const location = nearestLandmark();

  if (!location) {
    notify("Move closer to a building or business.");
    return;
  }

  const name = location.name || "SHOP";

  if (name === "BANK") {
    showPanel("CITY BANK",
      "Welcome to the city bank. Manage your fictional game finances.",
      [
        {
          label: "Deposit $100",
          action: () => {
            closePanel();
            notify("Bank services are being expanded.");
          }
        }
      ]
    );
  } else if (name === "HOSPITAL") {
    showPanel("CITY HOSPITAL",
      "The hospital provides medical services in the game world.",
      [
        {
          label: "Pay $100 for treatment",
          action: () => {
            if (cash >= 100) {
              cash -= 100;
              updateHUD();
              closePanel();
              notify("You received hospital treatment.");
            } else {
              notify("Not enough cash.");
            }
          }
        }
      ]
    );
  } else if (name === "POLICE") {
    showPanel("POLICE STATION",
      "The city police station. Wanted levels are part of the game's story.",
      [
        {
          label: "Clear wanted level — $300",
          action: () => {
            if (cash >= 300) {
              cash -= 300;
              wanted = 0;
              police.length = 0;
              updateHUD();
              closePanel();
              notify("Wanted level cleared in this game.");
            } else {
              notify("Not enough cash.");
            }
          }
        }
      ]
    );
  } else if (name === "GARAGE") {
    openGarage();
  } else if (name === "PETROL") {
    openGarage(true);
  } else if (name === "MALL" || name === "RESTAURANT" ||
             name === "HOTEL" || name === "BUSINESS" ||
             name === "HOUSE") {
    showPanel(name, "Welcome! This location is part of the open-world city.",
      [
        {
          label: "Spend $50",
          action: () => {
            if (cash >= 50) {
              cash -= 50;
              updateHUD();
              closePanel();
              notify("Purchase completed.");
            } else {
              notify("Not enough cash.");
            }
          }
        }
      ]
    );
  } else {
    showPanel(name, "Explore the city and discover its businesses.", []);
  }
}

$("interact").addEventListener("click", interact);

/* GARAGE AND FUEL */

function openGarage(fuelOnly = false) {
  showPanel(
    fuelOnly ? "PETROL STATION" : "CITY GARAGE",
    fuelOnly
      ? "Refuel your current vehicle."
      : "Manage your vehicles and refuel.",
    [
      {
        label: "Refuel vehicle — $100",
        action: () => {
          if (cash < 100) {
            notify("Not enough cash.");
            return;
          }

          const car = player.inCar || nearestCar();

          if (!car) {
            notify("Bring a vehicle to the station.");
            return;
          }

          cash -= 100;
          car.fuel = 100;
          updateHUD();
          closePanel();
          notify("Vehicle refuelled.");
        }
      },
      {
        label: "Buy a car — $500",
        action: () => {
          if (cash < 500) {
            notify("Not enough cash.");
            return;
          }

          cash -= 500;

          const car = createCar(
            player.x + 55,
            player.y + 20,
            "car",
            "#f2bd49"
          );

          cars.push(car);
          updateHUD();
          closePanel();
          notify("New car purchased!");
        }
      },
      {
        label: "Buy a motorcycle — $250",
        action: () => {
          if (cash < 250) {
            notify("Not enough cash.");
            return;
          }

          cash -= 250;

          cars.push(
            createCar(
              player.x + 45,
              player.y + 30,
              "bike",
              "#242424"
            )
          );

          updateHUD();
          closePanel();
          notify("Motorcycle purchased!");
        }
      }
    ]
  );
}

$("garageBtn").addEventListener("click", () => openGarage());

/* CITY MAP */

$("mapBtn").addEventListener("click", () => {
  showPanel(
    "CITY MAP",
    "Explore Downtown, the Business District, Residential Areas, and the Tropical Beach.",
    [
      {
        label: "Travel to Downtown",
        action: () => {
          player.x = 360;
          player.y = 360;
          player.inCar = null;
          closePanel();
          notify("Downtown.");
        }
      },
      {
        label: "Travel to the Beach",
        action: () => {
          player.x = 2550;
          player.y = 600;
          player.inCar = null;
          closePanel();
          notify("Welcome to the beach district!");
        }
      },
      {
        label: "Travel to Business District",
        action: () => {
          player.x = 1880;
          player.y = 880;
          player.inCar = null;
          closePanel();
          notify("Business District.");
        }
      }
    ]
  );
});

/* MISSION SYSTEM */

$("mission").textContent = "MISSION: Explore the city";

function startMission() {
  if (missionStage === 0) {
    missionStage = 1;
    $("mission").textContent = "MISSION: Visit the city bank";
    notify("New mission: Visit the city bank.");
  } else if (missionStage === 1) {
    missionStage = 2;
    cash += 250;
    updateHUD();
    $("mission").textContent = "MISSION: Explore the beach";
    notify("Mission completed! You earned $250.");
  } else if (missionStage === 2) {
    missionStage = 3;
    cash += 300;
    updateHUD();
    $("mission").textContent = "MISSION: Build your business";
    notify("Beach exploration complete. +$300.");
  } else {
    cash += 100;
    updateHUD();
    notify("Business mission completed. +$100.");
  }
}

/* HUD */

function getDistrict() {
  if (player.x >= BEACH_START) return "BEACH DISTRICT";
  if (player.x > 1700) return "BUSINESS DISTRICT";
  if (player.y > 1500) return "RESIDENTIAL";
  return "DOWNTOWN";
}

function updateHUD() {
  $("cash").textContent = "$" + cash.toLocaleString();
  $("district").textContent = getDistrict();

  const car = player.inCar;

  $("carName").textContent = car ? car.name : "ON FOOT";

  $("speed").textContent = car
    ? Math.round(Math.abs(car.speed) * 20)
    : "0";

  $("fuelBar").style.width = (car ? car.fuel : 100) + "%";
  $("fuelText").textContent = Math.round(car ? car.fuel : 100) + "%";

  $("wanted").textContent =
    "POLICE: " +
    "★".repeat(wanted) +
    "☆".repeat(5 - wanted);
}

/* MAIN GAME LOOP */

function drawWorld() {
  ctx.save();

  ctx.translate(-camera.x, -camera.y);

  drawRoads();
  drawBeach();
  drawBuildings();
  drawTrees();
  drawShops();

  for (const l of landmarks) {
    drawLandmark(l);
  }

  for (const car of traffic) {
    drawTraffic(car);
  }

  for (const car of cars) {
    drawCar(car);
  }

  for (const p of people) {
    drawPerson(p);
  }

  for (const p of police) {
    drawPolice(p);
  }

  drawPlayer();

  ctx.restore();
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 16.67 || 1, 2);
  lastTime = timestamp;

  if (!gamePaused) {
    updatePlayer(dt);
    updatePeople(dt);
    updateTraffic(dt);
    updatePolice(dt);

    camera.x = Math.max(
      0,
      Math.min(WORLD - W, player.x - W / 2)
    );

    camera.y = Math.max(
      0,
      Math.min(WORLD - H, player.y - H / 2)
    );

    updateHUD();

    if (wanted > 0 && police.length === 0) {
      spawnPolice();
    }

    // Fictional police encounters.
    for (const p of police) {
      if (Math.hypot(p.x - player.x, p.y - player.y) < 25) {
        wanted = Math.max(0, wanted - 1);
        police.length = 0;
        notify("Police encounter! You can continue exploring.");
        break;
      }
    }
  }

  drawWorld();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

/* SIMPLE GAME START */

setTimeout(() => {
  notify("Welcome to Empire of Crime! Explore the city.");
}, 700);
