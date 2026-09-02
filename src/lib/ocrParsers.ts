// Heuristic best-effort extraction from raw OCR text. These are guesses meant to
// pre-fill a form the user still reviews before submitting — never trusted as-is.

const HAS_TEXT = /[A-Za-z぀-ヿ一-鿿À-ɏ]/;
const MONEY = /[\$¥€]?\s?(\d{1,3}(?:[,.]\d{3})*(?:\.\d{1,2})?)/g;

function largestAmount(text: string): number | null {
  const amounts: number[] = [];
  for (const match of text.matchAll(MONEY)) {
    const n = parseFloat(match[1].replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0) amounts.push(n);
  }
  return amounts.length ? Math.max(...amounts) : null;
}

export interface ReceiptGuess {
  vendorName?: string;
  amount?: string;
}

export function parseReceiptText(text: string): ReceiptGuess {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const vendorName = lines.find((l) => HAS_TEXT.test(l) && l.length <= 40 && !/^\d/.test(l));

  const totalMatch = text.match(/(?:total|合計|お会計|amount due)[^\d]{0,10}([\d,]+\.?\d{0,2})/i);
  const amount = totalMatch ? totalMatch[1].replace(/,/g, "") : largestAmount(text)?.toString();

  return { vendorName, amount };
}

export interface IngredientLabelGuess {
  name?: string;
  vendorName?: string;
  purchasePrice?: string;
  purchaseQty?: string;
}

const QTY_UNIT = /(\d+(?:\.\d+)?)\s?(lb|lbs|oz|kg|g|gal|qt|pt|cup|l|ml|each|ea|case|pack)\b/i;

export function parseIngredientLabelText(text: string): IngredientLabelGuess {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Invoices/price tags often lead with a letterhead-style vendor name, then the
  // item further down — a single-line shelf tag has no vendor at all.
  const textLines = lines.filter((l) => HAS_TEXT.test(l) && l.length <= 40 && !/^[\$¥€]/.test(l) && !/^\d/.test(l));
  const vendorName = textLines.length > 1 ? textLines[0] : undefined;
  const name = textLines.length > 1 ? textLines[1] : textLines[0];

  const priceMatch = text.match(/[\$¥€]\s?(\d+(?:\.\d{1,2})?)/);
  const purchasePrice = priceMatch ? priceMatch[1] : largestAmount(text)?.toString();

  const qtyMatch = text.match(QTY_UNIT);
  const purchaseQty = qtyMatch ? qtyMatch[1] : undefined;

  return { name, vendorName, purchasePrice, purchaseQty };
}
