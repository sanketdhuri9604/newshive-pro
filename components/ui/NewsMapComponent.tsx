'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

interface NewsLocation {
  name: string
  lat: number
  lng: number
  count: number
  articles: any[]
}

interface Props {
  locations: NewsLocation[]
  onLocationClick: (location: NewsLocation) => void
}

export default function NewsMapComponent({ locations, onLocationClick }: Props) {
  const mapRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return undefined

    let cancelled = false

    const initMap = async () => {
      const L = (await import('leaflet')).default

      if (cancelled) return

      // Remove existing map
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      if (cancelled) return

      const map = L.map(containerRef.current!, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
        scrollWheelZoom: true,
      })

      const darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      const osmTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

      const darkLayer = L.tileLayer(darkTileUrl, {
        attribution: '© OpenStreetMap © CARTO',
        maxZoom: 18,
      })

      const osmLayer = L.tileLayer(osmTileUrl, {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      })

      darkLayer.on('tileerror', () => {
        map.removeLayer(darkLayer)
        osmLayer.addTo(map)
      })

      darkLayer.addTo(map)

      // Pulse animation CSS
      const styleId = 'news-map-styles'
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style')
        style.id = styleId
        style.textContent = `
          @keyframes newsPulse {
            0% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.5); opacity: 0.2; }
            100% { transform: scale(1); opacity: 0.8; }
          }
          .leaflet-container {
            background: #0a0a1a !important;
            border-radius: 16px;
          }
        `
        document.head.appendChild(style)
      }

      if (cancelled) return

      // Add all markers
      locations.forEach(location => {
        const radius = location.count >= 6 ? 24 :
          location.count >= 4 ? 20 :
          location.count >= 2 ? 16 : 12

        const color = location.count >= 6 ? '#EF4444' :
          location.count >= 4 ? '#F97316' :
          location.count >= 2 ? '#8B5CF6' : '#06B6D4'

        const pulseColor = location.count >= 6 ? 'rgba(239,68,68,0.3)' :
          location.count >= 4 ? 'rgba(249,115,22,0.3)' :
          location.count >= 2 ? 'rgba(139,92,246,0.3)' : 'rgba(6,182,212,0.3)'

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="position:relative;width:${radius * 2}px;height:${radius * 2}px;">
              <div style="
                position:absolute;inset:0;border-radius:50%;
                background:${pulseColor};
                animation:newsPulse 2s infinite;
              "></div>
              <div style="
                position:absolute;inset:4px;border-radius:50%;
                background:${color};
                display:flex;align-items:center;justify-content:center;
                color:white;font-size:10px;font-weight:bold;font-family:monospace;
                box-shadow:0 0 12px ${color}80;
              ">${location.count}</div>
            </div>
          `,
          iconSize: [radius * 2, radius * 2],
          iconAnchor: [radius, radius],
        })

        const marker = L.marker([location.lat, location.lng], { icon })
          .addTo(map)
          .bindTooltip(`
            <div style="background:#111124;border:1px solid #1e1e3a;border-radius:8px;padding:8px 12px;color:#F0F0FF;">
              <strong style="color:${color}">${location.name}</strong><br/>
              <span style="font-size:11px;color:#8080A0">${location.count} article${location.count > 1 ? 's' : ''}</span>
            </div>
          `, { permanent: false, direction: 'top', offset: [0, -8] })

        marker.on('click', () => onLocationClick(location))
        marker.on('mouseover', () => marker.openTooltip())
      })

      mapRef.current = map
    }

    initMap()

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [locations])

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl overflow-hidden border border-white/10"
      style={{ height: '500px' }}
    />
  )
}