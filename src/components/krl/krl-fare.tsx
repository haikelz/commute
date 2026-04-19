import { VirtualStationList } from "@/components/ui/virtual-station-list";
import { cn } from "@/lib/cn";
import { fetchFare, fetchStations } from "@/lib/krl-client";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

export function KrlFare() {
  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");

  const stationsQ = useQuery({
    queryKey: ["krl-stations"],
    queryFn: fetchStations,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: keepPreviousData,
  });

  const fareMut = useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) =>
      fetchFare(from, to),
  });

  const list = stationsQ.data ?? [];

  const filteredFrom = useMemo(() => {
    const q = searchFrom.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.sta_name.toLowerCase().includes(q) ||
        s.sta_id.toLowerCase().includes(q)
    );
  }, [list, searchFrom]);

  const filteredTo = useMemo(() => {
    const q = searchTo.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.sta_name.toLowerCase().includes(q) ||
        s.sta_id.toLowerCase().includes(q)
    );
  }, [list, searchTo]);

  const fromName = list.find((s) => s.sta_id === fromId)?.sta_name;
  const toName = list.find((s) => s.sta_id === toId)?.sta_name;
  const canSubmit =
    Boolean(fromId) && Boolean(toId) && fromId !== toId && !fareMut.isPending;

  return (
    <>
      <header className="mb-10 text-center">
        <motion.h1
          className="text-balance bg-linear-to-br from-white via-zinc-100 to-zinc-400 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          Biaya perjalanan KRL
        </motion.h1>
        <p className="mt-2 text-sm text-zinc-400">
          Pilih stasiun asal dan tujuan, lalu ketuk Cek tarif.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.section
          className="rounded-2xl border border-white/10 bg-white/4 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-xl sm:p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Stasiun asal
          </label>
          <input
            type="search"
            value={searchFrom}
            onChange={(e) => setSearchFrom(e.target.value)}
            placeholder="Cari stasiun asal…"
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20"
          />
          <div className="mt-3">
            {stationsQ.isLoading && (
              <div className="flex h-40 items-center justify-center rounded-xl border border-white/5 bg-black/20">
                <p className="text-sm text-zinc-500">Memuat stasiun…</p>
              </div>
            )}
            {stationsQ.isError && (
              <div className="flex h-40 items-center justify-center rounded-xl border border-white/5 bg-black/20">
                <p className="px-4 text-center text-sm text-red-400">
                  Gagal memuat stasiun. Coba lagi.
                </p>
              </div>
            )}
            {stationsQ.data && (
              <VirtualStationList
                stations={filteredFrom}
                selectedId={fromId}
                onSelect={setFromId}
                scrollHeightClass="h-40"
                emptyText="Tidak ada stasiun."
              />
            )}
          </div>
        </motion.section>

        <motion.section
          className="rounded-2xl border border-white/10 bg-white/4 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-xl sm:p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Stasiun tujuan
          </label>
          <input
            type="search"
            value={searchTo}
            onChange={(e) => setSearchTo(e.target.value)}
            placeholder="Cari stasiun tujuan…"
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20"
          />
          <div className="mt-3">
            {stationsQ.isLoading && (
              <div className="flex h-40 items-center justify-center rounded-xl border border-white/5 bg-black/20">
                <p className="text-sm text-zinc-500">Memuat stasiun…</p>
              </div>
            )}
            {stationsQ.isError && (
              <div className="flex h-40 items-center justify-center rounded-xl border border-white/5 bg-black/20">
                <p className="px-4 text-center text-sm text-red-400">
                  Gagal memuat stasiun. Coba lagi.
                </p>
              </div>
            )}
            {stationsQ.data && (
              <VirtualStationList
                stations={filteredTo}
                selectedId={toId}
                onSelect={setToId}
                scrollHeightClass="h-40"
                emptyText="Tidak ada stasiun."
              />
            )}
          </div>
        </motion.section>
      </div>

      <motion.section
        className="mt-6 rounded-2xl border border-white/10 bg-white/4 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-xl sm:p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-zinc-400">
            {fromId && toId && fromId !== toId && (
              <p>
                <span className="text-zinc-300">{fromName}</span>
                <span className="mx-2 text-zinc-600">→</span>
                <span className="text-zinc-300">{toName}</span>
              </p>
            )}
            {fromId && toId && fromId === toId && (
              <p className="text-amber-400/90">
                Pilih stasiun asal dan tujuan yang berbeda.
              </p>
            )}
            {!fromId || !toId ? (
              <p>Pilih asal dan tujuan untuk melanjutkan.</p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              if (fromId && toId && fromId !== toId) {
                fareMut.mutate({ from: fromId, to: toId });
              }
            }}
            className={cn(
              "shrink-0 rounded-xl px-6 py-3 text-sm font-medium transition-colors",
              canSubmit
                ? "bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                : "cursor-not-allowed bg-zinc-800 text-zinc-500"
            )}
          >
            {fareMut.isPending ? "Memuat…" : "Cek tarif"}
          </button>
        </div>

        {fareMut.isError && (
          <p className="mt-6 text-center text-sm text-red-400">
            Gagal mengambil tarif. Periksa koneksi atau coba lagi.
          </p>
        )}

        {fareMut.isSuccess && fareMut.data && fareMut.data.length > 0 && (
          <div className="mt-6 overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-black/30 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3">Rute</th>
                  <th className="px-4 py-3">Jarak (km)</th>
                  <th className="px-4 py-3">Tarif</th>
                </tr>
              </thead>
              <tbody>
                {fareMut.data.map((row) => (
                  <tr
                    key={`${row.sta_code_from}-${row.sta_code_to}`}
                    className="border-b border-white/5 bg-black/10"
                  >
                    <td className="px-4 py-3 text-zinc-200">
                      {row.sta_name_from}{" "}
                      <span className="text-zinc-600">→</span> {row.sta_name_to}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-400">
                      {row.distance}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {idr.format(row.fare)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {fareMut.isSuccess &&
          fareMut.data &&
          fareMut.data.length === 0 &&
          !fareMut.isPending && (
            <p className="mt-6 text-center text-sm text-zinc-500">
              Tidak ada data tarif untuk rute ini.
            </p>
          )}
      </motion.section>
    </>
  );
}
