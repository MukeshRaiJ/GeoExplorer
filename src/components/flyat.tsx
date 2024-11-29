"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Compass,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Globe,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
    population?: number;
    capital?: string;
    region?: string;
  };
  geometry: Coordinates;
}

interface GeoJSONData {
  type: string;
  features: CountryFeature[];
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const MapControls: React.FC<{
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onToggleProjection: () => void;
}> = ({ onZoomIn, onZoomOut, onReset, onToggleProjection }) => (
  <Card className="absolute bottom-4 right-4 p-2 bg-slate-900/80 backdrop-blur-md border-indigo-500/20 flex gap-2">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onZoomIn}
            className="hover:bg-indigo-500/20"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Zoom In</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onZoomOut}
            className="hover:bg-indigo-500/20"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Zoom Out</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onReset}
            className="hover:bg-indigo-500/20"
          >
            <Compass className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Reset View</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleProjection}
            className="hover:bg-indigo-500/20"
          >
            <Globe className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Toggle Projection</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </Card>
);

export default function FlatMap() {
  const mapContainer = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<mapboxgl.Map | null>(null);
  const popup = React.useRef<mapboxgl.Popup | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [geoJSONData, setGeoJSONData] = React.useState<GeoJSONData | null>(
    null
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = React.useState<string | null>(
    null
  );
  const [mapInitialized, setMapInitialized] = React.useState(false);
  const [isGlobeProjection, setIsGlobeProjection] = React.useState(true);

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
          center: [0, 20],
          zoom: 2,
          projection: isGlobeProjection ? "globe" : "mercator",
          maxZoom: 6,
          minZoom: 1.5,
        });

        // Add navigation control
        newMap.addControl(new mapboxgl.NavigationControl(), "top-right");

        // Add scale control
        newMap.addControl(new mapboxgl.ScaleControl(), "bottom-left");

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

                // Show popup
                const coordinates = e.lngLat;
                popup.current
                  ?.setLngLat(coordinates)
                  .setHTML(`<div class="font-medium">${countryName}</div>`)
                  .addTo(newMap);
              }
            }
          });

          newMap.on("mouseleave", "selected-country", () => {
            newMap.setFilter("country-fills-hover", ["==", "name", ""]);
            newMap.getCanvas().style.cursor = "";
            popup.current?.remove();
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
  }, []);

  React.useEffect(() => {
    if (map.current && mapInitialized) {
      map.current.setFilter("selected-country", [
        "==",
        "name",
        selectedCountry || "",
      ]);
    }
  }, [selectedCountry, mapInitialized]);

  React.useEffect(() => {
    if (!geoJSONData || !searchQuery) {
      setSuggestions([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const matchingCountries = geoJSONData.features
      .map((f) => f.properties.name)
      .filter((name) => name.toLowerCase().includes(query))
      .slice(0, 5);

    setSuggestions(matchingCountries);
  }, [searchQuery, geoJSONData]);

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

        const boundsWidth = bounds.getEast() - bounds.getWest();
        const boundsHeight = bounds.getNorth() - bounds.getSouth();
        const maxDimension = Math.max(boundsWidth, boundsHeight);

        let zoom = 4;
        if (maxDimension > 50) zoom = 3;
        if (maxDimension > 90) zoom = 2;
        if (maxDimension < 20) zoom = 5;
        if (maxDimension < 5) zoom = 6;

        const crossesAntimeridian = bounds.getWest() > bounds.getEast();
        const center = crossesAntimeridian
          ? [
              (bounds.getWest() + bounds.getEast() + 360) / 2,
              (bounds.getNorth() + bounds.getSouth()) / 2,
            ]
          : [
              (bounds.getWest() + bounds.getEast()) / 2,
              (bounds.getNorth() + bounds.getSouth()) / 2,
            ];

        if (map.current) {
          map.current.fitBounds(bounds, {
            padding: 50,
            maxZoom: zoom,
            duration: 2000,
          });
        }

        setTimeout(() => {
          if (map.current) {
            map.current.flyTo({
              center: center,
              zoom: Math.max(2, zoom - 2),
              duration: 2000,
              essential: true,
            });
          }
        }, 5000);
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

  const handleSuggestionClick = (countryName: string) => {
    setSearchQuery(countryName);
    setSuggestions([]);
    flyToCountry(countryName);
  };

  const handleZoomIn = () => {
    if (map.current) {
      map.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (map.current) {
      map.current.zoomOut();
    }
  };

  const handleReset = () => {
    if (map.current) {
      map.current.flyTo({
        center: [0, 20],
        zoom: 2,
        duration: 2000,
      });
      setSelectedCountry(null);
      setSearchQuery("");
      setSuggestions([]);
    }
  };

  const toggleProjection = () => {
    if (map.current) {
      const newProjection = isGlobeProjection ? "mercator" : "globe";
      map.current.setProjection(newProjection);
      setIsGlobeProjection(!isGlobeProjection);
    }
  };

  return (
    <main className="relative w-full h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div ref={mapContainer} className="w-full h-full" />

      <Card className="absolute top-4 left-4 p-4 w-80 bg-slate-900/80 backdrop-blur-md border-indigo-500/20 shadow-xl shadow-indigo-500/10">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter country name..."
                value={searchQuery}
                onChange={handleSearch}
                onKeyPress={(e) => e.key === "Enter" && flyToCountry()}
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

            {suggestions.length > 0 && (
              <Card className="absolute w-full mt-1 z-50 bg-slate-900/80 backdrop-blur-md border-indigo-500/20">
                <div className="p-1">
                  {suggestions.map((country) => (
                    <button
                      key={country}
                      onClick={() => handleSuggestionClick(country)}
                      className="w-full text-left px-3 py-2 text-white hover:bg-indigo-500/20 rounded transition-colors"
                    >
                      {country}
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {error && <div className="text-sm text-rose-400">{error}</div>}

          <div className="text-sm text-slate-400">
            Enter a country name and press Enter or click the button to fly to
            its location
          </div>
        </div>
      </Card>

      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        onToggleProjection={toggleProjection}
      />
    </main>
  );
}
