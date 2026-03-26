import PdfIngest from "./components/PdfIngest";
import RagQuery from "./components/RagQuery";

function App() {
  return (
    <main className="container">
      <h1 className="app-title">
        <span className="app-title-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 3v5h5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 15h6M9 11h3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span>RAG Frontend</span>
      </h1>

      <PdfIngest />
      <RagQuery />
    </main>
  );
}

export default App;
