import { useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const MYSORE_CENTER = [12.2958, 76.6394]

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:36px;height:36px;border-radius:50% 50% 50% 0;
    background:linear-gradient(135deg,#7C3AED,#F59E0B);
    border:3px solid white;transform:rotate(-45deg);
    box-shadow:0 4px 16px rgba(124,58,237,0.5);
  "></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
})

function DraggableMarker({ position, onDrop }) {
  const [pos, setPos] = useState(position)

  useMapEvents({
    click(e) {
      setPos(e.latlng)
      onDrop({ lat: e.latlng.lat, lng: e.latlng.lng })
    }
  })

  return pos ? <Marker position={pos} icon={pinIcon} draggable={true}
    eventHandlers={{
      dragend(e) {
        const ll = e.target.getLatLng()
        setPos(ll)
        onDrop({ lat: ll.lat, lng: ll.lng })
      }
    }}
  /> : null
}

export default function LocationPicker({ value, onChange }) {
  const handleDrop = useCallback(async ({ lat, lng }) => {
    onChange({ lat, lng, areaName: '' })
    // Reverse geocode via Nominatim
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      )
      const data = await res.json()
      const area = data.address?.suburb
        || data.address?.neighbourhood
        || data.address?.city_district
        || data.address?.city
        || ''
      onChange({ lat, lng, areaName: area })
    } catch {
      onChange({ lat, lng, areaName: '' })
    }
  }, [onChange])

  const center = value?.lat ? [value.lat, value.lng] : MYSORE_CENTER

  return (
    <div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
        📍 Click on the map or drag the pin to set the complaint location
      </p>
      <div style={{ height: 280, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <DraggableMarker position={value?.lat ? [value.lat, value.lng] : null} onDrop={handleDrop} />
        </MapContainer>
      </div>
      {value?.areaName && (
        <p style={{ fontSize: '0.82rem', color: 'var(--success)', marginTop: '0.4rem' }}>
          ✓ Area detected: <strong>{value.areaName}</strong>
        </p>
      )}
    </div>
  )
}
