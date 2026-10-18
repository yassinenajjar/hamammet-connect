import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

const markerIcon = L.divIcon({ className: 'citizen-location-pin', html: '<span></span>', iconSize: [22, 22], iconAnchor: [11, 11] })
const HAMMAMET = [36.4, 10.616]

function ClickMarker({ value, onChange }) {
  const map = useMapEvents({ click: (event) => onChange([event.latlng.lat, event.latlng.lng]) })
  useEffect(() => { if (value) map.setView(value) }, [map, value])
  return value ? <Marker position={value} icon={markerIcon} /> : null
}

export default function LocationPicker({ value, onChange }) {
  return <div className="hc-location-map"><MapContainer center={HAMMAMET} zoom={14} scrollWheelZoom className="hc-location-map-canvas"><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><ClickMarker value={value} onChange={onChange}/></MapContainer></div>
}
