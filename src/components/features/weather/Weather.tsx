"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WeatherData {
  temperature: number;
  windSpeed: number;
  time: string;
}

export function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Ahmedabad, India coordinates
        const lat = 23.0225;
        const lon = 72.5714;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m&timezone=Asia/Kolkata`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch weather data");
        }

        const data = await response.json();
        setWeather({
          temperature: data.current.temperature_2m,
          windSpeed: data.current.wind_speed_10m,
          time: data.current.time,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh weather every 10 minutes
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-foreground">
            Weather in Ahmedabad
          </h1>
          <p className="text-muted-foreground">
            Real-time weather data powered by Open-Meteo
          </p>
        </div>

        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="text-muted-foreground">Loading weather data...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="py-8 text-center">
              <p className="text-destructive">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {weather && !loading && !error && (
          <Card>
            <CardHeader>
              <CardTitle>Current Weather</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mb-2 text-7xl font-bold text-primary">
                    {weather.temperature}°C
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Last updated:{" "}
                    {new Date(weather.time).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 border-t border-border pt-6 md:grid-cols-2">
                  <div className="rounded-lg bg-muted p-4 text-center">
                    <p className="mb-1 text-sm text-muted-foreground">
                      Wind Speed
                    </p>
                    <p className="text-2xl font-semibold text-foreground">
                      {weather.windSpeed} km/h
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted p-4 text-center">
                    <p className="mb-1 text-sm text-muted-foreground">
                      Location
                    </p>
                    <p className="text-2xl font-semibold text-foreground">
                      Ahmedabad, IN
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 rounded-lg bg-muted p-4">
          <p className="text-center text-sm text-muted-foreground">
            Weather data updates automatically every 10 minutes
          </p>
        </div>
      </div>
    </div>
  );
}
