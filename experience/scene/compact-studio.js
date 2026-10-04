import * as THREE from '../vendor/three.module.js';
import { buildCharacter } from './character.js?v=studio-3';

// Original, authored geometry. Real belongings are based on the supplied desk
// evidence; all screen artwork is fictional. Units are approximately 3 / metre.
export function buildCompactStudio(api) {
  const {scene, M, mat, add, box, cylinder, sphere, torus, group, rounded, line,
    canvasMaterial, station, label, geometries, materials, textures, hitboxes, requestFrame, isDestroyed} = api;
  const cream=mat('#eee5d5'), timber=mat('#b37a4c'), timberEdge=mat('#865537'),
    orange=mat('#c96935'), graphite=mat('#292d30'), charcoal=mat('#171c20'),
    silver=mat('#60696b',{metalness:.65,roughness:.36}), leather=mat('#303b3c'),
    royal=mat('#365ce6'),rugBlue=mat('#3e507c'),
    sand=mat('#d5c5ae'), skin=mat('#b9784d'), skinLight=mat('#c98a60'),
    hair=mat('#241c19'), beard=mat('#35251e');
  const root=group(scene);
  const ellipsoid=(p,size,m,pos,rot)=> {const o=sphere(p,1,m,pos,24,18);o.scale.set(...size);if(rot)o.rotation.set(...rot);return o;};
  const tube=(p,points,r,m)=>add(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),32,r,7,false),m);
  const limb=(p,a,b,r1,r2,m)=> {const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);const o=cylinder(p,r1,r2,av.distanceTo(bv),m,av.clone().add(bv).multiplyScalar(.5).toArray(),null,16);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return o;};
  // One open miniature, composed to read from a bounded front orbit.
  const peach=mat('#e7c2b1'), warmWhite=mat('#f8f2e9'), paleOak=mat('#d6ad83');
  rounded(root,14.7,10.5,.42,.65,paleOak,[0,-.24,-.25],[-Math.PI/2,0,0]);
  rounded(root,14.35,10.15,.045,.5,warmWhite,[0,.005,-.25],[-Math.PI/2,0,0]);
  for(let row=0;row<14;row++)for(let col=0;col<7;col++){
    const x=-6.18+col*2.04,z=-4.88+row*.71;
    box(root,[2,.012,.69],row%4===0?sand:warmWhite,[x,.038,z],null,false);
  }
  rounded(root,14.3,4.65,.16,.1,peach,[0,2.325,-5.23]);
  rounded(root,.16,3.2,8.35,.08,warmWhite,[-7.15,1.6,-.95]);
  box(root,[14.1,.1,.09],warmWhite,[0,4.59,-5.12],null,false);
  box(root,[14.1,.13,.1],timber,[0,.13,-5.11],null,false);
  box(root,[.11,.13,8.1],timber,[-7.04,.13,-.95],null,false);
  // Pale oak fluting and a real small sunlit window frame.
  for(let i=0;i<11;i++)box(root,[.065,4.25,.055],warmWhite,[-6.72+i*.24,2.2,-5.105],null,false);
  rounded(root,3.28,2.72,.12,.08,timber,[-.5,3.11,-5.08]);
  rounded(root,3.02,2.46,.025,.035,mat('#dce7e0',{emissive:'#dde9df',emissiveIntensity:.1}),[-.5,3.11,-5.005]);
  box(root,[.055,2.46,.045],warmWhite,[-.5,3.11,-4.97],null,false);
  box(root,[3.03,.055,.045],warmWhite,[-.5,3.11,-4.97],null,false);
  box(root,[3.48,.12,.37],timber,[-.5,1.7,-4.96]);
  rounded(root,8.05,5.9,.028,.38,mat('#eee5d7'),[-1.18,.077,.65],[-Math.PI/2,0,0]);
  rounded(root,7.74,5.59,.008,.32,mat('#d9d6c8'),[-1.18,.097,.65],[-Math.PI/2,0,0]);
  // Work desk: warm wood with edge, grain, metal feet and a cable tray.
  const desk=station('work',[-1.1,0,-.85],[6.55,2.5,2.65],[0,1.25,0]);
  rounded(desk,6.5,2.65,.19,.16,timber,[0,2.18,0],[-Math.PI/2,0,0]);
  rounded(desk,6.43,2.59,.026,.14,mat('#c49362'),[0,2.287,0],[-Math.PI/2,0,0]);
  for(let i=0;i<9;i++)line(desk,[[-3.05,2.304,-1.18+i*.29],[-1.1,2.306,-1.16+i*.29],[1.1,2.305,-1.19+i*.29],[3.05,2.304,-1.17+i*.29]],'#986940',.3);
  for(const x of [-2.77,2.77]){
    box(desk,[.15,2.07,.17],graphite,[x,1.08,-.77]);
    box(desk,[.15,2.07,.17],graphite,[x,1.08,.83]);
    box(desk,[.21,.1,2.06],graphite,[x,.12,0]);
    box(desk,[.15,.12,1.8],graphite,[x,1.85,0]);
  }
  box(desk,[4.7,.13,.14],graphite,[0,1.81,-.86]);
  box(desk,[3,.14,.4],graphite,[0,2.01,-.85]);
  rounded(desk,3.25,1.03,.014,.09,royal,[.05,2.312,.62],[-Math.PI/2,0,0]);
  // All shipment-controlled objects are individual existing groups, never copies.
  const gear={computer:[],monitors:[],accessories:[]};
  function gearGroup(kind,pos,rotation=[0,0,0]){
    const g=group(root,pos,rotation);g.userData.homePosition=g.position.clone();g.userData.homeRotation=g.rotation.clone();gear[kind].push(g);return g;
  }
  function screenArtwork(kind){return canvasMaterial((c,w,h)=>{
    c.fillStyle=kind===0?'#223f9b':'#d6c6aa';c.fillRect(0,0,w,h);
    c.fillStyle=kind===0?'#3658c7':'#efe7d7';c.fillRect(28,24,w-56,h-48);
    c.fillStyle=kind===0?'#c78250':'#b3643a';c.beginPath();c.arc(w*.74,h*.4,h*.29,0,Math.PI*2);c.fill();
    c.fillStyle=kind===0?'#e7dfc9':'#354e49';c.fillRect(54,55,110,12);
    c.fillStyle=kind===0?'#849e93':'#b5b49d';for(let i=0;i<5;i++)c.fillRect(54,111+i*24,135+(i%3)*22,7);
    c.fillStyle=kind===0?'#eee4ce':'#617d72';c.fillRect(53,h-68,88,24);
  },640,360);}
  const screenMats=[screenArtwork(0),screenArtwork(1)];
  for(const [i,x]of [[0,-2.55],[1,.35]]){
    const monitor=gearGroup('monitors',[x,2.315,-1.5],[0,i===0?.11:-.11,0]);
    rounded(monitor,.72,.54,.042,.04,graphite,[0,.021,-.08],[-Math.PI/2,0,0]);
    box(monitor,[.115,.61,.12],graphite,[0,.34,-.16]);
    rounded(monitor,1.85,1.12,.095,.035,charcoal,[0,1.02,0]);
    add(monitor,new THREE.PlaneGeometry(1.77,.997),screenMats[i],[0,1.04,.049],null,false);
    box(monitor,[.055,.009,.01],silver,[0,.487,.054]);
    sphere(monitor,.009,mat('#bde1bc',{emissive:'#bde1bc',emissiveIntensity:.4}),[.85,.487,.054],8,6);
    // Back casing, stand recess and cable curve.
    rounded(monitor,.65,.51,.06,.035,graphite,[0,.94,-.07]);
    tube(monitor,[[0,.6,-.13],[.07,.32,-.27],[.12,.1,-.36],[.25,-.3,-.38]],.012,charcoal);
  }
  const laptop=gearGroup('computer',[-1.1,2.325,-.52]);
  rounded(laptop,.95,.65,.04,.035,graphite,[0,.025,0],[-Math.PI/2,0,0]);
  const lid=group(laptop,[0,.06,-.28],[-.18,0,0]);
  rounded(lid,.95,.605,.023,.027,charcoal,[0,.303,0]);
  add(lid,new THREE.PlaneGeometry(.895,.53),screenMats[0],[0,.312,.013],null,false);
  box(lid,[.105,.025,.014],charcoal,[0,.567,.022]);
  rounded(laptop,.69,.235,.007,.015,charcoal,[0,.05,-.08],[-Math.PI/2,0,0]);
  rounded(laptop,.34,.22,.006,.014,silver,[0,.05,.16],[-Math.PI/2,0,0]);
  for(let row=0;row<4;row++)for(let col=0;col<11;col++)box(laptop,[.043,.004,.035],silver,[-.305+col*.061,.057,-.158+row*.05],null,false);
  // Graphite MX Keys S: full-width keys, separate navigation and number pad.
  const keyboard=gearGroup('accessories',[-1.1,2.325,.22]);
  rounded(keyboard,1.35,.445,.038,.042,graphite,[0,.025,0],[-Math.PI/2,0,0]);
  const keyGeo=new THREE.BoxGeometry(.053,.015,.047);geometries.add(keyGeo);
  const keys=new THREE.InstancedMesh(keyGeo,mat('#4a4f50'),90);keyboard.add(keys);keys.receiveShadow=true;
  const matrix=new THREE.Matrix4();let key=0;
  for(let row=0;row<5;row++)for(let col=0;col<18;col++)keys.setMatrixAt(key++,matrix.makeTranslation(-.613+col*.071,.052,-.16+row*.073));
  keys.instanceMatrix.needsUpdate=true;
  box(keyboard,[.36,.018,.052],silver,[-.18,.056,.132],null,false);
  // MX Anywhere 3S rounded shell, split seam, raised metallic scroll wheel.
  const mouse=gearGroup('accessories',[.01,2.33,.3]);
  ellipsoid(mouse,[.13,.083,.195],graphite,[0,.065,0]);
  line(mouse,[[0,.143,-.16],[0,.15,-.025]],'#111719');
  cylinder(mouse,.027,.027,.058,silver,[0,.147,-.073],[0,0,Math.PI/2],16);
  // BlackShark silhouette: twin wire forks, broad padded headband, oval cups + boom.
  const headset=gearGroup('accessories',[1.64,2.33,-.14],[0,-.4,0]);
  rounded(headset,.43,.47,.025,.13,graphite,[0,.017,0],[-Math.PI/2,0,0]);
  cylinder(headset,.027,.027,.75,graphite,[0,.39,0]);
  tube(headset,[[-.32,.39,0],[-.37,.71,0],[-.25,.91,0],[0,.99,0],[.25,.91,0],[.37,.71,0],[.32,.39,0]],.055,charcoal);
  tube(headset,[[-.28,.67,0],[-.2,.85,0],[0,.89,0],[.2,.85,0],[.28,.67,0]],.05,graphite);
  for(const x of [-.34,.34]){
    ellipsoid(headset,[.12,.23,.14],charcoal,[x,.43,0]);
    ellipsoid(headset,[.09,.18,.13],graphite,[x*.74,.43,0]);
    for(const z of [-.065,.065])tube(headset,[[x,.48,z],[x*1.06,.67,z],[x*.92,.79,z]],.012,silver);
  }
  tube(headset,[[-.37,.36,.1],[-.4,.19,.19],[-.21,.17,.3]],.018,charcoal);
  ellipsoid(headset,[.055,.027,.027],graphite,[-.19,.17,.3]);
  // Orange upholstered chair. Shape is provisional; it is not shipment gear.
  const chair=group(root,[-.58,0,1.4],[0,0,0]);
  cylinder(chair,.09,.11,.86,graphite,[0,.61,0]);
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5;limb(chair,[0,.25,0],[Math.sin(a)*.75,.15,Math.cos(a)*.75],.045,.055,graphite);
    cylinder(chair,.085,.085,.13,charcoal,[Math.sin(a)*.73,.13,Math.cos(a)*.73],[Math.PI/2,0,a],12);
  }
  rounded(chair,1.55,1.4,.22,.32,orange,[0,1.16,0],[-Math.PI/2,0,0]);
  rounded(chair,1.51,1.73,.2,.4,orange,[0,1.92,.5],[-.16,0,0]);
  rounded(chair,1.26,1.36,.08,.3,mat('#d57b45'),[0,1.99,.355],[-.16,0,0]);
  for(const x of [-.85,.85]){
    box(chair,[.075,.5,.08],graphite,[x,1.44,.03]);
    rounded(chair,.18,.84,.095,.08,graphite,[x,1.71,-.08],[-Math.PI/2,0,0]);
  }
  const character=buildCharacter(api);
  const avatar=character.root;
  avatar.position.set(2.8,.06,2.6);avatar.scale.setScalar(.83);avatar.rotation.y=.28;
  character.pose(); // Full figure, static first checkpoint; likeness awaits human approval.
  // Dusk, curled up on a low cushion next to the chair. Black coat, small face,
  // triangular ears, tucked paws and a tail that visibly wraps around the body.
  const dusk=group(root,[-2.72,.17,2.29],[0,-.2,0]);
  rounded(dusk,1.65,1.18,.14,.44,mat('#b69b79'),[0,.01,0],[-Math.PI/2,0,0]);
  ellipsoid(dusk,[.58,.3,.39],charcoal,[0,.3,0]);
  ellipsoid(dusk,[.27,.265,.25],charcoal,[.38,.42,.23]);
  for(const x of [.21,.55]){
    const ear=add(dusk,new THREE.ConeGeometry(.135,.3,3),charcoal,[x,.66,.21],[0,x===.21?-.3:.3,0]);
    ear.rotation.z=x===.21?.21:-.21;
    add(dusk,new THREE.ConeGeometry(.07,.16,3),mat('#50403e'),[x,.665,.276],[0,0,x===.21?.21:-.21]);
  }
  for(const x of [.29,.48])tube(dusk,[[x-.052,.435,.445],[x,.414,.456],[x+.05,.438,.439]],.012,mat('#aaa085'));
  ellipsoid(dusk,[.045,.027,.025],mat('#806559'),[.4,.356,.482]);
  for(const x of [.22,.43])ellipsoid(dusk,[.14,.1,.16],charcoal,[x,.19,.4]);
  tube(dusk,[[-.44,.3,-.11],[-.61,.23,.19],[-.4,.2,.41],[-.05,.18,.48],[.06,.2,.4]],.08,charcoal);
  // Brass task lamp and a mug are room objects, independent of shipment gear.
  const lamp=group(root,[-3.99,2.31,-1.47]);
  cylinder(lamp,.24,.24,.05,timberEdge,[0,.025,0],null,24);
  tube(lamp,[[0,.04,0],[0,.78,0],[.32,1.08,0],[.57,1.08,0]],.035,M.gold);
  cylinder(lamp,.14,.28,.26,orange,[.55,.99,0],[0,0,-.15],24);
  cylinder(lamp,.23,.23,.012,mat('#ffdfa2',{emissive:'#ffce75',emissiveIntensity:.65}),[.57,.861,0],null,24);
  const lampLight=new THREE.PointLight('#ffc983',2,4,2);lampLight.position.set(-3.43,3.08,-1.42);root.add(lampLight);
  cylinder(root,.15,.13,.28,cream,[1.74,2.45,.12],null,24);
  cylinder(root,.128,.128,.007,mat('#3c2920'),[1.74,2.595,.12],null,24);
  torus(root,.11,.023,cream,[1.91,2.47,.12],[0,0,0]);
  // Blank coffee-table frame reserved for a future explicitly approved photo.
  const table=group(root,[-5.37,0,1.39]);
  cylinder(table,.86,.79,.13,timber,[0,1.12,0],null,32);
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;limb(table,[Math.sin(a)*.43,1.06,Math.cos(a)*.43],[Math.sin(a)*.63,.08,Math.cos(a)*.63],.065,.075,timberEdge);}
  const frame=group(table,[0,1.6,-.47],[-.14,.23,0]);
  rounded(frame,.64,.83,.06,.025,timberEdge,[0,0,0]);
  rounded(frame,.53,.7,.015,.012,cream,[0,0,.038]);
  box(frame,[.4,.42,.025],sand,[0,.02,.049]);
  // Low credenza: existing portfolio stations remain objects with bounded hitboxes.
  rounded(root,3.35,1.1,.8,.07,timber,[3.18,.69,-4.7]);
  for(const x of [1.71,4.64])for(const z of [-4.99,-4.4])cylinder(root,.055,.075,.18,graphite,[x,.14,z]);
  for(const x of [2.37,4]){box(root,[1.48,.78,.02],cream,[x,.73,-4.288]);box(root,[.32,.025,.04],graphite,[x,1.01,-4.266]);}
  const tabs=station('tabs',[2.03,1.28,-4.68],[1.3,.8,.9],[0,.35,0]);
  for(let i=0;i<3;i++)rounded(tabs,.95,.62,.07,.025,[royal,cream,orange][i],[i*.06,.07+i*.1,0],[-Math.PI/2,0,i*.06]);

  const notes=station('articles',[4.33,1.28,-4.64],[1.3,.75,.9],[0,.3,0]);
  for(let i=0;i<2;i++)rounded(notes,.94,.67,.06,.02,[cream,leather][i],[0,.08+i*.09,0],[-Math.PI/2,0,i*.1]);

  const jar=station('haweshly',[2.6,3.3,-5.1],[.9,1.1,.8],[0,.4,0]);
  cylinder(jar,.31,.28,.68,M.glass,[0,.34,0],null,24);cylinder(jar,.33,.33,.07,orange,[0,.71,0]);
  for(let i=0;i<8;i++)cylinder(jar,.12,.12,.034,M.gold,[Math.sin(i*3)*.12,.07+i*.047,Math.cos(i*2)*.12]);
  const globe=station('tourism',[3.74,3.3,-5.1],[1.1,1.25,.8],[0,.5,0]);
  cylinder(globe,.27,.27,.06,graphite,[0,.03,0]);cylinder(globe,.025,.025,.45,M.gold,[0,.25,0]);
  const globeBody=sphere(globe,.38,leather,[0,.58,0],24,16);torus(globe,.44,.018,M.gold,[0,.58,0],[0,0,.3]);
  for(let i=0;i<5;i++)ellipsoid(globe,[.13,.16,.06],sand,[Math.sin(i*2.4)*.29,.58+Math.cos(i*2)*.19,Math.cos(i*2.4)*.29],[0,i*2.4,0]);
  const circuit=station('rfid',[-6.55,2.02,-3.4],[.8,.7,.7],[0,.2,0]);
  box(root,[1.15,.1,.9],timber,[-6.55,1.95,-3.4]);
  rounded(circuit,.7,.55,.055,.045,leather,[0,.06,0],[-Math.PI/2,0,0]);box(circuit,[.25,.08,.23],graphite,[-.13,.12,0]);
  for(let i=0;i<3;i++)torus(circuit,.07+i*.05,.007,M.gold,[.18,.093,0]);
  box(root,[2.2,.12,.76],timber,[3.15,3.23,-5.11]);
  const art=group(root,[-5.32,3.55,-5.38]);
  rounded(art,2,1.55,.11,.035,timberEdge,[0,0,0]);
  const artMat=canvasMaterial((c,w,h)=>{c.fillStyle='#e8ddc7';c.fillRect(0,0,w,h);c.fillStyle='#b36c45';c.beginPath();c.arc(w*.34,h*.52,h*.31,0,7);c.fill();c.fillStyle='#365ce6';c.fillRect(w*.45,h*.18,w*.3,h*.68);c.fillStyle='#dcc299';c.beginPath();c.arc(w*.67,h*.32,h*.17,0,7);c.fill();});
  add(art,new THREE.PlaneGeometry(1.84,1.39),artMat,[0,0,.061],null,false);
  // Original plant form, not a new biographical claim.
  const plant=group(root,[-4.8,0,-4.55]);cylinder(plant,.39,.29,.72,cream,[0,.4,0],null,24);cylinder(plant,.35,.35,.02,timberEdge,[0,.77,0]);
  for(let i=0;i<8;i++){const a=i*2.4,h=1.25+i%3*.36;const end=[Math.sin(a)*.49,h,Math.cos(a)*.49];tube(plant,[[0,.77,0],[end[0]*.4,h*.82,end[2]*.4],end],.014,leather);ellipsoid(plant,[.14,.4,.055],leather,end,[0,a,Math.sin(a)*.6]);}

  // Equipment stays on the desk; shipment cartons are retired for this pass.
  const shipments=new Map();
  // Physical objects are the navigation. No approach distance or avatar travel.
  function hit(parent,id,size,pos=[0,.3,0]){
    const h=box(parent,size,new THREE.MeshBasicMaterial({visible:false}),pos,null,false);
    materials.add(h.material);h.userData.stationId=id;h.userData.action=true;hitboxes.push(h);return h;
  }
  hit(laptop,'macbook',[1.15,.95,.85],[0,.38,0]);
  // A résumé folder is a separate object on a quiet low shelf.
  const resume=group(table,[-.32,1.22,.03],[0,-.1,0]);
  rounded(resume,.88,.64,.034,.035,orange,[0,0,0],[-Math.PI/2,0,0]);
  const resumeMat=canvasMaterial((c,w,h)=>{c.fillStyle='#fff8ed';c.fillRect(0,0,w,h);c.fillStyle='#2b2d32';c.font='bold 45px sans-serif';c.fillText('CV',36,69);c.fillStyle='#b7b4aa';for(let i=0;i<5;i++)c.fillRect(36,99+i*30,w-72-(i%2)*45,10);},320,250);
  add(resume,new THREE.PlaneGeometry(.81,.57),resumeMat,[0,.022,0],[-Math.PI/2,0,0],false);
  hit(resume,'resume',[1,.2,.7],[0,.03,0]);
  // Reading stays discoverable on the coffee table without a second chair.
  const book=group(table,[.36,1.215,.1],[0,.15,0]);
  rounded(book,.62,.49,.05,.018,royal,[0,0,0],[-Math.PI/2,0,0]);
  rounded(book,.58,.44,.035,.013,warmWhite,[0,.018,0],[-Math.PI/2,0,0]);
  box(book,[.012,.016,.44],royal,[0,.045,0],null,false);hit(book,'books',[.8,.22,.66],[0,.04,0]);
  // The Projects & Ideas pinboard hangs on the right wall, without a bench.
  const board=group(root,[5.62,3.13,-5.1]);
  rounded(board,2.62,1.87,.11,.08,timberEdge,[0,0,0]);
  rounded(board,2.43,1.68,.025,.045,warmWhite,[0,0,.065]);
  for(const [i,x,y] of [[0,-.67,.31],[1,.21,.31],[2,-.52,-.39],[3,.59,-.36]]){
    rounded(board,.65,.51,.015,.018,[royal,sand,orange,peach][i],[x,y,.09],[0,0,i%2?.08:-.04]);
    sphere(board,.031,M.gold,[x,y+.19,.114],10,8);
  }
  line(board,[[-.6,.23,.112],[.15,.24,.112],[.5,-.27,.112]],'#b9936e');
  hit(board,'canvas',[2.68,1.92,.2],[0,0,.02]);
  // Fishing remains an in-place screen on the existing low credenza.
  const arcade=group(root,[3.18,1.28,-4.63]);
  rounded(arcade,.97,.61,.07,.04,charcoal,[0,.32,0]);
  add(arcade,new THREE.PlaneGeometry(.88,.5),screenMats[1],[0,.32,.037],null,false);
  box(arcade,[.13,.12,.19],graphite,[0,.05,-.02]);hit(arcade,'play',[1.05,.73,.18],[0,.31,0]);
  hit(art,'art',[2.06,1.61,.2],[0,0,0]);
  hit(dusk,'personal',[1.55,.75,1.12],[0,.36,.12]);
  // Optional cream/orange mini hoop. Its local coordinates preserve the
  // original calibrated game, while the entire detour fits the room corner.
  const game=group(scene,[3.515,.0301,1.498]);game.scale.setScalar(.57);
  // Match the visible backboard, post and rim instead of covering the empty
  // space in front of the writing shelf with one oversized invisible box.
  const basketball = station("basketball", [5.5, 0.07, -1.4], [2.3, 1.65, .28], [0, 4.3, -.62]);
  hit(basketball,'basketball',[.34,4.4,.34],[0,2.18,-1.35]);
  hit(basketball,'basketball',[1.08,.72,1.05],[0,3.5,.07]);
  cylinder(basketball, 0.11, 0.16, 4.3, cream, [0, 2.18, -1.35]);
  rounded(
    basketball,
    1.6,
    1.2,
    0.17,
    0.22,
    cream,
    [0, 0.1, -1.35],
    [-Math.PI / 2, 0, 0],
  );
  box(basketball, [0.12, 0.12, 0.8], cream, [0, 4.35, -0.97]);
  rounded(basketball, 2.15, 1.4, 0.08, 0.08, M.white, [0, 4.3, -0.62]);
  box(basketball, [1.94, 0.025, 0.015], M.blue, [0, 4.89, -0.57], null, false);
  box(basketball, [1.94, 0.025, 0.015], M.blue, [0, 3.7, -0.57], null, false);
  box(basketball, [0.025, 1.2, 0.015], M.blue, [-0.965, 4.3, -0.57], null, false);
  box(basketball, [0.025, 1.2, 0.015], M.blue, [0.965, 4.3, -0.57], null, false);
  for (const x of [-0.36, 0.36])
    box(basketball, [0.025, 0.45, 0.02], orange, [x, 4.05, -0.565], null, false);
  for (const y of [3.825, 4.275])
    box(basketball, [0.74, 0.025, 0.02], orange, [0, y, -0.565], null, false);
  const rimLocal = new THREE.Vector3(0, 3.75, 0.07);
  box(basketball, [0.18, 0.08, 0.55], orange, [0, 3.75, -0.28]);
  const rim = torus(basketball, 0.46, 0.038, orange, rimLocal.toArray());
  const netPoints = [];
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI * 2) / 12,
      b = a + Math.PI / 6;
    netPoints.push(
      new THREE.Vector3(Math.cos(a) * 0.43, 3.73, 0.07 + Math.sin(a) * 0.43),
      new THREE.Vector3(Math.cos(b) * 0.26, 3.2, 0.07 + Math.sin(b) * 0.26),
    );
    netPoints.push(
      new THREE.Vector3(Math.cos(a) * 0.43, 3.73, 0.07 + Math.sin(a) * 0.43),
      new THREE.Vector3(
        Math.cos(a - Math.PI / 6) * 0.26,
        3.2,
        0.07 + Math.sin(a - Math.PI / 6) * 0.26,
      ),
    );
  }
  const netGeometry = new THREE.BufferGeometry().setFromPoints(netPoints);
  geometries.add(netGeometry);
  const netMaterial = new THREE.LineBasicMaterial({ color: '#fff6e8' });
  materials.add(netMaterial);
  basketball.add(new THREE.LineSegments(netGeometry, netMaterial));
  torus(basketball, 0.26, 0.012, M.white, [0, 3.2, 0.07]);
  const hoopScale=1.3;
  basketball.scale.setScalar(hoopScale);
  game.add(basketball);
  const ball = group(scene, [5.5, 0.49, 3.2]);
  // Pebbled cover and dark curved channels, with the approved cream accents.
  const ballRadius=.36;
  const pebbleCanvas=document.createElement('canvas');pebbleCanvas.width=pebbleCanvas.height=256;
  const pebbleContext=pebbleCanvas.getContext('2d');pebbleContext.fillStyle='#888';pebbleContext.fillRect(0,0,256,256);
  for(let row=0;row<43;row++)for(let col=0;col<43;col++){
    const x=col*6+(row%2)*3,y=row*6;
    pebbleContext.fillStyle='#bababa';pebbleContext.beginPath();pebbleContext.arc(x,y,1.6,0,Math.PI*2);pebbleContext.fill();
  }
  const pebbleTexture=new THREE.CanvasTexture(pebbleCanvas);textures.add(pebbleTexture);
  pebbleTexture.wrapS=pebbleTexture.wrapT=THREE.RepeatWrapping;pebbleTexture.repeat.set(4,2);
  const ballOrange=mat('#d97936',{roughness:.93,bumpMap:pebbleTexture,bumpScale:.003});
  const ballCream=mat('#f0e4cc',{roughness:.93,bumpMap:pebbleTexture,bumpScale:.003});
  const channel=mat('#392b22',{roughness:1});
  sphere(ball,ballRadius,ballOrange,[0,0,0],64,40);
  for(const phi of [Math.PI/4,Math.PI*5/4])add(ball,new THREE.SphereGeometry(ballRadius+.0006,24,40,phi,Math.PI/2,0,Math.PI),ballCream);
  // A central channel and two opposing sweeping channels divide the cover.
  torus(ball,ballRadius+.0008,.006,channel,[0,0,0],[Math.PI/2,0,0],64);
  torus(ball,ballRadius+.0008,.006,channel,[0,0,0],[0,Math.PI/4,0],64);
  for(const side of [-1,1]){
    const points=[];
    for(let i=0;i<=96;i++){
      const t=i/96*Math.PI*2;
      const x=side*(.48+.15*Math.cos(t*2)),q=Math.sqrt(1-x*x);
      const v=new THREE.Vector3(x,q*Math.cos(t),q*Math.sin(t)).multiplyScalar(ballRadius+.001);
      v.applyAxisAngle(new THREE.Vector3(0,1,0),Math.PI/4);points.push(v);
    }
    add(ball,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),96,.006,6,true),channel);
  }
  ball.rotation.set(.2,.35,.15);
  const ballHit = box(
    scene,
    [0.84, 0.84, 0.84],
    new THREE.MeshBasicMaterial({ visible: false }),
    [5.5, 0.49, 3.2],
    null,
    false,
  );
  materials.add(ballHit.material);
  ballHit.userData.stationId = "basketball";
  hitboxes.push(ballHit);

  game.add(ball,ballHit);
  const ballRest=ball.position.clone(),rimWorld=rimLocal.clone().multiplyScalar(hoopScale).add(basketball.position);
  const artTextureTarget=artMat;
  const overviewPose={position:[12.6,12.1,17.8],target:[0,1.55,-.15]};
  const poses=Object.fromEntries(['welcome','work','personal','about','make','play','art','future','garden','couch','fishing','tabs','articles','haweshly','tourism','rfid','books','resume','canvas','macbook','basketball','door-work','door-lounge','stairs-up','door-garden'].map(id=>[id,overviewPose]));
  const route={setFloor(){},setDoor(){},poses,screens:{arcade:{parent:arcade,position:[0,.32,.042],width:.88,height:.5}}};
  // All verified equipment is ready at entry.
  return {root,gear,shipments,avatar,character,dusk,globeBody,route,artTextureTarget,screenMats,basketball:{group:basketball,ball,ballRest,rimWorld,ballHit,game,hoopScale},
    screens:{macbook:{parent:lid,position:[0,.312,.018],width:.895,height:.53},arcade:route.screens.arcade},poses};
}
