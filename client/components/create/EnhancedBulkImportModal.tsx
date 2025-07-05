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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, Check, X, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ParseResult } from "@/lib/fileImport";
import FileUploader from "@/components/import/FileUploader";
import ImportPreview from "@/components/import/ImportPreview";
import { Card as FlashCard } from "@/types/flashcard";

interface EnhancedBulkImportModalProps {
  onImport: (cards: FlashCard[]) => void;
  children: React.ReactNode;
}

type ImportStep = "upload" | "preview" | "text";

export default function EnhancedBulkImportModal({
  onImport,
  children,
}: EnhancedBulkImportModalProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<ImportStep>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [textInput, setTextInput] = useState("");

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleFileImportComplete = (result: ParseResult) => {
    setParseResult(result);
    if (result.success && result.validLines > 0) {
      setCurrentStep("preview");
    }
  };

  const handleImportConfirm = (cards: FlashCard[]) => {
    onImport(cards);
    handleClose();
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentStep("upload");
    setSelectedFile(null);
    setParseResult(null);
    setTextInput("");
  };

  const handleTextImport = () => {
    if (!textInput.trim()) return;

    // Parse text input (simple format)
    const lines = textInput.split("\n").filter((line) => line.trim());
    const cards: FlashCard[] = [];
    const errors: any[] = [];

    lines.forEach((line, index) => {
      const parts = line.split("\t");
      if (parts.length < 2) {
        const commaParts = line.split(",");
        if (commaParts.length >= 2) {
          cards.push({
            id: `text-${index}`,
            term: commaParts[0].trim(),
            definition: commaParts.slice(1).join(",").trim(),
            order: cards.length,
          });
        } else {
          errors.push({ line: index + 1, message: "Invalid format" });
        }
      } else {
        cards.push({
          id: `text-${index}`,
          term: parts[0].trim(),
          definition: parts.slice(1).join("\t").trim(),
          order: cards.length,
        });
      }
    });

    if (cards.length > 0) {
      onImport(cards);
      handleClose();
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Choose Import Method</h3>
        <p className="text-muted-foreground">
          Upload a file or paste text directly
        </p>
      </div>

      <Tabs value="file" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="file" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            File Upload
          </TabsTrigger>
          <TabsTrigger
            value="text"
            className="flex items-center gap-2"
            onClick={() => setCurrentStep("text")}
          >
            <FileText className="h-4 w-4" />
            Text Input
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file" className="mt-6">
          <FileUploader
            onFileSelect={handleFileSelect}
            onImportComplete={handleFileImportComplete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderTextStep = () => (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          onClick={() => setCurrentStep("upload")}
          className="mb-4"
        >
          ← Back to Upload
        </Button>

        <h3 className="text-lg font-semibold mb-2">Paste Your Text</h3>
        <p className="text-muted-foreground mb-4">
          Enter your flashcards with one card per line
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="text-input">Enter your flashcards</Label>
          <Textarea
            id="text-input"
            placeholder="Enter one card per line&#10;term,definition&#10;hello,xin chào&#10;goodbye,tạm biệt&#10;&#10;Or use tabs:&#10;term	definition&#10;hello	xin chào"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="h-48 resize-none font-mono text-sm mt-2"
          />
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Supported formats:</strong>
            <br />• Comma-separated: term,definition
            <br />• Tab-separated: term&lt;tab&gt;definition
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            {textInput.split("\n").filter((line) => line.trim()).length} lines
            entered
          </div>
          <Button
            onClick={handleTextImport}
            disabled={!textInput.trim()}
            className="gradient-bg"
          >
            Import Text
          </Button>
        </div>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    if (!selectedFile || !parseResult) return null;

    return (
      <ImportPreview
        file={selectedFile}
        initialResult={parseResult}
        onImportConfirm={handleImportConfirm}
        onCancel={() => setCurrentStep("upload")}
      />
    );
  };

  const getStepContent = () => {
    switch (currentStep) {
      case "upload":
        return renderUploadStep();
      case "text":
        return renderTextStep();
      case "preview":
        return renderPreviewStep();
      default:
        return renderUploadStep();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Flashcards
            {currentStep === "preview" && parseResult && (
              <Badge variant="secondary">
                {parseResult.validLines} cards ready
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">{getStepContent()}</div>
      </DialogContent>
    </Dialog>
  );
}
