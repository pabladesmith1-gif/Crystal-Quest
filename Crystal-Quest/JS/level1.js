// This file defines the world for Level 1

function generateWorldScreens(){gameState.worldScreens={};const worldTemplateMap=Array(WORLD_SIZE_SCREENS).fill(null).map(()=>Array(WORLD_SIZE_SCREENS).fill(-1));for(let y=0;y<WORLD_SIZE_SCREENS;y++){for(let x=0;x<WORLD_SIZE_SCREENS;x++){gameState.worldScreens[`${x}-${y}`]=generateScreen(x,y,worldTemplateMap);}}
gameState.merchant=createMerchant(canvas.width/2-20,TILE_SIZE*5);gameState.hatTrader=createMerchant(canvas.width/2-20,TILE_SIZE*5,true);}

function generateScreen(screenX,screenY,worldTemplateMap){const screen={tiles:[],enemies:[],items:[],crystalPillars:[],scorchPatches:[]};if(screenX===SHOP_LOCATION.x&&screenY===SHOP_LOCATION.y){const{STONE_FLOOR:S,WALL:W,TENT_LEFT:TL,TENT_RIGHT:TR,CAMPFIRE:CF,MAGIC_PATH:P}=TILES;const layout=[[W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],[W,S,S,S,S,S,S,S,S,S,S,S,S,S,S,W],[W,S,S,TL,TR,S,S,S,S,S,S,TL,TR,S,S,W],[W,S,S,S,S,S,S,S,S,S,S,S,S,S,S,W],[W,S,S,S,S,S,S,S,S,S,S,S,S,S,S,W],[W,S,S,S,S,S,S,CF,S,S,S,S,S,S,S,W],[W,S,S,S,S,S,S,S,S,S,S,S,S,S,S,W],[W,S,S,S,S,S,S,S,S,S,S,S,S,S,S,W],[W,S,S,TL,TR,S,S,S,S,S,S,TL,TR,S,S,W],[W,S,S,S,S,S,S,S,S,S,S,S,S,S,S,W],[W,S,S,S,S,S,S,P,P,S,S,S,S,S,S,W],[W,W,W,W,W,W,W,P,P,W,W,W,W,W,W,W]];screen.tiles=layout;return screen;}
if(screenX===HAT_SHOP_LOCATION.x&&screenY===HAT_SHOP_LOCATION.y){const{STONE_FLOOR:S,WALL:W,LAVA:L,TENT_LEFT:TL,TENT_RIGHT:TR,CAMPFIRE:CF,MAGIC_PATH:P}=TILES;const layout=[[W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],[W,L,L,L,L,L,L,L,L,L,L,L,L,L,L,W],[W,L,S,S,S,S,S,S,S,S,S,S,S,S,L,W],[W,L,S,TL,TR,S,S,S,S,S,S,S,S,S,L,W],[W,L,S,S,S,S,S,S,S,S,S,S,S,S,L,W],[W,L,S,S,S,S,S,CF,S,S,S,S,S,S,L,W],[W,L,S,S,S,S,S,S,S,S,S,S,S,S,L,W],[W,L,S,S,S,S,S,S,S,S,S,S,S,S,L,W],[W,L,S,S,S,S,S,S,S,S,S,S,S,S,L,W],[W,L,S,S,S,S,S,S,S,S,S,S,S,S,L,W],[W,L,L,L,L,L,L,P,P,L,L,L,L,L,L,W],[W,W,W,W,W,W,W,P,P,W,W,W,W,W,W,W]];screen.tiles=layout;return screen;}
const layout=getScreenLayout(screenX,screenY,worldTemplateMap);screen.tiles=layout.map(row=>[...row]);
const isSolid=(x,y)=>{
    if(x<0||x>=SCREEN_WIDTH_TILES||y<0||y>=SCREEN_HEIGHT_TILES)return true;
    const tile=layout[y][x];
    return SOLID_TILES_MOVEMENT.includes(tile)||tile===TILES.LAVA||tile===TILES.MANA_POOL||tile===TILES.POISON_SPIKES;
};

if(!(screenX===3&&screenY===3)){
    const validSpawnTiles = [];
    for (let y = 1; y < SCREEN_HEIGHT_TILES - 1; y++) {
        for (let x = 1; x < SCREEN_WIDTH_TILES - 1; x++) {
            if (!isSolid(x, y)) {
                validSpawnTiles.push({ x, y });
            }
        }
    }

    if (validSpawnTiles.length > 0) {
        const enemyPositions = getEnemyPositions(screenX, screenY);
        for (const pos of enemyPositions) {
            if (validSpawnTiles.length === 0) break;
            let bestSpawnIndex = 0;
            let minDistance = Infinity;

            for (let i = 0; i < validSpawnTiles.length; i++) {
                const validTile = validSpawnTiles[i];
                const distance = Math.sqrt(Math.pow(validTile.x - pos.x, 2) + Math.pow(validTile.y - pos.y, 2));
                if (distance < minDistance) {
                    minDistance = distance;
                    bestSpawnIndex = i;
                }
            }
            
            const bestSpawn = validSpawnTiles[bestSpawnIndex];
            validSpawnTiles.splice(bestSpawnIndex, 1);
            screen.enemies.push(createEnemy(bestSpawn.x * TILE_SIZE + 10, bestSpawn.y * TILE_SIZE + 10, screenX, screenY, pos.isBoss, pos.type));
        }
    }
} else {
    // Manually place a portal on the starting screen (3,3) for demonstration
    screen.tiles[1][1] = TILES.PORTAL;
}
return screen;}

function getScreenLayout(screenX,screenY,worldTemplateMap){const{STONE_FLOOR:S,WALL:W,OBSIDIAN:O,MAGIC_PATH:P,SEALED_DOOR:SD,POISON_SPIKES:PS,MANA_POOL:MP,LAVA:L,BARRIER:B}=TILES;const templates=[[[W,W,W,W,W,W,W,P,P,W,W,W,W,W,W,W],[W,S,S,S,S,S,S,P,P,S,S,S,S,S,S,W],[W,S,O,S,S,S,S,P,P,S,S,S,O,S,S,W],[W,S,S,S,S,S,S,P,P,S,S,S,S,S,S,W],[W,S,S,S,S,S,S,P,P,S,S,S,S,S,S,W],[W,P,P,P,P,P,P,P,P,P,P,P,P,P,P,W],[W,P,P,P,P,P,P,P,P,P,P,P,P,P,P,W],[W,S,S,S,S,S,S,P,P,S,S,S,S,S,S,W],[W,S,O,S,S,S,S,P,P,S,S,S,O,S,S,W],[W,S,S,S,S,S,S,P,P,S,S,S,S,S,S,W],[W,S,S,S,S,S,S,S,S,S,S,S,S,S,S,W],[W,W,W,W,W,W,W,P,P,W,W,W,W,W,W,W]],[[W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],[W,S,S,S,S,S,S,S,S,S,S,S,S,S,S,W],[W,S,MP,S,O,S,S,S,S,S,S,O,S,MP,S,W],[W,S,S,S,S,S,S,S,S,S,S,S,S,S,S,W],[W,S,O,S,S,PS,PS,S,S,PS,PS,S,S,O,S,W],[W,S,S,S,PS,PS,PS,S,S,PS,PS,PS,S,S,S,W],[W,S,S,S,PS,PS,PS,S,S,PS,PS,PS,S,S,S,W],[W,S,O,S,S,PS,PS,S,S,PS,PS,S,S,O,S,W],[W,S,S,S,S,S,S,S,S,S,S,S,S,S,S,W],[W,S,MP,S,O,S,S,S,S,S,S,O,S,MP,S,W],[W,S,S,S,S,S,S,S,S,S,S,S,S,S,S,W],[W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W]],[[W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],[W,S,S,S,W,S,S,S,S,S,W,S,S,S,S,W],[W,S,W,S,W,S,W,W,W,S,W,S,W,W,S,W],[W,S,W,S,S,S,S,W,S,S,S,S,S,W,S,W],[W,S,W,W,W,S,W,W,S,W,W,S,W,W,S,W],[W,S,S,S,W,S,S,S,S,S,W,S,S,S,S,W],[W,W,W,S,W,S,W,S,S,W,S,S,W,S,W,W],[W,S,S,S,W,S,W,W,W,W,S,W,W,S,S,W],[W,S,W,S,S,S,S,W,S,S,S,S,W,S,W,W],[W,S,W,W,W,W,S,W,S,W,W,W,W,S,S,W],[W,S,S,S,S,S,S,S,S,S,S,S,S,S,S,W],[W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W]],[[W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],[W,S,S,S,S,S,S,S,S,S,S,S,S,S,S,W],[W,S,S,S,W,W,W,W,W,W,W,W,S,S,S,W],[W,S,S,W,W,L,L,L,L,L,L,W,W,S,S,W],[W,S,W,L,L,L,L,L,L,L,L,L,L,W,S,W],[W,S,W,L,L,L,MP,MP,MP,L,L,L,L,W,S,W],[W,S,W,L,L,L,MP,MP,MP,L,L,L,L,W,S,W],[W,S,W,L,L,L,L,L,L,L,L,L,L,W,S,W],[W,S,S,W,W,L,L,L,L,L,L,W,W,S,S,W],[W,S,S,S,W,W,W,W,W,W,W,W,S,S,S,W],[W,S,S,S,S,S,S,S,S,S,S,S,S,S,S,W],[W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W]],[[W,W,W,W,W,W,W,P,P,W,W,W,W,W,W,W],[W,S,S,S,S,S,L,L,L,L,S,S,S,S,S,W],[W,S,W,S,S,L,L,P,P,L,L,S,W,S,S,W],[W,S,W,S,L,L,P,P,P,P,L,L,W,S,S,W],[W,S,W,L,L,P,P,S,S,P,P,L,L,W,S,W],[W,P,P,P,P,P,P,S,S,S,S,P,P,P,P,P,W],[W,P,P,P,P,P,P,S,S,S,S,P,P,P,P,P,W],[W,S,W,L,L,P,P,S,S,P,P,L,L,W,S,W],[W,S,W,S,L,L,P,P,P,P,L,L,W,S,S,W],[W,S,W,S,S,L,L,P,P,L,L,S,W,S,S,W],[W,S,S,S,S,S,L,L,L,L,S,S,S,S,S,W],[W,W,W,W,W,W,W,P,P,W,W,W,W,W,W,W]],[[W,W,W,W,W,W,W,P,P,W,W,W,W,W,W,W],[W,S,S,S,S,PS,PS,P,P,PS,PS,S,S,S,S,W],[W,S,O,MP,MP,PS,S,P,P,S,PS,MP,MP,O,S,W],[W,S,MP,MP,S,S,S,P,P,S,S,S,MP,MP,S,W],[W,S,PS,S,S,O,S,S,S,S,O,S,S,PS,S,W],[W,P,P,P,P,P,P,S,S,P,P,P,P,P,P,W],[W,P,P,P,P,P,P,S,S,P,P,P,P,P,P,W],[W,S,PS,S,S,O,S,S,S,S,O,S,S,PS,S,W],[W,S,MP,MP,S,S,S,P,P,S,S,S,MP,MP,S,W],[W,S,O,MP,MP,PS,S,P,P,S,PS,MP,MP,O,S,W],[W,S,S,S,S,PS,PS,P,P,PS,PS,S,S,S,S,W],[W,W,W,W,W,W,W,P,P,W,W,W,W,W,W,W]],];const bossTemplate=Array(SCREEN_HEIGHT_TILES).fill(0).map((_,y)=>Array(SCREEN_WIDTH_TILES).fill(S).map((_,x)=>(y===0||y===SCREEN_HEIGHT_TILES-1||x===0||x===SCREEN_WIDTH_TILES-1)?W:S));let layout;const isBossScreen=(screenX===0&&screenY===0)||(screenX===7&&screenY===0)||(screenX===0&&screenY===7)||(screenX===7&&screenY===7);if(screenX===3&&screenY===3){layout=JSON.parse(JSON.stringify(templates[0]));worldTemplateMap[screenY][screenX]=0;}else if(isBossScreen){layout=JSON.parse(JSON.stringify(bossTemplate));}else if((screenX===1&&screenY===0)||(screenX===0&&screenY===1)){layout=JSON.parse(JSON.stringify(templates[0]));worldTemplateMap[screenY][screenX]=0;if(screenX===1)layout[5][0]=layout[6][0]=B;else layout[0][7]=layout[0][8]=B;}else{const forbiddenIndexes=[];if(screenX>0&&worldTemplateMap[screenY][screenX-1]!==-1){forbiddenIndexes.push(worldTemplateMap[screenY][screenX-1]);}
if(screenY>0&&worldTemplateMap[screenY-1][screenX]!==-1){forbiddenIndexes.push(worldTemplateMap[screenY-1][screenX]);}
const seed=screenX*19+screenY*97;let templateIndex=Math.floor(Math.abs(Math.sin(seed)*10000)%templates.length);while(forbiddenIndexes.includes(templateIndex)){templateIndex=(templateIndex+1)%templates.length;}
worldTemplateMap[screenY][screenX]=templateIndex;layout=JSON.parse(JSON.stringify(templates[templateIndex]));}
if(screenY>0&&layout[0][7]!==B&&layout[0][8]!==B){layout[0][7]=P;layout[0][8]=P;}
if(screenY<WORLD_SIZE_SCREENS-1){layout[11][7]=P;layout[11][8]=P;}
if(screenX>0&&layout[5][0]!==B&&layout[6][0]!==B){layout[5][0]=P;layout[6][0]=P;}
if(screenX<WORLD_SIZE_SCREENS-1){layout[5][15]=P;layout[6][15]=P;}
if(screenX===0){layout[5][0]=W;layout[6][0]=W;}
if(screenX===WORLD_SIZE_SCREENS-1){layout[5][15]=W;layout[6][15]=W;}
if(screenY===0){layout[0][7]=W;layout[0][8]=W;}
if(screenY===WORLD_SIZE_SCREENS-1){layout[11][7]=W;layout[11][8]=W;}
return layout;}

function getEnemyPositions(screenX,screenY){const bossPositions={'0-0':{type:'shadow_lord'},'7-0':{type:'shadow_mage'},'0-7':{type:'crystal_guardian'},'7-7':{type:'storm_elemental'},};const key=`${screenX}-${screenY}`;if(bossPositions[key]){return[{x:8,y:6,isBoss:true,type:bossPositions[key].type}];}
const seed=screenX*13+screenY*71;const positions=[];const enemyCount=2+Math.floor(Math.abs(Math.sin(seed)*10000)%3);const biome=getBiomeForScreen(screenX,screenY);for(let i=0;i<enemyCount;i++){const posSeed=seed+i*5;let enemyType='stone_golem';if(biome==='shadow'&&Math.random()<0.25){enemyType='void_sentinel';}
positions.push({x:2+Math.floor(Math.abs(Math.sin(posSeed)*10000)%(SCREEN_WIDTH_TILES-4)),y:2+Math.floor(Math.abs(Math.cos(posSeed)*10000)%(SCREEN_HEIGHT_TILES-4)),isBoss:false,type:enemyType});}
return positions;}