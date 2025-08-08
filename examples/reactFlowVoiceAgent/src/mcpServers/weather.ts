import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';


// Constants
const NWS_API_BASE = "https://api.weather.gov";
const USER_AGENT = "weather-app/1.0";


// Helper functions
async function makeNWSRequest(url: string) {
  const headers = {
    "User-Agent": USER_AGENT,
    Accept: "application/geo+json",
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      console.error(`NWS API error: ${response.status} ${response.statusText}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error making NWS request:", error);
    return null;
  }
}

async function getCoordinatesForCity(location: string) {
  try {
    const encodedLocation = encodeURIComponent(location + ', USA');
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}&limit=1`, {
      headers: {
        'User-Agent': 'weather-app/1.0 (https://example.com/contact)'
      }
    });
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Error geocoding location:', error);
    return null;
  }
}



// WEATHER MCP SERVER
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "weather-mcp",
    version: "1.0.0",
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  });

  // Register weather tools
  server.tool(
    'get_current_weather',
    {
      location: z.string().describe('US city and state for current weather conditions, e.g. "San Francisco, CA"')
    },
    async ({ location }) => {
      console.log(`🌤️ Weather: Getting current weather for ${location}`);
      
      // Get coordinates for the location
      const coords = await getCoordinatesForCity(location);
      
      if (!coords) {
        return {
          content: [{
            type: 'text',
            text: `❌ Could not find coordinates for "${location}". Please try with a US city and state, e.g., "San Francisco, CA"`
          }]
        };
      }

      // Get grid point data
      const pointsUrl = `${NWS_API_BASE}/points/${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}`;
      const pointsData = await makeNWSRequest(pointsUrl);

      if (!pointsData) {
        return {
          content: [{
            type: 'text',
            text: `Failed to retrieve grid point data for ${location}. This location may not be supported by the NWS API (only US locations are supported).`
          }]
        };
      }

      const forecastUrl = pointsData.properties?.forecast;
      if (!forecastUrl) {
        return {
          content: [{
            type: 'text',
            text: "Failed to get forecast URL from grid point data"
          }]
        };
      }

      // Get forecast data
      const forecastData = await makeNWSRequest(forecastUrl);
      if (!forecastData) {
        return {
          content: [{
            type: 'text',
            text: "Failed to retrieve forecast data"
          }]
        };
      }

      const periods = forecastData.properties?.periods || [];
      if (periods.length === 0) {
        return {
          content: [{
            type: 'text',
            text: "No forecast periods available"
          }]
        };
      }

      // Get current conditions (first period)
      const currentPeriod = periods[0];
      
      const currentWeather = [
        `📍 Location: ${location}`,
        `🌍 Coordinates: ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`,
        ``,
        `🌤️ ${currentPeriod.name || "Current"}:`,
        `🌡️ Temperature: ${currentPeriod.temperature || "Unknown"}°${currentPeriod.temperatureUnit || "F"}`,
        `💨 Wind: ${currentPeriod.windSpeed || "Unknown"} ${currentPeriod.windDirection || ""}`,
        `☁️ ${currentPeriod.shortForecast || "No forecast available"}`,
      ].join('\n');

      return {
        content: [{
          type: 'text',
          text: `🌍 Current weather for ${location}:\n\n${currentWeather}`
        }]
      };
    }
  );

  server.tool(
    'get_forecast', 
    {
      location: z.string().describe('US city and state for multi-day weather forecast, e.g. "Plainfield, IL" or "San Francisco, CA"')
    },
    async ({ location }) => {
      console.log(`🌤️ Weather: Getting forecast for ${location}`);
      
      // Get coordinates for the location
      const coords = await getCoordinatesForCity(location);
      
      if (!coords) {
        return {
          content: [{
            type: 'text',
            text: `❌ Could not find coordinates for "${location}". Please try with a US city and state, e.g., "Plainfield, IL"`
          }]
        };
      }

      const { lat: latitude, lon: longitude } = coords;
      
      // Get grid point data
      const pointsUrl = `${NWS_API_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
      const pointsData = await makeNWSRequest(pointsUrl);

      if (!pointsData) {
        return {
          content: [{
            type: 'text',
            text: `Failed to retrieve grid point data for ${location} (${latitude}, ${longitude}). This location may not be supported by the NWS API (only US locations are supported).`
          }]
        };
      }

      const forecastUrl = pointsData.properties?.forecast;
      if (!forecastUrl) {
        return {
          content: [{
            type: 'text',
            text: "Failed to get forecast URL from grid point data"
          }]
        };
      }

      // Get forecast data
      const forecastData = await makeNWSRequest(forecastUrl);
      if (!forecastData) {
        return {
          content: [{
            type: 'text',
            text: "Failed to retrieve forecast data"
          }]
        };
      }

      const periods = forecastData.properties?.periods || [];
      if (periods.length === 0) {
        return {
          content: [{
            type: 'text',
            text: "No forecast periods available"
          }]
        };
      }

      // Format forecast periods
      const formattedForecast = periods.map((period: any) =>
        [
          `${period.name || "Unknown"}:`,
          `Temperature: ${period.temperature || "Unknown"}°${period.temperatureUnit || "F"}`,
          `Wind: ${period.windSpeed || "Unknown"} ${period.windDirection || ""}`,
          `${period.shortForecast || "No forecast available"}`,
          "---",
        ].join("\n")
      );

      const forecastText = `🌤️ Weather forecast for ${location}:\n\n${formattedForecast.join("\n")}`;

      return {
        content: [{
          type: 'text',
          text: forecastText
        }]
      };
    }
  );

  server.tool(
    'get_alerts',
    {
      state: z.string().length(2).describe('Two-letter US state code for weather alerts (e.g., IL, CA, NY)')
    },
    async ({ state }) => {
      console.log(`🌤️ Weather: Getting alerts for ${state}`);
      
      const stateCode = state.toUpperCase();
      const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
      const alertsData = await makeNWSRequest(alertsUrl);

      if (!alertsData) {
        return {
          content: [{
            type: 'text',
            text: "Failed to retrieve alerts data"
          }]
        };
      }

      const features = alertsData.features || [];
      if (features.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No active alerts for ${stateCode}`
          }]
        };
      }

      const formattedAlerts = features.map((feature: any) => {
        const props = feature.properties;
        return [
          `Event: ${props.event || "Unknown"}`,
          `Area: ${props.areaDesc || "Unknown"}`,
          `Severity: ${props.severity || "Unknown"}`,
          `Status: ${props.status || "Unknown"}`,
          `Headline: ${props.headline || "No headline"}`,
          "---",
        ].join("\n");
      });

      const alertsText = `Active alerts for ${stateCode}:\n\n${formattedAlerts.join("\n")}`;

      return {
        content: [{
          type: 'text',
          text: alertsText
        }]
      };
    }
  );

  return server;
}