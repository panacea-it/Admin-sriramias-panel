import { useCallback, useRef, useState } from "react";
import { Download, FileSpreadsheet, Upload, UploadCloud } from "lucide-react";
import { toast } from "@/utils/toast";
import Modal from "../ui/Modal";
import ModalPanelHeader from "../courses/ModalPanelHeader";
import { cn } from "../../utils/cn";

// Import both APIs!
import {
  bulkUploadLeadsAPI,
  downloadSampleTemplateAPI,
} from "../../api/leadsAPI";

const ACCEPT = ".xlsx,.xls";

function validateExcelFile(file) {
  if (!file) return { valid: false, message: "No file selected" };
  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
    return {
      valid: false,
      message: "Only Excel files (.xlsx, .xls) are supported",
    };
  }
  return { valid: true };
}

export default function LeadBulkUploadModal({ open, onClose }) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false); // Track download state

  const reset = useCallback(() => {
    setSelectedFile(null);
    setFileError("");
    setDragOver(false);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose?.();
  }, [onClose, reset]);

  const acceptFile = useCallback((file) => {
    const check = validateExcelFile(file);
    if (!check.valid) {
      setFileError(check.message);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setFileError("");
    setSelectedFile(file);
  }, []);

  const handleFileInput = (e) => {
    acceptFile(e.target.files?.[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  // INTEGRATED: Download Template API
  const handleDownloadTemplate = async () => {
    try {
      setDownloading(true);
      const blob = await downloadSampleTemplateAPI();

      // Create a temporary URL for the Blob and trigger download
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "leads-upload-template.xlsx");
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Sample template downloaded successfully");
    } catch (error) {
      console.error("Template download error:", error);
      toast.error("Could not download template. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  // INTEGRATED: Bulk Upload API
  const handleUpload = async () => {
    if (!selectedFile) {
      setFileError("Please choose an Excel file to upload");
      return;
    }

    try {
      setUploading(true);
      const result = await bulkUploadLeadsAPI(selectedFile);

      if (result?.success) {
        toast.success(result.message || "Leads uploaded successfully!");
        handleClose(); // Close the modal on success
        // Note: You can trigger a table refresh here later if needed!
      } else {
        toast.error(
          result?.message || "Upload failed. Please check the file format.",
        );
      }
    } catch (error) {
      console.error("Bulk upload error:", error);
      toast.error("An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="md"
      title="Bulk Upload Leads"
      showCloseButton={false}
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
        <ModalPanelHeader
          title="Bulk Upload Leads"
          onClose={handleClose}
          icon={FileSpreadsheet}
          iconClassName="text-[#246392]"
          closeVariant="icon"
        />

        <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-lg border border-[#55ace7]/40 bg-white px-4 py-2.5 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-[#f0f9ff] disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {downloading ? "Downloading..." : "Download Sample Template"}
          </button>

          <div
            role="button"
            tabIndex={0}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            className={cn(
              "flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition",
              dragOver
                ? "border-[#55ace7] bg-[#eef6fc]"
                : "border-[#55ace7]/45 bg-[#fafcff] hover:border-[#55ace7] hover:bg-white",
            )}
          >
            {selectedFile ? (
              <FileSpreadsheet className="h-10 w-10 text-[#246392]" />
            ) : (
              <UploadCloud className="h-10 w-10 text-[#55ace7]" />
            )}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#1a3a5c]">
                {selectedFile
                  ? selectedFile.name
                  : "Drag & drop your Excel file here"}
              </p>
              {!selectedFile && (
                <p className="text-xs text-[#686868]">
                  or use the button below
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#55ace7] to-[#3d8fd4] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-[#4a9fd8] hover:to-[#3589c8]"
            >
              <Upload className="h-4 w-4" />
              Choose Excel File
            </button>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              onChange={handleFileInput}
            />
          </div>

          <p className="text-center text-xs font-medium text-[#686868]">
            Supported Format: Excel (.xlsx, .xls)
          </p>

          {selectedFile && (
            <div className="rounded-lg border border-[#55ace7]/20 bg-[#f0f9ff] px-4 py-3">
              <p className="text-sm text-[#246392]">
                <span className="font-semibold">Selected file:</span>{" "}
                {selectedFile.name}
              </p>
            </div>
          )}

          {fileError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
              {fileError}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200/80 pt-5">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="inline-flex h-10 min-w-[100px] items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-[#686868] shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              className="inline-flex h-10 min-w-[100px] items-center justify-center rounded-lg bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-6 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02] hover:shadow-[0_6px_18px_rgba(3,4,94,0.4)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
