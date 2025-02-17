import * as THREE from 'three';
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';


// parameters

const color = {
    black: 0x3a3f3b,
    blue: 0x74bed6,
    floor: 0x888888,
    wall: 0xffffff,
    gray: 0xaaaaaa,
    black: 0x3a3f3b,
    yellow: 0xf0e303,
    green: 0x93ff70,
    red: 0xf03373
}

const deskParams = {
    deskTopThickness: 0.02,
    deskTopWidth: 1.4,
    deskTopHeight: 0.7,
    legLength: 0.80,
    legThickness: 0.05,
    arcHeight: 0.05,
    arcWidth: 0.3,
    wheelRadius: 0.03,
    wheelPosZ: 0.27 // archWidth - wheelRadius
};

const roomParams = {
    wallWidth: 0.1,
    roomHeight: 3,
    roomWidth: 7,
    roomDepth: 10,
}


const initCamera = (cameraType) => {
    if (cameraType === THREE.OrthographicCamera)
    {
        const frustumSize = 10;
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
        const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)
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
    const meshMaterial = new THREE.MeshPhongMaterial({ color: color, reflectivity: 1, refractionRatio: 0.5, shininess: 100 });
    const solid = new THREE.Mesh(geometry, meshMaterial)
    solid.receiveShadow = true
    solid.castShadow = true;
    return solid
}

const createRoomBox = () => {
    const {
        wallWidth,
        roomHeight,
        roomWidth,
        roomDepth
    } = roomParams;

    const room = new THREE.Group();

    const floorGeometry = new THREE.BoxGeometry(roomWidth, wallWidth, roomDepth);
    const floor = genSolid(floorGeometry, color.floor);
    room.add(floor)

    const ceilGeometry = floorGeometry.clone()
    const ceil = genSolid(ceilGeometry, color.wall);
    ceil.translateY(roomHeight)
    // room.add(ceil)

    const wallGeometry = new THREE.BoxGeometry(roomWidth, roomHeight, wallWidth);

    const backWall = genSolid(wallGeometry, color.wall);
    backWall.translateZ(-roomDepth / 2 - wallWidth / 2)
    backWall.translateY(roomHeight / 2)
    backWall.name = 'backWall'
    room.add(backWall)

    const frontWall = genSolid(wallGeometry, color.wall);
    frontWall.translateZ(roomDepth / 2 + wallWidth / 2)
    frontWall.translateY(roomHeight / 2)
    frontWall.name = 'frontWall'
    room.add(frontWall)

    const sideWallGeometry = new THREE.BoxGeometry(wallWidth, roomHeight, roomDepth);
    const leftWall = genSolid(sideWallGeometry, color.wall);
    leftWall.translateX(-roomWidth / 2 - wallWidth / 2)
    leftWall.translateY(roomHeight / 2)
    leftWall.name = 'leftWall'
    room.add(leftWall)

    const rightWall = genSolid(sideWallGeometry, color.wall);
    rightWall.translateX(roomWidth / 2 + wallWidth / 2)
    rightWall.translateY(roomHeight / 2)
    rightWall.name = 'rightWall'
    room.add(rightWall)

    room.receiveShadow = true;
    room.translateY(-wallWidth / 2);
    console.log(room)
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
    // wheel for desks
    const axisRadius = wheelRadius / 1.5;
    const axisThickness = 0.02;
    const axisWheelGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisThickness, 16);
    axisWheelGeometry.rotateZ(Math.PI / 2)

    const axisWheel = genSolid(axisWheelGeometry, color.black);

    const wheelThickness = 0.02;
    const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 16);
    new THREE.RingGeometry()
    wheelGeometry.rotateZ(Math.PI / 2)

    const wheel1 = genSolid(wheelGeometry, color.gray);
    wheel1.translateX(- wheelThickness);
    const wheel2 = genSolid(wheelGeometry, color.gray);
    wheel2.translateX(wheelThickness);

    axisWheel.add(wheel1)
    axisWheel.add(wheel2)
    return axisWheel
}


const createDesk = () => {
    const {
        deskTopThickness,
        deskTopWidth,
        deskTopHeight,
        legLength,
        legThickness,
        arcHeight,
        arcWidth,
        wheelRadius,
        wheelPosZ
    } = deskParams;

    const desk = new THREE.Group();

    // create desk Top
    const deskTopGeometry = new THREE.BoxGeometry(deskTopWidth, deskTopThickness, deskTopHeight);
    const deskTop = genSolid(deskTopGeometry, color.wall);
    deskTop.translateY(legLength + deskTopThickness / 2)
    desk.add(deskTop)

    // Create Desk Legs
    const legGroupR = new THREE.Group()

    // Main beam
    const legBeamGeometry = new THREE.CylinderGeometry(legThickness / 2, legThickness / 2, legLength, 32);
    const legBeam = genSolid(legBeamGeometry, color.wall);
    legBeam.translateY(legLength / 2)
    legGroupR.add(legBeam)

    // Arc leg
    const arcLegBase = genSolid(_createArcLegGeometry(arcHeight, arcWidth), color.wall);
    arcLegBase.translateY(-arcHeight)
    legGroupR.add(arcLegBase)

    // wheels
    const wheelFront = _createWheel(wheelRadius);
    wheelFront.translateY(-arcHeight - wheelRadius)
    wheelFront.translateZ(wheelPosZ)
    legGroupR.add(wheelFront)

    const wheelBack = _createWheel(wheelRadius);
    wheelBack.translateY(-arcHeight - wheelRadius)
    wheelBack.translateZ(-wheelPosZ)
    legGroupR.add(wheelBack)

    // Clone the right leg to the left
    const legGroupL = legGroupR.clone()

    // Add legs to the desk
    legGroupR.translateX(deskTopWidth / 2 * 0.8)
    desk.add(legGroupR)
    legGroupL.translateX(-deskTopWidth / 2 * 0.8)
    desk.add(legGroupL)

    desk.translateY(arcHeight + wheelRadius * 2)

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
    const useNormalLights = false;
    if (!useNormalLights)
    {

        const intensity = 1.2;
        const decay = 0.1;
        const dist = 4.;
        for (let i = -3; i <= 3; i += 3)
        {
            for (let j = -3; j <= 3; j += 3)
            {
                const light = new THREE.PointLight(0xffffff, intensity, dist, decay); // 色、強度、距離
                light.castShadow = true;
                light.translateX(j * 0.8)
                light.translateY(roomParams.roomHeight - 0.1)
                light.translateZ(i)
                light.name = 'light'
                scene.add(light);
                if (DEBUG_MODE)
                {
                    const lightHelper = new THREE.CameraHelper(light.shadow.camera)
                    scene.add(lightHelper)
                }
            }
        }

    }
}


const initRenderer = () => {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.shadowMap.enabled = true;
    renderer.setSize(window.innerWidth, window.innerHeight)
    return renderer
}

const makeCone = () => {
    const geometry = new THREE.ConeGeometry(0.1, 0.4, 32);
    const material = new THREE.MeshLambertMaterial({
        color: color.yellow,
    });
    const cone = new THREE.Mesh(geometry, material);
    cone.translateY(0.2)
    cone.receiveShadow = true;
    return cone
}

const makeCylinder = () => {
    const geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 32);
    const material = new THREE.MeshPhongMaterial({
        color: color.green,
        specular: 0xe60000,
        shininess: 100,
        reflectivity: 1,
        refractionRatio: 0.5,
    });
    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.translateY(0.15)
    cylinder.receiveShadow = true;
    return cylinder
}

const makeSphere = () => {
    const geometry = new THREE.SphereGeometry(0.1, 32, 32);
    const material = new THREE.MeshPhysicalMaterial({
        color: color.red,
        roughness: 0.5,
        metalness: 1,
        reflectivity: 1,

    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.translateY(0.1)
    sphere.receiveShadow = true;
    return sphere
}



const initRoom = (scene) => {
    const room = createRoomBox();
    scene.add(room);

    const createDeskGroup = (name, nbDesk = 2) => {
        const deskGroup = new THREE.Group();
        deskGroup.name = name + "DeskGroup";

        const deskMergin = 0.01;
        for (let i = 0; i < nbDesk; i++)
        {
            const desk = createDesk();
            desk.name = name + "Desk" + i;
            desk.translateX(i * (deskParams.deskTopWidth + deskMergin))
            deskGroup.add(desk);
        }
        deskGroup.translateX(-nbDesk / 2 * (deskParams.deskTopWidth + deskMergin) + deskMergin / 2 + deskParams.deskTopWidth / 2)
        return deskGroup
    }

    const frontDeskGroup = createDeskGroup("Back", 2);
    frontDeskGroup.translateZ(2);
    scene.add(frontDeskGroup);

    const leftDeskGroup = createDeskGroup("Left", 4);
    leftDeskGroup.rotateY(Math.PI / 2);
    leftDeskGroup.translateZ(0.3)
    leftDeskGroup.translateX(-1.6);
    scene.add(leftDeskGroup);

    const rightDeskGroup = createDeskGroup("Right", 4);
    rightDeskGroup.rotateY(Math.PI / 2);
    rightDeskGroup.translateZ(3.9)
    rightDeskGroup.translateX(-1.6);
    scene.add(rightDeskGroup);


    const { deskTopThickness, legLength, arcHeight, wheelRadius } = deskParams;

    const ypos = legLength + deskTopThickness + arcHeight + wheelRadius * 2;
    const cone = makeCone()
    cone.name = 'Cone on Desk6'
    cone.translateY(ypos);
    cone.translateX(0.5);
    frontDeskGroup.add(cone);

    const cylinder = makeCylinder()
    cylinder.name = 'Cylinder on rightDeskGroup'
    cylinder.translateY(ypos);
    cylinder.translateZ(0.2)
    frontDeskGroup.add(cylinder);

    const sphere = makeSphere()
    sphere.name = 'Sphere on rightDeskGroup'
    sphere.translateY(ypos);
    sphere.translateX(-0.5);
    frontDeskGroup.add(sphere);

}

const initGUI = (scene) => {

    const gui = new GUI();
    const obj = {
        backWall: scene.getObjectByName('backWall').material.color,
        frontWall: scene.getObjectByName('frontWall').material.color,
        rightWall: scene.getObjectByName('rightWall').material.color,
        leftWall: scene.getObjectByName('leftWall').material.color,
    }

    gui.addColor(obj, 'backWall');
    gui.addColor(obj, 'frontWall');
    gui.addColor(obj, 'rightWall');
    gui.addColor(obj, 'leftWall');

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

    initGUI(scene)

    const render = () => {
        controls.update()
        renderer.render(scene, camera)
        requestAnimationFrame(render)
    }
    requestAnimationFrame(render)
}


const DEBUG_MODE = false;
main(DEBUG_MODE)