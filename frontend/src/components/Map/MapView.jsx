import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useEffect, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import StatusBadge from '../Complaint/StatusBadge'
import { HeatmapLayer } from './HeatmapLayer'
import { useSelector } from 'react-redux'
import UpvoteButton from '../Community/UpvoteButton'
import { formatDistanceToNow } from 'date-fns'
import './Map.css'

const MYSORE_CENTER = [12.2958, 76.6394]

// Custom marker icons by status
const makeIcon = (color, size = 32) => L.divIcon({
  className: '',
  html: `<div style="
    width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
    background:${color};border:2px solid rgba(255,255,255,0.4);
    transform:rotate(-45deg);box-shadow:0 2px 12px ${color}88;
  "></div>`,
  iconSize: [size, size],
  iconAnchor: [size / 2, size],
  popupAnchor: [0, -size],
})

const STATUS_COLORS = {
  Pending: '#F59E0B',
  'In Progress': '#3B82F6',
  Resolved: '#10B981',
}

const PRIORITY_DOT = { High: '🔴', Medium: '🟡', Low: '🟢' }

const CATEGORY_ICONS = {
  Pothole: '🕳️', 'Road Damage': '🛣️', Garbage: '🗑️', 'Open Drain': '🌊',
  'Water Leakage': '💧', 'Drainage Block': '🚫', 'Streetlight Issue': '💡',
  'Power Outage': '⚡', 'Park Damage': '🌳', 'Tree Fall': '🌲',
  'Traffic Signal': '🚦', Others: '📋',
}

export default function MapView({ complaints = [], showHeatmap = false, heatmapPoints = [] }) {
  const { user, isAuthenticated } = useSelector(s => s.auth)

  return (
    <div className="map-wrapper">
      <MapContainer
        center={MYSORE_CENTER}
        zoom={13}
        className="leaflet-map"
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="OpenStreetMap"
        />

        {showHeatmap && heatmapPoints.length > 0 && (
          <HeatmapLayer points={heatmapPoints} />
        )}

        {(() => {
          const usedCoords = new Set()
          return complaints.map(c => {
            if (!c.lat || !c.lng) return null
            
            let lat = c.lat
            let lng = c.lng
            let coordKey = `${lat.toFixed(6)},${lng.toFixed(6)}`
            
            // If location is exactly the same, jitter it slightly
            while (usedCoords.has(coordKey)) {
              lat += (Math.random() - 0.5) * 0.0003
              lng += (Math.random() - 0.5) * 0.0003
              coordKey = `${lat.toFixed(6)},${lng.toFixed(6)}`
            }
            usedCoords.add(coordKey)

            const color = STATUS_COLORS[c.status] || '#7C3AED'
            const icon = makeIcon(color)
            
            return (
              <Marker key={c.id} position={[lat, lng]} icon={icon}>
                <Popup className="civic-popup">
                  <div className="popup-content">
                    <div className="popup-header">
                      <span className="popup-icon">
                        {CATEGORY_ICONS[c.category] || '📋'}
                      </span>
                      <div>
                        <div className="popup-cat">{c.category || 'Unknown'}</div>
                        {c.areaName && <div className="popup-area">📍 {c.areaName}</div>}
                      </div>
                    </div>
                    <p className="popup-desc">{c.description}</p>
                    <div className="popup-meta">
                      <StatusBadge status={c.status} />
                      <span className="popup-priority">{PRIORITY_DOT[c.priority]} {c.priority}</span>
                    </div>
                    {isAuthenticated && c.userId !== user?.userId && (
                      <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <UpvoteButton
                          complaintId={c.id}
                          count={c.upvoteCount}
                          hasUpvoted={c.hasUpvoted}
                        />
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          })
        })()}
      </MapContainer>
    </div>
  )
}
