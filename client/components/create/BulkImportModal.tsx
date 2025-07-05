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
import { Upload, FileText, Check, X, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setTextInput(text);
      parseText(text, getDelimiterValue());
    };
    reader.readAsText(file);
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
              <Upload className="h-4 w-4" />
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
                  />
                </div>

                <div className="space-y-3">
                  <Label>Delimiter</Label>
                  <Select
                    value={delimiter}
                    onValueChange={handleDelimiterChange}
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
                      Enter text above to see preview
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
                      accept=".txt,.tsv,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      TXT, TSV, or CSV files
                    </p>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Supported formats:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Tab-separated values (TSV)</li>
                    <li>• Comma-separated values (CSV)</li>
                    <li>• Plain text with delimiters</li>
                  </ul>
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
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={validCount === 0}
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
