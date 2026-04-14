import { logger } from "./logger";

export interface TripStop {
  station: string;
  arrivalTime: string;
  departureTime: string;
  lat?: number;
  lng?: number;
}

export interface ConsistStatus {
  consist: string;
  active: boolean;
  currentTrip?: {
    id: string;
    route: string;
    destination: string;
    stops: TripStop[];
    progress: number; // 0 to 1
    estimatedPos?: [number, number];
  };
  nextTrip?: {
    id: string;
    departureTime: string;
  };
  alerts: string[];
}

// We'll mock this for now since we can't easily scrape in this environment
// but we'll structure it to be easy to replace with real scraping logic.
export async function fetchConsistData(consist: string): Promise<ConsistStatus> {
  logger.info({ consist }, "Fetching consist data");
  
  // Real implementation would use fetch() and a parser (like cheerio or a regex)
  // const response = await fetch(`https://transportvic.me/consist/${consist}`);
  // const html = await response.text();
  
  // Mocking 430M for demonstration
  if (consist === "430M") {
    return {
      consist: "430M",
      active: true,
      currentTrip: {
        id: "trip-123",
        route: "Sandringham Line",
        destination: "Flinders Street",
        progress: 0.5,
        estimatedPos: [-37.8847, 144.9991], // Elsternwick
        stops: [
          { station: "Sandringham", arrivalTime: "12:00", departureTime: "12:02" },
          { station: "Hampton", arrivalTime: "12:05", departureTime: "12:06" },
          { station: "Brighton Beach", arrivalTime: "12:10", departureTime: "12:11" },
          { station: "Gardenvale", arrivalTime: "12:15", departureTime: "12:16" },
          { station: "Elsternwick", arrivalTime: "12:20", departureTime: "12:21" },
          { station: "Ripponlea", arrivalTime: "12:25", departureTime: "12:26" },
          { station: "Balaclava", arrivalTime: "12:30", departureTime: "12:31" },
          { station: "Windsor", arrivalTime: "12:35", departureTime: "12:36" },
          { station: "Prahran", arrivalTime: "12:40", departureTime: "12:41" },
          { station: "South Yarra", arrivalTime: "12:45", departureTime: "12:46" },
          { station: "Richmond", arrivalTime: "12:50", departureTime: "12:51" },
          { station: "Flinders Street", arrivalTime: "12:55", departureTime: "12:55" },
        ]
      },
      nextTrip: {
        id: "trip-124",
        departureTime: "13:10"
      },
      alerts: ["Minor delays on the Sandringham line due to track work."]
    };
  }

  return {
    consist,
    active: false,
    alerts: []
  };
}

export function estimatePosition(stops: TripStop[], currentTime: Date): [number, number] | undefined {
  // Logic to interpolate position between stops based on time
  // 1. Find the current segment (between two stops)
  // 2. Calculate progress (0 to 1) within that segment
  // 3. Linearly interpolate between station coordinates
  return undefined;
}
