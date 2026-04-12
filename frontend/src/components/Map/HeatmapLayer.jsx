import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'

export function HeatmapLayer({ points = [] }) {
  const map = useMap()

  useEffect(() => {
    if (!points.length) return

    const heatData = points.map(p => [p.lat, p.lng, p.intensity || 1])

    const layer = L.heatLayer(heatData, {
      radius: 28,
      blur: 18,
      maxZoom: 17,
      gradient: {
        0.0: '#7C3AED',
        0.4: '#9B5CF6',
        0.6: '#F59E0B',
        0.8: '#EF4444',
        1.0: '#FF0000',
      },
    })

    layer.addTo(map)
    return () => map.removeLayer(layer)
  }, [points, map])

  return null
}
