import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, Check, X, AlertCircle, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as XLSX from "xlsx";

interface ParsedCard {
  term: string;
  definition: string;
  isValid: boolean;
  error?: string;
}

interface BulkImportModalProps {
  onImport: (cards: { term: string; definition: string }[]) => void;
  children: React.ReactNode;
}

const DELIMITERS = {
  comma: { value: ",", label: "Comma (,)", example: "hello,xin chào" },
  tab: { value: "\t", label: "Tab", example: "hello    xin chào" },
  semicolon: { value: ";", label: "Semicolon (;)", example: "hello;xin chào" },
  pipe: { value: "|", label: "Pipe (|)", example: "hello|xin chào" },
  doubleColon: {
    value: "::",
    label: "Double Colon (::)",
    example: "hello::xin chào",
  },
};

export default function BulkImportModal({
  onImport,
  children,
}: BulkImportModalProps) {
  const [open, setOpen] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [delimiter, setDelimiter] = useState("comma");
  const [customDelimiter, setCustomDelimiter] = useState("");
  const [parsedCards, setParsedCards] = useState<ParsedCard[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const getDelimiterValue = () => {
    if (delimiter === "custom") return customDelimiter;
    return DELIMITERS[delimiter as keyof typeof DELIMITERS]?.value || ",";
  };

  const parseText = (text: string, delim: string) => {
    if (!text.trim()) {
      setParsedCards([]);
      return;
    }

    const lines = text.split("\n").filter((line) => line.trim());
    const parsed: ParsedCard[] = lines.map((line, index) => {
      const parts = line.split(delim);
      if (parts.length < 2) {
        return {
          term: line,
          definition: "",
          isValid: false,
          error: "Missing definition",
        };
      }

      const term = parts[0]?.trim();
      const definition = parts.slice(1).join(delim).trim();

      if (!term) {
        return {
          term: line,
          definition: "",
          isValid: false,
          error: "Missing term",
        };
      }

      if (!definition) {
        return {
          term,
          definition: "",
          isValid: false,
          error: "Missing definition",
        };
      }

      return {
        term,
        definition,
        isValid: true,
      };
    });

    setParsedCards(parsed);
  };

  const handleTextChange = (value: string) => {
    setTextInput(value);
    parseText(value, getDelimiterValue());
  };

  const handleDelimiterChange = (value: string) => {
    setDelimiter(value);
    if (value !== "custom") {
      parseText(textInput, DELIMITERS[value as keyof typeof DELIMITERS].value);
    }
  };

  const handleCustomDelimiterChange = (value: string) => {
    setCustomDelimiter(value);
    if (delimiter === "custom") {
      parseText(textInput, value);
    }
  };

  const parseExcelFile = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          
          // Get first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to array of arrays
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Convert to text format
          const textData = jsonData
            .filter((row: any) => row && row.length >= 2) // Skip empty rows or rows with less than 2 columns
            .map((row: any) => {
              const term = String(row[0] || "").trim();
              const definition = String(row[1] || "").trim();
              return `${term}\t${definition}`; // Use tab delimiter for Excel
            })
            .join("\n");
          
          resolve(textData);
        } catch (error) {
          reject(new Error("Failed to parse Excel file. Please ensure it has at least 2 columns."));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    try {
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Handle Excel files
        const textData = await parseExcelFile(file);
        setTextInput(textData);
        setDelimiter("tab"); // Excel data uses tab delimiter
        parseText(textData, "\t");
      } else {
        // Handle text files
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setTextInput(text);
          parseText(text, getDelimiterValue());
        };
        reader.readAsText(file);
      }
    } catch (error) {
      console.error("File processing error:", error);
      // Show error to user
      setParsedCards([{
        term: "Error",
        definition: error instanceof Error ? error.message : "Unknown error occurred",
        isValid: false,
        error: "File processing failed"
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    const validCards = parsedCards.filter((card) => card.isValid);
    onImport(validCards);
    setOpen(false);
    setTextInput("");
    setParsedCards([]);
  };

  const validCount = parsedCards.filter((card) => card.isValid).length;
  const errorCount = parsedCards.length - validCount;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Flashcards
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="text" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Text Input
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              File Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4 overflow-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-96">
              {/* Input Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text-input">Enter your flashcards</Label>
                  <Textarea
                    id="text-input"
                    placeholder="Enter one card per line&#10;term,definition&#10;hello,xin chào&#10;goodbye,tạm biệt"
                    value={textInput}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="h-48 resize-none font-mono text-sm"
                    disabled={isProcessing}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Delimiter</Label>
                  <Select
                    value={delimiter}
                    onValueChange={handleDelimiterChange}
                    disabled={isProcessing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DELIMITERS).map(([key, delim]) => (
                        <SelectItem key={key} value={key}>
                          {delim.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>

                  {delimiter === "custom" && (
                    <Input
                      placeholder="Enter custom delimiter"
                      value={customDelimiter}
                      onChange={(e) =>
                        handleCustomDelimiterChange(e.target.value)
                      }
                      className="font-mono"
                      disabled={isProcessing}
                    />
                  )}

                  <div className="text-xs text-muted-foreground">
                    Example:{" "}
                    {delimiter === "custom"
                      ? `hello${customDelimiter}xin chào`
                      : DELIMITERS[delimiter as keyof typeof DELIMITERS]
                          ?.example}
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Preview</Label>
                  <div className="flex items-center gap-2">
                    {isProcessing && (
                      <Badge variant="outline" className="gap-1">
                        Processing...
                      </Badge>
                    )}
                    {validCount > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <Check className="h-3 w-3" />
                        {validCount} valid
                      </Badge>
                    )}
                    {errorCount > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <X className="h-3 w-3" />
                        {errorCount} errors
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="border rounded-md h-48 overflow-auto">
                  {parsedCards.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      {isProcessing ? "Processing file..." : "Enter text above to see preview"}
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {parsedCards.map((card, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded text-sm border ${
                            card.isValid
                              ? "border-success/20 bg-success/5"
                              : "border-destructive/20 bg-destructive/5"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {card.isValid ? (
                              <Check className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                            ) : (
                              <X className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              {card.isValid ? (
                                <div>
                                  <span className="font-medium">
                                    {card.term}
                                  </span>{" "}
                                  → {card.definition}
                                </div>
                              ) : (
                                <div>
                                  <div className="text-destructive font-medium">
                                    {card.error}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {card.term}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {errorCount > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {errorCount} cards have errors and will not be imported.
                  Please fix them or use a different delimiter.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upload File</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="text-center">
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-sm text-muted-foreground">Processing file...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <Label
                          htmlFor="file-upload"
                          className="cursor-pointer text-sm font-medium"
                        >
                          Click to upload or drag and drop
                        </Label>
                        <Input
                          id="file-upload"
                          type="file"
                          accept=".txt,.tsv,.csv,.xlsx,.xls"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          TXT, TSV, CSV, XLSX, or XLS files
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Supported formats:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Excel files (.xlsx, .xls) - First 2 columns will be used</li>
                    <li>• Tab-separated values (TSV)</li>
                    <li>• Comma-separated values (CSV)</li>
                    <li>• Plain text with delimiters</li>
                  </ul>
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                    <p className="text-xs font-medium text-blue-700">Excel Format Tips:</p>
                    <ul className="text-xs text-blue-600 mt-1">
                      <li>• Column A: Terms</li>
                      <li>• Column B: Definitions</li>
                      <li>• Header row is optional</li>
                      <li>• Empty rows will be skipped</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {parsedCards.length > 0 && (
              <>
                {validCount} cards ready to import
                {errorCount > 0 && ` • ${errorCount} errors`}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={validCount === 0 || isProcessing}
              className="gradient-bg"
            >
              Import {validCount} Cards
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}