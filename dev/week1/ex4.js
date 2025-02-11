import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js';


const initCamera = (cameraType) => {
    if (cameraType === THREE.OrthographicCamera)
    {
        const frustumSize = 40;
        const aspect = window.innerWidth / window.innerHeight;
        const camera = new THREE.OrthographicCamera(frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 0.1, 1000)
        camera.rotation.x = -Math.PI / 3.5
        camera.position.y = 10
        camera.position.z = 10
        return camera

    } else if (cameraType === THREE.PerspectiveCamera)
    {
        const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.001, 10000)
        camera.rotation.x = -Math.PI / 3.5
        camera.position.y = 25
        camera.position.z = 50
        return camera

    } else
    {
        console.error("Unknown camera type")
        return null
    }
}

const genSolid = (geometry, color) => {
    // const meshMaterial = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide })
    const meshMaterial = new THREE.MeshStandardMaterial({ color: color, side: THREE.DoubleSide })
    // new THREE.MeshStandardMaterial();
    // 影を受け付ける
    const solid = new THREE.Mesh(geometry, meshMaterial)
    // solid.receiveShadow = true
    solid.castShadow = true;


    return solid
}


const createBody = () => {
    // const geometry = new THREE.OctahedronGeometry( radius );
    const verticesOfCube = [
        // top
        -1, -2, -1,
        1, -2, -1,
        1, 1, -1,
        -1, 1, -1,
        //   bottom
        -1, -2, 1,
        1, -2, 1,
        1, 1, 1,
        -1, 1, 1,
    ];

    const indicesOfFaces = [
        2, 1, 0, 0, 3, 2,
        0, 4, 7, 7, 3, 0,
        0, 1, 5, 5, 4, 0,
        1, 2, 6, 6, 5, 1,
        2, 3, 7, 7, 6, 2,
        4, 5, 6, 6, 7, 4
    ];

    const geometry = new THREE.PolyhedronGeometry(verticesOfCube, indicesOfFaces, 10, 0);
    const body = genSolid(geometry, 0x00ff00)
    body.translateY(2)
    body.name = "body"
    return body
}

const createFingerBase = (length, height, diam) => {
    const group = new THREE.Group()

    const jointGeo = new THREE.CylinderGeometry(diam / 2, diam / 2, height, 12);
    const jointL = genSolid(jointGeo, 0x00ffff)

    const armBeamGeo = new THREE.BoxGeometry(length, height, diam);
    const armBeam = genSolid(armBeamGeo, 0x00ff00)
    armBeam.translateX(length / 2)

    const jointR = genSolid(jointGeo, 0x00ffff)
    jointR.translateX(length / 1.0)

    group.add(jointL)
    group.add(armBeam)
    group.add(jointR)

    return group
}

const createArmBase = (length, height, diam) => {
    const group = new THREE.Group()

    // const jointGeo = new THREE.CylinderGeometry(diam / 2, diam / 2, height, 12);
    const jointGeo = new THREE.SphereGeometry(diam / 2.0, 12, 12)
    const jointL = genSolid(jointGeo, 0x00ffff)

    // const armBeamGeo = new THREE.BoxGeometry(length, height, diam);
    const armBeamGeo = new THREE.CylinderGeometry(diam / 2.0, diam / 2.0, length, 12);
    const armBeam = genSolid(armBeamGeo, 0x00ff00)
    armBeam.rotateZ(-Math.PI / 2.0)
    armBeam.translateY(height / 2.0)
    // armBeam.translateX(length / 2)

    const jointR = genSolid(jointGeo, 0x00ffff)
    jointR.translateX(length / 1.0)

    group.add(jointL)
    group.add(armBeam)
    group.add(jointR)

    return group
}

const createHand = (left = true) => {
    const fingerLength = 2
    const namePrefex = left ? "left" : "right"

    const cylinderGeo = new THREE.CylinderGeometry(1, 2, 3, 12);
    const cylinder = genSolid(cylinderGeo, 0xffffff)
    cylinder.rotateZ(Math.PI / 2)

    const boxGeo = new THREE.BoxGeometry(1, 3.0, 2);
    const box = genSolid(boxGeo, 0xffffff)
    box.name = 'box1'
    box.translateX(2)

    const fingerThickness = 0.8
    const finger1 = createFingerBase(fingerLength, fingerThickness, fingerThickness)
    finger1.translateX(2.5)
    finger1.translateY(1)
    finger1.name = namePrefex + "Finger1"

    const fingerTip1 = createFingerBase(fingerLength, fingerThickness, fingerThickness)
    fingerTip1.translateX(fingerLength)
    fingerTip1.name = namePrefex + "FingerTip1"
    finger1.add(fingerTip1)
    finger1.rotateX(Math.PI / 2)

    const finger2 = createFingerBase(fingerLength, fingerThickness, fingerThickness)
    finger2.translateX(2.5)
    finger2.translateY(-1)
    finger2.name = namePrefex + "Finger2"
    finger2.rotateX(-Math.PI / 2)

    const fingerTip2 = createFingerBase(fingerLength, fingerThickness, fingerThickness)
    fingerTip2.translateX(fingerLength)
    fingerTip2.name = namePrefex + "FingerTip2"
    finger2.add(fingerTip2)


    const palmBase = new THREE.Group()
    palmBase.add(cylinder)
    palmBase.add(box)
    palmBase.add(finger1)
    palmBase.add(finger2)
    palmBase.name = namePrefex + "Hand"
    return palmBase


}

const createArm = (left = true) => {
    const armDiam = 4
    const armHeight = 4
    const armLength = 5
    const sign = left ? 1 : -1
    const namePrefex = left ? "left" : "right"
    const shoulderGeo = new THREE.CylinderGeometry(4, 2, 8, 12);

    const shoulder = genSolid(shoulderGeo, 0xff0000)
    shoulder.rotateZ(sign * Math.PI / 4)
    shoulder.rotateX(Math.PI / 4)
    shoulder.translateY(7)
    shoulder.translateX(-sign * 4)
    shoulder.name = namePrefex + "Shoulder"

    const upperArm = createArmBase(armLength, armHeight, armDiam)
    upperArm.rotateZ(Math.PI / 2)
    upperArm.rotateX(Math.PI / 2)
    upperArm.translateX(armLength)
    upperArm.name = namePrefex + "UpperArm"
    shoulder.add(upperArm)

    const middleArm = createArmBase(armLength, armHeight, armDiam)
    middleArm.rotateZ(Math.PI / 2)
    middleArm.rotateX(Math.PI / 2)
    middleArm.translateZ(1 * armLength)
    middleArm.rotateX(Math.PI / 2)
    middleArm.rotateZ(Math.PI / 2)
    middleArm.name = namePrefex + "MiddleArm"
    upperArm.add(middleArm)

    const foreArm = createArmBase(armLength, armHeight, armDiam)
    foreArm.rotateZ(Math.PI / 2)
    foreArm.rotateX(Math.PI / 2)
    foreArm.translateZ(1 * armLength)
    foreArm.rotateY(-Math.PI / 2)
    foreArm.rotateX(Math.PI / 2)
    foreArm.name = namePrefex + "ForeArm"
    middleArm.add(foreArm)

    const hand = createHand(left)
    hand.translateX(armLength * 1.5)
    foreArm.add(hand)


    return shoulder
}


const createRobot = () => {
    const body = createBody()
    const leftArm = createArm(true)
    const rightArm = createArm(false)
    body.add(leftArm)
    body.add(rightArm)
    return body
}


const rotateStep = (robot) => {
    const time = Date.now() * 0.001
    robot.getObjectByName("leftUpperArm").rotation.y = Math.sin(time)
    robot.getObjectByName("leftMiddleArm").rotation.z += 0.01
    robot.getObjectByName("leftMiddleArm").rotation.y += 0.02
    robot.getObjectByName("leftForeArm").rotation.y += 0.01

    robot.getObjectByName("rightUpperArm").rotation.y = Math.sin(time)
    robot.getObjectByName("rightMiddleArm").rotation.z += 0.01
    robot.getObjectByName("rightMiddleArm").rotation.y += 0.02
    robot.getObjectByName("rightForeArm").rotation.y += 0.01

    robot.getObjectByName("rightHand").rotation.x += 0.02

    robot.getObjectByName("leftFinger1").rotation.y = Math.max(Math.sin(time), 0)
    robot.getObjectByName("leftFingerTip1").rotation.y = Math.min(Math.sin(time), 0)
    robot.getObjectByName("leftFinger2").rotation.y = Math.max(Math.sin(time), 0)
    robot.getObjectByName("leftFingerTip2").rotation.y = Math.min(Math.sin(time), 0)

    robot.getObjectByName("rightFinger1").rotation.y = Math.max(Math.sin(time), 0)
    robot.getObjectByName("rightFingerTip1").rotation.y = Math.min(Math.sin(time), 0)
    robot.getObjectByName("rightFinger2").rotation.y = Math.max(Math.sin(time), 0)
    robot.getObjectByName("rightFingerTip2").rotation.y = Math.min(Math.sin(time), 0)

}


const drawHelper = (scene) => {
    scene.add(new THREE.AxesHelper(1000))

    scene.traverse((object) => {
        if (object instanceof THREE.Mesh)
        {
            const helper = new VertexNormalsHelper(object, 1, 0x00ff00)
            scene.add(helper)
        }
    })
}

const main = (DEBUG_MODE) => {

    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.shadowMap.enabled = true;

    renderer.setSize(window.innerWidth, window.innerHeight)

    const scene = new THREE.Scene()

    // 床
    const meshFloor = new THREE.Mesh(
        new THREE.BoxGeometry(400, 0.1, 400),
        new THREE.MeshStandardMaterial());
    // 影を受けるMeshオブジェクトに影の設定
    meshFloor.translateY(-20)
    meshFloor.receiveShadow = true;
    scene.add(meshFloor);

    const light = new THREE.DirectionalLight(0xffffff, 2)
    // ライトに影を有効にする
    light.castShadow = true
    scene.add(light);

    const robot = createRobot()
    robot.castShadow =true 
    robot.receiveShadow =true 
    scene.add(robot)

    if (DEBUG_MODE)
        drawHelper(scene)
    console.log(robot)


    const camera = initCamera(THREE.PerspectiveCamera)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update()



    controls.enabled = true

    const render = () => {
        rotateStep(scene, 0.5)
        // if (DEBUG_MODE)
        //     drawHelper(scene)
        controls.update()
        renderer.render(scene, camera)
        requestAnimationFrame(render)
        // renderer.updateShadowMap()
    }
    requestAnimationFrame(render)
}


const DEBUG_MODE = false
main(DEBUG_MODE)