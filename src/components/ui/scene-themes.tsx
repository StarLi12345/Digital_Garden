"use client";

// ============================================================
// Digital Garden — Immersive Scene Themes v2
// ============================================================
// 按《UI主题执行摘要》规格全面重写
// · 粒子系统 · 多层渲染 · 点击交互 · 性能监测 · 无障碍
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { getEcosystem, type EcoAmbientState } from "@/ecosystem/garden-ecosystem";

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

interface SakPet { x:number;y:number;vx:number;vy:number;rot:number;rv:number;size:number;alpha:number;phase:number;color:string }
interface Koi { x:number;y:number;t:number;dir:number;size:number;phase:number }
interface Lantern { x:number;y:number;r:number;alpha:number;phase:number }

interface RainD2 { x:number;y:number;vy:number;len:number;wind:number;alpha:number }
interface GlassDrop { x:number;y:number;r:number;vy:number;alpha:number;trail:number }
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

function genStars(n:number,w:number,h:number):Star2[]{return Array.from({length:n},()=>({x:Math.random()*w,y:Math.random()*h,r:0.4+Math.random()*2.2,twinkleP:Math.random()*Math.PI*2,twinkleS:0.003+Math.random()*0.04,bright:0.25+Math.random()*0.75,layer:Math.floor(Math.random()*3)}))}
function genMeteor(w:number,h:number):Meteor{const a=Math.random()*Math.PI*0.5-0.25;return{x:Math.random()*w*0.8,y:Math.random()*h*0.3,vx:Math.cos(a)*6,vy:Math.sin(a)*6,life:0,maxLife:40+Math.random()*40,alpha:1}}
function genNebulae(w:number,h:number):Nebula[]{return Array.from({length:3},()=>({x:Math.random()*w,y:Math.random()*h*0.5,r:150+Math.random()*300,alpha:0.03+Math.random()*0.05,vx:0.1+Math.random()*0.2}))}

function renderStarry(ctx:CanvasRenderingContext2D,t:number,w:number,h:number,stars:Star2[],meteors:Meteor[],nebulae:Nebula[]){
  // Sky gradient
  const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,"#07071a");g.addColorStop(0.35,"#0d0d2b");g.addColorStop(0.7,"#15103a");g.addColorStop(1,"#0a0f1a");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  // Nebulae
  for(const n of nebulae){n.x+=n.vx;if(n.x>w+n.r)n.x=-n.r;const ng=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r);ng.addColorStop(0,`rgba(50,20,100,${n.alpha})`);ng.addColorStop(0.5,`rgba(20,10,60,${n.alpha*0.6})`);ng.addColorStop(1,"transparent");ctx.fillStyle=ng;ctx.fillRect(0,0,w,h)}
  // Stars with parallax layers
  for(const s of stars){
    const tw=0.5+0.5*Math.sin(t*s.twinkleS+s.twinkleP);const a=s.bright*(0.35+0.65*tw);
    ctx.fillStyle=`rgba(255,255,255,${a.toFixed(2)})`;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();
    if(s.r>1.5&&tw>0.7){ctx.fillStyle=`rgba(180,210,255,${(a*0.35).toFixed(2)})`;ctx.beginPath();ctx.arc(s.x,s.y,s.r*4,0,Math.PI*2);ctx.fill()}
  }
  // Moon (crescent)
  const mx=w*0.78,my=h*0.14;ctx.fillStyle="rgba(255,248,220,0.92)";ctx.beginPath();ctx.arc(mx,my,38,0,Math.PI*2);ctx.fill();ctx.fillStyle="#07071a";ctx.beginPath();ctx.arc(mx+14,my-10,33,0,Math.PI*2);ctx.fill();
  const mg=ctx.createRadialGradient(mx,my,30,mx,my,130);mg.addColorStop(0,"rgba(255,248,210,0.18)");mg.addColorStop(1,"transparent");ctx.fillStyle=mg;ctx.beginPath();ctx.arc(mx,my,130,0,Math.PI*2);ctx.fill();
  // Meteors
  for(const m of meteors){m.x+=m.vx;m.y+=m.vy;m.life++;m.alpha=1-(m.life/m.maxLife);if(m.life>m.maxLife){Object.assign(m,genMeteor(w,h));m.y=-10}const mx2=m.x-m.vx*15,my2=m.y-m.vy*15;ctx.strokeStyle=`rgba(255,255,255,${m.alpha.toFixed(2)})`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(m.x,m.y);ctx.lineTo(mx2,my2);ctx.stroke()}
  // Ground silhouette
  const gg=ctx.createLinearGradient(0,h*0.78,0,h);gg.addColorStop(0,"rgba(10,8,25,0.2)");gg.addColorStop(1,"rgba(6,4,18,0.6)");ctx.fillStyle=gg;ctx.fillRect(0,h*0.78,w,h*0.22);
}

// ═══════════════════════════════════════════════
//  ★★★ GARDEN RENDERER ★★★
// ═══════════════════════════════════════════════

const GARDEN_COLORS=["rgba(255,180,200,","rgba(255,200,180,","rgba(255,170,190,","rgba(245,190,200,"];
function genGardenPetals(n:number,w:number,h:number):GardenPetal[]{return Array.from({length:n},()=>{const c=GARDEN_COLORS[Math.floor(Math.random()*GARDEN_COLORS.length)];return{x:Math.random()*w,y:-Math.random()*h*0.7,vy:0.15+Math.random()*0.35,vx:0,rot:Math.random()*Math.PI*2,rv:(Math.random()-0.5)*0.015,size:4+Math.random()*8,alpha:0.25+Math.random()*0.3,phase:Math.random()*Math.PI*2,color:c}})}
const SAKURA_COLORS=["rgba(255,183,197,","rgba(255,160,180,","rgba(255,140,165,","rgba(255,200,210,"];
function genSakPetals(n:number,w:number,h:number):SakPet[]{return Array.from({length:n},()=>{const c=SAKURA_COLORS[Math.floor(Math.random()*SAKURA_COLORS.length)];return{x:Math.random()*w,y:-Math.random()*h,vy:0.4+Math.random()*0.8,vx:0,rot:Math.random()*Math.PI*2,rv:(Math.random()-0.5)*0.025,size:5+Math.random()*10,alpha:0.5+Math.random()*0.4,phase:Math.random()*Math.PI*2,color:c}})}
function genLightSpots(w:number,h:number):LightSpot[]{return Array.from({length:5},()=>({x:Math.random()*w,y:Math.random()*h*0.7,r:25+Math.random()*55,alpha:0.02+Math.random()*0.04,phase:Math.random()*Math.PI*2}))}

// ═══════════════════════════════════════════════
//  Garden Canvas — atmosphere overlay only
//  Background image provides the base scene.
//  Canvas adds: light, bokeh, petals, ripples, sun glow, mouse parallax
// ═══════════════════════════════════════════════

function renderGarden(ctx:CanvasRenderingContext2D,t:number,w:number,h:number,petals:GardenPetal[],ripples:Ripple[],spots:LightSpot[],mx:number,my:number){
  // ── Ecosystem state ─────────────────────────────
  let eco:EcoAmbientState|null=null;
  try{eco=getEcosystem().state}catch{}
  const breeze=eco?.breezeIntensity??0;
  const pollen=eco?.pollenDensity??0;
  const sunOff=(eco?.sunlightOffset??0)*(eco?.sunlightActive?1:0);

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

  // Sun glow — atmospheric light, not opaque scene
  const sx=w*0.72+mx*22+Math.sin(t*0.3)*(breeze*30), sy=h*0.15+my*10;
  const sg=ctx.createRadialGradient(sx,sy,20,sx,sy,w*0.7);
  const sunBright=0.18+sunOff;
  sg.addColorStop(0,`rgba(255,248,225,${sunBright.toFixed(2)})`);sg.addColorStop(0.2,`rgba(255,240,210,${(0.08+sunOff*0.4).toFixed(2)})`);sg.addColorStop(0.5,"rgba(255,230,190,0.02)");sg.addColorStop(1,"transparent");
  ctx.fillStyle=sg;ctx.fillRect(0,0,w,h);

  // Warm light wash
  const wg=ctx.createLinearGradient(0,0,0,h*0.5);
  wg.addColorStop(0,`rgba(255,250,240,${(0.04+sunOff*0.8).toFixed(2)})`);wg.addColorStop(1,"transparent");
  ctx.fillStyle=wg;ctx.fillRect(0,0,w,h*0.5);

  // Bokeh light spots — breeze shifts them
  for(const s of spots){
    const depth=0.4+s.r/200;const sx2=s.x+mx*14*depth+Math.sin(t*0.8+s.phase)*(breeze*5),sy2=s.y+my*8*depth;
    const flick=0.5+0.5*Math.sin(t*0.2+s.phase);
    const a=s.alpha*flick;
    ctx.fillStyle=`rgba(255,248,220,${a.toFixed(3)})`;
    ctx.beginPath();ctx.arc(sx2,sy2,s.r,0,Math.PI*2);ctx.fill();
    if(s.r>40){ctx.fillStyle=`rgba(255,250,235,${(a*0.3).toFixed(3)})`;ctx.beginPath();ctx.arc(sx2,sy2,s.r*1.5,0,Math.PI*2);ctx.fill()}
  }

  // Petal particles — breeze increases sway
  const breezeSway = 1 + breeze * 4;
  const petalCount = Math.round(38 * (1 + breeze * 0.8 + pollen * 1.5));
  const visiblePetals = petals.slice(0, Math.min(petalCount, petals.length));
  for(const p of visiblePetals){
    p.vy=0.15+Math.random()*0.3+breeze*0.2;p.vx=Math.sin(t*0.01+p.phase)*0.35*breezeSway+mx*0.08;
    p.y+=p.vy;p.x+=p.vx;p.rot+=p.rv;
    if(p.y>h+30){p.y=-30;p.x=Math.random()*w;p.alpha=0.2+Math.random()*0.3}
    const a=p.alpha*(0.7+0.3*Math.sin(t*0.6+p.phase));
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=a;
    ctx.fillStyle=`${p.color}1)`;
    ctx.beginPath();const s2=p.size;
    ctx.moveTo(0,-s2*0.2);ctx.bezierCurveTo(s2*0.35,-s2*0.6,s2*0.55,-s2*0.07,0,s2*0.4);
    ctx.bezierCurveTo(-s2*0.55,-s2*0.07,-s2*0.35,-s2*0.6,0,-s2*0.2);ctx.fill();ctx.restore();
  }

  // Pollen — tiny floating dots
  if(pollen>0.05){
    const pc=Math.round(pollen*20);
    for(let i=0;i<pc;i++){
      const px=((Math.sin(t*0.4+i*3.7)*0.5+0.5)*w+(t*8+i*73)%w)%w;
      const py=((Math.cos(t*0.3+i*2.1)*0.5+0.5)*h*0.6+(t*5+i*37)%h*0.4);
      ctx.fillStyle=`rgba(255,248,210,${(pollen*0.15).toFixed(3)})`;
      ctx.beginPath();ctx.arc(px,py,1.2,0,Math.PI*2);ctx.fill();
    }
  }

  rippleDraw(ctx,ripples);

  // Butterfly — resource-driven SVG silhouette
  if(eco?.butterflyActive){
    const bx=eco.butterflyX*w,by=eco.butterflyY*h+Math.sin(t*8)*4;
    const wingFlap=Math.abs(Math.sin(t*12+0.5));
    ctx.save();ctx.translate(bx,by);ctx.rotate(eco.butterflyAngle);
    ctx.fillStyle=`rgba(200,180,140,${(0.35*wingFlap).toFixed(2)})`;
    // Two wing shapes (simplified butterfly silhouette)
    ctx.beginPath();ctx.ellipse(0,-4,10,7*wingFlap,0.3,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(0,4,8,5.5*wingFlap,-0.3,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  // Birds — distant silhouettes
  if(eco?.birdsActive){
    const bdx=eco.birdsX*w, bdy=h*0.15+Math.sin(t*1.5)*8;
    ctx.fillStyle="rgba(60,50,40,0.22)";
    for(let i=0;i<3;i++){
      ctx.beginPath();
      const bx2=bdx+i*35;ctx.arc(bx2,bdy+Math.sin(i*1.3)*4,4,0,Math.PI*2);
      ctx.fill();
      // V-shape wings
      ctx.beginPath();ctx.moveTo(bx2-8,bdy+3);ctx.quadraticCurveTo(bx2-2,bdy-5,bx2,0);
      ctx.quadraticCurveTo(bx2-2,bdy+3,bx2,0);ctx.fill();
    }
  }

  // Glass greenhouse light streak — very subtle
  ctx.fillStyle=`rgba(255,255,255,${0.01+0.006*Math.sin(t*0.08)})`;
  ctx.beginPath();ctx.moveTo(w*0.15,0);ctx.lineTo(w*0.33,h);ctx.lineTo(w*0.36,h);ctx.lineTo(w*0.18,0);ctx.closePath();ctx.fill();
  ctx.fillStyle=`rgba(255,255,255,${0.006+0.004*Math.sin(t*0.12+1)})`;
  ctx.beginPath();ctx.moveTo(w*0.55,0);ctx.lineTo(w*0.68,h);ctx.lineTo(w*0.70,h);ctx.lineTo(w*0.57,0);ctx.closePath();ctx.fill();

  // ── Day-period light overlay ──────────────────
  if(eco){
    const lr=eco.lightOverlayR,lg=eco.lightOverlayG,lb=eco.lightOverlayB;
    const lt=eco.lightTransition<1?eco.lightTransition*(eco.lightTransition<0.01?0:1):1;
    const la=eco.lightOverlayA*lt;
    if(la>0.002){
      ctx.fillStyle=`rgba(${lr},${lg},${lb},${la.toFixed(3)})`;
      ctx.fillRect(0,0,w,h);
    }
  }
}

// ═══════════════════════════════════════════════
//  ★★★ SAKURA RENDERER ★★★
// ═══════════════════════════════════════════════

function genKoi(w:number,h:number):Koi[]{return Array.from({length:2},()=>({x:w*0.2+Math.random()*w*0.6,y:h*0.7+Math.random()*h*0.15,t:Math.random()*Math.PI*2,dir:Math.random()>0.5?1:-1,size:20+Math.random()*15,phase:Math.random()*Math.PI*2}))}
function genLanterns(w:number,h:number):Lantern[]{return Array.from({length:4},(_,i)=>({x:w*(0.2+i*0.2),y:h*(0.3+(i%2)*0.15),r:12+Math.random()*6,alpha:0.5+Math.random()*0.3,phase:Math.random()*Math.PI*2}))}

function renderSakura(ctx:CanvasRenderingContext2D,t:number,w:number,h:number,petals:SakPet[],kois:Koi[],lanterns:Lantern[],ripples:Ripple[]){
  const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,"#e8c5d0");g.addColorStop(0.35,"#f0dae2");g.addColorStop(0.65,"#d8cbce");g.addColorStop(1,"#b0a098");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  const sg=ctx.createRadialGradient(w*0.55,h*0.18,20,w*0.55,h*0.18,w*0.5);sg.addColorStop(0,"rgba(255,225,200,0.35)");sg.addColorStop(0.3,"rgba(255,205,180,0.1)");sg.addColorStop(1,"transparent");ctx.fillStyle=sg;ctx.fillRect(0,0,w,h);
  // Pond
  ctx.fillStyle="rgba(120,160,180,0.3)";ctx.fillRect(w*0.1,h*0.7,w*0.8,h*0.12);
  rippleDraw(ctx,ripples);
  // Koi fish
  for(const k of kois){k.t+=0.01;k.x+=Math.cos(k.t*k.dir)*0.4;k.y+=Math.sin(k.t*0.7)*0.2;if(k.x>w*0.9||k.x<w*0.1)k.dir*=-1;ctx.save();ctx.translate(k.x,k.y);ctx.scale(k.dir,1);ctx.fillStyle="rgba(230,120,60,0.7)";ctx.beginPath();ctx.ellipse(0,0,k.size*0.5,k.size*0.15,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="rgba(250,200,150,0.8)";ctx.beginPath();ctx.ellipse(k.size*0.25,0,k.size*0.2,k.size*0.08,0,0,Math.PI*2);ctx.fill();ctx.restore()}
  // Lanterns
  for(const l of lanterns){const flick=0.7+0.3*Math.sin(t*1.5+l.phase);ctx.fillStyle=`rgba(255,200,100,${(l.alpha*flick).toFixed(2)})`;ctx.shadowColor="rgba(255,180,80,0.5)";ctx.shadowBlur=15;ctx.beginPath();ctx.arc(l.x,l.y,l.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}
  // Sakura petals
  for(const p of petals){p.vy=0.4+Math.random()*0.8;p.vx=Math.sin(t*0.012+p.phase)*0.9;p.y+=p.vy;p.x+=p.vx;p.rot+=p.rv;if(p.y>h+40){p.y=-40;p.x=Math.random()*w}ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=`${p.color}${p.alpha.toFixed(2)})`;ctx.beginPath();const s2=p.size;ctx.moveTo(0,-s2*0.3);ctx.bezierCurveTo(s2*0.5,-s2*0.8,s2*0.8,-s2*0.1,0,s2*0.6);ctx.bezierCurveTo(-s2*0.8,-s2*0.1,-s2*0.5,-s2*0.8,0,-s2*0.3);ctx.fill();ctx.restore()}
  // Trees
  ctx.fillStyle="#5a3a4a";for(let i=0;i<3;i++){const tx=w*(0.1+i*0.4);ctx.beginPath();ctx.moveTo(tx-70,h*0.8);ctx.quadraticCurveTo(tx-50,h*0.45,tx,h*0.15);ctx.quadraticCurveTo(tx+50,h*0.45,tx+70,h*0.8);ctx.closePath();ctx.fill()}
  ctx.fillStyle="#7a5a5a";ctx.fillRect(0,h*0.82,w,h*0.18);
}

// ═══════════════════════════════════════════════
//  ★★★ RAIN RENDERER ★★★
// ═══════════════════════════════════════════════

function genRainDrops(n:number,w:number,h:number):RainD2[]{return Array.from({length:n},()=>({x:Math.random()*(w+200)-100,y:Math.random()*h-h,vy:6+Math.random()*10,len:10+Math.random()*20,wind:-0.3+Math.random()*0.2,alpha:0.15+Math.random()*0.2}))}
function genGlassDrops(n:number,w:number,h:number):GlassDrop[]{return Array.from({length:n},()=>({x:Math.random()*w,y:Math.random()*h,r:3+Math.random()*8,vy:0.3+Math.random()*0.8,alpha:0.3+Math.random()*0.3,trail:0}))}
function genClouds(w:number,h:number):Cloud[]{return Array.from({length:4},()=>({x:Math.random()*w,y:h*0.05+Math.random()*h*0.25,w:200+Math.random()*400,alpha:0.15+Math.random()*0.2}))}

function renderRain(ctx:CanvasRenderingContext2D,t:number,w:number,h:number,drops:RainD2[],glassDrops:GlassDrop[],clouds:Cloud[],ripples:Ripple[]){
  const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,"#18182a");g.addColorStop(0.35,"#222235");g.addColorStop(0.65,"#282835");g.addColorStop(1,"#151522");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  // Clouds
  for(const c of clouds){c.x+=0.15;if(c.x>w+c.w)c.x=-c.w;ctx.fillStyle=`rgba(40,40,55,${c.alpha})`;ctx.beginPath();ctx.ellipse(c.x,c.y,c.w,35,0,0,Math.PI*2);ctx.fill()}
  // Rain
  ctx.strokeStyle="rgba(170,190,210,0.22)";ctx.lineWidth=1;
  for(const d of drops){d.y+=d.vy;d.x+=d.wind;if(d.y>h+30){d.y=-30-Math.random()*80;d.x=Math.random()*(w+200)-100;if(Math.random()<0.3)ripples.push({x:d.x,y:h*0.8+Math.random()*h*0.2,r:0,maxR:50+Math.random()*60,alpha:0.5})}if(d.x>w+50)d.x=-50;if(d.x<-50)d.x=w+50;ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d.x+d.wind*6,d.y-d.len);ctx.stroke()}
  // Ground ripples
  rippleDraw(ctx,ripples);
  // Lightning
  const lp=(t*0.25)%35;if(lp<0.12){ctx.fillStyle=`rgba(255,255,255,${(0.06*(1-lp/0.12)).toFixed(3)})`;ctx.fillRect(0,0,w,h)}
  // Fog
  const fg=ctx.createLinearGradient(0,h*0.65,0,h);fg.addColorStop(0,"transparent");fg.addColorStop(1,"rgba(170,185,195,0.15)");ctx.fillStyle=fg;ctx.fillRect(0,h*0.65,w,h*0.35);
  // Glass droplets (foreground)
  for(const gd of glassDrops){gd.y+=gd.vy;gd.trail+=(gd.y-gd.trail)*0.05;if(gd.y>h+20){gd.y=-10-Math.random()*30;gd.x=Math.random()*w;gd.trail=gd.y}ctx.fillStyle=`rgba(200,210,220,${gd.alpha.toFixed(2)})`;ctx.beginPath();ctx.arc(gd.x,gd.y,gd.r,0,Math.PI*2);ctx.fill();if(gd.trail>0){ctx.fillStyle=`rgba(200,210,220,${(gd.alpha*0.3).toFixed(2)})`;ctx.beginPath();ctx.arc(gd.x,gd.trail,gd.r*0.8,0,Math.PI*2);ctx.fill()}}
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
    scene: "garden" as SceneId, stars:[]as Star2[],meteors:[]as Meteor[],nebulae:[]as Nebula[],
    gPetals:[]as GardenPetal[],gRipples:[]as Ripple[],spots:[]as LightSpot[],
    sakPetals:[]as SakPet[],kois:[]as Koi[],lanterns:[]as Lantern[],sRipples:[]as Ripple[],
    rainDrops:[]as RainD2[],glassDrops:[]as GlassDrop[],clouds:[]as Cloud[],rRipples:[]as Ripple[],
  });
  const rafRef = useRef(0); const t0Ref = useRef(0); const lastFrameRef = useRef(0); const runningRef = useRef(false);
  const mouseRef = useRef({x:0,y:0}); // normalized 0-1 mouse position
  const [sceneId,setSceneId]=useState<SceneId>("garden");

  // Init + resize
  const initAll = useCallback((s:SceneId,w:number,h:number)=>{
    const st=stateRef.current;st.scene=s;
    if(s==="starry"){st.stars=genStars(prefersReduced?400:1000,w,h);st.meteors=[];st.nebulae=genNebulae(w,h)}
    else if(s==="garden"){st.gPetals=genGardenPetals(prefersReduced?18:38,w,h);st.gRipples=[];st.spots=genLightSpots(w,h)}
    else if(s==="sakura"){st.sakPetals=genSakPetals(prefersReduced?40:110,w,h);st.kois=prefersReduced?[]:genKoi(w,h);st.lanterns=genLanterns(w,h);st.sRipples=[]}
    else if(s==="rain"){st.rainDrops=genRainDrops(prefersReduced?400:900,w,h);st.glassDrops=genGlassDrops(30,w,h);st.clouds=genClouds(w,h);st.rRipples=[]}
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

  // Theme listener
  useEffect(()=>{setSceneId(getScene());const h=()=>{const s=getScene();setSceneId(s)};window.addEventListener("garden-theme-changed",h);return()=>window.removeEventListener("garden-theme-changed",h)},[]);

  // Render loop
  useEffect(()=>{
    cancelAnimationFrame(rafRef.current);runningRef.current=false;
    const canvas=canvasRef.current;if(!canvas)return;const ctx=canvas.getContext("2d");if(!ctx)return;
    const resize=()=>{const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=window.innerWidth*dpr;canvas.height=window.innerHeight*dpr;canvas.style.width=window.innerWidth+"px";canvas.style.height=window.innerHeight+"px";ctx.setTransform(dpr,0,0,dpr,0,0);initAll(sceneId,window.innerWidth,window.innerHeight)};
    resize();window.addEventListener("resize",resize);t0Ref.current=performance.now();runningRef.current=true;
    const st=stateRef.current;

    const render=(now:number)=>{if(!runningRef.current)return;rafRef.current=requestAnimationFrame(render);tickFPS(now);const dt=Math.min(0.1,(now-(lastFrameRef.current||now))/1000);lastFrameRef.current=now;const t=(now-t0Ref.current)/1000;const w=window.innerWidth,h=window.innerHeight;
      // Tick ecosystem
      if(sceneId==="garden")try{const eco=getEcosystem();eco.tick(dt)}catch{}
      ctx.clearRect(0,0,w,h);
      if(sceneId==="starry"){if(st.meteors.length===0&&t>10||Math.random()<0.002&&st.meteors.length<2)st.meteors.push(genMeteor(w,h));st.meteors=st.meteors.filter(m=>m.life<m.maxLife);renderStarry(ctx,t,w,h,st.stars,st.meteors,st.nebulae)}
      else if(sceneId==="garden"){const m=mouseRef.current;renderGarden(ctx,t,w,h,st.gPetals,st.gRipples,st.spots,m.x-0.5,m.y-0.5)}
      else if(sceneId==="sakura")renderSakura(ctx,t,w,h,st.sakPetals,st.kois,st.lanterns,st.sRipples);
      else if(sceneId==="rain")renderRain(ctx,t,w,h,st.rainDrops,st.glassDrops,st.clouds,st.rRipples);
    };
    renderFnRef.current=render;
    rafRef.current=requestAnimationFrame(render);
    return()=>{runningRef.current=false;cancelAnimationFrame(rafRef.current);window.removeEventListener("resize",resize);
      // Stop ecosystem when scene changes
      if(sceneId==="garden"){try{getEcosystem().stop()}catch{}}};
  },[sceneId,initAll]);

  // Pause when hidden — resume the real render loop on return
  const renderFnRef = useRef<((now:number)=>void)|null>(null);
  useEffect(()=>{
    const h=()=>{
      if(document.hidden){runningRef.current=false;cancelAnimationFrame(rafRef.current)}
      else if(renderFnRef.current){runningRef.current=true;t0Ref.current=performance.now();rafRef.current=requestAnimationFrame(renderFnRef.current)}
    };
    document.addEventListener("visibilitychange",h);return()=>document.removeEventListener("visibilitychange",h);
  },[]);

  // Garden theme no longer uses canvas — it relies on the static moonlight-04.jpg background
  if (sceneId === "garden") return null;

  return (<canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{zIndex:-4,width:"100%",height:"100%"}}/>);
}
