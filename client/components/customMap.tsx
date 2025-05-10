"use client";
import React, { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Plane, Landmark } from "lucide-react";
import ReactDOM from "react-dom/client";

export type CustomMarker = {
	id: string;
	latitude: number;
	longitude: number;
	type: string;
	icon?: string; // URL for the icon (optional)
	color?: string; // color for the marker (optional)
	label?: string;
};

interface CustomMapProps {
	markers: CustomMarker[];
	initialViewState?: {
		latitude: number;
		longitude: number;
		zoom: number;
	};
	mapboxAccessToken: string;
}

const CustomMap: React.FC<CustomMapProps> = ({
	markers,
	initialViewState = { latitude: 28.6139, longitude: 77.209, zoom: 5 },
	mapboxAccessToken,
}) => {
	const mapContainer = useRef<HTMLDivElement>(null);
	const mapRef = useRef<mapboxgl.Map | null>(null);
	const markerRefs = useRef<mapboxgl.Marker[]>([]);
	const mapLoaded = useRef(false);

	const iconMap: Record<string, React.ElementType> = {
		flight: Plane,
		airport: Landmark,
		// add more as needed
	};

	// Initialize map only once
	useEffect(() => {
		if (!mapContainer.current) return;
		mapboxgl.accessToken = mapboxAccessToken;
		if (mapRef.current) return;

		mapRef.current = new mapboxgl.Map({
			container: mapContainer.current,
			style: "mapbox://styles/wavefuel2021/cmai864xa00zi01s3f2551kpm",
			center: [initialViewState.longitude, initialViewState.latitude],
			zoom: initialViewState.zoom,
		});

		mapRef.current.on("load", () => {
			mapLoaded.current = true;
			addMarkers();
		});

		return () => {
			markerRefs.current.forEach((marker) => marker.remove());
			mapRef.current?.remove();
			mapRef.current = null;
			mapLoaded.current = false;
		};
		// eslint-disable-next-line
	}, [mapboxAccessToken, initialViewState]);

	// Add/Update markers when markers prop changes
	useEffect(() => {
		if (mapLoaded.current) {
			addMarkers();
		}
		// eslint-disable-next-line
	}, [markers]);

	// Helper to add markers
	const addMarkers = () => {
		if (!mapRef.current) return;

		// Remove old markers
		markerRefs.current.forEach((marker) => marker.remove());
		markerRefs.current = [];

		markers.forEach((marker) => {
			if (typeof marker.longitude !== "number" || typeof marker.latitude !== "number") return;

			const el = document.createElement("div");
			el.style.width = "32px";
			el.style.height = "32px";
			el.style.display = "flex";
			el.style.alignItems = "center";
			el.style.justifyContent = "center";
			el.title = marker.label || marker.type;
			el.style.backgroundColor = marker.color || "#1976d2";
			el.style.borderRadius = "50%";

			const IconComponent = iconMap[marker.type] || Plane;
			const root = ReactDOM.createRoot(el);
			root.render(<IconComponent color={"white"} size={20} />);

			// Use el as the marker element
			const mapboxMarker = new mapboxgl.Marker(el).setLngLat([marker.longitude, marker.latitude]).addTo(mapRef.current!);

			markerRefs.current.push(mapboxMarker);
		});
	};

	return <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />;
};

export default CustomMap;
