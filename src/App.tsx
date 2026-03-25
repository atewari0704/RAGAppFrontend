import PdfIngest from "./components/PdfIngest";
import RagQuery from "./components/RagQuery";

const inngestEventUrl = import.meta.env.VITE_INNGEST_EVENT_URL ?? "http://127.0.0.1:8288/e/KEY";

const inngestApiBase = import.meta.env.VITE_INNGEST_API_BASE ?? "http://127.0.0.1:8288/v1";
  
const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

function App() {
  return (
    <main className="container">
      <h1>RAG Frontend</h1>

      <PdfIngest backendUrl={backendUrl} inngestBaseUrl={inngestApiBase} />
      <RagQuery inngestBaseUrl={inngestApiBase} eventUrl={inngestEventUrl} />
    </main>
  );
}

export default App;
