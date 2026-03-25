import type { RunOutput, UploadPdfResponse } from "../types";

const SUCCESS_STATUSES = ["Completed", "Succeeded", "Success", "Finished"];
const FAILED_STATUSES = ["Failed", "Cancelled"];


export async function uploadPdf(
  backendUrl: string,
  file: File
): Promise<UploadPdfResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${backendUrl}/upload-pdf`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);

  return (await res.json()) as UploadPdfResponse;
}

export async function sendInngestEvent(
  baseUrl: string,
  name: string,
  data: Record<string, unknown>
): Promise<string> {
  const payload = JSON.stringify({ name, data });

  let res = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
  });

  if (!res.ok) {
    if (res.status === 405) {
      throw new Error(
        `Failed to send event: 405 (Method Not Allowed). Check VITE_INNGEST_EVENT_URL. Expected an Inngest event endpoint like /e/<event-key>, got: ${eventUrl}`
      );
    }

    throw new Error(`Failed to send event: ${res.status}`);
  }

  const json = (await res.json()) as
    | Array<{ id?: string }>
    | { ids?: string[]; id?: string };

  const eventId = Array.isArray(json)
    ? json?.[0]?.id
    : json.id ?? (Array.isArray(json.ids) ? json.ids[0] : undefined);

  if (!eventId) {
    throw new Error("Invalid Inngest response: missing event id");
  }

  return eventId;
}




export async function waitForRunOutput(
  eventId: string,
  baseUrl: string,
  timeoutMs = 120_000,
  intervalMs = 500
): Promise<RunOutput> {
  const start = Date.now();

  while (true) {
    const res = await fetch(`${baseUrl}/${eventId}/runs`);
    if (!res.ok) {
      throw new Error(`Inngest API error: ${res.status}`);
    }

    const json = (await res.json()) as { data?: Array<Record<string, unknown>> };
    const runs = json.data ?? [];

    if (runs.length > 0) {
      const run = runs[0];
      const status = String(run.status ?? "");

      if (SUCCESS_STATUSES.includes(status)) {
        const output = (run.output ?? {}) as Partial<RunOutput>;
        return {
          answer: output.answer ?? "",
          sources: Array.isArray(output.sources)
            ? output.sources.map((source) => String(source))
            : [],
        };
      }

      if (FAILED_STATUSES.includes(status)) {
        throw new Error(`Function run ${status}`);
      }
    }

    if (Date.now() - start > timeoutMs) {
      throw new Error("Timed out waiting for an answer. Please try again.");
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
