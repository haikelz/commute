import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VirtualStationList } from "@/components/ui/virtual-station-list";
import { cn } from "@/lib/cn";
import {
  fetchSchedules,
  fetchStations,
  fetchTrainDetail,
} from "@/lib/krl-client";
import { selectedStationIdAtom, stationSearchAtom } from "@/store/krl-atoms";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";

const STATIONS_STALE_MS = 1000 * 60 * 30;
const SCHEDULES_STALE_MS = 1000 * 60;

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const value = `${i.toString().padStart(2, "0")}:00`;
  return { value, label: value };
});

function formatTime(iso: string) {
  const p = iso.split(":");
  if (p.length >= 2) return `${p[0]}:${p[1]}`;
  return iso;
}

export function KrlSchedule() {
  const [selectedId, setSelectedId] = useAtom(selectedStationIdAtom);
  const [search, setSearch] = useAtom(stationSearchAtom);
  const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null);
  const [selectedTimeFrom, setSelectedTimeFrom] = useState<string>("00:00");
  const [selectedTimeTo, setSelectedTimeTo] = useState<string>("23:00");

  const stationsQ = useQuery({
    queryKey: ["krl-stations"],
    queryFn: fetchStations,
    staleTime: STATIONS_STALE_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: keepPreviousData,
  });

  const schedulesQ = useQuery({
    queryKey: ["krl-schedules", selectedId, selectedTimeFrom, selectedTimeTo],
    queryFn: () =>
      fetchSchedules(selectedId!, selectedTimeFrom, selectedTimeTo),
    enabled:
      Boolean(selectedId) &&
      Boolean(selectedTimeFrom) &&
      Boolean(selectedTimeTo),
    staleTime: SCHEDULES_STALE_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: keepPreviousData,
  });

  const trainDetailQ = useQuery({
    queryKey: ["krl-train-detail", selectedTrainId],
    queryFn: () => fetchTrainDetail(selectedTrainId!),
    enabled: Boolean(selectedTrainId),
    staleTime: SCHEDULES_STALE_MS * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: keepPreviousData,
  });

  const filteredStations = useMemo(() => {
    const list = stationsQ.data ?? [];
    const q = search.trim().toLowerCase();

    if (!q) return list;

    return list.filter(
      (s) =>
        s.sta_name.toLowerCase().includes(q) ||
        s.sta_id.toLowerCase().includes(q)
    );
  }, [stationsQ.data, search]);

  useEffect(() => {
    if (!selectedTrainId) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedTrainId(null);
    }

    document.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [selectedTrainId]);

  const selectedName = stationsQ.data?.find(
    (s) => s.sta_id === selectedId
  )?.sta_name;

  function resetTime() {
    setSelectedTimeFrom("00:00");
    setSelectedTimeTo("23:00");
  }

  return (
    <>
      <header className="mb-10 text-center">
        <motion.h1
          className="text-balance bg-linear-to-br from-white via-zinc-100 to-zinc-400 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          Jadwal Commuter Line
        </motion.h1>
        <p className="mt-2 text-sm text-zinc-400">
          Cari dan pilih stasiun untuk memuat jadwal keberangkatan
        </p>
      </header>

      <motion.section
        className="rounded-2xl border border-white/10 bg-white/4 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-xl sm:p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
      >
        <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
          Stasiun
        </label>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau kode stasiun…"
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-100 outline-none ring-0 placeholder:text-zinc-600 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20"
        />
        <div className="mt-3">
          {stationsQ.isLoading && (
            <div className="flex h-44 items-center justify-center rounded-xl border border-white/5 bg-black/20">
              <p className="text-sm text-zinc-500">Memuat daftar stasiun…</p>
            </div>
          )}
          {stationsQ.isError && (
            <div className="flex h-44 items-center justify-center rounded-xl border border-white/5 bg-black/20">
              <p className="px-4 text-center text-sm text-red-400">
                Gagal memuat stasiun. Coba lagi.
              </p>
            </div>
          )}
          {stationsQ.data && (
            <VirtualStationList
              stations={filteredStations}
              selectedId={selectedId}
              onSelect={setSelectedId}
              scrollHeightClass="h-44"
              emptyText="Tidak ada stasiun yang cocok."
            />
          )}
        </div>
      </motion.section>

      <motion.section
        className="mt-6 rounded-2xl border border-white/10 bg-white/4 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-xl sm:p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-medium text-white">Keberangkatan</h2>
            {selectedId && selectedName ? (
              <p className="text-sm text-zinc-400">
                {selectedName}
                <span className="ml-2 font-mono text-zinc-500">
                  ({selectedId})
                </span>
              </p>
            ) : (
              <p className="text-sm text-zinc-500">Belum memilih stasiun</p>
            )}
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
            <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-3">
              <div className="space-y-1.5">
                <span
                  className="text-xs font-medium leading-none text-zinc-500"
                  id="time-from-label"
                >
                  Dari
                </span>
                <Select
                  value={selectedTimeFrom}
                  onValueChange={setSelectedTimeFrom}
                >
                  <SelectTrigger
                    aria-labelledby="time-from-label"
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOUR_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <span
                  className="text-xs font-medium leading-none text-zinc-500"
                  id="time-to-label"
                >
                  Sampai
                </span>
                <Select
                  value={selectedTimeTo}
                  onValueChange={setSelectedTimeTo}
                >
                  <SelectTrigger
                    aria-labelledby="time-to-label"
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOUR_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-transparent px-4 text-sm font-medium text-zinc-200 shadow-sm outline-none transition-colors hover:bg-white/5 focus-visible:border-fuchsia-500/50 focus-visible:ring-2 focus-visible:ring-fuchsia-500/20"
              onClick={resetTime}
            >
              Reset
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!selectedId && (
            <motion.p
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-10 text-center text-sm leading-relaxed text-zinc-500"
            >
              Belum ada data jadwal. Gunakan kolom pencarian stasiun di atas,
              lalu pilih stasiun untuk menampilkan keberangkatan.
            </motion.p>
          )}
          {selectedId && schedulesQ.isLoading && (
            <motion.p
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center text-sm text-zinc-500"
            >
              Memuat jadwal…
            </motion.p>
          )}
          {selectedId && schedulesQ.isError && (
            <motion.p
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-8 text-center text-sm text-red-400"
            >
              Gagal memuat jadwal.
            </motion.p>
          )}
          {selectedId &&
            schedulesQ.data &&
            schedulesQ.data.length === 0 &&
            !schedulesQ.isLoading && (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 text-center text-sm text-zinc-500"
              >
                Tidak ada jadwal untuk rentang waktu ini.
              </motion.p>
            )}
        </AnimatePresence>

        {selectedId && schedulesQ.data && schedulesQ.data.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-black/30 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-3 py-3">Waktu</th>
                  <th className="px-3 py-3">KA</th>
                  <th className="px-3 py-3">Tujuan</th>
                  <th className="px-3 py-3 hidden sm:table-cell">Rute</th>
                  <th className="px-3 py-3 hidden md:table-cell">
                    Tiba tujuan
                  </th>
                </tr>
              </thead>
              <tbody>
                {schedulesQ.data.map((row, i) => {
                  const active = selectedTrainId === row.train_id;
                  return (
                    <motion.tr
                      key={`${row.train_id}-${row.time_est}-${i}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedTrainId(row.train_id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedTrainId(row.train_id);
                        }
                      }}
                      className={cn(
                        "cursor-pointer border-b border-white/5 bg-black/10 transition-colors",
                        active && "bg-fuchsia-500/10"
                      )}
                      style={{
                        borderLeftWidth: 3,
                        borderLeftColor: row.color || "#E30A16",
                      }}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.012, 0.4) }}
                    >
                      <td className="px-3 py-2.5 font-mono text-zinc-100">
                        {formatTime(row.time_est)}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-300">
                        {row.train_id}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-white">
                        {row.dest}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-500 hidden sm:table-cell">
                        {row.route_name}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-zinc-400 hidden md:table-cell">
                        {formatTime(row.dest_time)}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

      <AnimatePresence>
        {selectedTrainId ? (
          <motion.div
            key="train-detail-dialog"
            className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              aria-label="Tutup dialog"
              onClick={() => setSelectedTrainId(null)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="train-detail-title"
              className="relative z-10 flex max-h-[min(85vh,720px)] w-full max-w-2xl flex-col rounded-2xl border border-white/15 bg-zinc-950/95 p-5 shadow-2xl shadow-black/50 sm:p-6"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h2
                    id="train-detail-title"
                    className="text-lg font-medium text-white"
                  >
                    Detail rangkaian
                  </h2>
                  <p className="font-mono text-sm text-fuchsia-400/90">
                    {selectedTrainId}
                  </p>
                  {trainDetailQ.data?.[0]?.ka_name && (
                    <p className="mt-1 text-sm text-zinc-400">
                      {trainDetailQ.data[0].ka_name}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTrainId(null)}
                  className="rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/10"
                >
                  Tutup
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
                {trainDetailQ.isLoading && (
                  <p className="py-8 text-center text-sm text-zinc-500">
                    Memuat rute per stasiun…
                  </p>
                )}
                {trainDetailQ.isError && (
                  <p className="py-8 text-center text-sm text-red-400">
                    Gagal memuat detail kereta.
                  </p>
                )}
                {trainDetailQ.data && trainDetailQ.data.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-white/5">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-black/30 text-xs uppercase tracking-wider text-zinc-500">
                          <th className="px-3 py-3">Urutan</th>
                          <th className="px-3 py-3">Waktu</th>
                          <th className="px-3 py-3">Stasiun</th>
                          <th className="px-3 py-3 hidden sm:table-cell">
                            Kode
                          </th>
                          <th className="px-3 py-3">Transit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trainDetailQ.data.map((stop, j) => (
                          <tr
                            key={`${stop.station_id}-${stop.time_est}-${j}`}
                            className="border-b border-white/5 bg-black/10"
                            style={{
                              borderLeftWidth: 3,
                              borderLeftColor: stop.color || "#E30A16",
                            }}
                          >
                            <td className="px-3 py-2.5 text-zinc-500">
                              {j + 1}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-zinc-100">
                              {formatTime(stop.time_est)}
                            </td>
                            <td className="px-3 py-2.5 font-medium text-white">
                              {stop.station_name}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-xs text-zinc-500 hidden sm:table-cell">
                              {stop.station_id}
                            </td>
                            <td className="px-3 py-2.5 text-zinc-400">
                              {stop.transit_station ? (
                                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200">
                                  Ya
                                </span>
                              ) : (
                                <span className="text-zinc-600">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {trainDetailQ.data &&
                  trainDetailQ.data.length === 0 &&
                  !trainDetailQ.isLoading && (
                    <p className="py-8 text-center text-sm text-zinc-500">
                      Tidak ada data rute.
                    </p>
                  )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
