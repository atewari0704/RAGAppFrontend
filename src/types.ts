export interface RunOutput {
  answer: string;
  sources: string[];
  message?: string;
}

export interface UploadPdfResponse {
  pdf_path: string;
  source_id: string;
}

export interface clearAllContextResponse{
  message: string;
}
