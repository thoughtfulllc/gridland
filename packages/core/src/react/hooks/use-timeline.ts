import { engine, Timeline, type TimelineOptions } from "../../animation/Timeline"
import { useEffect, useRef } from "react"

export const useTimeline = (options: TimelineOptions = {}) => {
  const timelineRef = useRef<Timeline | null>(null)
  if (!timelineRef.current) {
    timelineRef.current = new Timeline(options)
  }
  const timeline = timelineRef.current

  useEffect(() => {
    if (options.autoplay !== false) {
      timeline.play()
    }

    engine.register(timeline)

    return () => {
      timeline.pause()
      engine.unregister(timeline)
    }
  }, [])

  return timeline
}
