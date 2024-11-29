"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, RotateCw, ZoomIn, ZoomOut, Compass } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Types remain the same
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
  const [currentBearing, setCurrentBearing] = React.useState(0);

  React.useEffect(() => {
    const initializeMapAndData = async () => {
      try {
        const response = await fetch("/geojson.json");
        if (!response.ok) throw new Error("Failed to load GeoJSON data");
        const data: GeoJSONData = await response.json();
        setGeoJSONData(data);

        if (!mapContainer.current) return;

        mapboxgl.accessToken = MAPBOX_TOKEN;

        const newMap = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/dark-v11", // Changed to dark theme for more drama
          center: [0, 20],
          zoom: 2,
          pitch: 45, // Added default pitch
          bearing: 0,
          projection: "globe",
          maxPitch: 85,
        });

        map.current = newMap;

        // Add navigation controls
        const nav = new mapboxgl.NavigationControl({
          visualizePitch: true,
        });
        newMap.addControl(nav, "top-right");

        newMap.on("load", () => {
          // Enhanced atmosphere effect
          newMap.setFog({
            color: "rgb(186, 210, 235)",
            "high-color": "rgb(36, 92, 223)",
            "horizon-blend": 0.15,
            "space-color": "rgb(11, 11, 25)",
            "star-intensity": 0.8,
          });

          // Add dramatic lighting
          newMap.setLight({
            anchor: "viewport",
            color: "white",
            intensity: 0.4,
            position: [1, 90, 45],
          });

          // Base country layer with enhanced styling
          newMap.addSource("countries", {
            type: "geojson",
            data: data,
          });

          // Default country fill with enhanced styling
          newMap.addLayer({
            id: "country-fills",
            type: "fill-extrusion",
            source: "countries",
            paint: {
              "fill-extrusion-color": "#1f2937",
              "fill-extrusion-height": 20000,
              "fill-extrusion-base": 0,
              "fill-extrusion-opacity": 0.6,
            },
          });

          // Enhanced borders
          newMap.addLayer({
            id: "country-borders",
            type: "line",
            source: "countries",
            paint: {
              "line-color": "#60a5fa",
              "line-width": 1,
              "line-opacity": 0.8,
              "line-blur": 1,
            },
          });

          // Selected country with dramatic highlighting
          newMap.addLayer({
            id: "selected-country",
            type: "fill-extrusion",
            source: "countries",
            paint: {
              "fill-extrusion-color": "#3b82f6",
              "fill-extrusion-height": 50000,
              "fill-extrusion-base": 0,
              "fill-extrusion-opacity": 0.8,
            },
            filter: ["==", "name", ""],
          });

          // Hover effect
          newMap.addLayer({
            id: "country-fills-hover",
            type: "fill-extrusion",
            source: "countries",
            paint: {
              "fill-extrusion-color": "#4b5563",
              "fill-extrusion-height": 30000,
              "fill-extrusion-base": 0,
              "fill-extrusion-opacity": 0.7,
            },
            filter: ["==", "name", ""],
          });

          // Enhanced hover interactions
          newMap.on("mousemove", "country-fills", (e) => {
            if (e.features?.[0]?.properties) {
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

          newMap.on("mouseleave", "country-fills", () => {
            newMap.setFilter("country-fills-hover", ["==", "name", ""]);
            newMap.getCanvas().style.cursor = "";
          });

          // Enhanced click interaction
          newMap.on("click", "country-fills", (e) => {
            if (e.features?.[0]?.properties) {
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
      polygon.forEach((ring) => ring.forEach(processCoordinate));
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
        map.current.setFilter("selected-country", [
          "==",
          "name",
          country.properties.name,
        ]);
        map.current.setFilter("country-fills-hover", ["==", "name", ""]);

        // Calculate center point
        const center = [
          (bounds.getWest() + bounds.getEast()) / 2,
          (bounds.getNorth() + bounds.getSouth()) / 2,
        ];

        // Dramatic zoom sequence
        const newBearing = currentBearing + 190;
        setCurrentBearing(newBearing);

        map.current.flyTo({
          center: center,
          zoom: 3,
          bearing: newBearing,
          pitch: 75,
          duration: 3000,
          essential: true,
        });

        setTimeout(() => {
          map.current?.flyTo({
            center: center,
            zoom: 4,
            bearing: newBearing + 45,
            pitch: 60,
            duration: 2000,
          });
        }, 3000);
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

  const resetView = () => {
    if (!map.current) return;
    map.current.flyTo({
      center: [0, 20],
      zoom: 2,
      bearing: 0,
      pitch: 45,
      duration: 2000,
    });
    setSelectedCountry(null);
    setSearchQuery("");
    map.current.setFilter("selected-country", ["==", "name", ""]);
  };

  return (
    <main className="relative w-full h-screen">
      <div ref={mapContainer} className="w-full h-full" />

      <Card className="absolute top-4 left-4 p-4 w-80 bg-black/80 backdrop-blur text-white">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter country name..."
              value={searchQuery}
              onChange={handleSearch}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-gray-800 border-gray-700 text-white"
            />
            <Button
              onClick={() => flyToCountry()}
              disabled={loading}
              className="px-4 bg-blue-600 hover:bg-blue-700"
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <div className="flex gap-2 justify-between">
            <Button
              onClick={resetView}
              variant="outline"
              className="flex-1 border-gray-700 text-gray-300 hover:text-white"
            >
              <Compass className="h-4 w-4 mr-2" />
              Reset View
            </Button>
          </div>

          <div className="text-sm text-gray-400">
            Enter a country name or click on the map to start exploring
          </div>
        </div>
      </Card>
    </main>
  );
}
