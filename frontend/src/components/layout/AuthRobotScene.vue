<template>
  <div ref="hostRef" class="auth-robot-scene" aria-hidden="true">
    <div v-if="sceneUnavailable" class="auth-robot-fallback">
      <div class="fallback-head"></div>
      <div class="fallback-body"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const hostRef = ref<HTMLDivElement | null>(null)
const sceneUnavailable = ref(false)
const props = withDefaults(defineProps<{ dark?: boolean }>(), {
  dark: true
})

let disposeScene: (() => void) | undefined
let applySceneTheme: ((dark: boolean) => void) | undefined

function normalizeModel(model: THREE.Object3D, targetHeight: number): void {
  model.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  model.scale.setScalar(targetHeight / Math.max(size.y, 0.001))

  model.updateMatrixWorld(true)
  const scaledBox = new THREE.Box3().setFromObject(model)
  const center = scaledBox.getCenter(new THREE.Vector3())
  model.position.set(-center.x, -scaledBox.min.y, -center.z)
}

onMounted(() => {
  const host = hostRef.value
  if (!host) return
  if (typeof window !== 'undefined' && typeof window.WebGLRenderingContext === 'undefined') {
    sceneUnavailable.value = true
    return
  }

  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
  } catch {
    sceneUnavailable.value = true
    return
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.25
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.setClearColor(0x0f1012, 0)
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x0f1012, 6.2, 11)

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
  camera.position.set(0, 0.38, 6.2)

  const root = new THREE.Group()
  root.position.set(1.62, -1.75, 0)
  root.rotation.set(-0.02, -0.12, 0.01)
  scene.add(root)

  const modelRoot = new THREE.Group()
  modelRoot.rotation.y = -0.1
  root.add(modelRoot)

  const hemisphereLight = new THREE.HemisphereLight(0xf6f7f8, 0x111318, 1.9)
  scene.add(hemisphereLight)

  const keyLight = new THREE.DirectionalLight(0xffffff, 4.8)
  keyLight.position.set(3.2, 4.6, 4.5)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(1024, 1024)
  scene.add(keyLight)

  const rimLight = new THREE.DirectionalLight(0xe6e8eb, 2.8)
  rimLight.position.set(-4.2, 2.7, 3.6)
  scene.add(rimLight)

  const warmLight = new THREE.PointLight(0xf2e6d2, 2.8, 5.4)
  warmLight.position.set(1.9, 1.2, 2.8)
  scene.add(warmLight)

  const coreLight = new THREE.PointLight(0xf4f5f6, 2.2, 4.2)
  coreLight.position.set(0.15, 1.75, 1.35)
  root.add(coreLight)

  const floorMaterial = new THREE.ShadowMaterial({ opacity: 0.28, color: 0x000000 })
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(2.8, 96),
    floorMaterial
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.set(1.28, -1.78, 0)
  floor.receiveShadow = true
  scene.add(floor)

  applySceneTheme = (dark: boolean): void => {
    const background = dark ? 0x0f1012 : 0xf3f4f6
    renderer.setClearColor(background, 0)
    scene.fog?.color.setHex(background)
    hemisphereLight.color.setHex(dark ? 0xf6f7f8 : 0xffffff)
    hemisphereLight.groundColor.setHex(dark ? 0x111318 : 0xb9c0ca)
    hemisphereLight.intensity = dark ? 1.9 : 2.4
    keyLight.intensity = dark ? 4.8 : 4.1
    rimLight.color.setHex(dark ? 0xe6e8eb : 0xd9dee6)
    rimLight.intensity = dark ? 2.8 : 2.1
    warmLight.intensity = dark ? 2.8 : 2.1
    coreLight.intensity = dark ? 2.2 : 1.75
    floorMaterial.opacity = dark ? 0.28 : 0.14
    floorMaterial.needsUpdate = true
  }
  applySceneTheme(props.dark)

  let mixer: THREE.AnimationMixer | undefined
  let gestureTimer = 0
  let activeModel: THREE.Object3D | undefined
  let headTarget: THREE.Object3D | undefined
  const eyeTargets: THREE.Object3D[] = []
  let animationId = 0
  let lastFrame = performance.now()
  let disposed = false
  const pointer = new THREE.Vector2()
  const targetPointer = new THREE.Vector2()

  new GLTFLoader().load(
    '/models/RobotExpressive.glb',
    (gltf) => {
      if (disposed) return

      const model = gltf.scene
      normalizeModel(model, 3.45)
      model.traverse((object) => {
        const mesh = object as THREE.Mesh
        if (mesh.isMesh) {
          mesh.castShadow = true
          mesh.receiveShadow = true
        }

        const name = object.name.toLowerCase()
        if (!headTarget && /(head|neck)/.test(name)) headTarget = object
        if (/(eye|pupil|face)/.test(name)) eyeTargets.push(object)
      })

      modelRoot.add(model)
      activeModel = model
      mixer = new THREE.AnimationMixer(model)
      const idleClip =
        ['Idle', 'Walking', 'Dance', 'Wave']
          .map((name) => THREE.AnimationClip.findByName(gltf.animations, name))
          .find((clip): clip is THREE.AnimationClip => Boolean(clip)) || gltf.animations[0]
      const gestureClips = ['Wave', 'ThumbsUp', 'Yes', 'Dance']
        .map((name) => THREE.AnimationClip.findByName(gltf.animations, name))
        .filter((clip): clip is THREE.AnimationClip => Boolean(clip))
      if (idleClip && gestureClips.length > 0) {
        const idleAction = mixer.clipAction(idleClip).reset().play()
        idleAction.setEffectiveWeight(0)
        const playGesture = (index: number): void => {
          if (disposed || !mixer) return
          const clip = gestureClips[index % gestureClips.length]
          const action = mixer.clipAction(clip)
          action.reset()
          action.setLoop(THREE.LoopOnce, 1)
          action.clampWhenFinished = true
          action.setDuration(Math.min(clip.duration, 4.5))
          idleAction.crossFadeTo(action, 0.3, false)
          action.play()
          gestureTimer = window.setTimeout(() => {
            if (disposed) return
            action.crossFadeTo(idleAction, 0.35, false)
            gestureTimer = window.setTimeout(() => playGesture(index + 1), 1200)
          }, Math.min(clip.duration, 4.5) * 1000)
        }
        playGesture(0)
      } else if (idleClip) {
        mixer.clipAction(idleClip).reset().fadeIn(0.2).play()
      }
      host.dataset.robotStatus = 'running'
    },
    undefined,
    () => {
      if (!disposed) sceneUnavailable.value = true
    }
  )

  const resize = (): void => {
    const width = Math.max(1, host.clientWidth)
    const height = Math.max(1, host.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8))
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(host)
  resize()

  const handlePointerMove = (event: PointerEvent): void => {
    const rect = host.getBoundingClientRect()
    targetPointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    targetPointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
  }
  window.addEventListener('pointermove', handlePointerMove, { passive: true })

  const animate = (): void => {
    const now = performance.now()
    const delta = Math.min(0.033, (now - lastFrame) / 1000)
    const time = now * 0.001
    lastFrame = now
    pointer.lerp(targetPointer, 0.045)

    root.position.y = -1.75 + Math.sin(time * 1.25) * 0.035
    root.rotation.y = THREE.MathUtils.damp(root.rotation.y, pointer.x * 0.16 - 0.22, 4.4, delta)
    root.rotation.z = Math.sin(time * 0.7) * 0.015
    modelRoot.rotation.y = THREE.MathUtils.damp(
      modelRoot.rotation.y,
      pointer.x * 0.24 - 0.1,
      4.8,
      delta
    )
    modelRoot.rotation.x = THREE.MathUtils.damp(modelRoot.rotation.x, -pointer.y * 0.045, 4.8, delta)

    coreLight.intensity = (props.dark ? 2.4 : 1.75) + Math.sin(time * 3.1) * 0.35
    warmLight.intensity = props.dark ? 2.8 : 2.1
    mixer?.update(delta)
    if (activeModel) activeModel.rotation.z = Math.sin(time * 0.8) * 0.015
    if (headTarget) {
      headTarget.rotation.y = THREE.MathUtils.damp(headTarget.rotation.y, pointer.x * 0.34, 6.6, delta)
      headTarget.rotation.x = THREE.MathUtils.damp(headTarget.rotation.x, pointer.y * 0.18, 6.6, delta)
    }
    eyeTargets.forEach((eye) => {
      eye.rotation.y = THREE.MathUtils.damp(eye.rotation.y, pointer.x * 0.22, 7.2, delta)
      eye.rotation.x = THREE.MathUtils.damp(eye.rotation.x, pointer.y * 0.12, 7.2, delta)
    })

    renderer.render(scene, camera)
    animationId = requestAnimationFrame(animate)
  }
  animationId = requestAnimationFrame(animate)

  disposeScene = () => {
    disposed = true
    cancelAnimationFrame(animationId)
    window.clearTimeout(gestureTimer)
    resizeObserver.disconnect()
    window.removeEventListener('pointermove', handlePointerMove)
    renderer.dispose()
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh
      mesh.geometry?.dispose()
      if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose())
      else mesh.material?.dispose()
    })
    renderer.domElement.remove()
  }
})

onBeforeUnmount(() => disposeScene?.())

watch(
  () => props.dark,
  (dark) => applySceneTheme?.(dark)
)
</script>

<style scoped>
.auth-robot-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.auth-robot-scene :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.auth-robot-fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  opacity: 0.3;
}

.fallback-head,
.fallback-body {
  position: absolute;
  border: 1px solid var(--auth-border);
  background: var(--auth-control-bg);
}

.fallback-head {
  width: 14rem;
  height: 10rem;
  margin-top: -12rem;
  border-radius: 4rem;
}

.fallback-body {
  width: 11rem;
  height: 15rem;
  margin-top: 11rem;
  border-radius: 3rem;
}
</style>
