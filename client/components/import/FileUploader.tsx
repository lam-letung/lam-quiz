import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  FileText,
  Check,
  X,
  AlertCircle,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import {
  FileImportService,
  ParseResult,
  SupportedFileType,
} from "@/lib/fileImport";
import {
  processFile,
  validateFile,
  FileProcessorResult,
} from "@/lib/fileProcessors";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  onImportComplete?: (result: ParseResult) => void;
  onFileSelect?: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
}

export default function FileUploader({
  onImportComplete,
  onFileSelect,
  accept = ".xlsx,.xls,.csv,.tsv,.txt,.json",
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
}: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);
      setSelectedFile(file);
      setProgress(0);
      onFileSelect?.(file);

      // Validate file using enhanced validator
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error!);
        return;
      }

      setIsProcessing(true);

      try {
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 10, 90));
        }, 100);

        // Use enhanced file processor
        const result: FileProcessorResult = await processFile(file);

        clearInterval(progressInterval);
        setProgress(100);

        // Convert to ParseResult format for compatibility
        const parseResult: ParseResult = {
          success: result.errors.length === 0,
          data: result.cards.map((card) => ({
            id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            term: card.term,
            definition: card.definition,
            order: 0,
          })),
          errors: result.errors.map((error) => ({ message: error, line: 0 })),
          warnings: result.warnings.map((warning) => ({
            message: warning,
            line: 0,
          })),
          stats: {
            totalRows: result.totalRows,
            processedRows: result.processedRows,
            errorRows: result.totalRows - result.processedRows,
            duplicateRows: 0,
          },
        };

        setParseResult(parseResult);
        onImportComplete?.(parseResult);

        if (!parseResult.success && parseResult.errors.length > 0) {
          setError(parseResult.errors[0].message);
        }
      } catch (err) {
        setError(`Failed to process file: ${err}`);
      } finally {
        setIsProcessing(false);
      }
    },
    [onFileSelect, onImportComplete],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect],
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "xlsx":
      case "xls":
        return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
      case "csv":
      case "tsv":
        return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
      case "json":
        return <FileText className="h-8 w-8 text-blue-500" />;
      default:
        return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getSupportedFormats = (): {
    ext: string;
    name: string;
    icon: React.ReactNode;
  }[] => [
    {
      ext: "xlsx",
      name: "Excel Workbook",
      icon: <FileSpreadsheet className="h-4 w-4 text-green-600" />,
    },
    {
      ext: "xls",
      name: "Excel Legacy",
      icon: <FileSpreadsheet className="h-4 w-4 text-green-600" />,
    },
    {
      ext: "csv",
      name: "CSV (Comma-separated)",
      icon: <FileSpreadsheet className="h-4 w-4 text-green-500" />,
    },
    {
      ext: "tsv",
      name: "TSV (Tab-separated)",
      icon: <FileSpreadsheet className="h-4 w-4 text-green-500" />,
    },
    { ext: "txt", name: "Plain Text", icon: <FileText className="h-4 w-4" /> },
    {
      ext: "json",
      name: "JSON Format",
      icon: <FileText className="h-4 w-4 text-blue-500" />,
    },
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-all duration-200 cursor-pointer",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          isProcessing && "pointer-events-none opacity-60",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <CardContent className="p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload
                className={cn(
                  "h-12 w-12 transition-colors",
                  isDragOver ? "text-primary" : "text-muted-foreground",
                )}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                {isDragOver ? "Drop your file here" : "Upload File"}
              </h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop a file here, or click to browse
              </p>
              <Badge variant="secondary" className="mb-2">
                Max size: {formatFileSize(maxSize)}
              </Badge>
            </div>

            {/* File Info */}
            {selectedFile && (
              <div className="flex items-center justify-center gap-3 p-3 bg-muted/50 rounded-lg">
                {getFileIcon(selectedFile.name)}
                <div className="text-left">
                  <div className="font-medium text-sm">{selectedFile.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </div>
                </div>
                {parseResult?.success ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : error ? (
                  <X className="h-5 w-5 text-red-500" />
                ) : null}
              </div>
            )}

            {/* Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  Processing file... {progress}%
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Summary */}
      {parseResult && !error && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Import Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {parseResult.data.length}
                </div>
                <div className="text-sm text-muted-foreground">Valid Cards</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {parseResult.errors.length}
                </div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {parseResult.stats.totalRows}
                </div>
                <div className="text-sm text-muted-foreground">Total Rows</div>
              </div>
            </div>

            {/* Preview Cards */}
            {parseResult.data && parseResult.data.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">
                  Preview (first {Math.min(parseResult.data.length, 5)} cards):
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {parseResult.data.slice(0, 5).map((card, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                    >
                      <span className="font-medium">{card.term}</span>
                      <span className="text-muted-foreground">→</span>
                      <span>{card.definition}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Supported Formats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Supported File Formats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getSupportedFormats().map((format) => (
              <div
                key={format.ext}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/20"
              >
                {format.icon}
                <div>
                  <div className="font-medium text-sm">.{format.ext}</div>
                  <div className="text-xs text-muted-foreground">
                    {format.name}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Sample Format Examples
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Excel:</strong> Column A: terms, Column B: definitions
              </div>
              <div>
                <strong>CSV:</strong> "term","definition"
              </div>
              <div>
                <strong>TSV:</strong> term&lt;tab&gt;definition
              </div>
              <div>
                <strong>TXT:</strong> term:definition
              </div>
              <div>
                <strong>JSON:</strong> [{"{"}"term": "...", "definition": "..."
                {"}"}]
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
