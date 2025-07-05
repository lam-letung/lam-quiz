import * as XLSX from "xlsx";

export interface ProcessedCard {
  term: string;
  definition: string;
}

export interface FileProcessorResult {
  cards: ProcessedCard[];
  errors: string[];
  warnings: string[];
  totalRows: number;
  processedRows: number;
}

export interface ColumnMapping {
  termColumn: number | string;
  definitionColumn: number | string;
  hasHeaders: boolean;
}

// Process Excel files (.xlsx, .xls)
export const processExcelFile = async (
  file: File,
  mapping?: ColumnMapping,
): Promise<FileProcessorResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error("No sheets found in the Excel file");
    }

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      blankrows: false,
    }) as string[][];

    if (jsonData.length === 0) {
      throw new Error("The Excel file appears to be empty");
    }

    return processArrayData(jsonData, mapping);
  } catch (error) {
    console.error("Excel processing error:", error);
    return {
      cards: [],
      errors: [
        error instanceof Error ? error.message : "Failed to process Excel file",
      ],
      warnings: [],
      totalRows: 0,
      processedRows: 0,
    };
  }
};

// Process CSV files
export const processCSVFile = async (
  file: File,
  delimiter: string = ",",
  mapping?: ColumnMapping,
): Promise<FileProcessorResult> => {
  try {
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length === 0) {
      throw new Error("The CSV file appears to be empty");
    }

    const data = lines.map((line) => parseCSVLine(line, delimiter));
    return processArrayData(data, mapping);
  } catch (error) {
    console.error("CSV processing error:", error);
    return {
      cards: [],
      errors: [
        error instanceof Error ? error.message : "Failed to process CSV file",
      ],
      warnings: [],
      totalRows: 0,
      processedRows: 0,
    };
  }
};

// Process TSV files
export const processTSVFile = async (
  file: File,
  mapping?: ColumnMapping,
): Promise<FileProcessorResult> => {
  return processCSVFile(file, "\t", mapping);
};

// Process plain text files
export const processTextFile = async (
  file: File,
  delimiter: string = "\t",
): Promise<FileProcessorResult> => {
  try {
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length === 0) {
      throw new Error("The text file appears to be empty");
    }

    const cards: ProcessedCard[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let processedRows = 0;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      const parts = trimmedLine.split(delimiter);
      if (parts.length < 2) {
        if (delimiter === "\t") {
          // Try other common delimiters
          const commaParts = trimmedLine.split(",");
          const semicolonParts = trimmedLine.split(";");

          if (commaParts.length >= 2) {
            const term = commaParts[0].trim();
            const definition = commaParts.slice(1).join(",").trim();
            if (term && definition) {
              cards.push({ term, definition });
              processedRows++;
              return;
            }
          } else if (semicolonParts.length >= 2) {
            const term = semicolonParts[0].trim();
            const definition = semicolonParts.slice(1).join(";").trim();
            if (term && definition) {
              cards.push({ term, definition });
              processedRows++;
              return;
            }
          }
        }

        warnings.push(
          `Line ${index + 1}: Could not split into term and definition - "${trimmedLine.slice(0, 50)}${trimmedLine.length > 50 ? "..." : ""}"`,
        );
        return;
      }

      const term = parts[0].trim();
      const definition = parts.slice(1).join(delimiter).trim();

      if (!term || !definition) {
        warnings.push(`Line ${index + 1}: Empty term or definition`);
        return;
      }

      cards.push({ term, definition });
      processedRows++;
    });

    return {
      cards,
      errors,
      warnings,
      totalRows: lines.length,
      processedRows,
    };
  } catch (error) {
    console.error("Text processing error:", error);
    return {
      cards: [],
      errors: [
        error instanceof Error ? error.message : "Failed to process text file",
      ],
      warnings: [],
      totalRows: 0,
      processedRows: 0,
    };
  }
};

// Process JSON files
export const processJSONFile = async (
  file: File,
): Promise<FileProcessorResult> => {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    let cards: ProcessedCard[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Handle different JSON structures
    if (Array.isArray(data)) {
      // Array of objects
      data.forEach((item, index) => {
        if (typeof item === "object" && item !== null) {
          const term =
            item.term || item.question || item.front || item.word || "";
          const definition =
            item.definition || item.answer || item.back || item.meaning || "";

          if (term && definition) {
            cards.push({
              term: String(term).trim(),
              definition: String(definition).trim(),
            });
          } else {
            warnings.push(`Item ${index + 1}: Missing term or definition`);
          }
        } else {
          warnings.push(`Item ${index + 1}: Invalid format`);
        }
      });
    } else if (typeof data === "object" && data !== null) {
      // Object with cards property or key-value pairs
      if (data.cards && Array.isArray(data.cards)) {
        data.cards.forEach((item: any, index: number) => {
          const term = item.term || item.question || item.front || "";
          const definition = item.definition || item.answer || item.back || "";

          if (term && definition) {
            cards.push({
              term: String(term).trim(),
              definition: String(definition).trim(),
            });
          } else {
            warnings.push(`Card ${index + 1}: Missing term or definition`);
          }
        });
      } else {
        // Treat as key-value pairs
        Object.entries(data).forEach(([key, value]) => {
          if (typeof value === "string" && key && value) {
            cards.push({
              term: key.trim(),
              definition: value.trim(),
            });
          }
        });
      }
    } else {
      throw new Error("Invalid JSON structure");
    }

    return {
      cards,
      errors,
      warnings,
      totalRows: Array.isArray(data) ? data.length : Object.keys(data).length,
      processedRows: cards.length,
    };
  } catch (error) {
    console.error("JSON processing error:", error);
    return {
      cards: [],
      errors: [
        error instanceof Error ? error.message : "Failed to process JSON file",
      ],
      warnings: [],
      totalRows: 0,
      processedRows: 0,
    };
  }
};

// Common function to process 2D array data
const processArrayData = (
  data: string[][],
  mapping?: ColumnMapping,
): FileProcessorResult => {
  const cards: ProcessedCard[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  if (data.length === 0) {
    return {
      cards: [],
      errors: ["No data found"],
      warnings: [],
      totalRows: 0,
      processedRows: 0,
    };
  }

  // Determine column indices
  let termCol = 0;
  let definitionCol = 1;
  let startRow = 0;

  if (mapping) {
    termCol = typeof mapping.termColumn === "number" ? mapping.termColumn : 0;
    definitionCol =
      typeof mapping.definitionColumn === "number"
        ? mapping.definitionColumn
        : 1;
    startRow = mapping.hasHeaders ? 1 : 0;
  } else {
    // Auto-detect if first row looks like headers
    const firstRow = data[0];
    if (firstRow.length >= 2) {
      const firstCellLower = firstRow[0].toLowerCase();
      const secondCellLower = firstRow[1].toLowerCase();

      if (
        (firstCellLower.includes("term") ||
          firstCellLower.includes("question") ||
          firstCellLower.includes("word")) &&
        (secondCellLower.includes("definition") ||
          secondCellLower.includes("answer") ||
          secondCellLower.includes("meaning"))
      ) {
        startRow = 1;
      }
    }
  }

  // Process data rows
  for (let i = startRow; i < data.length; i++) {
    const row = data[i];

    if (!row || row.length === 0) {
      continue; // Skip empty rows
    }

    if (termCol >= row.length || definitionCol >= row.length) {
      warnings.push(`Row ${i + 1}: Not enough columns`);
      continue;
    }

    const term = row[termCol]?.trim() || "";
    const definition = row[definitionCol]?.trim() || "";

    if (!term && !definition) {
      continue; // Skip completely empty rows
    }

    if (!term) {
      warnings.push(`Row ${i + 1}: Empty term`);
      continue;
    }

    if (!definition) {
      warnings.push(`Row ${i + 1}: Empty definition`);
      continue;
    }

    // Check for duplicates
    const duplicate = cards.find(
      (card) => card.term.toLowerCase() === term.toLowerCase(),
    );

    if (duplicate) {
      warnings.push(`Row ${i + 1}: Duplicate term "${term}"`);
      continue;
    }

    cards.push({ term, definition });
  }

  return {
    cards,
    errors,
    warnings,
    totalRows: data.length - startRow,
    processedRows: cards.length,
  };
};

// Helper function to parse CSV line with proper quote handling
const parseCSVLine = (line: string, delimiter: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
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
};

// Auto-detect file type and process accordingly
export const processFile = async (
  file: File,
  options?: {
    delimiter?: string;
    mapping?: ColumnMapping;
  },
): Promise<FileProcessorResult> => {
  const extension = file.name.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "xlsx":
    case "xls":
      return processExcelFile(file, options?.mapping);
    case "csv":
      return processCSVFile(file, options?.delimiter || ",", options?.mapping);
    case "tsv":
      return processTSVFile(file, options?.mapping);
    case "txt":
      return processTextFile(file, options?.delimiter || "\t");
    case "json":
      return processJSONFile(file);
    default:
      // Try to process as text file
      return processTextFile(file, options?.delimiter || "\t");
  }
};

// Get supported file formats
export const getSupportedFormats = () => {
  return {
    excel: [".xlsx", ".xls"],
    csv: [".csv"],
    tsv: [".tsv"],
    text: [".txt"],
    json: [".json"],
  };
};

// Validate file before processing
export const validateFile = (
  file: File,
): { valid: boolean; error?: string } => {
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: "File size must be less than 10MB" };
  }

  // Check file type
  const extension = file.name.split(".").pop()?.toLowerCase();
  const supportedExtensions = ["xlsx", "xls", "csv", "tsv", "txt", "json"];

  if (!extension || !supportedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported file type. Supported formats: ${supportedExtensions.join(", ")}`,
    };
  }

  return { valid: true };
};
