import * as THREE from '../vendor/three.module.js';

// Original warm collectible mesh. The supplied couple figurines guide softness
// and expression; Moaaz's portrait guides the broad face and short dark hair.
// Clean shaven and without glasses, as explicitly requested. Entirely 3D geometry.
export function buildCharacter(api) {
 const {scene,group,mat,add,sphere}=api;
 const root=group(scene,[2,0,4.15]);
 const skin=mat('#ce946d',{roughness:.62}),skinShade=mat('#b97951',{roughness:.7});
 const hair=mat('#28201d',{roughness:.59});
 const eye=mat('#161a1c',{roughness:.25,metalness:.01}),lip=mat('#a8654d',{roughness:.8});
 const shirt=mat('#eee3cc',{roughness:.65}),seam=mat('#d8ccb3',{roughness:.78}),pants=mat('#303641',{roughness:.75}),boots=mat('#25282e',{roughness:.47}),sole=mat('#171b22',{roughness:.67});
 const ell=(p,size,m,pos)=>{const o=sphere(p,1,m,pos,28,20);o.scale.set(...size);return o;};
 // Subdivided rounded solids, shaped at the vertex level. Flat central surfaces
 // blend into broad corner radii rather than stacking spheres/cylinders.
 function sculpt(p,size,r,m,pos,deform){
   const detail=size[0]>1.5?28:12;
   const g=new THREE.BoxGeometry(...size,detail,detail,detail),a=g.attributes.position;
   const half=new THREE.Vector3(...size).multiplyScalar(.5),inner=half.clone().addScalar(-r);
   for(let i=0;i<a.count;i++){
    const q=new THREE.Vector3().fromBufferAttribute(a,i),c=q.clone().clamp(inner.clone().negate(),inner);
    q.sub(c).normalize().multiplyScalar(r).add(c);if(deform)deform(q,half);
    a.setXYZ(i,q.x,q.y,q.z);
   }
   g.computeVertexNormals();return add(p,g,m,pos);
 }
 function curve(p,points,r,m,radial=8){return add(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(a=>new THREE.Vector3(...a))),24,r,radial,false),m);}
 function patch(p,points,depth,m,pos=[0,0,0]){
   const s=new THREE.Shape();points.forEach((q,i)=>i?s.lineTo(...q):s.moveTo(...q));s.closePath();
   return add(p,new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:.008,bevelSize:.012,bevelSegments:2,steps:1}),m,pos);
 }
 // Compact torso: softly tapered shirt, set-in sleeves, turned collar and hem.
 const hips=group(root,[0,1.04,0]);
 sculpt(hips,[.65,.3,.39],.12,pants,[0,0,0]);
 const torso=group(hips,[0,.05,0]);
 sculpt(torso,[.79,.8,.48],.14,shirt,[0,.38,0],(v,h)=>{v.x*=.89+.11*(v.y/h.y+1)/2;v.z+=.018*Math.max(0,-v.y/h.y);});
 sculpt(torso,[.66,.055,.45],.02,seam,[0,.018,.005]);
 sculpt(torso,[.215,.23,.21],.075,skin,[0,.85,0]);
 for(const s of [-1,1])patch(torso,[[s*.018,.745],[s*.18,.82],[s*.19,.67],[s*.075,.585]],.026,shirt,[0,0,.245]);
 curve(torso,[[0,.08,.255],[0,.4,.25],[0,.67,.25]],.009,seam,6);
 for(const y of [.2,.38,.55])ell(torso,[.019,.019,.012],pants,[.014,y,.264]);
 // A shallow stitched pocket follows the garment, not a separate box.
 curve(torso,[[.14,.53,.245],[.14,.37,.252],[.27,.355,.253],[.3,.4,.252],[.3,.53,.245]],.007,seam,6);
 const head=group(torso,[0,1.59,0]); // centre 2.68; 45% of silhouette is head/hair
 const faceSkin=mat('#ce946d',{roughness:.67,vertexColors:true});
 const headMesh=sculpt(head,[1.69,1.32,1.16],.38,faceSkin,[0,0,0],v=>{
   if(v.y<0)v.x*=1+v.y*.09;
   const cheek=Math.exp(-Math.pow((Math.abs(v.x)-.46)/.23,2)-Math.pow((v.y+.23)/.2,2));
   if(v.z>.3)v.z+=.035*cheek;v.z+=Math.max(0,-v.y)*.012;
 });
 // A restrained warm cheek tint is in the surface vertices, not a face decal.
 const facePos=headMesh.geometry.attributes.position,faceColors=[];
 for(let i=0;i<facePos.count;i++){const x=facePos.getX(i),y=facePos.getY(i),z=facePos.getZ(i);const tint=Math.exp(-Math.pow((Math.abs(x)-.49)/.18,2)-Math.pow((y+.23)/.15,2))*Math.max(0,z-.35)*.65;const c=new THREE.Color('#ffffff').lerp(new THREE.Color('#efb6a5'),tint);faceColors.push(c.r,c.g,c.b);}
 headMesh.geometry.setAttribute('color',new THREE.Float32BufferAttribute(faceColors,3));
 for(const s of [-1,1]){
   sculpt(head,[.16,.31,.235],.075,skin,[s*.838,-.11,-.025]);
   ell(head,[.025,.067,.042],skinShade,[s*.925,-.115,.012]);
   // Large black inset domes. Reflections come from lighting; no painted whites.
   ell(head,[.138,.149,.067],eye,[s*.404,-.035,.58]);
   curve(head,[[s*.2,.192,.588],[s*.385,.229,.592],[s*.52,.222,.575],[s*.585,.194,.56]],.024,hair,10);
 }
 // Soft broad nose and a small relaxed smile; smooth cheeks and chin remain
 // visibly clean shaven. No beard shell, moustache, stubble or glasses geometry.
 ell(head,[.087,.102,.07],skin,[0,-.205,.59]);
 curve(head,[[-.15,-.352,.598],[-.075,-.387,.612],[0,-.397,.615],[.075,-.387,.612],[.15,-.352,.598]],.009,lip,8);
 // Hair cap is a single loft with an irregular hairline and swept crown.
 // This replaces the previous disconnected hat-like slabs.
 const hp=[],hn=[];
 const base=headMesh.geometry.toNonIndexed(),bp=base.attributes.position,bn=base.attributes.normal;
 const signed=q=>q.y-(-.15+(.55+.025*Math.sin(q.x*4+.5)+.013*Math.sin(q.x*16))*THREE.MathUtils.smoothstep(q.z,.05,.53));
 const at=i=>{const p=new THREE.Vector3().fromBufferAttribute(bp,i).multiplyScalar(1.024).add(new THREE.Vector3(0,.012,0));const top=THREE.MathUtils.smoothstep(p.y,.36,.66);const wave=.026*Math.sin(p.x*16+p.z*5);p.y+=top*(.19*Math.max(0,1-Math.pow(p.x/.9,2))+.034*Math.sin(p.x*3)-p.z*.04+wave);p.x+=top*.025;return {p,n:new THREE.Vector3().fromBufferAttribute(bn,i)};};
 for(let i=0;i<bp.count;i+=3){
   const tri=[at(i),at(i+1),at(i+2)],out=[];
   for(let k=0;k<3;k++){
     const a=tri[k],b=tri[(k+1)%3],da=signed(a.p),db=signed(b.p);
     if(da>=0)out.push(a);
     if((da>=0)!==(db>=0)){
       let lo=0,hi=1;for(let it=0;it<14;it++){const mid=(lo+hi)/2;if((signed(a.p.clone().lerp(b.p,mid))>=0)===(da>=0))lo=mid;else hi=mid;}
       const t=(lo+hi)/2;out.push({p:a.p.clone().lerp(b.p,t),n:a.n.clone().lerp(b.n,t).normalize()});
     }
   }
   for(let k=1;k<out.length-1;k++)for(const v of[out[0],out[k],out[k+1]]){hp.push(v.p.x,v.p.y,v.p.z);hn.push(v.n.x,v.n.y,v.n.z);}
 }
 base.dispose();const unique=[],indices=[],seen=new Map();
 for(let i=0;i<hp.length;i+=3){const key=hp.slice(i,i+3).map(n=>n.toFixed(5)).join('/');if(!seen.has(key)){seen.set(key,unique.length/3);unique.push(...hp.slice(i,i+3));}indices.push(seen.get(key));}
 const hg=new THREE.BufferGeometry();hg.setAttribute('position',new THREE.Float32BufferAttribute(unique,3));hg.setIndex(indices);hg.computeVertexNormals();add(head,hg,hair);
 // The quiff's connected crown has five swept creases sculpted into its
 // vertex field above. No raised strips or floating hair pieces are used.
 const arms=[],legs=[];
 for(const s of [-1,1]){
   const arm=group(torso,[s*.386,.665,0]);arms.push(arm);
   sculpt(arm,[.25,.36,.32],.105,shirt,[s*.032,-.112,0]);
   const elbow=group(arm,[s*.041,-.27,0]);arm.userData.lower=elbow;
   sculpt(elbow,[.18,.32,.2],.078,skin,[0,-.135,0]);
   // A palm, curled fingers and tucked thumb instead of a ball hand.
   sculpt(elbow,[.2,.21,.205],.075,skin,[0,-.36,.018]);
   const thumb=ell(elbow,[.06,.089,.062],skin,[-s*.09,-.32,.073]);thumb.rotation.z=s*.28;
   for(let f=0;f<2;f++)curve(elbow,[[s*.05,-.405+f*.055,.114],[-s*.055,-.405+f*.055,.114]],.004,skinShade,5);
   const leg=group(hips,[s*.187,-.07,0]);legs.push(leg);
   sculpt(leg,[.28,.47,.34],.105,pants,[0,-.2,0]);
   const knee=group(leg,[0,-.415,0]);leg.userData.knee=knee;
   sculpt(knee,[.255,.375,.315],.085,pants,[0,-.14,0]);
   sculpt(knee,[.31,.055,.34],.02,pants,[0,-.295,.005]);
   sculpt(knee,[.36,.225,.53],.085,boots,[0,-.32,.1],v=>{v.y-=Math.max(0,v.z)*.12;});
   sculpt(knee,[.375,.065,.545],.025,sole,[0,-.432,.105]);
   for(let n=0;n<3;n++)curve(knee,[[-.105,-.263+n*.018,.15+n*.04],[.105,-.263+n*.018,.15+n*.04]],.009,sole,6);
 }
 const ring=add(root,new THREE.RingGeometry(.46,.51,40),mat('#d89a61',{transparent:true,opacity:.4,side:THREE.DoubleSide}),[0,.055,0],[-Math.PI/2,0,0],false);
 function pose({walk=0,phase=0,bend=0,sit=0,seatHeight=1.105}={}){
   hips.position.y=1.04+sit*(seatHeight+.2-1.04)-bend*.055+Math.sin(phase*2)*.015*walk;
   torso.rotation.x=bend*.56-sit*.055;head.rotation.x=-bend*.22;
   torso.rotation.z=Math.sin(phase)*.025*walk;
   for(let i=0;i<2;i++){
     const swing=Math.sin(phase+i*Math.PI)*.4*walk;
     arms[i].rotation.x=-swing-bend*.68-sit*.52;
     arms[i].rotation.z=(i===0?1:-1)*(.1+bend*.08);
     arms[i].userData.lower.rotation.x=-bend*.38-sit*.35;
     legs[i].position.y=-.07+sit*.08;
     legs[i].rotation.x=swing-sit*Math.PI*.47;
     legs[i].userData.knee.rotation.x=Math.max(0,-swing)*.65+sit*Math.PI*.49+bend*.08;
   }
   // Keep the lowest boot above the room floor throughout the swing/crouch.
   // Compact vinyl legs need less hip drop than the previous adult proportion rig.
   let lowest=Infinity;
   for(const leg of legs){const a=leg.rotation.x,b=a+leg.userData.knee.rotation.x;
     for(const y of[-.465,-.18])for(const z of[-.17,.38])lowest=Math.min(lowest,hips.position.y+leg.position.y-.415*Math.cos(a)+y*Math.cos(b)-z*Math.sin(b));
   }
   hips.position.y+=Math.max(0,.055-lowest);
   ring.visible=!sit;
 }
 pose();return {root,pose};
}
