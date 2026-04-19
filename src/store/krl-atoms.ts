import { atom } from "jotai";

export const selectedStationIdAtom = atom<string | null>(null);

export const stationSearchAtom = atom("");
