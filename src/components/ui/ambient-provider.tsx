"use client";

// ============================================================
// Digital Garden — Ambient Effects Provider v4
// ============================================================
// 环境动效：樱飘 / 星光 / 落雨 / 飘雪
// 仅负责全屏粒子动画，不含光标交互。
// 光标特效已拆分至 cursor-trail.tsx。
// ============================================================

import { useEffect, useRef } from "react";
import { getAmbientEffect, type AmbientEffect } from "@/lib/ambient-config";

// ── Types (matching canvas originals) ──────────────────
interface SakPet { x:number;y:number;vx:number;vy:number;rot:number;rv:number;size:number;alpha:number;phase:number;color:string;driftAmp:number;driftFreq:number }
interface StarParticle { x:number;y:number;r:number;twinkleP:number;twinkleS:number;bright:number }
interface Meteor { x:number;y:number;vx:number;vy:number;life:number;maxLife:number;alpha:number }
interface RainParticle { x:number;y:number;vy:number;len:number;wind:number;alpha:number }
interface GlassDrop { x:number;y:number;r:number;vy:number;alpha:number;trail:number }
interface WindowStreak { x:number;y:number;len:number;alpha:number;speed:number;life:number }
interface SnowParticle { x:number;y:number;vy:number;vx:number;size:number;alpha:number;rot:number;rv:number;phase:number;type:number;driftAmp:number;driftFreq:number }

// ── Generators ─────────────────────────────────────────
const SAKURA_COLORS=["rgba(255,183,197,","rgba(255,160,180,","rgba(255,140,165,","rgba(255,200,210,","rgba(255,175,190,"];

function genPetals(n:number,w:number,h:number):SakPet[]{return Array.from({length:n},()=>{const c=SAKURA_COLORS[Math.floor(Math.random()*SAKURA_COLORS.length)];return{x:Math.random()*w,y:-Math.random()*h,vy:0.4+Math.random()*0.6,vx:0,rot:Math.random()*Math.PI*2,rv:(Math.random()-0.5)*0.02,size:5+Math.random()*12,alpha:0.5+Math.random()*0.4,phase:Math.random()*Math.PI*2,color:c,driftAmp:0.3+Math.random()*1.2,driftFreq:0.008+Math.random()*0.015}})}
function genStars(n:number,w:number,h:number):StarParticle[]{return Array.from({length:n},()=>({x:Math.random()*w,y:Math.random()*h,r:0.4+Math.random()*2.2,twinkleP:Math.random()*Math.PI*2,twinkleS:0.006+Math.random()*0.07,bright:0.25+Math.random()*0.75}))}
function genRain(n:number,w:number,h:number):RainParticle[]{return Array.from({length:n},()=>({x:Math.random()*(w+200)-100,y:Math.random()*h-h,vy:6+Math.random()*12,len:10+Math.random()*25,wind:-0.4+Math.random()*0.3,alpha:0.12+Math.random()*0.22}))}
function genGlassDrops(n:number,w:number,h:number):GlassDrop[]{return Array.from({length:n},()=>({x:Math.random()*w,y:Math.random()*h,r:3+Math.random()*10,vy:0.3+Math.random()*0.9,alpha:0.3+Math.random()*0.35,trail:0}))}
function genWindowStreaks(w:number,h:number):WindowStreak[]{return Array.from({length:30},()=>({x:Math.random()*w,y:Math.random()*h*0.7,len:6+Math.random()*40,alpha:0.1+Math.random()*0.3,speed:0.3+Math.random()*1.2,life:Math.random()*300}))}
function genSnow(n:number,w:number,h:number):SnowParticle[]{return Array.from({length:n},()=>{const size=8+Math.random()*22;return{x:Math.random()*w,y:-Math.random()*h,vy:0.15+size*0.015+Math.random()*0.25,vx:(Math.random()-0.5)*0.3,size,alpha:0.55+Math.random()*0.4,rot:Math.random()*Math.PI*2,rv:(Math.random()-0.5)*0.008,phase:Math.random()*Math.PI*2,type:0,driftAmp:0.15+Math.random()*0.8,driftFreq:0.003+Math.random()*0.01}})}

// ── Provider ──────────────────────────────────────────
export function AmbientProvider(){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const petalsRef=useRef<SakPet[]>([]);
  const starsRef=useRef<StarParticle[]>([]);
  const meteorsRef=useRef<Meteor[]>([]);
  const rainRef=useRef<RainParticle[]>([]);
  const glassRef=useRef<GlassDrop[]>([]);
  const streaksRef=useRef<WindowStreak[]>([]);
  const snowRef=useRef<SnowParticle[]>([]);
  const effectRef=useRef<AmbientEffect>("none");

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;const ctx=canvas.getContext("2d");if(!ctx)return;
    let animId:number;let w=0,h=0;let frameCount=0;
    const resize=()=>{w=window.innerWidth;h=window.innerHeight;canvas.width=w;canvas.height=h;};
    resize();window.addEventListener("resize",resize);

    const rf=()=>Math.max(0.4,Math.min(1.5,Math.sqrt(w*h/(1920*1080))));
    const syncAmbient=()=>{
      const e=getAmbientEffect();
      if(e===effectRef.current)return;
      effectRef.current=e;
      const R=rf();const isM=w<768;
      petalsRef.current=[];starsRef.current=[];meteorsRef.current=[];
      rainRef.current=[];glassRef.current=[];streaksRef.current=[];snowRef.current=[];
      if(e==="petal")petalsRef.current=genPetals(Math.round(R*(isM?30:80)),w,h);
      else if(e==="dust"){starsRef.current=genStars(Math.round(R*(isM?60:150)),w,h);meteorsRef.current=[];}
      else if(e==="rain"){rainRef.current=genRain(Math.round(R*(isM?120:300)),w,h);glassRef.current=genGlassDrops(Math.round(R*(isM?10:25)),w,h);streaksRef.current=genWindowStreaks(w,h);}
      else if(e==="snow")snowRef.current=genSnow(Math.round(R*(isM?25:60)),w,h);
    };
    syncAmbient();
    window.addEventListener("storage",syncAmbient);

    const loop=(now:number)=>{
      ctx.clearRect(0,0,w,h);
      const e=effectRef.current;const t=now/1000;

      // ── Petal ──
      if(e==="petal"){
        for(const p of petalsRef.current){
          p.vy=0.35+Math.random()*0.55;
          p.vx=Math.sin(t*p.driftFreq+p.phase)*p.driftAmp;
          p.y+=p.vy;p.x+=p.vx;p.rot+=p.rv;
          if(p.y>h+40){p.y=-40-Math.random()*30;p.x=Math.random()*w}
          ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);
          ctx.fillStyle=`${p.color}${p.alpha.toFixed(2)})`;
          ctx.beginPath();const s2=p.size;
          ctx.moveTo(0,-s2*0.3);
          ctx.bezierCurveTo(s2*0.5,-s2*0.8,s2*0.8,-s2*0.1,0,s2*0.6);
          ctx.bezierCurveTo(-s2*0.8,-s2*0.1,-s2*0.5,-s2*0.8,0,-s2*0.3);
          ctx.fill();ctx.restore();
        }
      }

      // ── Star sparkles ──
      if(e==="dust"){
        for(const s of starsRef.current){
          const tw=0.5+0.5*Math.sin(t*s.twinkleS+s.twinkleP);
          const a=s.bright*(0.12+0.88*tw);
          ctx.fillStyle=`rgba(255,255,255,${a.toFixed(2)})`;
          ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();
          if(s.r>1.5&&tw>0.6){
            ctx.fillStyle=`rgba(180,210,255,${(a*0.3).toFixed(2)})`;
            ctx.beginPath();ctx.arc(s.x,s.y,s.r*4.5,0,Math.PI*2);ctx.fill();
          }
        }
        const mets=meteorsRef.current;
        if(mets.length===0&&t>5||Math.random()<0.003&&mets.length<2){
          const a=-0.6+Math.random()*0.8;
          mets.push({x:Math.random()*w*0.9,y:Math.random()*h*0.25,vx:Math.cos(a)*2.5+1,vy:Math.sin(a)*2.5,life:0,maxLife:60+Math.random()*70,alpha:1});
        }
        for(let mi=mets.length-1;mi>=0;mi--){
          const m=mets[mi];m.x+=m.vx;m.y+=m.vy;m.life++;m.alpha=1-(m.life/m.maxLife);
          if(m.life>m.maxLife){mets.splice(mi,1);continue}
          const tailLen=20+m.life*0.8;const mx2=m.x-m.vx*tailLen,my2=m.y-m.vy*tailLen;
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
      }

      // ── Rain ──
      if(e==="rain"){
        for(const d of rainRef.current){
          d.y+=d.vy;d.x+=d.wind;
          if(d.y>h+30){d.y=-30-Math.random()*100;d.x=Math.random()*(w+200)-100;}
          if(d.x>w+50)d.x=-50;if(d.x<-50)d.x=w+50;
          const a=0.5+0.5*Math.sin(d.y*0.02+t);
          ctx.strokeStyle=`rgba(160,185,210,${(d.alpha*a).toFixed(2)})`;
          ctx.lineWidth=0.8+Math.random()*0.4;
          ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d.x+d.wind*6,d.y-d.len);ctx.stroke();
        }
        for(const ws of streaksRef.current){
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
        for(const gd of glassRef.current){
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
      }

      // ── Snow ──
      if(e==="snow"){
        for(const sf of snowRef.current){
          sf.y+=sf.vy;sf.x+=sf.vx+Math.sin(t*sf.driftFreq+sf.phase)*sf.driftAmp;sf.rot+=sf.rv;
          if(sf.y>h+50){sf.y=-50-Math.random()*40;sf.x=Math.random()*w;}
          if(sf.x<-50)sf.x=w+50;if(sf.x>w+50)sf.x=-50;
          ctx.save();ctx.translate(sf.x,sf.y);ctx.rotate(sf.rot);
          const s=sf.size;const a=sf.alpha*(0.85+0.15*Math.sin(t*0.5+sf.phase));
          ctx.strokeStyle=`rgba(255,255,255,${a.toFixed(2)})`;ctx.lineWidth=1.2;ctx.lineCap="round";
          ctx.beginPath();
          for(let j=0;j<6;j++){
            const baseAng=j*Math.PI/3;
            const tipX=Math.cos(baseAng)*s,tipY=Math.sin(baseAng)*s;
            ctx.moveTo(0,0);ctx.lineTo(tipX,tipY);
            for(let lvl=0;lvl<3;lvl++){
              const frac=0.4+lvl*0.22;
              const bx=Math.cos(baseAng)*s*frac,by=Math.sin(baseAng)*s*frac;
              const blen=s*(0.3-lvl*0.08);
              ctx.moveTo(bx,by);ctx.lineTo(bx+Math.cos(baseAng+0.55)*blen,by+Math.sin(baseAng+0.55)*blen);
              ctx.moveTo(bx,by);ctx.lineTo(bx+Math.cos(baseAng-0.55)*blen,by+Math.sin(baseAng-0.55)*blen);
              if(lvl<2&&blen>s*0.15){
                const sbx=bx+Math.cos(baseAng+0.55)*blen*0.5,sby=by+Math.sin(baseAng+0.55)*blen*0.5;
                const sblen=blen*0.5;
                ctx.moveTo(sbx,sby);ctx.lineTo(sbx+Math.cos(baseAng+0.9)*sblen,sby+Math.sin(baseAng+0.9)*sblen);
                ctx.moveTo(sbx,sby);ctx.lineTo(sbx+Math.cos(baseAng+0.2)*sblen,sby+Math.sin(baseAng+0.2)*sblen);
                const sbx2=bx+Math.cos(baseAng-0.55)*blen*0.5,sby2=by+Math.sin(baseAng-0.55)*blen*0.5;
                ctx.moveTo(sbx2,sby2);ctx.lineTo(sbx2+Math.cos(baseAng-0.9)*sblen,sby2+Math.sin(baseAng-0.9)*sblen);
                ctx.moveTo(sbx2,sby2);ctx.lineTo(sbx2+Math.cos(baseAng-0.2)*sblen,sby2+Math.sin(baseAng-0.2)*sblen);
              }
            }
          }
          ctx.stroke();
          ctx.fillStyle=`rgba(255,255,255,${Math.min(1,a+0.15).toFixed(2)})`;
          ctx.beginPath();ctx.arc(0,0,s*0.1,0,Math.PI*2);ctx.fill();
          ctx.restore();
        }
      }

      frameCount++;animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return()=>{cancelAnimationFrame(animId);window.removeEventListener("resize",resize);window.removeEventListener("storage",syncAmbient);};
  },[]);

  return(<canvas ref={canvasRef} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",width:"100%",height:"100%"}} aria-hidden="true"/>);
}
