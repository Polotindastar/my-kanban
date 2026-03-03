import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
themeColor: "#2563eb",
width: "device-width",
initialScale: 1,
maximumScale: 1,
userScalable: false,
};

export const metadata: Metadata = {
title: "KanbanPro Mobile",
description: "Hlasový Kanban Board pro tvůj mobil",
manifest: "/manifest.json",
appleWebApp: {
capable: true,
statusBarStyle: "default",
title: "KanbanPro",
},
};

export default function RootLayout({
children,
}: {
children: React.ReactNode;
}) {
return (
<html lang="cs">
<head>
<link rel="apple-touch-icon" href="/icon-192.png" />
</head>
<body>{children}</body>
</html>
);
}