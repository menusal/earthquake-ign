import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useEffect, useRef } from 'react'
import './onboarding.css'
import { getTourSteps } from './tourSteps'

interface GuidedTourProps {
  active: boolean
  isMobile: boolean
  onClose: () => void
}

export function GuidedTour({ active, isMobile, onClose }: GuidedTourProps) {
  const finishedRef = useRef(false)

  useEffect(() => {
    if (!active) return

    finishedRef.current = false
    const steps = getTourSteps(isMobile)
    if (steps.length === 0) {
      onClose()
      return
    }

    const tour = driver({
      showProgress: true,
      progressText: '{{current}} / {{total}}',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Listo',
      allowClose: true,
      overlayOpacity: 0.68,
      stagePadding: 6,
      stageRadius: 12,
      smoothScroll: true,
      disableActiveInteraction: true,
      steps,
      onDestroyed: () => {
        if (finishedRef.current) return
        finishedRef.current = true
        onClose()
      },
    })

    tour.drive()

    return () => {
      if (!finishedRef.current) {
        finishedRef.current = true
        tour.destroy()
      }
    }
  }, [active, isMobile, onClose])

  return null
}
