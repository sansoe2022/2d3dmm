/**
 * Myanmar 2D/3D Lottery Betting Parser (Cloudflare Worker version)
 */

function getReverseNumber(num: string): string {
  if (num.length !== 2) return num;
  return num[1] + num[0];
}

function get3DPermutations(num: string): string[] {
  if (num.length !== 3) return [num];
  const digits = num.split('');
  const permutations = new Set<string>();
  const permuteHelper = (arr: string[], start: number) => {
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

function parseSegment(segment: string, type: '2D' | '3D') {
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

  let numbers: string[];
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

export function parseBettingText(text: string, type: '2D' | '3D' = '2D') {
  const entries: { number: string; amount: number }[] = [];
  const errors: string[] = [];
  const aggregated = new Map<string, number>();

  const lines = text.split('\n');
  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    const segments = trimmedLine.split(/[,၊]+/).map(s => s.trim()).filter(Boolean);

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
    entries.push({ number, amount: aggregated.get(number)! });
  });

  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);
  return { entries, totalAmount, errors };
}

export function formatAmount(amount: number) {
  return amount.toLocaleString('en-US');
}
