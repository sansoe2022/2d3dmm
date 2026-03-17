/**
 * Myanmar 2D/3D Lottery Betting Parser (Node.js backend version)
 * Mirrors the logic in client/src/lib/bettingParser.ts
 */

/**
 * Get the reverse/mirror of a 2-digit number
 * E.g., 12 -> 21, 47 -> 74, 11 -> 11 (same)
 */
function getReverseNumber(num) {
  if (num.length !== 2) return num;
  return num[1] + num[0];
}

/**
 * Get all permutations of 3 digits
 */
function get3DPermutations(num) {
  if (num.length !== 3) return [num];
  const digits = num.split('');
  const permutations = new Set();
  const permuteHelper = (arr, start) => {
    if (start === arr.length - 1) {
      permutations.add(arr.join(''));
      return;
    }
    for (let i = start; i < arr.length; i++) {
      [arr[start], arr[i]] = [arr[i], arr[start]];
      permuteHelper(arr, start + 1);
      [arr[start], arr[i]] = [arr[i], arr[start]];
    }
  };
  permuteHelper([...digits], 0);
  return Array.from(permutations).sort();
}

/**
 * Parse a single segment (e.g., "12 500 ks" or "34 1000R")
 */
function parseSegment(segment, type) {
  if (!segment || segment.trim().length === 0) {
    return { success: false, numbers: null, amount: null, error: null };
  }

  const hasReverse = /R\s*$/i.test(segment);
  let cleaned = segment
    .trim()
    .replace(/\s*R\s*$/i, '')
    .replace(/\s*(ks|k|တင်း|kyat|kyats)\s*$/i, '')
    .trim();

  const digitPattern = type === '3D' ? '\\d{3}' : '\\d{1,2}';
  const match = cleaned.match(new RegExp(`^(${digitPattern})\\s+(\\d+)$`));

  if (!match) {
    const altMatch = cleaned.match(new RegExp(`^(${digitPattern})-(\\d+)$`));
    if (!altMatch) {
      return {
        success: false,
        numbers: null,
        amount: null,
        error: `Invalid format: "${segment}"`,
      };
    }
    const number = type === '3D' ? altMatch[1] : altMatch[1].padStart(2, '0');
    const amount = parseInt(altMatch[2], 10);
    const numbers = hasReverse && type === '3D' ? get3DPermutations(number) : [number];
    return { success: true, numbers, amount, error: null };
  }

  const number = type === '3D' ? match[1] : match[1].padStart(2, '0');
  const amount = parseInt(match[2], 10);

  if (isNaN(amount) || amount <= 0) {
    return { success: false, numbers: null, amount: null, error: `Invalid amount: "${match[2]}"` };
  }

  let numbers;
  if (hasReverse) {
    if (type === '3D') {
      numbers = get3DPermutations(number);
    } else {
      const reverseNum = getReverseNumber(number);
      numbers = reverseNum !== number ? [number, reverseNum] : [number];
    }
  } else {
    numbers = [number];
  }

  return { success: true, numbers, amount, error: null };
}

/**
 * Parse a full betting text block
 * @param {string} text
 * @param {'2D'|'3D'} type
 * @returns {{ entries: Array<{number: string, amount: number}>, totalAmount: number, errors: string[] }}
 */
function parseBettingText(text, type = '2D') {
  const entries = [];
  const errors = [];
  const aggregated = new Map();

  const lines = text.split('\n');
  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    // Each line can have multiple segments separated by commas or spaces
    const segments = trimmedLine.split(/[,،]+/).map(s => s.trim()).filter(Boolean);

    segments.forEach(segment => {
      const result = parseSegment(segment, type);
      if (result.success && result.numbers && result.amount) {
        result.numbers.forEach(num => {
          const currentAmount = aggregated.get(num) || 0;
          aggregated.set(num, currentAmount + result.amount);
        });
      } else if (!result.success && result.error) {
        errors.push(`Line ${lineIndex + 1}: ${result.error}`);
      }
    });
  });

  const sortedNumbers = Array.from(aggregated.keys()).sort((a, b) => parseInt(a) - parseInt(b));
  sortedNumbers.forEach(number => {
    entries.push({ number, amount: aggregated.get(number) });
  });

  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);
  return { entries, totalAmount, errors };
}

/**
 * Format amount with commas
 */
function formatAmount(amount) {
  return amount.toLocaleString('en-US');
}

module.exports = { parseBettingText, formatAmount };
