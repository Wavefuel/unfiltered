import React from "react";
import CustomMap from "./customMap";

const markers = [
	{
		id: "1",
		latitude: 28.6139,
		longitude: 77.209,
		type: "airport",
		color: "#1976d2",
		icon: "/icons/airport.png",
		label: "Delhi Airport",
	},
	// LOC area flight markers
	{
		id: "2",
		latitude: 34.0837,
		longitude: 74.7973,
		type: "flight",
		color: "#1976d2",
		icon: "/icons/flight.png",
		label: "Srinagar Flight",
	},
	{
		id: "3",
		latitude: 34.1526,
		longitude: 77.5771,
		type: "flight",
		color: "#1976d2",
		icon: "/icons/flight.png",
		label: "Leh Flight",
	},
	{
		id: "4",
		latitude: 32.7266,
		longitude: 74.857,
		type: "flight",
		color: "#1976d2",
		icon: "/icons/flight.png",
		label: "Jammu Flight",
	},
	{
		id: "5",
		latitude: 34.37,
		longitude: 73.47,
		type: "flight",
		color: "#1976d2",
		icon: "/icons/flight.png",
		label: "Muzaffarabad Flight",
	},
];

const mapboxAccessToken = "pk.eyJ1Ijoid2F2ZWZ1ZWwyMDIxIiwiYSI6ImNtYWkwZ3YwcjAyOGkya3M3cms4dXQ5ZGQifQ.LB2OhXVDYLwL7aClC1ywsA";

const NewsMap = () => {
	return (
		<main>
			<CustomMap markers={markers} mapboxAccessToken={mapboxAccessToken || ""} />
		</main>
	);
};

export default NewsMap;
