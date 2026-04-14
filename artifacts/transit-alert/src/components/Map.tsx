import { useEffect, useState, useCallback, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { formatDistanceToNow } from "date-fns";
import {
  useGetReports,
  useGetConsistStatus,
} from "@workspace/api-client-react";
import type { Report } from "@workspace/api-client-react/src/generated/api.schemas";
import {
  Train,
  MapPin,
  Layers,
  Eye,
  EyeOff,
  AlertTriangle,
  Clock,
  Info,
  ZoomIn,
  ZoomOut,
  Navigation,
} from "lucide-react";

const MELBOURNE_CENTER: [number, number] = [-37.8136, 144.9631];

// =========================
// Types
// =========================
export type Station = {
  name: string;
  position: [number, number];
  staffed?: boolean;
  barriers?: boolean;
  vline?: boolean;
  metro?: boolean;
  zone?: string;
};

interface MapProps {
  journeyRoute?: Station[];
}

interface LayerState {
  merndaLine: boolean;
  hurstbridgeLine: boolean;
  cliftonHillLoop: boolean;
  frankstonLine: boolean;
  cranbourneLine: boolean;
  pakenhamLine: boolean;
  sunburyLine: boolean;
  craigieburnLine: boolean;
  upfieldLine: boolean;
  lilydaleLine: boolean;
  belgraveLine: boolean;
  alameinLine: boolean;
  glenWaverleyLine: boolean;
  northernLoop: boolean;
  burnleyLoop: boolean;
  metroTunnel: boolean;
  werribeeLine: boolean;
  sandringhamLine: boolean;
  inspectors: boolean;
  delays: boolean;
  incidents: boolean;
  heatCircles: boolean;
}

// =========================
// Constants
// =========================
const TRANSPORT_EMOJI: Record<string, string> = {
  tram: "🚃",
  train: "🚆",
  bus: "🚌",
  stop: "🚏",
};

const REPORT_COLOR: Record<string, string> = {
  inspector: "#e11d48",
  delay: "#f59e0b",
  incident: "#3b82f6",
};

const REPORT_LABEL: Record<string, string> = {
  inspector: "Inspector",
  delay: "Delay",
  incident: "Incident",
};

const DIRECTION_LABEL: Record<string, string> = {
  city_bound: "City Bound 🏙️",
  outbound: "Outbound 🏠",
  unknown: "",
};

// =========================
// Station Data
// =========================
const MERNDA_STATIONS: Station[] = [
  { name: "Flinders Street", position: [-37.8184161, 144.9664779] },
  { name: "Jolimont", position: [-37.8163, 144.9840] },
  { name: "West Richmond", position: [-37.8122, 144.9889] },
  { name: "North Richmond", position: [-37.8071, 144.9920] },
  { name: "Collingwood", position: [-37.8028, 144.9975] },
  { name: "Victoria Park", position: [-37.7991, 145.0042] },
  { name: "Clifton Hill", position: [-37.7881, 145.0015] },
  { name: "Rushall", position: [-37.7839, 145.0175] },
  { name: "Merri", position: [-37.7774, 145.0218] },
  { name: "Northcote", position: [-37.7698, 145.0248] },
  { name: "Croxton", position: [-37.7646, 145.0357] },
  { name: "Thornbury", position: [-37.7558, 145.0377] },
  { name: "Bell", position: [-37.7456, 145.0397] },
  { name: "Preston", position: [-37.7388, 145.0408] },
  { name: "Regent", position: [-37.7285, 145.0430] },
  { name: "Reservoir", position: [-37.7169, 145.0452] },
  { name: "Ruthven", position: [-37.7086, 145.0471] },
  { name: "Keon Park", position: [-37.6948, 145.0361] },
  { name: "Thomastown", position: [-37.6804, 145.0135] },
  { name: "Lalor", position: [-37.6669, 145.0172] },
  { name: "Epping", position: [-37.6521, 145.0198] },
  { name: "South Morang", position: [-37.6490, 145.0678] },
  { name: "Middle Gorge", position: [-37.6409, 145.0874] },
  { name: "Hawkstowe", position: [-37.6420, 145.1021] },
  { name: "Mernda", position: [-37.6006, 145.0958] },
];

const HURSTBRIDGE_STATIONS: Station[] = [
  { name: "Flinders Street", position: [-37.8184161, 144.9664779] },
  { name: "Jolimont", position: [-37.8163, 144.9840] },
  { name: "West Richmond", position: [-37.8122, 144.9889] },
  { name: "North Richmond", position: [-37.8071, 144.9920] },
  { name: "Collingwood", position: [-37.8028, 144.9975] },
  { name: "Victoria Park", position: [-37.7991, 145.0042] },
  { name: "Clifton Hill", position: [-37.7881, 145.0015] },
  { name: "Westgarth", position: [-37.7809, 145.0028] },
  { name: "Dennis", position: [-37.7699, 145.0050] },
  { name: "Fairfield", position: [-37.7788, 145.0176] },
  { name: "Alphington", position: [-37.7780, 145.0314] },
  { name: "Darebin", position: [-37.7749, 145.0385] },
  { name: "Ivanhoe", position: [-37.7698, 145.0457] },
  { name: "Eaglemont", position: [-37.7634, 145.0634] },
  { name: "Heidelberg", position: [-37.7570, 145.0705] },
  { name: "Rosanna", position: [-37.7429, 145.0673] },
  { name: "Macleod", position: [-37.7265, 145.0690] },
  { name: "Watsonia", position: [-37.7112, 145.0826] },
  { name: "Greensborough", position: [-37.7049, 145.1038] },
  { name: "Montmorency", position: [-37.7162, 145.1210] },
  { name: "Eltham", position: [-37.7149, 145.1482] },
  { name: "Diamond Creek", position: [-37.6718, 145.1570] },
  { name: "Wattle Glen", position: [-37.6644, 145.1872] },
  { name: "Hurstbridge", position: [-37.6404, 145.1925] },
];

const CLIFTONHILLGROUPLOOP_STATIONS: Station[] = [
  { name: "Clifton Hill", position: [-37.7881, 145.0015] },
  { name: "Jolimont", position: [-37.8163, 144.9840] },
  { name: "Flinders Street", position: [-37.8184161, 144.9664779] },
  { name: "Southern Cross", position: [-37.8176, 144.9522] },
  { name: "Flagstaff", position: [-37.81196029877101, 144.9566610145156] },
  { name: "Melbourne Central", position: [-37.8101, 144.9626] },
  { name: "Parliament", position: [-37.81123787494798, 144.97303582934072] },
  { name: "Jolimont", position: [-37.8163, 144.9840] },
];
const FRANKSTON_STATIONS: Station[] = [
  { name: "Frankston", position: [-38.1426676, 145.1262003] },
  { name: "Kananook", position: [-38.121688, 145.1354187] },
  { name: "Seaford", position: [-38.1040134, 145.1282259] },
  { name: "Carrum", position: [-38.0774817, 145.1230629] },
  { name: "Bonbeach", position: [-38.065449, 145.120108] },
  { name: "Chelsea", position: [-38.0532764, 145.1166366] },
  { name: "Edithvale", position: [-38.0365046, 145.1075721] },
  { name: "Aspendale", position: [-38.0272365, 145.1021263] },
  { name: "Mordialloc", position: [-38.0067174, 145.0875658] },
  { name: "Parkdale", position: [-37.9924751, 145.0755901] },
  { name: "Mentone", position: [-37.9835507, 145.066334] },
  { name: "Cheltenham", position: [-37.9670081, 145.0546951] },
  { name: "Southland", position: [-37.9584027, 145.0488064] },
  { name: "Highett", position: [-37.9484438, 145.04188] },
  { name: "Moorabbin", position: [-37.9343919, 145.0368952] },
  { name: "Patterson", position: [-37.9251159, 145.0354959] },
  { name: "Bentleigh", position: [-37.9175354, 145.0369346] },
  { name: "McKinnon", position: [-37.9114018, 145.0381036] },
  { name: "Ormond", position: [-37.9042587, 145.0394811] },
  { name: "Glen Huntly", position: [-37.8893136, 145.042285] },
  { name: "Caulfield", position: [-37.8773212, 145.0423811] },
  { name: "Malvern", position: [-37.8663425, 145.029464] },
  { name: "Armadale", position: [-37.8562948, 145.0192436] },
  { name: "Toorak", position: [-37.8506631, 145.0136792] },
  { name: "Hawksburn", position: [-37.8446738, 145.0019694] },
  { name: "South Yarra", position: [-37.8381009, 144.99237] },
  { name: "Richmond", position: [-37.82359625345165, 144.9891977969667] },
];
const CRAIGIEBURN_STATIONS: Station[] = [
  { name: "Craigieburn", position: [-37.6020, 144.9437] },
  { name: "Roxburgh Park", position: [-37.6258, 144.9308] },
  { name: "Coolaroo", position: [-37.6493, 144.9270] },
  { name: "Broadmeadows", position: [-37.6800, 144.9198] },
  { name: "Jacana", position: [-37.6884, 144.9078] },
  { name: "Glenroy", position: [-37.7089, 144.9190] },
  { name: "Oak Park", position: [-37.7184, 144.9198] },
  { name: "Pascoe Vale", position: [-37.7305, 144.9280] },
  { name: "Strathmore", position: [-37.7428, 144.9200] },
  { name: "Essendon", position: [-37.7560, 144.9162] },
  { name: "Moonee Ponds", position: [-37.7668, 144.9240] },
  { name: "Ascot Vale", position: [-37.7753, 144.9220] },
  { name: "Newmarket", position: [-37.7872, 144.9288] },
  { name: "Kensington", position: [-37.7947, 144.9306] },
  { name: "North Melbourne", position: [-37.8073, 144.9426] },
];

const UPFIELD_STATIONS: Station[] = [
  { name: "Upfield", position: [-37.6699, 144.9501] },
  { name: "Gowrie", position: [-37.7000, 144.9434] },
  { name: "Fawkner", position: [-37.7149, 144.9608] },
  { name: "Merlynston", position: [-37.7209, 144.9617] },
  { name: "Batman", position: [-37.7334, 144.9613] },
  { name: "Coburg", position: [-37.7428, 144.9638] },
  { name: "Moreland", position: [-37.7549, 144.9619] },
  { name: "Anstey", position: [-37.7614, 144.9608] },
  { name: "Brunswick", position: [-37.7677, 144.9587] },
  { name: "Jewell", position: [-37.7740, 144.9574] },
  { name: "Royal Park", position: [-37.7817, 144.9523] },
  { name: "Flemington Bridge", position: [-37.7888, 144.9390] },
  { name: "Macaulay", position: [-37.7943, 144.9364] },
  { name: "North Melbourne", position: [-37.8073, 144.9426] },
];
const LILYDALE_STATIONS: Station[] = [
  { name: "Richmond", position: [-37.82359625345165, 144.9891977969667] },
  { name: "East Richmond", position: [-37.8260, 145.0007] },
  { name: "Burnley", position: [-37.8270, 145.0074] },
  { name: "Hawthorn", position: [-37.8226, 145.0226] },
  { name: "Glenferrie", position: [-37.8210, 145.0368] },
  { name: "Auburn", position: [-37.8201, 145.0457] },
  { name: "Camberwell", position: [-37.8260, 145.0587] },
  { name: "East Camberwell", position: [-37.8268, 145.0697] },
  { name: "Canterbury", position: [-37.8249, 145.0812] },
  { name: "Chatham", position: [-37.8243, 145.1030] },
  { name: "Union", position: [-37.8184, 145.1106] },
  { name: "Box Hill", position: [-37.8189, 145.1254] },
  { name: "Laburnum", position: [-37.8209, 145.1400] },
  { name: "Blackburn", position: [-37.8200, 145.1509] },
  { name: "Nunawading", position: [-37.8204, 145.1738] },
  { name: "Mitcham", position: [-37.8230, 145.1888] },
  { name: "Heatherdale", position: [-37.8184, 145.2130] },
  { name: "Ringwood", position: [-37.8158, 145.2289] },
  { name: "Croydon", position: [-37.7951, 145.2817] },
  { name: "Mooroolbark", position: [-37.7848, 145.3126] },
  { name: "Lilydale", position: [-37.7578, 145.3451] },
];

const BELGRAVE_STATIONS: Station[] = [
  { name: "Richmond", position: [-37.82359625345165, 144.9891977969667] },
  { name: "East Richmond", position: [-37.8260, 145.0007] },
  { name: "Burnley", position: [-37.8270, 145.0074] },
  { name: "Hawthorn", position: [-37.8226, 145.0226] },
  { name: "Glenferrie", position: [-37.8210, 145.0368] },
  { name: "Auburn", position: [-37.8201, 145.0457] },
  { name: "Camberwell", position: [-37.8260, 145.0587] },
  { name: "East Camberwell", position: [-37.8268, 145.0697] },
  { name: "Canterbury", position: [-37.8249, 145.0812] },
  { name: "Chatham", position: [-37.8243, 145.1030] },
  { name: "Union", position: [-37.8184, 145.1106] },
  { name: "Box Hill", position: [-37.8189, 145.1254] },
  { name: "Laburnum", position: [-37.8209, 145.1400] },
  { name: "Blackburn", position: [-37.8200, 145.1509] },
  { name: "Nunawading", position: [-37.8204, 145.1738] },
  { name: "Mitcham", position: [-37.8230, 145.1888] },
  { name: "Heatherdale", position: [-37.8184, 145.2130] },
  { name: "Ringwood", position: [-37.8158, 145.2289] },
  { name: "Heathmont", position: [-37.8290, 145.2446] },
  { name: "Bayswater", position: [-37.8415, 145.2682] },
  { name: "Boronia", position: [-37.8600, 145.2847] },
  { name: "Ferntree Gully", position: [-37.8858, 145.2953] },
  { name: "Upper Ferntree Gully", position: [-37.8927, 145.3095] },
  { name: "Upwey", position: [-37.9035, 145.3303] },
  { name: "Tecoma", position: [-37.9082, 145.3446] },
  { name: "Belgrave", position: [-37.9109, 145.3536] },
];

const ALAMEIN_STATIONS: Station[] = [
  { name: "Camberwell", position: [-37.8260, 145.0587] },
  { name: "Riversdale", position: [-37.8316, 145.0706] },
  { name: "Willison", position: [-37.8355, 145.0817] },
  { name: "Hartwell", position: [-37.8433, 145.0849] },
  { name: "Burwood", position: [-37.8501, 145.0888] },
  { name: "Ashburton", position: [-37.8620, 145.0818] },
  { name: "Alamein", position: [-37.8672, 145.0797] },
];

const GLEN_WAVERLEY_STATIONS: Station[] = [
  { name: "Richmond", position: [-37.82359625345165, 144.9891977969667] },
  { name: "East Richmond", position: [-37.8260, 145.0007] },
  { name: "Burnley", position: [-37.8270, 145.0074] },
  { name: "Heyington", position: [-37.8347, 145.0240] },
  { name: "Kooyong", position: [-37.8401, 145.0337] },
  { name: "Tooronga", position: [-37.8415, 145.0428] },
  { name: "Gardiner", position: [-37.8534, 145.0446] },
  { name: "Glen Iris", position: [-37.8597, 145.0501] },
  { name: "Darling", position: [-37.8675, 145.0604] },
  { name: "East Malvern", position: [-37.8761, 145.0695] },
  { name: "Holmesglen", position: [-37.8747, 145.0866] },
  { name: "Jordanville", position: [-37.8735, 145.1025] },
  { name: "Mount Waverley", position: [-37.8769, 145.1291] },
  { name: "Syndal", position: [-37.8756, 145.1472] },
  { name: "Glen Waverley", position: [-37.8794, 145.1633] },
];
const BURNLEYGROUPLOOP_STATIONS: Station[] = [
  { name: "Richmond", position: [-37.82359625345165, 144.9891977969667] },
  { name: "Flinders Street", position: [-37.8184161, 144.9664779] },
  { name: "Southern Cross", position: [-37.8176, 144.9522] },
  { name: "Flagstaff", position: [-37.81196029877101, 144.9566610145156] },
  { name: "Melbourne Central", position: [-37.8101, 144.9626] },
  { name: "Parliament", position: [-37.81123787494798, 144.97303582934072] },
  { name: "Richmond", position: [-37.82359625345165, 144.9891977969667] },
];
const BURNLEY_LOOP: [number, number][] = [
  [-37.82359625345165, 144.9891977969667], // Richmond
  [-37.8205, 144.9750],
  [-37.8184161, 144.9664779], // Flinders Street
  [-37.819578159795725, 144.9610791331353],
  [-37.82104238088903, 144.95707972900598],
  [-37.8211906937223, 144.95500906362312],
  [-37.81973721503802, 144.95279892337976],
  [-37.8193066506804, 144.95240125386297], // Southern Cross
  [-37.81766430074989, 144.95108174796619],
  [-37.81602005179086, 144.94986938945834],
  [-37.81465546682327, 144.94969772810222],
  [-37.81335866395033, 144.9505774926714],
  [-37.81335215689385, 144.9507340157454],
  [-37.81196029877101, 144.9566610145156], // Flagstaff
  [-37.8101, 144.9626], // Melbourne Central
  [-37.80792668206212, 144.96937976627547],
  [-37.808079259516454, 144.97045264993122],
  [-37.80890995342101, 144.97193322934783],
  [-37.81031702586954, 144.97240529813624], // Parliament
  [-37.8147653441898, 144.97416778728817],
  [-37.815923183065, 144.97346658889202],
  [-37.81778485426324, 144.96826388056115],
  [-37.8184161, 144.9664779], // Flinders Street
  [-37.8205, 144.9750],
  [-37.82359625345165, 144.9891977969667], // Richmond
];

const PAKENHAM_STATIONS: Station[] = [
  { name: "Anzac", position: [-37.8315, 144.9795] },
  { name: "Hawksburn", position: [-37.8446738, 145.0019694] },
  { name: "Toorak", position: [-37.8506631, 145.0136792] },
  { name: "Armadale", position: [-37.8562948, 145.0192436] },
  { name: "Malvern", position: [-37.8663425, 145.029464] },
  { name: "Caulfield", position: [-37.8770, 145.0424] },
  { name: "Carnegie", position: [-37.88584755576908, 145.0576145973216] },
  { name: "Murrumbeena", position: [-37.889800131059374, 145.06676121081267] },
  { name: "Hughesdale", position: [-37.89413917232323, 145.076200726158132] },
  { name: "Oakleigh", position: [-37.900458908475315, 145.08839984150381] },
  { name: "Huntingdale", position: [-37.91097055312629, 145.10241977630986] },
  { name: "Clayton", position: [-37.924541507360765, 145.12053998830723] },
  { name: "Westall", position: [-37.937755318504934, 145.13805369881837] },
  { name: "Springvale", position: [-37.94893771437316, 145.15307099140574] },
  { name: "Sandown Park", position: [-37.95653055647639, 145.1628965591817] },
  { name: "Noble Park", position: [-37.9571, 145.1631] },
  { name: "Yarraman", position: [-37.9633, 145.1746] },
  { name: "Dandenong", position: [-37.98991938287247, 145.20988128532633] },
  { name: "Hallam", position: [-37.9953, 145.2341] },
  { name: "Narre Warren", position: [-38.0136, 145.2595] },
  { name: "Berwick", position: [-38.0286, 145.2903] },
  { name: "Beaconsfield", position: [-38.0436, 145.3205] },
  { name: "Officer", position: [-38.0653, 145.3664] },
  { name: "Cardinia Road", position: [-38.0795, 145.3953] },
  { name: "Pakenham", position: [-38.0735, 145.4716] },
  { name: "East Pakenham", position: [-38.0821, 145.51] },
];

const CRANBOURNE_STATIONS: Station[] = [
  { name: "Dandenong", position: [-37.98991938287247, 145.20988128532633] },
  { name: "Lynbrook", position: [-38.056307584760475, 145.25319338898683] },
  { name: "Merinda Park", position: [-38.079655791047855, 145.26428718532986] },
  { name: "Cranbourne", position: [-38.099, 145.2613] },
];

const SUNBURY_STATIONS: Station[] = [
  { name: "Sunbury", position: [-37.5837, 144.717] },
  { name: "Diggers Rest", position: [-37.62621416753362, 144.71929552429663] },
  { name: "Watergardens", position: [-37.70018094198704, 144.77262172318856] },
  { name: "Keilor Plains", position: [-37.72930031255676, 144.7928135623099] },
  { name: "St. Albans", position: [-37.74478482442231, 144.79992678066148 ] },
  { name: "Ginifer", position: [-37.76011342095589, 144.81221129777228] },
  { name: "Albion", position: [-37.776690746428365, 144.82408952556068] },
  { name: "Sunshine", position: [-37.78812106172095, 144.83237218696007] },
  { name: "Tottenham", position: [-37.79906652439008, 144.86302968739224] },
  { name: "West Footscray", position: [-37.80159439768236, 144.88351876420322] },
  { name: "Middle Footscray", position: [-37.80244211892746, 144.89150101820428] },
  { name: "Footscray", position: [-37.801696124765726, 144.90150029345793] },
  { name: "Arden", position: [-37.80093646751718, 144.94074635061708] },
  { name: "Parkville", position: [-37.79978943619289, 144.9595131752267] },
  { name: "State Library", position: [-37.8117, 144.9629] },
  { name: "Town Hall", position: [-37.8184161, 144.9656] },
  { name: "Anzac", position: [-37.8315, 144.9795] },
];

const METRO_TUNNEL_STATIONS: Station[] = [
  { name: "Arden", position: [-37.80093646751718, 144.94074635061708] },
  { name: "Parkville", position: [-37.79978943619289, 144.9595131752267] },
  { name: "State Library", position: [-37.8117, 144.9629] },
  { name: "Town Hall", position: [-37.8184161, 144.9656] },
  { name: "Anzac", position: [-37.8315, 144.9795] },
];

const CAUFIELDLOOP_STATIONS: Station[] = [
  { name: "Richmond", position: [-37.82359625345165, 144.9891977969667] },
  { name: "Flinders Street", position: [-37.8184161, 144.9664779] },
  { name: "Southern Cross", position: [-37.8176, 144.9522] },
  { name: "Flagstaff", position: [-37.81196029877101, 144.9566610145156] },
  { name: "Melbourne Central", position: [-37.8101, 144.9626] },
  { name: "Parliament", position: [-37.81123787494798, 144.97303582934072] },
  { name: "Richmond", position: [-37.82359625345165, 144.9891977969667] },
];

const NORTHERNGROUPLOOP_STATIONS: Station[] = [
  { name: "North Melbourne", position: [-37.8073, 144.9426] },
  { name: "Southern Cross", position: [-37.8176, 144.9522] },
  { name: "Flinders Street", position: [-37.8184161, 144.9664779] },
  { name: "Parliament", position: [-37.81123787494798, 144.97303582934072] },
  { name: "Melbourne Central", position: [-37.8101, 144.9626] },
  { name: "Flagstaff", position: [-37.81196029877101, 144.9566610145156] },
  { name: "North Melbourne", position: [-37.8073, 144.9426] },
];

const WERRIBEE_STATIONS: Station[] = [
  { name: "Southern Cross", position: [-37.81934099941143, 144.9524609650515] },
  { name: "North Melbourne", position: [-37.8073, 144.9426] },
  { name: "Footscray", position: [-37.801696124765726, 144.90150029345793] },
  { name: "Seddon", position: [-37.80864624508298, 144.89540631027074] },
  { name: "Yarraville", position: [-37.8159245612344, 144.88935190525294] },
  { name: "Spotswood", position: [-37.8290, 144.8865] },
  { name: "Newport", position: [-37.8426, 144.8833] },
  { name: "Laverton", position: [-37.8627, 144.7698] },
  { name: "Aircraft", position: [-37.8676, 144.7524] },
  { name: "Williams Landing", position: [-37.8643, 144.7393] },
  { name: "Hoppers Crossing", position: [-37.8820, 144.7006] },
  { name: "Werribee", position: [-37.8981, 144.6606] },
];

const WILLIAMSTOWN_STATIONS: Station[] = [
  { name: "Newport", position: [-37.8426, 144.8833] },
  { name: "North Williamstown", position: [-37.8573, 144.8872] },
  { name: "Williamstown Beach", position: [-37.8636, 144.8994] },
  { name: "Williamstown", position: [-37.8673, 144.9006] },
];

const ALTONA_LOOP_STATIONS: Station[] = [
  { name: "Newport", position: [-37.8426, 144.8833] },
  { name: "Seaholme", position: [-37.8645, 144.8454] },
  { name: "Altona", position: [-37.8673, 144.8305] },
  { name: "Westona", position: [-37.8660, 144.8135] },
  { name: "Laverton", position: [-37.8627, 144.7698] },
];

const SANDRINGHAM_STATIONS: Station[] = [
  { name: "Flinders Street", position: [-37.8184161, 144.9664779] },
  { name: "Richmond", position: [-37.82359625345165, 144.9891977969667] },
  {
    name: "South Yarra",
    position: [-37.8381009, 144.99237],
    staffed: true,
    barriers: true,
    metro: true,
    zone: "1",
  },
  {
    name: "Prahran",
    position: [-37.8518, 144.9932],
    staffed: false,
    barriers: false,
    metro: true,
    zone: "1",
  },
  {
    name: "Windsor",
    position: [-37.8561, 144.9924],
    staffed: false,
    barriers: false,
    metro: true,
    zone: "1",
  },
  {
    name: "Balaclava",
    position: [-37.8692, 144.9931],
    staffed: false,
    barriers: false,
    metro: true,
    zone: "1",
  },
  {
    name: "Ripponlea",
    position: [-37.8775, 144.9958],
    staffed: false,
    barriers: false,
    metro: true,
    zone: "1",
  },
  {
    name: "Elsternwick",
    position: [-37.8847, 144.9991],
    staffed: false,
    barriers: false,
    metro: true,
    zone: "1",
  },
  {
    name: "Gardenvale",
    position: [-37.9019, 145.0042],
    staffed: false,
    barriers: false,
    metro: true,
    zone: "1",
  },
  {
    name: "Brighton Beach",
    position: [-37.9269, 144.9992],
    staffed: false,
    barriers: false,
    metro: true,
    zone: "1",
  },
  {
    name: "Hampton",
    position: [-37.9378, 145.0028],
    staffed: false,
    barriers: false,
    metro: true,
    zone: "1",
  },
  {
    name: "Sandringham",
    position: [-37.9505, 145.0058],
    staffed: true,
    barriers: false,
    metro: true,
    zone: "1",
  },
];

// =========================
// Polyline Data
// =========================
const MELBOURNE_CENTRAL_TO_STATE_LIBRARY: [number, number][] = [
  [-37.8101, 144.9626],
  [-37.8117, 144.9629],
];

const CAUFIELD_LOOP: [number, number][] = [
  [-37.81934099941143, 144.9524609650515],
  [-37.81766430074989, 144.95108174796619],
  [-37.81602005179086, 144.94986938945834],
  [-37.81465546682327, 144.94969772810222],
  [-37.81335866395033, 144.9505774926714],
  [-37.81335215689385, 144.9507340157454],
  [-37.81196029877101, 144.9566610145156],
  [-37.8101, 144.9626],
  [-37.80792668206212, 144.96937976627547],
  [-37.808079259516454, 144.97045264993122],
  [-37.80890995342101, 144.97193322934783],
  [-37.81031702586954, 144.97240529813624],
  [-37.8147653441898, 144.97416778728817],
  [-37.815923183065, 144.97346658889202],
  [-37.81778485426324, 144.96826388056115],
  [-37.8184161, 144.9664779],
  [-37.819578159795725, 144.9610791331353],
  [-37.82104238088903, 144.95707972900598],
  [-37.8211906937223, 144.95500906362312],
  [-37.81973721503802, 144.95279892337976],
  [-37.81934099941143, 144.9524609650515],
];

const NORTHERN_LOOP: [number, number][] = [
  [-37.8073, 144.9426],
  [-37.81247065691958, 144.94693600775102],
  [-37.81335215689385, 144.9507340157454],
  [-37.81196029877101, 144.9566610145156],
  [-37.8101, 144.9626],
  [-37.80792668206212, 144.96937976627547],
  [-37.808079259516454, 144.97045264993122],
  [-37.80890995342101, 144.97193322934783],
  [-37.81031702586954, 144.97240529813624],
  [-37.8147653441898, 144.97416778728817],
  [-37.815923183065, 144.97346658889202],
  [-37.81778485426324, 144.96826388056115],
  [-37.8184161, 144.9664779],
  [-37.819578159795725, 144.9610791331353],
  [-37.82104238088903, 144.95707972900598],
  [-37.8211906937223, 144.95500906362312],
  [-37.81973721503802, 144.95279892337976],
  [-37.81934099941143, 144.9524609650515],
  [-37.8073, 144.9426],
];

const SANDRINGHAM_LINE: [number, number][] = [
  [-37.81934099941143, 144.9524609650515],
  [-37.81973721503802, 144.95279892337976],
  [-37.8211906937223, 144.95500906362312],
  [-37.82104238088903, 144.95707972900598],
  [-37.819578159795725, 144.9610791331353],
  [-37.8184161, 144.9664779],
  [-37.8205, 144.975],
  [-37.8225, 144.9825],
  [-37.82359625345165, 144.9891977969667],
  [-37.8295, 144.9915],
  [-37.8345, 144.9925],
  [-37.8381009, 144.99237],
  [-37.8518, 144.9932],
  [-37.8561, 144.9924],
  [-37.8692, 144.9931],
  [-37.8775, 144.9958],
  [-37.8847, 144.9991],
  [-37.9019, 145.0042],
  [-37.9269, 144.9992],
  [-37.9378, 145.0028],
  [-37.9505, 145.0058],
];

// =========================
// Derived Data
// =========================
const MERNDA_LINE = MERNDA_STATIONS.map((s) => s.position);
const HURSTBRIDGE_LINE = HURSTBRIDGE_STATIONS.map((s) => s.position);
const CLIFTONHILL_LOOP: [number, number][] = [
  [-37.7881, 145.0015], // Clifton Hill
  [-37.8000, 144.9950],
  [-37.8163, 144.9840], // Jolimont
  [-37.8184161, 144.9664779], // Flinders Street
  [-37.819578159795725, 144.9610791331353],
  [-37.82104238088903, 144.95707972900598],
  [-37.8211906937223, 144.95500906362312],
  [-37.81973721503802, 144.95279892337976],
  [-37.819330859301594, 144.95242620896954], // Southern Cross
  [-37.81766430074989, 144.95108174796619],
  [-37.81602005179086, 144.94986938945834],
  [-37.81465546682327, 144.94969772810222],
  [-37.81335866395033, 144.9505774926714],
  [-37.81335215689385, 144.9507340157454],
  [-37.81196029877101, 144.9566610145156], // Flagstaff
  [-37.8101, 144.9626], // Melbourne Central
  [-37.8085, 144.9685],
  [-37.81031702586954, 144.97240529813624], // Parliament
  [-37.8145, 144.9740],
  [-37.8163, 144.9840], // Jolimont
  [-37.8000, 144.9950],
  [-37.7881, 145.0015], // back
];const CRAIGIEBURN_LINE = CRAIGIEBURN_STATIONS.map((station) => station.position);
const UPFIELD_LINE = UPFIELD_STATIONS.map((station) => station.position);
const WERRIBEE_LINE = WERRIBEE_STATIONS.map((station) => station.position);
const WILLIAMSTOWN_LINE = WILLIAMSTOWN_STATIONS.map((station) => station.position);
const ALTONA_LOOP_LINE = ALTONA_LOOP_STATIONS.map((station) => station.position);
const FRANKSTON_LINE = FRANKSTON_STATIONS.map((station) => station.position);
const CRANBOURNE_LINE = CRANBOURNE_STATIONS.map((station) => station.position);
const PAKENHAM_LINE = PAKENHAM_STATIONS.map((station) => station.position);
const SUNBURY_LINE = SUNBURY_STATIONS.map((station) => station.position);
const LILYDALE_LINE = LILYDALE_STATIONS.map((station) => station.position);
const BELGRAVE_LINE = BELGRAVE_STATIONS.map((station) => station.position);
const ALAMEIN_LINE = ALAMEIN_STATIONS.map((station) => station.position);
const GLEN_WAVERLEY_LINE = GLEN_WAVERLEY_STATIONS.map((station) => station.position);
const METRO_TUNNEL_LINE = METRO_TUNNEL_STATIONS.map((station) => station.position);
export const ALL_STATIONS: Station[] = [
    ...CLIFTONHILLGROUPLOOP_STATIONS,
  ...MERNDA_STATIONS,
  ...HURSTBRIDGE_STATIONS,
  ...CAUFIELDLOOP_STATIONS,
  ...NORTHERNGROUPLOOP_STATIONS,
  ...BURNLEYGROUPLOOP_STATIONS,
  ...FRANKSTON_STATIONS,
  ...CRANBOURNE_STATIONS,
  ...PAKENHAM_STATIONS,
  ...SUNBURY_STATIONS,
  ...CRAIGIEBURN_STATIONS,
  ...UPFIELD_STATIONS,
  ...LILYDALE_STATIONS,
  ...BELGRAVE_STATIONS,
  ...ALAMEIN_STATIONS,
  ...GLEN_WAVERLEY_STATIONS,
  ...METRO_TUNNEL_STATIONS,
  ...SANDRINGHAM_STATIONS,
  ...WERRIBEE_STATIONS,
  ...WILLIAMSTOWN_STATIONS,
  ...ALTONA_LOOP_STATIONS,
].filter(
  (station, index, array) =>
    array.findIndex((item) => item.name === station.name) === index
);
export const LINES = {
  mernda: MERNDA_STATIONS,
  hurstbridge: HURSTBRIDGE_STATIONS,
  cliftonHillLoop: CLIFTONHILLGROUPLOOP_STATIONS,
  frankston: FRANKSTON_STATIONS,
  cranbourne: CRANBOURNE_STATIONS,
  pakenham: PAKENHAM_STATIONS,
  sunbury: SUNBURY_STATIONS,
  craigieburn: CRAIGIEBURN_STATIONS,
  upfield: UPFIELD_STATIONS,
  lilydale: LILYDALE_STATIONS,
  belgrave: BELGRAVE_STATIONS,
  alamein: ALAMEIN_STATIONS,
  glenWaverley: GLEN_WAVERLEY_STATIONS,
  metroTunnel: METRO_TUNNEL_STATIONS,
  sandringham: SANDRINGHAM_STATIONS,
  werribee: WERRIBEE_STATIONS,
  williamstown: WILLIAMSTOWN_STATIONS,
  altonaLoop: ALTONA_LOOP_STATIONS,
};
// =========================
// Helpers
// =========================
function getStationDetails(station: Station): string {
  const details: string[] = [];

  if (station.metro) details.push("Metro");
  if (station.vline) details.push("V/Line");
  if (typeof station.staffed === "boolean") {
    details.push(station.staffed ? "Staffed" : "Unstaffed");
  }
  if (typeof station.barriers === "boolean") {
    details.push(station.barriers ? "Myki barriers" : "No barriers");
  }
  if (station.zone) details.push(`Zone ${station.zone}`);

  return details.length ? details.join(" · ") : "Metro station";
}

function offsetPolylineCoordinates(
  coordinates: [number, number][],
  direction: "left" | "right" = "left",
  multiplier = 1
): [number, number][] {
  if (coordinates.length < 2) return coordinates;

  const offsetDistance = 0.0004 * multiplier;
  const sign = direction === "left" ? 1 : -1;

  return coordinates.map((coord, index) => {
    let perpendicular: [number, number] = [0, 0];

    if (index === 0) {
      const next = coordinates[1];
      const dx = next[1] - coord[1];
      const dy = next[0] - coord[0];
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      perpendicular = [-dy / len, dx / len];
    } else if (index === coordinates.length - 1) {
      const prev = coordinates[index - 1];
      const dx = coord[1] - prev[1];
      const dy = coord[0] - prev[0];
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      perpendicular = [-dy / len, dx / len];
    } else {
      const prev = coordinates[index - 1];
      const next = coordinates[index + 1];

      const dx1 = coord[1] - prev[1];
      const dy1 = coord[0] - prev[0];
      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
      const perp1: [number, number] = [-dy1 / len1, dx1 / len1];

      const dx2 = next[1] - coord[1];
      const dy2 = next[0] - coord[0];
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
      const perp2: [number, number] = [-dy2 / len2, dx2 / len2];

      perpendicular = [
        (perp1[0] + perp2[0]) / 2,
        (perp1[1] + perp2[1]) / 2,
      ];
    }

    return [
      coord[0] + perpendicular[0] * offsetDistance * sign,
      coord[1] + perpendicular[1] * offsetDistance * sign,
    ];
  });
}

function renderStationMarkers(
  stations: Station[],
  fillColor: string,
  strokeColor: string
) {
  return stations.map((station) => (
    <CircleMarker
      key={`${station.name}-${station.position[0]}-${station.position[1]}`}
      center={station.position}
      radius={5}
      pathOptions={{
        color: strokeColor,
        fillColor,
        fillOpacity: 1,
        weight: 2,
      }}
    >
      <Popup>
        <div className="p-3 w-48">
          <p className="font-semibold text-white">{station.name}</p>
          <p className="text-xs text-white/60 mt-1">
            {getStationDetails(station)}
          </p>
        </div>
      </Popup>
    </CircleMarker>
  ));
}

function createCustomIcon(report: Report) {
  const emoji = TRANSPORT_EMOJI[report.transportType] ?? "📍";
  const color = REPORT_COLOR[report.reportType] ?? "#6b7280";
  const isInspector = report.reportType === "inspector";

  const html = `
    <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
      ${
        isInspector
          ? `<div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.35;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>`
          : ""
      }
      <div style="
        width:36px;
        height:36px;
        border-radius:50%;
        background:${color};
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:18px;
        border:2px solid rgba(255,255,255,0.35);
        box-shadow:0 4px 14px rgba(0,0,0,0.6);
        position:relative;
        z-index:1;
      ">${emoji}</div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "bg-transparent border-none",
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
  });
}

// =========================
// Small Components
// =========================
function LocationCenterer({ loc }: { loc: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (loc) {
      map.setView(loc, 13, { animate: true });
    }
  }, [loc, map]);

  return null;
}

function LayerControl({
  layers,
  onChange,
}: {
  layers: LayerState;
  onChange: (key: keyof LayerState) => void;
}) {
  const [open, setOpen] = useState(false);

  const controls: {
    key: keyof LayerState;
    label: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    
    {
      key: "werribeeLine",
label: "Werribee / Williamstown / Altona",
      icon: <Train className="w-3.5 h-3.5" />,
      color: "#F178AF",
    },
    {
      key: "frankstonLine",
      label: "Frankston Line",
      icon: <Train className="w-3.5 h-3.5" />,
      color: "#22c55e",
    },
    {
  key: "merndaLine",
  label: "Mernda Line",
  icon: <Train className="w-3.5 h-3.5" />,
  color: "#BE1014",
},
{
  key: "hurstbridgeLine",
  label: "Hurstbridge Line",
  icon: <Train className="w-3.5 h-3.5" />,
  color: "#BE1014",
},
{
  key: "cliftonHillLoop",
  label: "Clifton Hill Loop",
  icon: <Train className="w-3.5 h-3.5" />,
  color: "#BE1014",
},
    {
      key: "cranbourneLine",
      label: "Cranbourne Line",
      icon: <Train className="w-3.5 h-3.5" />,
      color: "#279FD5",
    },
    {
      key: "pakenhamLine",
      label: "Pakenham Line",
      icon: <Train className="w-3.5 h-3.5" />,
      color: "#279FD5",
    },
    {
      key: "sunburyLine",
      label: "Sunbury Line",
      icon: <Train className="w-3.5 h-3.5" />,
      color: "#279FD5",
    },
    {
      key: "northernLoop",
      label: "Northern Loop",
      icon: <Train className="w-3.5 h-3.5" />,
      color: "#FFD200",
    },
    {
      key: "metroTunnel",
      label: "Metro Tunnel",
      icon: <Train className="w-3.5 h-3.5" />,
      color: "#279FD5",
    },
    {
      key: "sandringhamLine",
      label: "Sandringham Line",
      icon: <Train className="w-3.5 h-3.5" />,
      color: "#F178AF",
    },
    {
  key: "craigieburnLine",
  label: "Craigieburn Line",
  icon: <Train className="w-3.5 h-3.5" />,
  color: "#FFD200",
},
{
  key: "upfieldLine",
  label: "Upfield Line",
  icon: <Train className="w-3.5 h-3.5" />,
  color: "#FFD200",
},
{
  key: "lilydaleLine",
  label: "Lilydale Line",
  icon: <Train className="w-3.5 h-3.5" />,
  color: "#279FD5",
},
{
  key: "belgraveLine",
  label: "Belgrave Line",
  icon: <Train className="w-3.5 h-3.5" />,
  color: "#279FD5",
},
{
  key: "alameinLine",
  label: "Alamein Line",
  icon: <Train className="w-3.5 h-3.5" />,
  color: "#279FD5",
},
{
  key: "glenWaverleyLine",
  label: "Glen Waverley Line",
  icon: <Train className="w-3.5 h-3.5" />,
  color: "#279FD5",
},
{
  key: "burnleyLoop",
  label: "Burnley Loop",
  icon: <Train className="w-3.5 h-3.5" />,
  color: "#279FD5",
},
    {
      key: "inspectors",
      label: "Inspectors",
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      color: "#e11d48",
    },
    {
      key: "delays",
      label: "Delays",
      icon: <Clock className="w-3.5 h-3.5" />,
      color: "#f59e0b",
    },
    {
      key: "incidents",
      label: "Incidents",
      icon: <Info className="w-3.5 h-3.5" />,
      color: "#3b82f6",
    },
    {
      key: "heatCircles",
      label: "Hotspot Glow",
      icon: <MapPin className="w-3.5 h-3.5" />,
      color: "#f43f5e",
    },
  ];

  return (
    <div className="absolute top-20 right-3 z-[1000] flex flex-col items-end gap-2">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-10 h-10 rounded-full bg-gray-900/90 border border-white/10 shadow-xl flex items-center justify-center text-white hover:bg-gray-800 transition-colors"
        title="Map Layers"
      >
        <Layers className="w-5 h-5" />
      </button>

      {open && (
        <div className="bg-gray-900/95 border border-white/10 rounded-2xl p-3 shadow-2xl flex flex-col gap-1.5 min-w-[170px]">
          <p className="text-[10px] uppercase tracking-widest text-white/40 px-1 mb-1">
            Map Layers
          </p>

          {controls.map(({ key, label, icon, color }) => (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                layers[key]
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60 hover:bg-white/5"
              }`}
            >
              <span style={{ color: layers[key] ? color : undefined }}>
                {icon}
              </span>
              <span>{label}</span>
              <span className="ml-auto">
                {layers[key] ? (
                  <Eye className="w-3.5 h-3.5 text-white/50" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-white/20" />
                )}
              </span>
            </button>
          ))}

          <div className="border-t border-white/10 mt-1 pt-2">
            <p className="text-[10px] text-white/30 px-1">Filter by Transport</p>
            <div className="flex gap-1.5 mt-1.5 flex-wrap px-1">
              {Object.entries(TRANSPORT_EMOJI).map(([type, emoji]) => (
                <span
                  key={type}
                  title={type}
                  className="text-base cursor-default select-none"
                >
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================
// Main Component
// =========================
export function Map({ journeyRoute }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);

  const { data: consistData } = useGetConsistStatus("430M", {
    query: { refetchInterval: 10000 },
  });

  const { data } = useGetReports({
    query: { refetchInterval: 30000 },
  });

  const reports = Array.isArray(data) ? data : [];

  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
const [layers, setLayers] = useState<LayerState>({
  merndaLine: true,
  hurstbridgeLine: true,
  cliftonHillLoop: true,
  frankstonLine: true,
  cranbourneLine: true,
  pakenhamLine: true,
  sunburyLine: true,
  craigieburnLine: true,
  upfieldLine: true,
  lilydaleLine: true,
  belgraveLine: true,
  alameinLine: true,
  glenWaverleyLine: true,
  northernLoop: true,
  burnleyLoop: true,
  metroTunnel: true,
  werribeeLine: true,
  sandringhamLine: true,
  inspectors: true,
  delays: true,
  incidents: true,
  heatCircles: true,
});

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          setUserLoc([position.coords.latitude, position.coords.longitude]),
        () => setUserLoc(MELBOURNE_CENTER)
      );
    } else {
      setUserLoc(MELBOURNE_CENTER);
    }
  }, []);

  const toggleLayer = useCallback((key: keyof LayerState) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const visibleReports = reports.filter((report) => {
    if (report.reportType === "inspector" && !layers.inspectors) return false;
    if (report.reportType === "delay" && !layers.delays) return false;
    if (report.reportType === "incident" && !layers.incidents) return false;
    return true;
  });

  const inspectorReports = reports.filter(
    (report) => report.reportType === "inspector" && report.lat && report.lng
  );

  return (
    <div className="absolute inset-0 z-0">
      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        .leaflet-popup-content-wrapper {
          background: rgba(15,23,42,0.97) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 16px !important;
          color: white !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8) !important;
          padding: 0 !important;
        }

        .leaflet-popup-content {
          margin: 0 !important;
        }

        .leaflet-popup-tip {
          background: rgba(15,23,42,0.97) !important;
        }

        .leaflet-container {
          background: #0f172a;
        }

        .leaflet-control-zoom,
        .leaflet-control-attribution {
          display: none;
        }
      `}</style>

      <MapContainer
        center={MELBOURNE_CENTER}
        zoom={13}
        zoomControl={false}
        className="w-full h-full"
        style={{ background: "#0f172a" }}
        ref={(mapInstance) => {
          if (mapInstance) mapRef.current = mapInstance;
        }}
      >
        {consistData?.active && consistData.currentTrip?.estimatedPos && (
          <Marker
            position={consistData.currentTrip.estimatedPos as [number, number]}
            icon={L.divIcon({
              html: `
                <div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
                  <div style="position:absolute;inset:0;border-radius:50%;background:#3b82f6;opacity:0.2;animation:ping 2s infinite;"></div>
                  <div style="width:38px;height:38px;border-radius:12px;background:#1e293b;border:2px solid #3b82f6;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.5);position:relative;">
                    <span style="font-size:18px;">🚂</span>
                    <div style="position:absolute;top:-8px;right:-8px;background:#3b82f6;color:white;font-size:9px;font-weight:bold;padding:2px 4px;border-radius:4px;border:1px solid rgba(255,255,255,0.2);">430M</div>
                  </div>
                </div>
              `,
              className: "bg-transparent border-none",
              iconSize: [48, 48],
              iconAnchor: [24, 24],
            })}
          >
            <Popup>
              <div className="p-3 w-64">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                  <span className="text-xl">🚂</span>
                  <div>
                    <p className="font-bold text-white text-sm">Consist 430M</p>
                    <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">
                      Live Tracking
                    </p>
                  </div>
                  <div className="ml-auto bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    ACTIVE
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">
                      Current Trip
                    </p>
                    <p className="text-sm text-white/90 font-medium">
                      {consistData.currentTrip.route}
                    </p>
                    <p className="text-xs text-white/60">
                      to {consistData.currentTrip.destination}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">
                      Progress
                    </p>
                    <p className="text-xs text-blue-400 font-bold">
                      {Math.round(consistData.currentTrip.progress * 100)}%
                    </p>
                  </div>

                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-1000"
                      style={{ width: `${consistData.currentTrip.progress * 100}%` }}
                    />
                  </div>

                  {consistData.alerts.length > 0 && (
                    <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-[10px] text-yellow-500 font-bold flex items-center gap-1 uppercase tracking-wider">
                        <AlertTriangle className="w-3 h-3" />
                        Alert
                      </p>
                      <p className="text-[11px] text-yellow-200/80 leading-tight mt-1">
                        {consistData.alerts[0]}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='© <a href="https://carto.com">CARTO</a> © <a href="https://openstreetmap.org">OSM</a>'
          maxZoom={19}
        />

        {layers.frankstonLine && (
          <>
            <Polyline
              positions={offsetPolylineCoordinates(FRANKSTON_LINE, "left")}
              pathOptions={{ color: "#22c55e", weight: 5, opacity: 0.85 }}
            />
            <Polyline
              positions={offsetPolylineCoordinates(FRANKSTON_LINE, "right")}
              pathOptions={{ color: "#22c55e", weight: 5, opacity: 0.85 }}
            />
            {renderStationMarkers(FRANKSTON_STATIONS, "#22c55e", "#16a34a")}
          </>
        )}

        {layers.frankstonLine && (
          <>
            <Polyline
              positions={offsetPolylineCoordinates(CAUFIELD_LOOP, "left")}
              pathOptions={{ color: "#22c55e", weight: 5, opacity: 0.85 }}
            />
            {renderStationMarkers(CAUFIELDLOOP_STATIONS, "#22c55e", "#16a34a")}
          </>
        )}
{layers.merndaLine && (
  <>
    <Polyline
      positions={offsetPolylineCoordinates(MERNDA_LINE, "left", 0.5)}
      pathOptions={{ color: "#BE1014", weight: 5, opacity: 0.85 }}
    />
    <Polyline
      positions={offsetPolylineCoordinates(MERNDA_LINE, "right", 0.5)}
      pathOptions={{ color: "#BE1014", weight: 5, opacity: 0.85 }}
    />
    {renderStationMarkers(MERNDA_STATIONS, "#BE1014", "#c21875")}
  </>
)}

{layers.hurstbridgeLine && (
  <>
    <Polyline
      positions={offsetPolylineCoordinates(HURSTBRIDGE_LINE, "left", 0.45)}
      pathOptions={{ color: "#BE1014", weight: 5, opacity: 0.85 }}
    />
    <Polyline
      positions={offsetPolylineCoordinates(HURSTBRIDGE_LINE, "right", 0.45)}
      pathOptions={{ color: "#BE1014", weight: 5, opacity: 0.85 }}
    />
    {renderStationMarkers(HURSTBRIDGE_STATIONS, "#BE1014", "#BE1014")}
  </>
)}

{layers.cliftonHillLoop && (
  <>
    <Polyline
      positions={offsetPolylineCoordinates(CLIFTONHILL_LOOP, "left", 0.4)}
      pathOptions={{ color: "#BE1014", weight: 5, opacity: 0.85 }}
    />
    {renderStationMarkers(CLIFTONHILLGROUPLOOP_STATIONS, "#BE1014", "#BE1014")}
  </>
)}
{(layers.sunburyLine|| layers.craigieburnLine || layers.upfieldLine || layers.northernLoop) && (          <>
            <Polyline
              positions={offsetPolylineCoordinates(NORTHERN_LOOP, "right", 0.5)}
              pathOptions={{ color: "#FFD200", weight: 5, opacity: 0.85 }}
            />
            {renderStationMarkers(
              NORTHERNGROUPLOOP_STATIONS,
              "#FFD200",
              "#cca700"
            )}
          </>
        )}

        {(layers.lilydaleLine || layers.belgraveLine || layers.alameinLine || layers.glenWaverleyLine || layers.burnleyLoop) && (
  <>
    <Polyline
      positions={offsetPolylineCoordinates(BURNLEY_LOOP, "left", 0.45)}
      pathOptions={{ color: "#003A8F", weight: 5, opacity: 0.85 }}
    />
    {renderStationMarkers(BURNLEYGROUPLOOP_STATIONS, "#003A8F", "#003A8F")}
  </>
)}
{layers.lilydaleLine && (
  <>
    <Polyline
      positions={offsetPolylineCoordinates(LILYDALE_LINE, "left", 0.5)}
      pathOptions={{
        color: "#003A8F",
        weight: 5,
        opacity: 0.85,
      }}
    />
    <Polyline
      positions={offsetPolylineCoordinates(LILYDALE_LINE, "right", 0.5)}
      pathOptions={{
        color: "#003A8F",
        weight: 5,
        opacity: 0.85,
      }}
    />
    {renderStationMarkers(LILYDALE_STATIONS, "#003A8F", "#003A8F")}
  </>
)}

{layers.belgraveLine && (
  <>
    <Polyline
      positions={offsetPolylineCoordinates(BELGRAVE_LINE, "left", 0.45)}
      pathOptions={{
        color: "#003A8F",
        weight: 5,
        opacity: 0.85,
      }}
    />
    <Polyline
      positions={offsetPolylineCoordinates(BELGRAVE_LINE, "right", 0.45)}
      pathOptions={{
        color: "#003A8F",
        weight: 5,
        opacity: 0.85,
      }}
    />
    {renderStationMarkers(BELGRAVE_STATIONS, "#003A8F", "#003A8F")}
  </>
)}

{layers.alameinLine && (
  <>
    <Polyline
      positions={offsetPolylineCoordinates(ALAMEIN_LINE, "left", 0.3)}
      pathOptions={{
        color: "#003A8F",
        weight: 5,
        opacity: 0.85,
      }}
    />
    <Polyline
      positions={offsetPolylineCoordinates(ALAMEIN_LINE, "right", 0.3)}
      pathOptions={{
        color: "#003A8F",
        weight: 5,
        opacity: 0.85,
      }}
    />
    {renderStationMarkers(ALAMEIN_STATIONS, "#003A8F", "#003A8F")}
  </>
)}

{layers.glenWaverleyLine && (
  <>
    <Polyline
      positions={offsetPolylineCoordinates(GLEN_WAVERLEY_LINE, "left", 0.35)}
      pathOptions={{
        color: "#003A8F",
        weight: 5,
        opacity: 0.85,
      }}
    />
    <Polyline
      positions={offsetPolylineCoordinates(GLEN_WAVERLEY_LINE, "right", 0.35)}
      pathOptions={{
        color: "#003A8F",
        weight: 5,
        opacity: 0.85,
      }}
    />
    {renderStationMarkers(GLEN_WAVERLEY_STATIONS, "#003A8F", "#003A8F")}
  </>
)}
{layers.craigieburnLine && (
  <>
    <Polyline
      positions={offsetPolylineCoordinates(CRAIGIEBURN_LINE, "left", 0.55)}
      pathOptions={{
        color: "#FFD200",
        weight: 5,
        opacity: 0.85,
      }}
    />
    <Polyline
      positions={offsetPolylineCoordinates(CRAIGIEBURN_LINE, "right", 0.55)}
      pathOptions={{
        color: "#FFD200",
        weight: 5,
        opacity: 0.85,
      }}
    />
    {renderStationMarkers(CRAIGIEBURN_STATIONS, "#FFD200", "#cca700")}
  </>
)}

{layers.upfieldLine && (
  <>
    <Polyline
      positions={offsetPolylineCoordinates(UPFIELD_LINE, "left", 0.45)}
      pathOptions={{
        color: "#FFD200",
        weight: 5,
        opacity: 0.85,
      }}
    />
    <Polyline
      positions={offsetPolylineCoordinates(UPFIELD_LINE, "right", 0.45)}
      pathOptions={{
        color: "#FFD200",
        weight: 5,
        opacity: 0.85,
      }}
    />
    {renderStationMarkers(UPFIELD_STATIONS, "#FFD200", "#cca700")}
  </>
)}
        {layers.cranbourneLine && (
          <>
            <Polyline
              positions={offsetPolylineCoordinates(CRANBOURNE_LINE, "left", 0.6)}
              pathOptions={{ color: "#279FD5", weight: 5, opacity: 0.85 }}
            />
            <Polyline
              positions={offsetPolylineCoordinates(
                CRANBOURNE_LINE,
                "right",
                0.6
              )}
              pathOptions={{ color: "#279FD5", weight: 5, opacity: 0.85 }}
            />
            {renderStationMarkers(CRANBOURNE_STATIONS, "#279FD5", "#1e7ba8")}
          </>
        )}

        {layers.pakenhamLine && (
          <>
            <Polyline
              positions={offsetPolylineCoordinates(PAKENHAM_LINE, "left", 0.6)}
              pathOptions={{ color: "#279FD5", weight: 5, opacity: 0.85 }}
            />
            <Polyline
              positions={offsetPolylineCoordinates(PAKENHAM_LINE, "right", 0.6)}
              pathOptions={{ color: "#279FD5", weight: 5, opacity: 0.85 }}
            />
            {renderStationMarkers(PAKENHAM_STATIONS, "#279FD5", "#1e7ba8")}
          </>
        )}

        {layers.sunburyLine && (
          <>
            <Polyline
              positions={offsetPolylineCoordinates(SUNBURY_LINE, "left", 0.6)}
              pathOptions={{ color: "#279FD5", weight: 5, opacity: 0.85 }}
            />
            <Polyline
              positions={offsetPolylineCoordinates(SUNBURY_LINE, "right", 0.6)}
              pathOptions={{ color: "#279FD5", weight: 5, opacity: 0.85 }}
            />
            {renderStationMarkers(SUNBURY_STATIONS, "#279FD5", "#1e7ba8")}
          </>
        )}

        {layers.metroTunnel && (
          <>
            <Polyline
              positions={METRO_TUNNEL_LINE}
              pathOptions={{ color: "#279FD5", weight: 5, opacity: 0.85 }}
            />
            <Polyline
              positions={MELBOURNE_CENTRAL_TO_STATE_LIBRARY}
              pathOptions={{
                color: "#279FD5",
                weight: 3,
                opacity: 0.65,
                dashArray: "8, 6",
              }}
            />
            {renderStationMarkers(METRO_TUNNEL_STATIONS, "#279FD5", "#1e7ba8")}
          </>
        )}
{layers.werribeeLine && (
  <>
    {/* Werribee main line */}
    <Polyline
      positions={offsetPolylineCoordinates(WERRIBEE_LINE, "left", 0.5)}
      pathOptions={{
        color: "#F178AF",
        weight: 5,
        opacity: 0.85,
      }}
    />


    {/* Williamstown branch */}
    <Polyline
      positions={offsetPolylineCoordinates(WILLIAMSTOWN_LINE, "left", 0.35)}
      pathOptions={{
        color: "#F178AF",
        weight: 5,
        opacity: 0.85,
      }}
    />
    <Polyline
      positions={offsetPolylineCoordinates(WILLIAMSTOWN_LINE, "right", 0.35)}
      pathOptions={{
        color: "#F178AF",
        weight: 5,
        opacity: 0.85,
      }}
    />

    {/* Altona loop branch */}
    <Polyline
      positions={offsetPolylineCoordinates(ALTONA_LOOP_LINE, "left", 0.35)}
      pathOptions={{
        color: "#F178AF",
        weight: 5,
        opacity: 0.85,
      }}
    />
    <Polyline
      positions={offsetPolylineCoordinates(ALTONA_LOOP_LINE, "right", 0.35)}
      pathOptions={{
        color: "#F178AF",
        weight: 5,
        opacity: 0.85,
      }}
    />

    {renderStationMarkers(WERRIBEE_STATIONS, "#F178AF", "#9f5d7c")}
    {renderStationMarkers(WILLIAMSTOWN_STATIONS, "#F178AF", "#9f5d7c")}
    {renderStationMarkers(ALTONA_LOOP_STATIONS, "#F178AF", "#9f5d7c")}
  </>
)}
        {layers.sandringhamLine && (
          <>
            <Polyline
              positions={offsetPolylineCoordinates(
                SANDRINGHAM_LINE,
                "right",
                0.5
              )}
              pathOptions={{ color: "#F178AF", weight: 5, opacity: 0.85 }}
            />
            {renderStationMarkers(SANDRINGHAM_STATIONS, "#F178AF", "#9f5d7c")}
          </>
        )}

        {journeyRoute && journeyRoute.length > 1 && (
          <>
            <Polyline
              positions={journeyRoute.map((station) => station.position)}
              pathOptions={{
                color: "#facc15",
                weight: 6,
                opacity: 0.95,
                dashArray: "8 6",
              }}
            />

            {[journeyRoute[0], journeyRoute[journeyRoute.length - 1]].map(
              (station, index) => (
                <CircleMarker
                  key={`journey-${station.name}-${index}`}
                  center={station.position}
                  radius={8}
                  pathOptions={{
                    color: "#f59e0b",
                    fillColor: index === 0 ? "#fb923c" : "#facc15",
                    fillOpacity: 1,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="p-3 w-48">
                      <p className="font-semibold text-white">
                        {index === 0 ? "Origin" : "Destination"}
                      </p>
                      <p className="text-xs text-white/60 mt-1">{station.name}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            )}
          </>
        )}

        {layers.heatCircles &&
          inspectorReports.map((report) => (
            <Circle
              key={`heat-${report.id}`}
              center={[report.lat!, report.lng!]}
              radius={600}
              pathOptions={{
                color: "transparent",
                fillColor: "#e11d48",
                fillOpacity: 0.12,
              }}
            />
          ))}

        {userLoc && (
          <Circle
            center={userLoc}
            radius={80}
            pathOptions={{
              color: "#60a5fa",
              fillColor: "#3b82f6",
              fillOpacity: 0.7,
              weight: 2,
            }}
          />
        )}

        {userLoc && <LocationCenterer loc={userLoc} />}

        {visibleReports.map((report) => {
          if (!report.lat || !report.lng) return null;

          return (
            <Marker
              key={report.id}
              position={[report.lat, report.lng]}
              icon={createCustomIcon(report)}
            >
              <Popup>
                <div className="p-4 w-64">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                    <span className="text-2xl">
                      {TRANSPORT_EMOJI[report.transportType]}
                    </span>
                    <div>
                      <p className="font-bold text-white text-sm capitalize">
                        {REPORT_LABEL[report.reportType]}
                      </p>
                      <p className="text-[11px] text-white/40">
                        {formatDistanceToNow(new Date(report.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <span
                      className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                      style={{
                        background: `${REPORT_COLOR[report.reportType]}33`,
                        color: REPORT_COLOR[report.reportType],
                      }}
                    >
                      {report.transportType}
                    </span>
                  </div>

                  {(report.lineNumber || report.direction) && (
                    <div className="flex items-center gap-2 mb-2">
                      {report.lineNumber && (
                        <span className="bg-white/10 text-white text-xs font-bold px-2 py-1 rounded-lg">
                          Line {report.lineNumber}
                        </span>
                      )}
                      {report.direction && report.direction !== "unknown" && (
                        <span className="text-xs text-white/60">
                          {DIRECTION_LABEL[report.direction]}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mb-2">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">
                      Location
                    </p>
                    <p className="text-sm text-white/90 font-medium">
                      {report.locationName}
                    </p>
                  </div>

                  {report.notes && (
                    <div className="bg-white/5 border border-white/5 rounded-xl p-2 text-xs text-white/70 italic mb-2">
                      "{report.notes}"
                    </div>
                  )}

                  <p className="text-right text-[10px] text-white/30">
                    by{" "}
                    <span className="text-white/50 font-medium">
                      {report.username}
                    </span>
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <LayerControl layers={layers} onChange={toggleLayer} />

      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 flex flex-col gap-2 z-[1000]">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-2 backdrop-blur-sm transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-white" />
        </button>

        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-2 backdrop-blur-sm transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-white" />
        </button>

        <button
          onClick={() => {
            if (userLoc && mapRef.current) {
              mapRef.current.setView(userLoc, mapRef.current.getZoom());
            }
          }}
          className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-2 backdrop-blur-sm transition-colors"
          title="Center on Location"
        >
          <Navigation className="w-4 h-4 text-white" />
        </button>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => toggleLayer("metroTunnel")}
            className={`border rounded-lg p-2 backdrop-blur-sm transition-colors ${
              layers.metroTunnel
                ? "bg-blue-500/30 border-blue-400/50 hover:bg-blue-500/40"
                : "bg-white/10 border-white/20 hover:bg-white/20"
            }`}
            title="Toggle Metro Tunnel (blue line only)"
          >
            {layers.metroTunnel ? (
              <Eye className="w-4 h-4 text-blue-300" />
            ) : (
              <EyeOff className="w-4 h-4 text-white/50" />
            )}
          </button>
          <span className="text-[10px] text-white/60">Blue Metro Tunnel</span>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(10,10,20,0.7)] z-[500]" />
    </div>
  );
}