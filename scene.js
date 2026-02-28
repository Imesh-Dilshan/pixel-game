const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const TILE_W = 40;
const TILE_H = 20;
const ELEV_H = 12;
const WORLD_W = 18;
const WORLD_H = 18;
const ORIGIN_X = canvas.width / 2;
const ORIGIN_Y = 140;

const palette = {
  outline: '#1f3a2a',
  grassA: '#79d862',
  grassB: '#6ec457',
  water: '#39d4ea',
  waterDark: '#23a8bf',
  dirtTop: '#c78a62',
  dirtLeft: '#9e6848',
  dirtRight: '#b87652',
  shadow: 'rgba(18, 36, 24, 0.35)',
  treeDark: '#257345',
  treeMid: '#2f9158',
  treeLight: '#61c86e',
  trunk: '#8f5e42',
  roof: '#cb7754',
  wall: '#f2eedc',
  wallShade: '#d8ceb9',
  accent: '#5a6d90'
};

const terrain = Array.from({ length: WORLD_H }, (_, y) =>
  Array.from({ length: WORLD_W }, (_, x) => ({
    type: 'grass',
    elev: (x > 9 && y < 6) ? 1 : 0
  }))
);

for (let y = 10; y < 15; y++) {
  for (let x = 5; x < 10; x++) {
    terrain[y][x].type = 'water';
    terrain[y][x].elev = 0;
  }
}

const pathTiles = [
  [12, 4], [11, 5], [10, 6], [9, 7], [8, 8], [7, 9], [6, 10], [5, 11], [6, 11], [7, 11]
];
for (const [x, y] of pathTiles) terrain[y][x].type = 'path';

function isoToScreen(x, y, z = 0) {
  return {
    x: ORIGIN_X + (x - y) * (TILE_W / 2),
    y: ORIGIN_Y + (x + y) * (TILE_H / 2) - z * ELEV_H
  };
}

function drawDiamond(sx, sy, top, left, right, outline) {
  ctx.beginPath();
  ctx.moveTo(sx, sy - TILE_H / 2);
  ctx.lineTo(sx + TILE_W / 2, sy);
  ctx.lineTo(sx, sy + TILE_H / 2);
  ctx.lineTo(sx - TILE_W / 2, sy);
  ctx.closePath();
  ctx.fillStyle = top;
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.stroke();

  if (left) {
    ctx.beginPath();
    ctx.moveTo(sx - TILE_W / 2, sy);
    ctx.lineTo(sx, sy + TILE_H / 2);
    ctx.lineTo(sx, sy + TILE_H / 2 + ELEV_H);
    ctx.lineTo(sx - TILE_W / 2, sy + ELEV_H);
    ctx.closePath();
    ctx.fillStyle = left;
    ctx.fill();
    ctx.stroke();
  }

  if (right) {
    ctx.beginPath();
    ctx.moveTo(sx + TILE_W / 2, sy);
    ctx.lineTo(sx, sy + TILE_H / 2);
    ctx.lineTo(sx, sy + TILE_H / 2 + ELEV_H);
    ctx.lineTo(sx + TILE_W / 2, sy + ELEV_H);
    ctx.closePath();
    ctx.fillStyle = right;
    ctx.fill();
    ctx.stroke();
  }
}

function drawShadow(sx, sy, radiusX, radiusY) {
  ctx.fillStyle = palette.shadow;
  ctx.beginPath();
  ctx.ellipse(sx + 8, sy + 8, radiusX, radiusY, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawTree(obj) {
  const p = isoToScreen(obj.x, obj.y, obj.elev);
  drawShadow(p.x, p.y + 4, 16, 8);

  ctx.fillStyle = palette.trunk;
  ctx.strokeStyle = palette.outline;
  ctx.fillRect(p.x - 4, p.y - 34, 8, 24);
  ctx.strokeRect(p.x - 4, p.y - 34, 8, 24);

  const layers = [
    { c: palette.treeDark, r: 22, dy: -36 },
    { c: palette.treeMid, r: 18, dy: -46 },
    { c: palette.treeLight, r: 13, dy: -54 }
  ];

  for (const layer of layers) {
    ctx.fillStyle = layer.c;
    ctx.strokeStyle = palette.outline;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + layer.dy - layer.r);
    ctx.lineTo(p.x + layer.r, p.y + layer.dy);
    ctx.lineTo(p.x, p.y + layer.dy + layer.r * 0.65);
    ctx.lineTo(p.x - layer.r, p.y + layer.dy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawSign(obj) {
  const p = isoToScreen(obj.x, obj.y, obj.elev);
  drawShadow(p.x, p.y, 9, 4);

  ctx.fillStyle = palette.trunk;
  ctx.strokeStyle = palette.outline;
  ctx.fillRect(p.x - 2, p.y - 22, 4, 20);
  ctx.strokeRect(p.x - 2, p.y - 22, 4, 20);

  ctx.fillStyle = '#efe1c5';
  ctx.fillRect(p.x - 18, p.y - 34, 36, 14);
  ctx.strokeRect(p.x - 18, p.y - 34, 36, 14);

  ctx.fillStyle = palette.accent;
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(obj.label, p.x, p.y - 24);
}

function drawHouse(obj) {
  const p = isoToScreen(obj.x, obj.y, obj.elev);
  drawShadow(p.x + 4, p.y + 4, 28, 12);

  const baseY = p.y - 8;
  ctx.strokeStyle = palette.outline;

  ctx.fillStyle = palette.wall;
  ctx.fillRect(p.x - 34, baseY - 46, 42, 46);
  ctx.strokeRect(p.x - 34, baseY - 46, 42, 46);

  ctx.fillStyle = palette.wallShade;
  ctx.fillRect(p.x + 8, baseY - 38, 26, 38);
  ctx.strokeRect(p.x + 8, baseY - 38, 26, 38);

  ctx.fillStyle = palette.roof;
  ctx.beginPath();
  ctx.moveTo(p.x - 38, baseY - 46);
  ctx.lineTo(p.x - 3, baseY - 70);
  ctx.lineTo(p.x + 42, baseY - 54);
  ctx.lineTo(p.x + 8, baseY - 28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#5c3628';
  ctx.fillRect(p.x - 20, baseY - 16, 12, 16);
  ctx.strokeRect(p.x - 20, baseY - 16, 12, 16);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(p.x - 3, baseY - 62, 5, 28);
  ctx.fillRect(p.x - 26, baseY - 56, 22, 4);
  ctx.strokeRect(p.x - 3, baseY - 62, 5, 28);
}

function drawPlayer(obj) {
  const p = isoToScreen(obj.x, obj.y, obj.elev);
  drawShadow(p.x, p.y + 8, 11, 6);

  ctx.strokeStyle = '#101412';

  // Body: slightly larger than a tile-box sprite footprint
  ctx.fillStyle = '#1c1f22';
  ctx.fillRect(p.x - 6, p.y - 23, 12, 16);
  ctx.strokeRect(p.x - 6, p.y - 23, 12, 16);

  // Head
  ctx.fillStyle = '#7f8478';
  ctx.fillRect(p.x - 6, p.y - 31, 12, 10);
  ctx.strokeRect(p.x - 6, p.y - 31, 12, 10);

  // Eyes
  const eyeOffset = obj.facing === 'right' ? 1 : obj.facing === 'left' ? -1 : 0;
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(p.x - 4 + eyeOffset, p.y - 27, 2, 2);
  ctx.fillRect(p.x + 2 + eyeOffset, p.y - 27, 2, 2);

  // Legs
  ctx.fillStyle = '#111315';
  const step = obj.walkCycle > 0.5 ? 1 : 0;
  ctx.fillRect(p.x - 5, p.y - 7, 4, 6 + step);
  ctx.fillRect(p.x + 1, p.y - 7, 4, 6 + (1 - step));
}

const objects = [
  ...Array.from({ length: 44 }, (_, i) => {
    const x = (i * 7 + 3) % WORLD_W;
    const y = (i * 11 + 5) % WORLD_H;
    const blocked = terrain[y][x].type !== 'grass' || (x > 10 && y < 6);
    return blocked ? null : { kind: 'tree', x, y, elev: terrain[y][x].elev, h: 3 };
  }).filter(Boolean),
  { kind: 'house', x: 11, y: 4, elev: terrain[4][11].elev, h: 6 },
  { kind: 'sign', x: 10, y: 6, label: 'About', elev: terrain[6][10].elev, h: 2 },
  { kind: 'sign', x: 8, y: 8, label: 'Work', elev: terrain[8][8].elev, h: 2 },
  { kind: 'sign', x: 6, y: 10, label: 'Contact', elev: terrain[10][6].elev, h: 2 }
];

const blockedTiles = new Set();
for (const obj of objects) {
  if (obj.kind === 'tree') blockedTiles.add(`${obj.x},${obj.y}`);
}
// House footprint
blockedTiles.add('11,4');
blockedTiles.add('12,4');
blockedTiles.add('11,5');
blockedTiles.add('12,5');

const player = {
  kind: 'player',
  x: 9,
  y: 9,
  elev: terrain[9][9].elev,
  h: 2.2,
  facing: 'down',
  walkCycle: 0
};

const keys = new Set();
let movedAt = 0;
const STEP_MS = 120;

function canWalkTo(x, y) {
  if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return false;
  if (terrain[y][x].type === 'water') return false;
  if (blockedTiles.has(`${x},${y}`)) return false;
  return true;
}

function movePlayer(dx, dy, facing) {
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (!canWalkTo(nx, ny)) return false;

  player.x = nx;
  player.y = ny;
  player.elev = terrain[ny][nx].elev;
  player.facing = facing;
  player.walkCycle = (player.walkCycle + 0.5) % 1;
  return true;
}

function handleMovement(now) {
  if (now - movedAt < STEP_MS) return;

  // Isometric controls mapped to visible screen directions.
  if (keys.has('ArrowUp')) {
    movePlayer(-1, -1, 'up');
    movedAt = now;
  } else if (keys.has('ArrowDown')) {
    movePlayer(1, 1, 'down');
    movedAt = now;
  } else if (keys.has('ArrowLeft')) {
    movePlayer(-1, 1, 'left');
    movedAt = now;
  } else if (keys.has('ArrowRight')) {
    movePlayer(1, -1, 'right');
    movedAt = now;
  }
}

window.addEventListener('keydown', (event) => {
  if (event.key.startsWith('Arrow')) {
    event.preventDefault();
    keys.add(event.key);
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key.startsWith('Arrow')) {
    event.preventDefault();
    keys.delete(event.key);
  }
});

function drawWorld() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      const tile = terrain[y][x];
      const p = isoToScreen(x, y, tile.elev);
      const checker = (x + y) % 2 === 0;
      const grass = checker ? palette.grassA : palette.grassB;

      if (tile.type === 'grass') {
        drawDiamond(p.x, p.y, grass, tile.elev ? '#5ea84d' : null, tile.elev ? '#70b958' : null, palette.outline);
      } else if (tile.type === 'water') {
        drawDiamond(p.x, p.y + 2, palette.water, null, null, '#1a8ea0');
        ctx.fillStyle = palette.waterDark;
        ctx.fillRect(p.x - 8, p.y - 1, 16, 2);
      } else {
        drawDiamond(p.x, p.y, palette.dirtTop, null, null, '#6a3f2e');
      }
    }
  }

  const drawQueue = [...objects, player].sort((a, b) => (a.x + a.y + a.h * 0.35) - (b.x + b.y + b.h * 0.35));
  for (const obj of drawQueue) {
    if (obj.kind === 'tree') drawTree(obj);
    if (obj.kind === 'house') drawHouse(obj);
    if (obj.kind === 'sign') drawSign(obj);
    if (obj.kind === 'player') drawPlayer(obj);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 0, canvas.width, 28);
  ctx.fillStyle = '#dbf6ff';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('ARROWS TO MOVE · ORTHOGRAPHIC · ISOMETRIC DIAMOND GRID', 12, 18);
}

function loop(now) {
  handleMovement(now);
  drawWorld();
  window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);
