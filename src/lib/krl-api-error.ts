type FetchReject = { status: number; body: string };

export function isFetchReject(e: unknown): e is FetchReject {
  return (
    typeof e === "object" &&
    e !== null &&
    "status" in e &&
    "body" in e &&
    typeof (e as FetchReject).status === "number" &&
    typeof (e as FetchReject).body === "string"
  );
}

export function responseFromFetchReject(e: FetchReject): Response {
  const upstreamStatus = e.status;
  const proxyStatus = upstreamStatus >= 500 ? 502 : upstreamStatus;

  return new Response(
    JSON.stringify({
      status: proxyStatus,
      upstreamStatus,
      message: e.body,
    }),
    {
      status: proxyStatus,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export function responseFromUpstreamError(e: unknown): Response {
  if (isFetchReject(e)) {
    return responseFromFetchReject(e);
  }

  const message = e instanceof Error ? e.message : "Upstream error";

  return new Response(JSON.stringify({ status: 502, message }), {
    status: 502,
    headers: { "Content-Type": "application/json" },
  });
}
