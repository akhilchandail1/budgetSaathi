/**
 * Safe arithmetic expression evaluator for the amount field.
 * Supports +, -, *, /, parentheses, and decimals — no eval().
 * Returns null when the expression is empty or invalid.
 */
export function evaluateAmount(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (!/^[0-9+\-*/().\s]+$/.test(trimmed)) return null;

  try {
    const tokens = tokenize(trimmed);
    const { value, index } = parseExpression(tokens, 0);
    if (index !== tokens.length) return null;
    if (!Number.isFinite(value)) return null;
    return Math.round(value * 100) / 100;
  } catch {
    return null;
  }
}

type Token = { type: "num"; value: number } | { type: "op"; value: string };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let num = "";
      while (i < input.length && /[0-9.]/.test(input[i])) {
        num += input[i];
        i++;
      }
      if ((num.match(/\./g)?.length ?? 0) > 1) throw new Error("bad number");
      tokens.push({ type: "num", value: parseFloat(num) });
      continue;
    }
    if ("+-*/()".includes(ch)) {
      tokens.push({ type: "op", value: ch });
      i++;
      continue;
    }
    throw new Error(`unexpected character: ${ch}`);
  }
  return tokens;
}

function parseExpression(tokens: Token[], index: number): { value: number; index: number } {
  let { value, index: i } = parseTerm(tokens, index);
  while (i < tokens.length && tokens[i].type === "op" && (tokens[i].value === "+" || tokens[i].value === "-")) {
    const op = tokens[i].value;
    const rhs = parseTerm(tokens, i + 1);
    value = op === "+" ? value + rhs.value : value - rhs.value;
    i = rhs.index;
  }
  return { value, index: i };
}

function parseTerm(tokens: Token[], index: number): { value: number; index: number } {
  let { value, index: i } = parseFactor(tokens, index);
  while (i < tokens.length && tokens[i].type === "op" && (tokens[i].value === "*" || tokens[i].value === "/")) {
    const op = tokens[i].value;
    const rhs = parseFactor(tokens, i + 1);
    if (op === "/" && rhs.value === 0) throw new Error("division by zero");
    value = op === "*" ? value * rhs.value : value / rhs.value;
    i = rhs.index;
  }
  return { value, index: i };
}

function parseFactor(tokens: Token[], index: number): { value: number; index: number } {
  const token = tokens[index];
  if (!token) throw new Error("unexpected end of expression");

  if (token.type === "op" && token.value === "-") {
    const inner = parseFactor(tokens, index + 1);
    return { value: -inner.value, index: inner.index };
  }
  if (token.type === "op" && token.value === "+") {
    return parseFactor(tokens, index + 1);
  }
  if (token.type === "op" && token.value === "(") {
    const inner = parseExpression(tokens, index + 1);
    const closing = tokens[inner.index];
    if (!closing || closing.type !== "op" || closing.value !== ")") {
      throw new Error("missing closing parenthesis");
    }
    return { value: inner.value, index: inner.index + 1 };
  }
  if (token.type === "num") {
    return { value: token.value, index: index + 1 };
  }
  throw new Error("unexpected token");
}
