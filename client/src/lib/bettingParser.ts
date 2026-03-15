/**
 * Myanmar 2D/3D Lottery Betting Parser
 * 
 * Parses various Myanmar 2D/3D betting formats:
 * 2D: "12 500", "34 1000 ks", "56 500 k", "78 1000 တင်း", "90 2000"
 * 3D: "123 500", "456 1000 ks", "789 500R" (all permutations)
 * - Handles multiple entries per line (separated by commas or spaces)
 * - Aggregates duplicate numbers by summing amounts
 * - For 3D R format: generates all permutations of the digits
 */

export type BettingType = "2D" | "3D";

export interface BettingEntry {
  number: string;
  amount: number;
}

export interface ParsedBetting {
  entries: BettingEntry[];
  totalAmount: number;
  uniqueNumbers: number;
  errors: string[];
  type: BettingType;
}

/**
 * Parse raw betting text and extract 2D or 3D numbers with their amounts
 * Supports multiple Myanmar currency formats and flexible spacing
 */
export function parseBettingText(text: string, type: BettingType = "2D"): ParsedBetting {
  const errors: string[] = [];
  const entries: BettingEntry[] = [];
  const aggregated = new Map<string, number>();

  if (!text || text.trim().length === 0) {
    return {
      entries: [],
      totalAmount: 0,
      uniqueNumbers: 0,
      errors: [],
      type,
    };
  }

  // Split by newlines first to process line by line
  const lines = text.split(/[\n\r]+/).filter((line) => line.trim().length > 0);

  lines.forEach((line, lineIndex) => {
    // Split each line by common delimiters (comma, semicolon, or multiple spaces)
    const segments = line
      .split(/[,;]|(?:\s{2,})/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    segments.forEach((segment) => {
      const result = parseSegment(segment, type);

      if (result.success && result.numbers && result.amount !== null) {
        // For 3D R format, result.numbers will be an array of all permutations
        result.numbers.forEach((num) => {
          const currentAmount = aggregated.get(num) || 0;
          aggregated.set(num, currentAmount + (result.amount || 0));
        });
      } else if (!result.success && result.error) {
        errors.push(`Line ${lineIndex + 1}: ${result.error}`);
      }
    });
  });

  // Convert aggregated map to sorted entries
  const sortedNumbers = Array.from(aggregated.keys()).sort((a, b) => {
    const aNum = parseInt(a);
    const bNum = parseInt(b);
    return aNum - bNum;
  });

  sortedNumbers.forEach((number) => {
    entries.push({
      number,
      amount: aggregated.get(number) || 0,
    });
  });

  const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);

  return {
    entries,
    totalAmount,
    uniqueNumbers: entries.length,
    errors,
    type,
  };
}

/**
 * Get the reverse/mirror of a 2-digit number
 * E.g., 12 -> 21, 47 -> 74, 11 -> 11 (same)
 */
function getReverseNumber(num: string): string {
  if (num.length !== 2) return num;
  return num[1] + num[0];
}

/**
 * Get all permutations of 3 digits
 * E.g., "123" -> ["123", "132", "213", "231", "312", "321"]
 * Deduplicates if digits are the same (e.g., "111" -> ["111"])
 */
function get3DPermutations(num: string): string[] {
  if (num.length !== 3) return [num];
  
  const digits = num.split("");
  const permutations = new Set<string>();
  
  // Generate all permutations
  const permuteHelper = (arr: string[], start: number) => {
    if (start === arr.length - 1) {
      permutations.add(arr.join(""));
      return;
    }
    
    for (let i = start; i < arr.length; i++) {
      // Swap
      [arr[start], arr[i]] = [arr[i], arr[start]];
      permuteHelper(arr, start + 1);
      // Swap back
      [arr[start], arr[i]] = [arr[i], arr[start]];
    }
  };
  
  permuteHelper([...digits], 0);
  return Array.from(permutations).sort();
}

/**
 * Parse a single segment (e.g., "12 500 ks" or "34 1000R" for 2D, or "123 500" or "456 1000R" for 3D)
 * Returns { success, numbers, amount, error }
 */
function parseSegment(segment: string, type: BettingType): {
  success: boolean;
  numbers: string[] | null;
  amount: number | null;
  error: string | null;
} {
  if (!segment || segment.trim().length === 0) {
    return { success: false, numbers: null, amount: null, error: null };
  }

  // Check for R suffix (reverse/mirror format)
  const hasReverse = /R\s*$/i.test(segment);
  
  // Remove R suffix if present
  let cleaned = segment
    .trim()
    .replace(/\s*R\s*$/i, "")
    // Remove Myanmar currency markers (ks, k, တင်း, etc.)
    .replace(/\s*(ks|k|တင်း|kyat|kyats)\s*$/i, "")
    .trim();

  // Determine expected digit count based on type
  const digitCount = type === "3D" ? 3 : 2;
  const digitPattern = type === "3D" ? "\\d{3}" : "\\d{1,2}";
  
  // Try to extract number and amount using regex
  // Pattern: digit(s) followed by whitespace and amount
  const match = cleaned.match(new RegExp(`^(${digitPattern})\\s+(\\d+)$`));

  if (!match) {
    // Try alternative pattern: number-amount without space
    const altMatch = cleaned.match(new RegExp(`^(${digitPattern})-(\\d+)$`));
    if (!altMatch) {
      const expected = type === "3D" ? "\"NNN AMOUNT\"" : "\"NN AMOUNT\"";
      return {
        success: false,
        numbers: null,
        amount: null,
        error: `Invalid format: "${segment}" (expected ${expected})`,
      };
    }
    const number = type === "3D" ? altMatch[1] : altMatch[1].padStart(2, "0");
    const amount = parseInt(altMatch[2], 10);
    const numbers = hasReverse && type === "3D" ? get3DPermutations(number) : [number];
    return { success: true, numbers, amount, error: null };
  }

  const number = type === "3D" ? match[1] : match[1].padStart(2, "0");
  const amount = parseInt(match[2], 10);

  if (isNaN(amount) || amount <= 0) {
    return {
      success: false,
      numbers: null,
      amount: null,
      error: `Invalid amount: "${match[2]}" (must be positive number)`,
    };
  }

  // Handle reverse format
  let numbers: string[];
  if (hasReverse) {
    if (type === "3D") {
      // For 3D R format, get all permutations
      numbers = get3DPermutations(number);
    } else {
      // For 2D R format, get reverse number
      const reverseNum = getReverseNumber(number);
      // Only add reverse if it's different from the original number
      numbers = reverseNum !== number ? [number, reverseNum] : [number];
    }
  } else {
    numbers = [number];
  }

  return { success: true, numbers, amount, error: null };
}

/**
 * Format amount as Myanmar currency string
 */
export function formatAmount(amount: number | undefined | null): string {
  if (amount === null || amount === undefined) return "0";
  return amount.toLocaleString("en-US");
}

/**
 * Format number as 2-digit or 3-digit string
 */
export function formatNumber(num: string | number, type: BettingType = "2D"): string {
  const numStr = typeof num === "number" ? num.toString() : num;
  const padLength = type === "3D" ? 3 : 2;
  return numStr.padStart(padLength, "0");
}
