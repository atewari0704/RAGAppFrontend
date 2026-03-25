import { FormEvent, useState } from "react";
import { sendInngestEvent, waitForRunOutput } from "../lib/inngest";
import type { RunOutput } from "../types";

interface RagQueryProps {
  inngestBaseUrl: string;
  eventUrl: string;
}

function normalizeTopK(value: number): number {
  if (Number.isNaN(value)) return 5;
  if (value < 1) return 1;
  if (value > 20) return 20;
  return Math.trunc(value);
}

export default function RagQuery({ inngestBaseUrl, eventUrl }: RagQueryProps) {
  const [question, setQuestion] = useState("");
  const [topK, setTopK] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<RunOutput | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setErrorMessage("Please enter a question.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setResult(null);

    try {
      const eventId = await sendInngestEvent(inngestBaseUrl, "rag/query", {
        question: trimmedQuestion,
        top_k: normalizeTopK(topK),
      });

      console.log(`eventID forthe ragQuery: ${eventId}`)

      const output = await waitForRunOutput(eventId, eventUrl);
      setResult(output);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "An unknown error occurred."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const answerText = result?.answer?.trim() ? result.answer : "(No answer)";

  return (
    <section className="card" aria-labelledby="ask-question-heading">
      <h2 id="ask-question-heading">Ask a question about your PDFs</h2>

      <form onSubmit={handleSubmit} className="stack">
        <label className="stack" htmlFor="rag-question">
          <span className="label">Question</span>
          <input
            id="rag-question"
            type="text"
            placeholder="Your question..."
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            disabled={isLoading}
          />
        </label>

        <label className="stack" htmlFor="rag-top-k">
          <span className="label">How many chunks to retrieve</span>
          <input
            id="rag-top-k"
            type="number"
            min={1}
            max={20}
            value={topK}
            onChange={(event) => setTopK(normalizeTopK(Number(event.target.value)))}
            disabled={isLoading}
          />
        </label>

        <div className="row">
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Asking..." : "Ask"}
          </button>
          {isLoading && <p className="muted">Waiting for answer...</p>}
        </div>

        {errorMessage && <p className="banner error">{errorMessage}</p>}
      </form>

      {result && (
        <div className="result stack">
          <h3>Answer</h3>
          <p>{answerText}</p>

          {result.sources.length > 0 && (
            <>
              <p className="label">Sources</p>
              <ul>
                {result.sources.map((source, index) => (
                  <li key={`${source}-${index}`}>{source}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}
