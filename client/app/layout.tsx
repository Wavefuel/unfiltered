import type React from "react";
import type { Metadata } from "next";
import { Lora } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/header";

// Define the Lora font for use throughout the application
export const metadata: Metadata = {
	title: "Unfiltered",
	description:
		"a real-time, map-based monitoring platform for the Indo-Pakistan conflict. It aggregates events from credible sources, classifies them by type and geography, and presents them in a simple, trusted interface — map, timeline, and feed.",
	keywords: ["unfiltered", "india", "pakistan", "conflict", "news", "map", "timeline", "feed"],
	authors: [
		{
			name: "Wavefuel",
			url: "https://wavefuel.io",
		},
	],
	manifest: `/site.webmanifest`,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link rel="icon" href="/Logo.ico" />
				<link rel="apple-touch-icon" sizes="180x180" href="/Logo.ico" />
				<link rel="icon" type="image/png" sizes="32x32" href="/Logo.png" />
				<link rel="icon" type="image/png" sizes="16x16" href="/Logo.png" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="theme-color" content="#000000" />
				<meta name="keywords" content="unfiltered, india, pakistan, conflict, news, map, timeline, feed" />
				{/* <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" /> */}
				<meta
					name="description"
					content="Unfiltered - a real-time, map-based monitoring platform for the Indo-Pakistan conflict. It aggregates events from credible sources, classifies them by type and geography, and presents them in a simple, trusted interface — map, timeline, and feed."
				/>
				<meta name="robots" content="index, follow" />
				<meta name="language" content="English" />
				<meta name="revisit-after" content="10 days" />
				<meta name="author" content="Wavefuel" />

				<meta property="og:type" content="website" />
				<meta property="og:url" content="" />
				<meta property="og:title" content="" />
				<meta
					property="og:description"
					content="Unfiltered - a real-time, map-based monitoring platform for the Indo-Pakistan conflict. It aggregates events from credible sources, classifies them by type and geography, and presents them in a simple, trusted interface — map, timeline, and feed."
				/>
				<meta property="og:image" content="%PUBLIC_URL%/og-image.webp" />

				<meta property="twitter:card" content="summary_large_image" />
				<meta property="twitter:url" content="" />
				<meta property="twitter:title" content="" />
				<meta
					property="twitter:description"
					content="Unfiltered - a real-time, map-based monitoring platform for the Indo-Pakistan conflict. It aggregates events from credible sources, classifies them by type and geography, and presents them in a simple, trusted interface — map, timeline, and feed."
				/>
				<meta property="twitter:image" content="%PUBLIC_URL%/og-image.webp" />

				<link rel="apple-touch-icon" href="/Logo.png" />
				<link rel="stylesheet" href="https://use.typekit.net/tvu0mkn.css"></link>
				<script src="https://kit.fontawesome.com/8c75f8106c.js" crossOrigin="anonymous" async />
				<link
					rel="stylesheet"
					href="https://use.fontawesome.com/releases/v5.15.1/css/all.css"
					integrity="sha384-vp86vTRFVJgpjF9jiIGPEEqYqlDwgyBgEF109VFjmqGmIY/Y4HV4d3Gp2irVfcrp"
					crossOrigin="anonymous"
				/>
			</head>
			<body className={`font-serif`}>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					<Header />
					{children}
				</ThemeProvider>
			</body>
		</html>
	);
}
