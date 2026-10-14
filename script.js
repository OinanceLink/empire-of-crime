const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const mission = document.getElementById("mission");
const status = document.getElementById("status");
const message = document.getElementById("message");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");

let W = window.innerWidth;
let H = window.innerHeight;

const worldW = 1800;
const worldH = 1800;

const player = {
  x: 180,
  y: 180,
  size: 22,
  speed: 3
};

const police = {
  x: 850,
  y: 850,
  size: 25,
  active: false
};

let cameraX = 0;
let cameraY = 0;

let missionComplete = false;
let gameOver = false;

const keys = {};
const buildings = [];

const goal = {
  x: 1100,
  y: 300,
  size: 27
};

// Set canvas dimensions.
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  W = window.innerWidth;
  H = window.innerHeight;

  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);

  canvas.style.width = W + "px";
  canvas.style.height = H + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resize);
resize();

// Create the city buildings.
for (let x = 80; x < worldW; x += 240) {
  for (let y = 80; y < worldH; y += 240) {
    buildings.push({
      x: x + 35,
      y: y + 35,
      w: 125,
      h: 125,
      shade: Math.random() > 0.5
        ? "#303741"
        : "#262e38"
    });
  }
}

// Keyboard controls.
document.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();

  if (
    ["arrowup", "arrowdown", "arrowleft", "arrowright", " "]
      .includes(key)
  ) {
    event.preventDefault();
  }

  keys[key] = true;
});

document.addEventListener("keyup", event => {
  keys[event.key.toLowerCase()] = false;
});

// Mobile touch controls.
function bindButton(id, key) {
  const button = document.getElementById(id);

  button.addEventListener("pointerdown", event => {
    event.preventDefault();
    keys[key] = true;
    button.setPointerCapture(event.pointerId);
  });

  function release(event) {
    event.preventDefault();
    keys[key] = false;
  }

  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);

  button.addEventListener("lostpointercapture", () => {
    keys[key] = false;
  });
}

bindButton("up", "arrowup");
bindButton("down", "arrowdown");
bindButton("left", "arrowleft");
bindButton("right", "arrowright");

// Detect collisions with buildings.
function collides(x, y, size) {
  return buildings.some(building =>
    x + size / 2 > building.x &&
    x - size / 2 < building.x + building.w &&
    y + size / 2 > building.y &&
    y - size / 2 < building.y + building.h
  );
}

// Move the player.
function movePlayer(dx, dy) {
  const nextX = Math.max(
    player.size,
    Math.min(worldW - player.size, player.x + dx)
  );

  const nextY = Math.max(
    player.size,
    Math.min(worldH - player.size, player.y + dy)
  );

  if (!collides(nextX, player.y, player.size)) {
    player.x = nextX;
  }

  if (!collides(player.x, nextY, player.size)) {
    player.y = nextY;
  }
}

// Draw city roads.
function drawRoads() {
  ctx.fillStyle = "#20262c";
  ctx.fillRect(0, 0, worldW, worldH);

  for (let x = 0; x < worldW; x += 240) {
    ctx.fillStyle = "#383e43";
    ctx.fillRect(x, 0, 65, worldH);

    ctx.strokeStyle = "#a5a5a555";
    ctx.setLineDash([16, 18]);

    ctx.beginPath();
    ctx.moveTo(x + 32, 0);
    ctx.lineTo(x + 32, worldH);
    ctx.stroke();

    ctx.setLineDash([]);
  }

  for (let y = 0; y < worldH; y += 240) {
    ctx.fillStyle = "#383e43";
    ctx.fillRect(0, y, worldW, 65);

    ctx.strokeStyle = "#a5a5a555";
    ctx.setLineDash([16, 18]);

    ctx.beginPath();
    ctx.moveTo(0, y + 32);
    ctx.lineTo(worldW, y + 32);
    ctx.stroke();

    ctx.setLineDash([]);
  }
}

// Draw buildings and windows.
function drawBuildings() {
  buildings.forEach(building => {
    ctx.fillStyle = "#00000055";

    ctx.fillRect(
      building.x + 7,
      building.y + 7,
      building.w,
      building.h
    );

    ctx.fillStyle = building.shade;

    ctx.fillRect(
      building.x,
      building.y,
      building.w,
      building.h
    );

    ctx.strokeStyle = "#626d7a";
    ctx.lineWidth = 2;

    ctx.strokeRect(
      building.x,
      building.y,
      building.w,
      building.h
    );

    for (
      let wx = building.x + 14;
      wx < building.x + building.w - 10;
      wx += 27
    ) {
      for (
        let wy = building.y + 15;
        wy < building.y + building.h - 10;
        wy += 28
      ) {
        ctx.fillStyle = Math.random() > 0.5
          ? "#e7b85c"
          : "#43515f";

        ctx.fillRect(wx, wy, 10, 10);
      }
    }
  });
}

// Draw a character.
function drawCharacter(x, y, color, size, label) {
  ctx.fillStyle = "#00000066";

  ctx.beginPath();

  ctx.ellipse(
    x,
    y + size / 2,
    size * 0.7,
    size * 0.35,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = color;

  ctx.fillRect(
    x - size / 2,
    y - size / 2,
    size,
    size
  );

  ctx.fillStyle = "#f1c7a2";

  ctx.beginPath();

  ctx.arc(
    x,
    y - size / 2 - 5,
    size * 0.35,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";

  ctx.fillText(label, x, y - size);
}

// Draw the mission marker.
function drawGoal() {
  if (missionComplete) return;

  const pulse = 1 + Math.sin(Date.now() / 200) * 0.12;

  ctx.strokeStyle = "#f5a623";
  ctx.lineWidth = 4;

  ctx.beginPath();

  ctx.arc(
    goal.x,
    goal.y,
    goal.size * pulse,
    0,
    Math.PI * 2
  );

  ctx.stroke();

  ctx.fillStyle = "#f5a623";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";

  ctx.fillText("MISSION", goal.x, goal.y - 42);
}

// Draw the police vehicle.
function drawPolice() {
  if (!police.active) return;

  ctx.fillStyle = "#d7dce3";

  ctx.fillRect(
    police.x - 19,
    police.y - 12,
    38,
    24
  );

  ctx.fillStyle = "#245db4";

  ctx.fillRect(
    police.x - 19,
    police.y - 12,
    13,
    24
  );

  ctx.fillStyle = "#d84141";

  ctx.fillRect(
    police.x + 6,
    police.y - 12,
    13,
    24
  );

  ctx.fillStyle = "#9ee6ff";

  ctx.fillRect(
    police.x - 9,
    police.y - 7,
    18,
    14
  );
}

// Update the game.
function update() {
  if (gameOver) return;

  let dx = 0;
  let dy = 0;

  if (keys["arrowup"] || keys["w"]) {
    dy -= player.speed;
  }

  if (keys["arrowdown"] || keys["s"]) {
    dy += player.speed;
  }

  if (keys["arrowleft"] || keys["a"]) {
    dx -= player.speed;
  }

  if (keys["arrowright"] || keys["d"]) {
    dx += player.speed;
  }

  if (dx !== 0 && dy !== 0) {
    dx *= 0.707;
    dy *= 0.707;
  }

  movePlayer(dx, dy);

  // Follow the player with the camera.
  cameraX = Math.max(
    0,
    Math.min(worldW - W, player.x - W / 2)
  );

  cameraY = Math.max(
    0,
    Math.min(worldH - H, player.y - H / 2)
  );

  // Complete the first mission.
  if (!missionComplete) {
    const distance = Math.hypot(
      player.x - goal.x,
      player.y - goal.y
    );

    if (distance < 45) {
      missionComplete = true;
      police.active = true;

      mission.textContent =
        "MISSION 1 COMPLETE: Your story begins";

      status.textContent =
        "New objective: Face the police encounter";

      messageTitle.textContent = "MISSION COMPLETE";

      messageText.textContent =
        "You explored the city. Your next chapter " +
        "begins with a police encounter.";

      message.style.display = "block";
    }
  }

  // The fictional police encounter.
  if (police.active) {
    const distance = Math.hypot(
      player.x - police.x,
      player.y - police.y
    );

    if (distance > 1) {
      police.x +=
        ((player.x - police.x) / distance) * 0.8;

      police.y +=
        ((player.y - police.y) / distance) * 0.8;
    }

    if (distance < 25) {
      gameOver = true;

      messageTitle.textContent = "ARRESTED";

      messageText.textContent =
        "You have been arrested. The prison chapter " +
        "will arrive in a future update.";

      message.style.display = "block";
    }
  }
}

// Render the scene.
function draw() {
  ctx.clearRect(0, 0, W, H);

  ctx.save();

  ctx.translate(-cameraX, -cameraY);

  drawRoads();
  drawBuildings();
  drawGoal();
  drawPolice();

  drawCharacter(
    player.x,
    player.y,
    "#f5a623",
    player.size,
    "YOU"
  );

  ctx.restore();
}

// Start the game loop.
function loop() {
  update();
  draw();

  requestAnimationFrame(loop);
}

// Mission button.
document.getElementById("action").addEventListener("click", () => {
  if (gameOver) return;

  if (!missionComplete) {
    status.textContent =
      "Follow the orange mission marker!";
  } else {
    status.textContent =
      "Explore the city. Watch for police!";
  }
});

// Continue or restart.
document.getElementById("continue").addEventListener("click", () => {
  if (gameOver) {
    player.x = 180;
    player.y = 180;

    police.x = 850;
    police.y = 850;
    police.active = false;

    missionComplete = false;
    gameOver = false;

    mission.textContent = "MISSION 1: Explore the city";
    status.textContent = "Location: United States";
  }

  message.style.display = "none";
});

loop();
