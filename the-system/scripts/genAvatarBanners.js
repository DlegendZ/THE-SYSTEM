// Pre-renders each class × rank chibi avatar to a notification banner PNG.
// Output: android/app/src/main/res/drawable/notif_<class>_<rank>.png
// Run: NODE_PATH=node_modules node scripts/genAvatarBanners.js
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

const SKIN = '#f2c79a', EYE = '#1b2740';

const BASE = {
  Warrior: [
    '......HHHH......','....HHHHHHHH....','...HHHHHHHHHH...','..HHHHHHHHHHHH..',
    '..HHSSSSSSSSHH..','..HSSSSSSSSSSH..','..HSSFFSSFFSSH..','..HSSFFSSFFSSH..',
    '..HSSSSSSSSSSH..','..HSSSDDDDSSSH..','...HSSSSSSSSH...','....DSSSSD..W...',
    '...AAAAAAAA.WW..','..DAAAAAAAAD W..','...VVVVVVVV.W...','...LLL..LLL.W...',
    '...LLL..LLL.....','...BB....BB.....',
  ],
  Mage: [
    '.......HH.......','......HHHH......','.....HHHHHH.....','....HHHHHHHH....',
    '..HHHHHHHHHHHH..','...SSSSSSSSSS...','...SSFFSSFFSS...','...SSFFSSFFSS...',
    '...SSSSSSSSSS...','...SSSDDDDSSS...','....SSSSSSSS....','.W..DSSSSD......',
    'WC.AAAAAAAA.....','.W.AAAAAAAAAA...','.W..AAAAAAAA....','.W...AAAAAA.....',
    '.....BBBBBB.....','.....BBBBBB.....',
  ],
  Rogue: [
    '....HHHHHHHH....','...HHHHHHHHHH...','..HHHHHHHHHHHH..','..HHHHHHHHHHHH..',
    '..HHSSSSSSSSHH..','..HSSSSSSSSSSH..','..HSSFFSSFFSSH..','..HSSFFSSFFSSH..',
    '..HHSSSSSSSSHH..','...HSSDDDDSSH...','....SSSSSSSS....','W...DSSSSD...W..',
    'W..AAAAAAAA..W..','..DAAAAAAAAD....','...VVVVVVVV.....','...LLL..LLL.....',
    '...LLL..LLL.....','...BB....BB.....',
  ],
};

function warrior(t){const C={1:{A:'#46484f',H:'#6a6e78',V:'#33363d',L:'#2f3340',B:'#1c1f26',W:'#9aa0aa',G:'#7fd4ff'},2:{A:'#4a6c8f',H:'#6f93b8',V:'#33506e',L:'#2c4258',B:'#1c2c3c',W:'#bfe3ff',G:'#9fe6ff'},3:{A:'#2f86c8',H:'#5cb4ef',V:'#1f5e92',L:'#214e74',B:'#143350',W:'#d8f2ff',G:'#bff0ff'},4:{A:'#1f6fff',H:'#6aa8ff',V:'#1850c0',L:'#173f9a',B:'#0f2766',W:'#eaf6ff',G:'#aef2ff'},5:{A:'#9fb8ff',H:'#dfe9ff',V:'#7d8fe0',L:'#6f7fd0',B:'#aef2ff',W:'#ffffff',G:'#ffffff'}}[t];return {S:SKIN,F:EYE,D:'#10131a',...C};}
function mage(t){const C={1:{A:'#3a4a72',H:'#4a5c88',B:'#28324f',W:'#8a6a3a',C:'#7fd4ff',G:'#7fd4ff'},2:{A:'#3f5f9a',H:'#4f72b2',B:'#2c4068',W:'#8a6a3a',C:'#9fe6ff',G:'#9fe6ff'},3:{A:'#3a6fc0',H:'#5a92e0',B:'#274a86',W:'#9a7a4a',C:'#bff0ff',G:'#bff0ff'},4:{A:'#2f5fd8',H:'#6a90ff',B:'#1f3f9a',W:'#b89a5a',C:'#cde6ff',G:'#aef2ff'},5:{A:'#b0a8ff',H:'#e6ddff',B:'#8f8fe0',W:'#ffffff',C:'#ffffff',G:'#ffffff'}}[t];return {S:SKIN,F:EYE,D:'#10131a',V:C.A,L:C.A,...C};}
function rogue(t){const C={1:{A:'#2b3340',H:'#1d2530',V:'#222a36',L:'#202833',B:'#141820',W:'#aab0ba',G:'#7fd4ff'},2:{A:'#26384a',H:'#1a2632',V:'#203040',L:'#1d2c3a',B:'#121c26',W:'#bfe3ff',G:'#9fe6ff'},3:{A:'#21405c',H:'#172a3e',V:'#1b3550',L:'#193048',B:'#0f2236',W:'#d8f2ff',G:'#bff0ff'},4:{A:'#1a3a6e',H:'#122a52',V:'#163060',L:'#132a55',B:'#0c1d40',W:'#eaf6ff',G:'#aef2ff'},5:{A:'#7d8fe0',H:'#3a3f66',V:'#6f7fd0',L:'#6470c0',B:'#aef2ff',W:'#ffffff',G:'#ffffff'}}[t];return {S:SKIN,F:EYE,D:'#0c0f16',...C};}
const PAL = { Warrior: warrior, Mage: mage, Rogue: rogue };

const REGALIA = {
  B:[[0,5,5],[0,8,8],[0,10,10],[1,5,10]],
  A:[[0,4,11],[1,4,4],[1,11,11]],
  S:[[0,5,5],[0,8,8],[0,10,10],[1,5,10],[11,0,1],[12,0,0],[10,1,2],[11,14,15],[12,15,15],[10,13,14],[13,1,1],[13,14,14]],
};
const REG_COLOR = { B:'#bff0ff', A:'#e6f6ff', S:'#ffffff' };
const RANK_TIER = { E:1, D:2, C:3, B:4, A:5, S:5 };

function hex(h){h=h.replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}

function applyRegalia(rows, rank){
  const r = rows.map(s=>s.split(''));
  for(const [row,c0,c1] of (REGALIA[rank]||[])){ for(let c=c0;c<=c1 && c<16;c++) r[row][c]='R'; }
  return r.map(a=>a.join(''));
}

const W=16,H=18, PX=14, BW=W*PX, BH=H*PX; // 224 x 252 avatar
const PAD=40, CANVAS_W=BW+PAD*2, CANVAS_H=BH+PAD*2; // ~304 x 332
const BG=[6,10,20];

function setPx(png,x,y,r,g,b,a){ if(x<0||y<0||x>=png.width||y>=png.height) return; const i=(png.width*y+x)<<2; png.data[i]=r;png.data[i+1]=g;png.data[i+2]=b;png.data[i+3]=a; }

const OUT = path.resolve(__dirname,'..','android/app/src/main/res/drawable');
let count=0;
for(const cls of ['Warrior','Mage','Rogue']){
  for(const rank of ['E','D','C','B','A','S']){
    const png=new PNG({width:CANVAS_W,height:CANVAS_H});
    // navy bg
    for(let y=0;y<CANVAS_H;y++)for(let x=0;x<CANVAS_W;x++) setPx(png,x,y,BG[0],BG[1],BG[2],255);
    const pal=PAL[cls](RANK_TIER[rank]);
    pal.R = REG_COLOR[rank]||'#ffffff';
    const rows=applyRegalia(BASE[cls],rank);
    for(let gy=0;gy<H;gy++)for(let gx=0;gx<W;gx++){
      const ch=rows[gy][gx]; if(ch==='.'||!pal[ch]) continue;
      const [r,g,b]=hex(pal[ch]);
      for(let py=0;py<PX;py++)for(let px=0;px<PX;px++) setPx(png,PAD+gx*PX+px,PAD+gy*PX+py,r,g,b,255);
    }
    const name=`notif_${cls.toLowerCase()}_${rank.toLowerCase()}.png`;
    fs.writeFileSync(path.join(OUT,name),PNG.sync.write(png));
    count++;
  }
}
console.log(`generated ${count} avatar banners in ${OUT}`);
