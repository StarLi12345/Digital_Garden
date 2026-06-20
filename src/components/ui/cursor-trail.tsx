"use client";

// ============================================================
// Digital Garden — Cursor Trail v1
// ============================================================
// 光标拖尾粒子特效：花瓣 / 光尘 / 雪
// 粒子从光标位置生成，旋转飘落并渐隐。
// ============================================================

import { useEffect, useRef } from "react";
import { getCursorEffect, type CursorEffect } from "@/lib/ambient-config";

interface TrailParticle {
  x:number;y:number;size:number;opacity:number;life:number;
  color:string;vx:number;vy:number;
  type:CursorEffect;rot:number;rv:number;seed:number;
}

const trails:TrailParticle[]=[];
let mouseX=-100,mouseY=-100;

function spawnCursor(effect:CursorEffect){
  const petalColors=["#f4c2c2","#fcd5ce","#e8c8d0","#ffe0e6","#ffd1dc"];
  const baseColor=effect==="petal"?petalColors[Math.floor(Math.random()*petalColors.length)]
    :effect==="dust"?"#fff8dc":effect==="snow"?"#f0f4ff":"#fff";
  const lifeBase=32+Math.random()*35;
  trails.push({
    x:mouseX+(Math.random()-0.5)*8,
    y:mouseY+(Math.random()-0.5)*8,
    size:5+Math.random()*8,
    opacity:0.7+Math.random()*0.3,
    life:lifeBase,
    color:baseColor,
    vx:(Math.random()-0.5)*1.2,
    vy:(Math.random()-0.5)*1.2-1.2,
    type:effect,
    rot:Math.random()*Math.PI*2,
    rv:(Math.random()-0.5)*0.066,
    seed:Math.floor(Math.random()*100)
  });
}

export function CursorTrail(){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const effectRef=useRef<CursorEffect>("none");

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;const ctx=canvas.getContext("2d");if(!ctx)return;
    let animId:number;let w=0,h=0;let frameCount=0;
    const resize=()=>{w=window.innerWidth;h=window.innerHeight;canvas.width=w;canvas.height=h;};
    resize();window.addEventListener("resize",resize);
    const onMouse=(e:MouseEvent)=>{mouseX=e.clientX;mouseY=e.clientY;};
    window.addEventListener("mousemove",onMouse);
    const onLeave=()=>{mouseX=-1000;mouseY=-1000;};
    document.addEventListener("mouseleave",onLeave);
    window.addEventListener("blur",onLeave);

    const sync=()=>{effectRef.current=getCursorEffect();};
    sync();
    window.addEventListener("storage",sync);

    const loop=()=>{
      ctx.clearRect(0,0,w,h);
      if(effectRef.current==="none"){
        frameCount++;animId=requestAnimationFrame(loop);return;
      }
      if(frameCount%2===0)spawnCursor(effectRef.current);

      for(let i=trails.length-1;i>=0;i--){
        const tc=trails[i];tc.x+=tc.vx;tc.y+=tc.vy;tc.life--;tc.opacity*=0.97;tc.rot+=tc.rv;tc.size*=0.992;
        if(tc.life<=0){trails.splice(i,1);continue}
        ctx.save();ctx.globalAlpha=tc.opacity;ctx.translate(tc.x,tc.y);ctx.rotate(tc.rot);
        const s=tc.size;

        if(tc.type==="petal"){
          const pc=["rgba(255,183,197,","rgba(255,160,180,","rgba(255,140,165,","rgba(255,200,210,"][tc.seed%4];
          ctx.fillStyle=`${pc}${tc.opacity.toFixed(2)})`;
          ctx.beginPath();
          ctx.moveTo(0,-s*0.3);
          ctx.bezierCurveTo(s*0.5,-s*0.8,s*0.8,-s*0.1,0,s*0.6);
          ctx.bezierCurveTo(-s*0.8,-s*0.1,-s*0.5,-s*0.8,0,-s*0.3);
          ctx.fill();
          ctx.strokeStyle=`rgba(255,255,255,${(tc.opacity*0.3).toFixed(2)})`;ctx.lineWidth=0.3;
          ctx.beginPath();ctx.moveTo(0,-s*0.2);ctx.lineTo(0,s*0.35);ctx.stroke();
        }else if(tc.type==="dust"){
          const g=ctx.createRadialGradient(0,0,0,0,0,s*2.5);
          g.addColorStop(0,"rgba(255,255,220,0.9)");g.addColorStop(0.35,"rgba(255,240,180,0.5)");g.addColorStop(1,"rgba(255,240,180,0)");
          ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,s*2.5,0,Math.PI*2);ctx.fill();
          ctx.fillStyle="#fffef0";ctx.beginPath();
          for(let j=0;j<8;j++){const a=j*Math.PI/4;const r=j%2===0?s:s*0.35;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}
          ctx.closePath();ctx.fill();
        }else if(tc.type==="snow"){
          ctx.strokeStyle="#fff";ctx.lineWidth=0.7;ctx.lineCap="round";ctx.beginPath();
          for(let j=0;j<6;j++){const a=j*Math.PI/3;const tx=Math.cos(a)*s,ty=Math.sin(a)*s;ctx.moveTo(0,0);ctx.lineTo(tx,ty);
            const bx=Math.cos(a)*s*0.5,by=Math.sin(a)*s*0.5,bl=s*0.28;
            ctx.moveTo(bx,by);ctx.lineTo(bx+Math.cos(a+0.45)*bl,by+Math.sin(a+0.45)*bl);
            ctx.moveTo(bx,by);ctx.lineTo(bx+Math.cos(a-0.45)*bl,by+Math.sin(a-0.45)*bl);
          }
          ctx.stroke();
          ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(0,0,s*0.13,0,Math.PI*2);ctx.fill();
        }
        ctx.restore();
      }
      frameCount++;animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return()=>{cancelAnimationFrame(animId);window.removeEventListener("resize",resize);window.removeEventListener("mousemove",onMouse);document.removeEventListener("mouseleave",onLeave);window.removeEventListener("blur",onLeave);window.removeEventListener("storage",sync);};
  },[]);

  return(<canvas ref={canvasRef} style={{position:"fixed",inset:0,zIndex:1,pointerEvents:"none",width:"100%",height:"100%"}} aria-hidden="true"/>);
}
