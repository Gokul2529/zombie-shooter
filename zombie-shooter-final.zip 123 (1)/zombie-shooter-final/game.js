const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- Game State ---
let score = 0;
let health = 100;
let ammo = 20;
let wave = 1;
let isGameOver = false;
const bullets = [];
const zombies = [];
const keys = {};

// --- Audio Assets (Ensure these files exist in your assets/sounds/ folder) ---
const shootSound = new Audio('assets/sounds/shoot.mp3');
const deathSound = new Audio('assets/sounds/zombieDeath.mp3');
const bgMusic = new Audio('assets/sounds/bgMusic.mp3');
bgMusic.loop = true;

// --- Player Object ---
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 20,
    speed: 5,
    angle: 0
};

// --- Input Handling ---
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);
window.addEventListener('mousemove', (e) => {
    player.angle = Math.atan2(e.clientY - player.y, e.clientX - player.x);
});
window.addEventListener('mousedown', shoot);

function shoot() {
    if (ammo > 0 && !isGameOver) {
        bullets.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(player.angle) * 10,
            vy: Math.sin(player.angle) * 10
        });
        ammo--;
        shootSound.play();
        updateUI();
    }
}

// --- Game Functions ---
function spawnZombie() {
    if (isGameOver) return;
    const radius = 20;
    let x, y;
    // Spawn from random edges
    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
        y = Math.random() * canvas.height;
    } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
    }
    zombies.push({ 
        x, y, 
        radius, 
        speed: 1 + (wave * 0.2), // Zombies get faster each wave
        hp: 1 
    });
}

function updateUI() {
    document.getElementById('score').innerText = score;
    document.getElementById('ammo').innerText = ammo;
    document.getElementById('wave').innerText = wave;
    document.getElementById('health-bar').style.width = health + "%";
}

function checkCollision(a, b) {
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    return dist < a.radius + b.radius;
}

// --- Main Loop ---
function update() {
    if (isGameOver) return;

    // Player Movement
    if (keys['KeyW'] || keys['ArrowUp']) player.y -= player.speed;
    if (keys['KeyS'] || keys['ArrowDown']) player.y += player.speed;
    if (keys['KeyA'] || keys['ArrowLeft']) player.x -= player.speed;
    if (keys['KeyD'] || keys['ArrowRight']) player.x += player.speed;

    // Bullet logic
    bullets.forEach((b, bi) => {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) bullets.splice(bi, 1);
    });

    // Zombie logic
    zombies.forEach((z, zi) => {
        const angle = Math.atan2(player.y - z.y, player.x - z.x);
        z.x += Math.cos(angle) * z.speed;
        z.y += Math.sin(angle) * z.speed;

        // Zombie hits player
        if (checkCollision(player, z)) {
            health -= 0.5;
            updateUI();
            if (health <= 0) endGame();
        }

        // Bullet hits zombie
        bullets.forEach((b, bi) => {
            if (checkCollision(z, b)) {
                zombies.splice(zi, 1);
                bullets.splice(bi, 1);
                score += 10;
                deathSound.play();
                updateUI();
                // Difficulty Scaling
                if (score % 100 === 0) { wave++; ammo += 10; }
            }
        });
    });

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.fillStyle = '#3498db';
    ctx.fillRect(-15, -15, 30, 30); // Square player
    ctx.fillStyle = 'black';
    ctx.fillRect(10, -5, 15, 10); // Gun barrel
    ctx.restore();

    // Draw Bullets
    ctx.fillStyle = 'yellow';
    bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw Zombies
    ctx.fillStyle = '#2ecc71';
    zombies.forEach(z => {
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function endGame() {
    isGameOver = true;
    bgMusic.pause();
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-score').innerText = score;
}

// Restart logic
window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyR' && isGameOver) location.reload();
});

// Start Game
setInterval(spawnZombie, 1500); // Spawn every 1.5s
bgMusic.play();
update();
