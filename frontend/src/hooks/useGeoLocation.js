import { useState, useEffect } from 'react'

export function useGeoLocation() {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser')
      setLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      err => {
        setError(err.message)
        // Fallback centre: Mysore city
        setLocation({ lat: 12.2958, lng: 76.6394 })
        setLoading(false)
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }, [])

  return { location, error, loading }
}
