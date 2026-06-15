"use client";

// ============================================================
// Digital Garden — Immersive Scene Themes v2
// ============================================================
// 按《UI主题执行摘要》规格全面重写
// · 粒子系统 · 多层渲染 · 点击交互 · 性能监测 · 无障碍
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
// (garden ecosystem removed)

// ═══════════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════════

type SceneId = "garden" | "starry" | "sakura" | "rain";
const SCENE_TABLE: Record<string, SceneId> = { garden:"garden", starry:"starry", sakura:"sakura", rain:"rain" };
function getScene(): SceneId { try { const t = localStorage.getItem("garden-theme")||"garden"; return SCENE_TABLE[t]||"garden"; } catch { return "garden"; } }

interface GardenPetal { x:number;y:number;vx:number;vy:number;rot:number;rv:number;size:number;alpha:number;phase:number;color:string }
interface Ripple { x:number;y:number;r:number;maxR:number;alpha:number }
interface LightSpot { x:number;y:number;r:number;alpha:number;phase:number }

interface Star2 { x:number;y:number;r:number;twinkleP:number;twinkleS:number;bright:number;layer:number }
interface Meteor { x:number;y:number;vx:number;vy:number;life:number;maxLife:number;alpha:number }
interface Nebula { x:number;y:number;r:number;alpha:number;vx:number }

interface SakPet { x:number;y:number;vx:number;vy:number;rot:number;rv:number;size:number;alpha:number;phase:number;color:string;driftAmp:number;driftFreq:number }
interface Koi { x:number;y:number;t:number;dir:number;size:number;phase:number;bodyColor:string;finColor:string }
interface Lantern { x:number;y:number;r:number;alpha:number;phase:number;swayAmp:number }
interface Firefly { x:number;y:number;r:number;alpha:number;phase:number;speed:number;wanderR:number;baseY:number }
interface SakuraTree { x:number;groundY:number;scale:number;depth:number;branches:Branch[];canopyCircles:CanopyCircle[] }
interface Branch { angle:number;length:number;depth:number;startX:number;startY:number }
interface CanopyCircle { x:number;y:number;r:number;alpha:number;color:string }
interface StoneLantern { x:number;y:number;scale:number }

interface RainD2 { x:number;y:number;vy:number;len:number;wind:number;alpha:number }
interface GlassDrop { x:number;y:number;r:number;vy:number;alpha:number;trail:number }
interface WindowStreak { x:number; y:number; len:number; alpha:number; speed:number; life:number }
interface Cloud { x:number;y:number;w:number;alpha:number }

// ═══════════════════════════════════════════════
//  Shared utilities
// ═══════════════════════════════════════════════

let fpsFrames = 0, fpsLast = 0, currentFPS = 60;
function tickFPS(now:number) { fpsFrames++; if(now-fpsLast>=1000){currentFPS=fpsFrames; fpsFrames=0;fpsLast=now;} }

const prefersReduced = typeof window!=="undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ═══════════════════════════════════════════════
//  ★★★ STAR RENDERER ★★★
// ═══════════════════════════════════════════════

interface AuroraRibbon { x:number; baseY:number; amp:number; freq:number; phase:number; width:number; alpha:number; color:string; speed:number }
interface GalaxyStar { x:number; y:number; r:number; alpha:number }

function genStars(n:number,w:number,h:number):Star2[]{return Array.from({length:n},()=>({x:Math.random()*w,y:Math.random()*h,r:0.4+Math.random()*2.2,twinkleP:Math.random()*Math.PI*2,twinkleS:0.006+Math.random()*0.07,bright:0.25+Math.random()*0.75,layer:Math.floor(Math.random()*3)}))}
function genMeteor(w:number,h:number):Meteor{const a=-0.6+Math.random()*0.8;return{x:Math.random()*w*0.9,y:Math.random()*h*0.25,vx:Math.cos(a)*7+2,vy:Math.sin(a)*7,life:0,maxLife:35+Math.random()*50,alpha:1}}
function genNebulae(w:number,h:number):Nebula[]{return Array.from({length:3},()=>({x:Math.random()*w,y:Math.random()*h*0.5,r:150+Math.random()*300,alpha:0.03+Math.random()*0.05,vx:0.1+Math.random()*0.2}))}
function genAurora(w:number,h:number):AuroraRibbon[]{
  const colors=["rgba(80,220,180,","rgba(60,200,200,","rgba(100,180,220,","rgba(70,210,160,"];
  return Array.from({length:4},(_,i)=>({x:0,baseY:h*0.08+i*h*0.06,amp:20+Math.random()*40,freq:0.003+Math.random()*0.005,phase:Math.random()*Math.PI*2,width:18+Math.random()*25,alpha:0.08+Math.random()*0.12,color:colors[i],speed:0.3+Math.random()*0.5}));
}
function genGalaxyStars(w:number,h:number):GalaxyStar[]{return Array.from({length:200},()=>({x:Math.random()*w,y:h*0.15+Math.random()*h*0.55,r:0.3+Math.random()*1.2,alpha:0.2+Math.random()*0.5}));}

function renderStarry(ctx:CanvasRenderingContext2D,t:number,w:number,h:number,stars:Star2[],meteors:Meteor[],nebulae:Nebula[],aurora:AuroraRibbon[],galaxy:GalaxyStar[]){
  // ── 1. Deep space gradient ─────────────────────
  const g=ctx.createLinearGradient(0,0,0,h);
  g.addColorStop(0,"#030312");g.addColorStop(0.2,"#080820");
  g.addColorStop(0.5,"#0d0d2b");g.addColorStop(0.75,"#0f0f28");
  g.addColorStop(1,"#080818");
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);

  // ── 2. Drifting noctilucent clouds ───────────────
  // Soft, glowing cloud wisps drifting across the night sky
  const cloudDefs=[{x:w*0.15,y:h*0.12,w:w*0.25,h:18,speed:0.08,alpha:0.06},{x:w*0.55,y:h*0.20,w:w*0.3,h:14,speed:0.05,alpha:0.05},
    {x:w*0.35,y:h*0.08,w:w*0.2,h:22,speed:0.1,alpha:0.04},{x:w*0.7,y:h*0.15,w:w*0.22,h:16,speed:0.06,alpha:0.055},
    {x:w*0.05,y:h*0.25,w:w*0.18,h:20,speed:0.09,alpha:0.045},{x:w*0.8,y:h*0.28,w:w*0.15,h:12,speed:0.07,alpha:0.04}];
  for(const c of cloudDefs){
    const cx=c.x+(t*c.speed*0.3)%(w+c.w*1.2)-c.w*0.6;
    // Cloud body — multiple overlapping ellipses for organic shape
    ctx.fillStyle=`rgba(180,200,230,${(c.alpha*(0.8+0.2*Math.sin(t*0.3+c.x))).toFixed(3)})`;
    ctx.beginPath();ctx.ellipse(cx,c.y,c.w,c.h,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=`rgba(200,215,240,${(c.alpha*0.7).toFixed(3)})`;
    ctx.beginPath();ctx.ellipse(cx-c.w*0.15,c.y-3,c.w*0.6,c.h*0.7,-0.1,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=`rgba(160,185,215,${(c.alpha*0.5).toFixed(3)})`;
    ctx.beginPath();ctx.ellipse(cx+c.w*0.1,c.y+2,c.w*0.5,c.h*0.8,0.1,0,Math.PI*2);ctx.fill();
    // Moonlit edge highlight
    ctx.fillStyle=`rgba(230,240,255,${(c.alpha*0.3).toFixed(3)})`;
    ctx.beginPath();ctx.ellipse(cx-c.w*0.1,c.y-c.h*0.2,c.w*0.35,c.h*0.5,-0.15,0,Math.PI*2);ctx.fill();
  }

  // ── 5. Star trails — concentric arcs around north celestial pole ──
  const poleX=w*0.48,poleY=h*0.06;
  ctx.strokeStyle="rgba(160,200,240,0.05)";ctx.lineWidth=0.5;
  for(let i=0;i<18;i++){
    const radius=h*0.18+i*h*0.035;
    const startAngle=t*0.00004+i*0.35;
    const arcLen=0.04+Math.sin(i*0.7)*0.03;
    ctx.beginPath();ctx.arc(poleX,poleY,radius,startAngle,startAngle+arcLen);ctx.stroke();
    ctx.strokeStyle="rgba(180,210,245,0.03)";ctx.lineWidth=0.4;
    ctx.beginPath();ctx.arc(poleX,poleY,radius,startAngle-0.02,startAngle+arcLen*0.6);ctx.stroke();
    ctx.strokeStyle="rgba(160,200,240,0.05)";ctx.lineWidth=0.5;
  }

  // ── 6. Constellation lines ──────────────────────
  const brightStars=stars.filter(s=>s.r>1.6&&s.bright>0.6);
  ctx.strokeStyle="rgba(180,200,240,0.08)";ctx.lineWidth=0.5;
  for(let i=0;i<brightStars.length;i++){
    for(let j=i+1;j<brightStars.length;j++){
      const dx=brightStars[i].x-brightStars[j].x;
      const dy=brightStars[i].y-brightStars[j].y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<80&&dist>10){
        ctx.beginPath();ctx.moveTo(brightStars[i].x,brightStars[i].y);
        ctx.lineTo(brightStars[j].x,brightStars[j].y);ctx.stroke();
      }
    }
  }

  // ── 7. Stars — twinkling with halo ──────────────
  for(const s of stars){
    const tw=0.5+0.5*Math.sin(t*s.twinkleS+s.twinkleP);
    const a=s.bright*(0.12+0.88*tw);
    ctx.fillStyle=`rgba(255,255,255,${a.toFixed(2)})`;
    ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();
    if(s.r>1.8&&tw>0.75){
      ctx.strokeStyle=`rgba(200,220,255,${(a*0.5).toFixed(2)})`;ctx.lineWidth=0.4;
      ctx.beginPath();ctx.moveTo(s.x-s.r*4,s.y);ctx.lineTo(s.x+s.r*4,s.y);ctx.stroke();
      ctx.beginPath();ctx.moveTo(s.x,s.y-s.r*4);ctx.lineTo(s.x,s.y+s.r*4);ctx.stroke();
    }
    if(s.r>1.5&&tw>0.6){
      ctx.fillStyle=`rgba(180,210,255,${(a*0.3).toFixed(2)})`;
      ctx.beginPath();ctx.arc(s.x,s.y,s.r*4.5,0,Math.PI*2);ctx.fill();
    }
  }

  // ── 8. Moon — crescent with earthshine ──────────
  const mx=w*0.78,my=h*0.14;
  ctx.fillStyle="rgba(40,45,70,0.6)";ctx.beginPath();ctx.arc(mx,my,38,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="rgba(255,248,220,0.95)";ctx.beginPath();ctx.arc(mx,my,38,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#030312";ctx.beginPath();ctx.arc(mx+14,my-10,33,0,Math.PI*2);ctx.fill();
  const mg=ctx.createRadialGradient(mx,my,28,mx,my,150);
  mg.addColorStop(0,"rgba(255,248,210,0.2)");mg.addColorStop(0.3,"rgba(255,240,200,0.06)");
  mg.addColorStop(1,"transparent");
  ctx.fillStyle=mg;ctx.beginPath();ctx.arc(mx,my,150,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="rgba(200,210,240,0.06)";ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(mx,my,150,0,Math.PI*2);ctx.stroke();

  // ── 9. Shooting stars — with trail & head glow ──
  for(const m of meteors){
    m.x+=m.vx;m.y+=m.vy;m.life++;
    m.alpha=1-(m.life/m.maxLife);
    if(m.life>m.maxLife){Object.assign(m,genMeteor(w,h));m.y=-10-Math.random()*30;}
    const tailLen=20+m.life*0.8;
    const mx2=m.x-m.vx*tailLen,my2=m.y-m.vy*tailLen;
    const trail=ctx.createLinearGradient(m.x,m.y,mx2,my2);
    trail.addColorStop(0,`rgba(255,255,255,${(m.alpha*0.9).toFixed(2)})`);
    trail.addColorStop(0.3,`rgba(200,220,255,${(m.alpha*0.5).toFixed(2)})`);
    trail.addColorStop(1,"transparent");
    ctx.strokeStyle=trail;ctx.lineWidth=2.5;
    ctx.beginPath();ctx.moveTo(m.x,m.y);ctx.lineTo(mx2,my2);ctx.stroke();
    ctx.fillStyle=`rgba(255,255,255,${m.alpha.toFixed(2)})`;
    ctx.beginPath();ctx.arc(m.x,m.y,3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=`rgba(200,220,255,${(m.alpha*0.4).toFixed(2)})`;
    ctx.beginPath();ctx.arc(m.x,m.y,8,0,Math.PI*2);ctx.fill();
  }

  // ── 10. Satellite / Space Station (~80px) ────────
  const satX=w*0.08+((t*1.2)%(w*0.84)), satY=h*0.2+Math.sin(t*0.06)*h*0.1;
  const satOuter=ctx.createRadialGradient(satX,satY,8,satX,satY,40);
  satOuter.addColorStop(0,"rgba(255,252,240,0.35)");satOuter.addColorStop(0.5,"rgba(200,220,255,0.1)");
  satOuter.addColorStop(1,"transparent");
  ctx.fillStyle=satOuter;ctx.beginPath();ctx.arc(satX,satY,40,0,Math.PI*2);ctx.fill();
  const satMid=ctx.createRadialGradient(satX,satY,4,satX,satY,18);
  satMid.addColorStop(0,"rgba(255,255,250,0.6)");satMid.addColorStop(0.5,"rgba(210,225,250,0.25)");
  satMid.addColorStop(1,"transparent");
  ctx.fillStyle=satMid;ctx.beginPath();ctx.arc(satX,satY,18,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="rgba(255,255,255,0.9)";ctx.beginPath();ctx.arc(satX,satY,5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="rgba(160,190,220,0.5)";
  ctx.fillRect(satX-28,satY-2.5,18,5);ctx.fillRect(satX+10,satY-2.5,18,5);
  ctx.strokeStyle="rgba(200,220,240,0.3)";ctx.lineWidth=0.5;
  ctx.strokeRect(satX-28,satY-2.5,9,5);ctx.strokeRect(satX-19,satY-2.5,9,5);
  ctx.strokeRect(satX+10,satY-2.5,9,5);ctx.strokeRect(satX+19,satY-2.5,9,5);
  ctx.fillStyle="rgba(220,230,245,0.7)";ctx.fillRect(satX-2,satY-6,4,12);

  // ── 11. Rolling hills — softer, less dark ────────
  ctx.fillStyle="rgba(12,14,28,0.65)";
  ctx.beginPath();ctx.moveTo(0,h);
  for(let x=0;x<=w;x+=25)ctx.lineTo(x,h*0.74+Math.sin(x*0.003+2)*20+Math.sin(x*0.007)*10);
  ctx.lineTo(w,h);ctx.closePath();ctx.fill();
  ctx.fillStyle="rgba(15,18,32,0.55)";
  ctx.beginPath();ctx.moveTo(0,h);
  for(let x=0;x<=w;x+=25)ctx.lineTo(x,h*0.79+Math.sin(x*0.005+1)*14+Math.sin(x*0.01+0.5)*8);
  ctx.lineTo(w,h);ctx.closePath();ctx.fill();

  // ── 12. Star-reflecting lake ─────────────────────
  const lakeY=h*0.76;
  ctx.fillStyle="rgba(25,35,60,0.65)";
  ctx.beginPath();ctx.ellipse(w*0.38,lakeY,200,28,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="rgba(60,75,100,0.3)";ctx.lineWidth=1.5;
  ctx.beginPath();ctx.ellipse(w*0.38,lakeY,200,28,0,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle="rgba(30,45,70,0.4)";
  ctx.beginPath();ctx.ellipse(w*0.38,lakeY-2,185,22,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="rgba(25,35,60,0.55)";
  ctx.beginPath();ctx.ellipse(w*0.72,lakeY+8,90,14,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="rgba(60,75,100,0.25)";ctx.lineWidth=1;
  ctx.beginPath();ctx.ellipse(w*0.72,lakeY+8,90,14,0,0,Math.PI*2);ctx.stroke();
  for(let li=0;li<2;li++){
    const lx=li===0?w*0.38:w*0.72;const ly=li===0?lakeY:lakeY+8;
    const lw=li===0?180:75;const count=li===0?20:8;
    for(let i=0;i<count;i++){
      const rx=lx-lw*0.8+i*(lw*1.6/count);const ry=ly-4+Math.sin(i*0.8)*6;
      const refFlick=0.3+0.7*Math.abs(Math.sin(t*0.5+i+li*10));
      ctx.fillStyle=`rgba(200,225,255,${(0.12*refFlick).toFixed(3)})`;
      ctx.beginPath();ctx.arc(rx,ry,1.2+Math.sin(i)*0.6,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=`rgba(180,210,245,${(0.06*refFlick).toFixed(3)})`;
      ctx.fillRect(rx-0.3,ry-1,0.6,10+Math.sin(i)*5);
    }
  }

  // ── 13. Pine forest silhouette ───────────────────
  ctx.fillStyle="rgba(8,10,20,0.7)";
  ctx.beginPath();ctx.moveTo(0,h);
  for(let x=0;x<=w;x+=12){
    const bh=h*0.76+Math.sin(x*0.008)*12+Math.sin(x*0.02)*6;
    ctx.lineTo(x,bh);
    const treeH=Math.sin(x*0.15)*18+Math.sin(x*0.07)*12+25;
    if(x%40<20){ctx.lineTo(x+3,bh-treeH*0.6);ctx.lineTo(x+6,bh);ctx.lineTo(x+2,bh-treeH);ctx.lineTo(x+8,bh);}
  }
  ctx.lineTo(w,h);ctx.closePath();ctx.fill();

  // ── 14. Distant village — sits on the hills ──────
  function hillY(x:number):number{return h*0.74+Math.sin(x*0.003+2)*20+Math.sin(x*0.007)*10;}
  const houseXs=[w*0.48,w*0.53,w*0.58,w*0.63,w*0.505,w*0.555,w*0.605];
  const houseScales=[0.9,1.0,0.85,0.8,0.65,0.7,0.75];
  const houseWins=[2,2,1,2,1,2,1];
  const winGlow=0.7+0.3*Math.sin(t*1.2);
  for(let hi=0;hi<houseXs.length;hi++){
    const hx=houseXs[hi];const hy=hillY(hx);const s=houseScales[hi];
    ctx.fillStyle="rgba(22,18,28,0.6)";
    ctx.fillRect(hx-14*s,hy-10*s,28*s,18*s);
    ctx.fillStyle="rgba(28,20,26,0.65)";
    ctx.beginPath();ctx.moveTo(hx-18*s,hy-9*s);ctx.lineTo(hx,hy-24*s);ctx.lineTo(hx+18*s,hy-9*s);ctx.closePath();ctx.fill();
    for(let wi=0;wi<houseWins[hi];wi++){
      const wx=wi===0?hx-5*s:hx+3*s;
      ctx.fillStyle=`rgba(255,200,120,${(0.5*winGlow).toFixed(2)})`;
      ctx.fillRect(wx,hy-4*s,6*s,5*s);
    }
    ctx.fillStyle="rgba(35,25,30,0.55)";ctx.fillRect(hx+8*s,hy-20*s,4*s,12*s);
  }
  const villageCenterX=houseXs.reduce((a,b)=>a+b,0)/houseXs.length;
  const villageGlow=ctx.createRadialGradient(villageCenterX,hillY(villageCenterX),12,villageCenterX,hillY(villageCenterX),65);
  villageGlow.addColorStop(0,`rgba(255,180,100,${(0.08*winGlow).toFixed(3)})`);
  villageGlow.addColorStop(1,"transparent");
  ctx.fillStyle=villageGlow;ctx.beginPath();ctx.arc(villageCenterX,hillY(villageCenterX),65,0,Math.PI*2);ctx.fill();

  // ── 15. Winding path to village ────────────────────
  ctx.fillStyle="rgba(55,50,60,0.35)";
  for(let i=0;i<7;i++){
    const px=w*0.85-i*28;const py=h*0.80+i*2.5;
    ctx.beginPath();ctx.ellipse(px,py,8+i*0.8,3,0.05*i,0,Math.PI*2);ctx.fill();
  }

  // ── 16. Ground mist — lighter, more atmospheric ──
  const gm=ctx.createLinearGradient(0,h*0.68,0,h);
  gm.addColorStop(0,"transparent");gm.addColorStop(0.4,"rgba(12,14,25,0.12)");
  gm.addColorStop(0.7,"rgba(10,12,22,0.25)");gm.addColorStop(1,"rgba(8,10,18,0.4)");
  ctx.fillStyle=gm;ctx.fillRect(0,h*0.68,w,h*0.32);
}

// ═══════════════════════════════════════════════
//  ★★★ GARDEN RENDERER ★★★
// ═══════════════════════════════════════════════

const GARDEN_COLORS=["rgba(255,180,200,","rgba(255,200,180,","rgba(255,170,190,","rgba(245,190,200,"];
function genGardenPetals(n:number,w:number,h:number):GardenPetal[]{return Array.from({length:n},()=>{const c=GARDEN_COLORS[Math.floor(Math.random()*GARDEN_COLORS.length)];return{x:Math.random()*w,y:-Math.random()*h*0.7,vy:0.15+Math.random()*0.35,vx:0,rot:Math.random()*Math.PI*2,rv:(Math.random()-0.5)*0.015,size:4+Math.random()*8,alpha:0.25+Math.random()*0.3,phase:Math.random()*Math.PI*2,color:c}})}
const SAKURA_COLORS=["rgba(255,183,197,","rgba(255,160,180,","rgba(255,140,165,","rgba(255,200,210,"];
function genSakPetals(n:number,w:number,h:number):SakPet[]{return Array.from({length:n},()=>{const c=SAKURA_COLORS[Math.floor(Math.random()*SAKURA_COLORS.length)];return{x:Math.random()*w,y:-Math.random()*h,vy:0.4+Math.random()*0.6,vx:0,rot:Math.random()*Math.PI*2,rv:(Math.random()-0.5)*0.02,size:5+Math.random()*12,alpha:0.5+Math.random()*0.4,phase:Math.random()*Math.PI*2,color:c,driftAmp:0.3+Math.random()*1.2,driftFreq:0.008+Math.random()*0.015}})}
function genLightSpots(w:number,h:number):LightSpot[]{return Array.from({length:5},()=>({x:Math.random()*w,y:Math.random()*h*0.7,r:25+Math.random()*55,alpha:0.02+Math.random()*0.04,phase:Math.random()*Math.PI*2}))}

// ═══════════════════════════════════════════════
//  Garden Canvas — atmosphere overlay only
//  Background image provides the base scene.
//  Canvas adds: light, bokeh, petals, ripples, sun glow, mouse parallax
// ═══════════════════════════════════════════════

function renderGarden(ctx:CanvasRenderingContext2D,t:number,w:number,h:number,petals:GardenPetal[],ripples:Ripple[],spots:LightSpot[],mx:number,my:number){
  // ── Sky gradient ───────────────────────────────
  const skyGrad=ctx.createLinearGradient(0,0,0,h);
  skyGrad.addColorStop(0,"#a8d8ea");skyGrad.addColorStop(0.35,"#c5dfe8");
  skyGrad.addColorStop(0.65,"#d5e8d5");skyGrad.addColorStop(1,"#9cba8c");
  ctx.fillStyle=skyGrad;ctx.fillRect(0,0,w,h);

  // ── Soft clouds ────────────────────────────────
  for(let i=0;i<5;i++){
    const cx=((t*0.015+i*0.23)%1.3-0.15)*w,cy=h*(0.08+i*0.07);
    ctx.fillStyle="rgba(255,255,255,0.12)";
    ctx.beginPath();ctx.ellipse(cx,cy,90+i*25,22+i*3,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(cx-45-i*8,cy+4,55+i*12,16,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(cx+40+i*5,cy-2,50+i*10,14,0,0,Math.PI*2);ctx.fill();
  }

  // ── Rolling hills ──────────────────────────────
  ctx.fillStyle="#7aac6a";ctx.beginPath();ctx.moveTo(0,h);
  for(let x=0;x<=w;x+=40)ctx.lineTo(x,h*0.76+Math.sin(x*0.003+1.2)*28+Math.sin(x*0.008+0.5)*12);
  ctx.lineTo(w,h);ctx.closePath();ctx.fill();
  ctx.fillStyle="#6a9c5a";ctx.beginPath();ctx.moveTo(0,h);
  for(let x=0;x<=w;x+=40)ctx.lineTo(x,h*0.82+Math.sin(x*0.005+2.1)*18+Math.sin(x*0.012+1.8)*8);
  ctx.lineTo(w,h);ctx.closePath();ctx.fill();
  ctx.fillStyle="#5a8c4a";ctx.beginPath();ctx.moveTo(0,h);
  for(let x=0;x<=w;x+=40)ctx.lineTo(x,h*0.88+Math.sin(x*0.007+0.7)*12);
  ctx.lineTo(w,h);ctx.closePath();ctx.fill();

  // Sun glow — atmospheric light
  const sx=w*0.72+mx*22, sy=h*0.15+my*10;
  const sg=ctx.createRadialGradient(sx,sy,20,sx,sy,w*0.7);
  sg.addColorStop(0,"rgba(255,248,225,0.18)");sg.addColorStop(0.2,"rgba(255,240,210,0.08)");
  sg.addColorStop(0.5,"rgba(255,230,190,0.02)");sg.addColorStop(1,"transparent");
  ctx.fillStyle=sg;ctx.fillRect(0,0,w,h);

  // Warm light wash
  const wg=ctx.createLinearGradient(0,0,0,h*0.5);
  wg.addColorStop(0,"rgba(255,250,240,0.04)");wg.addColorStop(1,"transparent");
  ctx.fillStyle=wg;ctx.fillRect(0,0,w,h*0.5);

  // Bokeh light spots
  for(const s of spots){
    const depth=0.4+s.r/200;const sx2=s.x+mx*14*depth+Math.sin(t*0.8+s.phase)*5,sy2=s.y+my*8*depth;
    const flick=0.5+0.5*Math.sin(t*0.2+s.phase);
    const a=s.alpha*flick;
    ctx.fillStyle=`rgba(255,248,220,${a.toFixed(3)})`;
    ctx.beginPath();ctx.arc(sx2,sy2,s.r,0,Math.PI*2);ctx.fill();
    if(s.r>40){ctx.fillStyle=`rgba(255,250,235,${(a*0.3).toFixed(3)})`;ctx.beginPath();ctx.arc(sx2,sy2,s.r*1.5,0,Math.PI*2);ctx.fill()}
  }

  // Petal particles
  for(const p of petals){
    p.vy=0.15+Math.random()*0.3;p.vx=Math.sin(t*0.01+p.phase)*0.35+mx*0.08;
    p.y+=p.vy;p.x+=p.vx;p.rot+=p.rv;
    if(p.y>h+30){p.y=-30;p.x=Math.random()*w;p.alpha=0.2+Math.random()*0.3}
    const a=p.alpha*(0.7+0.3*Math.sin(t*0.6+p.phase));
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=a;
    ctx.fillStyle=`${p.color}1)`;
    ctx.beginPath();const s2=p.size;
    ctx.moveTo(0,-s2*0.2);ctx.bezierCurveTo(s2*0.35,-s2*0.6,s2*0.55,-s2*0.07,0,s2*0.4);
    ctx.bezierCurveTo(-s2*0.55,-s2*0.07,-s2*0.35,-s2*0.6,0,-s2*0.2);ctx.fill();ctx.restore();
  }

  rippleDraw(ctx,ripples);

  // Glass greenhouse light streaks
  ctx.fillStyle=`rgba(255,255,255,${0.01+0.006*Math.sin(t*0.08)})`;
  ctx.beginPath();ctx.moveTo(w*0.15,0);ctx.lineTo(w*0.33,h);ctx.lineTo(w*0.36,h);ctx.lineTo(w*0.18,0);ctx.closePath();ctx.fill();
  ctx.fillStyle=`rgba(255,255,255,${0.006+0.004*Math.sin(t*0.12+1)})`;
  ctx.beginPath();ctx.moveTo(w*0.55,0);ctx.lineTo(w*0.68,h);ctx.lineTo(w*0.70,h);ctx.lineTo(w*0.57,0);ctx.closePath();ctx.fill();
}

// ═══════════════════════════════════════════════
//  ★★★ SAKURA RENDERER ★★★
// ═══════════════════════════════════════════════

const SAKURA_DEEP_COLORS=["rgba(220,120,150,","rgba(210,100,140,","rgba(230,130,160,"];
const SAKURA_TREE_COLORS=["#4a2c3a","#3d2530","#523040"];
function genKoi(w:number,h:number):Koi[]{
  const colors=[{body:"rgba(230,120,60,",fin:"rgba(250,180,150,"},{body:"rgba(220,60,50,",fin:"rgba(255,150,130,"},{body:"rgba(240,160,40,",fin:"rgba(255,200,140,"},{body:"rgba(200,80,60,",fin:"rgba(240,160,140,"}];
  return Array.from({length:3},()=>{const c=colors[Math.floor(Math.random()*colors.length)];return{x:w*0.15+Math.random()*w*0.7,y:h*0.72+Math.random()*h*0.12,t:Math.random()*Math.PI*2,dir:Math.random()>0.5?1:-1,size:18+Math.random()*20,phase:Math.random()*Math.PI*2,bodyColor:c.body,finColor:c.fin}})}
function genLanterns(w:number,h:number):Lantern[]{return Array.from({length:5},(_,i)=>({x:w*(0.12+i*0.19),y:h*(0.26+(i%3)*0.13),r:10+Math.random()*8,alpha:0.5+Math.random()*0.35,phase:Math.random()*Math.PI*2,swayAmp:2+Math.random()*4}))}
function genFireflies(w:number,h:number):Firefly[]{return Array.from({length:25},()=>({x:Math.random()*w,y:h*0.55+Math.random()*h*0.4,r:1+Math.random()*2,alpha:0,phase:Math.random()*Math.PI*2,speed:0.3+Math.random()*0.7,wanderR:30+Math.random()*80,baseY:h*0.55+Math.random()*h*0.4}))}

// Generate a stylized cherry blossom tree with branching structure
function genSakuraTree(x:number,groundY:number,scale:number):SakuraTree{
  const branches:Branch[]=[];
  const canopy:CanopyCircle[]=[];
  function branch(sx:number,sy:number,angle:number,len:number,depth:number){
    if(depth>4||len<6)return;
    const ex=sx+Math.cos(angle)*len, ey=sy+Math.sin(angle)*len;
    branches.push({angle,length:len,depth,startX:sx,startY:sy});
    const spread=0.55-depth*0.08;
    branch(ex,ey,angle-spread*0.7,len*0.62,depth+1);
    branch(ex,ey,angle+spread*0.6,len*0.58,depth+1);
    if(depth>=2&&Math.random()>0.3)branch(ex,ey,angle+spread*0.2,len*0.4,depth+1);
    if(depth>=2){
      const cc=3+depth*2;
      for(let i=0;i<cc;i++){
        const cx=ex+(Math.random()-0.5)*len*0.9;
        const cy=ey+(Math.random()-0.6)*len*0.7;
        const cr=len*0.28+Math.random()*len*0.5;
        const cAlpha=0.55+Math.random()*0.35;
        const cset=Math.random()>0.5?SAKURA_DEEP_COLORS:SAKURA_COLORS;
        canopy.push({x:cx,y:cy,r:cr,alpha:cAlpha,color:cset[Math.floor(Math.random()*cset.length)]});
      }
    }
  }
  branch(x,groundY,-Math.PI/2,55*scale,0);
  branch(x,groundY-12*scale,-Math.PI/2-0.5,38*scale,1);
  branch(x,groundY-8*scale,-Math.PI/2+0.45,42*scale,1);
  return {x,groundY,scale,depth:groundY,branches,canopyCircles:canopy};
}

// ── Drawing helpers for sakura scene ────────────────────

function drawToriiGate(ctx:CanvasRenderingContext2D,x:number,baseY:number,scale:number,t:number){
  const s=scale;
  // Pillars — vermillion, slightly tapered
  ctx.fillStyle="rgba(190,55,40,0.7)";
  ctx.fillRect(x-20*s,baseY-100*s,11*s,100*s); // left
  ctx.fillRect(x+9*s,baseY-100*s,11*s,100*s);  // right
  // Pillar highlight (3D feel)
  ctx.fillStyle="rgba(220,100,70,0.25)";
  ctx.fillRect(x-18*s,baseY-98*s,4*s,96*s);
  ctx.fillRect(x+11*s,baseY-98*s,4*s,96*s);
  // Shimaki (lower crossbeam)
  ctx.fillStyle="rgba(50,30,25,0.75)";
  ctx.fillRect(x-24*s,baseY-108*s,58*s,9*s);
  // Kasagi (upper main beam) — thick, imposing
  ctx.fillStyle="rgba(55,32,28,0.8)";
  ctx.fillRect(x-26*s,baseY-118*s,62*s,10*s);
  // Kasagi top curve (the iconic upward sweep)
  ctx.fillStyle="rgba(55,32,28,0.8)";
  ctx.beginPath();ctx.moveTo(x-28*s,baseY-118*s);
  ctx.quadraticCurveTo(x-10*s,baseY-134*s,x,baseY-132*s);
  ctx.quadraticCurveTo(x+10*s,baseY-134*s,x+28*s,baseY-118*s);
  ctx.lineTo(x+26*s,baseY-116*s);
  ctx.quadraticCurveTo(x+10*s,baseY-128*s,x,baseY-126*s);
  ctx.quadraticCurveTo(x-10*s,baseY-128*s,x-26*s,baseY-116*s);
  ctx.closePath();ctx.fill();
  // Gakuzuka (center plaque)
  ctx.fillStyle="rgba(60,40,30,0.6)";
  ctx.fillRect(x-3*s,baseY-112*s,6*s,10*s);
  // Kusabi (wedges) at pillar-beam joints
  ctx.fillStyle="rgba(40,25,20,0.6)";
  ctx.fillRect(x-20*s,baseY-110*s,5*s,5*s);
  ctx.fillRect(x+15*s,baseY-110*s,5*s,5*s);
  // Base stones
  ctx.fillStyle="rgba(110,100,90,0.55)";
  ctx.fillRect(x-22*s,baseY-2*s,15*s,6*s);
  ctx.fillRect(x+7*s,baseY-2*s,15*s,6*s);
  // Stone texture lines
  ctx.strokeStyle="rgba(90,80,70,0.2)";ctx.lineWidth=0.4;
  ctx.strokeRect(x-22*s,baseY-2*s,15*s,6*s);
  ctx.strokeRect(x+7*s,baseY-2*s,15*s,6*s);
  // Ground shadow
  ctx.fillStyle="rgba(0,0,0,0.1)";
  ctx.beginPath();ctx.ellipse(x,baseY+2*s,30*s,4*s,0,0,Math.PI*2);ctx.fill();
}

function drawShrine(ctx:CanvasRenderingContext2D,x:number,baseY:number,scale:number,t:number){
  const s=scale;
  // Stone base platform
  ctx.fillStyle="rgba(130,120,105,0.65)";
  ctx.fillRect(x-58*s,baseY-10*s,116*s,12*s);
  ctx.fillStyle="rgba(145,135,118,0.55)";
  ctx.fillRect(x-56*s,baseY-12*s,112*s,4*s);
  // Steps (4 tiers — more grand)
  for(let i=0;i<4;i++){
    ctx.fillStyle=`rgba(${155-i*8},${145-i*8},${125-i*8},0.65)`;
    ctx.fillRect(x-16*s-i*7*s,baseY-10*s-(i+1)*5*s,32*s+14*s*i,5*s);
  }
  // Wall body — wider, more imposing
  ctx.fillStyle="rgba(245,235,220,0.7)";
  ctx.fillRect(x-42*s,baseY-62*s,84*s,52*s);
  // Wall panel lines (vertical)
  ctx.strokeStyle="rgba(200,180,160,0.2)";ctx.lineWidth=0.6;
  for(let px=-28;px<=28;px+=14){
    ctx.beginPath();ctx.moveTo(x+px*s,baseY-62*s);ctx.lineTo(x+px*s,baseY-10*s);ctx.stroke();
  }
  // Main pillars — thicker, darker
  ctx.fillStyle="rgba(70,40,25,0.7)";
  for(let px=-38;px<=38;px+=19){
    ctx.fillRect(x+px*s-4*s,baseY-66*s,8*s,60*s);
  }
  // Open entrance (center) — dark opening
  ctx.fillStyle="rgba(30,20,15,0.5)";
  ctx.fillRect(x-10*s,baseY-38*s,20*s,28*s);
  // Entrance steps highlight
  ctx.fillStyle="rgba(170,155,135,0.4)";
  ctx.fillRect(x-12*s,baseY-10*s,24*s,2*s);
  // Side lattice panels
  ctx.fillStyle="rgba(50,35,25,0.35)";
  ctx.fillRect(x-30*s,baseY-48*s,14*s,22*s);
  ctx.fillRect(x+16*s,baseY-48*s,14*s,22*s);
  // Lattice lines
  ctx.strokeStyle="rgba(60,45,30,0.25)";ctx.lineWidth=0.6;
  for(let lx of[x-30*s,x+16*s]){
    ctx.beginPath();ctx.moveTo(lx,baseY-37*s);ctx.lineTo(lx+14*s,baseY-37*s);ctx.stroke();
    ctx.beginPath();ctx.moveTo(lx+7*s,baseY-48*s);ctx.lineTo(lx+7*s,baseY-26*s);ctx.stroke();
  }
  // Offering box (saisenbako) — center front
  ctx.fillStyle="rgba(80,50,30,0.55)";
  ctx.fillRect(x-7*s,baseY-18*s,14*s,8*s);
  ctx.fillStyle="rgba(100,70,45,0.4)";
  ctx.fillRect(x-6*s,baseY-19*s,12*s,2*s);
  // Ema boards (right side)
  for(let ei=0;ei<3;ei++){
    ctx.fillStyle="rgba(200,170,130,0.45)";
    ctx.fillRect(x+28*s,baseY-50*s+ei*10*s,8*s,9*s);
    ctx.strokeStyle="rgba(150,120,80,0.3)";ctx.lineWidth=0.4;
    ctx.strokeRect(x+28*s,baseY-50*s+ei*10*s,8*s,9*s);
  }
  // Main roof — sweeping, grand curve
  ctx.fillStyle="rgba(35,30,42,0.75)";
  ctx.beginPath();ctx.moveTo(x-56*s,baseY-62*s);
  ctx.quadraticCurveTo(x-52*s,baseY-82*s,x-18*s,baseY-76*s);
  ctx.quadraticCurveTo(x,baseY-84*s,x+18*s,baseY-76*s);
  ctx.quadraticCurveTo(x+52*s,baseY-82*s,x+56*s,baseY-62*s);
  ctx.lineTo(x+50*s,baseY-60*s);
  ctx.quadraticCurveTo(x+46*s,baseY-76*s,x+14*s,baseY-70*s);
  ctx.quadraticCurveTo(x,baseY-78*s,x-14*s,baseY-70*s);
  ctx.quadraticCurveTo(x-46*s,baseY-76*s,x-50*s,baseY-60*s);
  ctx.closePath();ctx.fill();
  // Roof tile lines
  ctx.strokeStyle="rgba(50,45,55,0.3)";ctx.lineWidth=0.5;
  for(let i=-8;i<=8;i++){
    const tx=x+i*6*s;const ty=baseY-63*s-Math.abs(i)*2*s;
    ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx+i*0.5*s,ty-16*s-Math.abs(i)*0.5*s);ctx.stroke();
  }
  // Roof ridge detail
  ctx.fillStyle="rgba(25,20,30,0.8)";
  ctx.fillRect(x-4*s,baseY-86*s,8*s,6*s);
  // Chigi (forked roof ornaments)
  ctx.fillStyle="rgba(30,25,35,0.7)";
  ctx.beginPath();ctx.moveTo(x-20*s,baseY-82*s);ctx.lineTo(x-22*s,baseY-92*s);ctx.lineTo(x-16*s,baseY-82*s);ctx.fill();
  ctx.beginPath();ctx.moveTo(x+20*s,baseY-82*s);ctx.lineTo(x+22*s,baseY-92*s);ctx.lineTo(x+16*s,baseY-82*s);ctx.fill();
  // 2 Lanterns under eaves
  for(let lr of[-1,1]){
    const lx2=x+lr*18*s,ly2=baseY-62*s+Math.sin(t*1.2+lr)*2;
    ctx.strokeStyle="rgba(30,25,35,0.35)";ctx.lineWidth=0.5;
    ctx.beginPath();ctx.moveTo(lx2,ly2-8*s);ctx.lineTo(lx2,ly2);ctx.stroke();
    ctx.fillStyle="rgba(255,200,140,0.55)";
    ctx.beginPath();ctx.ellipse(lx2,ly2+5*s,5*s,7*s,0,0,Math.PI*2);ctx.fill();
  }
  // Shimenawa above entrance
  ctx.strokeStyle="rgba(180,150,100,0.45)";ctx.lineWidth=1.8;
  ctx.beginPath();ctx.moveTo(x-16*s,baseY-42*s);ctx.quadraticCurveTo(x,baseY-45*s,x+16*s,baseY-42*s);ctx.stroke();
}

function drawReimu(ctx:CanvasRenderingContext2D,x:number,baseY:number,scale:number,t:number){
  const s=scale;
  const bob=Math.sin(t*1.5)*1.5*s;
  // Ground shadow
  ctx.fillStyle="rgba(0,0,0,0.12)";
  ctx.beginPath();ctx.ellipse(x,baseY+2*s,13*s,3*s,0,0,Math.PI*2);ctx.fill();
  // Red hakama — flowing, A-line
  ctx.fillStyle="#cc1530";
  ctx.beginPath();ctx.moveTo(x-8*s,baseY-16*s+bob);
  ctx.lineTo(x+8*s,baseY-16*s+bob);
  ctx.lineTo(x+12*s,baseY+2*s+bob);
  ctx.lineTo(x-12*s,baseY+2*s+bob);
  ctx.closePath();ctx.fill();
  // Hakama pleats
  ctx.strokeStyle="rgba(140,10,25,0.35)";ctx.lineWidth=0.5;
  for(let pl=-4;pl<=4;pl+=4){
    ctx.beginPath();ctx.moveTo(x+pl*s,baseY-16*s+bob);ctx.lineTo(x+pl*1.3*s,baseY+2*s+bob);ctx.stroke();
  }
  // White kosode (upper)
  ctx.fillStyle="#faf5ed";
  ctx.beginPath();ctx.moveTo(x-6*s,baseY-18*s+bob);
  ctx.lineTo(x+6*s,baseY-18*s+bob);
  ctx.lineTo(x+9*s,baseY-27*s+bob);
  ctx.lineTo(x-9*s,baseY-27*s+bob);
  ctx.closePath();ctx.fill();
  // Red collar ribbon
  ctx.fillStyle="#cc1530";
  ctx.beginPath();ctx.arc(x,baseY-22*s+bob,3*s,0,Math.PI*2);ctx.fill();
  // Detached sleeves — wider, flowing
  ctx.fillStyle="#faf5ed";
  ctx.beginPath();ctx.ellipse(x-12*s,baseY-18*s+bob,6*s,13*s,-0.25,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(x+12*s,baseY-18*s+bob,6*s,13*s,0.25,0,Math.PI*2);ctx.fill();
  // Sleeve red trim
  ctx.strokeStyle="rgba(200,20,40,0.3)";ctx.lineWidth=0.8;
  ctx.beginPath();ctx.ellipse(x-12*s,baseY-18*s+bob,6*s,13*s,-0.25,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.ellipse(x+12*s,baseY-18*s+bob,6*s,13*s,0.25,0,Math.PI*2);ctx.stroke();
  // Neck
  ctx.fillStyle="#fce4d6";
  ctx.fillRect(x-2*s,baseY-30*s+bob,4*s,4*s);
  // Head — slightly larger
  ctx.fillStyle="#fce4d6";
  ctx.beginPath();ctx.arc(x,baseY-34*s+bob,8*s,0,Math.PI*2);ctx.fill();
  // Hair — dark brown, more volume
  ctx.fillStyle="#3d1c02";
  ctx.beginPath();ctx.arc(x,baseY-36*s+bob,10*s,Math.PI,Math.PI*2);ctx.fill();
  ctx.fillRect(x-9*s,baseY-39*s+bob,18*s,8*s);
  // Side locks
  ctx.fillRect(x-8*s,baseY-36*s+bob,4*s,8*s);
  ctx.fillRect(x+4*s,baseY-36*s+bob,4*s,8*s);
  // Ahoge (antenna hair)
  ctx.strokeStyle="rgba(60,28,5,0.6)";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(x+2*s,baseY-44*s+bob);
  ctx.quadraticCurveTo(x+6*s,baseY-50*s+bob,x+4*s,baseY-48*s+bob);ctx.stroke();
  // Giant red bow
  ctx.fillStyle="#d01530";
  ctx.beginPath();ctx.ellipse(x-4*s,baseY-43*s+bob,8*s,5*s,-0.35,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(x+4*s,baseY-43*s+bob,8*s,5*s,0.35,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x,baseY-44*s+bob,4*s,0,Math.PI*2);ctx.fill();
  // Bow tails (flowing ribbons)
  ctx.fillStyle="rgba(200,18,40,0.7)";
  ctx.beginPath();ctx.moveTo(x-2*s,baseY-43*s+bob);ctx.quadraticCurveTo(x-8*s,baseY-38*s+bob,x-10*s,baseY-34*s+bob);
  ctx.quadraticCurveTo(x-7*s,baseY-40*s+bob,x-3*s,baseY-43*s+bob);ctx.fill();
  ctx.beginPath();ctx.moveTo(x+2*s,baseY-43*s+bob);ctx.quadraticCurveTo(x+8*s,baseY-38*s+bob,x+10*s,baseY-34*s+bob);
  ctx.quadraticCurveTo(x+7*s,baseY-40*s+bob,x+3*s,baseY-43*s+bob);ctx.fill();
  // Gohei wand
  const gx=x+12*s,gy=baseY-16*s+bob;
  ctx.strokeStyle="#8B6914";ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(gx,gy-14*s);ctx.lineTo(gx,gy+10*s);ctx.stroke();
  ctx.fillStyle="#ffffff";
  for(let i=0;i<3;i++){
    const py=gy-14*s+i*8*s;
    ctx.beginPath();ctx.moveTo(gx,py);ctx.lineTo(gx+7*s,py-5*s);ctx.lineTo(gx,py-9*s);ctx.fill();
  }
}

function drawStoneLantern(ctx:CanvasRenderingContext2D,x:number,baseY:number,scale:number){
  const s=scale;
  // Base
  ctx.fillStyle="rgba(120,110,100,0.55)";
  ctx.fillRect(x-5*s,baseY-2*s,10*s,4*s);
  ctx.fillRect(x-4*s,baseY-6*s,8*s,4*s);
  // Pillar
  ctx.fillStyle="rgba(130,120,110,0.5)";
  ctx.fillRect(x-3*s,baseY-18*s,6*s,12*s);
  // Light chamber
  ctx.fillStyle="rgba(140,130,115,0.5)";
  ctx.fillRect(x-5*s,baseY-22*s,10*s,5*s);
  // Top cap
  ctx.fillStyle="rgba(130,120,110,0.5)";
  ctx.beginPath();ctx.moveTo(x-6*s,baseY-22*s);ctx.lineTo(x+6*s,baseY-22*s);
  ctx.lineTo(x+3*s,baseY-26*s);ctx.lineTo(x-3*s,baseY-26*s);
  ctx.closePath();ctx.fill();
  // Light glow
  ctx.fillStyle=`rgba(255,200,120,0.08)`;
  ctx.beginPath();ctx.arc(x,baseY-19*s,8*s,0,Math.PI*2);ctx.fill();
}

function renderSakura(ctx:CanvasRenderingContext2D,t:number,w:number,h:number,petals:SakPet[],kois:Koi[],lanterns:Lantern[],fireflies:Firefly[],ripples:Ripple[],trees:SakuraTree[],stoneLanterns:StoneLantern[]){
  // ── 1. Sky — golden hour twilight ────────────────
  const sky=ctx.createLinearGradient(0,0,0,h);
  sky.addColorStop(0,"#d4a8b8");sky.addColorStop(0.2,"#e2bec8");
  sky.addColorStop(0.45,"#efd5d0");sky.addColorStop(0.7,"#dcc8c0");
  sky.addColorStop(0.9,"#b8a898");sky.addColorStop(1,"#8a7a6c");
  ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);

  // ── 2. Sun glow ──────────────────────────────────
  const sx=w*0.58,sy=h*0.22;
  const sun=ctx.createRadialGradient(sx,sy,15,sx,sy,w*0.55);
  sun.addColorStop(0,"rgba(255,235,210,0.45)");sun.addColorStop(0.15,"rgba(255,215,185,0.2)");
  sun.addColorStop(0.4,"rgba(255,200,170,0.05)");sun.addColorStop(1,"transparent");
  ctx.fillStyle=sun;ctx.fillRect(0,0,w,h);

  // Sun rays (subtle diagonal beams)
  ctx.save();ctx.globalAlpha=0.04;
  for(let i=0;i<5;i++){
    const rx=sx-50+i*30;ctx.fillStyle="#fff8e8";
    ctx.beginPath();ctx.moveTo(rx,sy-20);ctx.lineTo(rx+60,sy+200);ctx.lineTo(rx+120,sy+200);ctx.lineTo(rx+30,sy-20);ctx.fill();
  }
  ctx.restore();

  // ── 3. Distant mountains (3 layers) ──────────────
  const mtColors=["#c8a8b0","#b898a0","#a08088"];
  for(let layer=0;layer<3;layer++){
    const mtY=h*0.6+layer*35;
    ctx.fillStyle=mtColors[layer];ctx.beginPath();ctx.moveTo(0,h);
    for(let x=0;x<=w;x+=30){
      const hVar=Math.sin(x*0.004+layer*1.7)*22+Math.sin(x*0.009+layer)*10+Math.sin(x*0.015+layer*2.5)*6;
      ctx.lineTo(x,mtY-hVar-layer*8);
    }
    ctx.lineTo(w,h);ctx.closePath();ctx.fill();
  }

  // Mountain mist
  const mist=ctx.createLinearGradient(0,h*0.55,0,h*0.7);
  mist.addColorStop(0,"rgba(240,225,220,0)");mist.addColorStop(0.5,"rgba(240,225,220,0.25)");mist.addColorStop(1,"rgba(240,225,220,0)");
  ctx.fillStyle=mist;ctx.fillRect(0,h*0.55,w,h*0.15);

  // ── 4. Ground — gentle slopes ────────────────────
  ctx.fillStyle="#c8b0a0";ctx.beginPath();ctx.moveTo(0,h);
  for(let x=0;x<=w;x+=30)ctx.lineTo(x,h*0.72+Math.sin(x*0.006+0.8)*12+Math.sin(x*0.014+2)*5);
  ctx.lineTo(w,h);ctx.closePath();ctx.fill();

  ctx.fillStyle="#b8a090";ctx.beginPath();ctx.moveTo(0,h);
  for(let x=0;x<=w;x+=30)ctx.lineTo(x,h*0.78+Math.sin(x*0.008+1.5)*8+Math.sin(x*0.018)*4);
  ctx.lineTo(w,h);ctx.closePath();ctx.fill();

  // ── 5. Pond — natural shape with shoreline & reflections ──
  const pondY=h*0.75, pondH=h*0.11;
  // Shoreline border
  ctx.fillStyle="rgba(100,120,130,0.3)";
  ctx.beginPath();ctx.ellipse(w*0.5,pondY+pondH*0.5,w*0.4,pondH*0.5+3,0,0,Math.PI*2);ctx.fill();
  // Pond body gradient
  const pondGrad=ctx.createLinearGradient(0,pondY,0,pondY+pondH);
  pondGrad.addColorStop(0,"rgba(100,150,175,0.4)");pondGrad.addColorStop(0.3,"rgba(80,130,160,0.5)");
  pondGrad.addColorStop(0.6,"rgba(60,110,145,0.45)");pondGrad.addColorStop(1,"rgba(50,100,135,0.35)");
  ctx.fillStyle=pondGrad;
  ctx.beginPath();ctx.ellipse(w*0.5,pondY+pondH*0.5,w*0.4,pondH*0.5,0,0,Math.PI*2);ctx.fill();
  // Water surface shimmer bands
  for(let bi=0;bi<4;bi++){
    const by=pondY+4+bi*pondH*0.2;
    ctx.fillStyle=`rgba(180,210,230,${(0.04+0.03*Math.sin(t*0.7+bi)).toFixed(3)})`;
    ctx.beginPath();ctx.ellipse(w*0.5,by,w*0.35,2,0,0,Math.PI*2);ctx.fill();
  }
  // Sakura petals floating on pond
  for(let fi=0;fi<8;fi++){
    const fx=w*0.15+fi*w*0.1;const fy=pondY+2+Math.sin(fi*1.5)*pondH*0.4;
    ctx.fillStyle=`rgba(255,180,200,${(0.2+0.15*Math.sin(t*0.4+fi)).toFixed(2)})`;
    ctx.beginPath();ctx.ellipse(fx,fy,3+Math.sin(fi)*1,1.5,fi*0.5,0,Math.PI*2);ctx.fill();
  }
  // Lily pads
  for(let li=0;li<3;li++){
    const lx=w*0.25+li*w*0.2;const ly=pondY+4+Math.sin(li)*pondH*0.3;
    ctx.fillStyle="rgba(100,160,120,0.35)";
    ctx.beginPath();ctx.arc(lx,ly,7+Math.sin(li)*2,0,Math.PI*1.8);ctx.fill();
    ctx.strokeStyle="rgba(80,140,100,0.25)";ctx.lineWidth=0.5;
    ctx.beginPath();ctx.arc(lx,ly,7+Math.sin(li)*2,0,Math.PI*1.8);ctx.stroke();
  }

  rippleDraw(ctx,ripples);

  // ── 6. Koi fish — graceful swimming ──────────────
  for(const k of kois){
    k.t+=0.007;k.x+=Math.cos(k.t*k.dir)*0.3;k.y+=Math.sin(k.t*0.5)*0.15;
    if(k.x>w*0.85||k.x<w*0.15)k.dir*=-1;
    const tailWag=Math.sin(k.t*4)*0.15;
    ctx.save();ctx.translate(k.x,k.y);ctx.scale(k.dir,1);
    // Body
    ctx.fillStyle=`${k.bodyColor}0.7)`;ctx.beginPath();
    ctx.ellipse(0,0,k.size*0.5,k.size*0.13,0,0,Math.PI*2);ctx.fill();
    // Dorsal highlight
    ctx.fillStyle=`${k.bodyColor}0.4)`;
    ctx.beginPath();ctx.ellipse(0,-k.size*0.04,k.size*0.35,k.size*0.04,0,0,Math.PI*2);ctx.fill();
    // Head
    ctx.fillStyle=`${k.bodyColor}0.8)`;ctx.beginPath();
    ctx.ellipse(k.size*0.3,0,k.size*0.16,k.size*0.09,0,0,Math.PI*2);ctx.fill();
    // Tail fin — flowing
    ctx.fillStyle=`${k.finColor}0.55)`;ctx.beginPath();
    ctx.moveTo(-k.size*0.42,0);
    ctx.quadraticCurveTo(-k.size*0.65,-k.size*0.18,-k.size*0.6,-k.size*0.25+tailWag*k.size*0.1);
    ctx.quadraticCurveTo(-k.size*0.38,-k.size*0.05,-k.size*0.42,0);ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-k.size*0.42,0);
    ctx.quadraticCurveTo(-k.size*0.65,k.size*0.18,-k.size*0.6,k.size*0.25-tailWag*k.size*0.1);
    ctx.quadraticCurveTo(-k.size*0.38,k.size*0.05,-k.size*0.42,0);ctx.fill();
    // Pectoral fins
    ctx.fillStyle=`${k.finColor}0.4)`;
    ctx.beginPath();ctx.ellipse(k.size*0.15,-k.size*0.08,k.size*0.1,k.size*0.04,-0.5,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(k.size*0.15,k.size*0.08,k.size*0.1,k.size*0.04,0.5,0,Math.PI*2);ctx.fill();
    // Eye
    ctx.fillStyle="rgba(0,0,0,0.5)";ctx.beginPath();
    ctx.arc(k.size*0.35,-k.size*0.03,k.size*0.03,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="rgba(255,255,255,0.6)";ctx.beginPath();
    ctx.arc(k.size*0.36,-k.size*0.04,k.size*0.012,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  // ── 7. Cherry blossom trees ──────────────────────
  // Sort trees by y for depth ordering
  const sortedTrees=[...trees].sort((a,b)=>a.groundY-b.groundY);
  for(const tree of sortedTrees){
    const sway=Math.sin(t*0.3+tree.x*0.01)*0.03;
    // Trunk and branches
    for(const b of tree.branches){
      const alpha=0.55+b.depth*0.08;
      const width=Math.max(1.5,8-b.depth*1.5);
      ctx.strokeStyle=`${SAKURA_TREE_COLORS[b.depth%3]}${alpha.toFixed(2)})`;
      ctx.lineWidth=width;ctx.lineCap="round";
      ctx.beginPath();ctx.moveTo(b.startX,b.startY);
      const ex=b.startX+Math.cos(b.angle+sway)*b.length;
      const ey=b.startY+Math.sin(b.angle+sway)*b.length;
      const cpx=b.startX+Math.cos(b.angle+sway)*b.length*0.6+Math.sin(b.depth)*b.length*0.15;
      const cpy=b.startY+Math.sin(b.angle+sway)*b.length*0.6;
      ctx.quadraticCurveTo(cpx,cpy,ex,ey);ctx.stroke();
    }
    // Canopy clusters
    for(const c of tree.canopyCircles){
      const cx=c.x+Math.sin(t*0.5+c.y*0.02)*3;
      const cy=c.y+Math.sin(t*0.4+c.x*0.01)*2;
      const flick=0.85+0.15*Math.sin(t*0.7+c.x*0.03);
      ctx.fillStyle=`${c.color}${(c.alpha*flick).toFixed(2)})`;
      ctx.beginPath();
      // Slightly irregular circles for organic look
      const irr=1+0.08*Math.sin(cx*0.1+cy*0.1);
      ctx.arc(cx,cy,c.r*irr,0,Math.PI*2);ctx.fill();
      // Soft edge glow on larger clusters
      if(c.r>25){
        ctx.fillStyle=`${c.color}${(c.alpha*flick*0.3).toFixed(2)})`;
        ctx.beginPath();ctx.arc(cx,cy,c.r*1.35,0,Math.PI*2);ctx.fill();
      }
    }
  }

  // ── 8. Shrine (left side, mid-ground) ────────────
  drawShrine(ctx,w*0.22,h*0.76,1.0,t);

  // ── 9. Grand Torii gate (明神門, right side) ──────
  drawToriiGate(ctx,w*0.58,h*0.77,1.15,t);

  // ── 10. Reimu — shrine maiden near the shrine ────
  drawReimu(ctx,w*0.13,h*0.78,0.95,t);

  // ── 11. Stone path from torii toward shrine ──────
  ctx.fillStyle="rgba(155,140,125,0.35)";
  for(let i=0;i<8;i++){
    const sx2=w*0.38+i*28;const sy2=h*0.79+i*3;
    ctx.beginPath();ctx.ellipse(sx2,sy2,14+i*1.5,5+i*0.4,0.08*i,0,Math.PI*2);ctx.fill();
  }

  // ── 12. Stone lanterns along the path ────────────
  for(const sl of stoneLanterns)drawStoneLantern(ctx,sl.x,sl.y,sl.scale);

  // ── 13. Lanterns — floating, swaying, with glow ──
  for(const l of lanterns){
    const swayX=Math.sin(t*0.9+l.phase)*l.swayAmp;
    const swayY=Math.cos(t*0.7+l.phase)*l.swayAmp*0.5;
    const flick=0.7+0.3*Math.sin(t*1.5+l.phase);
    const lx=l.x+swayX, ly=l.y+swayY;
    // Outer glow
    const glow=ctx.createRadialGradient(lx,ly,l.r*0.3,lx,ly,l.r*3);
    glow.addColorStop(0,`rgba(255,200,120,${(0.25*flick).toFixed(2)})`);
    glow.addColorStop(0.5,`rgba(255,180,100,${(0.1*flick).toFixed(2)})`);
    glow.addColorStop(1,"transparent");
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(lx,ly,l.r*3,0,Math.PI*2);ctx.fill();
    // Lantern body
    ctx.fillStyle=`rgba(255,200,100,${(l.alpha*flick).toFixed(2)})`;
    ctx.shadowColor="rgba(255,160,60,0.4)";ctx.shadowBlur=18;
    ctx.beginPath();ctx.arc(lx,ly,l.r,0,Math.PI*2);ctx.fill();
    // Lantern string
    ctx.strokeStyle="rgba(60,45,35,0.25)";ctx.lineWidth=0.8;ctx.shadowBlur=0;
    ctx.beginPath();ctx.moveTo(lx,ly-l.r);ctx.lineTo(lx+swayX*2,ly-l.r-25);ctx.stroke();
  }

  // ── 14. Fireflies — wandering near ground ────────
  for(const f of fireflies){
    f.phase+=f.speed*0.02;
    f.x+=Math.cos(f.phase)*f.speed*0.6;
    f.y=f.baseY+Math.sin(f.phase*0.7)*f.wanderR;
    if(f.x<0)f.x=w;if(f.x>w)f.x=0;
    const pulse=0.4+0.6*Math.abs(Math.sin(f.phase));
    f.alpha=pulse*0.8;
    if(pulse>0.3){
      ctx.fillStyle=`rgba(255,250,200,${(pulse*0.7).toFixed(2)})`;
      ctx.shadowColor="rgba(255,240,180,0.5)";ctx.shadowBlur=6;
      ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
    }
  }

  // ── 15. Sakura petals → handled by Ambient Effects system ──

  // ── 16. Ground cover — grass & moss ──────────────
  ctx.fillStyle="rgba(55,40,35,0.55)";
  ctx.fillRect(0,h*0.84,w,h*0.16);
  // Grass tufts
  for(let i=0;i<w;i+=18){
    const gx=i+Math.sin(i*0.3)*4;
    const gh=3+Math.abs(Math.sin(i*0.7+t*0.2))*5;
    ctx.strokeStyle=`rgba(70,55,45,${(0.3+Math.abs(Math.sin(i+t))*0.2).toFixed(2)})`;
    ctx.lineWidth=0.7;
    ctx.beginPath();ctx.moveTo(gx,h*0.84);ctx.lineTo(gx+2,h*0.84-gh);ctx.stroke();
    ctx.beginPath();ctx.moveTo(gx,Math.max(0,h*0.84-1));ctx.lineTo(gx-1,h*0.84-gh*0.7);ctx.stroke();
  }
}

// ═══════════════════════════════════════════════
//  ★★★ RAIN RENDERER ★★★
// ═══════════════════════════════════════════════

interface LightningBolt { x:number; y:number; segments:{dx:number;dy:number}[][]; alpha:number; life:number; maxLife:number }
interface DistantLight { x:number; y:number; r:number; alpha:number; flickerP:number; color:string }

function genRainDrops(n:number,w:number,h:number):RainD2[]{return Array.from({length:n},()=>({x:Math.random()*(w+200)-100,y:Math.random()*h-h,vy:6+Math.random()*12,len:10+Math.random()*25,wind:-0.4+Math.random()*0.3,alpha:0.12+Math.random()*0.22}))}
function genClouds(w:number,h:number):Cloud[]{return Array.from({length:5},()=>({x:Math.random()*w,y:h*0.03+Math.random()*h*0.3,w:250+Math.random()*450,alpha:0.12+Math.random()*0.22}))}
function genDistantLights(w:number,h:number):DistantLight[]{
  const colors=["rgba(255,240,200,","rgba(255,220,180,","rgba(200,200,240,","rgba(255,200,150,"];
  return Array.from({length:18},()=>({x:w*0.1+Math.random()*w*0.8,y:h*0.6+Math.random()*h*0.2,r:2+Math.random()*5,alpha:0.2+Math.random()*0.5,flickerP:Math.random()*Math.PI*2,color:colors[Math.floor(Math.random()*colors.length)]}));
}
// Glass droplets with state machine: growing → sliding → reset (creates natural flow)
function genGlassDrops(n:number,w:number,h:number):GlassDrop[]{return Array.from({length:n},()=>({x:Math.random()*w,y:Math.random()*h,r:3+Math.random()*10,vy:0.3+Math.random()*0.9,alpha:0.3+Math.random()*0.35,trail:0}))}
function genWindowStreaks(w:number,h:number):WindowStreak[]{return Array.from({length:40},()=>({x:Math.random()*w,y:Math.random()*h*0.7,len:6+Math.random()*40,alpha:0.1+Math.random()*0.3,speed:0.3+Math.random()*1.2,life:Math.random()*300}))}

function renderRain(ctx:CanvasRenderingContext2D,t:number,w:number,h:number,drops:RainD2[],glassDrops:GlassDrop[],clouds:Cloud[],ripples:Ripple[],distLights:DistantLight[],windowStreaks:WindowStreak[]){
  // ── 1. Sky gradient — moody blue-grey ──────────
  const g=ctx.createLinearGradient(0,0,0,h);
  g.addColorStop(0,"#141428");g.addColorStop(0.3,"#1c1c32");
  g.addColorStop(0.6,"#222238");g.addColorStop(0.85,"#1a1a2a");
  g.addColorStop(1,"#101020");
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);

  // ── 2. Distant blurred city/town lights ──────────
  for(const dl of distLights){
    const flick=0.6+0.4*Math.sin(t*2.5+dl.flickerP);
    const glow=ctx.createRadialGradient(dl.x,dl.y,0,dl.x,dl.y,dl.r*4);
    glow.addColorStop(0,`${dl.color}${(dl.alpha*flick*0.8).toFixed(3)})`);
    glow.addColorStop(0.5,`${dl.color}${(dl.alpha*flick*0.2).toFixed(3)})`);
    glow.addColorStop(1,"transparent");
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(dl.x,dl.y,dl.r*4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=`${dl.color}${(dl.alpha*flick).toFixed(2)})`;
    ctx.beginPath();ctx.arc(dl.x,dl.y,dl.r,0,Math.PI*2);ctx.fill();
  }

  // ── 3. Clouds — thick, slow-moving ──────────────
  for(const c of clouds){
    c.x+=0.12;if(c.x>w+c.w)c.x=-c.w;
    ctx.fillStyle=`rgba(35,38,52,${c.alpha})`;
    ctx.beginPath();ctx.ellipse(c.x,c.y,c.w,40,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=`rgba(30,33,48,${(c.alpha*0.7).toFixed(2)})`;
    ctx.beginPath();ctx.ellipse(c.x-80,c.y+5,c.w*0.6,30,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(c.x+70,c.y-3,c.w*0.5,28,0,0,Math.PI*2);ctx.fill();
  }

  // ── 4. Rain — varied intensity with wind ────────
  for(const d of drops){
    d.y+=d.vy;d.x+=d.wind;
    if(d.y>h+30){
      d.y=-30-Math.random()*100;d.x=Math.random()*(w+200)-100;
      if(Math.random()<0.25)ripples.push({x:d.x,y:h*0.75+Math.random()*h*0.25,r:0,maxR:40+Math.random()*60,alpha:0.4});
    }
    if(d.x>w+50)d.x=-50;if(d.x<-50)d.x=w+50;
    const a=0.5+0.5*Math.sin(d.y*0.02+t);
    ctx.strokeStyle=`rgba(160,185,210,${(d.alpha*a).toFixed(2)})`;
    ctx.lineWidth=0.8+Math.random()*0.4;
    ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d.x+d.wind*6,d.y-d.len);ctx.stroke();
  }

  // ── 5. Ground ripples ────────────────────────────
  rippleDraw(ctx,ripples);

  // ── 6. Puddle reflections on ground ──────────────
  for(let i=0;i<5;i++){
    const px=w*(0.1+i*0.2);const py=h*0.78+(i%2)*h*0.04;
    const shimmer=0.3+0.7*Math.abs(Math.sin(t*0.8+i*1.3));
    ctx.fillStyle=`rgba(30,35,55,${(0.3*shimmer).toFixed(2)})`;
    ctx.beginPath();ctx.ellipse(px,py,60+Math.sin(i)*20,8+Math.cos(i)*4,0,0,Math.PI*2);ctx.fill();
    // Light reflection on puddle
    ctx.fillStyle=`rgba(200,210,240,${(0.06*shimmer).toFixed(3)})`;
    ctx.beginPath();ctx.ellipse(px+15,py-2,25,4,0,0,Math.PI*2);ctx.fill();
  }

  // ── 7. Random lightning — rare, unpredictable ────
  // Use a persistent state attached to the canvas to track active bolts
  const ltState=(ctx.canvas as any).__lightningState||{bolts:[]as{lx:number;ly:number;born:number;dur:number}[],lastStrike:0};
  (ctx.canvas as any).__lightningState=ltState;
  // Random trigger: ~8% chance per second, with cooldown of 5+ seconds
  if(t-ltState.lastStrike>5+Math.random()*15&&Math.random()<0.004){
    ltState.bolts.push({lx:w*(0.15+Math.random()*0.7),ly:h*0.03+Math.random()*h*0.08,born:t,dur:0.15+Math.random()*0.2});
    ltState.lastStrike=t;
  }
  // Render active bolts
  for(let bi=ltState.bolts.length-1;bi>=0;bi--){
    const b=ltState.bolts[bi];
    const age=t-b.born;
    if(age>b.dur){ltState.bolts.splice(bi,1);continue}
    const progress=age/b.dur;
    const fadeOut=1-progress;
    // Screen flash
    const flashAlpha=0.08*fadeOut*(progress<0.3?progress/0.3:1);
    ctx.fillStyle=`rgba(200,210,255,${flashAlpha.toFixed(3)})`;
    ctx.fillRect(0,0,w,h);
    // Bolt
    ctx.strokeStyle=`rgba(255,255,255,${(0.7*fadeOut).toFixed(2)})`;
    ctx.lineWidth=2.5;ctx.shadowColor="rgba(200,220,255,0.6)";ctx.shadowBlur=20;
    ctx.beginPath();ctx.moveTo(b.lx,b.ly);
    let cx=b.lx,cy=b.ly;
    const seed=b.lx*100+b.ly;
    for(let i=0;i<6+Math.floor(Math.random()*4);i++){
      cx+=(Math.sin(seed+i*1.7)*35-10);cy+=h*0.07+Math.random()*h*0.08;
      ctx.lineTo(cx,cy);
      // Occasional branch
      if(i>=2&&i<=4&&Math.random()>0.55){
        const bx2=cx+(Math.sin(seed+i)*40-15),by2=cy+h*0.04+Math.random()*h*0.04;
        ctx.moveTo(cx,cy);ctx.lineTo(bx2,by2);ctx.moveTo(cx,cy);
      }
    }
    ctx.stroke();ctx.shadowBlur=0;
    // Initial intense flash
    if(progress<0.1){
      ctx.fillStyle=`rgba(255,255,255,${(0.04*fadeOut).toFixed(3)})`;
      ctx.fillRect(0,0,w,h);
    }
  }

  // ── 8. Distant hills — layered + forested ────────
  const hillColors=["rgba(18,20,30,0.55)","rgba(15,18,28,0.65)","rgba(10,12,22,0.75)"];
  for(let layer=0;layer<3;layer++){
    const hy=h*0.68+layer*28;
    ctx.fillStyle=hillColors[layer];ctx.beginPath();ctx.moveTo(0,h);
    for(let x=0;x<=w;x+=25){
      const hv=Math.sin(x*0.003+layer*1.3)*18+Math.sin(x*0.008+layer*0.6)*10+Math.sin(x*0.016+layer)*5;
      ctx.lineTo(x,hy-hv-layer*5);
    }
    ctx.lineTo(w,h);ctx.closePath();ctx.fill();
    // Pine/cypress silhouettes on hilltops (layer 0 & 1)
    if(layer<2){
      ctx.fillStyle=layer===0?"rgba(12,15,24,0.5)":"rgba(8,10,18,0.6)";
      const treeStep=40+layer*20;
      for(let x=treeStep;x<w;x+=treeStep+Math.sin(x*0.1)*10){
        const tx=x+Math.sin(x*0.05)*8;
        const ty=hy-Math.sin(x*0.003+layer*1.3)*18-Math.sin(x*0.008+layer*0.6)*10-8;
        const th=14+Math.sin(x*0.2)*6+Math.sin(x*0.07)*8;
        ctx.beginPath();ctx.moveTo(tx-4,ty+th*0.3);ctx.lineTo(tx,ty-th);ctx.lineTo(tx+4,ty+th*0.3);ctx.fill();
        ctx.beginPath();ctx.moveTo(tx-3,ty+th*0.6);ctx.lineTo(tx-1,ty-th*0.5);ctx.lineTo(tx+2,ty+th*0.6);ctx.fill();
      }
    }
  }

  // ── 9. Winding river ─────────────────────────────
  const riverY=h*0.76;
  ctx.fillStyle="rgba(45,55,70,0.5)";
  ctx.beginPath();ctx.moveTo(0,h);ctx.lineTo(0,riverY);
  for(let x=0;x<=w;x+=20){
    const rw=35+Math.sin(x*0.004+0.5)*18+Math.sin(x*0.009+1.2)*10;
    ctx.lineTo(x,riverY+Math.sin(x*0.01)*4+rw*0.3);
  }
  for(let x=w;x>=0;x-=20){
    const rw=35+Math.sin(x*0.004+0.5)*18+Math.sin(x*0.009+1.2)*10;
    ctx.lineTo(x,riverY+Math.sin(x*0.01)*4-rw*0.7);
  }
  ctx.closePath();ctx.fill();
  // River rain ripples
  ctx.strokeStyle="rgba(160,180,200,0.12)";ctx.lineWidth=0.6;
  for(let i=0;i<12;i++){
    const rx=w*0.08+i*w*0.08;const ry=riverY+Math.sin(rx*0.01)*4-5+Math.sin(t*0.6+i)*3;
    ctx.beginPath();ctx.arc(rx,ry,4+Math.sin(i)*2,0,Math.PI*2);ctx.stroke();
  }
  // River reflection shimmer
  ctx.fillStyle=`rgba(160,180,200,${0.03+0.02*Math.sin(t*0.5)})`;
  ctx.fillRect(w*0.05,riverY-8,w*0.9,6);

  // ── 10. Near-ground pond ─────────────────────────
  const pond2Y=h*0.81;
  ctx.fillStyle="rgba(40,48,62,0.45)";
  ctx.beginPath();ctx.ellipse(w*0.55,pond2Y,120,16,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(w*0.28,pond2Y+5,70,10,0.1,0,Math.PI*2);ctx.fill();
  // Pond rain rings
  ctx.strokeStyle="rgba(150,170,195,0.1)";ctx.lineWidth=0.5;
  for(let i=0;i<8;i++){
    const prx=w*0.3+i*40;const pry=pond2Y+(i%2)*5+Math.sin(t*0.5+i)*2;
    ctx.beginPath();ctx.arc(prx,pry,5+Math.sin(i*2)*2,0,Math.PI*2);ctx.stroke();
  }

  // ── 11. Mid-ground trees (bare, rain-soaked) ─────
  const treeColors=["rgba(14,18,26,0.55)","rgba(10,14,22,0.6)","rgba(16,20,28,0.5)"];
  for(let i=0;i<7;i++){
    const tx=w*(0.05+i*0.15);const ty=h*0.74+Math.sin(i*1.5)*h*0.03;
    const ts=0.7+Math.sin(i)*0.3;
    ctx.fillStyle=treeColors[i%3];
    // Trunk
    ctx.fillRect(tx-2*ts,ty-20*ts,4*ts,22*ts);
    // Branches + sparse canopy
    ctx.beginPath();ctx.moveTo(tx,ty-15*ts);ctx.lineTo(tx-15*ts,ty-28*ts);ctx.lineTo(tx-8*ts,ty-22*ts);ctx.fill();
    ctx.beginPath();ctx.moveTo(tx,ty-18*ts);ctx.lineTo(tx+12*ts,ty-30*ts);ctx.lineTo(tx+6*ts,ty-24*ts);ctx.fill();
    ctx.beginPath();ctx.moveTo(tx,ty-22*ts);ctx.lineTo(tx-5*ts,ty-35*ts);ctx.lineTo(tx+2*ts,ty-30*ts);ctx.fill();
  }

  // ── 12. Fog layers — multi-depth ─────────────────
  const fg=ctx.createLinearGradient(0,h*0.5,0,h);
  fg.addColorStop(0,"transparent");fg.addColorStop(0.3,"rgba(150,165,180,0.04)");
  fg.addColorStop(0.55,"rgba(130,150,170,0.08)");fg.addColorStop(0.75,"rgba(120,140,160,0.12)");
  fg.addColorStop(1,"rgba(100,120,150,0.22)");
  ctx.fillStyle=fg;ctx.fillRect(0,h*0.5,w,h*0.5);
  // Second fog layer — fast moving low mist
  const fg2=ctx.createLinearGradient(0,h*0.7,0,h*0.85);
  fg2.addColorStop(0,"transparent");fg2.addColorStop(1,`rgba(140,155,170,${0.08+0.04*Math.sin(t*0.2)})`);
  ctx.fillStyle=fg2;ctx.fillRect(0,h*0.7,w,h*0.15);

  // ── 13. Window water streaks ─────────────────────
  for(const ws of windowStreaks){
    ws.life+=ws.speed*0.5;ws.y+=ws.speed*0.3;
    if(ws.y>h*0.9){ws.y=0;ws.x=Math.random()*w;ws.len=6+Math.random()*40;ws.alpha=0.08+Math.random()*0.25;}
    const wa=0.4+0.6*Math.sin(ws.life*0.01);
    ctx.strokeStyle=`rgba(180,195,215,${(ws.alpha*wa).toFixed(3)})`;ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(ws.x,ws.y);ctx.lineTo(ws.x+1,ws.y+ws.len);ctx.stroke();
    if(ws.len>20){
      ctx.fillStyle=`rgba(190,205,225,${(ws.alpha*wa*0.7).toFixed(3)})`;
      ctx.beginPath();ctx.arc(ws.x+1,ws.y+ws.len,2.5,0,Math.PI*2);ctx.fill();
    }
  }

  // ── 14. Glass droplets - foreground ──────────────
  for(const gd of glassDrops){
    gd.y+=gd.vy;gd.trail+=(gd.y-gd.trail)*0.04;
    if(gd.y>h+20){gd.y=-10-Math.random()*30;gd.x=Math.random()*w;gd.trail=gd.y}
    ctx.fillStyle=`rgba(220,230,245,${(gd.alpha*0.5).toFixed(2)})`;
    ctx.beginPath();ctx.arc(gd.x-1,gd.y-1,gd.r*0.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=`rgba(180,200,220,${gd.alpha.toFixed(2)})`;
    ctx.beginPath();ctx.arc(gd.x,gd.y,gd.r,0,Math.PI*2);ctx.fill();
    if(gd.trail>0&&gd.r>5){
      ctx.fillStyle=`rgba(180,200,220,${(gd.alpha*0.25).toFixed(2)})`;
      ctx.beginPath();ctx.arc(gd.x,gd.trail,gd.r*0.7,0,Math.PI*2);ctx.fill();
    }
  }

  // ── 15. Window frame vignette ────────────────────
  const vig=ctx.createRadialGradient(w*0.5,h*0.45,w*0.3,w*0.5,h*0.45,w*0.75);
  vig.addColorStop(0,"transparent");vig.addColorStop(0.6,"rgba(0,0,0,0.08)");vig.addColorStop(1,"rgba(0,0,0,0.4)");
  ctx.fillStyle=vig;ctx.fillRect(0,0,w,h);
}

// ═══════════════════════════════════════════════
//  Shared ripple renderer
// ═══════════════════════════════════════════════

function rippleDraw(ctx:CanvasRenderingContext2D,ripples:Ripple[]){
  for(let i=ripples.length-1;i>=0;i--){const r=ripples[i];r.r+=1.5;r.alpha-=0.012;if(r.alpha<=0||r.r>r.maxR){ripples.splice(i,1);continue}ctx.strokeStyle=`rgba(180,200,220,${r.alpha.toFixed(2)})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.stroke()}
}

// ═══════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════

export function SceneThemeRenderer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    scene: "garden" as SceneId, stars:[]as Star2[],meteors:[]as Meteor[],nebulae:[]as Nebula[],aurora:[]as AuroraRibbon[],galaxy:[]as GalaxyStar[],
    gPetals:[]as GardenPetal[],gRipples:[]as Ripple[],spots:[]as LightSpot[],
    sakPetals:[]as SakPet[],kois:[]as Koi[],lanterns:[]as Lantern[],fireflies:[]as Firefly[],sTrees:[]as SakuraTree[],stoneLanterns:[]as StoneLantern[],sRipples:[]as Ripple[],
    rainDrops:[]as RainD2[],glassDrops:[]as GlassDrop[],clouds:[]as Cloud[],distLights:[]as DistantLight[],windowStreaks:[]as WindowStreak[],rRipples:[]as Ripple[],
  });
  const rafRef = useRef(0); const t0Ref = useRef(0); const lastFrameRef = useRef(0); const runningRef = useRef(false);
  const mouseRef = useRef({x:0,y:0}); // normalized 0-1 mouse position
  const [sceneId,setSceneId]=useState<SceneId>("garden");

  // Init + resize
  const initAll = useCallback((s:SceneId,w:number,h:number)=>{
    const st=stateRef.current;st.scene=s;
    // Responsive scale factor: 1.0 at 1080p, scales with screen area
    const rf=Math.max(0.35,Math.min(1.5,Math.sqrt(w*h/(1920*1080))));
    if(s==="starry"){const sc=Math.round(rf*1000);st.stars=genStars(prefersReduced?Math.round(sc*0.4):sc,w,h);st.meteors=[];st.nebulae=genNebulae(w,h);st.aurora=genAurora(w,h);st.galaxy=genGalaxyStars(w,h)}
    else if(s==="garden"){const pc=Math.round(rf*38);st.gPetals=genGardenPetals(prefersReduced?Math.round(pc*0.5):pc,w,h);st.gRipples=[];st.spots=genLightSpots(w,h)}
    else if(s==="sakura"){
      const pc=Math.round(rf*200);const tc=Math.round(rf*9);
      st.sakPetals=genSakPetals(prefersReduced?Math.round(pc*0.3):pc,w,h);
      st.kois=prefersReduced?[]:genKoi(w,h);st.lanterns=genLanterns(w,h);
      st.fireflies=genFireflies(w,h);
      // Trees: use responsive count (min 3, max 12)
      const treeCount=Math.max(4,Math.min(20,tc+6)); // +6 for denser base
      const treeDefs=[{x:0.04,y:0.82,s:0.55},{x:0.08,y:0.80,s:0.65},{x:0.13,y:0.78,s:0.75},{x:0.18,y:0.79,s:0.7},{x:0.22,y:0.77,s:0.9},{x:0.27,y:0.78,s:0.8},{x:0.32,y:0.76,s:1.0},{x:0.37,y:0.79,s:0.75},{x:0.42,y:0.77,s:0.95},{x:0.47,y:0.75,s:1.05},{x:0.52,y:0.78,s:0.85},{x:0.57,y:0.76,s:0.9},{x:0.63,y:0.79,s:0.7},{x:0.68,y:0.77,s:0.85},{x:0.74,y:0.80,s:0.65},{x:0.79,y:0.78,s:0.8},{x:0.84,y:0.81,s:0.6},{x:0.89,y:0.79,s:0.7},{x:0.94,y:0.80,s:0.55},{x:0.10,y:0.81,s:0.6}];
      st.sTrees=treeDefs.slice(0,treeCount).map(td=>genSakuraTree(w*td.x,h*td.y,td.s*rf));
      const lanCount=Math.max(2,Math.round(rf*4));
      st.stoneLanterns=[{x:w*0.32,y:h*0.80,scale:rf},{x:w*0.44,y:h*0.81,scale:rf*0.85},{x:w*0.68,y:h*0.82,scale:rf*0.9},{x:w*0.80,y:h*0.83,scale:rf*0.8}].slice(0,lanCount);
      st.sRipples=[];
    }
    else if(s==="rain"){const dc=Math.round(rf*900);st.rainDrops=genRainDrops(prefersReduced?Math.round(dc*0.45):dc,w,h);st.glassDrops=genGlassDrops(Math.round(rf*30),w,h);st.clouds=genClouds(w,h);st.distLights=genDistantLights(w,h);st.windowStreaks=genWindowStreaks(w,h);st.rRipples=[]}
  },[]);

  // Mouse tracking for parallax
  useEffect(()=>{
    const handler=(e:MouseEvent)=>{mouseRef.current={x:e.clientX/window.innerWidth,y:e.clientY/window.innerHeight}};
    window.addEventListener("mousemove",handler,{passive:true});return()=>window.removeEventListener("mousemove",handler);
  },[]);

  // Click → ripple
  useEffect(()=>{
    const handler=(e:MouseEvent)=>{const s=stateRef.current.scene;const ripples=s==="garden"?stateRef.current.gRipples:s==="sakura"?stateRef.current.sRipples:s==="rain"?stateRef.current.rRipples:null;if(ripples)ripples.push({x:e.clientX,y:e.clientY,r:0,maxR:120,alpha:0.7})};
    window.addEventListener("click",handler);return ()=>window.removeEventListener("click",handler);
  },[]);

  // Theme listener — reinit particles on mount AND on theme change
  useEffect(()=>{
    const initial=getScene();setSceneId(initial);
    // On mount: immediately init the stored theme (not just "garden" default)
    const canvas=canvasRef.current;
    if(canvas)initAll(initial,window.innerWidth,window.innerHeight);
    const h=()=>{
      const s=getScene();setSceneId(s);
      const c=canvasRef.current;if(!c)return;
      initAll(s,window.innerWidth,window.innerHeight);
    };
    window.addEventListener("garden-theme-changed",h);
    return()=>window.removeEventListener("garden-theme-changed",h);
  },[initAll]);

  // Canvas resize — only on window resize, not on theme change
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;const ctx=canvas.getContext("2d");if(!ctx)return;
    const resize=()=>{
      const dpr=Math.min(window.devicePixelRatio||1,2);
      canvas.width=window.innerWidth*dpr;canvas.height=window.innerHeight*dpr;
      canvas.style.width=window.innerWidth+"px";canvas.style.height=window.innerHeight+"px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
      initAll(getScene(),window.innerWidth,window.innerHeight);
    };
    resize();window.addEventListener("resize",resize);
    return()=>window.removeEventListener("resize",resize);
  },[initAll]);

  // Render loop — runs continuously, reads scene from ref (no re-creation on theme switch)
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;const ctx=canvas.getContext("2d");if(!ctx)return;
    t0Ref.current=performance.now();runningRef.current=true;
    const st=stateRef.current;

    const render=(now:number)=>{
      if(!runningRef.current)return;
      rafRef.current=requestAnimationFrame(render);
      tickFPS(now);
      const dt=Math.min(0.1,(now-(lastFrameRef.current||now))/1000);
      lastFrameRef.current=now;
      const t=(now-t0Ref.current)/1000;
      const w=window.innerWidth,h=window.innerHeight;
      const s=st.scene;
      // Tick ecosystem
      ctx.clearRect(0,0,w,h);
      if(s==="starry"){if(st.meteors.length===0&&t>5||Math.random()<0.004&&st.meteors.length<3)st.meteors.push(genMeteor(w,h));st.meteors=st.meteors.filter(m=>m.life<m.maxLife);renderStarry(ctx,t,w,h,st.stars,st.meteors,st.nebulae,st.aurora,st.galaxy)}
      else if(s==="garden"){const m=mouseRef.current;renderGarden(ctx,t,w,h,st.gPetals,st.gRipples,st.spots,m.x-0.5,m.y-0.5)}
      else if(s==="sakura")renderSakura(ctx,t,w,h,st.sakPetals,st.kois,st.lanterns,st.fireflies,st.sRipples,st.sTrees,st.stoneLanterns);
      else if(s==="rain")renderRain(ctx,t,w,h,st.rainDrops,st.glassDrops,st.clouds,st.rRipples,st.distLights,st.windowStreaks);
    };
    renderFnRef.current=render;
    rafRef.current=requestAnimationFrame(render);
    return()=>{runningRef.current=false;cancelAnimationFrame(rafRef.current);
    };
  },[]);

  // Pause when hidden — resume the real render loop on return
  const renderFnRef = useRef<((now:number)=>void)|null>(null);
  useEffect(()=>{
    const h=()=>{
      if(document.hidden){runningRef.current=false;cancelAnimationFrame(rafRef.current)}
      else if(renderFnRef.current){runningRef.current=true;t0Ref.current=performance.now();rafRef.current=requestAnimationFrame(renderFnRef.current)}
    };
    document.addEventListener("visibilitychange",h);return()=>document.removeEventListener("visibilitychange",h);
  },[]);

  // Canvas must always be in the DOM so the render loop can access it.
  // For garden theme, hide it with display:none (GardenBackground handles the visuals).
  return (<canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{zIndex:-4,width:"100%",height:"100%",display:sceneId==="garden"?"none":"block"}}/>);
}
