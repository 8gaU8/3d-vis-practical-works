import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const COLOR = {
    black: 0x3a3f3b,
    blue: 0x74bed6,
    floor: 0x4a4A4B,
    wall: 0xfcfbfb,
    gray: 0xaaaaaa,
    black: 0x3a3f3b,
}



const initCamera = (cameraType) => {
    if (cameraType === THREE.OrthographicCamera)
    {
        const frustumSize = 100;
        const aspect = window.innerWidth / window.innerHeight;
        const camera = new THREE.OrthographicCamera(
            frustumSize * aspect / - 2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            frustumSize / - 2,
            0.1,
            2000
        )
        camera.rotation.x = -Math.PI / 3.5
        camera.position.y = 10
        camera.position.z = 100
        return camera

    } else if (cameraType === THREE.PerspectiveCamera)
    {
        const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000)
        camera.rotation.x = -Math.PI / 3.5
        camera.position.y = 2
        camera.position.z = 5
        return camera

    } else
    {
        console.error("Unknown camera type")
        return null
    }
}

const genSolid = (geometry, color) => {
    const meshMaterial = new THREE.MeshStandardMaterial({ color: color })
    // const meshMaterial = new THREE.MeshNormalMaterial()
    const solid = new THREE.Mesh(geometry, meshMaterial)
    solid.receiveShadow = true
    solid.castShadow = true;

    return solid
}

const createRoomBox = () => {
    const wallWidth = 0.1
    const roomWidth = 6;
    const roomHeight = 3;
    const roomDepth = 10;

    const room = new THREE.Group();

    const floorGeometry = new THREE.BoxGeometry(roomWidth, wallWidth, roomDepth);
    const floor = genSolid(floorGeometry, COLOR.floor);
    room.add(floor)

    const wallGeometry = new THREE.BoxGeometry(roomWidth, roomHeight, wallWidth);

    const backWall = genSolid(wallGeometry, COLOR.wall);
    backWall.translateZ(-roomDepth / 2 - wallWidth / 2)
    backWall.translateY(roomHeight / 2)
    room.add(backWall)

    const frontWall = genSolid(wallGeometry, COLOR.wall);
    frontWall.translateZ(roomDepth / 2 + wallWidth / 2)
    frontWall.translateY(roomHeight / 2)
    // room.add(frontWall)

    const sideWallGeometry = new THREE.BoxGeometry(wallWidth, roomHeight, roomDepth);
    const leftWall = genSolid(sideWallGeometry, COLOR.wall);
    leftWall.translateX(-roomWidth / 2 - wallWidth / 2)
    leftWall.translateY(roomHeight / 2)
    // room.add(leftWall)

    const rightWall = genSolid(sideWallGeometry, COLOR.wall);
    rightWall.translateX(roomWidth / 2 + wallWidth / 2)
    rightWall.translateY(roomHeight / 2)
    // room.add(rightWall)

    room.receiveShadow = true;
    room.translateY(-wallWidth / 2);
    return room;
}


const _createArcLegGeometry = (archHeight, archWidth) => {
    // Arc curve
    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, -archWidth),
        new THREE.Vector3(0, archHeight, 0),
        new THREE.Vector3(0, 0, archWidth)
    ]);

    // draw ellipse
    const ellipseShape = new THREE.Shape();
    const rx = 0.05; // radius of x-axis
    const ry = 0.015; // radius of y-axis
    const segments = 32;
    for (let i = 0; i < segments; i++)
    {
        const theta = (i / segments) * Math.PI * 2;
        // formula of ellipse: x = rx * cos(theta), y = ry * sin(theta)
        const x = rx * Math.cos(theta);
        const y = ry * Math.sin(theta);

        if (i === 0)
        {
            // only start point
            ellipseShape.moveTo(x, y);
        } else
        {
            // other points
            ellipseShape.lineTo(x, y);
        }
    }
    ellipseShape.closePath();

    const extrudeSettings = {
        steps: 20,
        depth: 20,
        extrudePath: curve,
    };

    const arcLegGeometry = new THREE.ExtrudeGeometry(ellipseShape, extrudeSettings);
    return arcLegGeometry;
}

const _createWheel = (wheelRadius) => {
    const axisRadius = wheelRadius / 1.5;
    const axisThickness = 0.02;
    const axisWheelGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisThickness, 16);
    axisWheelGeometry.rotateZ(Math.PI / 2)

    const axisWheel = genSolid(axisWheelGeometry, COLOR.black);

    const wheelThickness = 0.02;
    const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 16);
    new THREE.RingGeometry()
    wheelGeometry.rotateZ(Math.PI / 2)

    const wheel1 = genSolid(wheelGeometry, COLOR.gray);
    wheel1.translateX(- wheelThickness);
    const wheel2 = genSolid(wheelGeometry, COLOR.gray);
    wheel2.translateX(wheelThickness);

    axisWheel.add(wheel1)
    axisWheel.add(wheel2)
    return axisWheel
}


const createDesk = () => {
    // configure Desk Top
    const tableTopThickness = 0.02;
    const tableTopWidth = 2.4;
    const tableTopHeight = 1;
    // configure Legs
    const legLength = 0.80;
    const legThickness = 0.05;
    // configure Arc leg
    const archHeight = 0.05;
    const archWidth = 0.45;
    // configure Wheels
    const wheelRadius = 0.03;
    const wheelPosZ = archWidth - wheelRadius

    const desk = new THREE.Group();

    // create desk Top
    const deskTopGeometry = new THREE.BoxGeometry(tableTopWidth, tableTopThickness, tableTopHeight);
    const deskTop = genSolid(deskTopGeometry, COLOR.wall);
    deskTop.translateY(legLength + tableTopThickness / 2)
    desk.add(deskTop)

    // Create Desk Legs
    const legGroupR = new THREE.Group()

    // Main beam
    const legBeamGeometry = new THREE.CylinderGeometry(legThickness / 2, legThickness / 2, legLength, 32);
    const legBeam = genSolid(legBeamGeometry, COLOR.wall);
    legBeam.translateY(legLength / 2)
    legGroupR.add(legBeam)

    // Arc leg
    const arcLegBase = genSolid(_createArcLegGeometry(archHeight, archWidth), COLOR.wall);
    arcLegBase.translateY(-archHeight)
    legGroupR.add(arcLegBase)

    // wheels
    const wheelFront = _createWheel(wheelRadius);
    wheelFront.translateY(-archHeight - wheelRadius)
    wheelFront.translateZ(wheelPosZ)
    legGroupR.add(wheelFront)

    const wheelBack = _createWheel(wheelRadius);
    wheelBack.translateY(-archHeight - wheelRadius)
    wheelBack.translateZ(-wheelPosZ)
    legGroupR.add(wheelBack)

    // Clone the right leg to the left
    const legGroupL = legGroupR.clone()

    // Add legs to the desk
    legGroupR.translateX(tableTopWidth / 2 * 0.8)
    desk.add(legGroupR)
    legGroupL.translateX(-tableTopWidth / 2 * 0.8)
    desk.add(legGroupL)


    desk.translateY(archHeight + wheelRadius * 2)

    return desk
}



const drawHelper = (scene) => {
    scene.add(new THREE.AxesHelper(1000))

    scene.traverse((object) => {
        if (object instanceof THREE.Mesh)
        {
            const helper = new VertexNormalsHelper(object, 1, 0x00ff00)
            // scene.add(helper)
        }
    })
}

const initLight = (scene) => {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    ambientLight.castShadow = true
    scene.add(ambientLight);

    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.translateY(30)
    light.position.set(10, 100, 10);
    light.castShadow = true;

    const size = 10;
    light.shadow.camera.left = -size;
    light.shadow.camera.right = size;
    light.shadow.camera.top = size;
    light.shadow.camera.bottom = -size;

    const mapSize = 4048;
    light.shadow.mapSize.width = mapSize;
    light.shadow.mapSize.height = mapSize;

    scene.add(light);
    if (DEBUG_MODE)
    {
        const lightHelper = new THREE.CameraHelper(light.shadow.camera)
        scene.add(lightHelper)
    }
}


const initRenderer = () => {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.shadowMap.enabled = true;
    renderer.setSize(window.innerWidth, window.innerHeight)
    return renderer
}


const initRoom = (scene) => {
    const room = createRoomBox();
    scene.add(room);

    const desk1 = createDesk();
    desk1.name = "Desk1";
    desk1.translateZ(-3);
    desk1.translateX(-1.25)
    scene.add(desk1);

    const desk11 = createDesk();
    desk11.name = "Desk11";
    desk11.translateZ(-3);
    desk11.translateX(1.25)
    scene.add(desk11);

    const desk3 = createDesk();
    desk3.name = "Desk3";
    desk3.translateX(-1.8);
    desk3.translateZ(-1);
    desk3.rotateY(Math.PI / 2);
    scene.add(desk3);

    const desk4 = createDesk();
    desk4.name = "Desk4";
    desk4.translateX(-1.8);
    desk4.translateZ(1.5);
    desk4.rotateY(Math.PI / 2);
    scene.add(desk4);

    const desk5 = createDesk();
    desk5.name = "Desk5";
    desk5.translateX(1.8);
    desk5.translateZ(-1);
    desk5.rotateY(-Math.PI / 2);
    scene.add(desk5);

    const desk6 = createDesk()
    desk6.name = "Desk6";
    desk6.translateX(1.8);
    desk6.translateZ(1.5);
    desk6.rotateY(-Math.PI / 2);
    scene.add(desk6);


}



const moveStep = (scene)=>{
    const time = Date.now() * 0.005
    const xpos = Math.sin(time) * 2
    const zpos = Math.cos(time*2) 

    scene.getObjectByName("Desk").rotation.y = time
    scene.getObjectByName("Desk").position.x = xpos
    scene.getObjectByName("Desk").position.z = zpos
}

const main = (DEBUG_MODE = false) => {
    const scene = new THREE.Scene()

    const renderer = initRenderer()
    initRoom(scene)
    initLight(scene)

    if (DEBUG_MODE)
        drawHelper(scene)

    const camera = initCamera(THREE.PerspectiveCamera)
    scene.add(camera)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = true

    const render = () => {
        // moveStep(scene)
        controls.update()
        renderer.render(scene, camera)
        requestAnimationFrame(render)
    }
    requestAnimationFrame(render)
}


const DEBUG_MODE = true;
main(DEBUG_MODE)