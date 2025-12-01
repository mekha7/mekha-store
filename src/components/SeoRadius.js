// src/components/SeoRadius.js
import React from "react";

export default function SeoRadius() {
  const seoJson = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Mekha CCTV Solutions & Services",
    image: "https://mekhasolutions.com/logo.png",
    url: "https://mekhasolutions.com",
    telephone: "+918050426215",
    address: {
      "@type": "PostalAddress",
      streetAddress: "#536/10, No.4B Cross, Dollars Colony, Shamanur Road",
      addressLocality: "Davangere",
      addressRegion: "Karnataka",
      postalCode: "577004",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 14.4644,
      longitude: 75.9218,
    },
    areaServed: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: 14.4644,
        longitude: 75.9218,
      },
      geoRadius: 300000, // 300km
    },
    description:
      "CCTV Installation, Digital Boards, Electrical & IT Solutions. Service radius 300KM across Karnataka including Shimoga, Chitradurga, Harihar, Hubli, Hassan.",
    openingHours: "Mo-Su 08:00-20:00",
    priceRange: "₹₹",
  };

  return (
    <script type="application/ld+json">
      {JSON.stringify(seoJson)}
    </script>
  );
}
