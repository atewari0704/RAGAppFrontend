import { FormEvent, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Toast } from "primereact/toast";
import { sendInngestEvent, uploadPdf } from "../lib/inngest";

interface PdfIngestProps {
  backendUrl: string;
  inngestBaseUrl: string;
}

export default function PdfIngest({ backendUrl, inngestBaseUrl }: PdfIngestProps) {
  const toastRef = useRef<Toast>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const showErrorToast = (message: string) => {
    toastRef.current?.show({
      severity: "error",
      summary: "Upload failed",
      detail: message,
      life: 3500,
    });
  };

  const showSuccessToast = (message: string) => {
    toastRef.current?.show({
      severity: "success",
      summary: "Upload complete",
      detail: message,
      life: 3500,
    });
  };

  const isPdf = (file: File) => {
    const lower = file.name.toLowerCase();
    return file.type === "application/pdf" || lower.endsWith(".pdf");
  };

  const setFileSafely = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!isPdf(file)) {
      showErrorToast("Only PDF files are allowed.");
      return;
    }

    setSelectedFile(file);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
    maxFiles: 1,
    disabled: isLoading,
    onDropAccepted: (files) => {
      setFileSafely(files[0] ?? null);
    },
    onDropRejected: (fileRejections) => {
      if (fileRejections.length === 0) {
        return;
      }

      const hasInvalidType = fileRejections.some((rejection) =>
        rejection.errors.some((error) => error.code === "file-invalid-type")
      );

      if (hasInvalidType) {
        showErrorToast("Only PDF files are allowed.");
        return;
      }

      showErrorToast("Please select one PDF file.");
    },
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedFile) {
      showErrorToast("Please choose a PDF file to upload.");
      return;
    }

    setIsLoading(true);

    try {
      const uploaded = await uploadPdf(backendUrl, selectedFile);

      await sendInngestEvent(inngestBaseUrl, "rag/ingest_pdf", {
        pdf_path: uploaded.pdf_path,
        source_id: uploaded.source_id,
      });

      showSuccessToast(`${selectedFile.name} pdf uploaded`);
      clearSelectedFile();
    } catch (error) {
      showErrorToast(
        error instanceof Error ? error.message : "An unknown error occurred."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="card" aria-labelledby="pdf-ingest-heading">
      <Toast ref={toastRef} position="top-right" />

      <h2 id="pdf-ingest-heading">Upload a PDF to Ingest</h2>

      <form onSubmit={handleSubmit} className="stack pdf-upload-form">
        <div
          {...getRootProps({
            className: `pdf-dropzone ${isDragActive ? "is-dragging" : ""} ${isDragReject ? "is-reject" : ""} ${isLoading ? "is-disabled" : ""}`,
          })}
        >
          <input {...getInputProps()} />
          <span className="pi pi-cloud-upload pdf-dropzone-icon" aria-hidden="true" />
          <span className="pdf-dropzone-text">Browse Files to Upload</span>
        </div>

        <div className="pdf-selected-file-row" aria-live="polite">
          <span className="pi pi-file-pdf" aria-hidden="true" />
          <span className="pdf-selected-file-name">
            {selectedFile ? selectedFile.name : "No selected File"}
          </span>

          {selectedFile ? (
            <button
              type="button"
              className="pdf-clear-btn"
              onClick={clearSelectedFile}
              disabled={isLoading}
              aria-label="Remove selected file"
            >
              <span className="pi pi-trash" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <button type="submit" disabled={isLoading || !selectedFile}>
          {isLoading ? "Uploading..." : "Upload"}
        </button>

        {isLoading && <p className="muted">Uploading and triggering ingestion...</p>}
      </form>
    </section>
  );
}
