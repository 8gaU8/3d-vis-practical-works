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

// TEXTURES
// -------------------------------
/**
 * @param {string} path
 * @returns THREE.Texture
 */
const initBaseMaps = (path, repeat = 0) => {
  const texture = new THREE.TextureLoader().load(path)
  if (repeat !== 0) {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(repeat, repeat)
  }
  return {
    null: null,
    map: texture,
  }
}

const initEnvMap = (path) => {
  const textureLoader = new THREE.TextureLoader()
  const reflectionMap = textureLoader.load(path)
  reflectionMap.mapping = THREE.CubeRefractionMapping

  const refractionMap = textureLoader.load(path)
  refractionMap.mapping = THREE.CubeRefractionMapping
  return {
    null: null,
    reflection: reflectionMap,
    refraction: refractionMap,
  }
}

const textures = {
  map: initBaseMaps('../resources/grenouille-gaus.jpg'),
  envMap: initEnvMap('../resources/env.jpg'),
  alphaMap: initBaseMaps('../resources/alpha.jpg'),
  emissiveMap: initBaseMaps('../resources/emissive.jpg'),
  bumpMap: initBaseMaps('../resources/bump3.jpg', 3),
  normalMap: initBaseMaps('../resources/bump.jpg', 3),
  specularMap: initBaseMaps('../resources/bump2.jpg'),
  lightMap: initBaseMaps('../resources/light.jpg'),
  displacementMap: initBaseMaps('../resources/displacement.png'),
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
  const geometry = new THREE.ConeGeometry(0.1, 0.4, 12)
  const material = new THREE.MeshLambertMaterial()
  const cone = new THREE.Mesh(geometry, material)
  cone.material.emissiveMap = textures.map.map
  cone.material.emissiveIntensity = 10
  cone.translateY(0.2)
  cone.receiveShadow = true
  cone.castShadow = true
  return cone
}

const makeCylinder = () => {
  const geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 12)
  const material = new THREE.MeshPhongMaterial()
  const cylinder = new THREE.Mesh(geometry, material)
  cylinder.translateY(0.15)
  cylinder.receiveShadow = true
  cylinder.castShadow = true
  return cylinder
}

const makeSphere = () => {
  const geometry = new THREE.SphereGeometry(0.1, 32, 10)
  const material = new THREE.MeshPhysicalMaterial()
  const sphere = new THREE.Mesh(geometry, material)
  sphere.translateY(0.1)
  sphere.receiveShadow = true
  sphere.castShadow = true
  return sphere
}

const initRoom = (scene) => {
  const room = createRoomBox()
  scene.add(room)

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
  scene.add(frontDeskGroup)

  const leftDeskGroup = createDeskGroup('Left', 4)
  leftDeskGroup.rotateY(Math.PI / 2)
  leftDeskGroup.translateZ(0.3)
  leftDeskGroup.translateX(-1.6)
  scene.add(leftDeskGroup)

  const rightDeskGroup = createDeskGroup('Right', 4)
  rightDeskGroup.rotateY(Math.PI / 2)
  rightDeskGroup.translateZ(3.9)
  rightDeskGroup.translateX(-1.6)
  scene.add(rightDeskGroup)

  const { deskTopThickness, legLength, arcHeight, wheelRadius } = deskParams

  const ypos = legLength + deskTopThickness + arcHeight + wheelRadius * 2
  const cone = makeCone()
  cone.name = 'Cone'
  cone.translateY(ypos)
  cone.translateX(0.5)
  frontDeskGroup.add(cone)

  const cylinder = makeCylinder()
  cylinder.name = 'Cylinder'
  cylinder.translateY(ypos)
  cylinder.translateZ(0.2)
  frontDeskGroup.add(cylinder)

  const sphere = makeSphere()
  sphere.name = 'Sphere'
  sphere.translateY(ypos)
  sphere.translateX(-0.5)
  frontDeskGroup.add(sphere)
}

// Utility controllers for material GUI
// -------------------------------
class MaterialParameterController {
  constructor(objects) {
    this.objects = objects
  }

  update(key, value, func = null) {
    this.objects.forEach((object) => {
      if (func) {
        func(object, key, value)
      } else {
        object.material[key] = value
      }
      object.material.needsUpdate = true
    })
  }
}

class Param {
  /**
   * @param {any} value
   * @param {string} type
   * @param {number} [min]
   * @param {number} [max]
   * @param {Object.<string, any>} [choiceMap]
   * @param {function} [func]
   */
  constructor(value, type, min = null, max = null, choiceMap = null, func = null) {
    this.value = value
    this.type = type
    this.min = min
    this.max = max
    this.choiceMap = choiceMap
    this.func = func
  }
  copy() {
    return new Param(this.value, this.type, this.min, this.max, this.choiceMap, this.func)
  }
}

/**
 * function to generate GUI from parameters
 * @param {Object.<string, Param>} params
 * @param {GUI} rootGUI
 * @param {MaterialParameterController} paramCtrl
 * @returns {void}
 */
const generateGUIfromParams = (params, rootGUI, paramCtrl) => {
  Object.keys(params).forEach((key) => {
    const onChange = (value) => paramCtrl.update(key, value, params[key].func)

    if (params[key].type === 'number') {
      rootGUI
        .add(params[key], 'value', params[key].min, params[key].max)
        .name(key)
        .onChange(onChange)
    } else if (params[key].type === 'vector') {
      rootGUI
        .add(params[key], 'value', params[key].min, params[key].max)
        .name(key)
        .onChange(onChange)
    } else if (params[key].type === 'choices') {
      rootGUI.add(params[key], 'value', params[key].choiceMap).name(key).onChange(onChange)
    } else if (params[key].type === 'color') {
      rootGUI.addColor(params[key], 'value').name(key).onChange(onChange)
    } else {
      rootGUI.add(params[key], 'value').name(key).onChange(onChange)
    }
  })
}

// GUI
// -------------------------------
/**
 * function to initialize material GUI
 * @param {THREE.Scene} scene
 * @param {GUI} rootGUI
 */
const initMaterialGUI = (scene, rootGUI) => {
  const getObject = (name) => {
    const object = scene.getObjectByName(name)
    if (!object) throw new Error(`${name} not found`)
    return object
  }

  const loadEnvMap = (object, key, value) => {
    let type = value[0].toUpperCase() + value.slice(1)
    const mappingMethod = 'Equirectangular' + type + 'Mapping'

    if (value) {
      object.material[key] = textures[key][value]
      object.material[key].mapping = THREE[mappingMethod]
    } else {
      object.material[key] = null
    }
  }

  const loadMap = (object, key, value) => {
    if (value) object.material[key] = textures[key][value]
    else object.material[key] = null
  }

  const loadVector = (object, originalKey, value) => {
    const key = originalKey.slice(0, -1)
    const postFix = originalKey.slice(-1)

    if (postFix === 'X') object.material[key].x = value
    else if (postFix === 'Y') object.material[key].y = value
    else if (postFix === 'Z') object.material[key].z = value
    else throw new Error('Invalid Position')
  }
  const baseMapParam = new Param(null, 'choices', null, null, { null: null, map: 'map' }, loadMap)

  const commonParams = {
    alphaToCoverage: new Param(false, 'boolean'),
    clipIntersection: new Param(false, 'boolean'),
    clipShadows: new Param(false, 'boolean'),
    depthFunc: new Param(THREE.LessEqualDepth, 'choices', null, null, {
      NeverDepth: THREE.NeverDepth,
      AlwaysDepth: THREE.AlwaysDepth,
      LessDepth: THREE.LessDepth,
      LessEqualDepth: THREE.LessEqualDepth,
      GreaterEqualDepth: THREE.GreaterEqualDepth,
      GreaterDepth: THREE.GreaterDepth,
      NotEqualDepth: THREE.NotEqualDepth,
      EqualDepth: THREE.EqualDepth,
    }),
    depthTest: new Param(true, 'boolean'),
    depthWrite: new Param(true, 'boolean'),
    forceSinglePass: new Param(false, 'boolean'),
    opacity: new Param(1, 'number', 0, 1),
    polygonOffset: new Param(false, 'boolean'),
    polygonOffsetFactor: new Param(0, 'number', 0, 100),
    polygonOffsetUnits: new Param(0, 'number', 0, 100),
    precision: new Param('highp', 'choices', null, null, {
      highp: 'highp',
      mediump: 'mediump',
      lowp: 'lowp',
    }),
    premultipliedAlpha: new Param(false, 'boolean'),
    dithering: new Param(false, 'boolean'),
    shadowSide: new Param(THREE.FrontSide, 'choices', 0, 2, {
      FrontSide: THREE.FrontSide,
      BackSide: THREE.BackSide,
      DoubleSide: THREE.DoubleSide,
    }),
    side: new Param(THREE.FrontSide, 'choices', 0, 2, {
      FrontSide: THREE.FrontSide,
      BackSide: THREE.BackSide,
      DoubleSide: THREE.DoubleSide,
    }),
    transparent: new Param(false, 'boolean'),
    color: new Param(new THREE.Color(0xffffff), 'color'),
    emissive: new Param(new THREE.Color(0x000000), 'color'),
    emissiveIntensity: new Param(1, 'number', 0, 10),
    emissiveMap: baseMapParam,

    combine: new Param(THREE.MultiplyOperation, 'choices', 0, 10, {
      MultiplyOperation: THREE.MultiplyOperation,
      MixOperation: THREE.MixOperation,
      AddOperation: THREE.AddOperation,
    }),
    wireframe: new Param(false, 'boolean'),
    wireframeLinewidth: new Param(1, 'number', 0, 10),
    skinning: new Param(false, 'boolean'),
    morphTargets: new Param(false, 'boolean'),
    morphNormals: new Param(false, 'boolean'),
    fog: new Param(true, 'boolean'),

    map: baseMapParam.copy(),

    envMap: new Param(
      null,
      'choices',
      null,
      null,
      {
        null: null,
        reflection: 'reflection',
        refraction: 'refraction',
      },
      loadEnvMap,
    ),

    alphaMap: baseMapParam.copy(),
    reflectivity: new Param(1, 'number', 0, 1),
    refractionRatio: new Param(0.98, 'number', 0, 1),
    flatShading: new Param(false, 'boolean'),
    lightMap: baseMapParam.copy(),
    lightMapIntensity: new Param(1, 'number', 0, 10),
    displacementMap: baseMapParam.copy(),
    displacementScale: new Param(0.01, 'number', 0, 0.1),
    displacementBias: new Param(0, 'number', 0, 0.1),
  }

  const lambertParams = {}
  const phongParams = {
    specular: new Param(new THREE.Color(0x111111), 'color'),
    specularMap: baseMapParam.copy(),
    shininess: new Param(30, 'number', 0, 100),
    bumpMap: baseMapParam.copy(),
    bumpScale: new Param(1, 'number', 0, 1000),
    normalMap: baseMapParam.copy(),
    normalMapType: new Param(THREE.TangentSpaceNormalMap, 'choices', 0, 2, {
      ObjectSpaceNormalMap: THREE.ObjectSpaceNormalMap,
      TangentSpaceNormalMap: THREE.TangentSpaceNormalMap,
    }),
    normalScaleX: new Param(1, 'vector', 0, 10, null, loadVector),
    normalScaleY: new Param(1, 'vector', 0, 10, null, loadVector),
  }
  const physicalParams = {}

  const cone = getObject('Cone')
  const cylinder = getObject('Cylinder')
  const sphere = getObject('Sphere')

  const commonParamCtrl = new MaterialParameterController([cylinder, cone, sphere])
  const commonMaterialGUI = rootGUI.addFolder('Common Parameters')
  generateGUIfromParams(commonParams, commonMaterialGUI, commonParamCtrl)

  const coneMaterialGUI = rootGUI.addFolder('Cone Material')
  const coneMaterialParamCtrl = new MaterialParameterController([cone])
  generateGUIfromParams(lambertParams, coneMaterialGUI, coneMaterialParamCtrl)

  const cylinderMaterialGUI = rootGUI.addFolder('Cylinder Material')
  const cylinderMaterialParamCtrl = new MaterialParameterController([cylinder])
  generateGUIfromParams(phongParams, cylinderMaterialGUI, cylinderMaterialParamCtrl)

  const sphereMaterialGUI = rootGUI.addFolder('Sphere Material')
  const sphereMaterialParamCtrl = new MaterialParameterController([sphere])
  generateGUIfromParams(physicalParams, sphereMaterialGUI, sphereMaterialParamCtrl)
}

const initFogGUI = (scene, rootGUI) => {
  // fog gui
  const fogGui = rootGUI.addFolder('Scene.fog')
  const fog = new THREE.Fog(0x3f7b9d, 0, 60)
  fogGui.add({ fog: false }, 'fog').onChange((useFog) => {
    if (useFog) scene.fog = fog
    else scene.fog = null
  })
  fogGui.addColor(fog, 'color')
}

const initGUI = (scene) => {
  // root
  const rootGui = new GUI()
  // fog gui
  initFogGUI(scene, rootGui)
  // material gui
  initMaterialGUI(scene, rootGui)
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

const initLight = (scene) => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
  ambientLight.name = 'ambientLight'
  scene.add(ambientLight)

  const spotLight = new THREE.SpotLight(0xffffff, 2.5, 10, 0.8, 0.24, 0.45)
  spotLight.position.set(1.36, 2.68, -1.26)
  spotLight.castShadow = true

  spotLight.shadow.camera.left = (-roomParams.roomWidth / 2) * 1.5
  spotLight.shadow.camera.right = (roomParams.roomWidth / 2) * 1.5
  spotLight.shadow.camera.top = (roomParams.roomDepth / 2) * 1.5
  spotLight.shadow.camera.bottom = (-roomParams.roomDepth / 2) * 1.5

  spotLight.shadow.mapSize.width = 2048 * 2
  spotLight.shadow.mapSize.height = 2048

  scene.add(spotLight)
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
  initRoom(scene)
  initLight(scene)

  if (DEBUG_MODE) drawHelper(scene)

  const camera = initCamera(THREE.PerspectiveCamera)
  scene.add(camera)
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
