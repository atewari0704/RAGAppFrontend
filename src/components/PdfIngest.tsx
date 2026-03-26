import { FormEvent, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Toast } from "primereact/toast";
import { sendInngestEvent, uploadPdf, waitForRunOutput } from "../lib/inngest";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PdfIngest() {
  const toastRef = useRef<Toast>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lastUploadedFile, setLastUploadedFile] = useState<{
    name: string;
    size: number;
    uploadedAt: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

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

  const { getRootProps,getInputProps, isDragActive, isDragReject } = useDropzone({
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
      const uploaded = await uploadPdf(selectedFile);

      await sendInngestEvent("rag/ingest_pdf", {
        pdf_path: uploaded.pdf_path,
        source_id: uploaded.source_id,
      });

      setLastUploadedFile({
        name: selectedFile.name,
        size: selectedFile.size,
        uploadedAt: new Date().toLocaleString(),
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

  const handleClearAllFiles = async () => {
    setIsClearingAll(true);

    try {
      const eventId = await sendInngestEvent("rag/clear_all_context", null);
      const output = await waitForRunOutput(eventId);
      setLastUploadedFile(null);
      clearSelectedFile();
      showSuccessToast(`${output?.message}`);
    } catch (error) {
      showErrorToast(
        error instanceof Error ? error.message : "An unknown error occurred."
      );
    } finally {
      setIsClearingAll(false);
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
          <span className="pdf-dropzone-text">
            {isDragActive ? "Drop your PDF here" : "Browse files to upload"}
          </span>
        </div>

        <div
          className={`pdf-selected-file-row ${selectedFile ? "has-file" : "no-file"}`}
          aria-live="polite"
        >
          <span className="pi pi-file-pdf" aria-hidden="true" />
          {selectedFile ? (
            <div className="pdf-selected-file-meta">
              <span className="pdf-selected-file-name">{selectedFile.name}</span>
              <span className="pdf-selected-file-size">
                {formatFileSize(selectedFile.size)}
              </span>
            </div>
          ) : (
            <span className="pdf-selected-file-name">No new file selected</span>
          )}

          {selectedFile ? (
            <button
              type="button"
              className="pdf-clear-btn"
              onClick={clearSelectedFile}
              disabled={isLoading}
              aria-label="Remove selected file"
            >
              <span aria-hidden="true">×</span>
            </button>
          ) : null}
        </div>

        {lastUploadedFile ? (
          <div className="pdf-selected-file-row has-file pdf-last-uploaded" aria-live="polite">
            <span className="pi pi-file-pdf" aria-hidden="true" />
            <div className="pdf-selected-file-meta">
              <span className="pdf-last-uploaded-label">Last uploaded</span>
              <span className="pdf-selected-file-name">{lastUploadedFile.name}</span>
              <span className="pdf-selected-file-size">
                {formatFileSize(lastUploadedFile.size)} · {lastUploadedFile.uploadedAt}
              </span>
            </div>
          </div>
        ) : null}

        <div className="pdf-submit-actions">
          <button type="submit" disabled={isLoading || isClearingAll || !selectedFile}>
            {isLoading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                <span>Uploading...</span>
              </>
            ) : (
              "Upload"
            )}
          </button>

          <button
            type="button"
            className="pdf-clear-all-btn"
            onClick={handleClearAllFiles}
            disabled={isLoading || isClearingAll}
          >
            {isClearingAll ? (
              <>
                <span className="spinner" aria-hidden="true" />
                <span>Clearing...</span>
              </>
            ) : (
              "Clear all files"
            )}
          </button>
        </div>

        {isLoading && <p className="muted">Uploading and triggering ingestion...</p>}
      </form>
    </section>
  );
}
