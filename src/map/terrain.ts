import {
  Credit,
  Event,
  GeographicTilingScheme,
  HeightmapTerrainData,
  TerrainProvider,
  TileAvailability,
  type TerrainData,
} from 'cesium'
import areas from '../../terrainAreas.json'

export const TERRAIN_SIZE = 65

interface Area {
  west: number
  south: number
  east: number
  north: number
  maxLevel?: number
}

function tileRange(level: number, area: Area) {
  const width = 180 / 2 ** level
  const xMax = 2 ** (level + 1) - 1
  const yMax = 2 ** level - 1

  return {
    xMin: Math.max(0, Math.min(xMax, Math.floor((area.west + 180) / width))),
    xMax: Math.max(0, Math.min(xMax, Math.floor((area.east + 180) / width))),
    yMin: Math.max(0, Math.min(yMax, Math.floor((90 - area.north) / width))),
    yMax: Math.max(0, Math.min(yMax, Math.floor((90 - area.south) / width))),
  }
}

function createAvailability(
  scheme: GeographicTilingScheme,
  maxLevel: number,
): TileAvailability {
  const availability = new TileAvailability(scheme, maxLevel)

  for (let level = 0; level <= areas.nationalMaxLevel; level++) {
    const range = tileRange(level, areas.national)
    availability.addAvailableTileRange(
      level,
      range.xMin,
      range.yMin,
      range.xMax,
      range.yMax,
    )
  }

  for (const roi of areas.rois as Area[]) {
    const upTo = roi.maxLevel ?? areas.nationalMaxLevel
    for (
      let level = areas.nationalMaxLevel + 1;
      level <= Math.min(upTo, maxLevel);
      level++
    ) {
      const range = tileRange(level, roi)
      availability.addAvailableTileRange(
        level,
        range.xMin,
        range.yMin,
        range.xMax,
        range.yMax,
      )
    }
  }

  return availability
}

function flatTile(childTileMask: number): TerrainData {
  return new HeightmapTerrainData({
    buffer: new Int16Array(TERRAIN_SIZE * TERRAIN_SIZE),
    width: TERRAIN_SIZE,
    height: TERRAIN_SIZE,
    childTileMask,
  })
}

async function loadTile(
  x: number,
  y: number,
  level: number,
  availability: TileAvailability,
): Promise<TerrainData> {
  const childTileMask = availability.computeChildMaskForTile(level, x, y)

  try {
    const response = await fetch(`/terrain/${level}/${x}/${y}.bin`)
    if (!response.ok) return flatTile(0)

    const buffer = await response.arrayBuffer()
    if (buffer.byteLength !== TERRAIN_SIZE * TERRAIN_SIZE * 2) {
      return flatTile(0)
    }

    return new HeightmapTerrainData({
      buffer: new Int16Array(buffer),
      width: TERRAIN_SIZE,
      height: TERRAIN_SIZE,
      childTileMask,
    })
  } catch {
    return flatTile(childTileMask)
  }
}

export function createTerrainProvider(): TerrainProvider {
  const scheme = new GeographicTilingScheme()
  const maxLevel = 12
  const availability = createAvailability(scheme, maxLevel)
  const levelZeroError =
    TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(
      scheme.ellipsoid,
      TERRAIN_SIZE,
      scheme.getNumberOfXTilesAtLevel(0),
    )

  const provider = {
    tilingScheme: scheme,
    hasWaterMask: false,
    hasVertexNormals: false,
    availability,
    credit: new Credit('IGN · MDT'),
    errorEvent: new Event(),
    getLevelMaximumGeometricError(level: number) {
      return levelZeroError / 2 ** level
    },
    requestTileGeometry(x: number, y: number, level: number) {
      if (!availability.isTileAvailable(level, x, y)) return undefined
      return loadTile(x, y, level, availability)
    },
    getTileDataAvailable(x: number, y: number, level: number) {
      return availability.isTileAvailable(level, x, y)
    },
    loadTileDataAvailability() {
      return undefined
    },
  }

  return provider as unknown as TerrainProvider
}
