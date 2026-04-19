export type TransjakartaFacility = {
  name: string;
  title: string;
  icon: string;
  icon_dark: string;
};

export type TransjakartaRouteSummary = {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_desc: string;
  route_type: number;
  route_color: string;
  route_text_color: string;
  price: number;
  trip_ids: string[];
  facilities: TransjakartaFacility[];
};

export type TransjakartaRouteRef = {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_color: string;
  route_text_color: string;
  route_desc: string;
};

export type TransjakartaStop = {
  stop_id: string;
  platform_code: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  bus_stop_type: string;
  distance?: number;
  facilities: string[];
  routes: TransjakartaRouteRef[];
  v2_facilities: TransjakartaFacility[];
};

export type TransjakartaDirectionDetail = {
  trip_id: string;
  headsign: string;
  stops: TransjakartaStop[];
  polyline?: string;
};

export type TransjakartaRouteDetailPayload = {
  route: TransjakartaRouteSummary & {
    start_time?: string;
    end_time?: string;
    operational_days?: Record<string, boolean> | null;
  };
  facilities: TransjakartaFacility[];
  inbound: TransjakartaDirectionDetail | null;
  outbound: TransjakartaDirectionDetail | null;
};

export type TransjakartaListEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

export type TransjakartaDetailEnvelope = {
  code: number;
  message: string;
  data: TransjakartaRouteDetailPayload;
};

export type TransjakartaLocEventPayload = {
  latitude: number;
  longitude: number;
  radius: number;
  event: string;
};

export type TransjakartaBusOfflineItem = {
  bus_body_no: string;
  route_code: string;
  route_name: string;
  route_color: string;
  latitude: number;
  longitude: number;
  speed: number;
  bearing: number;
  timestamp: string;
  trip_id: string;
  direction: string;
  distance: number;
  route_text_color: string;
  type: string;
  stops: unknown[];
  trip_headsign: string;
  estimated_time_next_stops: number;
  estimated_distance_next_stops: number;
  curr_stops: string;
  next_stops: string;
  prev_stops: string;
  livery: unknown | null;
};

export type TransjakartaBusLivePayload = {
  buses: unknown[];
  session_id: string;
  polyline: string;
  stops: unknown[];
  topics: string[];
};

export type TransjakartaBusOfflineEnvelope = {
  code: number;
  message: string;
  data: TransjakartaBusOfflineItem[];
};

export type TransjakartaBusLiveEnvelope = {
  code: number;
  message: string;
  session_id?: string;
  data: TransjakartaBusLivePayload;
};
