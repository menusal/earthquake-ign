import {
  BoundingSphere,
  Cartesian3,
  Cartographic,
  Color,
  ColorGeometryInstanceAttribute,
  ComponentDatatype,
  Geometry,
  GeometryAttribute,
  GeometryAttributes,
  GeometryInstance,
  PerInstanceColorAppearance,
  Primitive,
  PrimitiveType,
  Rectangle,
  SingleTileImageryProvider,
  type Entity,
  type ImageryLayer,
  type Viewer,
} from 'cesium'
import {
  fetchShakemap,
  type ShakemapData,
  type ShakemapMetric,
} from '../data/shakemap'

type Stop = [number, [number, number, number]]

const BANDS = 16

const MMI_STOPS: Stop[] = [
  [1, [207, 232, 255]],
  [2, [168, 216, 255]],
  [3, [126, 200, 255]],
  [4, [87, 184, 255]],
  [5, [255, 224, 138]],
  [6, [255, 196, 77]],
  [7, [255, 159, 67]],
  [8, [240, 90, 40]],
  [9, [214, 59, 47]],
  [10, [155, 28, 28]],
  [12, [90, 10, 10]],
]

const PGA_STOPS: Stop[] = [
  [-2, [126, 200, 255]],
  [-1, [255, 224, 138]],
  [0, [255, 159, 67]],
  [1, [240, 90, 40]],
  [2, [155, 28, 28]],
]

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function normalize(metric: ShakemapMetric, value: number): number {
  if (!Number.isFinite(value)) return 0
  if (metric === 'MMI') return clamp01((value - 1) / 11)
  return clamp01((Math.log10(Math.max(value, 0.01)) + 2) / 4)
}

function interpolate(stops: Stop[], position: number): [number, number, number] {
  for (let i = 1; i < stops.length; i++) {
    const [valueB, colorB] = stops[i]
    const [valueA, colorA] = stops[i - 1]
    if (position <= valueB) {
      const t = clamp01((position - valueA) / (valueB - valueA))
      return [
        Math.round(colorA[0] + (colorB[0] - colorA[0]) * t),
        Math.round(colorA[1] + (colorB[1] - colorA[1]) * t),
        Math.round(colorA[2] + (colorB[2] - colorA[2]) * t),
      ]
    }
  }
  return stops[stops.length - 1][1]
}

function colorOf(metric: ShakemapMetric, value: number): [number, number, number] {
  if (metric === 'MMI') return interpolate(MMI_STOPS, value)
  return interpolate(PGA_STOPS, Math.log10(Math.max(value, 0.01)))
}

function visible(metric: ShakemapMetric, value: number): boolean {
  if (!Number.isFinite(value)) return false
  return metric === 'MMI' ? value > 2.4 : value > 0.08
}

function bandValue(metric: ShakemapMetric, band: number): number {
  const t = band / (BANDS - 1)
  if (metric === 'MMI') return 1 + t * 11
  return 10 ** (-2 + t * 4)
}

function buildRasterCanvas(
  data: ShakemapData,
  metric: ShakemapMetric,
): HTMLCanvasElement | null {
  const { grid } = data
  const canvas = document.createElement('canvas')
  canvas.width = grid.nlon
  canvas.height = grid.nlat
  const context = canvas.getContext('2d')
  if (!context) return null

  const image = context.createImageData(grid.nlon, grid.nlat)
  const values = grid.values[metric]

  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    if (!visible(metric, value)) continue
    const [r, g, b] = colorOf(metric, value)
    const offset = i * 4
    image.data[offset] = r
    image.data[offset + 1] = g
    image.data[offset + 2] = b
    image.data[offset + 3] = Math.round(
      220 * Math.sqrt(clamp01((normalize(metric, value) - 0.13) / 0.87)),
    )
  }

  context.putImageData(image, 0, 0)
  return canvas
}

export class ShakemapLayer {
  private readonly viewer: Viewer
  private imagery: ImageryLayer | null = null
  private primitives: Primitive[] = []
  private entities: Entity[] = []
  private token = 0

  constructor(viewer: Viewer) {
    this.viewer = viewer
  }

  async show(evid: string, metric: ShakemapMetric): Promise<void> {
    this.clear()
    const token = this.token

    const data = await fetchShakemap(evid, metric)
    if (token !== this.token) return

    const canvas = buildRasterCanvas(data, metric)
    if (canvas) {
      const provider = new SingleTileImageryProvider({
        url: canvas.toDataURL('image/png'),
        tileWidth: 256,
        tileHeight: 256,
        rectangle: Rectangle.fromDegrees(
          data.grid.lonMin,
          data.grid.latMin,
          data.grid.lonMax,
          data.grid.latMax,
        ),
      })
      this.imagery = this.viewer.imageryLayers.addImageryProvider(provider)
    }

    this.renderSurface(data, metric)
    this.renderContours(data)
  }

  private renderSurface(data: ShakemapData, metric: ShakemapMetric): void {
    const { grid } = data
    const values = grid.values[metric]
    const step = Math.max(1, Math.ceil(Math.max(grid.nlon, grid.nlat) / 140))
    const cols = Math.floor((grid.nlon - 1) / step) + 1
    const rows = Math.floor((grid.nlat - 1) / step) + 1

    const positions = new Float32Array(cols * rows * 3)
    const bands: number[][] = Array.from({ length: BANDS }, () => [])

    for (let row = 0; row < rows; row++) {
      const gy = row * step
      const lat = grid.latMax - gy * grid.spacingLat
      for (let col = 0; col < cols; col++) {
        const gx = col * step
        const lon = grid.lonMin + gx * grid.spacingLon
        const value = values[gy * grid.nlon + gx]
        const norm = normalize(metric, value)
        const terrain =
          this.viewer.scene.globe.getHeight(Cartographic.fromDegrees(lon, lat)) ?? 0
        const index = row * cols + col
        const cartesian = Cartesian3.fromDegrees(
          lon,
          lat,
          terrain + 150 + norm * 20000,
        )
        positions[index * 3] = cartesian.x
        positions[index * 3 + 1] = cartesian.y
        positions[index * 3 + 2] = cartesian.z
      }
    }

    for (let row = 0; row < rows - 1; row++) {
      for (let col = 0; col < cols - 1; col++) {
        const gy = row * step
        const gx = col * step
        const value = values[gy * grid.nlon + gx]
        const band = Math.min(
          BANDS - 1,
          Math.max(0, Math.floor(normalize(metric, value) * BANDS)),
        )
        const a = row * cols + col
        const b = a + 1
        const c = a + cols
        const d = c + 1
        bands[band].push(a, c, b, b, c, d)
      }
    }

    const boundingSphere = BoundingSphere.fromVertices(positions)
    const attributes = new GeometryAttributes()
    attributes.position = new GeometryAttribute({
      componentDatatype: ComponentDatatype.FLOAT,
      componentsPerAttribute: 3,
      values: positions,
    })

    for (let band = 0; band < BANDS; band++) {
      const indices = bands[band]
      if (indices.length === 0) continue

      const value = bandValue(metric, band)
      const [r, g, b] = colorOf(metric, value)
      const alpha = visible(metric, value) ? 0.72 : 0

      const instance = new GeometryInstance({
        geometry: new Geometry({
          attributes,
          indices: new Uint32Array(indices),
          primitiveType: PrimitiveType.TRIANGLES,
          boundingSphere,
        }),
        attributes: {
          color: ColorGeometryInstanceAttribute.fromColor(
            new Color(r / 255, g / 255, b / 255, alpha),
          ),
        },
      })

      const primitive = new Primitive({
        geometryInstances: instance,
        appearance: new PerInstanceColorAppearance({
          translucent: true,
          flat: true,
          closed: false,
        }),
        asynchronous: false,
        rtcCenter: boundingSphere.center,
      } as unknown as ConstructorParameters<typeof Primitive>[0])

      this.primitives.push(primitive)
      this.viewer.scene.primitives.add(primitive)
    }
  }

  private renderContours(data: ShakemapData): void {
    for (const contour of data.contours) {
      const color = Color.fromCssColorString(contour.color).withAlpha(0.9)
      for (const line of contour.lines) {
        if (line.length < 2) continue
        this.entities.push(
          this.viewer.entities.add({
            polyline: {
              positions: line.map(([lon, lat]) =>
                Cartesian3.fromDegrees(lon, lat),
              ),
              width: 2,
              material: color,
              clampToGround: true,
            },
          }),
        )
      }
    }
  }

  clear(): void {
    this.token++
    if (this.imagery) {
      this.viewer.imageryLayers.remove(this.imagery, true)
      this.imagery = null
    }
    for (const primitive of this.primitives) {
      this.viewer.scene.primitives.remove(primitive)
    }
    this.primitives = []
    for (const entity of this.entities) {
      this.viewer.entities.remove(entity)
    }
    this.entities = []
  }

  destroy(): void {
    this.clear()
  }
}
