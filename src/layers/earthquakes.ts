import {
  ArcType,
  Cartesian2,
  Cartesian3,
  Color,
  NearFarScalar,
  PointPrimitiveCollection,
  PolylineDashMaterialProperty,
  VerticalOrigin,
  type Entity,
  type PointPrimitive,
  type Viewer,
} from 'cesium'
import type { Quake } from '../data/types'

const DEPTH_BANDS = [
  { max: 15, color: '#ffd166', label: '0–15 km' },
  { max: 40, color: '#ff9f43', label: '15–40 km' },
  { max: 70, color: '#f05a28', label: '40–70 km' },
  { max: Number.POSITIVE_INFINITY, color: '#b06bff', label: '>70 km' },
] as const

export const DEPTH_LEGEND = DEPTH_BANDS.map((band) => ({
  color: band.color,
  label: band.label,
}))

export function depthColor(depthKm: number): string {
  const band = DEPTH_BANDS.find((entry) => depthKm <= entry.max)
  return band ? band.color : DEPTH_BANDS[DEPTH_BANDS.length - 1].color
}

export function magnitudeSize(mag: number): number {
  return Math.min(18, Math.max(4, 3.5 + mag * 2.4))
}

function depthAltitude(depthKm: number, exaggeration: number): number {
  return -depthKm * 1000 * exaggeration
}

const EPICENTER_ICON = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">' +
    '<path d="M12 3v18M3 12h18" stroke="white" stroke-width="2" stroke-linecap="round"/>' +
    '</svg>',
)}`

const HYPO_ICON = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
    '<circle cx="16" cy="16" r="13" fill="none" stroke="white" stroke-width="2"/>' +
    '</svg>',
)}`

function makeLabelIcon(text: string): { url: string; width: number; height: number } {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  const font = '600 13px system-ui, sans-serif'
  const height = 26

  if (!context) return { url: '', width: 0, height: 0 }

  context.font = font
  const width = Math.ceil(context.measureText(text).width) + 24
  canvas.width = width * 2
  canvas.height = height * 2

  context.scale(2, 2)
  context.font = font
  context.fillStyle = 'rgba(11, 16, 32, 0.85)'
  context.beginPath()
  context.roundRect(0, 0, width, height, 8)
  context.fill()
  context.fillStyle = '#ffffff'
  context.textBaseline = 'middle'
  context.fillText(text, 12, height / 2 + 1)

  return { url: canvas.toDataURL('image/png'), width, height }
}

export class QuakeLayer {
  private readonly collection = new PointPrimitiveCollection()
  private readonly points = new Map<string, PointPrimitive>()
  private readonly viewer: Viewer
  private highlights: Entity[] = []
  private exaggeration = 1

  constructor(viewer: Viewer) {
    this.viewer = viewer
    viewer.scene.primitives.add(this.collection)
  }

  update(quakes: Quake[], exaggeration = 1): void {
    this.exaggeration = exaggeration
    this.collection.removeAll()
    this.points.clear()

    for (const quake of quakes) {
      const point = this.collection.add({
        position: Cartesian3.fromDegrees(
          quake.lon,
          quake.lat,
          depthAltitude(quake.depthKm, exaggeration),
        ),
        color: Color.fromCssColorString(depthColor(quake.depthKm)),
        pixelSize: magnitudeSize(quake.mag),
        outlineColor: Color.fromCssColorString('#05070d').withAlpha(0.9),
        outlineWidth: 1,
        id: quake.id,
        scaleByDistance: new NearFarScalar(20_000, 1.35, 4_000_000, 0.45),
        translucencyByDistance: new NearFarScalar(2_000_000, 1, 9_000_000, 0.15),
      })
      this.points.set(quake.id, point)
    }
  }

  setSelected(quake: Quake | null): void {
    for (const entity of this.highlights) {
      this.viewer.entities.remove(entity)
    }
    this.highlights = []
    if (!quake) return

    const surface = Cartesian3.fromDegrees(quake.lon, quake.lat, 0)
    const hypocenter = Cartesian3.fromDegrees(
      quake.lon,
      quake.lat,
      depthAltitude(quake.depthKm, this.exaggeration),
    )
    const depthLabel =
      quake.depthKm < 1 ? '<1 km' : `${Math.round(quake.depthKm)} km`

    const label = makeLabelIcon(`M${quake.mag.toFixed(1)} · ${depthLabel}`)

    this.highlights.push(
      this.viewer.entities.add({
        id: `ring:${quake.id}`,
        position: hypocenter,
        billboard: {
          image: HYPO_ICON,
          width: 34,
          height: 34,
          verticalOrigin: VerticalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        polyline: {
          positions: [surface, hypocenter],
          width: 1.5,
          arcType: ArcType.NONE,
          material: Color.WHITE.withAlpha(0.7),
          depthFailMaterial: new PolylineDashMaterialProperty({
            color: Color.WHITE.withAlpha(0.45),
          }),
        },
      }),
    )

    if (label.url) {
      this.highlights.push(
        this.viewer.entities.add({
          id: `label:${quake.id}`,
          position: hypocenter,
          billboard: {
            image: label.url,
            width: label.width,
            height: label.height,
            verticalOrigin: VerticalOrigin.BOTTOM,
            pixelOffset: new Cartesian2(0, -22),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        }),
      )
    }

    this.highlights.push(
      this.viewer.entities.add({
        id: `cross:${quake.id}`,
        position: surface,
        billboard: {
          image: EPICENTER_ICON,
          width: 16,
          height: 16,
          color: Color.WHITE.withAlpha(0.85),
          verticalOrigin: VerticalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      }),
    )
  }

  destroy(): void {
    this.viewer.scene.primitives.remove(this.collection)
    for (const entity of this.highlights) {
      this.viewer.entities.remove(entity)
    }
    this.highlights = []
    this.points.clear()
  }
}
