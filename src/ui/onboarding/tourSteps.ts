import type { DriveStep } from 'driver.js'

type Side = 'top' | 'bottom' | 'left' | 'right'

function step(
  selector: string,
  title: string,
  description: string,
  side: Side,
): DriveStep | null {
  if (typeof document === 'undefined') return null
  if (!document.querySelector(selector)) return null

  return {
    element: selector,
    popover: { title, description, side, align: 'start' },
  }
}

export function getTourSteps(isMobile: boolean): DriveStep[] {
  const side: Side = isMobile ? 'top' : 'right'

  const steps: Array<DriveStep | null> = [
    {
      popover: {
        title: 'Mapa 3D',
        description:
          'Arrastra para girar, usa la rueda o el pinch para acercar y mantén pulsado (o dos dedos) para inclinar. Cada punto es un terremoto de los últimos 30 días.',
      },
    },
    step(
      '[data-tour="basemap"]',
      'Capas base',
      'Alterna entre ortofoto, relieve sombreado y un fondo oscuro para leer mejor los datos.',
      isMobile ? 'bottom' : 'bottom',
    ),
    step(
      '[data-tour="filters"]',
      'Filtros',
      'Ajusta magnitud, profundidad, ámbito y periodo. Los filtros se guardan en la URL y se comparten.',
      side,
    ),
    step(
      '[data-tour="event-list"]',
      'Lista de terremotos',
      'Ordenada por fecha. Toca una fila para abrir el evento; con teclado, usa ↑ y ↓.',
      side,
    ),
    step(
      '[data-tour="event-card"]',
      'Ficha del evento',
      'Magnitud, profundidad, horas UTC y local, enlace al IGN y, si existe, shakemap.',
      isMobile ? 'top' : 'left',
    ),
    step(
      isMobile ? '[data-tour="view-3d-mobile"]' : '[data-tour="view-3d"]',
      'Profundidad y marcador',
      'El + es el epicentro, el anillo el hipocentro y la línea su profundidad. Usa ×3/×5 y “Ver subsuelo” para mirar bajo el terreno.',
      side,
    ),
    step(
      '[data-tour="layers"]',
      'Capas 3D',
      'Añade fallas activas QAFI, estaciones sísmicas y el mapa de peligrosidad de 2015.',
      side,
    ),
    step(
      '[data-tour="sequence"]',
      'Secuencia',
      'Reproduce los terremotos filtrados con vuelo de cámara. Ajusta la velocidad y el bucle.',
      'top',
    ),
    step(
      '[data-tour="share"]',
      'Comparte',
      'Copia un enlace con el evento, los filtros y las capas activas.',
      'bottom',
    ),
    step(
      '[data-tour="help"]',
      'Ayuda',
      'Vuelve a abrir esta guía, la introducción o las atribuciones cuando quieras.',
      'bottom',
    ),
  ]

  return steps.filter((entry): entry is DriveStep => entry !== null)
}
