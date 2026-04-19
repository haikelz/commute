export type KrlStation = {
  sta_id: string;
  sta_name: string;
  group_wil: number;
  fg_enable: number;
};

export type KrlApiListResponse<T> = {
  status: number;
  message?: string;
  data: T;
};

export type KrlScheduleItem = {
  train_id: string;
  ka_name: string;
  route_name: string;
  dest: string;
  time_est: string;
  color: string;
  dest_time: string;
};

export type KrlTrainStop = {
  train_id: string;
  ka_name: string;
  station_id: string;
  station_name: string;
  time_est: string;
  transit_station: boolean;
  color: string;
  transit: string;
};

export type KrlFareItem = {
  sta_code_from: string;
  sta_name_from: string;
  sta_code_to: string;
  sta_name_to: string;
  fare: number;
  distance: string;
};
