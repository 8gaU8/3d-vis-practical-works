import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


function makeInstance(texture, geometry, color, x) {
    const material = new THREE.MeshBasicMaterial({ color, map: texture, side: THREE.DoubleSide });

    const cube = new THREE.Mesh(geometry, material);

    cube.position.x = x;
    return { cube: cube };
}


function main() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

    const fov = 75;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 10;
    camera.position.y = 5;
    camera.position.x = 2;

    var controls = new OrbitControls(camera, renderer.domElement);
    controls.listenToKeyEvents(window); // optional

    const scene = new THREE.Scene();

    scene.background = new THREE.Color(0x333333);

    {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);
    }

    // NOT A GOOD EXAMPLE OF HOW TO MAKE A CUBE!
    // Only trying to make it clear most vertices are unique
    const vertices = [
        // front
        { pos: [0, 0, 4], norm: [0, 0, 1], uv: [0, 0], }, // 0
        { pos: [2.8, 0, 4], norm: [0, 0, 1], uv: [0.7, 0], }, // 0
        { pos: [4, 0, 4], norm: [0, 0, 1], uv: [1, 0], }, // 0
        { pos: [4, 2.8, 4], norm: [0, 0, 1], uv: [1, 0.7], }, // 0
        { pos: [4, 4, 4], norm: [0, 0, 1], uv: [1, 1], }, // 0
        { pos: [1.2, 4, 4], norm: [0, 0, 1], uv: [0.3, 1], }, // 0
        { pos: [0, 4, 4], norm: [0, 0, 1], uv: [0, 1], }, // 0
        { pos: [0, 1.2, 4], norm: [0, 0, 1], uv: [0, 0.3], }, // 0
        { pos: [1.2, 1.2, 4], norm: [0, 0, 1], uv: [0.3, 0.3], }, // 0
        { pos: [2.8, 1.2, 4], norm: [0, 0, 1], uv: [0.7, 0.3], }, // 0
        { pos: [2.8, 2.8, 4], norm: [0, 0, 1], uv: [0.7, 0.7], }, // 0
        { pos: [1.2, 2.8, 4], norm: [0, 0, 1], uv: [0.3, 0.7], }, // 0

        // right
        { pos: [4, 0, 0], norm: [1, 0, 0], uv: [0, 0] },
        { pos: [4, 0, 2.8], norm: [1, 0, 0], uv: [0.7, 0] },
        { pos: [4, 0, 4], norm: [1, 0, 0], uv: [1, 0] },
        { pos: [4, 2.8, 4], norm: [1, 0, 0], uv: [1, 0.7] },
        { pos: [4, 4, 4], norm: [1, 0, 0], uv: [1, 1] },
        { pos: [4, 4, 1.2], norm: [1, 0, 0], uv: [0.3, 1] },
        { pos: [4, 4, 0], norm: [1, 0, 0], uv: [0, 1] },
        { pos: [4, 1.2, 0], norm: [1, 0, 0], uv: [0, 0.3] },
        { pos: [4, 1.2, 1.2], norm: [1, 0, 0], uv: [0.3, 0.3] },
        { pos: [4, 1.2, 2.8], norm: [1, 0, 0], uv: [0.7, 0.3] },
        { pos: [4, 2.8, 2.8], norm: [1, 0, 0], uv: [0.7, 0.7] },
        { pos: [4, 2.8, 1.2], norm: [1, 0, 0], uv: [0.3, 0.7] },

        // back
        { pos: [4, 0, 0], norm: [0, 0, -1], uv: [0, 0] },
        { pos: [1.2, 0, 0], norm: [0, 0, -1], uv: [0.7, 0] },
        { pos: [0, 0, 0], norm: [0, 0, -1], uv: [1, 0] },
        { pos: [0, 2.8, 0], norm: [0, 0, -1], uv: [1, 0.7] },
        { pos: [0, 4, 0], norm: [0, 0, -1], uv: [1, 1] },
        { pos: [2.8, 4, 0], norm: [0, 0, -1], uv: [0.3, 1] },
        { pos: [4, 4, 0], norm: [0, 0, -1], uv: [0, 1] },
        { pos: [4, 1.2, 0], norm: [0, 0, -1], uv: [0, 0.3] },
        { pos: [2.8, 1.2, 0], norm: [0, 0, -1], uv: [0.3, 0.3] },
        { pos: [1.2, 1.2, 0], norm: [0, 0, -1], uv: [0.7, 0.3] },
        { pos: [1.2, 2.8, 0], norm: [0, 0, -1], uv: [0.7, 0.7] },
        { pos: [2.8, 2.8, 0], norm: [0, 0, -1], uv: [0.3, 0.7] },

        // left
        { pos: [0, 0, 4], norm: [-1, 0, 0], uv: [0, 0] },
        { pos: [0, 0, 1.2], norm: [-1, 0, 0], uv: [0.7, 0] },
        { pos: [0, 0, 0], norm: [-1, 0, 0], uv: [1, 0] },
        { pos: [0, 2.8, 0], norm: [-1, 0, 0], uv: [1, 0.7] },
        { pos: [0, 4, 0], norm: [-1, 0, 0], uv: [1, 1] },
        { pos: [0, 4, 2.8], norm: [-1, 0, 0], uv: [0.3, 1] },
        { pos: [0, 4, 4], norm: [-1, 0, 0], uv: [0, 1] },
        { pos: [0, 1.2, 4], norm: [-1, 0, 0], uv: [0, 0.3] },
        { pos: [0, 1.2, 2.8], norm: [-1, 0, 0], uv: [0.3, 0.3] },
        { pos: [0, 1.2, 1.2], norm: [-1, 0, 0], uv: [0.7, 0.3] },
        { pos: [0, 2.8, 1.2], norm: [-1, 0, 0], uv: [0.7, 0.7] },
        { pos: [0, 2.8, 2.8], norm: [-1, 0, 0], uv: [0.3, 0.7] },

        // top
        { pos: [0, 4, 0], norm: [0, 1, 0], uv: [0, 0] },
        { pos: [2.8, 4, 0], norm: [0, 1, 0], uv: [0.7, 0] },
        { pos: [4, 4, 0], norm: [0, 1, 0], uv: [1, 0] },
        { pos: [4, 4, 2.8], norm: [0, 1, 0], uv: [1, 0.7] },
        { pos: [4, 4, 4], norm: [0, 1, 0], uv: [1, 1] },
        { pos: [1.2, 4, 4], norm: [0, 1, 0], uv: [0.3, 1] },
        { pos: [0, 4, 4], norm: [0, 1, 0], uv: [0, 1] },
        { pos: [0, 4, 1.2], norm: [0, 1, 0], uv: [0, 0.3] },
        { pos: [1.2, 4, 1.2], norm: [0, 1, 0], uv: [0.3, 0.3] },
        { pos: [2.8, 4, 1.2], norm: [0, 1, 0], uv: [0.7, 0.3] },
        { pos: [2.8, 4, 2.8], norm: [0, 1, 0], uv: [0.7, 0.7] },
        { pos: [1.2, 4, 2.8], norm: [0, 1, 0], uv: [0.3, 0.7] },

        // bottom
        { pos: [4, 0, 4], norm: [0, -1, 0], uv: [0, 0] },
        { pos: [1.2, 0, 4], norm: [0, -1, 0], uv: [0.7, 0] },
        { pos: [0, 0, 4], norm: [0, -1, 0], uv: [1, 0] },
        { pos: [0, 0, 1.2], norm: [0, -1, 0], uv: [1, 0.7] },
        { pos: [0, 0, 0], norm: [0, -1, 0], uv: [1, 1] },
        { pos: [2.8, 0, 0], norm: [0, -1, 0], uv: [0.3, 1] },
        { pos: [4, 0, 0], norm: [0, -1, 0], uv: [0, 1] },
        { pos: [4, 0, 2.8], norm: [0, -1, 0], uv: [0, 0.3] },
        { pos: [2.8, 0, 2.8], norm: [0, -1, 0], uv: [0.3, 0.3] },
        { pos: [1.2, 0, 2.8], norm: [0, -1, 0], uv: [0.7, 0.3] },
        { pos: [1.2, 0, 1.2], norm: [0, -1, 0], uv: [0.7, 0.7] },
        { pos: [2.8, 0, 1.2], norm: [0, -1, 0], uv: [0.3, 0.7] },
    ];

    const numVertices = vertices.length;
    const positionNumComponents = 3;
    const normalNumComponents = 3;
    const uvNumComponents = 2;
    const positions = new Float32Array(numVertices * positionNumComponents);
    const normals = new Float32Array(numVertices * normalNumComponents);
    const uvs = new Float32Array(numVertices * uvNumComponents);
    let posNdx = 0;
    let nrmNdx = 0;
    let uvNdx = 0;
    for (const vertex of vertices)
    {
        positions.set(vertex.pos, posNdx);
        normals.set(vertex.norm, nrmNdx);
        uvs.set(vertex.uv, uvNdx);
        posNdx += positionNumComponents;
        nrmNdx += normalNumComponents;
        uvNdx += uvNumComponents;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, positionNumComponents));
    geometry.setAttribute(
        'normal',
        new THREE.BufferAttribute(normals, normalNumComponents));
    geometry.setAttribute(
        'uv',
        new THREE.BufferAttribute(uvs, uvNumComponents));

    geometry.setIndex([
        // front
        0, 1, 9, 0, 9, 7, 2, 3, 10, 2, 10, 1, 11, 3, 4, 4, 5, 11, 8, 5, 6, 7, 8, 6,

        // right
        12, 21, 13, 12, 19, 21, 14, 22, 15, 14, 13, 22, 23, 16, 15, 16, 23, 17, 20, 18, 17, 19, 18, 20,

        // back
        24, 25, 33, 24, 33, 31, 26, 27, 34, 26, 34, 25, 35, 27, 28, 28, 29, 35, 32, 29, 30, 31, 32, 30,

        // left
        36, 45, 37, 36, 43, 45, 38, 46, 39, 38, 37, 46, 47, 40, 39, 40, 47, 41, 44, 42, 41, 43, 42, 44,

        // top
        48, 57, 49, 48, 55, 57, 50, 58, 51, 50, 49, 58, 59, 52, 51, 52, 59, 53, 56, 54, 53, 55, 54, 56,

        // bottom
        60, 61, 69, 60, 69, 67, 62, 63, 70, 62, 70, 61, 71, 63, 64, 64, 65, 71, 68, 65, 66, 67, 68, 66,

    ]);

    const loader = new THREE.TextureLoader();
    const texture = loader.load('../resources/grenouille.jpg');

    const cubes = [
        makeInstance(texture, geometry, 0x00FF00, 0),
        makeInstance(texture, geometry, 0xFF0000, 5),
        makeInstance(texture, geometry, 0x0000FF, -5),
    ];

    for (const cube of cubes)
    {
        scene.add(cube.cube)
    }

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize)
        {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    function render(time) {

        if (resizeRendererToDisplaySize(renderer))
        {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();