import { Card } from "@/types/flashcard";
import { generateId } from "@/lib/storage";

export interface ImportOptions {
  delimiter?: string;
  hasHeaders?: boolean;
  termColumn?: number;
  definitionColumn?: number;
  skipEmptyLines?: boolean;
}

export interface ParseResult {
  success: boolean;
  data: Card[];
  errors: ImportError[];
  totalLines: number;
  validLines: number;
  preview?: Card[];
}

export interface ImportError {
  line: number;
  message: string;
  data?: string;
}

export type SupportedFileType = "csv" | "tsv" | "txt" | "json" | "xlsx";

export class FileImportService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly PREVIEW_LIMIT = 10;

  /**
   * Validate file before processing
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum limit of 10MB`,
      };
    }

    // Check file type
    const extension = file.name.split(".").pop()?.toLowerCase();
    const supportedTypes: SupportedFileType[] = ["csv", "tsv", "txt", "json"];

    if (
      !extension ||
      !supportedTypes.includes(extension as SupportedFileType)
    ) {
      return {
        valid: false,
        error: `Unsupported file type. Supported formats: ${supportedTypes.join(", ")}`,
      };
    }

    return { valid: true };
  }

  /**
   * Process file and return parsed data
   */
  static async processFile(
    file: File,
    options: ImportOptions = {},
  ): Promise<ParseResult> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return {
        success: false,
        data: [],
        errors: [{ line: 0, message: validation.error! }],
        totalLines: 0,
        validLines: 0,
      };
    }

    try {
      const text = await this.readFileAsText(file);
      const extension = file.name
        .split(".")
        .pop()
        ?.toLowerCase() as SupportedFileType;

      switch (extension) {
        case "csv":
          return this.parseCSV(text, { delimiter: ",", ...options });
        case "tsv":
          return this.parseCSV(text, { delimiter: "\t", ...options });
        case "txt":
          return this.parseText(text, options);
        case "json":
          return this.parseJSON(text);
        default:
          throw new Error(`Unsupported file type: ${extension}`);
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        errors: [{ line: 0, message: `Failed to process file: ${error}` }],
        totalLines: 0,
        validLines: 0,
      };
    }
  }

  /**
   * Parse CSV/TSV files
   */
  private static parseCSV(text: string, options: ImportOptions): ParseResult {
    const {
      delimiter = ",",
      hasHeaders = false,
      termColumn = 0,
      definitionColumn = 1,
      skipEmptyLines = true,
    } = options;

    const lines = text.split("\n").map((line) => line.trim());
    const errors: ImportError[] = [];
    const data: Card[] = [];
    let startLine = hasHeaders ? 1 : 0;

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];

      if (skipEmptyLines && !line) continue;

      try {
        const columns = this.parseCSVLine(line, delimiter);

        if (columns.length < 2) {
          errors.push({
            line: i + 1,
            message: "Insufficient columns (minimum 2 required)",
            data: line,
          });
          continue;
        }

        const term = columns[termColumn]?.trim();
        const definition = columns[definitionColumn]?.trim();

        if (!term) {
          errors.push({
            line: i + 1,
            message: "Empty term",
            data: line,
          });
          continue;
        }

        if (!definition) {
          errors.push({
            line: i + 1,
            message: "Empty definition",
            data: line,
          });
          continue;
        }

        data.push({
          id: generateId(),
          term,
          definition,
          order: data.length,
        });
      } catch (error) {
        errors.push({
          line: i + 1,
          message: `Parse error: ${error}`,
          data: line,
        });
      }
    }

    return {
      success: errors.length === 0 || data.length > 0,
      data,
      errors,
      totalLines: lines.length - startLine,
      validLines: data.length,
      preview: data.slice(0, this.PREVIEW_LIMIT),
    };
  }

  /**
   * Parse plain text files
   */
  private static parseText(text: string, options: ImportOptions): ParseResult {
    const { delimiter = ":", skipEmptyLines = true } = options;

    const lines = text.split("\n").map((line) => line.trim());
    const errors: ImportError[] = [];
    const data: Card[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (skipEmptyLines && !line) continue;

      try {
        const parts = line.split(delimiter);

        if (parts.length < 2) {
          errors.push({
            line: i + 1,
            message: `Line must contain delimiter "${delimiter}"`,
            data: line,
          });
          continue;
        }

        const term = parts[0]?.trim();
        const definition = parts.slice(1).join(delimiter).trim();

        if (!term) {
          errors.push({
            line: i + 1,
            message: "Empty term",
            data: line,
          });
          continue;
        }

        if (!definition) {
          errors.push({
            line: i + 1,
            message: "Empty definition",
            data: line,
          });
          continue;
        }

        data.push({
          id: generateId(),
          term,
          definition,
          order: data.length,
        });
      } catch (error) {
        errors.push({
          line: i + 1,
          message: `Parse error: ${error}`,
          data: line,
        });
      }
    }

    return {
      success: errors.length === 0 || data.length > 0,
      data,
      errors,
      totalLines: lines.length,
      validLines: data.length,
      preview: data.slice(0, this.PREVIEW_LIMIT),
    };
  }

  /**
   * Parse JSON files
   */
  private static parseJSON(text: string): ParseResult {
    try {
      const jsonData = JSON.parse(text);
      const errors: ImportError[] = [];
      const data: Card[] = [];

      // Handle different JSON structures
      let items: any[] = [];

      if (Array.isArray(jsonData)) {
        items = jsonData;
      } else if (jsonData.cards && Array.isArray(jsonData.cards)) {
        items = jsonData.cards;
      } else if (jsonData.data && Array.isArray(jsonData.data)) {
        items = jsonData.data;
      } else {
        return {
          success: false,
          data: [],
          errors: [
            {
              line: 0,
              message:
                "Invalid JSON structure. Expected array or object with cards/data property",
            },
          ],
          totalLines: 0,
          validLines: 0,
        };
      }

      items.forEach((item, index) => {
        try {
          let term: string = "";
          let definition: string = "";

          // Handle different property names
          if (typeof item === "object") {
            term = item.term || item.front || item.question || item.word || "";
            definition =
              item.definition || item.back || item.answer || item.meaning || "";
          } else if (typeof item === "string") {
            // Handle string arrays with delimiter
            const parts = item.split(":");
            term = parts[0]?.trim() || "";
            definition = parts.slice(1).join(":").trim() || "";
          }

          if (!term) {
            errors.push({
              line: index + 1,
              message: "Missing term property",
              data: JSON.stringify(item),
            });
            return;
          }

          if (!definition) {
            errors.push({
              line: index + 1,
              message: "Missing definition property",
              data: JSON.stringify(item),
            });
            return;
          }

          data.push({
            id: generateId(),
            term: term.trim(),
            definition: definition.trim(),
            order: data.length,
          });
        } catch (error) {
          errors.push({
            line: index + 1,
            message: `Parse error: ${error}`,
            data: JSON.stringify(item),
          });
        }
      });

      return {
        success: data.length > 0,
        data,
        errors,
        totalLines: items.length,
        validLines: data.length,
        preview: data.slice(0, this.PREVIEW_LIMIT),
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        errors: [{ line: 0, message: `Invalid JSON: ${error}` }],
        totalLines: 0,
        validLines: 0,
      };
    }
  }

  /**
   * Parse CSV line handling quoted values
   */
  private static parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === delimiter && !inQuotes) {
        // Field separator
        result.push(current);
        current = "";
        i++;
      } else {
        current += char;
        i++;
      }
    }

    result.push(current);
    return result;
  }

  /**
   * Read file as text
   */
  private static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  /**
   * Generate example data for each format
   */
  static getFormatExamples(): Record<SupportedFileType, string> {
    return {
      csv: `"term","definition"
"Hello","Xin chào"
"Thank you","Cảm ơn"
"Goodbye","Tạm biệt"`,
      tsv: `term	definition
Hello	Xin chào
Thank you	Cảm ơn
Goodbye	Tạm biệt`,
      txt: `Hello:Xin chào
Thank you:Cảm ơn
Goodbye:Tạm biệt`,
      json: `[
  {"term": "Hello", "definition": "Xin chào"},
  {"term": "Thank you", "definition": "Cảm ơn"},
  {"term": "Goodbye", "definition": "Tạm biệt"}
]`,
      xlsx: "Excel files with columns: Term | Definition",
    };
  }

  /**
   * Auto-detect delimiter for text files
   */
  static detectDelimiter(text: string): string {
    const delimiters = ["\t", ",", ";", "|", ":"];
    const sampleLines = text.split("\n").slice(0, 5);

    let bestDelimiter = ":";
    let bestScore = 0;

    delimiters.forEach((delimiter) => {
      let score = 0;
      sampleLines.forEach((line) => {
        const parts = line.split(delimiter);
        if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
          score++;
        }
      });

      if (score > bestScore) {
        bestScore = score;
        bestDelimiter = delimiter;
      }
    });

    return bestDelimiter;
  }
}
