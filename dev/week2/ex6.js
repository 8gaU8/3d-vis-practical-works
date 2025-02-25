import * as THREE from 'three'
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'

// parameters

const DEBUG_MODE = false

const color = {
  white: 0xffffff,
  black: 0x3a3f3b,
  blue: 0x74bed6,
  floor: 0x888888,
  wall: 0xffffff,
  gray: 0xaaaaaa,
  yellow: 0xf0e303,
  green: 0x93ff70,
  red: 0xf03373,
  specularRed: 0xe60000,
}

const deskParams = {
  deskTopThickness: 0.02,
  deskTopWidth: 1.4,
  deskTopHeight: 0.7,
  legLength: 0.8,
  legThickness: 0.05,
  arcHeight: 0.05,
  arcWidth: 0.3,
  wheelRadius: 0.03,
  wheelPosZ: 0.27, // archWidth - wheelRadius
}

const roomParams = {
  wallWidth: 0.1,
  roomHeight: 3,
  roomWidth: 7,
  roomDepth: 10,
}

const genSolid = (geometry, solidColor) => {
  const meshMaterial = new THREE.MeshPhysicalMaterial({
    color: solidColor,
    roughness: 1.0,
    metalness: 0,
    reflectivity: 1,
  })
  const solid = new THREE.Mesh(geometry, meshMaterial)
  solid.receiveShadow = true
  solid.castShadow = true
  return solid
}

// ROOM
// -------------------------------

const createRoomBox = () => {
  // initialize room
  const { wallWidth, roomHeight, roomWidth, roomDepth } = roomParams

  const room = new THREE.Group()

  const floorGeometry = new THREE.BoxGeometry(roomWidth, wallWidth, roomDepth)
  const floor = genSolid(floorGeometry, color.floor)
  room.add(floor)

  const ceilGeometry = floorGeometry.clone()
  const ceil = genSolid(ceilGeometry, color.wall)
  ceil.translateY(roomHeight)
  // room.add(ceil)

  const wallGeometry = new THREE.BoxGeometry(roomWidth, roomHeight, wallWidth)

  const backWall = genSolid(wallGeometry, color.wall)
  backWall.translateZ(-roomDepth / 2 - wallWidth / 2)
  backWall.translateY(roomHeight / 2)
  backWall.name = 'backWall'
  room.add(backWall)

  const frontWall = genSolid(wallGeometry, color.wall)
  frontWall.translateZ(roomDepth / 2 + wallWidth / 2)
  frontWall.translateY(roomHeight / 2)
  frontWall.name = 'frontWall'
  room.add(frontWall)

  const sideWallGeometry = new THREE.BoxGeometry(wallWidth, roomHeight, roomDepth)
  const leftWall = genSolid(sideWallGeometry, color.wall)
  leftWall.translateX(-roomWidth / 2 - wallWidth / 2)
  leftWall.translateY(roomHeight / 2)
  leftWall.name = 'leftWall'
  room.add(leftWall)

  const rightWall = genSolid(sideWallGeometry, color.wall)
  rightWall.translateX(roomWidth / 2 + wallWidth / 2)
  rightWall.translateY(roomHeight / 2)
  rightWall.name = 'rightWall'
  room.add(rightWall)

  room.receiveShadow = true
  room.translateY(-wallWidth / 2)
  return room
}

// functions for desk parts
const createDeskFuncs = {
  createArcLegGeometry: (archHeight, archWidth) => {
    // lower part of leg of desk
    // Arc curve
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, -archWidth),
      new THREE.Vector3(0, archHeight, 0),
      new THREE.Vector3(0, 0, archWidth),
    ])

    // draw ellipse
    const ellipseShape = new THREE.Shape()
    const rx = 0.05 // radius of x-axis
    const ry = 0.015 // radius of y-axis
    const segments = 32
    for (let i = 0; i < segments; i += 1) {
      const theta = (i / segments) * Math.PI * 2
      // formula of ellipse: x = rx * cos(theta), y = ry * sin(theta)
      const x = rx * Math.cos(theta)
      const y = ry * Math.sin(theta)

      if (i === 0) {
        // only start point
        ellipseShape.moveTo(x, y)
      } else {
        // other points
        ellipseShape.lineTo(x, y)
      }
    }
    ellipseShape.closePath()

    const extrudeSettings = {
      steps: 20,
      depth: 20,
      extrudePath: curve,
    }

    const arcLegGeometry = new THREE.ExtrudeGeometry(ellipseShape, extrudeSettings)
    return arcLegGeometry
  },

  createWheel: (wheelRadius) => {
    // wheel for desks
    const axisRadius = wheelRadius / 1.5
    const axisThickness = 0.02
    const axisWheelGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisThickness, 16)
    axisWheelGeometry.rotateZ(Math.PI / 2)

    const axisWheel = genSolid(axisWheelGeometry, color.black)

    const wheelThickness = 0.02
    const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 16)
    wheelGeometry.rotateZ(Math.PI / 2)

    const wheel1 = genSolid(wheelGeometry, color.gray)
    wheel1.translateX(-wheelThickness)
    const wheel2 = genSolid(wheelGeometry, color.gray)
    wheel2.translateX(wheelThickness)

    axisWheel.add(wheel1)
    axisWheel.add(wheel2)
    return axisWheel
  },
}

const createDesk = () => {
  // initialize desk
  const {
    deskTopThickness,
    deskTopWidth,
    deskTopHeight,
    legLength,
    legThickness,
    arcHeight,
    arcWidth,
    wheelRadius,
    wheelPosZ,
  } = deskParams

  const { createArcLegGeometry, createWheel } = createDeskFuncs

  const desk = new THREE.Group()

  // create desk Top
  const deskTopGeometry = new THREE.BoxGeometry(deskTopWidth, deskTopThickness, deskTopHeight)
  const deskTop = genSolid(deskTopGeometry, color.wall)
  deskTop.translateY(legLength + deskTopThickness / 2)
  desk.add(deskTop)

  // Create Desk Legs
  const legGroupR = new THREE.Group()

  // Main beam
  const legBeamGeometry = new THREE.CylinderGeometry(
    legThickness / 2,
    legThickness / 2,
    legLength,
    32,
  )
  const legBeam = genSolid(legBeamGeometry, color.wall)
  legBeam.translateY(legLength / 2)
  legGroupR.add(legBeam)

  // Arc leg
  const arcLegBase = genSolid(createArcLegGeometry(arcHeight, arcWidth), color.wall)
  arcLegBase.translateY(-arcHeight)
  legGroupR.add(arcLegBase)

  // wheels
  const wheelFront = createWheel(wheelRadius)
  wheelFront.translateY(-arcHeight - wheelRadius)
  wheelFront.translateZ(wheelPosZ)
  legGroupR.add(wheelFront)

  const wheelBack = createWheel(wheelRadius)
  wheelBack.translateY(-arcHeight - wheelRadius)
  wheelBack.translateZ(-wheelPosZ)
  legGroupR.add(wheelBack)

  // Clone the right leg to the left
  const legGroupL = legGroupR.clone()

  // Add legs to the desk
  legGroupR.translateX((deskTopWidth / 2) * 0.8)
  desk.add(legGroupR)
  legGroupL.translateX((-deskTopWidth / 2) * 0.8)
  desk.add(legGroupL)

  desk.translateY(arcHeight + wheelRadius * 2)

  return desk
}

const makeCone = () => {
  const geometry = new THREE.ConeGeometry(0.1, 0.4, 24)
  const material = new THREE.MeshLambertMaterial({
    color: color.yellow,
    emissive: 0x0000ff,
    emissiveIntensity: 0.1,
  })
  const cone = new THREE.Mesh(geometry, material)
  cone.translateY(0.2)
  cone.receiveShadow = true
  cone.castShadow = true
  return cone
}

const makeCylinder = () => {
  const geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 32)
  const material = new THREE.MeshPhongMaterial({
    color: color.green,
    specular: 0x00ff00,
    shininess: 30,
  })
  const cylinder = new THREE.Mesh(geometry, material)
  cylinder.translateY(0.15)
  cylinder.receiveShadow = true
  cylinder.castShadow = true
  return cylinder
}

const makeSphere = () => {
  const geometry = new THREE.SphereGeometry(0.1, 32, 32)
  const material = new THREE.MeshPhysicalMaterial({
    color: color.red,
    roughness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.4,
    sheen: 1,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color(0x0000ff),
  })
  const sphere = new THREE.Mesh(geometry, material)
  sphere.translateY(0.1)
  sphere.receiveShadow = true
  sphere.castShadow = true
  return sphere
}

const initRoom = () => {
  const allObjectsInRoom = new THREE.Group()
  const room = createRoomBox()
  allObjectsInRoom.add(room)

  const createDeskGroup = (name, nbDesk = 2) => {
    const deskGroup = new THREE.Group()
    deskGroup.name = `${name}DeskGroup`

    const deskMergin = 0.01
    for (let i = 0; i < nbDesk; i += 1) {
      const desk = createDesk()
      desk.name = `${name}Desk${i}`
      desk.translateX(i * (deskParams.deskTopWidth + deskMergin))
      deskGroup.add(desk)
    }
    deskGroup.translateX(
      (-nbDesk / 2) * (deskParams.deskTopWidth + deskMergin) +
        deskMergin / 2 +
        deskParams.deskTopWidth / 2,
    )
    return deskGroup
  }

  const frontDeskGroup = createDeskGroup('Back', 2)
  frontDeskGroup.translateZ(2)
  allObjectsInRoom.add(frontDeskGroup)

  const leftDeskGroup = createDeskGroup('Left', 4)
  leftDeskGroup.rotateY(Math.PI / 2)
  leftDeskGroup.translateZ(0.3)
  leftDeskGroup.translateX(-1.6)
  allObjectsInRoom.add(leftDeskGroup)

  const rightDeskGroup = createDeskGroup('Right', 4)
  rightDeskGroup.rotateY(Math.PI / 2)
  rightDeskGroup.translateZ(3.9)
  rightDeskGroup.translateX(-1.6)
  allObjectsInRoom.add(rightDeskGroup)

  const { deskTopThickness, legLength, arcHeight, wheelRadius } = deskParams

  const ypos = legLength + deskTopThickness + arcHeight + wheelRadius * 2
  const cone = makeCone()
  cone.name = 'Lambert Cone'
  cone.translateY(ypos)
  cone.translateX(0.5)
  frontDeskGroup.add(cone)

  const cylinder = makeCylinder()
  cylinder.name = 'Phong Cylinder'
  cylinder.translateY(ypos)
  cylinder.translateZ(0.2)
  frontDeskGroup.add(cylinder)

  const sphere = makeSphere()
  sphere.name = 'Physical Sphere'
  sphere.translateY(ypos)
  sphere.translateX(-0.5)
  frontDeskGroup.add(sphere)
  return allObjectsInRoom
}

class LightController {
  constructor(scene, rootGui) {
    this.lightNames = ['Directional Light', 'Point Light', 'Spot Light', 'Hemisphere Light']

    this.scene = scene
    this.rootGui = rootGui

    this.directional = new THREE.DirectionalLight(0xffffff, 1)
    this.directional.name = 'Directional Light'

    this.point = new THREE.PointLight(0xffffff, 1, 10)
    this.point.name = 'Point Light'

    this.spot = new THREE.SpotLight(0xffffff, 1)
    this.spot.name = 'Spot Light'

    this.hemisphere = new THREE.HemisphereLight(0xffffbb, 0x080820, 1)
    this.hemisphere.name = 'Hemisphere Light'
  }

  init() {
    this.light = this.directional
    this.changeLight('Directional Light')
    this.initGUI()
    this.changeGUI('Directional Light')

    this.posX = 0
    this.posY = 2
    this.posZ = 0
  }

  initLight(light) {
    if (!(light instanceof THREE.HemisphereLight)) {
      light.shadow.camera.left = (-roomParams.roomWidth / 2) * 1.5
      light.shadow.camera.right = (roomParams.roomWidth / 2) * 1.5
      light.shadow.camera.top = (roomParams.roomDepth / 2) * 1.5
      light.shadow.camera.bottom = (-roomParams.roomDepth / 2) * 1.5

      light.shadow.mapSize.width = 2048 * 2
      light.shadow.mapSize.height = 2048

      light.castShadow = true
    }
    light.position.y = 2
    this.scene.add(light)
  }

  initAllLight() {
    this.initLight(this.directional)
    this.initLight(this.point)
    this.initLight(this.spot)
    this.initLight(this.hemisphere)
  }

  initGUI() {
    const directionalLightCtrl = this.rootGui.addFolder('Directional Light')
    directionalLightCtrl.addColor(this.directional, 'color')
    directionalLightCtrl.add(this.directional, 'intensity', 0, 10)

    const pointLightCtrl = this.rootGui.addFolder('Point Light')
    pointLightCtrl.addColor(this.point, 'color')
    pointLightCtrl.add(this.point, 'intensity', 0, 10)
    pointLightCtrl.add(this.point, 'distance', 0, 100)
    pointLightCtrl.add(this.point, 'decay', 0, 3)

    const spotLightCtrl = this.rootGui.addFolder('Spot Light')
    spotLightCtrl.addColor(this.spot, 'color')
    spotLightCtrl.add(this.spot, 'intensity', 0, 10)
    spotLightCtrl.add(this.spot, 'distance', 0, 10)
    spotLightCtrl.add(this.spot, 'decay', 0, 10)
    spotLightCtrl.add(this.spot, 'angle', -Math.PI / 2, Math.PI / 2)
    spotLightCtrl.add(this.spot, 'penumbra', 0, 1)

    const hemisphereLightCtrl = this.rootGui.addFolder('Hemisphere Light')
    hemisphereLightCtrl.addColor(this.hemisphere, 'color')
    hemisphereLightCtrl.addColor(this.hemisphere, 'groundColor')
    hemisphereLightCtrl.add(this.hemisphere, 'intensity', 0, 10)
  }

  // --- position ---
  get posX() {
    return this.light.position.x
  }

  set posX(value) {
    this.light.position.x = value
  }

  get posY() {
    return this.light.position.y
  }

  set posY(value) {
    this.light.position.y = value
  }

  get posZ() {
    return this.light.position.z
  }

  set posZ(value) {
    this.light.position.z = value
  }

  changeGUI(lightType) {
    this.lightNames.forEach((lightName) => {
      this.rootGui.children.forEach((gui) => {
        if (gui._title === lightName) {
          if (lightName === lightType) gui.show()
          else gui.hide()
        }
      })
    })
  }

  enableOneLight(lightType) {
    const lightTypeMap = {
      'Directional Light': this.directional,
      'Point Light': this.point,
      'Spot Light': this.spot,
      'Hemisphere Light': this.hemisphere,
    }
    // raise error if lightType is not in lightTypeMap
    if (!Object.keys(lightTypeMap).includes(lightType))
      throw new Error(`Invalid light type: ${lightType}`)

    Object.keys(lightTypeMap).forEach((key) => {
      if (key === lightType) {
        // console.log(lightType)
        lightTypeMap[key].visible = true
        this.light = lightTypeMap[key]
      } else {
        lightTypeMap[key].visible = false
      }
    })
    console.log('change to', this.light)
  }

  changeLight(lightType) {
    this.enableOneLight(lightType)
    this.initAllLight()
    this.changeGUI(lightType)
  }
}

const initLightGUI = (scene, rootGui) => {
  // Controller for light
  const lightCtrl = rootGui.addFolder('Light')
  const lightCtrlObj = new LightController(scene, lightCtrl)
  lightCtrl
    .add({ type: 'Directional Light' }, 'type', lightCtrlObj.lightNames)
    .onChange((value) => {
      lightCtrlObj.changeLight(value)
    })

  lightCtrlObj.init()

  // Controller for light position
  const positionCtrl = lightCtrl.addFolder('Position')
  positionCtrl.add(lightCtrlObj, 'posX', -10, 10)
  positionCtrl.add(lightCtrlObj, 'posY', -10, 10)
  positionCtrl.add(lightCtrlObj, 'posZ', -10, 10)
}

const shadowGuiFactory = (light, lightGUI, scene, enableCamera = false) => {
  const onChange = (value) => {
    light.target.updateMatrixWorld()
    light.shadow.camera.updateProjectionMatrix()
  }
  const mapSizeOnChange = (value) => {
    if (light.visible) {
      light.shadow.mapSize.width = value
      light.shadow.mapSize.height = value
      light.shadow.map.setSize(value, value)
    }
  }
  lightGUI.add(light, 'castShadow')
  lightGUI.add(light.shadow, 'bias', -0.01, 0.01)
  lightGUI.add(light.shadow, 'normalBias', -0.01, 0.01)
  lightGUI.add(light.shadow, 'blurSamples', 0, 10)
  lightGUI.add(light.shadow, 'intensity', 0, 1)
  lightGUI.add(light.shadow, 'radius', 0, 10)
  if (enableCamera) {
    lightGUI.add(light.shadow.camera, 'left', -10, 10).onChange(onChange)
    lightGUI.add(light.shadow.camera, 'right', -10, 10).onChange(onChange)
    lightGUI.add(light.shadow.camera, 'top', -10, 10).onChange(onChange)
    lightGUI.add(light.shadow.camera, 'bottom', -10, 10).onChange(onChange)
    lightGUI.add(light.shadow.camera, 'near', 0, 10).onChange(onChange)
    lightGUI.add(light.shadow.camera, 'far', 0, 10).onChange(onChange)
  }
  lightGUI.add({ mapSize: 512 }, 'mapSize', 0, 4096).onChange(mapSizeOnChange)
}

// GUI
// -------------------------------
/**
 * function to initialize material GUI
 * @param {THREE.Scene} scene
 * @param {GUI} rootGUI
 */
const initShadowGUI = (scene, rootGUI) => {
  const directionalLight = scene.getObjectByName('Directional Light')
  const spotLight = scene.getObjectByName('Spot Light')
  const pointLight = scene.getObjectByName('Point Light')

  // directional light gui
  const directionalLightGUI = rootGUI.addFolder('Directional Light')
  shadowGuiFactory(directionalLight, directionalLightGUI, scene, true)

  // spot light gui
  const spotLightGUI = rootGUI.addFolder('Spot Light')
  shadowGuiFactory(spotLight, spotLightGUI, scene, true)

  // point light gui
  const pointLightGUI = rootGUI.addFolder('Point Light')
  shadowGuiFactory(pointLight, pointLightGUI, scene, false)
}

const initGUI = (scene) => {
  // root
  const rootGui = new GUI()
  initLightGUI(scene, rootGui)
  initShadowGUI(scene, rootGui)
}

const drawHelper = (scene) => {
  // for debugging
  scene.add(new THREE.AxesHelper(1000))

  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      const helper = new VertexNormalsHelper(object, 1, 0x00ff00)
      scene.add(helper)
    }
  })
}

const initRenderer = () => {
  const canvas = document.querySelector('#c')
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas,
  })
  renderer.shadowMap.enabled = true
  renderer.setSize(window.innerWidth, window.innerHeight)
  return renderer
}

const initCamera = (cameraType) => {
  if (cameraType === THREE.OrthographicCamera) {
    const frustumSize = 3
    const aspect = window.innerWidth / window.innerHeight
    const camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.001,
      100,
    )
    camera.rotation.x = -Math.PI / 3.5
    camera.position.y = 2
    camera.position.z = 5
    return camera
  }
  if (cameraType === THREE.PerspectiveCamera) {
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    )
    camera.rotation.x = -Math.PI / 3.5
    camera.position.y = 2
    camera.position.z = 5
    return camera
  }
  return null
}

const main = () => {
  const renderer = initRenderer()
  const scene = new THREE.Scene()
  const room = initRoom()
  scene.add(room)
  // initLight(scene)
  if (DEBUG_MODE) drawHelper(scene)

  const camera = initCamera(THREE.PerspectiveCamera)
  scene.add(camera)
  renderer.render(scene, camera)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enabled = true

  initGUI(scene)
  const render = () => {
    controls.update()
    renderer.render(scene, camera)
    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
}

main()
