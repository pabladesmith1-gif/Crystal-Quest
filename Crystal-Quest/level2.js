// This file defines the world for Level 2: The Fire World

// --- NEW: Seeded Random Number Generator ---
// By using a fixed seed, the "random" map will be the same every time.
// Change this number to get a completely new, different static map!
const LEVEL_SEED = 12345; 

// A simple function to create a predictable random number generator from a seed.
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}
// --- END of new code ---


function generateWorldScreens() {
    gameState.worldScreens = {};
    const random = mulberry32(LEVEL_SEED); // Create our predictable random generator

    // --- Maze Generation Logic ---
    const grid = Array(WORLD_SIZE_SCREENS).fill(null).map((_, y) => 
        Array(WORLD_SIZE_SCREENS).fill(null).map((_, x) => ({
            x, y, visited: false, walls: { top: true, right: true, bottom: true, left: true }
        }))
    );

    const stack = [];
    let current = grid[3][3];
    current.visited = true;
    let visitedCount = 1;

    while (visitedCount < WORLD_SIZE_SCREENS * WORLD_SIZE_SCREENS) {
        const { x, y } = current;
        const neighbors = [];
        if (y > 0 && !grid[y - 1][x].visited) neighbors.push(grid[y - 1][x]);
        if (x < WORLD_SIZE_SCREENS - 1 && !grid[y][x + 1].visited) neighbors.push(grid[y][x + 1]);
        if (y < WORLD_SIZE_SCREENS - 1 && !grid[y + 1][x].visited) neighbors.push(grid[y + 1][x]);
        if (x > 0 && !grid[y][x - 1].visited) neighbors.push(grid[y][x - 1]);

        if (neighbors.length > 0) {
            stack.push(current);
            const next = neighbors[Math.floor(random() * neighbors.length)];
            
            if (next.y < y) { current.walls.top = false; next.walls.bottom = false; }
            else if (next.x > x) { current.walls.right = false; next.walls.left = false; }
            else if (next.y > y) { current.walls.bottom = false; next.walls.top = false; }
            else if (next.x < x) { current.walls.left = false; next.walls.right = false; }

            current = next;
            current.visited = true;
            visitedCount++;
        } else if (stack.length > 0) {
            current = stack.pop();
        }
    }
    
    const extraPathChance = 0.20;
    for (let y = 0; y < WORLD_SIZE_SCREENS; y++) {
        for (let x = 0; x < WORLD_SIZE_SCREENS; x++) {
            if (x < WORLD_SIZE_SCREENS - 1 && random() < extraPathChance) {
                grid[y][x].walls.right = false;
                grid[y][x+1].walls.left = false;
            }
            if (y < WORLD_SIZE_SCREENS - 1 && random() < extraPathChance) {
                grid[y][x].walls.bottom = false;
                grid[y+1][x].walls.top = false;
            }
        }
    }

    const worldTemplateMap = Array(WORLD_SIZE_SCREENS).fill(null).map(() => Array(WORLD_SIZE_SCREENS).fill(-1));
    for (let y = 0; y < WORLD_SIZE_SCREENS; y++) {
        for (let x = 0; x < WORLD_SIZE_SCREENS; x++) {
            gameState.worldScreens[`${x}-${y}`] = generateScreen(x, y, worldTemplateMap, grid, random);
        }
    }
}

function generateScreen(screenX, screenY, worldTemplateMap, worldMaze, random) { 
    const screen = { tiles: [], enemies: [], items: [], crystalPillars: [], scorchPatches: [] };
    const layout = getScreenLayout(screenX, screenY, worldTemplateMap, worldMaze, random);
    screen.tiles = layout.map(row => [...row]);

    const isSolid = (x, y) => {
        if (x < 0 || x >= SCREEN_WIDTH_TILES || y < 0 || y >= SCREEN_HEIGHT_TILES) return true;
        const tile = layout[y][x];
        return SOLID_TILES_MOVEMENT.includes(tile) || tile === TILES.LAVA;
    };

    const validSpawnTiles = [];
    for (let y = 1; y < SCREEN_HEIGHT_TILES - 1; y++) {
        for (let x = 1; x < SCREEN_WIDTH_TILES - 1; x++) {
            if (!isSolid(x, y)) {
                validSpawnTiles.push({ x, y });
            }
        }
    }

    if (validSpawnTiles.length > 0) {
        const enemyPositions = getEnemyPositions(screenX, screenY, random);
        for (const pos of enemyPositions) {
            if (validSpawnTiles.length === 0) break;
            const spawnIndex = Math.floor(random() * validSpawnTiles.length);
            const spawnPoint = validSpawnTiles.splice(spawnIndex, 1)[0];
            screen.enemies.push(createEnemy(spawnPoint.x * TILE_SIZE + 10, spawnPoint.y * TILE_SIZE + 10, screenX, screenY, pos.isBoss, pos.type));
        }
    }
    return screen;
}

// --- NEW FUNCTION to ensure all walkable areas are connected ---
function ensureConnectivity(layout) {
    const { STONE_FLOOR: S, MAGIC_PATH: P } = TILES;
    const walkableTypes = [S, P];
    const width = layout[0].length;
    const height = layout.length;

    const walkableTiles = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (walkableTypes.includes(layout[y][x])) {
                walkableTiles.push({x, y});
            }
        }
    }

    if (walkableTiles.length === 0) return;

    let mainIsland = new Set();
    let islands = [];
    let visited = new Set();

    for (const startTile of walkableTiles) {
        const tileKey = `${startTile.x},${startTile.y}`;
        if (visited.has(tileKey)) continue;

        let currentIsland = new Set();
        let queue = [startTile];
        visited.add(tileKey);
        currentIsland.add(tileKey);

        while (queue.length > 0) {
            const {x, y} = queue.shift();

            const neighbors = [ {x: x+1, y}, {x: x-1, y}, {x, y: y+1}, {x, y: y-1} ];
            for (const n of neighbors) {
                const nKey = `${n.x},${n.y}`;
                if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height && walkableTypes.includes(layout[n.y][n.x]) && !visited.has(nKey)) {
                    visited.add(nKey);
                    currentIsland.add(nKey);
                    queue.push(n);
                }
            }
        }
        islands.push(Array.from(currentIsland).map(k => ({x: parseInt(k.split(',')[0]), y: parseInt(k.split(',')[1])})));
    }

    if (islands.length <= 1) return; // Already connected

    // Find the largest island to be the "main" one
    islands.sort((a, b) => b.length - a.length);
    mainIsland = new Set(islands[0].map(t => `${t.x},${t.y}`));
    
    // Connect smaller islands to the main one
    for (let i = 1; i < islands.length; i++) {
        const island = islands[i];
        let bestStart = null;
        let bestEnd = null;
        let minDistance = Infinity;

        // Find the closest two points between this island and the main island
        for (const startNode of island) {
            for (const mainNodeKey of mainIsland) {
                const endNode = {x: parseInt(mainNodeKey.split(',')[0]), y: parseInt(mainNodeKey.split(',')[1])};
                const distance = Math.abs(startNode.x - endNode.x) + Math.abs(startNode.y - endNode.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    bestStart = startNode;
                    bestEnd = endNode;
                }
            }
        }

        // Build a bridge from the closest point on the island to the closest point on the main island
        if (bestStart && bestEnd) {
            let cx = bestStart.x;
            let cy = bestStart.y;
            while (cx !== bestEnd.x || cy !== bestEnd.y) {
                if (cx !== bestEnd.x) {
                    cx += Math.sign(bestEnd.x - cx);
                } else if (cy !== bestEnd.y) {
                    cy += Math.sign(bestEnd.y - cy);
                }
                if (walkableTypes.includes(layout[cy][cx])) continue;
                layout[cy][cx] = S; // Build bridge with Stone Floor
                mainIsland.add(`${cx},${cy}`); // Add the new bridge tile to the main island
            }
        }
    }
}


function getScreenLayout(screenX, screenY, worldTemplateMap, worldMaze, random) {
    const { STONE_FLOOR: S, WALL: W, OBSIDIAN: O, MAGIC_PATH: P, LAVA: L } = TILES;

    if (screenX === 7 && screenY === 7) {
        const volcanoLayout = [
            [W,W,W,W,W,W,W,P,P,W,W,W,W,W,W,W],[W,L,L,L,L,L,L,P,P,L,L,L,L,L,L,W],[W,L,O,O,O,O,O,P,P,O,O,O,O,O,L,W],[W,L,O,L,L,L,L,P,P,L,L,L,L,O,L,W],[W,L,O,L,L,O,O,S,S,O,O,L,L,O,L,W],[W,P,P,P,P,O,S,S,S,S,O,P,P,P,P,W],[W,P,P,P,P,O,S,S,S,S,O,P,P,P,P,W],[W,L,O,L,L,O,O,S,S,O,O,L,L,O,L,W],[W,L,O,L,L,L,L,P,P,L,L,L,L,O,L,W],[W,L,O,O,O,O,O,P,P,O,O,O,O,O,L,W],[W,L,L,L,L,L,L,P,P,L,L,L,L,L,L,W],[W,W,W,W,W,W,W,P,P,W,W,W,W,W,W,W],
        ];
        worldTemplateMap[screenY][screenX] = -1;
        return volcanoLayout;
    }
    
    const fireTemplates = [
        [[W,W,W,W,W,W,W,P,P,W,W,W,W,W,W,W],[W,L,L,L,L,L,L,P,P,L,L,L,L,L,L,W],[W,L,L,L,L,O,O,P,P,O,O,L,L,L,L,W],[W,L,L,L,O,S,S,S,S,S,S,O,L,L,L,W],[W,L,L,O,S,S,L,L,L,L,S,S,O,L,L,W],[W,P,P,P,S,L,L,L,L,L,L,S,P,P,P,W],[W,P,P,P,S,L,L,L,L,L,L,S,P,P,P,W],[W,L,L,O,S,S,L,L,L,L,S,S,O,L,L,W],[W,L,L,L,O,S,S,S,S,S,S,O,L,L,L,W],[W,L,L,L,L,O,O,P,P,O,O,L,L,L,L,W],[W,L,L,L,L,L,L,P,P,L,L,L,L,L,L,W],[W,W,W,W,W,W,W,P,P,W,W,W,W,W,W,W]],
        [[W,W,W,W,W,W,W,P,P,W,W,W,W,W,W,W],[W,L,L,L,L,L,O,O,O,O,O,O,L,L,L,W],[W,L,L,O,O,O,O,S,S,L,L,L,L,L,L,W],[W,L,O,S,S,S,L,S,S,L,O,O,O,L,L,W],[W,L,O,S,L,L,L,S,S,L,S,S,O,L,L,W],[W,P,P,S,S,S,S,S,S,S,S,S,P,P,P,W],[W,P,P,P,S,S,S,S,S,S,S,S,S,P,P,W],[W,L,L,O,S,S,L,S,S,L,L,L,S,O,L,W],[W,L,L,L,O,O,O,L,S,S,L,S,S,O,L,W],[W,L,L,L,L,L,L,S,S,O,O,O,O,L,L,W],[W,L,L,L,O,O,O,O,O,O,O,L,L,L,L,W],[W,W,W,W,W,W,W,P,P,W,W,W,W,W,W,W]],
        [[W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],[W,O,O,S,S,L,L,L,L,L,L,S,S,O,O,W],[W,S,S,S,L,L,L,L,L,L,L,L,S,S,S,W],[W,S,S,L,L,L,L,P,P,L,L,L,L,S,S,W],[W,S,L,L,L,L,P,P,P,P,L,L,L,L,S,W],[W,P,P,P,P,P,P,S,S,P,P,P,P,P,P,W],[W,P,P,P,P,P,P,S,S,P,P,P,P,P,P,W],[W,S,L,L,L,L,P,P,P,P,L,L,L,L,S,W],[W,S,S,L,L,L,L,P,P,L,L,L,L,S,S,W],[W,S,S,S,L,L,L,L,L,L,L,L,S,S,S,W],[W,O,O,S,S,L,L,L,L,L,L,S,S,O,O,W],[W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W]],
        [[W,W,W,W,W,W,W,P,P,W,W,W,W,W,W,W],[W,L,O,O,O,S,L,P,P,L,S,O,O,O,L,W],[W,L,O,S,S,S,L,P,P,L,S,S,S,O,L,W],[W,L,O,S,L,L,L,L,L,L,L,L,S,O,L,W],[W,L,O,S,L,L,S,S,S,S,L,L,S,O,L,W],[W,L,S,S,S,S,S,S,S,S,S,S,S,S,L,W],[W,L,S,S,S,S,S,S,S,S,S,S,S,S,L,W],[W,L,O,S,L,L,S,S,S,S,L,L,S,O,L,W],[W,L,O,S,L,L,L,L,L,L,L,L,S,O,L,W],[W,L,O,S,S,S,L,P,P,L,S,S,S,O,L,W],[W,L,O,O,O,S,L,P,P,L,S,O,O,O,L,W],[W,W,W,W,W,W,W,P,P,W,W,W,W,W,W,W]],
    ];

    const forbiddenIndexes = [];
    if (screenX > 0 && worldTemplateMap[screenY][screenX - 1] !== -1) forbiddenIndexes.push(worldTemplateMap[screenY][screenX - 1]);
    if (screenY > 0 && worldTemplateMap[screenY - 1][screenX] !== -1) forbiddenIndexes.push(worldTemplateMap[screenY - 1][screenX]);

    let templateIndex = Math.floor(random() * fireTemplates.length);
    while (forbiddenIndexes.includes(templateIndex)) {
        templateIndex = (templateIndex + 1) % fireTemplates.length;
    }
    
    worldTemplateMap[screenY][screenX] = templateIndex;
    let layout = JSON.parse(JSON.stringify(fireTemplates[templateIndex]));

    const thisScreenWalls = worldMaze[screenY][screenX].walls;
    if (thisScreenWalls.top) { layout[0][7]=W; layout[0][8]=W; } else { layout[0][7]=P; layout[0][8]=P; }
    if (thisScreenWalls.bottom) { layout[11][7]=W; layout[11][8]=W; } else { layout[11][7]=P; layout[11][8]=P; }
    if (thisScreenWalls.left) { layout[5][0]=W; layout[6][0]=W; } else { layout[5][0]=P; layout[6][0]=P; }
    if (thisScreenWalls.right) { layout[5][15]=W; layout[6][15]=W; } else { layout[5][15]=P; layout[6][15]=P; }
    
    // --- Run the new connectivity check ---
    ensureConnectivity(layout);

    return layout;
}

function getEnemyPositions(screenX, screenY, random) {
    const positions = [];
    const enemyCount = 3 + Math.floor(random() * 4);
    for (let i = 0; i < enemyCount; i++) {
        let enemyType = 'shadow_mage';
        if (random() < 0.2) {
            enemyType = 'stone_golem';
        }
        positions.push({ isBoss: false, type: enemyType });
    }
    return positions;
}

function getBiomeForScreen(x, y) {
    return 'fire';
}