import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  X,
  AlertCircle,
  Settings,
  Download,
  Upload,
  FileText,
  Eye,
} from "lucide-react";
import {
  ParseResult,
  ImportOptions,
  FileImportService,
} from "@/lib/fileImport";
import { Card as FlashCard } from "@/types/flashcard";
import { cn } from "@/lib/utils";

interface ImportPreviewProps {
  file: File;
  initialResult: ParseResult;
  onImportConfirm?: (cards: FlashCard[]) => void;
  onCancel?: () => void;
  className?: string;
}

export default function ImportPreview({
  file,
  initialResult,
  onImportConfirm,
  onCancel,
  className,
}: ImportPreviewProps) {
  const [parseResult, setParseResult] = useState<ParseResult>(initialResult);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    delimiter: FileImportService.detectDelimiter(file.name),
    hasHeaders: false,
    termColumn: 0,
    definitionColumn: 1,
    skipEmptyLines: true,
  });

  const handleOptionsChange = async (newOptions: Partial<ImportOptions>) => {
    const updatedOptions = { ...importOptions, ...newOptions };
    setImportOptions(updatedOptions);

    setIsReprocessing(true);
    try {
      const result = await FileImportService.processFile(file, updatedOptions);
      setParseResult(result);
    } catch (error) {
      console.error("Error reprocessing file:", error);
    } finally {
      setIsReprocessing(false);
    }
  };

  const handleImport = () => {
    if (parseResult.success && parseResult.data.length > 0) {
      onImportConfirm?.(parseResult.data);
    }
  };

  const getDelimiterOptions = () => [
    { value: ",", label: "Comma (,)" },
    { value: "\t", label: "Tab" },
    { value: ";", label: "Semicolon (;)" },
    { value: "|", label: "Pipe (|)" },
    { value: ":", label: "Colon (:)" },
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* File Info Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import Preview: {file.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {parseResult.validLines}
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
                {Math.round(
                  (parseResult.validLines / parseResult.totalLines) * 100,
                ) || 0}
                %
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="preview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="errors" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Errors ({parseResult.errors.length})
          </TabsTrigger>
        </TabsList>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          {parseResult.data.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Card Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Preview Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Term</TableHead>
                          <TableHead>Definition</TableHead>
                          <TableHead className="w-16">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parseResult.data.slice(0, 10).map((card, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-medium">
                              {card.term}
                            </TableCell>
                            <TableCell>{card.definition}</TableCell>
                            <TableCell>
                              <Check className="h-4 w-4 text-green-500" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {parseResult.data.length > 10 && (
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Showing first 10 cards. {parseResult.data.length - 10}{" "}
                        more cards will be imported.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No valid cards found. Please check your file format and
                settings.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Delimiter Selection */}
              <div className="space-y-2">
                <Label>Field Delimiter</Label>
                <Select
                  value={importOptions.delimiter}
                  onValueChange={(value) =>
                    handleOptionsChange({ delimiter: value })
                  }
                  disabled={isReprocessing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getDelimiterOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Column Mapping */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Term Column</Label>
                  <Input
                    type="number"
                    min="0"
                    value={importOptions.termColumn}
                    onChange={(e) =>
                      handleOptionsChange({
                        termColumn: parseInt(e.target.value) || 0,
                      })
                    }
                    disabled={isReprocessing}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Definition Column</Label>
                  <Input
                    type="number"
                    min="0"
                    value={importOptions.definitionColumn}
                    onChange={(e) =>
                      handleOptionsChange({
                        definitionColumn: parseInt(e.target.value) || 1,
                      })
                    }
                    disabled={isReprocessing}
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasHeaders"
                    checked={importOptions.hasHeaders}
                    onCheckedChange={(checked) =>
                      handleOptionsChange({ hasHeaders: !!checked })
                    }
                    disabled={isReprocessing}
                  />
                  <Label htmlFor="hasHeaders">File has header row</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skipEmptyLines"
                    checked={importOptions.skipEmptyLines}
                    onCheckedChange={(checked) =>
                      handleOptionsChange({ skipEmptyLines: !!checked })
                    }
                    disabled={isReprocessing}
                  />
                  <Label htmlFor="skipEmptyLines">Skip empty lines</Label>
                </div>
              </div>

              {isReprocessing && (
                <Alert>
                  <Upload className="h-4 w-4" />
                  <AlertDescription>
                    Reprocessing file with new settings...
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-4">
          {parseResult.errors.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Import Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {parseResult.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <div className="font-medium">
                            Line {error.line}: {error.message}
                          </div>
                          {error.data && (
                            <div className="text-xs bg-destructive/10 p-2 rounded font-mono">
                              {error.data}
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Errors Found</h3>
                <p className="text-muted-foreground">
                  All lines in your file were processed successfully!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="text-sm text-muted-foreground">
          {parseResult.validLines} cards ready to import
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={parseResult.validLines === 0 || isReprocessing}
            className="gradient-bg"
          >
            <Download className="h-4 w-4 mr-2" />
            Import {parseResult.validLines} Cards
          </Button>
        </div>
      </div>
    </div>
  );
}
