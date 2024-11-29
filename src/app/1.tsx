"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Types
interface Coordinates {
  type: string;
  coordinates: number[][][] | number[][][][];
}

interface CountryFeature {
  type: string;
  id: string;
  properties: {
    name: string;
  };
  geometry: Coordinates;
}

interface GeoJSONData {
  type: string;
  features: CountryFeature[];
}

const MAPBOX_TOKEN =
  "pk.eyJ1IjoibXVrZXNoMTJyb3kiLCJhIjoiY2tkZmhidWMyMmE2bzJ4cGMzOXVzc3JnYSJ9.Nq3Hwr2L4TPmn6-NlRm4-Q";

export default function CountryMapPage() {
  const mapContainer = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<mapboxgl.Map | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [geoJSONData, setGeoJSONData] = React.useState<GeoJSONData | null>(
    null
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = React.useState<string | null>(
    null
  );

  React.useEffect(() => {
    const initializeMapAndData = async () => {
      try {
        const response = await fetch("/geojson.json");
        if (!response.ok) {
          throw new Error("Failed to load GeoJSON data");
        }
        const data: GeoJSONData = await response.json();
        setGeoJSONData(data);

        if (!mapContainer.current) return;

        mapboxgl.accessToken = MAPBOX_TOKEN;

        const newMap = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/light-v11",
          center: [0, 0],
          zoom: 1.5,
          projection: "globe",
        });

        map.current = newMap;

        newMap.on("load", () => {
          newMap.setFog({
            color: "rgb(186, 210, 235)",
            "high-color": "rgb(36, 92, 223)",
            "horizon-blend": 0.02,
            "space-color": "rgb(11, 11, 25)",
            "star-intensity": 0.6,
          });

          // Base country layer (unselected countries)
          newMap.addSource("countries", {
            type: "geojson",
            data: data,
          });

          // Default country fill
          newMap.addLayer({
            id: "country-fills",
            type: "fill",
            source: "countries",
            layout: {},
            paint: {
              "fill-color": "#e2e8f0",
              "fill-opacity": 0.5,
            },
          });

          // Country borders
          newMap.addLayer({
            id: "country-borders",
            type: "line",
            source: "countries",
            layout: {},
            paint: {
              "line-color": "#94a3b8",
              "line-width": 1,
            },
          });

          // Selected country highlight
          newMap.addLayer({
            id: "selected-country",
            type: "fill",
            source: "countries",
            layout: {},
            paint: {
              "fill-color": "#627BBC",
              "fill-opacity": 0.7,
            },
            filter: ["==", "name", ""],
          });

          // Hover effect (only for unselected countries)
          newMap.addLayer({
            id: "country-fills-hover",
            type: "fill",
            source: "countries",
            layout: {},
            paint: {
              "fill-color": "#94a3b8",
              "fill-opacity": 0.5,
            },
            filter: ["==", "name", ""],
          });

          // Hover interactions
          newMap.on("mousemove", "country-fills", (e) => {
            if (e.features && e.features[0].properties) {
              const countryName = e.features[0].properties.name;
              // Only show hover effect if country is not selected
              if (countryName !== selectedCountry) {
                newMap.setFilter("country-fills-hover", [
                  "==",
                  "name",
                  countryName,
                ]);
                newMap.getCanvas().style.cursor = "pointer";
              }
            }
          });

          newMap.on("mouseleave", "country-fills", () => {
            newMap.setFilter("country-fills-hover", ["==", "name", ""]);
            newMap.getCanvas().style.cursor = "";
          });

          // Click interaction
          newMap.on("click", "country-fills", (e) => {
            if (e.features && e.features[0].properties) {
              const countryName = e.features[0].properties.name;
              setSearchQuery(countryName);
              flyToCountry(countryName);
            }
          });
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error initializing map:", err);
      }
    };

    initializeMapAndData();

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [selectedCountry]);

  const calculateBounds = (coordinates: number[][][] | number[][][][]) => {
    let minLng = 180;
    let maxLng = -180;
    let minLat = 90;
    let maxLat = -90;

    const processCoordinate = (coord: number[]) => {
      minLng = Math.min(minLng, coord[0]);
      maxLng = Math.max(maxLng, coord[0]);
      minLat = Math.min(minLat, coord[1]);
      maxLat = Math.max(maxLat, coord[1]);
    };

    const processPolygon = (polygon: number[][][]) => {
      polygon.forEach((ring) => {
        ring.forEach(processCoordinate);
      });
    };

    if (Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0])) {
      if (Array.isArray(coordinates[0][0][0])) {
        coordinates.forEach(processPolygon);
      } else {
        processPolygon(coordinates as number[][][]);
      }
    }

    return new mapboxgl.LngLatBounds([minLng, minLat], [maxLng, maxLat]);
  };

  const flyToCountry = (countryName: string = searchQuery) => {
    if (!map.current || !geoJSONData || !countryName) return;

    setLoading(true);
    try {
      const country = geoJSONData.features.find(
        (feature) =>
          feature.properties.name.toLowerCase() === countryName.toLowerCase()
      );

      if (country) {
        const bounds = calculateBounds(country.geometry.coordinates);

        // Update selected country
        setSelectedCountry(country.properties.name);

        // Update the selected country layer
        map.current.setFilter("selected-country", [
          "==",
          "name",
          country.properties.name,
        ]);

        // Clear hover effect
        map.current.setFilter("country-fills-hover", ["==", "name", ""]);

        // Fly to country
        map.current.fitBounds(bounds, {
          padding: 50,
          duration: 2000,
        });
      } else {
        setError("Country not found");
      }
    } catch (err) {
      setError("Error flying to country");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setError(null);
    // Clear selection if search is cleared
    if (!event.target.value) {
      setSelectedCountry(null);
      if (map.current) {
        map.current.setFilter("selected-country", ["==", "name", ""]);
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      flyToCountry();
    }
  };

  return (
    <main className="relative w-full h-screen">
      <div ref={mapContainer} className="w-full h-full" />

      <Card className="absolute top-4 left-4 p-4 w-80 bg-white/90 backdrop-blur">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter country name..."
              value={searchQuery}
              onChange={handleSearch}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button
              onClick={() => flyToCountry()}
              disabled={loading}
              className="px-4"
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <div className="text-sm text-gray-500">
            Enter a country name and press Enter or click the button to fly to
            its location
          </div>
        </div>
      </Card>
    </main>
  );
}

=================================================================

working



"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface Coordinates {
  type: string;
  coordinates: number[][][] | number[][][][];
}

interface CountryFeature {
  type: string;
  id: string;
  properties: {
    name: string;
  };
  geometry: Coordinates;
}

interface GeoJSONData {
  type: string;
  features: CountryFeature[];
}

const MAPBOX_TOKEN =
  "pk.eyJ1IjoibXVrZXNoMTJyb3kiLCJhIjoiY2tkZmhidWMyMmE2bzJ4cGMzOXVzc3JnYSJ9.Nq3Hwr2L4TPmn6-NlRm4-Q";

export default function GameStyleGlobeMap() {
  const mapContainer = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<mapboxgl.Map | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [geoJSONData, setGeoJSONData] = React.useState<GeoJSONData | null>(
    null
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = React.useState<string | null>(
    null
  );
  const [mapInitialized, setMapInitialized] = React.useState(false);

  // Initialize map only once
  React.useEffect(() => {
    const initializeMapAndData = async () => {
      try {
        const response = await fetch("/geojson.json");
        if (!response.ok) throw new Error("Failed to load GeoJSON data");
        const data: GeoJSONData = await response.json();
        setGeoJSONData(data);

        if (!mapContainer.current || mapInitialized) return;

        mapboxgl.accessToken = MAPBOX_TOKEN;

        const newMap = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mukesh12roy/cm3vi5zr6002701s8g4xb0tkv",
          center: [0, 0],
          zoom: 1.8,
          projection: "mercator ",
          maxZoom: 7,
        });

        map.current = newMap;

        newMap.on("load", () => {
          // Add GeoJSON source
          newMap.addSource("countries", {
            type: "geojson",
            data: data,
          });

          // Add a layer for selected country highlight
          newMap.addLayer({
            id: "selected-country",
            type: "fill",
            source: "countries",
            paint: {
              "fill-color": "#E74C3C",
              "fill-opacity": 0.5,
            },
            filter: ["==", "name", ""],
          });

          // Add a layer for hover effect
          newMap.addLayer({
            id: "country-fills-hover",
            type: "fill",
            source: "countries",
            paint: {
              "fill-color": "#F4D03F",
              "fill-opacity": 0.4,
            },
            filter: ["==", "name", ""],
          });

          // Add slower rotation
          const rotateCamera = () => {
            map.current?.easeTo({
              bearing: 20,
              duration: 200000,
              easing: (t) => t,
            });
          };

          rotateCamera();
          setInterval(rotateCamera, 200000);

          // Interactive handlers
          newMap.on("mousemove", "selected-country", (e) => {
            if (e.features && e.features[0].properties) {
              const countryName = e.features[0].properties.name;
              if (countryName !== selectedCountry) {
                newMap.setFilter("country-fills-hover", [
                  "==",
                  "name",
                  countryName,
                ]);
                newMap.getCanvas().style.cursor = "pointer";
              }
            }
          });

          newMap.on("mouseleave", "selected-country", () => {
            newMap.setFilter("country-fills-hover", ["==", "name", ""]);
            newMap.getCanvas().style.cursor = "";
          });

          newMap.on("click", "selected-country", (e) => {
            if (e.features && e.features[0].properties) {
              const countryName = e.features[0].properties.name;
              setSearchQuery(countryName);
              flyToCountry(countryName);
            }
          });

          setMapInitialized(true);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error initializing map:", err);
      }
    };

    initializeMapAndData();

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []); // Empty dependency array - only run once

  // Update selected country highlight
  React.useEffect(() => {
    if (map.current && mapInitialized) {
      map.current.setFilter("selected-country", [
        "==",
        "name",
        selectedCountry || "",
      ]);
    }
  }, [selectedCountry, mapInitialized]);

  const calculateBounds = (coordinates: number[][][] | number[][][][]) => {
    let minLng = 180;
    let maxLng = -180;
    let minLat = 90;
    let maxLat = -90;

    const processCoordinate = (coord: number[]) => {
      minLng = Math.min(minLng, coord[0]);
      maxLng = Math.max(maxLng, coord[0]);
      minLat = Math.min(minLat, coord[1]);
      maxLat = Math.max(maxLat, coord[1]);
    };

    const processPolygon = (polygon: number[][][]) => {
      polygon.forEach((ring) => {
        ring.forEach(processCoordinate);
      });
    };

    if (Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0])) {
      if (Array.isArray(coordinates[0][0][0])) {
        coordinates.forEach(processPolygon);
      } else {
        processPolygon(coordinates as number[][][]);
      }
    }

    return new mapboxgl.LngLatBounds([minLng, minLat], [maxLng, maxLat]);
  };

  const flyToCountry = (countryName: string = searchQuery) => {
    if (!map.current || !geoJSONData || !countryName) return;

    setLoading(true);
    try {
      const country = geoJSONData.features.find(
        (feature) =>
          feature.properties.name.toLowerCase() === countryName.toLowerCase()
      );

      if (country) {
        const bounds = calculateBounds(country.geometry.coordinates);
        setSelectedCountry(country.properties.name);
        map.current.setFilter("country-fills-hover", ["==", "name", ""]);

        const center = [
          (bounds.getEast() + bounds.getWest()) / 2,
          (bounds.getNorth() + bounds.getSouth()) / 2,
        ];

        map.current.flyTo({
          center: center,
          zoom: Math.min(4, map.current.getZoom()),
          duration: 2000,
          essential: true,
        });
      } else {
        setError("Country not found");
      }
    } catch (err) {
      setError("Error flying to country");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setError(null);
    if (!event.target.value) {
      setSelectedCountry(null);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      flyToCountry();
    }
  };

  return (
    <main className="relative w-full h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div ref={mapContainer} className="w-full h-full" />

      <Card className="absolute top-4 left-4 p-4 w-80 bg-slate-900/80 backdrop-blur-md border-indigo-500/20 shadow-xl shadow-indigo-500/10">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter country name..."
              value={searchQuery}
              onChange={handleSearch}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-slate-800/90 border-indigo-500/20 text-white placeholder-slate-400 focus:border-indigo-500/50 focus:ring-indigo-500/20"
            />
            <Button
              onClick={() => flyToCountry()}
              disabled={loading}
              className="px-4 bg-indigo-500 hover:bg-indigo-600 transition-all duration-200 disabled:bg-indigo-400"
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </div>

          {error && <div className="text-sm text-rose-400">{error}</div>}

          <div className="text-sm text-slate-400">
            Enter a country name and press Enter or click the button to fly to
            its location
          </div>
        </div>
      </Card>
    </main>
  );