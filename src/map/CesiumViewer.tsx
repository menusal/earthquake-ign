import {
  Cartesian2,
  Cartesian3,
  Color,
  Ellipsoid,
  EllipsoidTerrainProvider,
  Math as CesiumMath,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Viewer,
} from 'cesium'
import { useEffect, useRef, useState } from 'react'
import type { ShakemapMetric } from '../data/shakemap'
import type { Quake } from '../data/types'
import { QuakeLayer } from '../layers/earthquakes'
import { FaultsLayer } from '../layers/faults'
import { ShakemapLayer } from '../layers/shakemaps'
import { StationsLayer } from '../layers/stations'
import { resetHazardLayer, setHazardLayer } from './hazard'
import { useSequenceStore } from '../state/sequence'
import { createBasemaps, setBasemap, type BasemapMode } from './basemaps'
import { createTerrainProvider } from './terrain'
import { viewerRef } from './viewerRef'
import { QuakeTooltip } from '../ui/QuakeTooltip'

interface CesiumViewerProps {
  quakes: Quake[]
  selected: Quake | null
  basemap: BasemapMode
  exaggeration: number
  underground: boolean
  shakemapEventId: string | null
  shakemapMetric: ShakemapMetric
  faults: boolean
  stations: boolean
  hazard: boolean
  onSelect: (id: string | null) => void
}

export function CesiumViewer({
  quakes,
  selected,
  basemap,
  exaggeration,
  underground,
  shakemapEventId,
  shakemapMetric,
  faults,
  stations,
  hazard,
  onSelect,
}: CesiumViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<QuakeLayer | null>(null)
  const shakemapRef = useRef<ShakemapLayer | null>(null)
  const faultsRef = useRef<FaultsLayer | null>(null)
  const stationsRef = useRef<StationsLayer | null>(null)
  const onSelectRef = useRef(onSelect)
  const quakesByIdRef = useRef<Map<string, Quake>>(new Map())
  const undergroundRef = useRef(underground)
  const hoveredRef = useRef<Quake | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<Quake | null>(null)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    quakesByIdRef.current = new Map(quakes.map((quake) => [quake.id, quake]))
    if (
      hoveredRef.current &&
      !quakesByIdRef.current.has(hoveredRef.current.id)
    ) {
      hoveredRef.current = null
      setHovered(null)
      if (tooltipRef.current) tooltipRef.current.style.display = 'none'
    }
  }, [quakes])

  useEffect(() => {
    undergroundRef.current = underground
  }, [underground])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const mobile = window.matchMedia('(max-width: 767px)').matches
    const creditContainer = document.createElement('div')
    creditContainer.style.display = 'none'

    const viewer = new Viewer(container, {
      baseLayer: false,
      scene3DOnly: true,
      terrainProvider: createTerrainProvider(),
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      creditContainer,
      contextOptions: { webgl: { alpha: false } },
    })

    viewerRef.current = viewer
    createBasemaps(viewer)

    if (mobile) {
      viewer.resolutionScale = 0.85
      viewer.scene.msaaSamples = 1
      viewer.scene.postProcessStages.fxaa.enabled = false
      viewer.scene.globe.maximumScreenSpaceError = 2.5
    }

    if (import.meta.env.DEV) {
      const debugWindow = window as unknown as {
        __viewer?: Viewer
        __setView?: (
          lon: number,
          lat: number,
          height: number,
          pitchDeg: number,
        ) => void
      }
      debugWindow.__viewer = viewer
      ;(debugWindow as unknown as { __flat?: () => void }).__flat = () => {
        viewer.terrainProvider = new EllipsoidTerrainProvider()
      }
      ;(debugWindow as unknown as { __height?: (lon: number, lat: number) => number | undefined }).__height = (lon, lat) => {
        const carto = Ellipsoid.WGS84.cartesianToCartographic(
          Cartesian3.fromDegrees(lon, lat),
        )
        return viewer.scene.globe.getHeight(carto)
      }
      debugWindow.__setView = (lon, lat, height, pitchDeg) => {
        viewer.camera.setView({
          destination: Cartesian3.fromDegrees(lon, lat, height),
          orientation: {
            heading: 0,
            pitch: CesiumMath.toRadians(pitchDeg),
            roll: 0,
          },
        })
      }
    }

    viewer.scene.globe.baseColor = Color.fromCssColorString('#0b1a2b')
    viewer.scene.globe.showGroundAtmosphere = true
    viewer.scene.globe.enableLighting = false
    viewer.scene.globe.depthTestAgainstTerrain = true
    if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = true
    viewer.scene.fog.enabled = true
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 250
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 20_000_000

    const initialHeight =
      mobile && window.innerHeight > window.innerWidth ? 1_150_000 : 900_000

    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(-3.7, 39.9, initialHeight),
      orientation: {
        heading: 0,
        pitch: CesiumMath.toRadians(-70),
        roll: 0,
      },
    })

    const layer = new QuakeLayer(viewer)
    layerRef.current = layer
    const shakemap = new ShakemapLayer(viewer)
    shakemapRef.current = shakemap
    const faultsLayer = new FaultsLayer(viewer)
    faultsRef.current = faultsLayer
    const stationsLayer = new StationsLayer(viewer)
    stationsRef.current = stationsLayer

    const canvas = viewer.scene.canvas
    const tooltip = tooltipRef.current

    const resolveId = (picked: unknown): string | null => {
      if (!picked || typeof picked !== 'object') return null
      const candidate = picked as {
        id?: unknown
        primitive?: { id?: unknown }
      }
      let raw: unknown = candidate.primitive?.id ?? candidate.id
      if (raw && typeof raw === 'object' && 'id' in raw) {
        raw = (raw as { id?: unknown }).id
      }
      if (typeof raw !== 'string') return null

      const id = raw.replace(/^(ring|cross|label):/, '')
      return quakesByIdRef.current.has(id) ? id : null
    }

    const pickId = (x: number, y: number): string | null => {
      const position = new Cartesian2(x, y)
      const picked = viewer.scene.pick(position)
      const id = resolveId(picked)
      if (id) return id

      // drillPick is only needed when hypocentres are below an opaque globe.
      if (!undergroundRef.current && picked !== undefined) return null

      for (const hit of viewer.scene.drillPick(position, 6)) {
        const candidate = resolveId(hit)
        if (candidate) return candidate
      }

      return null
    }

    const hideTooltip = () => {
      hoveredRef.current = null
      setHovered(null)
      if (tooltip) tooltip.style.display = 'none'
      canvas.style.cursor = 'grab'
    }

    let frame = 0
    let lastX = 0
    let lastY = 0

    const updateHover = () => {
      frame = 0
      if (!tooltip) return

      const rect = canvas.getBoundingClientRect()
      const x = lastX - rect.left
      const y = lastY - rect.top

      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        hideTooltip()
        return
      }

      const id = pickId(x, y)
      const quake = id ? (quakesByIdRef.current.get(id) ?? null) : null

      if (!quake) {
        hideTooltip()
        return
      }

      if (hoveredRef.current?.id !== quake.id) {
        hoveredRef.current = quake
        setHovered(quake)
      }

      const left = Math.max(8, Math.min(lastX + 16, window.innerWidth - 276))
      const top = Math.max(8, Math.min(lastY + 16, window.innerHeight - 166))
      tooltip.style.display = 'block'
      tooltip.style.transform = `translate3d(${left}px, ${top}px, 0)`
      canvas.style.cursor = 'pointer'
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      if (event.target !== canvas) {
        hideTooltip()
        return
      }

      lastX = event.clientX
      lastY = event.clientY

      if (frame !== 0) return
      frame = window.requestAnimationFrame(updateHover)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    canvas.addEventListener('pointerleave', hideTooltip)
    viewer.camera.moveStart.addEventListener(hideTooltip)

    const handler = new ScreenSpaceEventHandler(canvas)
    handler.setInputAction(
      (movement: ScreenSpaceEventHandler.PositionedEvent) => {
        const id = resolveId(viewer.scene.pick(movement.position))
        onSelectRef.current(id)
        hideTooltip()
      },
      ScreenSpaceEventType.LEFT_CLICK,
    )

    const stopSequence = () => useSequenceStore.getState().stop()
    canvas.addEventListener('pointerdown', stopSequence)
    canvas.addEventListener('wheel', stopSequence, { passive: true })

    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', hideTooltip)
      viewer.camera.moveStart.removeEventListener(hideTooltip)
      canvas.removeEventListener('pointerdown', stopSequence)
      canvas.removeEventListener('wheel', stopSequence)
      handler.destroy()
      shakemap.destroy()
      faultsLayer.destroy()
      stationsLayer.destroy()
      resetHazardLayer()
      layer.destroy()
      viewer.destroy()
      viewerRef.current = null
      layerRef.current = null
    }
  }, [])

  useEffect(() => {
    layerRef.current?.update(quakes, exaggeration)
  }, [quakes, exaggeration])

  useEffect(() => {
    layerRef.current?.setSelected(selected)
  }, [selected, exaggeration])

  useEffect(() => {
    setBasemap(basemap)
  }, [basemap])

  useEffect(() => {
    const layer = faultsRef.current
    if (!layer) return
    if (faults) {
      void layer.show().catch((error) =>
        console.error('faults', (error as Error)?.message),
      )
    } else {
      layer.clear()
    }
  }, [faults])

  useEffect(() => {
    const layer = stationsRef.current
    if (!layer) return
    if (stations) {
      void layer.show().catch((error) =>
        console.error('stations', (error as Error)?.message),
      )
    } else {
      layer.clear()
    }
  }, [stations])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    setHazardLayer(viewer, hazard)
  }, [hazard])

  useEffect(() => {
    if (!shakemapEventId) {
      shakemapRef.current?.clear()
      return
    }
    void shakemapRef.current
      ?.show(shakemapEventId, shakemapMetric)
      .catch((error) =>
        console.error('shakemap', (error as Error)?.message, (error as Error)?.stack),
      )
  }, [shakemapEventId, shakemapMetric])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    const translucency = viewer.scene.globe.translucency
    translucency.enabled = underground
    translucency.frontFaceAlpha = underground ? 0.32 : 1
    translucency.backFaceAlpha = underground ? 0.4 : 1
    viewer.scene.screenSpaceCameraController.enableCollisionDetection =
      !underground
  }, [underground])

  return (
    <>
      <div ref={containerRef} className="absolute inset-0" />
      <div
        ref={tooltipRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-30 hidden will-change-transform"
      >
        {hovered && <QuakeTooltip quake={hovered} />}
      </div>
    </>
  )
}
