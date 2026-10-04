import * as THREE from "./vendor/three.module.js";
import { OrbitControls } from "./vendor/OrbitControls.js";
import { createScreenSurfaces } from './screen-surfaces.js?v=single-studio-3';
import { buildCompactStudio } from "./scene/compact-studio.js?v=studio-clicks-4";

// Original geometry and interactions. Public portfolio references informed the
// scene/DOM split; no reference code, characters, models, or textures are used.
export async function createWorld(
  container,
  {
    onSelect = () => {},
    onHover = () => {},
    onShotResult = () => {},
    onUnboxingChange = () => {},
    onActionChange = () => {},
    onScreenExit = () => {},
    onScreenNavigate = () => {},
    lang = "en",
    reducedMotion = false,
  } = {},
) {
  const colors = {
    plaster: "#e3d1b5",
    white: "#f7f5f0",
    ink: "#181b23",
    blue: "#365ce6",
    wood: "#b98659",
    green: "#537768",
    pale: "#dce1d4",
  };
  const scene = new THREE.Scene();
  const materials = new Set(),
    geometries = new Set(),
    textures = new Set();
  const stationGroups = new Map(),
    hitboxes = [],
    labels = new Map();
  const mobile = matchMedia("(pointer: coarse)").matches;
  let destroyed = false,
    frame = 0,
    hidden = document.hidden,
    inView = true,
    hasSize = true,
    appActive = true,
    lastTime = 0;
  let hoverId = null,
    activeId = null,
    transition = null,
    pointerStart = null;
  let score = 0,
    shot = null,
    mode = "explore";
  let renderedWidth=0, renderedHeight=0, cameraFitAspect=1;
  const localPreview =
    location.hostname === "127.0.0.1" || location.hostname === "localhost";
  let framesMeasured = 0,
    frameDuration = 0;
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: mobile ? "low-power" : "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.3 : 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = "world-canvas";
  renderer.domElement.tabIndex=0;
  renderer.domElement.setAttribute(
    "aria-label",
    lang === "ar"
      ? "مساحة عمل ثلاثية الأبعاد. استخدم قائمة المشاريع لفتح العمل."
      : "Interactive three-dimensional workbench. Use the project menu for keyboard access.",
  );
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.touchAction = "none";
  container.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 160);
  // Orbit and object picking must share the same pointer-capture owner.
  // Capturing the container retargets pointerup away from the canvas listeners.
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = false;
  controls.minPolarAngle = Math.PI * 0.12;
  controls.maxPolarAngle = Math.PI * 0.44;
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.85;

  const mat = (color, opts = {}) => {
    const m = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.82,
      metalness: 0,
      ...opts,
    });
    materials.add(m);
    return m;
  };
  const M = Object.fromEntries(
    Object.entries(colors).map(([k, c]) => [k, mat(c)]),
  );
  M.gold = mat("#d4ad66", { metalness: 0.65, roughness: 0.33 });
  M.rubber = mat("#111621");
  M.glass = mat("#c1d2e4", {
    transparent: true,
    opacity: 0.3,
    roughness: 0.2,
    depthWrite: false,
  });
  M.orange = mat("#e18e5e");
  const add = (
    parent,
    geometry,
    material,
    pos = [0, 0, 0],
    rotation = [0, 0, 0],
    cast = true,
  ) => {
    geometries.add(geometry);
    const o = new THREE.Mesh(geometry, material);
    o.position.set(...pos);
    if (rotation) o.rotation.set(...rotation);
    o.castShadow = cast;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  };
  const box = (p, size, material, pos, rot, cast = true) =>
    add(p, new THREE.BoxGeometry(...size), material, pos, rot, cast);
  const cylinder = (p, r1, r2, h, material, pos, rot, segments = 16) =>
    add(p, new THREE.CylinderGeometry(r1, r2, h, segments), material, pos, rot);
  const sphere = (p, radius, material, pos, width = 18, height = 12) =>
    add(p, new THREE.SphereGeometry(radius, width, height), material, pos);
  const torus = (
    p,
    radius,
    tube,
    material,
    pos,
    rot = [Math.PI / 2, 0, 0],
    segments = 40,
  ) =>
    add(
      p,
      new THREE.TorusGeometry(radius, tube, 8, segments),
      material,
      pos,
      rot,
    );
  const group = (p, pos = [0, 0, 0], rot = [0, 0, 0]) => {
    const g = new THREE.Group();
    g.position.set(...pos);
    g.rotation.set(...rot);
    p.add(g);
    return g;
  };
  const rounded = (p, w, h, depth, radius, material, pos, rot = [0, 0, 0]) => {
    const s = new THREE.Shape();
    const x = -w / 2,
      y = -h / 2,
      r = Math.min(radius, w / 2, h / 2);
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    const geo = new THREE.ExtrudeGeometry(s, {
      depth,
      bevelEnabled: false,
      curveSegments: 8,
    });
    geo.translate(0, 0, -depth / 2);
    return add(p, geo, material, pos, rot);
  };
  const lineMaterials = new Map();
  const line = (p, points, color, opacity = 1) => {
    const geo = new THREE.BufferGeometry().setFromPoints(
      points.map((a) => new THREE.Vector3(...a)),
    );
    geometries.add(geo);
    const key = `${color}/${opacity}`;
    if (!lineMaterials.has(key)) {
      const m = new THREE.LineBasicMaterial({
        color,
        transparent: opacity < 1,
        opacity,
      });
      materials.add(m);
      lineMaterials.set(key, m);
    }
    const m = lineMaterials.get(key);
    const l = new THREE.Line(geo, m);
    p.add(l);
    return l;
  };
  const canvasMaterial = (draw, w = 512, h = 320) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    textures.add(t);
    const m = new THREE.MeshBasicMaterial({ map: t });
    materials.add(m);
    return m;
  };
  const names = {
    en: {
      tabs: "TABS / PRODUCT",
      haweshly: "HAWESHLY / FINTECH",
      tourism: "TOURISM / DISCOVERY",
      rfid: "RFID / SYSTEMS",
      art: "ART / EXPERIMENTS",
      articles: "NOTES / WRITING",
      about: "MOAAZ / ABOUT",
      work: "MY WORKSPACE",
      basketball: "BASKETBALL / PLAY",
    },
    ar: {
      tabs: "TABS / منتج",
      haweshly: "حوشلي / ادخار",
      tourism: "سياحة / اكتشاف",
      rfid: "RFID / أنظمة",
      art: "فن / تجارب",
      articles: "ملاحظات / كتابة",
      about: "معاذ / عني",
      work: "مساحة عملي",
      basketball: "كرة السلة / العب",
    },
  };
  const label = (p, id, pos, width = 1.7) => {
    const m = canvasMaterial(
      (c, w, h) => {
        c.fillStyle = colors.white;
        c.fillRect(0, 0, w, h);
        c.fillStyle = colors.ink;
        c.font = "600 27px sans-serif";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText((names[lang] || names.en)[id], w / 2, h / 2);
      },
      512,
      88,
    );
    // A top plane keeps the name crisp without adding unused box geometry.
    const plane = add(
      p,
      new THREE.PlaneGeometry(width, (width * 88) / 512),
      m,
      pos,
      [-Math.PI / 2, 0, 0],
      false,
    );
    labels.set(id, m);
    return plane;
  };
  const station = (id, position, hitSize, hitOffset = [0, 0.4, 0]) => {
    const g = group(scene, position);
    g.userData.baseY = position[1];
    g.userData.id = id;
    stationGroups.set(id, g);
    const hmat = new THREE.MeshBasicMaterial({ visible: false });
    materials.add(hmat);
    const h = box(g, hitSize, hmat, hitOffset, null, false);
    h.userData.stationId = id;
    hitboxes.push(h);
    return g;
  };

  scene.add(new THREE.HemisphereLight('#fff0d9', '#c3bdba', 2.35));
  const sun=new THREE.DirectionalLight('#ffe6cc',3.1);
  sun.position.set(-5,12,9);sun.castShadow=true;
  sun.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);
  Object.assign(sun.shadow.camera,{left:-11,right:11,top:10,bottom:-10,near:1,far:35});
  sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.035;sun.shadow.bias=-.0002;scene.add(sun);
  const fill=new THREE.DirectionalLight('#dae4ff',.65);fill.position.set(7,6,4);scene.add(fill);
  const room=buildCompactStudio({scene,M,mat,add,box,cylinder,sphere,torus,group,rounded,line,canvasMaterial,station,label,
    geometries,materials,textures,hitboxes,stationGroups,requestFrame,isDestroyed:()=>destroyed});
  const screens=createScreenSurfaces({container,scene,camera,anchors:room.screens,lang,onExit:()=>closeScreen(),onNavigate:onScreenNavigate,requestFrame});
  const {ball,ballRest,rimWorld,group:basketball,hoopScale=1}=room.basketball;
  let overview=null,screenReturnPose=null,looking=false;
  let actionState={busy:false,phase:'idle',action:null,room:'work',chapter:'work',seated:false,mode:'orbit',available:['macbook']};
  const poseIds=new Set([...Object.keys(room.poses),'studio']);
  let unboxingPhase='complete';
  // The cutaway faces the visitor. Bounds prevent orbiting behind walls or
  // below the room, while wheel and pinch still provide useful close inspection.
  const basketballFitDistance=aspect=>Math.hypot(2.2,3.8,6.5)*Math.max(1,.85/aspect);
  const fitDistanceFor=(detail=false,aspect=camera.aspect)=>detail?basketballFitDistance(aspect):overview?.distance;
  function boundCamera(pose){
    const offset=new THREE.Vector3(...pose.position).sub(new THREE.Vector3(...pose.target));
    const distance=offset.length(),azimuth=Math.atan2(offset.x,offset.z),polar=Math.atan2(Math.hypot(offset.x,offset.z),offset.y);
    if(pose.screen||pose.detail){
      controls.minAzimuthAngle=azimuth-.25;controls.maxAzimuthAngle=azimuth+.25;
      controls.minPolarAngle=Math.max(pose.detail?.52:.08,polar-.15);controls.maxPolarAngle=Math.min(pose.detail?1.19:Math.PI*.48,polar+.15);
      const fit=pose.detail?basketballFitDistance(camera.aspect):distance;
      controls.minDistance=fit*.78;controls.maxDistance=fit*1.6;
    }else{
      controls.minAzimuthAngle=-.12;controls.maxAzimuthAngle=.95;
      controls.minPolarAngle=.52;controls.maxPolarAngle=1.19;
      controls.minDistance=(overview?.distance||distance)*.58;
      controls.maxDistance=(overview?.distance||distance)*1.3;
    }
  }
  function safePose(pose){
    const target=new THREE.Vector3(...pose.target);
    target.x=THREE.MathUtils.clamp(target.x,-6.8,6.8);target.y=THREE.MathUtils.clamp(target.y,.5,4.4);target.z=THREE.MathUtils.clamp(target.z,-4.7,3.6);
    const sph=new THREE.Spherical().setFromVector3(new THREE.Vector3(...pose.position).sub(target));
    sph.theta=THREE.MathUtils.clamp(sph.theta,-.12,.95);sph.phi=THREE.MathUtils.clamp(sph.phi,.52,1.19);
    const fit=fitDistanceFor(Boolean(pose.detail))||sph.radius;
    sph.radius=THREE.MathUtils.clamp(sph.radius,fit*(pose.detail?.78:.58),fit*(pose.detail?1.6:1.3));
    return {...pose,position:new THREE.Vector3().setFromSpherical(sph).add(target).toArray(),target:target.toArray()};
  }
  function moveCamera(pose,instant=reducedMotion){
    // An unchanged pose should never create a temporary input lock on arrival.
    instant=instant||(camera.position.distanceToSquared(new THREE.Vector3(...pose.position))<1e-8&&controls.target.distanceToSquared(new THREE.Vector3(...pose.target))<1e-8);
    controls.enabled=false;
    transition={from:camera.position.clone(),to:new THREE.Vector3(...pose.position),fromTarget:controls.target.clone(),toTarget:new THREE.Vector3(...pose.target),elapsed:0,duration:instant?0:.78};
    if(instant){camera.position.copy(transition.to);controls.target.copy(transition.toTarget);transition=null;controls.enabled=mode!=='panel';}
    requestFrame();
  }
  function getPose(){const detail=activeId==='basketball';return {position:camera.position.toArray(),target:controls.target.toArray(),id:activeId,aspect:cameraFitAspect,fitDistance:fitDistanceFor(detail,cameraFitAspect),...(detail?{detail:true}:{})};}
  function restorePose(pose,instant=reducedMotion){
    if(destroyed||!pose||![pose.position,pose.target].every(a=>Array.isArray(a)&&a.length===3&&a.every(Number.isFinite)))return false;
    activeId=pose.id||'studio';clearHover();
    const oldAspect=Number.isFinite(pose.aspect)&&pose.aspect>0?pose.aspect:camera.aspect;
    const detail=Boolean(pose.detail)||pose.id==='basketball';
    const priorFit=Number.isFinite(pose.fitDistance)&&pose.fitDistance>0?pose.fitDistance:(detail?basketballFitDistance(oldAspect):null);
    const currentFit=fitDistanceFor(detail);
    const ratio=priorFit&&currentFit?currentFit/priorFit:Math.max(1,.9/camera.aspect)/Math.max(1,.9/oldAspect);
    const target=new THREE.Vector3(...pose.target);
    const scaled={...pose,detail,fitDistance:currentFit,position:new THREE.Vector3(...pose.position).sub(target).multiplyScalar(ratio).add(target).toArray()};
    cameraFitAspect=camera.aspect;
    const next=safePose(scaled);boundCamera(next);moveCamera(next,instant);return true;
  }
  function focus(id,instant=reducedMotion){
    if(destroyed||!poseIds.has(id)||!overview)return false;
    leaveScreen(false);activeId=id;clearHover();
    let next={...overview,id};
    if(id==='basketball'){const target=new THREE.Vector3(6.65,1.65,1.8),offset=new THREE.Vector3(2.2,3.8,6.5).multiplyScalar(Math.max(1,.85/camera.aspect));next={position:offset.add(target).toArray(),target:target.toArray(),id,detail:true};}
    boundCamera(next);moveCamera(next,instant);return true;
  }
  function home(){if(destroyed)return;leaveScreen(false);focus('studio');}
  function emitUnboxing(){const items=[...room.shipments.values()];onUnboxingChange({phase:unboxingPhase,remaining:items.filter(i=>!i.opened).map(i=>i.id),opened:items.filter(i=>i.opened).map(i=>i.id)});}
  function finishItem(item){
    item.elapsed=null;item.opened=true;item.g.visible=false;item.g.scale.setScalar(1);
    for(const g of room.gear[item.kind]){g.visible=true;g.position.copy(g.userData.homePosition);g.rotation.copy(g.userData.homeRotation);g.scale.setScalar(1);}
    unboxingPhase=[...room.shipments.values()].every(i=>i.opened)?'complete':'ready';emitUnboxing();requestFrame();
  }
  function startUnboxing(){
    if(destroyed||!room.shipments.size)return false;leaveScreen();
    for(const item of room.shipments.values()){
      item.opened=false;item.elapsed=null;item.g.visible=true;item.g.scale.setScalar(1);
      for(const f of item.flaps)f.hinge.rotation[f.axis]=0;
      room.gear[item.kind].forEach((g,i)=>{g.visible=false;g.scale.setScalar(.3);g.rotation.copy(g.userData.homeRotation);g.position.copy(item.g.position).add(new THREE.Vector3((i-(room.gear[item.kind].length-1)/2)*.2,.3,0));});
    }
    unboxingPhase='ready';home();emitUnboxing();requestFrame();return true;
  }
  function unpack(id){
    const item=room.shipments.get(id);if(destroyed||!item||item.opened)return false;
    item.opened=true;item.elapsed=0;
    for(const g of room.gear[item.kind]){g.visible=true;g.userData.unpackFrom=g.position.clone();}
    unboxingPhase='unpacking';if(reducedMotion)finishItem(item);else emitUnboxing();requestFrame();return true;
  }
  function updateUnboxing(dt){
    for(const item of room.shipments.values()){
      if(item.elapsed===null)continue;item.elapsed+=dt;
      const flap=Math.min(1,item.elapsed/.45),e=flap*flap*(3-2*flap);
      for(const f of item.flaps)f.hinge.rotation[f.axis]=f.sign*e*2.05;
      const t=THREE.MathUtils.clamp((item.elapsed-.2)/1,0,1),ease=t*t*(3-2*t);
      for(const g of room.gear[item.kind]){g.position.lerpVectors(g.userData.unpackFrom,g.userData.homePosition,ease);g.position.y+=Math.sin(t*Math.PI)*.8;g.scale.setScalar(.3+.7*ease);}
      if(item.elapsed>=1.3)finishItem(item);
    }
  }
  function unpackedDevice(){const item=room.shipments.get('shipment-computer');if(item&&!item.opened)finishItem(item);}
  function interact(id){
    if(destroyed||mode==='panel')return Promise.resolve(false);
    clearHover();
    if(room.shipments.has(id))return Promise.resolve(unpack(id));
    if(id==='cartons'){startUnboxing();return Promise.resolve(true);}
    actionState={...actionState,phase:'complete',action:id};onActionChange({...actionState});
    onSelect(id);requestFrame();return Promise.resolve(true);
  }
  function act(id){
    const aliases={'door-work':'work','door-lounge':'personal','stairs-up':'make','door-garden':'future',couch:'personal'};
    if(aliases[id])return Promise.resolve(focus(aliases[id]));
    return interact(id);
  }
  function openScreen(id,subject,returnTo){
    if(destroyed)return false;
    const prior=screens.getCurrent()?screenReturnPose:(transition?{...getPose(),position:transition.to.toArray(),target:transition.toTarget.toArray()}:getPose());
    if(id==='macbook')unpackedDevice();const pose=screens.open(id,subject,returnTo);if(!pose)return false;
    screenReturnPose=prior;renderer.domElement.style.pointerEvents='none';activeId=id;mode='explore';boundCamera(pose);moveCamera(pose);return true;
  }
  function leaveScreen(restore=true){
    if(!screens.getCurrent())return null;
    screens.close();renderer.domElement.style.pointerEvents='auto';const prior=screenReturnPose;screenReturnPose=null;
    if(restore&&prior)restorePose(prior,true);
    renderer.domElement.focus({preventScroll:true});return prior;
  }
  function backScreen(){screens.back();}
  function closeScreen(){const prior=leaveScreen(false);if(prior)restorePose(prior);else boundCamera(getPose());onScreenExit();return prior;}
  function setActive(value){appActive=Boolean(value);screens.setActive(appActive);if(!appActive){if(frame)cancelAnimationFrame(frame);frame=0;}else{lastTime=0;requestFrame();}}
  function setMode(value){mode=value||'explore';controls.enabled=mode!=='panel'&&!transition;clearHover();requestFrame();}
  function setReducedMotion(value){reducedMotion=Boolean(value);if(reducedMotion){if(transition){camera.position.copy(transition.to);controls.target.copy(transition.toTarget);transition=null;controls.enabled=mode!=='panel';}for(const item of room.shipments.values())if(item.elapsed!==null)finishItem(item);}requestFrame();}
  function setLanguage(value){lang=value==='ar'?'ar':'en';screens.setLanguage(lang);renderer.domElement.setAttribute('aria-label',lang==='ar'?'استوديو مصغّر تفاعلي. اسحب للدوران، وقرّب، واضغط على الأشياء.':'Interactive miniature studio. Drag to orbit, zoom, and click the objects.');requestFrame();}
  function shoot(power) {
    if (shot || destroyed) return false;
    const p = THREE.MathUtils.clamp(Number(power) || 0, 0, 1);
    ball.position.copy(ballRest);
    ball.rotation.set(0, 0, 0);
    // Keep the middle power setting calibrated to the actual enlarged rim.
    const travelTime=(ballRest.z-rimWorld.z)/4.2;
    const aimedVelocity=(rimWorld.y-ballRest.y)/travelTime+4.9*travelTime+.04;
    shot = {
      elapsed: 0,
      velocity: new THREE.Vector3(0, aimedVelocity+(p-.62)*3.05, -4.2),
      scored: false,
      bounced: false,
    };
    requestFrame();
    return true;
  }
  function updateShot(dt) {
    if (!shot) return;
    shot.elapsed += dt;
    // Small substeps prevent a low frame rate from tunnelling through the rim.
    const steps = Math.max(1, Math.ceil(dt / 0.008));
    const step = dt / steps;
    for (let i = 0; i < steps; i++) {
      const before = ball.position.clone();
      shot.velocity.y -= 9.8 * step;
      ball.position.addScaledVector(shot.velocity, step);
      if (
        !shot.scored &&
        before.y >= rimWorld.y &&
        ball.position.y < rimWorld.y &&
        shot.velocity.y < 0
      ) {
        const ratio = (before.y - rimWorld.y) / (before.y - ball.position.y);
        const cross = before.lerp(ball.position, ratio);
        if (Math.hypot(cross.x - rimWorld.x, cross.z - rimWorld.z) < 0.31*hoopScale) {
          shot.scored = true;
          score++;
        }
      }
      // Board collision is physical feedback, not a score shortcut.
      const boardZ = basketball.position.z - 0.62*hoopScale;
      if (
        before.z >= boardZ + 0.23 &&
        ball.position.z < boardZ + 0.23 &&
        ball.position.y > basketball.position.y+3.6*hoopScale &&
        ball.position.y < basketball.position.y+5*hoopScale &&
        Math.abs(ball.position.x - basketball.position.x) < 1.2*hoopScale
      ) {
        ball.position.z = boardZ + 0.23;
        shot.velocity.z = Math.abs(shot.velocity.z) * 0.8;
      }
      if (ball.position.y < 0.49) {
        ball.position.y = 0.49;
        shot.velocity.y = Math.abs(shot.velocity.y) * 0.38;
        shot.velocity.z *= 0.72;
        shot.bounced = true;
      }
      ball.rotation.x += step * 7;
      ball.rotation.z += step * 1.5;
    }
    if (shot.elapsed >= 2.15) {
      const result = { scored: shot.scored, score };
      shot = null;
      ball.position.copy(ballRest);
      onShotResult(result);
    }
  }
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function pick(event){
    const r=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects(hitboxes.filter(h=>{
      for(let p=h.parent;p;p=p.parent)if(!p.visible)return false;
      if(h.userData.shipment){const item=room.shipments.get(h.userData.stationId);return item.g.visible&&!item.opened;}return true;
    }),false);
    // Small authored objects take precedence over the encompassing desk hitbox.
    hits.sort((a,b)=>Number(a.object.userData.stationId==='work')-Number(b.object.userData.stationId==='work')||a.distance-b.distance);
    const id=hits[0]?.object.userData.stationId||null;
    if(localPreview)renderer.domElement.dataset.pick=id||'';
    return id;
  }
  function clearHover(){hoverId=null;renderer.domElement.style.cursor='grab';onHover(null);}
  function pointerMove(e){
    if(pointerStart){
      if(e.pointerId===pointerStart.id)pointerStart.distance=Math.max(pointerStart.distance,Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y));
      return;
    }
    if(destroyed||transition||mode==='panel'||screens.getCurrent())return;
    const id=pick(e);hoverId=id;renderer.domElement.style.cursor=id?'pointer':'grab';onHover(id?{id,x:e.clientX,y:e.clientY}:null);requestFrame();
  }
  function pointerDown(e){
    if(localPreview)renderer.domElement.dataset.input=JSON.stringify({phase:'down',transition:Boolean(transition),mode,screen:screens.getCurrent(),button:e.button});
    if(mode==='panel'||screens.getCurrent()||transition||e.button!==0)return;
    if(pointerStart){
      pointerStart.multiple=true;
      if(pointerStart.ball){pointerStart.ball=false;ball.scale.setScalar(1);controls.enabled=true;requestFrame();}
      return;
    }
    pointerStart={x:e.clientX,y:e.clientY,id:e.pointerId,time:performance.now(),multiple:false,distance:0};
    pick(e);
    if(!shot&&raycaster.intersectObjects(ball.children,true).length){pointerStart.ball=true;controls.enabled=false;renderer.domElement.style.cursor='grabbing';requestFrame();}else clearHover();
  }
  function pointerUp(e){
    const start=pointerStart;
    if(localPreview)renderer.domElement.dataset.input=JSON.stringify({phase:'up',start:Boolean(start),owner:start?.id===e.pointerId,multiple:start?.multiple,distance:start?.distance,elapsed:start?performance.now()-start.time:null,transition:Boolean(transition)});
    if(!start||start.id!==e.pointerId)return;
    pointerStart=null;
    if(start.multiple||mode==='panel'||screens.getCurrent()||transition){
      if(start.ball){ball.scale.setScalar(1);controls.enabled=mode!=='panel'&&!transition;requestFrame();}
      return;
    }
    if(start.ball){controls.enabled=true;ball.scale.setScalar(1);shoot(Math.min(1,(performance.now()-start.time)/1350));return;}
    if(Math.max(start.distance,Math.hypot(e.clientX-start.x,e.clientY-start.y))>9||performance.now()-start.time>650)return;
    const id=pick(e);if(id)interact(id);
  }
  function cancelPointer(){if(pointerStart?.ball){ball.scale.setScalar(1);controls.enabled=mode!=='panel'&&!transition;requestFrame();}pointerStart=null;clearHover();}
  renderer.domElement.addEventListener('pointermove',pointerMove);renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('pointercancel',cancelPointer);renderer.domElement.addEventListener('lostpointercapture',cancelPointer);renderer.domElement.addEventListener('pointerleave',clearHover);
  window.addEventListener('blur',cancelPointer);
  const outsideUp=e=>{if(e.target!==renderer.domElement)cancelPointer();};window.addEventListener('pointerup',outsideUp);
  controls.addEventListener('change',requestFrame);
  controls.addEventListener('start',()=>{looking=true;clearHover();if(transition){transition=null;controls.enabled=true;}});
  controls.addEventListener('end',()=>{looking=false;});
  function resize(){
    if(destroyed)return;const {width,height}=container.getBoundingClientRect();hasSize=width>=1&&height>=1;if(!hasSize){if(frame)cancelAnimationFrame(frame);frame=0;lastTime=0;return;}
    if(width===renderedWidth&&height===renderedHeight){requestFrame();return;}
    const firstSize=!renderedWidth||!renderedHeight;
    const priorOverviewDistance=overview?.distance,priorAspect=cameraFitAspect;
    renderedWidth=width;renderedHeight=height;
    camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);screens.resize(width,height);
    const target=new THREE.Vector3(0,1.65,-.2),direction=new THREE.Vector3(.52,.58,.78).normalize();
    const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right).normalize();
    const tanV=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),tanH=tanV*camera.aspect;let distance=0;
    for(const x of[-7.4,7.4])for(const y of[-.5,4.75])for(const z of[-5.5,5.1]){
      const point=new THREE.Vector3(x,y,z).sub(target);distance=Math.max(distance,Math.abs(point.dot(right))/tanH+point.dot(direction),Math.abs(point.dot(up))/tanV+point.dot(direction));
    }
    distance*=1.065;overview={position:direction.clone().multiplyScalar(distance).add(target).toArray(),target:target.toArray(),distance};
    const screenPose=screens.focusPose();
    if(screenPose){boundCamera(screenPose);moveCamera(screenPose,true);}
    else if(firstSize){activeId='studio';boundCamera(overview);moveCamera(overview,true);}
    else{
      const detail=activeId==='basketball';
      const ratio=detail?basketballFitDistance(camera.aspect)/basketballFitDistance(priorAspect):overview.distance/(priorOverviewDistance||overview.distance);
      camera.position.sub(controls.target).multiplyScalar(ratio).add(controls.target);
      if(transition){transition.from.sub(transition.fromTarget).multiplyScalar(ratio).add(transition.fromTarget);transition.to.sub(transition.toTarget).multiplyScalar(ratio).add(transition.toTarget);}
      const bounded=safePose(getPose());camera.position.set(...bounded.position);boundCamera(bounded);
    }
    cameraFitAspect=camera.aspect;controls.update();requestFrame();
  }
  function requestFrame(){if(!frame&&!destroyed&&!hidden&&inView&&hasSize&&appActive)frame=requestAnimationFrame(render);}
  function render(now){
    frame=0;if(destroyed||hidden||!inView||!hasSize||!appActive)return;
    const dt=Math.min(.05,lastTime?(now-lastTime)/1000:1/60);lastTime=now;
    if(transition){transition.elapsed+=dt;const t=transition.duration?Math.min(1,transition.elapsed/transition.duration):1,e=t*t*(3-2*t);camera.position.lerpVectors(transition.from,transition.to,e);controls.target.lerpVectors(transition.fromTarget,transition.toTarget,e);if(t>=1){transition=null;controls.enabled=mode!=='panel';}}
    updateUnboxing(dt);updateShot(dt);if(pointerStart?.ball)ball.scale.setScalar(1+Math.min(1,(performance.now()-pointerStart.time)/1350)*.08);const orbitChanged=controls.update();renderer.render(scene,camera);screens.render();
    if(localPreview){renderer.domElement.dataset.player=JSON.stringify(room.avatar.position.toArray());renderer.domElement.dataset.camera=JSON.stringify(getPose());renderer.domElement.dataset.phase=actionState.phase;renderer.domElement.dataset.scene='compact-studio';}
    if(transition||shot||pointerStart?.ball||orbitChanged||[...room.shipments.values()].some(i=>i.elapsed!==null))requestFrame();
  }
  const visibility=()=>{hidden=document.hidden;lastTime=0;if(hidden&&frame){cancelAnimationFrame(frame);frame=0;}else requestFrame();};document.addEventListener('visibilitychange',visibility);
  const observer=new ResizeObserver(resize);observer.observe(container);
  const viewObserver=new IntersectionObserver(entries=>{inView=entries[0]?.isIntersecting??true;lastTime=0;if(!inView&&frame){cancelAnimationFrame(frame);frame=0;}else requestFrame();});viewObserver.observe(container);
  const contextLost=e=>{e.preventDefault();hidden=true;if(frame)cancelAnimationFrame(frame);frame=0;container.dispatchEvent(new CustomEvent('world-context-lost'));};renderer.domElement.addEventListener('webglcontextlost',contextLost);
  function destroy(){
    if(destroyed)return;destroyed=true;if(frame)cancelAnimationFrame(frame);observer.disconnect();viewObserver.disconnect();controls.dispose();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pointerup',outsideUp);
    window.removeEventListener('blur',cancelPointer);
    renderer.domElement.removeEventListener('pointermove',pointerMove);renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('pointercancel',cancelPointer);renderer.domElement.removeEventListener('lostpointercapture',cancelPointer);renderer.domElement.removeEventListener('pointerleave',clearHover);renderer.domElement.removeEventListener('webglcontextlost',contextLost);
    for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();screens.destroy();renderer.dispose();renderer.domElement.remove();onHover(null);
  }
  setLanguage(lang);resize();
  try{controls.update();renderer.render(scene,camera);screens.render();}catch(error){destroy();throw error;}
  emitUnboxing();requestFrame();
  return {isScreenOpen:()=>Boolean(screens.getCurrent()),openScreen,closeScreen,backScreen,unpackedDevice,interact,setActive,act,getActionState:()=>({...actionState}),focus,home,getPose,restorePose,setLanguage,setMode,setReducedMotion,shoot,intro:()=>Promise.resolve(),skipIntro:()=>{},startUnboxing,unpack,replayUnboxing:startUnboxing,destroy};
}
