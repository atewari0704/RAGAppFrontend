# RAG Frontend – React Build Spec

## Overview

Build a React single-page application that replicates the functionality of an existing Streamlit RAG (Retrieval-Augmented Generation) frontend. The app has two independent sections:

1. **PDF Ingest** – upload a PDF, fire-and-forget an Inngest event, show confirmation.
2. **Ask a Question** – submit a question, poll the Inngest local API until the AI answer is ready, display the answer and sources.

There is no auth. This is a local dev tool.

---

## Tech Stack

- **React 18+** (Vite recommended)
- **TypeScript**
- No UI component library required — plain HTML + CSS or Tailwind is fine
- `fetch` for all HTTP calls (no Axios needed)
- No state management library needed — React `useState` / `useReducer` is sufficient

---

## Environment Variables

```
VITE_INNGEST_EVENT_URL=http://127.0.0.1:8288/e/KEY   # Inngest dev server event endpoint
VITE_INNGEST_API_BASE=http://127.0.0.1:8288/v1       # Inngest dev server REST API base
VITE_BACKEND_URL=http://localhost:8000                # FastAPI backend
```

All values should be read from `import.meta.env.*` and have the above defaults as fallbacks.

---

## Section 1 – PDF Ingest

### UI
- Heading: "Upload a PDF to Ingest"
- A file input that accepts `.pdf` only (single file)
- A submit / upload button
- A spinner or loading indicator while the upload is in progress
- On success: a green success banner — "Triggered ingestion for: `<filename>`"
- After success the form should reset so the user can upload another file

### Behaviour

1. On submit, `POST` the file to `VITE_BACKEND_URL/upload-pdf` as `multipart/form-data`. The backend saves the file and returns:

```json
{ "pdf_path": "/absolute/path/to/uploads/report.pdf", "source_id": "report.pdf" }
```

2. Then `POST` to `VITE_INNGEST_EVENT_URL` with the following JSON body:

```json
{
  "name": "rag/ingest_pdf",
  "data": {
    "pdf_path": "<pdf_path from step 1>",
    "source_id": "<source_id from step 1>"
  }
}
```

3. Show a success message. Do **not** wait for the background Inngest worker to finish — this is fire-and-forget.

### Error handling
- Show a red error banner on any network failure
- Disable the submit button while a request is in flight

---

## Section 2 – Ask a Question

### UI
- Heading: "Ask a question about your PDFs"
- A text input for the question
- A number input for `top_k` (label: "How many chunks to retrieve", min: 1, max: 20, default: 5)
- A submit button labelled "Ask"
- A spinner while waiting for the answer
- Once complete, show:
  - A "Answer" subheading followed by the answer text
  - If sources are present, show a "Sources" label followed by a bulleted list of source strings
- If the answer is empty, show "(No answer)"

### Behaviour

1. On submit, `POST` to `VITE_INNGEST_EVENT_URL` with:

```json
{
  "name": "rag/query_pdf_ai",
  "data": {
    "question": "<trimmed question string>",
    "top_k": <integer>
  }
}
```

The Inngest dev server returns an array of event IDs. Extract `response[0].id` as the `event_id`.

2. **Poll** `GET VITE_INNGEST_API_BASE/events/{event_id}/runs` every **500 ms** until a terminal status is reached.

Terminal statuses (treat all of these as success): `"Completed"`, `"Succeeded"`, `"Success"`, `"Finished"`

Failed statuses (throw an error): `"Failed"`, `"Cancelled"`

3. When a terminal success status is reached, extract `run.output`:

```ts
interface RunOutput {
  answer: string;
  sources: string[];
}
```

4. Render the answer and sources.

5. **Timeout:** If no terminal status is reached within **120 seconds**, stop polling and show the error: "Timed out waiting for an answer. Please try again."

### Error handling
- Show a red error banner on network errors, failed run status, or timeout
- Disable the submit button while polling is in progress
- Clear the previous answer when a new question is submitted

---

## Polling Helper – Reference Implementation

```ts
async function waitForRunOutput(
  eventId: string,
  apiBase: string,
  timeoutMs = 120_000,
  intervalMs = 500
): Promise<RunOutput> {
  const start = Date.now();

  while (true) {
    const res = await fetch(`${apiBase}/events/${eventId}/runs`);
    if (!res.ok) throw new Error(`Inngest API error: ${res.status}`);

    const json = await res.json();
    const runs: any[] = json.data ?? [];

    if (runs.length > 0) {
      const run = runs[0];
      const status: string = run.status ?? "";

      if (["Completed", "Succeeded", "Success", "Finished"].includes(status)) {
        return run.output as RunOutput;
      }
      if (["Failed", "Cancelled"].includes(status)) {
        throw new Error(`Function run ${status}`);
      }
    }

    if (Date.now() - start > timeoutMs) {
      throw new Error("Timed out waiting for an answer. Please try again.");
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
```

---

## Upload PDF – Reference Implementation

```ts
async function uploadPdf(
  backendUrl: string,
  file: File
): Promise<{ pdf_path: string; source_id: string }> {
  const formData = new FormData();
  formData.append("file", file);
  // Do NOT set Content-Type — the browser sets it automatically with the correct boundary
  const res = await fetch(`${backendUrl}/upload-pdf`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}
```

## Sending Inngest Events – Reference Implementation

```ts
async function sendInngestEvent(
  eventUrl: string,
  name: string,
  data: Record<string, unknown>
): Promise<string> {
  const res = await fetch(eventUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, data }),
  });
  if (!res.ok) throw new Error(`Failed to send event: ${res.status}`);
  const json = await res.json();
  return json[0].id as string; // returns the event_id
}
```

---

## Page Layout

```
┌──────────────────────────────────────────┐
│  Upload a PDF to Ingest                  │
│  [  Choose PDF  ] [ Upload ]             │
│  ✓ Triggered ingestion for: report.pdf   │
├──────────────────────────────────────────┤
│  Ask a question about your PDFs          │
│  [ Your question...                    ] │
│  Chunks to retrieve: [ 5 ]               │
│  [ Ask ]                                 │
│                                          │
│  Answer                                  │
│  The answer text goes here...            │
│                                          │
│  Sources                                 │
│  • report.pdf                            │
└──────────────────────────────────────────┘
```

---

## Project Structure (suggested)

```
src/
  App.tsx               # Root layout, renders both sections
  components/
    PdfIngest.tsx        # Section 1
    RagQuery.tsx         # Section 2
  lib/
    inngest.ts           # sendInngestEvent + waitForRunOutput helpers
  types.ts              # RunOutput interface + any shared types
```

---

## Out of Scope

- Authentication
- Persistent history of questions/answers
- Multi-file upload
- Dark mode
- Mobile responsiveness (nice to have, not required)
