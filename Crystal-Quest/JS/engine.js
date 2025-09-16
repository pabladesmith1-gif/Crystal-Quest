/* Script block 1 */
const TILE_SIZE=50;const SCREEN_WIDTH_TILES=16;const SCREEN_HEIGHT_TILES=12;const WORLD_SIZE_SCREENS=8;const SHOP_LOCATION={x:3,y:2};const HAT_SHOP_LOCATION={x:6,y:1};
const TILES={STONE_FLOOR:0,WALL:1,LAVA:2,CRYSTAL_SAND:3,OBSIDIAN:4,MAGIC_PATH:5,SEALED_DOOR:6,OPEN_DOOR:7,POISON_SPIKES:8,MANA_POOL:9,BARRIER:10,TENT_LEFT:11,TENT_RIGHT:12,CAMPFIRE:13,TELEPORT_PAD:14,PORTAL:15, ASH_FLOOR: 16, CRACKED_GROUND: 17};
const SOLID_TILES_MOVEMENT=[TILES.WALL,TILES.OBSIDIAN,TILES.BARRIER,TILES.TENT_LEFT,TILES.TENT_RIGHT, TILES.CRACKED_GROUND];
const SOLID_TILES_PROJECTILE=[...SOLID_TILES_MOVEMENT,TILES.SEALED_DOOR];const canvas=document.getElementById('gameCanvas');const ctx=canvas.getContext('2d');let animationFrameId=null;let gameState={gameRunning:false,inventoryOpen:false,shopOpen:false,hatShopOpen:false,mapOpen:false,settingsOpen:false,isTransitioning:false,difficulty:'easy',keys:{},player:null,merchant:null,hatTrader:null,currentScreen:{x:3,y:3},worldScreens:{},visitedScreens:{},projectiles:[],enemyProjectiles:[],particles:[],gameOverTriggered:false,controlScheme:'arrows',aimScheme:'keyboard',mousePos:{x:0,y:0}, cheatCodeBuffer: ""};const upgradeShopItems=[{id:'arcaneArmor',name:'Arcane Armor',cost:100,description:'Increases max health.',purchased:()=>gameState.player.maxHealth>3,type:'upgrade'},{id:'powerBolt',name:'Power Bolt',cost:150,description:'Stronger, faster magic.',purchased:()=>gameState.player.hasPowerBolt,type:'upgrade'},{id:'swiftCaster',name:'Swift Casting',cost:120,description:'Increases movement speed.',purchased:()=>gameState.player.hasSwiftCaster,type:'upgrade'},{id:'lifeSteal',name:'Life Steal',cost:200,description:'Chance to heal on hit.',purchased:()=>gameState.player.hasLifeSteal,type:'upgrade'},{id:'goldMagnet',name:'Gold Magnet',cost:180,description:'Enemies drop more crystals.',purchased:()=>gameState.player.hasGoldMagnet,type:'upgrade'},];const hatShopItems=[{id:'archmageHat',name:'Archmage\'s Hat',cost:250,description:'Increases max mana by 50 & attack range by 2 tiles.',purchased:()=>gameState.player.hats.includes('archmage'),type:'hat'},{id:'warlockHood',name:'Warlock\'s Hood',cost:300,description:'Attacks have a chance to fire a triple shot.',purchased:()=>gameState.player.hats.includes('warlock'),type:'hat'}];function setupSVGRenderers(){}
function createPlayer(x,y){return{x,y,width:30,height:30,speed:3,health:3,maxHealth:3,mana:100,maxMana:100,gold:0,projectileSpeed:6,hats:['wizard'],equippedHat:'wizard',hasPowerBolt:false,hasSwiftCaster:false,hasLifeSteal:false,hasGoldMagnet:false,hasFireCrystal:false,hasIceCrystal:false,hasStormCrystal:false,attacking:false,attackTimer:0,invulnerable:false,invulnerableTimer:0,facing:'down',animFrame:0,animTimer:0,moving:false,isDying:false,deathAnimTimer:0,isDashing:false,dashTimer:0,dashCooldown:0,dashVx:0,dashVy:0,
update(){
    if(this.isDying){
        this.deathAnimTimer--;
        if(this.deathAnimTimer<=0&&!gameState.gameOverTriggered){
            gameState.gameOverTriggered=true;
            gameOver();
        }
        return;
    }

    if(gameState.isTransitioning||gameState.inventoryOpen||gameState.shopOpen||gameState.hatShopOpen||gameState.mapOpen||gameState.settingsOpen) return;
    
    this.updateAimDirection();
    
    const playerTileX=Math.floor((this.x+this.width/2)/TILE_SIZE);
    const playerTileY=Math.floor((this.y+this.height/2)/TILE_SIZE);
    const currentTile=getCurrentScreen().tiles[playerTileY][playerTileX];
    
    if (currentTile === TILES.PORTAL) {
        if (!gameState.isTransitioning) { // Prevent re-triggering
            console.log("Entering portal to Level 2!");
            gameState.isTransitioning = true; // Stop player movement
            document.getElementById('portalTransitionModal').classList.remove('hidden');
            
            saveGameState();
            sessionStorage.setItem('levelTransition', 'true');
            
            setTimeout(() => {
                window.location.href = 'level2.html';
            }, 3500); // Wait 3.5 seconds for animation
        }
        return; // Stop further player updates this frame
    }

    if(currentTile===TILES.TELEPORT_PAD){this.teleportToShop();return;}
    let speedModifier=1.0;if(currentTile===TILES.MANA_POOL){speedModifier=0.5;if(this.mana<this.maxMana){this.mana=Math.min(this.maxMana,this.mana+0.5);updateUI();}}
    if(currentTile===TILES.POISON_SPIKES)this.takeDamage();if(currentTile===TILES.LAVA&&!this.hasFireCrystal)this.takeDamage();const screen=getCurrentScreen();screen.scorchPatches.forEach(patch=>{if(patch.state==='active'){const dx=(this.x+this.width/2)-patch.x;const dy=(this.y+this.height/2)-patch.y;if(Math.sqrt(dx*dx+dy*dy)<patch.radius){this.takeDamage();}}});let newX=this.x,newY=this.y;this.moving=false;const currentSpeed=(this.hasSwiftCaster?this.speed*1.5:this.speed)*speedModifier;if(gameState.controlScheme==='arrows'){if(gameState.keys['arrowleft']){newX-=currentSpeed;this.facing='left';this.moving=true;}
    if(gameState.keys['arrowright']){newX+=currentSpeed;this.facing='right';this.moving=true;}
    if(gameState.keys['arrowup']){newY-=currentSpeed;this.facing='up';this.moving=true;}
    if(gameState.keys['arrowdown']){newY+=currentSpeed;this.facing='down';this.moving=true;}}else{if(gameState.keys['a']){newX-=currentSpeed;this.facing='left';this.moving=true;}
    if(gameState.keys['d']){newX+=currentSpeed;this.facing='right';this.moving=true;}
    if(gameState.keys['w']){newY-=currentSpeed;this.facing='up';this.moving=true;}
    if(gameState.keys['s']){newY+=currentSpeed;this.facing='down';this.moving=true;}}
    if(this.moving){this.animTimer++;if(this.animTimer>8){this.animFrame=(this.animFrame+1)%3;this.animTimer=0;}}else{this.animFrame=1;this.animTimer=0;}
    const pTileY=Math.floor(this.y/TILE_SIZE),pTileX=Math.floor(this.x/TILE_SIZE);const currentScreenX=gameState.currentScreen.x;const currentScreenY=gameState.currentScreen.y;const isAtShop=(currentScreenX===SHOP_LOCATION.x&&currentScreenY===SHOP_LOCATION.y)||(currentScreenX===HAT_SHOP_LOCATION.x&&currentScreenY===HAT_SHOP_LOCATION.y);if(newX<=5&&currentScreenX>0&&pTileY>=5&&pTileY<=6){if(!isAtShop){const nextScreenX=currentScreenX-1;const nextScreenY=currentScreenY;if(!((nextScreenX===SHOP_LOCATION.x&&nextScreenY===SHOP_LOCATION.y)||(nextScreenX===HAT_SHOP_LOCATION.x&&nextScreenY===HAT_SHOP_LOCATION.y))){this.transitionScreen(-1,0);return;}}}if(newX>=canvas.width-this.width-5&&currentScreenX<WORLD_SIZE_SCREENS-1&&pTileY>=5&&pTileY<=6){if(!isAtShop){const nextScreenX=currentScreenX+1;const nextScreenY=currentScreenY;if(!((nextScreenX===SHOP_LOCATION.x&&nextScreenY===SHOP_LOCATION.y)||(nextScreenX===HAT_SHOP_LOCATION.x&&nextScreenY===HAT_SHOP_LOCATION.y))){this.transitionScreen(1,0);return;}}}if(newY<=5&&currentScreenY>0&&pTileX>=7&&pTileX<=8){if(!isAtShop){this.transitionScreen(0,-1);return;}}if(newY>=canvas.height-this.height-5&&currentScreenY<WORLD_SIZE_SCREENS-1&&pTileX>=7&&pTileX<=8){if(isAtShop){this.transitionScreen(0,1);return;}else{const nextScreenX=currentScreenX;const nextScreenY=currentScreenY+1;if(!((nextScreenX===SHOP_LOCATION.x&&nextScreenY===SHOP_LOCATION.y)||(nextScreenX===HAT_SHOP_LOCATION.x&&nextScreenY===HAT_SHOP_LOCATION.y))){this.transitionScreen(0,1);return;}}}
    const checkCollision=(x,y)=>{const leftTile=Math.floor(x/TILE_SIZE);const rightTile=Math.floor((x+this.width)/TILE_SIZE);const topTile=Math.floor(y/TILE_SIZE);const bottomTile=Math.floor((y+this.height)/TILE_SIZE);return checkCollisionAndUnlock(leftTile,topTile)||checkCollisionAndUnlock(rightTile,topTile)||checkCollisionAndUnlock(leftTile,bottomTile)||checkCollisionAndUnlock(rightTile,bottomTile);};if(!checkCollision(newX,this.y))this.x=newX;if(!checkCollision(this.x,newY))this.y=newY;if(gameState.keys[' ']&&this.attackTimer<=0&&gameState.aimScheme==='keyboard'){this.attacking=true;this.attackTimer=20;this.performAttack();}
    if(gameState.keys['z']&&this.attackTimer<=0&&this.mana>=10){this.attacking=true;this.attackTimer=30;this.mana-=10;updateUI();this.performAttack('fireball');}
    if(this.attackTimer>0)this.attackTimer--;if(this.attackTimer<=0)this.attacking=false;if(this.invulnerableTimer>0)this.invulnerableTimer--;if(this.invulnerableTimer<=0)this.invulnerable=false;
},
updateAimDirection(){if(gameState.aimScheme!=='mouse')return;const angle=Math.atan2(gameState.mousePos.y-(this.y+this.height/2),gameState.mousePos.x-(this.x+this.width/2));const angleDeg=angle*180/Math.PI;if(angleDeg>-45&&angleDeg<=45){this.facing='right';}else if(angleDeg>45&&angleDeg<=135){this.facing='down';}else if(angleDeg>135||angleDeg<=-135){this.facing='left';}else{this.facing='up';}},teleportToShop(){gameState.isTransitioning=true;document.getElementById('transitionOverlay').classList.add('active');setTimeout(()=>{gameState.currentScreen.x=SHOP_LOCATION.x;gameState.currentScreen.y=SHOP_LOCATION.y;this.x=TILE_SIZE*8-this.width/2;this.y=TILE_SIZE*10;this.ensureSafePosition();setTimeout(()=>{document.getElementById('transitionOverlay').classList.remove('active');gameState.isTransitioning=false;},150);},150);},
transitionScreen(dx, dy) {
    gameState.isTransitioning = true;
    document.getElementById('transitionOverlay').classList.add('active');
    gameState.projectiles = [];
    gameState.enemyProjectiles = [];
    const newScreenX = gameState.currentScreen.x + dx;
    const newScreenY = gameState.currentScreen.y + dy;
    gameState.visitedScreens[`${newScreenX}-${newScreenY}`] = true;
    setTimeout(() => {
        gameState.currentScreen.x = newScreenX;
        gameState.currentScreen.y = newScreenY;
        if (dx < 0) this.x = canvas.width - this.width - 10;
        else if (dx > 0) this.x = 10;
        else if (dy < 0) this.y = canvas.height - this.height - 10;
        else if (dy > 0) this.y = 10;
        this.ensureSafePosition();
        saveGameState();
        setTimeout(() => {
            document.getElementById('transitionOverlay').classList.remove('active');
            gameState.isTransitioning = false;
        }, 150);
    }, 150);
},
ensureSafePosition(){const cTX=Math.floor(this.x/TILE_SIZE),cTY=Math.floor(this.y/TILE_SIZE);if(!isTileSolidForMovement(cTX,cTY))return;for(let r=1;r<=5;r++){for(let dx=-r;dx<=r;dx++){for(let dy=-r;dy<=r;dy++){if(Math.abs(dx)===r||Math.abs(dy)===r){const tX=cTX+dx,tY=cTY+dy;if(tX>=1&&tX<SCREEN_WIDTH_TILES-1&&tY>=1&&tY<SCREEN_HEIGHT_TILES-1&&!isTileSolidForMovement(tX,tY)){this.x=tX*TILE_SIZE+10;this.y=tY*TILE_SIZE+10;return;}}}}}
this.x=canvas.width/2;this.y=canvas.height/2;},performAttack(type='normal'){const cX=this.x+this.width/2,cY=this.y+this.height/2;let d;if(gameState.aimScheme==='mouse'){d=Math.atan2(gameState.mousePos.y-cY,gameState.mousePos.x-cX);}else{switch(this.facing){case'up':d=-Math.PI/2;break;case'down':d=Math.PI/2;break;case'left':d=Math.PI;break;case'right':d=0;break;default:d=0;}}
gameState.projectiles.push(createProjectile(cX,cY,d,this.projectileSpeed,type));if(type==='normal'&&this.equippedHat==='warlock'&&Math.random()<0.2){gameState.projectiles.push(createProjectile(cX,cY,d-0.3,this.projectileSpeed,'normal'));gameState.projectiles.push(createProjectile(cX,cY,d+0.3,this.projectileSpeed,'normal'));}},takeDamage(){if(!this.invulnerable&&!this.isDying){this.health--;this.invulnerable=true;this.invulnerableTimer=120;updateUI();if(this.health<=0){this.isDying=true;this.deathAnimTimer=120;for(let i=0;i<50;i++){gameState.particles.push(createParticle(this.x+this.width/2,this.y+this.height/2));}}}},draw(){if(this.isDying)return;if(this.isDashing){ctx.globalAlpha=0.5;}
this.drawWizardSprite();if(this.isDashing){ctx.globalAlpha=1.0;}},
drawWizardSprite() {
    const cX = this.x + this.width / 2;
    const cY = this.y + this.height / 2;
    const t = Date.now() * 0.005;
    const pS = 3.5;
    const sPW = 12;
    const sPH = 8;
    let aO = 0;
    if (this.moving) { aO = Math.floor(Math.sin(t * 4) * 1); }
    const sX = Math.floor(cX - (sPW * pS) / 2);
    const sY = Math.floor(cY - (sPH * pS) / 2) + 6;
    if (this.invulnerable && Math.floor(this.invulnerableTimer / 10) % 2) { return; }
    let hatPattern, hatColors, hatOffsetY = -10;
    switch (this.equippedHat) {
        case 'archmage': hatPattern = [[0,0,0,0,1,1,0,0,0,0],[0,0,0,1,2,2,1,0,0,0],[0,0,1,2,3,3,2,1,0,0],[0,1,2,3,4,4,3,2,1,0],[1,2,3,4,4,4,4,3,2,1],[1,1,1,1,1,1,1,1,1,1]]; hatColors = {1:'#1e3a8a',2:'#1d4ed8',3:'#3b82f6',4:'#60a5fa'}; hatOffsetY = -14; break;
        case 'warlock': hatPattern = [[0,0,0,1,1,1,1,0,0,0],[0,0,1,2,2,2,2,1,0,0],[0,1,2,2,2,2,2,2,1,0],[1,2,2,2,2,2,2,2,2,1]]; hatColors = {1:'#171717',2:'#404040'}; hatOffsetY = -8; break;
        default: hatPattern = [[0,0,0,1,1,0,0,0,0,0],[0,0,1,2,2,1,0,0,0,0],[0,1,2,3,3,2,1,0,0,0],[1,2,3,3,3,3,2,1,0,0]]; hatColors = {1:'#2d1b69',2:'#4c1d95',3:'#7c3aed'}; break;
    }
    const bodyPattern = [[0,0,0,1,1,1,1,1,1,1,0,0],[0,0,1,2,2,2,2,2,2,2,1,0],[0,1,2,3,3,3,3,3,3,2,1,0],[1,2,3,4,4,4,4,4,4,3,2,1],[1,2,4,4,4,4,4,4,4,4,2,1],[1,2,3,4,4,4,4,4,3,3,2,1],[0,1,2,2,2,2,2,2,2,2,1,0],[0,0,1,1,1,0,0,1,1,1,0,0]];
    const bodyColors = {1:'#2d1b69',2:'#4c1d95',3:'#7c3aed',4:'#a78bfa'};
    for (let y = 0; y < bodyPattern.length; y++) { for (let x = 0; x < bodyPattern[y].length; x++) {
        const pT = bodyPattern[y][x];
        if (pT === 0) continue;
        const pX = sX + x * pS;
        const pY = sY + y * pS + (y > 2 ? aO : 0);
        let c = bodyColors[pT];
        if (this.attacking) {
            switch (pT) {
                case 1: c = '#1e1065'; break;
                case 2: c = '#3b1a8c'; break;
                case 3: c = '#6d28d9'; break;
                case 4: c = '#8b5cf6'; break;
            }
        }
        ctx.fillStyle = c;
        ctx.fillRect(pX, pY, pS, pS);
    }}
    for (let y = 0; y < hatPattern.length; y++) { for (let x = 0; x < hatPattern[y].length; x++) {
        const pT = hatPattern[y][x];
        if (pT === 0) continue;
        const hatSX = Math.floor(cX - (hatPattern[0].length * pS) / 2);
        const pX = hatSX + x * pS;
        const pY = sY + y * pS + hatOffsetY;
        ctx.fillStyle = hatColors[pT];
        ctx.fillRect(pX, pY, pS, pS);
    }}
    this.drawWizardEyes(sX, sY, pS);
    this.drawStaff(sX, sY, pS);
},
drawWizardEyes(sX,sY,pS){let lX=4,rX=7;if(this.facing==='left'){lX=3;rX=6;}
else if(this.facing==='right'){lX=5;rX=8;}
ctx.fillStyle='#fbbf24';ctx.fillRect(sX+lX*pS,sY+3*pS,pS,pS);ctx.fillRect(sX+rX*pS,sY+3*pS,pS,pS);},drawStaff(sX,sY,pS){if(this.attacking){ctx.fillStyle='#8b5cf6';const staffX=sX+11*pS,staffY=sY+3*pS;ctx.fillRect(staffX,staffY,pS,pS*6);ctx.fillStyle='#fbbf24';ctx.fillRect(staffX,staffY-pS,pS*2,pS*2);const sparkles=[{x:staffX-pS,y:staffY-pS*2},{x:staffX+pS*2,y:staffY-pS},{x:staffX-pS*2,y:staffY}];ctx.fillStyle='#fde047';sparkles.forEach(sparkle=>{ctx.fillRect(sparkle.x,sparkle.y,pS/2,pS/2);});}},};}
function createEnemy(x,y,screenX,screenY,isBoss=false,bossType=null){let enemyType=bossType;if(!isBoss){if(screenY<3)enemyType='shadow_mage';else if(screenY>4)enemyType='storm_elemental';else if(screenX<2||screenX>5)enemyType='crystal_guardian';else if(screenX===0&&screenY===0)enemyType='shadow_lord';else enemyType='stone_golem';}
const isFinalBoss=isBoss&&screenX===0&&screenY===0;const baseHealth=isFinalBoss?(gameState.difficulty==='hard'?20:10):(isBoss?(gameState.difficulty==='hard'?10:5):(enemyType==='void_sentinel'?(gameState.difficulty==='hard'?6:4):(gameState.difficulty==='hard'?4:2)));let orbitingShards=[];if(isFinalBoss){orbitingShards=[{angle:0,distance:90,size:20},{angle:Math.PI*(2/3),distance:90,size:20},{angle:Math.PI*(4/3),distance:90,size:20}];}else if(enemyType==='crystal_guardian'&&isBoss){orbitingShards=[];for(let i=0;i<4;i++){orbitingShards.push({angle:(Math.PI/2)*i,distance:60+(Math.random()-0.5)*10,size:15+(Math.random()-0.5)*5,rotation:Math.random()*Math.PI*2,rotationSpeed:(Math.random()-0.5)*0.05});}}
return{x,y,isBoss,type:enemyType,width:isBoss?100:30,height:isBoss?100:30,speed:isBoss?0.4:(enemyType==='void_sentinel'?1.2:0.8),slowed:false,slowTimer:0,direction:Math.random()*Math.PI*2,changeDirectionTimer:0,animTimer:0,animFrame:0,health:baseHealth,maxHealth:baseHealth,hit:false,hitTimer:0,magicTimer:120,bossAttackPattern:0,bossAttackCooldown:200,isEnraged:false,lightningStrikes:[],lightningOrbs:[],summonedWisps:[],scorchDamageTimer:0,orbitingShards:orbitingShards,isDead:false,spiralAttackAngle:0,teleportCooldown:240,isTeleporting:false,teleportTimer:0,teleportTargetX:0,teleportTargetY:0,update(){if(this.isDead)return;if(this.health<=0){const screen=getCurrentScreen();for(let i=0;i<20;i++){gameState.particles.push(createParticle(this.x+this.width/2,this.y+this.height/2));}
if(this.isBoss){if(this.type==='shadow_lord'){victory();}else{if(this.type==='shadow_mage')screen.items.push(createItem(this.x+this.width/2+15,this.y+this.height/2,'fire_crystal'));if(this.type==='crystal_guardian')screen.items.push(createItem(this.x+this.width/2+15,this.y+this.height/2,'ice_crystal'));if(this.type==='storm_elemental')screen.items.push(createItem(this.x+this.width/2+15,this.y+this.height/2,'storm_crystal'));const centerX=Math.floor(SCREEN_WIDTH_TILES/2);const centerY=Math.floor(SCREEN_HEIGHT_TILES/2);screen.tiles[centerY][centerX]=TILES.TELEPORT_PAD;}}else{const dropRoll=Math.random();if(dropRoll<0.1){screen.items.push(createItem(this.x,this.y,'mana_orb'));}else if(dropRoll<0.25){screen.items.push(createItem(this.x,this.y,'health'));}else{let crystalType='small_crystal';if(dropRoll>0.9){crystalType='large_crystal';}
else if(dropRoll>0.6){crystalType='medium_crystal';}
screen.items.push(createItem(this.x,this.y,crystalType));if(gameState.player.hasGoldMagnet){screen.items.push(createItem(this.x+15,this.y,'small_crystal'));}}}
this.isDead=true;return;}
if(gameState.isTransitioning||gameState.inventoryOpen||gameState.shopOpen||gameState.hatShopOpen||gameState.mapOpen)return;if(this.hitTimer>0){this.hitTimer--;if(this.hitTimer<=0)this.hit=false;}
if(this.slowTimer>0){this.slowTimer--;if(this.slowTimer<=0)this.slowed=false;}
if(this.scorchDamageTimer>0){this.scorchDamageTimer--;}
if(this.isBoss&&this.health<this.maxHealth/2&&!this.isEnraged){this.isEnraged=true;this.speed*=1.5;}
if(this.type==='shadow_mage'){for(let i=this.summonedWisps.length-1;i>=0;i--){const wisp=this.summonedWisps[i];wisp.update();if(wisp.lifetime<=0){this.summonedWisps.splice(i,1);}}}
if (this.type === 'void_sentinel') {
    if (this.isTeleporting) {
        this.teleportTimer--;
        if (this.teleportTimer <= 0) {
            this.x = this.teleportTargetX;
            this.y = this.teleportTargetY;
            this.isTeleporting = false;
            this.teleportCooldown = 180 + Math.random() * 120;
            for (let i = 0; i < 8; i++){
                const angle = (Math.PI / 4) * i;
                gameState.enemyProjectiles.push(createEnemyProjectile(this.x + this.width / 2, this.y + this.height / 2, angle, 'shadow_bolt'));
            }
            for (let i = 0; i < 20; i++) {
                gameState.particles.push(createParticle(this.x + this.width / 2, this.y + this.height / 2, '#ef4444'));
            }
        }
    } else {
        if (this.teleportCooldown > 0) {
            this.teleportCooldown--;
        } else {
            this.isTeleporting = true;
            this.teleportTimer = 60;
            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 50;
            this.teleportTargetX = gameState.player.x + Math.cos(angle) * distance;
            this.teleportTargetY = gameState.player.y + Math.sin(angle) * distance;
            this.teleportTargetX = Math.max(this.width, Math.min(canvas.width - this.width, this.teleportTargetX));
            this.teleportTargetY = Math.max(this.height, Math.min(canvas.height - this.height, this.teleportTargetY));
            for (let i = 0; i < 20; i++) {
                gameState.particles.push(createParticle(this.x + this.width / 2, this.y + this.height / 2, '#4c1d95'));
            }
        }
    }
    return;
}
this.animTimer++;if(this.animTimer>12){this.animFrame=(this.animFrame+1)%4;this.animTimer=0;}
this.changeDirectionTimer++;if(this.isBoss||this.type==='stone_golem'){const centerX=this.x+this.width/2;const centerY=this.y+this.height/2;if(this.changeDirectionTimer>60){this.direction=Math.atan2(gameState.player.y-centerY,gameState.player.x-centerX)+(Math.random()-0.5)*0.5;this.changeDirectionTimer=0;}
if(this.isBoss){this.bossAttackCooldown--;if(this.bossAttackCooldown<=0){if(this.type==='storm_elemental'){if(this.isEnraged){this.bossAttackPattern=(this.bossAttackPattern+1)%3;this.bossAttackCooldown=120;switch(this.bossAttackPattern){case 0:const angleToPlayer=Math.atan2(gameState.player.y-centerY,gameState.player.x-centerX);gameState.enemyProjectiles.push(createEnemyProjectile(centerX,centerY,angleToPlayer,'storm_primary'));break;case 1:for(let i=0;i<5;i++){this.lightningStrikes.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,timer:60});}
break;case 2:for(let i=0;i<4;i++){const angle=(Math.PI/2)*i+(Math.random()*0.5);this.lightningOrbs.push({x:centerX,y:centerY,vx:Math.cos(angle)*1.5,vy:Math.sin(angle)*1.5,lifetime:300,radius:15});}
break;}}else{this.bossAttackPattern=(this.bossAttackPattern+1)%2;this.bossAttackCooldown=200;switch(this.bossAttackPattern){case 0:const angleToPlayer=Math.atan2(gameState.player.y-centerY,gameState.player.x-centerX);gameState.enemyProjectiles.push(createEnemyProjectile(centerX,centerY,angleToPlayer,'storm_primary'));break;case 1:const strikeCount=3;for(let i=0;i<strikeCount;i++){this.lightningStrikes.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,timer:60});}
break;}}}else{switch(this.type){case'shadow_mage':this.bossAttackPattern=(this.bossAttackPattern+1)%(this.isEnraged?4:2);const attackCooldown=this.isEnraged?100:160;this.bossAttackCooldown=attackCooldown;switch(this.bossAttackPattern){case 0:const shadowAngleToPlayer=Math.atan2(gameState.player.y-centerY,gameState.player.x-centerX);for(let i=-1;i<=1;i++){gameState.enemyProjectiles.push(createEnemyProjectile(centerX,centerY,shadowAngleToPlayer+i*0.3,'fireball'));}
break;case 1:const novaShots=this.isEnraged?16:12;for(let i=0;i<novaShots;i++){const angle=(Math.PI*2/novaShots)*i;gameState.enemyProjectiles.push(createEnemyProjectile(centerX,centerY,angle,'fireball'));}
break;case 2:if(this.isEnraged&&this.summonedWisps.length<4){this.summonedWisps.push(createWisp(this.x,this.y));this.summonedWisps.push(createWisp(this.x,this.y));}
break;case 3:if(this.isEnraged){const screen=getCurrentScreen();for(let i=0;i<3;i++){const offsetX=(Math.random()-0.5)*150;const offsetY=(Math.random()-0.5)*150;screen.scorchPatches.push(createScorchPatch(gameState.player.x+offsetX,gameState.player.y+offsetY));}}
break;}
break;case'crystal_guardian':this.bossAttackPattern=(this.bossAttackPattern+1)%(this.isEnraged?4:3);this.bossAttackCooldown=(this.isEnraged?90:180);switch(this.bossAttackPattern){case 0:for(let i=0;i<(this.isEnraged?16:10);i++){const angle=(Math.PI*2/(this.isEnraged?16:10))*i;gameState.enemyProjectiles.push(createEnemyProjectile(centerX,centerY,angle,'crystal_guardian'));}
break;case 1:for(let i=0;i<5;i++){setTimeout(()=>{const angleToPlayer=Math.atan2(gameState.player.y-centerY,gameState.player.x-centerX);gameState.enemyProjectiles.push(createEnemyProjectile(centerX,centerY,angleToPlayer,'crystal_shard_fast'));},i*100);}
break;case 2:const p=gameState.player;const prisonPoints=[{x:p.x,y:p.y-TILE_SIZE},{x:p.x,y:p.y+TILE_SIZE},{x:p.x-TILE_SIZE,y:p.y},{x:p.x+TILE_SIZE,y:p.y}];prisonPoints.forEach(point=>{getCurrentScreen().crystalPillars.push(createCrystalPillar(point.x,point.y));});break;case 3:if(this.isEnraged){for(let i=0;i<20;i++){setTimeout(()=>{this.spiralAttackAngle+=0.1;gameState.enemyProjectiles.push(createEnemyProjectile(centerX,centerY,this.spiralAttackAngle,'crystal_shard'));},i*20);}}
break;}
break;case'shadow_lord':this.bossAttackPattern=(this.bossAttackPattern+1)%3;switch(this.bossAttackPattern){case 0:const shadowAngle=Math.atan2(gameState.player.y-centerY,gameState.player.x-centerX);for(let i=-1;i<=1;i++){gameState.enemyProjectiles.push(createEnemyProjectile(centerX,centerY,shadowAngle+i*0.4,'shadow_bolt'));}
break;case 1:for(let i=0;i<12;i++){const angle=(Math.PI*2/12)*i;gameState.enemyProjectiles.push(createEnemyProjectile(centerX,centerY,angle,'crystal_shard'));}
break;case 2:gameState.enemyProjectiles.push(createEnemyProjectile(gameState.player.x-30,gameState.player.y-30,0,'storm_strike'));gameState.enemyProjectiles.push(createEnemyProjectile(gameState.player.x+30,gameState.player.y+30,0,'storm_strike'));break;}
this.bossAttackCooldown=150;break;}}}}}else{if(this.changeDirectionTimer>240){this.direction=Math.random()*Math.PI*2;this.changeDirectionTimer=0;}}
for(let i=this.lightningStrikes.length-1;i>=0;i--){const strike=this.lightningStrikes[i];strike.timer--;if(strike.timer<=0){const dx=strike.x-(gameState.player.x+gameState.player.width/2);const dy=strike.y-(gameState.player.y+gameState.player.height/2);if(Math.sqrt(dx*dx+dy*dy)<TILE_SIZE){gameState.player.takeDamage();}
this.lightningStrikes.splice(i,1);}}
for(let i=this.lightningOrbs.length-1;i>=0;i--){const orb=this.lightningOrbs[i];orb.x+=orb.vx;orb.y+=orb.vy;orb.lifetime--;const dx=orb.x-(gameState.player.x+gameState.player.width/2);const dy=orb.y-(gameState.player.y+gameState.player.height/2);if(Math.sqrt(dx*dx+dy*dy)<orb.radius+(gameState.player.width/2)){gameState.player.takeDamage();orb.lifetime=0;}
if(orb.lifetime<=0){this.lightningOrbs.splice(i,1);}}
this.orbitingShards.forEach(shard=>{if(this.type==='crystal_guardian'){const orbitSpeed=this.isEnraged?0.05:0.02;shard.angle+=orbitSpeed;shard.rotation+=shard.rotationSpeed*(this.isEnraged?2:1);}else{shard.angle+=0.02;}});const currentSpeed=this.slowed?this.speed*0.5:this.speed;const newX=this.x+Math.cos(this.direction)*currentSpeed;const newY=this.y+Math.sin(this.direction)*currentSpeed;const lT=Math.floor(newX/TILE_SIZE);const rT=Math.floor((newX+this.width)/TILE_SIZE);const tT=Math.floor(newY/TILE_SIZE);const bT=Math.floor((newY+this.height)/TILE_SIZE);const pTileX=Math.floor(this.x/TILE_SIZE);const pTileY=Math.floor(this.y/TILE_SIZE);const isSolidForEnemy=(tx,ty)=>{if(tx<0||tx>=SCREEN_WIDTH_TILES||ty<0||ty>=SCREEN_HEIGHT_TILES)return true;const tile=getCurrentScreen().tiles[ty][tx];return SOLID_TILES_MOVEMENT.includes(tile)||tile===TILES.LAVA||tile===TILES.POISON_SPIKES;};let canMoveX=true;if(isSolidForEnemy(lT,pTileY)||isSolidForEnemy(rT,pTileY)||isSolidForEnemy(lT,bT)||isSolidForEnemy(rT,bT)){canMoveX=false;}
let canMoveY=true;if(isSolidForEnemy(pTileX,tT)||isSolidForEnemy(pTileX,bT)||isSolidForEnemy(rT,tT)||isSolidForEnemy(rT,bT)){canMoveY=false;}
if(canMoveX)this.x=newX;if(canMoveY)this.y=newY;if(!canMoveX||!canMoveY){if(!this.isBoss)this.direction=Math.random()*Math.PI*2;}
if(Math.sqrt(Math.pow(this.x+this.width/2-(gameState.player.x+gameState.player.width/2),2)+Math.pow(this.y+this.height/2-(gameState.player.y+gameState.player.height/2),2))<(this.width/2+gameState.player.width/2)){gameState.player.takeDamage();}},draw(){if(this.hit&&Math.floor(this.hitTimer/4)%2===0)return;const centerX=this.x+this.width/2,centerY=this.y+this.height/2;if(this.isBoss&&this.type!=='shadow_mage'&&this.type!=='crystal_guardian'){const radius=this.width*1.2;const glowAlpha=(Math.sin(Date.now()*0.003)+1)*0.2;const glowColor=this.isEnraged?`rgba(253,224,71,${glowAlpha})`:`rgba(153,102,255,${glowAlpha})`;const gradient=ctx.createRadialGradient(centerX,centerY,radius/4,centerX,centerY,radius);gradient.addColorStop(0,glowColor);gradient.addColorStop(1,`rgba(102,51,204,0)`);ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(centerX,centerY,radius,0,2*Math.PI);ctx.fill();this.orbitingShards.forEach(shard=>{const shardX=centerX+shard.distance*Math.cos(shard.angle);const shardY=centerY+shard.distance*Math.sin(shard.angle);const pS=3;const time=Date.now()*0.005;const pulse=Math.sin(time*2+shard.angle)*0.5+0.5;const colors={1:'#1f2937',2:'#4c1d95',3:'#a78bfa',4:'#c4b5fd'};const pattern=[[0,0,1,1,0,0],[0,1,2,2,1,0],[1,2,3,3,2,1],[1,2,3,3,2,1],[0,1,2,2,1,0],[0,0,1,1,0,0]];const pW=pattern[0].length;const pH=pattern.length;ctx.save();ctx.translate(shardX,shardY);ctx.rotate(shard.angle+time*0.5);const sX=-(pW*pS)/2;const sY=-(pH*pS)/2;for(let y=0;y<pH;y++){for(let x=0;x<pW;x++){const pT=pattern[y][x];if(pT===0)continue;let color=colors[pT];if(pT===3&&pulse>0.7){color=colors[4];}
ctx.fillStyle=color;ctx.fillRect(sX+x*pS,sY+y*pS,pS,pS);}}
ctx.restore();});}
if(this.type==='void_sentinel'&&this.isTeleporting){const progress=(60-this.teleportTimer)/60;ctx.strokeStyle=`rgba(239, 68, 68, ${progress})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(this.teleportTargetX+this.width/2,this.teleportTargetY+this.height/2,this.width/2*progress,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=this.teleportTimer/60;}
if(this.slowed){ctx.fillStyle='rgba(173, 216, 230, 0.5)';ctx.beginPath();ctx.arc(centerX,centerY,this.width/2+3,0,Math.PI*2);ctx.fill();}
this.lightningStrikes.forEach(strike=>{const radius=(60-strike.timer)/60*(TILE_SIZE/2);ctx.fillStyle=`rgba(253,224,71,${0.1+(strike.timer/60)*0.4})`;ctx.beginPath();ctx.arc(strike.x,strike.y,radius,0,Math.PI*2);ctx.fill();if(strike.timer<10){const pS=4;const colors={1:'#facc15',2:'#fde047',3:'#fef9c3'};const pattern=[[0,1,0],[1,2,1],[0,2,0],[0,1,0],[1,3,1],[0,2,0],[0,1,0],[1,2,1],[0,1,0]];for(let y=0;y<pattern.length;y++){for(let x=0;x<pattern[y].length;x++){if(pattern[y][x]>0){ctx.fillStyle=colors[pattern[y][x]];ctx.fillRect(strike.x-(pS*1.5)+x*pS,strike.y-(pS*4.5)+y*pS,pS,pS);}}}}});this.lightningOrbs.forEach(orb=>{const pS=3;const colors={1:'#facc15',2:'#fde047',3:'#fef9c3'};const pulseFrame=Math.floor(Date.now()/200)%2;const pattern=pulseFrame===0?[[0,1,1,0],[1,2,2,1],[1,2,3,2,1],[1,2,2,1],[0,1,1,0]]:[[0,2,2,0],[2,3,3,2],[2,3,1,3,2],[2,3,3,2],[0,2,2,0]];const pW=pattern[0].length,pH=pattern.length;const sX=orb.x-(pW*pS)/2;const sY=orb.y-(pH*pS)/2;for(let y=0;y<pH;y++){for(let x=0;x<pattern[y].length;x++){const pT=pattern[y][x];if(pT>0){ctx.fillStyle=colors[pT];ctx.fillRect(sX+x*pS,sY+y*pS,pS,pS);}}}});if(this.type==='shadow_mage'){this.summonedWisps.forEach(wisp=>wisp.draw());}
switch(this.type){case'stone_golem':this.drawStoneGolem();break;case'shadow_mage':this.drawShadowMage();break;case'crystal_guardian':this.drawCrystalGuardian();break;case'storm_elemental':this.drawStormElemental();break;case'shadow_lord':this.drawShadowLord();break;case'void_sentinel':this.drawVoidSentinel();break;default:this.drawStoneGolem();}
if(this.type==='void_sentinel'&&this.isTeleporting){ctx.globalAlpha=1;}},drawPixelPattern(pattern,centerX,centerY,pixelSize,colorMap){const pW=pattern[0].length,pH=pattern.length,sX=centerX-(pW*pixelSize)/2,sY=centerY-(pH*pixelSize)/2;for(let y=0;y<pH;y++){for(let x=0;x<pW;x++){const pT=pattern[y][x];if(pT===0)continue;const animOffset=(this.type==='storm_elemental'||this.type==='crystal_guardian'||this.type==='stone_golem')?0:Math.sin(this.animTimer*0.03+y*0.2)*0.3;ctx.fillStyle=colorMap[pT];ctx.fillRect(Math.floor(sX+x*pixelSize),Math.floor(sY+y*pixelSize+animOffset),pixelSize,pixelSize);}}},
drawStoneGolem() {
    const pS = this.isBoss ? 5 : 4;
    const cX = this.x + this.width / 2;
    const cY = this.y + this.height / 2;
    const time = Date.now() * 0.005;
    const armSwing = Math.sin(time * 3) * 4;

    let colors;
    const biome = getBiomeForScreen(gameState.currentScreen.x, gameState.currentScreen.y);

    if (biome === 'fire') {
        colors = { 1: '#440a0a', 2: '#8c2f0a', 3: '#d94f1f', 4: '#f28e13', 5: '#ffc640' };
    } else {
        colors = { 1: '#2d1b69', 2: '#4c1d95', 3: '#7c3aed', 4: '#ff00ff', 5: '#ff99ff' };
    }

    const bodyPattern = [[0, 0, 1, 1, 1, 1, 0, 0], [0, 1, 2, 2, 2, 2, 1, 0], [1, 2, 3, 3, 3, 3, 2, 1], [1, 2, 3, 4, 5, 3, 2, 1], [1, 2, 3, 3, 3, 3, 2, 1], [0, 1, 2, 2, 2, 2, 1, 0], [0, 0, 1, 1, 1, 1, 0, 0]];
    this.drawPixelPattern(bodyPattern, cX, cY, pS, colors);
    const eyeFrame = Math.floor(time * 2) % 8;
    if (eyeFrame < 7) {
        const eyeSize = (eyeFrame % 2 === 0) ? pS * 1.5 : pS;
        ctx.fillStyle = colors[5];
        ctx.fillRect(cX - eyeSize / 2, cY - eyeSize / 2, eyeSize, eyeSize);
    }
    if (eyeFrame < 5) {
        ctx.fillStyle = colors[4];
        ctx.fillRect(cX - pS / 2, cY - pS / 2, pS, pS);
    }
    const leftArmPattern = [[0, 1, 1], [1, 2, 0], [0, 2, 2], [0, 0, 2]];
    const leftArmX = cX - (bodyPattern[0].length / 2 + leftArmPattern[0].length - 2) * pS;
    const leftArmY = cY - (leftArmPattern.length / 2) * pS;
    this.drawPixelPattern(leftArmPattern, leftArmX + armSwing, leftArmY - armSwing / 3, pS, colors);
    const rightArmPattern = [[1, 1, 0], [0, 2, 1], [2, 2, 0], [2, 0, 0]];
    const rightArmX = cX + (bodyPattern[0].length / 2 + rightArmPattern[0].length - 2) * pS;
    const rightArmY = cY - (rightArmPattern.length / 2) * pS;
    this.drawPixelPattern(rightArmPattern, rightArmX - armSwing, rightArmY + armSwing / 3, pS, colors);
    for (let i = 0; i < 3; i++) {
        const angle = time * 0.7 + i * (Math.PI * 2 / 3);
        const radius = this.width / 2 - 5 + Math.sin(time * 1.5 + i) * 3;
        const pX = cX + Math.cos(angle) * radius;
        const pY = cY + Math.sin(angle) * radius;
        const size = 1 + Math.random() * 1.5;
        const alpha = 0.2 + Math.random() * 0.3;
        const particleColor = biome === 'fire' ? `rgba(255, 100, 50, ${alpha})` : `rgba(255,0,255,${alpha})`;
        ctx.fillStyle = particleColor;
        ctx.fillRect(pX - size / 2, pY - size / 2, size, size);
    }
},
drawShadowMage(){const pS=this.isBoss?4:3;const cX=this.x+this.width/2,cY=this.y+this.height/2;const time=Date.now()*0.01;for(let i=0;i<40;i++){const angle=time*0.5+i*(Math.PI*2/40);const radius=20+Math.sin(time+i)*4;const flameX=cX+Math.cos(angle)*radius;const flameY=cY+Math.sin(angle)*radius-Math.abs(Math.sin(time*0.8+i))*20;const size=3+Math.random()*5;const life=Math.sin(time*2+i)*0.5+0.5;if(life>0.3){let color;const colorPicker=Math.random();if(colorPicker<0.3)color=`rgba(220,38,38,${life*0.8})`;else if(colorPicker<0.7)color=`rgba(249,115,22,${life*0.8})`;else color=`rgba(250,204,21,${life*0.8})`;ctx.fillStyle=color;ctx.fillRect(flameX-size/2,flameY-size/2,size,size);}}
const skullColors={1:'#18181b',2:'#a1a1aa',3:'#e4e4e7',4:'#f4f4f5',5:'#ef4444'};const skullPattern=[[0,0,0,3,4,4,3,0,0,0],[0,0,3,4,4,4,4,3,0,0],[0,3,4,2,4,4,2,4,3,0],[0,3,4,1,4,4,1,4,3,0],[3,4,4,4,4,4,4,4,4,3],[3,2,2,3,3,3,3,2,2,3],[0,3,2,3,2,2,3,2,3,0],[0,0,3,2,1,1,2,3,0,0]];const attackSkullPattern=[[0,0,0,3,4,4,3,0,0,0],[0,0,3,4,4,4,4,3,0,0],[0,3,4,5,4,4,5,4,3,0],[0,3,4,5,4,4,5,4,3,0],[3,4,4,4,4,4,4,4,4,3],[3,2,2,3,3,3,3,2,2,3],[0,3,2,3,2,2,3,2,3,0],[0,0,3,2,1,1,2,3,0,0]];let patternToDraw=(this.isBoss&&this.bossAttackCooldown>0&&this.bossAttackCooldown<60)?attackSkullPattern:skullPattern;this.drawPixelPattern(patternToDraw,cX,cY,pS,skullColors);},drawCrystalGuardian(){const pS=this.isBoss?4:3;const cX=this.x+this.width/2;const cY=this.y+this.height/2;const time=Date.now()*0.002;const colors={1:'#0f172a',2:'#1e293b',3:'#3b82f6',4:'#60a5fa',5:'#dbeafe',6:'#ffffff'};const enragedColors={1:'#4c1d95',2:'#6d28d9',3:'#8b5cf6',4:'#c4b5fd',5:'#ede9fe',6:'#ffffff'};const colorsToUse=this.isEnraged?enragedColors:colors;const pulse=Math.sin(time*(this.isEnraged?4:2));const glowRadius=(this.width/2)*(1+pulse*0.1);const glowAlpha=0.3+pulse*0.2;const gradient=ctx.createRadialGradient(cX,cY,0,cX,cY,glowRadius);gradient.addColorStop(0,`rgba(${this.isEnraged?'196, 181, 253':'96, 165, 250'},${glowAlpha})`);gradient.addColorStop(1,`rgba(${this.isEnraged?'196, 181, 253':'96, 165, 250'},0)`);ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(cX,cY,glowRadius,0,Math.PI*2);ctx.fill();const mainBodyPattern=[[0,0,3,4,4,3,0,0],[0,3,2,5,5,2,3,0],[3,2,1,5,5,1,2,3],[4,5,5,1,1,5,5,4],[4,5,5,1,1,5,5,4],[3,2,1,5,5,1,2,3],[0,3,2,5,5,2,3,0],[0,0,3,4,4,3,0,0]];const attackPattern=[[0,0,3,6,6,3,0,0],[0,3,2,6,6,2,3,0],[3,2,1,5,5,1,2,3],[6,5,5,1,1,5,5,6],[6,5,5,1,1,5,5,6],[3,2,1,5,5,1,2,3],[0,3,2,6,6,2,3,0],[0,0,3,6,6,3,0,0]];let patternToDraw=(this.isBoss&&this.bossAttackCooldown>0&&this.bossAttackCooldown<60)?attackPattern:mainBodyPattern;const bob=Math.sin(time*1.5)*4;this.drawPixelPattern(patternToDraw,cX,cY+bob,pS,colorsToUse);this.orbitingShards.forEach(shard=>{const shardX=cX+shard.distance*Math.cos(shard.angle);const shardY=cY+bob+shard.distance*Math.sin(shard.angle);const shardPattern=[[0,4,0],[4,3,4],[0,4,0]];ctx.save();ctx.translate(shardX,shardY);ctx.rotate(shard.rotation);const shardPulse=Math.sin(time*3+shard.angle)*0.5+0.5;const shardSize=pS*(0.8+shardPulse*0.4);this.drawPixelPattern(shardPattern,0,0,shardSize,colorsToUse);ctx.restore();if(Math.random()>0.95){gameState.particles.push(createParticle(shardX,shardY,colorsToUse[4]));}});},drawStormElemental(){const pS=this.isBoss?4:2.5;const cX=this.x+this.width/2;const cY=this.y+this.height/2;const blueColors={1:'#4a4a4a',2:'#6b6b6b',3:'#8c8c8c',4:'#005fec',5:'#00a8ff',6:'#a8ffff',7:'#a8ffff'};const yellowColors={1:'#4a4a4a',2:'#6b6b6b',3:'#8c8c8c',4:'#facc15',5:'#fde047',6:'#fef9c3',7:'#fde047'};const redColors={1:'#4a4a4a',2:'#6b6b6b',3:'#8c8c8c',4:'#991b1b',5:'#dc2626',6:'#fca5a5',7:'#dc2626'};const idlePattern1=[[0,0,0,0,0,0,0,0,4,5,6,5,4,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,4,5,2,2,2,2,2,5,4,0,0,0,0,0,0],[0,0,0,0,4,5,3,2,2,2,2,2,2,2,3,5,4,0,0,0,0],[0,0,4,5,6,2,2,1,2,7,2,7,2,1,2,2,6,5,4,0,0],[0,4,5,6,5,3,2,1,2,2,2,2,2,1,2,3,5,6,5,4,0],[4,5,6,0,0,2,2,1,1,1,1,1,1,1,2,2,0,0,6,5,4],[0,4,5,0,0,3,2,2,1,1,1,1,1,2,2,3,0,0,5,4,0],[0,0,0,4,5,2,1,2,2,1,1,1,2,2,1,2,5,4,0,0,0],[0,0,0,0,0,4,5,2,1,2,2,2,1,2,5,4,0,0,0,0,0],[0,0,0,0,0,0,0,2,2,1,1,1,2,2,0,0,0,0,0,0,0],[0,0,0,0,0,0,2,2,1,0,0,0,1,2,2,0,0,0,0,0,0],[0,0,0,0,0,2,2,1,0,0,0,0,0,1,2,2,0,0,0,0,0],[0,0,0,0,0,3,2,1,0,0,0,0,0,1,2,3,0,0,0,0,0]];const idlePattern2=[[0,0,0,0,0,0,0,4,5,6,5,4,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,4,5,2,2,2,2,2,5,4,0,0,0,0,0,0],[0,0,0,0,0,4,5,3,2,2,2,2,2,3,5,4,0,0,0,0],[0,0,4,5,6,2,2,1,2,7,2,7,2,1,2,2,6,5,4,0,0],[0,4,5,6,5,3,2,1,2,2,2,2,2,1,2,3,5,6,5,4,0],[4,5,6,0,0,2,2,1,1,1,1,1,1,1,2,2,0,0,6,5,4],[5,6,0,0,0,3,2,2,1,1,1,1,1,2,2,3,0,0,0,6,5],[4,5,0,0,0,2,1,2,2,1,1,1,2,2,1,2,0,0,0,5,4],[0,4,5,0,0,4,5,2,1,2,2,2,1,2,5,4,0,0,4,5,0],[0,0,4,5,0,0,0,2,2,1,1,1,2,2,0,0,0,0,5,4,0],[0,0,0,0,0,0,2,2,1,0,0,0,1,2,2,0,0,0,0,0,0],[0,0,0,0,0,2,2,1,0,0,0,0,0,1,2,2,0,0,0,0,0],[0,0,0,0,0,3,2,1,0,0,0,0,0,1,2,3,0,0,0,0,0]];const attackPattern=[[0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,3,2,1,1,1,2,3,0,0,0,0,0,0,0],[0,0,0,0,0,2,2,1,2,7,2,7,2,1,2,2,0,0,0,0,0],[0,0,0,0,3,2,1,2,2,2,2,2,2,2,1,2,3,0,0,0,0],[0,0,0,3,2,1,2,1,1,1,1,1,1,1,2,1,2,3,0,0,0],[0,0,2,1,2,4,5,1,1,1,1,1,1,1,5,4,2,1,2,0,0],[0,0,3,2,4,5,6,5,1,1,1,1,1,5,6,5,4,2,3,0,0],[0,0,0,0,3,2,5,6,5,4,1,4,5,6,5,2,3,0,0,0,0],[0,0,0,0,0,0,4,5,2,2,1,2,2,5,4,0,0,0,0,0,0],[0,0,0,0,0,0,0,2,2,1,1,1,2,2,0,0,0,0,0,0,0],[0,0,0,0,0,0,2,2,1,0,0,0,1,2,2,0,0,0,0,0,0],[0,0,0,0,0,2,2,1,0,0,0,0,0,1,2,2,0,0,0,0,0],[0,0,0,0,0,3,2,1,0,0,0,0,0,1,2,3,0,0,0,0,0]];const damagedPattern=[[0,0,4,5,4,0,0,0,0,2,2,2,0,0,0,0,4,5,4,0,0],[0,0,0,0,0,0,0,3,2,1,1,1,2,3,0,0,0,0,0,0,0],[0,5,4,0,0,2,2,1,2,7,2,7,2,1,2,2,0,0,4,5,0],[0,0,0,0,3,2,1,2,2,2,2,2,2,2,1,2,3,0,0,0,0],[0,0,0,3,2,1,2,1,1,1,1,1,1,1,2,1,2,3,0,0,0],[4,5,2,1,2,1,1,1,1,1,1,1,1,1,1,1,2,1,2,5,4],[5,6,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2,3,6,5],[0,0,0,0,3,2,1,1,1,1,1,1,1,1,1,2,3,0,0,0,0],[0,0,0,0,0,0,4,5,2,2,1,2,2,5,4,0,0,0,0,0,0],[0,0,0,0,0,0,0,2,2,1,1,1,2,2,0,0,0,0,0,0,0],[0,0,0,0,0,0,2,2,1,0,0,0,1,2,2,0,0,0,0,0,0],[0,0,0,0,0,2,2,1,0,0,0,0,0,1,2,2,0,0,0,0,0],[0,0,0,0,0,3,2,1,0,0,0,0,0,1,2,3,0,0,0,0,0]];const idlePatterns=[idlePattern1,idlePattern2];let patternToDraw,colorsToUse;if(this.hit&&this.hitTimer>0){patternToDraw=damagedPattern;colorsToUse=redColors;}else if(this.isBoss&&this.bossAttackCooldown>0&&this.bossAttackCooldown<60&&!this.isEnraged){patternToDraw=attackPattern;colorsToUse=yellowColors;}else{const currentFrame=Math.floor(this.animFrame/2)%idlePatterns.length;patternToDraw=idlePatterns[currentFrame];colorsToUse=this.isEnraged?yellowColors:blueColors;}
this.drawPixelPattern(patternToDraw,cX,cY,pS,colorsToUse);},drawVoidSentinel(){const pS=4;const cX=this.x+this.width/2;const cY=this.y+this.height/2;const time=Date.now()*0.005;for(let i=0;i<5;i++){const angle=time*0.8+i*(Math.PI*2/5);const radius=this.width/2+Math.sin(time+i)*5;const pX=cX+Math.cos(angle)*radius;const pY=cY+Math.sin(angle)*radius;const size=1+Math.random()*2;const alpha=0.2+Math.random()*0.3;ctx.fillStyle=`rgba(124, 58, 237, ${alpha})`;ctx.fillRect(pX-size/2,pY-size/2,size,size);}
const colors={1:'#111827',2:'#1f2937',3:'#4c1d95',4:'#ef4444'};const bob=Math.sin(time)*3;const pattern=[[0,0,1,1,1,1,1,0,0],[0,1,2,2,2,2,2,1,0],[1,2,2,3,3,3,2,2,1],[1,2,3,4,3,4,3,2,1],[1,2,2,3,3,3,2,2,1],[0,1,2,2,2,2,2,1,0],[0,0,1,1,1,1,1,0,0],];this.drawPixelPattern(pattern,cX,cY+bob,pS,colors);},drawShadowLord(){const pS=this.isBoss?4:3;const cX=this.x+this.width/2;const cY=this.y+this.height/2;const time=Date.now()*0.005;const auraRadius=(this.width/2)*(1.4+Math.sin(time)*0.1);const auraGradient=ctx.createRadialGradient(cX,cY,0,cX,cY,auraRadius);auraGradient.addColorStop(0,`rgba(76,29,149,${0.3+Math.sin(time*1.5)*0.2})`);auraGradient.addColorStop(0.7,`rgba(76,29,149,${0.1+Math.sin(time*1.5)*0.1})`);auraGradient.addColorStop(1,'rgba(76, 29, 149, 0)');ctx.fillStyle=auraGradient;ctx.beginPath();ctx.arc(cX,cY,auraRadius,0,Math.PI*2);ctx.fill();const pattern=[[0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],[0,0,0,0,1,2,2,2,2,2,2,1,0,0,0,0],[0,0,0,1,2,3,3,3,3,3,2,1,0,0,0,0],[0,0,1,2,3,4,4,4,4,3,2,1,0,0,0,0],[0,1,2,3,4,5,5,5,5,4,3,2,1,0,0,0],[0,1,2,3,4,5,6,6,5,4,3,2,1,0,0,0],[1,2,3,4,5,6,7,7,6,5,4,3,2,1,0,0],[1,2,3,4,5,6,6,6,6,5,4,3,2,1,0,0],[0,1,2,3,4,5,5,5,5,4,3,2,1,0,0,0],[0,0,1,2,3,4,4,4,4,3,2,1,0,0,0,0],[0,0,0,1,2,3,3,3,3,2,1,0,0,0,0,0],[0,0,0,0,1,2,2,2,2,1,0,0,0,0,0,0],[0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0]];const eyeFrame=Math.floor(time*2)%4;let eyeColor='#fca5a5';if(eyeFrame===3){eyeColor='#f87171';}
const colors={1:'#020617',2:'#111827',3:'#1f2937',4:'#374151',5:'#4c1d95',6:eyeColor,7:'#7c3aed'};const bob=Math.sin(time*0.8)*4;this.drawPixelPattern(pattern,cX,cY+bob,pS,colors);for(let i=0;i<5;i++){const angle=time*0.5+i*(Math.PI*2/5);const radius=this.width/2+10+Math.sin(time+i)*5;const pX=cX+Math.cos(angle)*radius;const pY=cY+bob+Math.sin(angle)*radius;const size=2+Math.random()*2;const alpha=0.3+Math.random()*0.4;ctx.fillStyle=`rgba(12,10,9,${alpha})`;ctx.fillRect(pX-size/2,pY-size/2,size,size);}}};}
function createWisp(x,y){return{x:x+(Math.random()-0.5)*50,y:y+(Math.random()-0.5)*50,width:15,height:15,speed:1.5,lifetime:300,update(){this.lifetime--;const angleToPlayer=Math.atan2(gameState.player.y-this.y,gameState.player.x-this.x);this.x+=Math.cos(angleToPlayer)*this.speed;this.y+=Math.sin(angleToPlayer)*this.speed;const dx=this.x-(gameState.player.x+gameState.player.width/2);const dy=this.y-(gameState.player.y+gameState.player.height/2);if(Math.sqrt(dx*dx+dy*dy)<gameState.player.width/2){gameState.player.takeDamage();this.lifetime=0;}},draw(){const time=Date.now()*0.02;for(let i=0;i<5;i++){const angle=time+i*(Math.PI*2/5);const radius=5+Math.sin(time+i)*2;const pX=this.x+Math.cos(angle)*radius;const pY=this.y+Math.sin(angle)*radius;const size=2+Math.random()*3;let color;const colorPicker=Math.random();if(colorPicker<0.3)color='#dc2626';else if(colorPicker<0.7)color='#f97316';else color='#facc15';ctx.fillStyle=color;ctx.fillRect(pX-size/2,pY-size/2,size,size);}}};}
function createExplosion(x,y){for(let i=0;i<40;i++){const angle=Math.random()*Math.PI*2;const speed=Math.random()*3+1;const particle=createParticle(x,y,'#ef4444');particle.vx=Math.cos(angle)*speed;particle.vy=Math.sin(angle)*speed;particle.lifetime=20+Math.random()*20;particle.color=`rgba(255,${Math.floor(Math.random()*100)+100},0,0.8)`;gameState.particles.push(particle);}
const screen=getCurrentScreen();const explosionRadius=75;const explosionDamage=gameState.player.hasPowerBolt?1.5:1;screen.enemies.forEach(enemy=>{const dx=(enemy.x+enemy.width/2)-x;const dy=(enemy.y+enemy.height/2)-y;const distance=Math.sqrt(dx*dx+dy*dy);if(distance<explosionRadius){enemy.health-=explosionDamage;enemy.hit=true;enemy.hitTimer=20;}});}
function createProjectile(x,y,direction,speed,type='normal'){const projectile={x,y,width:8,height:8,direction,speed,lifetime:180,startX:x,startY:y,type,maxDistance:TILE_SIZE*((gameState.player.hasPowerBolt?3:2)+(gameState.player.equippedHat==='archmage'?2:0)),handleTermination(){this.lifetime=0;if(gameState.player.hasFireCrystal||this.type==='fireball'){createExplosion(this.x,this.y);}},update(){if(gameState.inventoryOpen||gameState.shopOpen||gameState.hatShopOpen||gameState.mapOpen)return;this.x+=Math.cos(this.direction)*this.speed;this.y+=Math.sin(this.direction)*this.speed;this.lifetime--;if(Math.sqrt(Math.pow(this.x-this.startX,2)+Math.pow(this.y-this.startY,2))>=this.maxDistance){this.handleTermination();return;}
const screen=getCurrentScreen();for(let i=screen.enemies.length-1;i>=0;i--){const enemy=screen.enemies[i];const dx=this.x-(enemy.x+enemy.width/2);const dy=this.y-(enemy.y+enemy.height/2);if(Math.sqrt(dx*dx+dy*dy)<enemy.width/1.5){this.handleTermination();let damage=(gameState.player.hasPowerBolt?2:1);if(this.type==='fireball'){damage=2;}
enemy.health-=damage;enemy.hit=true;enemy.hitTimer=20;if(gameState.player.hasLifeSteal&&Math.random()<0.1){if(gameState.player.health<gameState.player.maxHealth){gameState.player.health++;updateUI();}}
if(gameState.player.hasIceCrystal){enemy.slowed=true;enemy.slowTimer=120;}
if(gameState.player.hasStormCrystal){const knockbackForce=15;const knockbackX=Math.cos(this.direction)*knockbackForce;const knockbackY=Math.sin(this.direction)*knockbackForce;const newEnemyX=enemy.x+knockbackX;const newEnemyY=enemy.y+knockbackY;const leftTile=Math.floor(newEnemyX/TILE_SIZE);const rightTile=Math.floor((newEnemyX+enemy.width)/TILE_SIZE);const topTile=Math.floor(newEnemyY/TILE_SIZE);const bottomTile=Math.floor((newEnemyY+enemy.height)/TILE_SIZE);const isSolid=tx=>ty=>{if(tx<0||tx>=SCREEN_WIDTH_TILES||ty<0||ty>=SCREEN_HEIGHT_TILES)return true;return SOLID_TILES_MOVEMENT.includes(screen.tiles[ty][tx]);};if(!isSolid(leftTile,topTile)&&!isSolid(rightTile,topTile)&&!isSolid(leftTile,bottomTile)&&!isSolid(rightTile,bottomTile)){enemy.x=newEnemyX;enemy.y=newEnemyY;}}
return;}}
if(isTileSolidForProjectiles(Math.floor(this.x/TILE_SIZE),Math.floor(this.y/TILE_SIZE))||this.x<0||this.x>canvas.width||this.y<0||this.y>canvas.height){this.handleTermination();}},draw(){const centerX=Math.floor(this.x),centerY=Math.floor(this.y);if(this.type==='fireball'){const pS_fire=3;const p=[[0,1,1,0],[1,2,2,1],[1,3,2,1],[0,1,1,0]];const colors={1:'#dc2626',2:'#f97316',3:'#facc15'};for(let y=0;y<p.length;y++){for(let x=0;x<p[y].length;x++){if(p[y][x]===0)continue;ctx.fillStyle=colors[p[y][x]];ctx.fillRect(centerX-6+x*pS_fire,centerY-6+y*pS_fire,pS_fire,pS_fire);}}}else{const pixelSize=gameState.player.hasPowerBolt?3:2;const magicBallPattern=[[0,1,1,0],[1,2,2,1],[1,2,2,1],[0,1,1,0]];for(let y=0;y<4;y++){for(let x=0;x<4;x++){if(magicBallPattern[y][x]===0)continue;let color;switch(magicBallPattern[y][x]){case 1:color=gameState.player.hasPowerBolt?'#8b5cf6':'#7c3aed';break;case 2:color=gameState.player.hasPowerBolt?'#c4b5fd':'#a78bfa';break;}
ctx.fillStyle=color;ctx.fillRect(centerX+x*pixelSize-4,centerY+y*pixelSize-4,pixelSize,pixelSize);}}
if(Math.sin(Date.now()*0.01)>0.5){ctx.fillStyle=gameState.player.hasPowerBolt?'#ffffff':'#ddd6fe';ctx.fillRect(centerX-1,centerY-1,2,2);}}}};return projectile;}
function createEnemyProjectile(x,y,direction,enemyType){let speed=4;if(enemyType==='storm_primary')speed=6;if(enemyType==='storm_secondary')speed=5;if(enemyType==='crystal_shard_fast')speed=5.5;return{x,y,direction,enemyType,width:10,height:10,speed,lifetime:180,update(){if(gameState.inventoryOpen||gameState.shopOpen||gameState.hatShopOpen||gameState.mapOpen)return;this.x+=Math.cos(this.direction)*this.speed;this.y+=Math.sin(this.direction)*this.speed;this.lifetime--;const dx=this.x-(gameState.player.x+gameState.player.width/2);const dy=this.y-(gameState.player.y+gameState.player.height/2);if(Math.sqrt(dx*dx+dy*dy)<gameState.player.width/2){if(!(this.enemyType==='fireball'&&gameState.player.hasFireCrystal)){gameState.player.takeDamage();}
this.lifetime=0;}
if(isTileSolidForProjectiles(Math.floor(this.x/TILE_SIZE),Math.floor(this.y/TILE_SIZE))||this.x<0||this.x>canvas.width||this.y<0||this.y>canvas.height){if(this.enemyType==='storm_primary'){const angleToPlayer=Math.atan2(gameState.player.y-this.y,gameState.player.x-this.x);gameState.enemyProjectiles.push(createEnemyProjectile(this.x,this.y,angleToPlayer,'storm_secondary'));}
this.lifetime=0;}},draw(){const cX=this.x;const cY=this.y;if(this.enemyType==='shadow_mage'||this.enemyType==='shadow_bolt'||this.enemyType==='fireball'){const pS_fire=3;const p=[[0,1,1,0],[1,2,2,1],[1,3,2,1],[0,1,1,0]];const colors={1:'#dc2626',2:'#f97316',3:'#facc15'};for(let y=0;y<p.length;y++){for(let x=0;x<p[y].length;x++){if(p[y][x]===0)continue;ctx.fillStyle=colors[p[y][x]];ctx.fillRect(cX-6+x*pS_fire,cY-6+y*pS_fire,pS_fire,pS_fire);}}}else if(this.enemyType==='crystal_guardian'||this.enemyType==='crystal_shard'||this.enemyType==='crystal_shard_fast'){const pS=3;const p=[[0,1,0],[1,2,1],[0,1,0]];const colors=this.enemyType==='crystal_shard_fast'?{1:'#6d28d9',2:'#a78bfa'}:{1:'#3b82f6',2:'#dbeafe'};for(let y=0;y<p.length;y++){for(let x=0;x<p[y].length;x++){if(p[y][x]===0)continue;ctx.fillStyle=colors[p[y][x]];ctx.fillRect(cX-3+x*pS,cY-3+y*pS,pS,pS);}}}else if(this.enemyType.includes('storm')){const pS=2;const stormColors={1:'#facc15',2:'#fde047',3:'#fef9c3'};const stormPattern=[[0,1,1,0],[1,2,2,1],[1,2,3,2,1],[1,2,2,1],[0,1,1,0]];const pW=stormPattern[0].length,pH=stormPattern.length;const sX=cX-(pW*pS)/2;const sY=cY-(pH*pS)/2;for(let y=0;y<pH;y++){for(let x=0;x<stormPattern[y].length;x++){const pT=stormPattern[y][x];if(pT>0){ctx.fillStyle=stormColors[pT];ctx.fillRect(sX+x*pS,sY+y*pS,pS,pS);}}}}else{ctx.fillStyle='#7c2d12';ctx.fillRect(this.x-this.width/2,this.y-this.height/2,this.width,this.height);}}};}
function createCrystalPillar(x,y){return{x,y,width:TILE_SIZE,height:TILE_SIZE,lifetime:300,update(){this.lifetime--;},draw(){const pS=5;const colors={1:'#1e3a8a',2:'#3b82f6',3:'#93c5fd',4:'#e0f2fe'};const pattern=[[0,0,0,0,4,4,0,0,0,0],[0,0,0,4,3,3,4,0,0,0],[0,0,4,3,2,2,3,4,0,0],[0,4,3,2,1,1,2,3,4,0],[4,3,2,1,1,1,1,2,3,4],[4,3,2,1,1,1,1,2,3,4],[0,4,3,2,1,1,2,3,4,0],[0,0,4,3,2,2,3,4,0,0],[0,0,0,4,3,3,4,0,0,0],[0,0,0,0,4,4,0,0,0,0],];const alpha=Math.min(1,this.lifetime/60);ctx.globalAlpha=alpha;for(let py=0;py<pattern.length;py++){for(let px=0;px<pattern[py].length;px++){if(pattern[py][px]>0){ctx.fillStyle=colors[pattern[py][px]];ctx.fillRect(this.x+px*pS,this.y+py*pS,pS,pS);}}}
ctx.globalAlpha=1;}}}
function createScorchPatch(x,y){return{x,y,radius:TILE_SIZE*0.8,timer:180,state:'warning',update(){this.timer--;if(this.timer<60){this.state='fading';}else if(this.timer<120){this.state='active';}},draw(){ctx.save();if(this.state==='warning'){const warningProgress=(180-this.timer)/60;ctx.strokeStyle=`rgba(255,100,0,${warningProgress})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(this.x,this.y,this.radius*warningProgress,0,Math.PI*2);ctx.stroke();}else if(this.state==='active'){const time=Date.now()*0.01;for(let i=0;i<10;i++){const angle=time*0.5+i*(Math.PI*2/10);const r=Math.random()*this.radius;const flameX=this.x+Math.cos(angle)*r;const flameY=this.y+Math.sin(angle)*r;const size=3+Math.random()*4;let color;const colorPicker=Math.random();if(colorPicker<0.3)color='#dc2626';else if(colorPicker<0.7)color='#f97316';else color='#facc15';ctx.fillStyle=color;ctx.fillRect(flameX-size/2,flameY-size/2,size,size);}}else{ctx.globalAlpha=this.timer/60;const time=Date.now()*0.01;for(let i=0;i<10;i++){const angle=time*0.5+i*(Math.PI*2/10);const r=Math.random()*this.radius;const flameX=this.x+Math.cos(angle)*r;const flameY=this.y+Math.sin(angle)*r;const size=3+Math.random()*4;let color;const colorPicker=Math.random();if(colorPicker<0.3)color='#dc2626';else if(colorPicker<0.7)color='#f97316';else color='#facc15';ctx.fillStyle=color;ctx.fillRect(flameX-size/2,flameY-size/2,size,size);}
ctx.globalAlpha=1;}
ctx.restore();}};}
function createItem(x,y,type){const isRelic=['fire_crystal','ice_crystal','storm_crystal'].includes(type);return{x,y,type,collected:false,bobOffset:Math.random()*Math.PI*2,isRelic,animating:isRelic,animY:isRelic?y-200:y,animVelY:0,glow:0,update(){if(this.collected)return;if(this.animating){this.animVelY+=0.1;this.animY+=this.animVelY;if(this.animY>=this.y){this.animY=this.y;this.animating=false;}
this.glow=Math.min(1,this.glow+0.02);}else{this.bobOffset+=0.1;if(this.glow>0){this.glow=Math.max(0,this.glow-0.02);}}
const dx=this.x-gameState.player.x,dy=this.y-gameState.player.y;if(!this.animating&&Math.sqrt(dx*dx+dy*dy)<35&&!this.collected){this.collected=true;this.collect();}},
collect() {
    switch (this.type) {
        case 'small_crystal':
            gameState.player.gold += 5;
            break;
        case 'medium_crystal':
            gameState.player.gold += 10;
            break;
        case 'large_crystal':
            gameState.player.gold += 25;
            break;
        case 'health':
            if (gameState.player.health < gameState.player.maxHealth) gameState.player.health++;
            break;
        case 'mana_orb':
            gameState.player.mana = Math.min(gameState.player.maxMana, gameState.player.mana + 25);
            break;
        case 'fire_crystal':
            gameState.player.hasFireCrystal = true;
            document.getElementById('fireCrystalIcon').classList.add('acquired');
            break;
        case 'ice_crystal':
            gameState.player.hasIceCrystal = true;
            document.getElementById('iceCrystalIcon').classList.add('acquired');
            break;
        case 'storm_crystal':
            gameState.player.hasStormCrystal = true;
            document.getElementById('stormCrystalIcon').classList.add('acquired');
            break;
    }
    if (this.isRelic) {
        saveGameState();
    }
    updateUI();
    updateInventoryUI();
},
draw(){if(this.collected)return;const dY=this.animating?this.animY:this.y+Math.sin(this.bobOffset)*3;if(this.glow>0){ctx.fillStyle=`rgba(153,102,255,${this.glow*0.7})`;ctx.beginPath();ctx.arc(this.x,dY,25,0,Math.PI*2);ctx.fill();}
switch(this.type){case'small_crystal':this.drawSmallCrystal(this.x,dY);break;case'medium_crystal':this.drawMediumCrystal(this.x,dY);break;case'large_crystal':this.drawLargeCrystal(this.x,dY);break;case'health':this.drawHeart(this.x,dY);break;case'mana_orb':this.drawManaOrb(this.x,dY);break;case'fire_crystal':this.drawFireCrystal(this.x,dY);break;case'ice_crystal':this.drawIceCrystalItem(this.x,dY);break;case'storm_crystal':this.drawStormCrystal(this.x,dY);break;}},drawHeart(drawX,drawY,targetCtx=ctx){const pS=3;targetCtx.fillStyle='#e74c3c';const hP=[[0,1,1,0,1,1,0],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[0,1,1,1,1,1,0],[0,0,1,1,1,0,0],[0,0,0,1,0,0,0]];const pW=hP[0].length,pH=hP.length;const sX=drawX-(pW*pS)/2;const sY=drawY-(pH*pS)/2;for(let y=0;y<pH;y++){for(let x=0;x<pW;x++){if(hP[y][x]===1){targetCtx.fillRect(sX+x*pS,sY+y*pS,pS,pS);}}}targetCtx.fillStyle='#ff7b6e';targetCtx.fillRect(sX+pS,sY+pS,pS,pS);},drawManaOrb(drawX,drawY,targetCtx=ctx){const pS=3;const colors={1:'#16a34a',2:'#22c55e',3:'#86efac'};const pattern=[[0,1,1,0],[1,2,2,1],[1,2,3,2,1],[1,2,2,1],[0,1,1,0]];const pW=pattern[0].length,pH=pattern.length;const sX=drawX-(pW*pS)/2;const sY=drawY-(pH*pS)/2;for(let y=0;y<pH;y++){for(let x=0;x<pW;x++){if(pattern[y][x]>0){targetCtx.fillStyle=colors[pattern[y][x]];targetCtx.fillRect(sX+x*pS,sY+y*pS,pS,pS);}}}},drawCurrencyIcon(drawX,drawY,targetCtx=ctx){const pS=2;const c={outline:'#8b5cf6',body:'#a78bfa',highlight:'#c4b5fd'};const gP=[[0,0,1,1,1,1,0,0],[0,1,2,2,2,2,1,0],[1,2,2,3,3,2,2,1],[1,2,3,2,2,3,2,1],[0,1,2,2,2,2,1,0],[0,0,1,2,2,1,0,0],[0,0,0,1,1,0,0,0]];const pW=gP[0].length,pH=gP.length,sX=drawX-(pW*pS)/2,sY=drawY-(pH*pS)/2;for(let y=0;y<pH;y++){for(let x=0;x<pW;x++){const pT=gP[y][x];if(pT===0)continue;let cl;switch(pT){case 1:cl=c.outline;break;case 2:cl=c.body;break;case 3:cl=c.highlight;break;}
targetCtx.fillStyle=cl;targetCtx.fillRect(sX+x*pS,sY+y*pS,pS,pS);}}},drawSmallCrystal(drawX,drawY,targetCtx=ctx){const pS=3;const p=[[0,1,0],[1,2,1],[0,1,0]];const c={1:'#a78bfa',2:'#c4b5fd'};const pW=p[0].length,pH=p.length,sX=drawX-(pW*pS)/2,sY=drawY-(pH*pS)/2;for(let y=0;y<pH;y++){for(let x=0;x<pW;x++){if(p[y][x]>0){targetCtx.fillStyle=c[p[y][x]];targetCtx.fillRect(sX+x*pS,sY+y*pS,pS,pS);}}}},drawMediumCrystal(drawX,drawY,targetCtx=ctx){const pS=4;const p=[[0,1,1,0],[1,2,2,1],[0,1,1,0]];const c={1:'#3b82f6',2:'#60a5fa'};const pW=p[0].length,pH=p.length,sX=drawX-(pW*pS)/2,sY=drawY-(pH*pS)/2;for(let y=0;y<pH;y++){for(let x=0;x<pW;x++){if(p[y][x]>0){targetCtx.fillStyle=c[p[y][x]];targetCtx.fillRect(sX+x*pS,sY+y*pS,pS,pS);}}}},drawLargeCrystal(drawX,drawY,targetCtx=ctx){const pS=4;const p=[[0,1,0],[1,2,1],[1,3,1],[0,1,0]];const c={1:'#ef4444',2:'#f87171',3:'#fca5a5'};const pW=p[0].length,pH=p.length,sX=drawX-(pW*pS)/2,sY=drawY-(pH*pS)/2;for(let y=0;y<pH;y++){for(let x=0;x<pW;x++){if(p[y][x]>0){targetCtx.fillStyle=c[p[y][x]];targetCtx.fillRect(sX+x*pS,sY+y*pS,pS,pS);}}}},drawFireCrystal(drawX,drawY,targetCtx=ctx){const pS=5;const p=[[0,1,1,1,1,0],[1,2,3,3,2,1],[1,3,4,4,3,1],[1,2,3,3,2,1],[0,1,2,2,1,0],[0,0,1,1,0,0]];const pW=p[0].length,pH=p.length,sX=drawX-(pW*pS)/2,sY=drawY-(pH*pS)/2;for(let y=0;y<pH;y++){for(let x=0;x<pW;x++){const pT=p[y][x];if(pT===0)continue;let c;switch(pT){case 1:c='#dc2626';break;case 2:c='#ef4444';break;case 3:c='#f87171';break;case 4:c='#fca5a5';break;}
targetCtx.fillStyle=c;targetCtx.fillRect(sX+x*pS,sY+y*pS,pS,pS);}}},drawIceCrystalItem(drawX,drawY,targetCtx=ctx){const pS=5;const p=[[0,0,1,1,0,0],[0,1,2,2,1,0],[1,2,3,3,2,1],[1,2,3,3,2,1],[0,1,2,2,1,0],[0,0,1,1,0,0]];const pW=p[0].length,pH=p.length,sX=drawX-(pW*pS)/2,sY=drawY-(pH*pS)/2;for(let y=0;y<pH;y++){for(let x=0;x<pW;x++){const pT=p[y][x];if(pT===0)continue;let c;switch(pT){case 1:c='#0ea5e9';break;case 2:c='#38bdf8';break;case 3:c='#7dd3fc';break;}
targetCtx.fillStyle=c;targetCtx.fillRect(sX+x*pS,sY+y*pS,pS,pS);}}},drawStormCrystal(drawX,drawY,targetCtx=ctx){const pS=5;const p=[[0,1,2,2,1,0],[1,3,4,4,3,1],[2,4,5,5,4,2],[2,4,5,5,4,2],[1,3,4,4,3,1],[0,1,2,2,1,0]];const pW=p[0].length,pH=p.length,sX=drawX-(pW*pS)/2,sY=drawY-(pH*pS)/2;for(let y=0;y<pH;y++){for(let x=0;x<pW;x++){const pT=p[y][x];if(pT===0)continue;let c;switch(pT){case 1:c='#7c3aed';break;case 2:c='#8b5cf6';break;case 3:c='#a78bfa';break;case 4:c='#c4b5fd';break;case 5:c='#e9d5ff';break;}
ctx.fillStyle=c;targetCtx.fillRect(sX+x*pS,sY+y*pS,pS,pS);}}}}}
function createMerchant(x,y,isHatTrader=false){return{x,y,width:40,height:40,isHatTrader,draw(){const pS=3;const cX=this.x+this.width/2;const cY=this.y+this.height/2;const pattern=this.isHatTrader?[[0,0,1,1,1,1,0,0],[0,1,2,2,2,2,1,0],[1,2,3,4,4,3,2,1],[1,2,4,4,4,4,2,1],[1,2,2,5,5,2,2,1],[0,1,5,1,1,5,1,0],[0,1,1,0,0,1,1,0]]:[[0,0,1,1,1,1,0,0],[0,1,2,2,2,2,1,0],[1,2,3,4,4,3,2,1],[1,2,4,4,4,4,2,1],[1,2,2,5,5,2,2,1],[0,1,5,1,1,5,1,0],[0,1,1,0,0,1,1,0]];const colors=this.isHatTrader?{1:'#4a044e',2:'#701a75',3:'#f472b6',4:'#f9a8d4',5:'#1e293b'}:{1:'#7c3aed',2:'#a78bfa',3:'#fbbf24',4:'#fde047',5:'#78350f'};const pW=pattern[0].length,pH=pattern.length;const sX=cX-(pW*pS)/2;const sY=cY-(pH*pS)/2;for(let py=0;py<pH;py++){for(let px=0;px<pW;px++){const pixel=pattern[py][px];if(pixel>0){ctx.fillStyle=colors[pixel];ctx.fillRect(sX+px*pS,sY+py*pS,pS,pS);}}}}};}
function createParticle(x,y,color){const defaultColors=['#2d1b69','#4c1d95','#7c3aed','#a78bfa','#fbbf24'];const isSparkle=!!color;return{x,y,vx:(Math.random()-0.5)*(isSparkle?2:4),vy:(Math.random()-0.5)*(isSparkle?2:4),lifetime:isSparkle?40:60,color:color||defaultColors[Math.floor(Math.random()*defaultColors.length)],size:Math.random()*(isSparkle?2:3)+(isSparkle?1:2),update(){this.x+=this.vx;this.y+=this.vy;if(!isSparkle){this.vy+=0.1;}
this.lifetime--;},draw(){ctx.globalAlpha=this.lifetime/(isSparkle?40:60);ctx.fillStyle=this.color;ctx.fillRect(this.x,this.y,this.size,this.size);ctx.globalAlpha=1;}};}
function saveGameState() {
    const saveData = {
        health: gameState.player.health,
        maxHealth: gameState.player.maxHealth,
        mana: gameState.player.mana,
        maxMana: gameState.player.maxMana,
        gold: gameState.player.gold,
        hats: gameState.player.hats,
        equippedHat: gameState.player.equippedHat,
        hasPowerBolt: gameState.player.hasPowerBolt,
        hasSwiftCaster: gameState.player.hasSwiftCaster,
        hasLifeSteal: gameState.player.hasLifeSteal,
        hasGoldMagnet: gameState.player.hasGoldMagnet,
        hasFireCrystal: gameState.player.hasFireCrystal,
        hasIceCrystal: gameState.player.hasIceCrystal,
        hasStormCrystal: gameState.player.hasStormCrystal,
    };
    localStorage.setItem('crystalQuestSave', JSON.stringify(saveData));
    console.log("Game state saved!");
}
function loadGameState() {
    const savedDataString = localStorage.getItem('crystalQuestSave');
    if (!savedDataString) {
        console.log("No save data found.");
        return false;
    }
    try {
        const savedData = JSON.parse(savedDataString);
        if (gameState.player) {
            Object.assign(gameState.player, savedData);
            console.log("Game state loaded!");
            return true;
        }
    } catch (e) {
        console.error("Failed to load game state:", e);
        return false;
    }
}
function activateCheat(code) {
    console.log(`Cheat code entered: ${code}`);
    switch(code) {
        case "fire":
            if (window.location.pathname.includes('level2.html')) {
                if (!gameState.player.hasFireCrystal) {
                    console.log("Cheat Activated: FIRE CRYSTAL");
                    gameState.player.hasFireCrystal = true;
                    syncAcquiredItemsUI();
                    updateInventoryUI();
                    saveGameState();
                }
            }
            break;
    }
}
function syncAcquiredItemsUI() {
    if (!gameState.player) return;
    const player = gameState.player;
    document.getElementById('arcaneArmorIcon').classList.toggle('acquired', player.maxHealth > 3);
    document.getElementById('powerBoltIcon').classList.toggle('acquired', player.hasPowerBolt);
    document.getElementById('swiftCasterIcon').classList.toggle('acquired', player.hasSwiftCaster);
    document.getElementById('lifeStealIcon').classList.toggle('acquired', player.hasLifeSteal);
    document.getElementById('goldMagnetIcon').classList.toggle('acquired', player.hasGoldMagnet);
    document.getElementById('fireCrystalIcon').classList.toggle('acquired', player.hasFireCrystal);
    document.getElementById('iceCrystalIcon').classList.toggle('acquired', player.hasIceCrystal);
    document.getElementById('stormCrystalIcon').classList.toggle('acquired', player.hasStormCrystal);
}
function isTileSolidForMovement(x,y){if(x<0||x>=SCREEN_WIDTH_TILES||y<0||y>=SCREEN_HEIGHT_TILES)return true;const tile=getCurrentScreen().tiles[y][x];let solidTiles=SOLID_TILES_MOVEMENT;if(gameState.player.hasFireCrystal&&tile===TILES.LAVA){return false;}
return solidTiles.includes(tile)||tile===TILES.LAVA;}
function isTileSolidForProjectiles(x,y){if(x<0||x>=SCREEN_WIDTH_TILES||y<0||y>=SCREEN_HEIGHT_TILES)return true;const tile=getCurrentScreen().tiles[y][x];return SOLID_TILES_PROJECTILE.includes(tile);}
function checkCollisionAndUnlock(tileX,tileY){if(tileX<0||tileX>=SCREEN_WIDTH_TILES||tileY<0||tileY>=SCREEN_HEIGHT_TILES)return true;const screen=getCurrentScreen();const tile=screen.tiles[tileY][tileX];if(tile===TILES.BARRIER){if(gameState.player.hasFireCrystal&&gameState.player.hasIceCrystal&&gameState.player.hasStormCrystal){screen.tiles[tileY][tileX]=TILES.OPEN_DOOR;if(screen.tiles[tileY+1]&&screen.tiles[tileY+1][tileX]===TILES.BARRIER){screen.tiles[tileY+1][tileX]=TILES.OPEN_DOOR;}
if(screen.tiles[tileY-1]&&screen.tiles[tileY-1][tileX]===TILES.BARRIER){screen.tiles[tileY-1][tileX]=TILES.OPEN_DOOR;}
if(screen.tiles[tileY][tileX+1]===TILES.BARRIER){screen.tiles[tileY][tileX+1]=TILES.OPEN_DOOR;}
if(screen.tiles[tileY][tileX-1]===TILES.BARRIER){screen.tiles[tileY][tileX-1]=TILES.OPEN_DOOR;}
return false;}
return true;}
return isTileSolidForMovement(tileX,tileY);}
function getCurrentScreen(){return gameState.worldScreens[`${gameState.currentScreen.x}-${gameState.currentScreen.y}`];}
function update(){if(!gameState.gameRunning){if(gameState.player&&gameState.player.isDying){gameState.player.update();}
gameState.particles.forEach(p=>p.update());gameState.particles=gameState.particles.filter(p=>p.lifetime>0);return;}
gameState.player.update();const screen=getCurrentScreen();screen.enemies.forEach(e=>e.update());screen.enemies=screen.enemies.filter(e=>!e.isDead);screen.items.forEach(i=>i.update());gameState.projectiles.forEach(p=>p.update());gameState.projectiles=gameState.projectiles.filter(p=>p.lifetime>0);gameState.enemyProjectiles.forEach(p=>p.update());gameState.enemyProjectiles=gameState.enemyProjectiles.filter(p=>p.lifetime>0);screen.items=screen.items.filter(i=>!i.collected);gameState.particles.forEach(p=>p.update());gameState.particles=gameState.particles.filter(p=>p.lifetime>0);screen.scorchPatches.forEach(p=>p.update());screen.scorchPatches=screen.scorchPatches.filter(p=>p.timer>0);}
function draw(){if(!gameState.gameRunning || !getCurrentScreen()) return; ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);const screen=getCurrentScreen();for(let y=0;y<SCREEN_HEIGHT_TILES;y++){for(let x=0;x<SCREEN_WIDTH_TILES;x++){drawTile(x,y,screen.tiles[y][x]);}}
if(gameState.merchant && gameState.currentScreen.x===SHOP_LOCATION.x&&gameState.currentScreen.y===SHOP_LOCATION.y){gameState.merchant.draw();const dx=gameState.player.x-(gameState.merchant.x-gameState.merchant.width/2);const dy=gameState.player.y-(gameState.merchant.y-gameState.merchant.height/2);const shopTooltip=document.getElementById('shopTooltip');if(Math.sqrt(dx*dx+dy*dy)<TILE_SIZE*2&&!gameState.shopOpen){shopTooltip.classList.remove('hidden');shopTooltip.style.left=`${gameState.merchant.x+20}px`;shopTooltip.style.top=`${gameState.merchant.y-30}px`;shopTooltip.textContent="(E) to Shop";}else{shopTooltip.classList.add('hidden');}}
else if(gameState.hatTrader && gameState.currentScreen.x===HAT_SHOP_LOCATION.x&&gameState.currentScreen.y===HAT_SHOP_LOCATION.y){gameState.hatTrader.draw();const dx=gameState.player.x-(gameState.hatTrader.x-gameState.hatTrader.width/2);const dy=gameState.player.y-(gameState.hatTrader.y-gameState.hatTrader.height/2);const shopTooltip=document.getElementById('shopTooltip');if(Math.sqrt(dx*dx+dy*dy)<TILE_SIZE*2&&!gameState.hatShopOpen){shopTooltip.classList.remove('hidden');shopTooltip.style.left=`${gameState.hatTrader.x+20}px`;shopTooltip.style.top=`${gameState.hatTrader.y-30}px`;shopTooltip.textContent="(E) to Shop";}else{shopTooltip.classList.add('hidden');}}
else{document.getElementById('shopTooltip').classList.add('hidden');}
screen.items.forEach(item=>item.draw());screen.scorchPatches.forEach(p=>p.draw());gameState.enemyProjectiles.forEach(p=>p.draw());screen.enemies.forEach(enemy=>enemy.draw());gameState.projectiles.forEach(p=>p.draw());gameState.player.draw();gameState.particles.forEach(p=>p.draw());}
function getBiomeForScreen(x,y){if(x<=2&&y<=2)return'shadow';if(x>=5&&y<=2)return'fire';if(x<=2&&y>=5)return'crystal';if(x>=5&&y>=5)return'storm';return'neutral';}
function drawTile(x,y,tileType){const screenX=x*TILE_SIZE;const screenY=y*TILE_SIZE;const biome=getBiomeForScreen(gameState.currentScreen.x,gameState.currentScreen.y);const time=Date.now();if(tileType!==TILES.WALL&&tileType!==TILES.LAVA&&tileType!==TILES.CRACKED_GROUND){let floorBaseColor='#2a1f3d';switch(biome){case'fire':floorBaseColor='#4a2c17';break;case'crystal':floorBaseColor='#1e293b';break;case'storm':floorBaseColor='#1e1b4b';break;case'shadow':floorBaseColor='#0f0a19';break;}
ctx.fillStyle=floorBaseColor;ctx.fillRect(screenX,screenY,TILE_SIZE,TILE_SIZE);}
switch(tileType){
    case TILES.ASH_FLOOR:
        ctx.fillStyle = '#404040'; // Dark gray base
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = 'rgba(100, 100, 100, 0.5)'; // Lighter gray speckles
        for (let i = 0; i < 6; i++) {
            const seed = x * 19 + y * 97 + i * 5;
            const pRndX = Math.sin(seed) * 10000;
            const pRndY = Math.cos(seed) * 10000;
            const speckleX = screenX + (pRndX - Math.floor(pRndX)) * TILE_SIZE;
            const speckleY = screenY + (pRndY - Math.floor(pRndY)) * TILE_SIZE;
            ctx.fillRect(speckleX, speckleY, 3, 3);
        }
        break;
    case TILES.CRACKED_GROUND:
        ctx.fillStyle = '#261a12'; // Dark, scorched earth
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        const crackTime = time * 0.005;
        const glow = 0.6 + (Math.sin(crackTime + x + y) * 0.4); // Pulsing glow
        ctx.strokeStyle = `rgba(255, ${100 + 50 * glow}, 0, ${glow})`;
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            const seed = x * 23 + y * 89 + i * 7;
            const pRndX1 = Math.sin(seed) * 10000 % TILE_SIZE;
            const pRndY1 = Math.cos(seed) * 10000 % TILE_SIZE;
            const pRndX2 = Math.sin(seed * 1.2) * 10000 % TILE_SIZE;
            const pRndY2 = Math.cos(seed * 1.2) * 10000 % TILE_SIZE;
            ctx.beginPath();
            ctx.moveTo(screenX + pRndX1, screenY + pRndY1);
            ctx.lineTo(screenX + pRndX2, screenY + pRndY2);
            ctx.stroke();
        }
        break;
    case TILES.STONE_FLOOR:let floorSpeckleColor='rgba(153,102,255,0.1)';switch(biome){case'fire':floorSpeckleColor='rgba(255,69,0,0.2)';break;case'crystal':floorSpeckleColor='rgba(59, 130, 246, 0.3)';break;case'storm':floorSpeckleColor='rgba(139, 92, 246, 0.2)';break;case'shadow':floorSpeckleColor='rgba(45, 27, 105, 0.3)';break;}
ctx.fillStyle=floorSpeckleColor;for(let i=0;i<4;i++){const seed=x*19+y*97+i*5;const pRndX=Math.sin(seed)*10000;const pRndY=Math.cos(seed)*10000;const speckleX=screenX+(pRndX-Math.floor(pRndX))*TILE_SIZE;const speckleY=screenY+(pRndY-Math.floor(pRndY))*TILE_SIZE;ctx.fillRect(speckleX,speckleY,biome==='shadow'?3:2,biome==='shadow'?3:2);}
break;case TILES.WALL:if(y===0||y===SCREEN_HEIGHT_TILES-1||x===0||x===SCREEN_WIDTH_TILES-1){let baseColor='#2a1f3d';switch(biome){case'fire':baseColor='#4a2c17';break;case'crystal':baseColor='#1e293b';break;case'storm':baseColor='#1e1b4b';break;case'shadow':baseColor='#0f0a19';break;}
ctx.fillStyle=baseColor;ctx.fillRect(screenX,screenY,TILE_SIZE,TILE_SIZE);const animTime=time*0.002;const seed=x*13+y*71;switch(biome){case'fire':ctx.fillStyle='#451a03';ctx.fillRect(screenX,screenY,TILE_SIZE,TILE_SIZE);for(let i=0;i<3;i++){const pRnd=Math.sin(seed+i)*10000;const startY=(pRnd-Math.floor(pRnd))*TILE_SIZE;const height=5+(Math.cos(seed+i*2)-Math.floor(Math.cos(seed+i*2)))*10;const glow=Math.sin(animTime+seed+i)*0.5+0.5;ctx.fillStyle=`rgba(255,${50+glow*100},0,${0.5+glow*0.5})`;ctx.fillRect(screenX+TILE_SIZE/2-2,screenY+startY,4,height);}
break;case'crystal':ctx.fillStyle='#1e293b';ctx.fillRect(screenX,screenY,TILE_SIZE,TILE_SIZE);const pS=5;const colors={1:'#0ea5e9',2:'#38bdf8',3:'#7dd3fc'};const pattern=[[0,0,1,2,1,0,0,1,0,0],[0,1,2,3,2,1,1,2,1,0],[1,2,3,3,3,2,2,3,2,1],[2,3,3,2,3,3,3,3,2,1],[1,3,2,1,2,3,2,1,3,2],[0,1,3,2,3,2,1,2,1,0],[0,1,2,3,2,1,2,3,2,0],[1,2,3,2,1,0,1,2,1,1],[0,1,2,1,0,0,0,1,2,0],[0,0,1,0,0,0,0,0,1,0]];const xOffset=Math.sin(x*0.5+y*0.3)*2;const yOffset=Math.sin(y*0.5+x*0.3)*2;for(let py=0;py<10;py++){for(let px=0;px<10;px++){const pT=pattern[py][px];if(pT>0){ctx.fillStyle=colors[pT];ctx.fillRect(screenX+px*pS+xOffset,screenY+py*pS+yOffset,pS,pS);}}}
break;case'storm':ctx.fillStyle='#1e1b4b';ctx.fillRect(screenX,screenY,TILE_SIZE,TILE_SIZE);const cloudSeed=x*29+y*53;const pSize=5;const cloudColors={shadow:'#1e1065',base:'#2d1b69',highlight:'#4c1d95'};for(let py=0;py<TILE_SIZE/pSize;py++){for(let px=0;px<TILE_SIZE/pSize;px++){const noise=Math.sin(px*0.4+cloudSeed)+Math.cos(py*0.4+animTime*0.5);if(noise>0.8){const glow=Math.sin(animTime+py*0.5)*0.5+0.5;const r=Math.floor(76+glow*20);const g=Math.floor(29+glow*20);const b=Math.floor(149+glow*40);ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.fillRect(screenX+px*pSize,screenY+py*pSize,pSize,pSize);}else if(noise>0.4){ctx.fillStyle=cloudColors.base;ctx.fillRect(screenX+px*pSize,screenY+py*pSize,pSize,pSize);}else if(noise>0.1){ctx.fillStyle=cloudColors.shadow;ctx.fillRect(screenX+px*pSize,screenY+py*pS,pSize,pSize);}}}
const lightningSeed=seed+Math.floor(time/200);if(Math.sin(lightningSeed)>0.98){const pRndX=Math.sin(lightningSeed*1.2)*10000;let xPos=5+(pRndX-Math.floor(pRndX))*(TILE_SIZE-10);ctx.beginPath();ctx.moveTo(screenX+xPos,screenY);for(let yPos=0;yPos<TILE_SIZE;yPos+=8){const nextX=xPos+(Math.random()-0.5)*10;ctx.lineTo(screenX+nextX,screenY+yPos);xPos=nextX;}
ctx.strokeStyle='rgba(96, 165, 250, 0.6)';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle='#dbeafe';ctx.lineWidth=2;ctx.stroke();}
break;case'shadow':ctx.fillStyle='#0f0a19';ctx.fillRect(screenX,screenY,TILE_SIZE,TILE_SIZE);const shadowGlow=Math.sin(animTime+seed)*0.5+0.5;ctx.fillStyle=`rgba(45,27,105,${0.3+shadowGlow*0.5})`;ctx.font='20px VT323';ctx.textAlign='center';ctx.fillText('◆',screenX+TILE_SIZE/2,screenY+TILE_SIZE/2+8);break;default:drawNormalWall(screenX,screenY,biome);break;}}else{drawNormalWall(screenX,screenY,biome);}
break;case TILES.LAVA:ctx.fillStyle='#dc2626';ctx.fillRect(screenX,screenY,TILE_SIZE,TILE_SIZE);ctx.fillStyle='rgba(251, 191, 36, 0.6)';ctx.fillRect(screenX+5,screenY+5,40,8);ctx.fillRect(screenX+10,screenY+20,30,6);const bubbles=Math.sin(time*0.01+x+y)>0.7;if(bubbles){ctx.fillStyle='rgba(255, 255, 255, 0.8)';ctx.beginPath();ctx.arc(screenX+15,screenY+35,3,0,Math.PI*2);ctx.arc(screenX+30,screenY+25,2,0,Math.PI*2);ctx.fill();}
break;case TILES.CRYSTAL_SAND:ctx.fillStyle='#7dd3fc';ctx.fillRect(screenX,screenY,TILE_SIZE,TILE_SIZE);ctx.fillStyle='rgba(59, 130, 246, 0.4)';for(let i=0;i<5;i++){const seed=x*23+y*89+i*7;const pRndX=Math.sin(seed)*10000;const pRndY=Math.cos(seed)*10000;const crystalX=screenX+(pRndX-Math.floor(pRndX))*TILE_SIZE;const crystalY=screenY+(pRndY-Math.floor(pRndY))*TILE_SIZE;ctx.fillRect(crystalX,crystalY,3,3);}
break;case TILES.OBSIDIAN:const obsidianSeed=x*41+y*83;const pRndX=Math.sin(obsidianSeed)*10000;const pRndY=Math.cos(obsidianSeed)*10000;const obsidianPattern=[[0,0,3,3,0,0,0],[0,3,2,2,3,0,0],[0,2,2,2,2,3,0],[2,2,2,2,2,2,3],[2,2,1,2,2,2,0],[0,1,1,1,1,0,0]];const pixelSize=5;const patternWidth=obsidianPattern[0].length;const patternHeight=obsidianPattern.length;const offsetX=5+(pRndX-Math.floor(pRndX))*10;const offsetY=5+(pRndY-Math.floor(pRndY))*10;const flip=(Math.sin(obsidianSeed*2)>0);for(let py=0;py<patternHeight;py++){for(let px=0;px<patternWidth;px++){const pixelType=obsidianPattern[py][px];if(pixelType===0)continue;let color;switch(pixelType){case 1:color='#1f2937';break;case 2:color='#374151';break;case 3:color='#4b5563';break;}
if(biome==='shadow'&&pixelType===3){color='#2d1b69';}
ctx.fillStyle=color;const drawX=flip?(patternWidth-1-px):px;ctx.fillRect(screenX+offsetX+drawX*pixelSize,screenY+offsetY+py*pixelSize,pixelSize,pixelSize);}}
break;case TILES.MAGIC_PATH:let pathBase='#4c1d95';let rune1='rgba(124, 58, 237, 0.3)';let rune2='rgba(139, 92, 246, 0.2)';switch(biome){case'fire':pathBase='#7c2d12';rune1='rgba(255, 0, 0, 0.3)';rune2='rgba(255, 165, 0, 0.2)';break;case'crystal':pathBase='#1e40af';rune1='rgba(59, 130, 246, 0.4)';rune2='rgba(147, 197, 253, 0.2)';break;case'storm':pathBase='#581c87';rune1='rgba(139, 92, 246, 0.3)';rune2='rgba(196, 181, 253, 0.2)';break;case'shadow':pathBase='#1e1065';rune1='rgba(45, 27, 105, 0.4)';rune2='rgba(76, 29, 149, 0.3)';break;}
ctx.fillStyle=pathBase;ctx.fillRect(screenX,screenY,TILE_SIZE,TILE_SIZE);for(let i=0;i<8;i++){const seed=x*13+y*71+i*3;const pRndX=Math.sin(seed)*10000;const pRndY=Math.cos(seed)*10000;const runeX=screenX+(pRndX-Math.floor(pRndX))*TILE_SIZE;const runeY=screenY+(pRndY-Math.floor(pRndY))*TILE_SIZE;if(i%2===0){ctx.fillStyle=rune1;ctx.fillRect(runeX,runeY,4,4);}
else{ctx.fillStyle=rune2;ctx.fillRect(runeX,runeY,3,3);}}
break;case TILES.SEALED_DOOR:ctx.fillStyle='#374151';ctx.fillRect(screenX,screenY,TILE_SIZE,TILE_SIZE);ctx.fillStyle='#4c1d95';ctx.fillRect(screenX+5,screenY+5,TILE_SIZE-10,TILE_SIZE-10);ctx.fillStyle='#6b7280';ctx.fillRect(screenX+5,screenY+15,TILE_SIZE-10,5);ctx.fillRect(screenX+5,screenY+30,TILE_SIZE-10,5);ctx.fillStyle='#000';ctx.fillRect(screenX+TILE_SIZE/2-3,screenY+TILE_SIZE/2-5,6,6);ctx.fillStyle='#9966ff';ctx.fillRect(screenX+TILE_SIZE/2-2,screenY+TILE_SIZE/2-4,4,4);break;case TILES.OPEN_DOOR:ctx.fillStyle='#4c1d95';ctx.fillRect(screenX,screenY,TILE_SIZE,TILE_SIZE);break;case TILES.POISON_SPIKES:const spikeAnim=Math.sin(time*0.005+x+y)>0;const pS_spikes=5;const drawSpikeSet=(offsetX,offsetY,pattern,colors)=>{const animY=spikeAnim?-2:0;for(let py=0;py<pattern.length;py++){for(let px=0;px<pattern[py].length;px++){const pixel=pattern[py][px];if(pixel>0){ctx.fillStyle=colors[pixel];ctx.fillRect(screenX+offsetX+px*pS_spikes,screenY+offsetY+py*pS_spikes+animY,pS_spikes,pS_spikes);}}}};for(let r=0;r<2;r++){for(let c=0;c<2;c++){const seed=x*19+y*97+r*2+c;const pRndX=Math.sin(seed)*10000;const pRndY=Math.cos(seed)*10000;const offsetX=c*25+(pRndX-Math.floor(pRndX))*4-2;const offsetY=r*25+(pRndY-Math.floor(pRndY))*4-2;let pattern,colors;switch(biome){case'fire':pattern=[[0,1,0],[1,2,1],[1,3,1],[2,3,2]];colors={1:'#7c2d12',2:'#dc2626',3:'#f87171'};break;case'crystal':pattern=[[0,1,0],[1,2,1],[1,3,1],[1,3,1]];colors={1:'#1e40af',2:'#3b82f6',3:'#93c5fd'};break;case'storm':pattern=[[0,1,0],[0,1,0],[1,2,1],[1,2,1]];colors={1:'#581c87',2:'#8b5cf6'};if(Math.sin(time*0.02+seed)>0.9){colors={1:'#fbbf24',2:'#fde047'};}
break;case'shadow':pattern=[[0,1,0],[1,2,1],[1,3,1],[0,3,0]];colors={1:'#1e1065',2:'#2d1b69',3:'#4c1d95'};break;default:pattern=[[0,1,0],[1,2,1],[1,3,1],[1,3,1]];colors={1:'#4a5568',2:'#718096',3:'#a0aec0'};break;}
drawSpikeSet(offsetX,offsetY,pattern,colors);}}
break;case TILES.MANA_POOL:const poolPattern=[[0,0,1,1,1,1,1,0,0],[0,1,2,2,2,2,2,1,0],[1,2,2,3,3,3,2,2,1],[1,2,3,3,3,3,3,2,1],[0,1,2,2,2,2,2,1,0],[0,0,1,1,1,1,1,0,0]];const poolColors={1:'#1e40af',2:'#3b82f6',3:'#60a5fa'};const poolSize=5;for(let py=0;py<poolPattern.length;py++){for(let px=0;px<poolPattern[0].length;px++){const pixel=poolPattern[py][px];if(pixel>0){const shimmer=Math.sin(time*0.01+px+py)*0.3+0.7;ctx.fillStyle=poolColors[pixel];ctx.globalAlpha=shimmer;ctx.fillRect(screenX+2+px*poolSize,screenY+10+py*poolSize,poolSize,poolSize);ctx.globalAlpha=1.0;}}}
break;case TILES.TELEPORT_PAD: {
    let floorBaseColor = '#2a1f3d';
    switch (biome) {
        case 'fire': floorBaseColor = '#4a2c17'; break;
        case 'crystal': floorBaseColor = '#1e293b'; break;
        case 'storm': floorBaseColor = '#1e1b4b'; break;
        case 'shadow': floorBaseColor = '#0f0a19'; break;
    }
    ctx.fillStyle = floorBaseColor;
    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    const centerX = screenX + TILE_SIZE / 2;
    const centerY = screenY + TILE_SIZE / 2;
    const animTime = time * 0.002;
    const pS = 5;
    const colors = { 1: '#2d1b69', 2: '#4c1d95', 3: '#7c3aed', 4: '#a78bfa', 5: '#c4b5fd' };
    const pattern = [ [0,0,1,2,2,1,0,0], [0,1,3,4,4,3,1,0], [1,3,4,0,0,4,3,1], [2,4,0,0,0,0,4,2], [2,4,0,0,0,0,4,2], [1,3,4,0,0,4,3,1], [0,1,3,4,4,3,1,0], [0,0,1,2,2,1,0,0], ];
    const pW = pattern[0].length;
    const pH = pattern.length;
    const sX = centerX - (pW * pS) / 2;
    const sY = centerY - (pH * pS) / 2;
    const rotation = animTime * 0.5;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.translate(-centerX, -centerY);
    for (let py = 0; py < pH; py++) {
        for (let px = 0; px < pW; px++) {
            let pT = pattern[py][px];
            if (pT > 0) {
                if (pT === 4 && Math.sin(animTime * 3 + px) > 0.5) { pT = 5; }
                ctx.fillStyle = colors[pT];
                ctx.fillRect(Math.floor(sX + px * pS), Math.floor(sY + py * pS), pS, pS);
            }
        }
    }
    ctx.restore();
    for(let i = 0; i < 3; i++) {
        const angle = animTime * 1.5 + i * (Math.PI * 2 / 3);
        const radius = 10 + Math.sin(animTime * 2 + i) * 3;
        const pX = centerX + Math.cos(angle) * radius;
        const pY = centerY + Math.sin(angle) * radius;
        const size = 1 + Math.random() * 2;
        ctx.fillStyle = `rgba(196, 181, 253, ${0.5 + Math.random() * 0.5})`;
        ctx.fillRect(pX - size / 2, pY - size / 2, size, size);
    }
    break;
}
case TILES.PORTAL: {
    const centerX = screenX + TILE_SIZE / 2;
    const centerY = screenY + TILE_SIZE / 2;
    const animTime = time * 0.001;
    ctx.fillStyle = '#111';
    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 25);
    gradient.addColorStop(0, `hsl(${animTime * 50 % 360}, 100%, 70%)`);
    gradient.addColorStop(0.5, `hsl(${(animTime * 50 + 180) % 360}, 90%, 40%)`);
    gradient.addColorStop(1, 'rgba(10, 5, 20, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

    ctx.save();
    ctx.translate(centerX, centerY);
    for (let i = 0; i < 8; i++) {
        ctx.rotate(animTime + i * 0.8);
        const distance = 10 + (i % 2) * 8;
        const alpha = 0.5 + Math.sin(animTime * 2 + i) * 0.5;
        ctx.fillStyle = `rgba(255, 255, 220, ${alpha})`;
        ctx.fillRect(distance, -1, 3, 2);
    }
    ctx.restore();
    break;
}
case TILES.BARRIER:const barrierSeed=x*13+y*71;const animTime=time*0.002;ctx.fillStyle='#0f0a19';ctx.fillRect(screenX,screenY,TILE_SIZE,TILE_SIZE);const pS_barrier=5;const barrierPattern=[[0,1,0,1,0,1,0,1,0,1],[1,2,1,2,1,2,1,2,1,0],[0,1,3,1,3,1,3,1,0,1],[1,2,1,2,1,2,1,2,1,0],[0,1,0,1,0,1,0,1,0,1],[1,0,1,0,1,0,1,0,1,0],[0,1,2,1,2,1,2,1,0,1],[1,3,1,3,1,3,1,3,1,0],[0,1,0,1,0,1,0,1,0,1],[1,0,1,0,1,0,1,0,1,0]];const barrierColors={1:'#2d1b69',2:'#7c3aed',3:'#a78bfa'};for(let py=0;py<10;py++){for(let px=0;px<10;px++){const pixel=barrierPattern[py][px];if(pixel>0){const alpha=0.3+(Math.sin(animTime*2+px+py)*0.5+0.5)*0.5;ctx.globalAlpha=alpha;ctx.fillStyle=barrierColors[pixel];ctx.fillRect(screenX+px*pS_barrier,screenY+py*pS_barrier,pS_barrier,pS_barrier);}}}
ctx.globalAlpha=1.0;break;case TILES.TENT_LEFT:case TILES.TENT_RIGHT:drawTent(screenX,screenY,tileType);break;case TILES.CAMPFIRE:drawCampfire(screenX,screenY,time);break;}}
function drawNormalWall(screenX,screenY,biome){let wallBaseColor='#2a1f3d';switch(biome){case'fire':wallBaseColor='#4a2c17';break;case'crystal':wallBaseColor='#1e293b';break;case'storm':wallBaseColor='#1e1b4b';break;case'shadow':wallBaseColor='#0f0a19';break;}
ctx.fillStyle=wallBaseColor;ctx.fillRect(screenX,screenY,TILE_SIZE,TILE_SIZE);ctx.fillStyle='#374151';ctx.fillRect(screenX+18,screenY+25,14,25);ctx.fillStyle='#1f2937';ctx.fillRect(screenX+20,screenY+28,2,20);ctx.fillRect(screenX+25,screenY+30,2,18);ctx.fillRect(screenX+28,screenY+27,2,21);let leafColor1='#6366f1';let leafColor2='#8b5cf6';let leafColor3='#a78bfa';let leafColor4='#c4b5fd';switch(biome){case'fire':leafColor1='#dc2626';leafColor2='#ef4444';leafColor3='#f87171';leafColor4='#fca5a5';break;case'crystal':leafColor1='#1d4ed8';leafColor2='#3b82f6';leafColor3='#60a5fa';leafColor4='#93c5fd';break;case'storm':leafColor1='#6d28d9';leafColor2='#8b5cf6';leafColor3='#a78bfa';leafColor4='#c4b5fd';break;case'shadow':leafColor1='#2d1b69';leafColor2='#4c1d95';leafColor3='#7c3aed';leafColor4='#a78bfa';break;}
ctx.fillStyle=leafColor1;ctx.fillRect(screenX+8,screenY+8,34,28);ctx.fillStyle=leafColor2;ctx.fillRect(screenX+10,screenY+10,30,24);ctx.fillStyle=leafColor3;ctx.fillRect(screenX+12,screenY+12,26,20);ctx.fillStyle=leafColor4;ctx.fillRect(screenX+14,screenY+14,6,6);ctx.fillRect(screenX+28,screenY+16,8,8);ctx.fillRect(screenX+16,screenY+24,10,6);ctx.fillStyle=leafColor1;ctx.fillRect(screenX+22,screenY+18,4,4);ctx.fillRect(screenX+32,screenY+22,6,6);ctx.fillRect(screenX+12,screenY+28,8,4);}
function drawTent(x,y,type){const pS=5;const colors={1:'#854d0e',2:'#a16207',3:'#ca8a04',4:'#fde047'};const pattern=type===TILES.TENT_LEFT?[[0,0,0,0,0,0,0,0,1,1],[0,0,0,0,0,0,0,1,2,2],[0,0,0,0,0,0,1,2,3,3],[0,0,0,0,0,1,2,3,3,3],[0,0,0,0,1,2,3,3,3,2],[0,0,0,1,2,3,3,3,2,1],[0,0,1,2,3,3,3,2,1,0],[0,1,2,3,3,3,2,1,0,0],[1,2,3,3,3,2,1,0,0,0],[1,1,1,1,1,1,0,0,0,0],]:[[1,1,0,0,0,0,0,0,0,0],[2,2,1,0,0,0,0,0,0,0],[3,3,2,1,0,0,0,0,0,0],[3,3,3,2,1,0,0,0,0,0],[2,3,3,3,2,1,0,0,0,0],[1,2,3,3,3,2,1,0,0,0],[0,1,2,3,3,3,2,1,0,0],[0,0,1,2,3,3,2,1,0,0],[0,0,0,1,2,3,2,1,0,0],[0,0,0,0,1,1,1,1,1,1],];for(let py=0;py<10;py++){for(let px=0;px<10;px++){const pT=pattern[py][px];if(pT>0){ctx.fillStyle=colors[pT];ctx.fillRect(x+px*pS,y+py*pS,pS,pS);}}}}
function drawCampfire(x,y,time){const pS=4;ctx.fillStyle='#78350f';ctx.fillRect(x+15,y+30,20,8);ctx.fillRect(x+10,y+35,30,8);ctx.fillStyle='#451a03';ctx.fillRect(x+15,y+32,20,2);ctx.fillRect(x+10,y+37,30,2);const fireColors={1:'#dc2626',2:'#f97316',3:'#facc15'};const firePattern=[[0,0,3,3,0,0],[0,2,3,3,2,0],[0,2,1,1,2,0],[1,2,1,1,2,1],];const animFrame=Math.floor(time/200)%2;for(let py=0;py<firePattern.length;py++){for(let px=0;px<firePattern[py].length;px++){let pT=firePattern[py][px];if(pT>0){if(animFrame===1&&Math.random()>0.5){pT=pT===3?2:pT+1;}
ctx.fillStyle=fireColors[pT];ctx.fillRect(x+10+px*pS,y+20-py*pS,pS,pS);}}}}
function updateUI(){const healthBar=document.getElementById('healthBar');healthBar.innerHTML='';for(let i=0;i<gameState.player.maxHealth;i++){const heartCanvas=document.createElement('canvas');heartCanvas.width=24;heartCanvas.height=24;healthBar.appendChild(heartCanvas);drawHeartIcon(heartCanvas,i<gameState.player.health);}
const manaBarCanvas=document.getElementById('manaBar');drawManaBarUI(manaBarCanvas,gameState.player.mana,gameState.player.maxMana);}
function updateInventoryUI(){document.getElementById('inventoryGold').textContent=gameState.player.gold;document.getElementById('inventoryMana').textContent=Math.floor(gameState.player.mana);document.getElementById('inventoryMaxMana').textContent=gameState.player.maxMana;const equippedHatCanvas=document.getElementById('equippedHatIcon');const hatCtx=equippedHatCanvas.getContext('2d');hatCtx.clearRect(0,0,50,50);drawHatIcon(gameState.player.equippedHat,hatCtx,25,25);const ownedHatsGrid=document.getElementById('ownedHatsGrid');ownedHatsGrid.innerHTML='';gameState.player.hats.forEach(hatId=>{const hatCanvas=document.createElement('canvas');hatCanvas.width=50;hatCanvas.height=50;hatCanvas.className='upgrade-icon acquired';if(hatId===gameState.player.equippedHat){hatCanvas.style.borderColor='#ff0';}
const hatIconCtx=hatCanvas.getContext('2d');drawHatIcon(hatId,hatIconCtx,25,25);hatCanvas.addEventListener('click',()=>equipHat(hatId));ownedHatsGrid.appendChild(hatCanvas);});}
function equipHat(hatId) {
    const player = gameState.player;
    if (player.equippedHat === hatId) return;
    if (player.equippedHat === 'archmage') {
        player.maxMana -= 50;
        if (player.mana > player.maxMana) {
            player.mana = player.maxMana;
        }
    }
    player.equippedHat = hatId;
    if (player.equippedHat === 'archmage') {
        player.maxMana += 50;
    }
    updateUI();
    updateInventoryUI();
    saveGameState();
}
function toggleInventory(){if(gameState.shopOpen||gameState.hatShopOpen||gameState.mapOpen||gameState.settingsOpen)return;gameState.inventoryOpen=!gameState.inventoryOpen;document.getElementById('inventoryModal').classList.toggle('hidden');if(gameState.inventoryOpen){updateInventoryUI();document.querySelector('.tab-button[data-tab=\'upgradesTab\']').click();}}
function toggleShop(){if(gameState.inventoryOpen||gameState.mapOpen||gameState.settingsOpen)return;if(gameState.shopOpen){gameState.shopOpen=false;document.getElementById('shopModal').classList.add('hidden');return;}
if(gameState.hatShopOpen){gameState.hatShopOpen=false;document.getElementById('hatShopModal').classList.add('hidden');return;}
if(gameState.currentScreen.x===SHOP_LOCATION.x&&gameState.currentScreen.y===SHOP_LOCATION.y){const dx=gameState.player.x-(gameState.merchant.x-gameState.merchant.width/2);const dy=gameState.player.y-(gameState.merchant.y-gameState.merchant.height/2);if(Math.sqrt(dx*dx+dy*dy)<TILE_SIZE*2){gameState.shopOpen=true;updateShopUI();document.getElementById('shopModal').classList.remove('hidden');}}
if(gameState.currentScreen.x===HAT_SHOP_LOCATION.x&&gameState.currentScreen.y===HAT_SHOP_LOCATION.y){const dx=gameState.player.x-(gameState.hatTrader.x-gameState.hatTrader.width/2);const dy=gameState.player.y-(gameState.hatTrader.y-gameState.hatTrader.height/2);if(Math.sqrt(dx*dx+dy*dy)<TILE_SIZE*2){gameState.hatShopOpen=true;updateHatShopUI();document.getElementById('hatShopModal').classList.remove('hidden');}}}
function toggleMap(){if(gameState.inventoryOpen||gameState.shopOpen||gameState.hatShopOpen||gameState.settingsOpen)return;gameState.mapOpen=!gameState.mapOpen;document.getElementById('mapModal').classList.toggle('hidden');if(gameState.mapOpen){drawMap();}}
function drawMap() {
    const mapCanvas = document.getElementById('mapCanvas');
    const mapCtx = mapCanvas.getContext('2d');
    const cellSize = mapCanvas.width / WORLD_SIZE_SCREENS;
    mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);

    const bossLocations = { '7-0': true, '0-7': true, '7-7': true, '0-0': true };
    const biomeColors = { fire: '#4a2c17', crystal: '#1e293b', storm: '#1e1b4b', shadow: '#0f0a19', neutral: '#2a1f3d' };

    const drawMapIcon = (ctx, pattern, colors, x, y, size) => {
        const pS = size / pattern[0].length;
        for (let r = 0; r < pattern.length; r++) {
            for (let c = 0; c < pattern[r].length; c++) {
                const pT = pattern[r][c];
                if (pT > 0) {
                    ctx.fillStyle = colors[pT];
                    ctx.fillRect(x + c * pS, y + r * pS, pS, pS);
                }
            }
        }
    };

    const shopIconPattern = [[0,1,1,1,1,0],[1,2,2,2,2,1],[1,2,3,3,2,1],[1,2,3,3,2,1],[0,1,2,2,1,0],[0,0,1,1,0,0]];
    const shopIconColors = { 1: '#ca8a04', 2: '#eab308', 3: '#fde047' };

    const hatIconPattern = [[0,1,1,0],[1,2,2,1],[1,2,2,1],[1,1,1,1]];
    const hatIconColors = { 1: '#2d1b69', 2: '#7c3aed' };
    
    const bossIconPattern = [[0,1,1,1,1,0],[1,2,2,2,2,1],[1,2,3,3,2,1],[1,2,3,3,2,1],[0,1,2,2,1,0],[0,0,1,1,0,0]];
    const bossIconColors = { 1: '#7f1d1d', 2: '#b91c1c', 3: '#ef4444' };

    for (let y = 0; y < WORLD_SIZE_SCREENS; y++) {
        for (let x = 0; x < WORLD_SIZE_SCREENS; x++) {
            const screenKey = `${x}-${y}`;
            if (gameState.visitedScreens[screenKey]) {
                const biome = getBiomeForScreen(x, y);
                mapCtx.fillStyle = biomeColors[biome] || '#333';
                mapCtx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                mapCtx.fillStyle = 'rgba(0,0,0,0.1)';
                for(let i = 0; i < 10; i++) {
                    mapCtx.fillRect(x * cellSize + Math.random() * cellSize, y * cellSize + Math.random() * cellSize, 2, 2);
                }
            } else {
                mapCtx.fillStyle = '#222';
                mapCtx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                mapCtx.fillStyle = '#555';
                mapCtx.font = `${cellSize * 0.7}px VT323`;
                mapCtx.textAlign = 'center';
                mapCtx.textBaseline = 'middle';
                mapCtx.fillText('?', x * cellSize + cellSize / 2, y * cellSize + cellSize / 2 + 2);
            }
        }
    }

    mapCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    mapCtx.lineWidth = 3;
    for (let y = 0; y < WORLD_SIZE_SCREENS; y++) {
        for (let x = 0; x < WORLD_SIZE_SCREENS; x++) {
            if (gameState.visitedScreens[`${x}-${y}`]) {
                if (x < WORLD_SIZE_SCREENS - 1 && gameState.visitedScreens[`${x + 1}-${y}`]) {
                    mapCtx.beginPath();
                    mapCtx.moveTo(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2);
                    mapCtx.lineTo((x + 1) * cellSize + cellSize / 2, y * cellSize + cellSize / 2);
                    mapCtx.stroke();
                }
                if (y < WORLD_SIZE_SCREENS - 1 && gameState.visitedScreens[`${x}-${y + 1}`]) {
                    mapCtx.beginPath();
                    mapCtx.moveTo(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2);
                    mapCtx.lineTo(x * cellSize + cellSize / 2, (y + 1) * cellSize + cellSize / 2);
                    mapCtx.stroke();
                }
            }
        }
    }
    
    for (let i = 0; i <= WORLD_SIZE_SCREENS; i++) {
        mapCtx.strokeStyle = '#000';
        mapCtx.lineWidth = 2;
        mapCtx.beginPath();
        mapCtx.moveTo(i * cellSize, 0);
        mapCtx.lineTo(i * cellSize, mapCanvas.height);
        mapCtx.moveTo(0, i * cellSize);
        mapCtx.lineTo(mapCanvas.width, i * cellSize);
        mapCtx.stroke();
    }

    const iconPadding = cellSize * 0.2;
    const iconSize = cellSize - (iconPadding * 2);
    for (let y = 0; y < WORLD_SIZE_SCREENS; y++) {
        for (let x = 0; x < WORLD_SIZE_SCREENS; x++) {
             if (x === SHOP_LOCATION.x && y === SHOP_LOCATION.y) {
                drawMapIcon(mapCtx, shopIconPattern, shopIconColors, x * cellSize + iconPadding, y * cellSize + iconPadding, iconSize);
            } else if (x === HAT_SHOP_LOCATION.x && y === HAT_SHOP_LOCATION.y) {
                 drawMapIcon(mapCtx, hatIconPattern, hatIconColors, x * cellSize + iconPadding, y * cellSize + iconPadding, iconSize);
            } else if (bossLocations[`${x}-${y}`] && gameState.visitedScreens[`${x}-${y}`]) {
                 drawMapIcon(mapCtx, bossIconPattern, bossIconColors, x * cellSize + iconPadding, y * cellSize + iconPadding, iconSize);
            }
        }
    }

    mapCtx.fillStyle = '#60a5fa';
    mapCtx.beginPath();
    mapCtx.arc(gameState.currentScreen.x * cellSize + cellSize / 2, gameState.currentScreen.y * cellSize + cellSize / 2, cellSize / 3.5, 0, Math.PI * 2);
    mapCtx.fill();
    mapCtx.strokeStyle = '#fff';
    mapCtx.lineWidth = 2;
    mapCtx.stroke();

    const legendYou = document.getElementById('legend-you');
    if (legendYou && !legendYou.dataset.drawn) {
        const lyCtx = legendYou.getContext('2d');
        lyCtx.fillStyle = '#60a5fa';
        lyCtx.beginPath();
        lyCtx.arc(9, 9, 7, 0, Math.PI * 2);
        lyCtx.fill();
        lyCtx.strokeStyle = '#fff';
        lyCtx.lineWidth = 1.5;
        lyCtx.stroke();
        legendYou.dataset.drawn = true;
    }
    const legendShop = document.getElementById('legend-shop');
    if (legendShop && !legendShop.dataset.drawn) {
        drawMapIcon(legendShop.getContext('2d'), shopIconPattern, shopIconColors, 0, 0, 18);
        legendShop.dataset.drawn = true;
    }
    const legendHatShop = document.getElementById('legend-hat-shop');
     if (legendHatShop && !legendHatShop.dataset.drawn) {
        drawMapIcon(legendHatShop.getContext('2d'), hatIconPattern, hatIconColors, 0, 0, 18);
        legendHatShop.dataset.drawn = true;
    }
    const legendBoss = document.getElementById('legend-boss');
    if (legendBoss && !legendBoss.dataset.drawn) {
        drawMapIcon(legendBoss.getContext('2d'), bossIconPattern, bossIconColors, 0, 0, 18);
        legendBoss.dataset.drawn = true;
    }
}
function updateShopUI(){document.getElementById('shopGold').textContent=gameState.player.gold;const shopGrid=document.querySelector('#shopModal .shop-item-grid');shopGrid.innerHTML='';upgradeShopItems.forEach(item=>{const itemEl=document.createElement('div');itemEl.className='shop-item';const isPurchased=item.purchased();const canAfford=gameState.player.gold>=item.cost;itemEl.innerHTML=`<div class="shop-item-info"><canvas id="shop-icon-${item.id}"width="50"height="50"></canvas><div><h3>${item.name}</h3><p>${item.cost}Crystals</p></div></div><button class="buy-button"id="buy-${item.id}"${isPurchased||!canAfford?'disabled':''}>${isPurchased?'Owned':'Buy'}</button>`;shopGrid.appendChild(itemEl);const iconCanvas=document.getElementById(`shop-icon-${item.id}`);const iconCtx=iconCanvas.getContext('2d');switch(item.id){case'arcaneArmor':drawArcaneArmor(25,25,iconCtx);break;case'powerBolt':drawPowerBolt(25,25,iconCtx);break;case'swiftCaster':drawSwiftCaster(25,25,iconCtx);break;case'lifeSteal':drawLifeSteal(25,25,iconCtx);break;case'goldMagnet':drawGoldMagnet(25,25,iconCtx);break;}
if(!isPurchased){document.getElementById(`buy-${item.id}`).addEventListener('click',()=>buyShopItem(item));}});}
function updateHatShopUI(){document.getElementById('hatShopGold').textContent=gameState.player.gold;const shopGrid=document.getElementById('hat-shop-item-grid');shopGrid.innerHTML='';hatShopItems.forEach(item=>{const itemEl=document.createElement('div');itemEl.className='shop-item';const isPurchased=item.purchased();const canAfford=gameState.player.gold>=item.cost;itemEl.innerHTML=`<div class="shop-item-info"><canvas id="shop-icon-${item.id}"width="50"height="50"></canvas><div><h3>${item.name}</h3><p>${item.cost}Crystals</p></div></div><button class="buy-button"id="buy-${item.id}"${isPurchased||!canAfford?'disabled':''}>${isPurchased?'Owned':'Buy'}</button>`;shopGrid.appendChild(itemEl);const iconCanvas=document.getElementById(`shop-icon-${item.id}`);const iconCtx=iconCanvas.getContext('2d');drawHatIcon(item.id.replace('Hat','').replace('Hood',''),iconCtx,25,25);if(!isPurchased){document.getElementById(`buy-${item.id}`).addEventListener('click',()=>buyShopItem(item));}});}
function buyShopItem(item) {
    if (gameState.player.gold >= item.cost && !item.purchased()) {
        gameState.player.gold -= item.cost;
        if (item.type === 'hat') {
            const hatId = item.id.replace('Hat', '').replace('Hood', '');
            gameState.player.hats.push(hatId);
            equipHat(hatId);
        } else {
            switch (item.id) {
                case 'arcaneArmor':
                    gameState.player.maxHealth++;
                    gameState.player.health = gameState.player.maxHealth;
                    document.getElementById('arcaneArmorIcon').classList.add('acquired');
                    break;
                case 'powerBolt':
                    gameState.player.hasPowerBolt = true;
                    document.getElementById('powerBoltIcon').classList.add('acquired');
                    break;
                case 'swiftCaster':
                    gameState.player.hasSwiftCaster = true;
                    document.getElementById('swiftCasterIcon').classList.add('acquired');
                    break;
                case 'lifeSteal':
                    gameState.player.hasLifeSteal = true;
                    document.getElementById('lifeStealIcon').classList.add('acquired');
                    break;
                case 'goldMagnet':
                    gameState.player.hasGoldMagnet = true;
                    document.getElementById('goldMagnetIcon').classList.add('acquired');
                    break;
            }
        }
        updateUI();
        updateShopUI();
        updateHatShopUI();
        saveGameState();
    }
}
function drawHeartIcon(canvas,isFull){if(!canvas)return;const t=canvas.getContext("2d");t.clearRect(0,0,canvas.width,canvas.height);const pS=3,color=isFull?'#e74c3c':'#444',h=isFull?'#ff7b6e':'#666';t.fillStyle=color;const hP=[[0,1,1,0,1,1,0],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[0,1,1,1,1,1,0],[0,0,1,1,1,0,0],[0,0,0,1,0,0,0]];const pW=hP[0].length,pH=hP.length;const drawX=canvas.width/2;const drawY=canvas.height/2;const sX=drawX-(pW*pS)/2;const sY=drawY-(pH*pS)/2;for(let y=0;y<pH;y++){for(let x=0;x<pW;x++){if(hP[y][x]===1){t.fillRect(sX+x*pS,sY+y*pS,pS,pS);}}}
if(isFull){t.fillStyle=h;t.fillRect(sX+pS,sY+pS,pS,pS);}}
function drawManaBarUI(canvas,currentMana,maxMana){if(!canvas)return;const ctx=canvas.getContext('2d');const w=canvas.width;const h=canvas.height;ctx.clearRect(0,0,w,h);const manaRatio=currentMana/maxMana;const pS=3;const frameColor='#ca8a04';const highlightColor='#fde047';const liquidColor='#3b82f6';const surfaceColor='#60a5fa';const bubbleColor='rgba(165, 180, 253, 0.5)';const glassColor='rgba(12, 10, 9, 0.8)';ctx.fillStyle=frameColor;ctx.fillRect(0,0,w,h);ctx.fillStyle=highlightColor;ctx.fillRect(pS,pS,w-pS*2,pS);ctx.fillRect(pS,pS,pS,h-pS*2);ctx.fillStyle=glassColor;ctx.fillRect(pS*2,pS*2,w-pS*4,h-pS*4);const liquidMaxWidth=w-pS*4;const liquidMaxHeight=h-pS*4;const liquidWidth=liquidMaxWidth*manaRatio;if(liquidWidth>0){ctx.fillStyle=liquidColor;ctx.fillRect(pS*2,pS*2,liquidWidth,liquidMaxHeight);const time=Date.now()*0.005;const waveHeight=2.5;const waveFreq=2;ctx.fillStyle=surfaceColor;ctx.beginPath();const surfaceX=pS*2+liquidWidth;ctx.moveTo(surfaceX,pS*2);for(let y=0;y<liquidMaxHeight;y++){const xOffset=Math.sin((y/liquidMaxHeight)*waveFreq*Math.PI*2+time)*waveHeight;ctx.lineTo(surfaceX+xOffset,pS*2+y);}
ctx.lineTo(pS*2,pS*2+liquidMaxHeight);ctx.lineTo(pS*2,pS*2);ctx.closePath();ctx.save();ctx.clip();ctx.fill();ctx.restore();ctx.fillStyle=bubbleColor;for(let i=0;i<4;i++){const bubbleY=pS*2+(Math.sin(time*0.5+i*2)*0.5+0.5)*(liquidMaxHeight-4);const bubbleX=pS*2+liquidWidth-((time*0.4+i*3)%1)*liquidWidth;if(bubbleX<surfaceX-2&&bubbleX>pS*2){ctx.fillRect(bubbleX,bubbleY,pS-1,pS-1);}}}}
function drawHatIcon(hatType,targetCtx,drawX,drawY){const pS=4;let hatPattern,hatColors;switch(hatType){case'archmage':hatPattern=[[0,0,0,1,1,0,0,0],[0,0,1,2,2,1,0,0],[0,1,2,3,3,2,1,0],[1,2,3,4,4,3,2,1],[1,1,1,1,1,1,1,1]];hatColors={1:'#1e3a8a',2:'#1d4ed8',3:'#3b82f6',4:'#60a5fa'};break;case'warlock':hatPattern=[[0,0,1,1,1,1,0,0],[0,1,2,2,2,2,1,0],[1,2,2,2,2,2,2,1],[1,2,2,2,2,2,2,1]];hatColors={1:'#171717',2:'#404040'};break;default:hatPattern=[[0,0,1,1,0,0],[0,1,2,2,1,0],[1,2,3,3,2,1],[1,2,3,3,3,2,1]];hatColors={1:'#2d1b69',2:'#4c1d95',3:'#7c3aed'};break;}
const pW=hatPattern[0].length,pH=hatPattern.length;const sX=drawX-(pW*pS)/2,sY=drawY-(pH*pS)/2;for(let y=0;y<pH;y++){for(let x=0;x<pW;x++){const pT=hatPattern[y][x];if(pT===0)continue;targetCtx.fillStyle=hatColors[pT];targetCtx.fillRect(sX+x*pS,sY+y*pS,pS,pS);}}}
function drawArcaneArmor(drawX,drawY,targetCtx=ctx){const pS=3;const p=[[0,1,1,0,1,1,0],[1,2,2,1,2,2,1],[1,2,3,2,3,2,1],[1,2,2,2,2,2,1],[0,1,2,2,2,1,0],[0,0,1,2,1,0,0],[0,0,0,1,0,0,0]];const pW=p[0].length,pH=p.length,sX=drawX-(pW*pS)/2,sY=drawY-(pH*pS)/2;for(let y=0;y<pH;y++){for(let x=0;x<pW;x++){const pT=p[y][x];if(pT===0)continue;let c;switch(pT){case 1:c='#2d1b69';break;case 2:c='#4c1d95';break;case 3:c='#7c3aed';break;}targetCtx.fillStyle=c;targetCtx.fillRect(sX+x*pS,sY+y*pS,pS,pS);}}}
function drawPowerBolt(drawX,drawY,targetCtx=ctx){const pS=3;const p=[[0,0,1,1,1,0,0],[0,1,2,3,2,1,0],[1,2,3,4,3,2,1],[1,3,4,5,4,3,1],[1,2,3,4,3,2,1],[0,1,2,3,2,1,0],[0,0,1,1,1,0,0]];const pW=p[0].length,pH=p.length,sX=drawX-(pW*pS)/2,sY=drawY-(pH*pS)/2;for(let y=0;y<pH;y++){for(let x=0;x<pW;x++){const pT=p[y][x];if(pT===0)continue;let c;switch(pT){case 1:c='#4c1d95';break;case 2:c='#7c3aed';break;case 3:c='#8b5cf6';break;case 4:c='#a78bfa';break;case 5:c='#c4b5fd';break;}targetCtx.fillStyle=c;targetCtx.fillRect(sX+x*pS,sY+y*pS,pS,pS);}}}
function drawSwiftCaster(drawX,drawY,targetCtx=ctx){const pS=3;const p=[[0,1,1,1,0,0,0],[1,2,2,2,1,0,0],[1,2,2,2,2,1,0],[1,2,2,2,2,1,1],[0,1,2,2,2,2,1],[0,0,1,1,1,1,0]];const pW=p[0].length,pH=p.length,sX=drawX-(pW*pS)/2,sY=drawY-(pH*pS)/2;for(let y=0;y<pH;y++){for(let x=0;x<pW;x++){const pT=p[y][x];if(pT===0)continue;let c;switch(pT){case 1:c='#1e40af';break;case 2:c='#3b82f6';break;}targetCtx.fillStyle=c;targetCtx.fillRect(sX+x*pS,sY+y*pS,pS,pS);}}}
function drawLifeSteal(drawX,drawY,targetCtx=ctx){const pS=3;const p=[[0,1,1,0,1,1,0],[1,2,2,1,2,2,1],[1,2,3,2,3,2,1],[1,2,2,2,2,2,1],[0,1,2,2,2,1,0],[0,0,1,2,1,0,0],[0,0,0,1,0,0,0]];const pW=p[0].length,pH=p.length,sX=drawX-(pW*pS)/2,sY=drawY-(pH*pS)/2;for(let y=0;y<pH;y++){for(let x=0;x<pW;x++){const pT=p[y][x];if(pT===0)continue;let c;switch(pT){case 1:c='#7c3aed';break;case 2:c='#a78bfa';break;case 3:c='#e74c3c';break;}targetCtx.fillStyle=c;targetCtx.fillRect(sX+x*pS,sY+y*pS,pS,pS);}}}
function drawGoldMagnet(drawX,drawY,targetCtx=ctx){const pS=3;const p=[[0,0,1,1,1,0,0],[0,1,2,3,2,1,0],[1,2,3,4,3,2,1],[1,3,4,3,4,3,1],[1,2,3,4,3,2,1],[0,1,2,3,2,1,0],[0,0,1,1,1,0,0]];const pW=p[0].length,pH=p.length,sX=drawX-(pW*pS)/2,sY=drawY-(pH*pS)/2;for(let y=0;y<pH;y++){for(let x=0;x<pW;x++){const pT=p[y][x];if(pT===0)continue;let c;switch(pT){case 1:c='#ca8a04';break;case 2:c='#eab308';break;case 3:c='#facc15';break;case 4:c='#fde047';break;}targetCtx.fillStyle=c;targetCtx.fillRect(sX+x*pS,sY+y*pS,pS,pS);}}}
function drawInventoryIcons(){const itemDrawer=createItem(0,0,'');const gC=document.getElementById('invGoldIcon');if(gC)itemDrawer.drawCurrencyIcon(12,12,gC.getContext('2d'));const sgC=document.getElementById('shopGoldIcon');if(sgC)itemDrawer.drawCurrencyIcon(12,12,sgC.getContext('2d'));const hsgC=document.getElementById('hatShopGoldIcon');if(hsgC)itemDrawer.drawCurrencyIcon(12,12,hsgC.getContext('2d'));const aaC=document.getElementById('arcaneArmorIcon');if(aaC){drawArcaneArmor(25,25,aaC.getContext('2d'));}
const pbC=document.getElementById('powerBoltIcon');if(pbC){drawPowerBolt(25,25,pbC.getContext('2d'));}
const scC=document.getElementById('swiftCasterIcon');if(scC){drawSwiftCaster(25,25,scC.getContext('2d'));}
const lsC=document.getElementById('lifeStealIcon');if(lsC){drawLifeSteal(25,25,lsC.getContext('2d'));}
const gmC=document.getElementById('goldMagnetIcon');if(gmC){drawGoldMagnet(25,25,gmC.getContext('2d'));}
const fcC=document.getElementById('fireCrystalIcon');if(fcC)itemDrawer.drawFireCrystal(25,25,fcC.getContext('2d'));const icC=document.getElementById('iceCrystalIcon');if(icC)itemDrawer.drawIceCrystalItem(25,25,icC.getContext('2d'));const scIconC=document.getElementById('stormCrystalIcon');if(scIconC)itemDrawer.drawStormCrystal(25,25,scIconC.getContext('2d'));}
function createTitleSparkles(){const title=document.querySelector('.crystal-modal h1');if(!title)return;for(let i=0;i<5;i++){const sparkle=document.createElement('div');sparkle.className='crystal-sparkle';sparkle.style.cssText=`top:${10+i*15}%;left:${15+i*15}%;width:${4+i}px;height:${4+i}px;animation-delay:${i*0.3}s;`;title.appendChild(sparkle);}}
function setupEventListeners(){document.addEventListener('keydown',(e)=>{const key=e.key.toLowerCase();
    if(gameState.gameRunning && key.length === 1 && key >= 'a' && key <= 'z') {
        gameState.cheatCodeBuffer = (gameState.cheatCodeBuffer + key).slice(-4);
        if (gameState.cheatCodeBuffer === 'fire') {
            activateCheat('fire');
        }
    }
    if(key==='escape'){if(gameState.inventoryOpen)toggleInventory();else if(gameState.shopOpen)toggleShop();else if(gameState.hatShopOpen)toggleShop();else if(gameState.mapOpen)toggleMap();else if(gameState.settingsOpen){document.getElementById('settingsModal').classList.add('hidden');document.getElementById('mainMenuModal').classList.remove('hidden');gameState.settingsOpen=false;}}
    if(key==='i'&&gameState.gameRunning){e.preventDefault();toggleInventory();}
    if(key==='e'&&gameState.gameRunning){e.preventDefault();toggleShop();}
    if(key==='m'&&gameState.gameRunning){e.preventDefault();toggleMap();}
    gameState.keys[e.key.toLowerCase()]=true;if(e.key.startsWith('Arrow')||e.key===' '||e.key==='shift')e.preventDefault();});document.addEventListener('keyup',(e)=>{gameState.keys[e.key.toLowerCase()]=false;});const mainMenuModal=document.getElementById('mainMenuModal');const settingsModal=document.getElementById('settingsModal');const difficultyModal=document.getElementById('difficultyModal');const instructionsModal=document.getElementById('instructionsModal');const newGameButton=document.getElementById('newGameButton');const settingsButton=document.getElementById('settingsButton');const backToMenuButton=document.getElementById('backToMenuButton');const arrowControlsButton=document.getElementById('arrowControlsButton');const wasdControlsButton=document.getElementById('wasdControlsButton');const keyboardAimButton=document.getElementById('keyboardAimButton');const mouseAimButton=document.getElementById('mouseAimButton');
newGameButton.addEventListener('click', () => {
    localStorage.removeItem('crystalQuestSave'); 
    mainMenuModal.classList.add('hidden');
    difficultyModal.classList.remove('hidden');
});
settingsButton.addEventListener('click',()=>{mainMenuModal.classList.add('hidden');settingsModal.classList.remove('hidden');gameState.settingsOpen=true;});backToMenuButton.addEventListener('click',()=>{settingsModal.classList.add('hidden');mainMenuModal.classList.remove('hidden');gameState.settingsOpen=false;});arrowControlsButton.addEventListener('click',()=>{gameState.controlScheme='arrows';arrowControlsButton.classList.add('active');wasdControlsButton.classList.remove('active');});wasdControlsButton.addEventListener('click',()=>{gameState.controlScheme='wasd';wasdControlsButton.classList.add('active');arrowControlsButton.classList.remove('active');});keyboardAimButton.addEventListener('click',()=>{gameState.aimScheme='keyboard';keyboardAimButton.classList.add('active');mouseAimButton.classList.remove('active');});mouseAimButton.addEventListener('click',()=>{gameState.aimScheme='mouse';mouseAimButton.classList.add('active');keyboardAimButton.classList.remove('active');});canvas.addEventListener('mousemove',(e)=>{const rect=canvas.getBoundingClientRect();const gameContainer=document.querySelector('.game-container');const scaleMatch=gameContainer.style.transform.match(/scale\(([^)]+)\)/);const scale=scaleMatch?parseFloat(scaleMatch[1]):1;gameState.mousePos.x=(e.clientX-rect.left)/scale;gameState.mousePos.y=(e.clientY-rect.top)/scale;});canvas.addEventListener('mousedown',(e)=>{if(e.button===0&&gameState.gameRunning&&gameState.aimScheme==='mouse'&&gameState.player.attackTimer<=0){gameState.player.attacking=true;gameState.player.attackTimer=20;gameState.player.performAttack();}});document.getElementById('easyButton').addEventListener('click',()=>{setDifficulty('easy');});document.getElementById('hardButton').addEventListener('click',()=>{setDifficulty('hard');});document.getElementById('startButton').addEventListener('click',startGame);document.getElementById('restartButton').addEventListener('click',restartGame);document.getElementById('restartButton2').addEventListener('click',restartGame);const tooltip=document.getElementById('inventoryTooltip');const itemDescriptions={'arcaneArmorIcon':{name:"Arcane Armor",acquired:"Increases your maximum health by one heart.",unacquired:"Purchase from the mystic merchant."},'powerBoltIcon':{name:"Power Bolt",acquired:"Your magic attacks are stronger and travel farther.",unacquired:"Purchase from the mystic merchant."},'swiftCasterIcon':{name:"Swift Casting",acquired:"Enchanted boots that make you faster.",unacquired:"Purchase from the mystic merchant."},'lifeStealIcon':{name:"Life Steal",acquired:"Your magic attacks have a chance to steal health.",unacquired:"Purchase from the mystic merchant."},'goldMagnetIcon':{name:"Gold Magnet",acquired:"Enemies drop more crystals when defeated.",unacquired:"Purchase from the mystic merchant."},'fireCrystalIcon':{name:"Fire Crystal",acquired:"Your projectiles explode on impact, damaging nearby enemies. You are also immune to lava.",unacquired:"Dropped by the Shadow Mage in the northeast."},'iceCrystalIcon':{name:"Ice Crystal",acquired:"Your magic attacks now slow enemies on hit.",unacquired:"Dropped by the Crystal Guardian in the southwest."},'stormCrystalIcon':{name:"Storm Crystal",acquired:"Your magic attacks now push enemies back.",unacquired:"Dropped by the Storm Elemental in the southeast."},'equippedHatIcon':{name:"Equipped Hat",get description(){switch(gameState.player.equippedHat){case'archmage':return"Archmage's Hat: Increases maximum mana by 50 & attack range by 2 tiles.";case'warlock':return"Warlock's Hood: Attacks have a chance to fire a triple shot.";default:return"Wizard Hat: A classic, pointed hat. No special abilities.";}}}};document.querySelectorAll('.upgrade-icon').forEach(icon=>{icon.addEventListener('mouseover',(e)=>{const itemId=e.target.id;const descriptionData=itemDescriptions[itemId];if(!descriptionData)return;let name,descriptionText;if(itemId==='equippedHatIcon'){name=descriptionData.name;descriptionText=`<p>${descriptionData.description}</p>`;}else{const isAcquired=e.target.classList.contains('acquired');name=descriptionData.name;descriptionText=isAcquired?`<p>${descriptionData.acquired}</p>`:`<p class="hint">${descriptionData.unacquired}</p>`;}
tooltip.innerHTML=`<h3>${name}</h3>${descriptionText}`;tooltip.classList.remove('hidden');});icon.addEventListener('mousemove',(e)=>{const tooltip=document.getElementById('inventoryTooltip');const gameContainer=document.querySelector('.game-container');const containerRect=gameContainer.getBoundingClientRect();const scaleMatch=gameContainer.style.transform.match(/scale\(([^)]+)\)/);const scale=scaleMatch?parseFloat(scaleMatch[1]):1;const mouseX=(e.clientX-containerRect.left)/scale;const mouseY=(e.clientY-containerRect.top)/scale;const tooltipWidth=tooltip.offsetWidth;const tooltipHeight=tooltip.offsetHeight;const containerWidth=gameContainer.clientWidth;const containerHeight=gameContainer.clientHeight;const offset=20;let newTop=mouseY+offset;let newLeft=mouseX+offset;if(newLeft+tooltipWidth>containerWidth){newLeft=mouseX-tooltipWidth-offset;}
if(newTop+tooltipHeight>containerHeight){newTop=mouseY-tooltipHeight-offset;}
if(newLeft<0){newLeft=5;}
if(newTop<5){newTop=5;}
tooltip.style.left=`${newLeft}px`;tooltip.style.top=`${newTop}px`;});icon.addEventListener('mouseout',()=>{tooltip.classList.add('hidden');});});window.addEventListener('resize',resizeGame);}

function setupInventoryTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all tabs and content
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Activate the clicked tab and its corresponding content
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });
}

function setDifficulty(level){gameState.difficulty=level;document.getElementById('difficultyModal').classList.add('hidden');document.getElementById('instructionsModal').classList.remove('hidden');}
function gameLoop(){update();draw();animationFrameId=requestAnimationFrame(gameLoop);}
function startGame(){document.getElementById('instructionsModal').classList.add('hidden');initGame();if(animationFrameId){cancelAnimationFrame(animationFrameId);}
gameState.gameRunning=true;gameLoop();}
function gameOver(){gameState.gameRunning=false;document.getElementById('transitionOverlay').classList.add('active');setTimeout(()=>{document.getElementById('gameOverModal').classList.remove('hidden');},500);}
function victory(){gameState.gameRunning=false;if(animationFrameId){cancelAnimationFrame(animationFrameId);}
document.getElementById('victoryModal').classList.remove('hidden');}

function restartGame() {
    localStorage.removeItem('crystalQuestSave');
    window.location.href = 'index.html';
}

function findSafeSpawnTile(screenTiles) {
    const isTileWalkable = (x, y) => {
        if (x < 1 || x >= SCREEN_WIDTH_TILES - 1 || y < 1 || y >= SCREEN_HEIGHT_TILES - 1) return false;
        const tile = screenTiles[y][x];
        return !SOLID_TILES_MOVEMENT.includes(tile) && tile !== TILES.LAVA;
    };
    
    const centerX = Math.floor(SCREEN_WIDTH_TILES / 2);
    const centerY = Math.floor(SCREEN_HEIGHT_TILES / 2);

    if (isTileWalkable(centerX, centerY)) return { x: centerX, y: centerY };

    for (let r = 1; r < SCREEN_WIDTH_TILES / 2; r++) {
        for (let i = -r; i <= r; i++) {
            if (isTileWalkable(centerX + i, centerY - r)) return { x: centerX + i, y: centerY - r };
            if (isTileWalkable(centerX + i, centerY + r)) return { x: centerX + i, y: centerY + r };
            if (isTileWalkable(centerX - r, centerY + i)) return { x: centerX - r, y: centerY + i };
            if (isTileWalkable(centerX + r, centerY + i)) return { x: centerX + r, y: centerY + i };
        }
    }
    return { x: centerX, y: centerY }; // Fallback
}

function initGame() {
    generateWorldScreens(); 
    
    const startScreenKey = '3-3';
    const startScreenTiles = gameState.worldScreens[startScreenKey].tiles;
    const safeTile = findSafeSpawnTile(startScreenTiles);
    
    let startPos = { x: safeTile.x * TILE_SIZE + (TILE_SIZE - 30) / 2, y: safeTile.y * TILE_SIZE + (TILE_SIZE - 30) / 2 };

    if (!gameState.player) {
        gameState.player = createPlayer(startPos.x, startPos.y);
    }
    
    gameState.player.x = startPos.x;
    gameState.player.y = startPos.y;
    gameState.player.isDying = false;
    gameState.player.deathAnimTimer = 0;
    
    gameState.currentScreen = { x: 3, y: 3 }; 
    gameState.visitedScreens = { [startScreenKey]: true };

    loadGameState();
    syncAcquiredItemsUI();
    updateUI();
    updateInventoryUI();
}
function resizeGame(){const gameContainer=document.querySelector('.game-container');const gameWidth=800;const gameHeight=660;const scale=Math.min(window.innerWidth/gameWidth,window.innerHeight/gameHeight);gameContainer.style.transform=`scale(${scale})`;}

function initializeOnLoad() {
    const isLevel2 = window.location.pathname.includes('level2.html');
    const hasTransitioned = sessionStorage.getItem('levelTransition') === 'true';

    if (isLevel2 && !hasTransitioned) {
        // User is on level 2 but didn't come from a portal transition (e.g., they refreshed or typed the URL).
        // Send them back to the start.
        window.location.href = 'index.html';
        return; // Stop further execution
    }

    if (hasTransitioned) {
        // This is a valid transition, so start the game immediately.
        sessionStorage.removeItem('levelTransition');
        
        const mainMenuModal = document.getElementById('mainMenuModal');
        if (mainMenuModal) {
            mainMenuModal.classList.add('hidden');
        }
        startGame();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    setupSVGRenderers();
    drawInventoryIcons();
    createTitleSparkles();
    setupEventListeners();
    setupInventoryTabs(); // <-- Add this line
    resizeGame();
    initializeOnLoad();
});