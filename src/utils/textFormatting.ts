/**
 * Utility functions for cleaning up LaTeX, math delimiters, and special formatting artifacts
 * in AI responses for clean, human-readable medical presentation.
 */

const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  '=': '⁼',
  '(': '⁽',
  ')': '⁾',
  'n': 'ⁿ',
  'a': 'ᵃ',
  'b': 'ᵇ',
  'c': 'ᶜ',
  'd': 'ᵈ',
  'e': 'ᵉ',
};

const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
  '+': '₊',
  '-': '₋',
  '=': '₌',
  '(': '₍',
  ')': '₎',
  'a': 'ₐ',
  'e': 'ₑ',
  'o': 'ₒ',
  'x': 'ₓ',
};

function toSuperscript(str: string): string {
  return str.split('').map(char => SUPERSCRIPT_MAP[char] || char).join('');
}

function toSubscript(str: string): string {
  return str.split('').map(char => SUBSCRIPT_MAP[char] || char).join('');
}

/**
 * Sanitizes raw AI text to convert LaTeX math code, escaped symbols, and special character artifacts
 * into clean, readable Unicode representations (e.g., $\ge$ -> ≥, $\rightarrow$ -> →, $m^2$ -> m²).
 */
export function sanitizeLatexAndMath(input: string): string {
  if (!input) return '';

  let text = input;

  // 0. Unwrap display and inline math delimiters: \[ ... \], \( ... \), $$ ... $$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, ' $1 ');
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, ' $1 ');
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, ' $1 ');

  // 1. Text wrappers and LaTeX commands removal
  text = text.replace(/\\(?:text|mathrm|mathbf|mathit|textsf|mathtt|textnormal|textbf|textit)\{([^}]+)\}/g, '$1');
  text = text.replace(/\\(?:left|right)[(\[{.|)\]}]/g, '');
  text = text.replace(/\\(?:quad|qquad|thickspace|thinspace|medspace|enspace)/g, ' ');
  text = text.replace(/\\(?:vspace|hspace|vskip|hskip)\{[^}]+\}/g, '');
  text = text.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)');
  text = text.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
  text = text.replace(/\\sqrt\b/g, '√');

  // 2. Common medical units with exponents (with or without $ wrappers)
  text = text.replace(/\$?m\^\{?2\}?\$?/g, 'm²');
  text = text.replace(/\$?cm\^\{?2\}?\$?/g, 'cm²');
  text = text.replace(/\$?mm\^\{?2\}?\$?/g, 'mm²');
  text = text.replace(/\$?m\^\{?3\}?\$?/g, 'm³');
  text = text.replace(/\$?cm\^\{?3\}?\$?/g, 'cm³');
  text = text.replace(/\$?mm\^\{?3\}?\$?/g, 'mm³');
  text = text.replace(/\$?(\d+)\s*\^\s*\{?2\}?\$?/g, '$1²');
  text = text.replace(/\$?(\d+)\s*\^\s*\{?3\}?\$?/g, '$1³');

  // 3. LaTeX relational symbols & math operators (handles $\ge$, $\geq$, \ge, \geq, etc.)
  text = text.replace(/\\(?:ge|geq)\b|\$?\s*\\(?:ge|geq)\b\s*\$?|\$\s*>=\s*\$/g, ' ≥ ');
  text = text.replace(/\\(?:le|leq)\b|\$?\s*\\(?:le|leq)\b\s*\$?|\$\s*<=\s*\$/g, ' ≤ ');
  text = text.replace(/\\(?:ne|neq)\b|\$?\s*\\(?:ne|neq)\b\s*\$?|\$\s*!=\s*\$/g, ' ≠ ');
  text = text.replace(/\\approx\b|\$?\s*\\approx\b\s*\$?|\$\s*~=\s*\$/g, ' ≈ ');
  text = text.replace(/\\sim\b|\$?\s*\\sim\b\s*\$/g, ' ~ ');
  text = text.replace(/\\pm\b|\$?\s*\\pm\b\s*\$?|\$\s*\+\/-\s*\$/g, ' ± ');
  text = text.replace(/\\mp\b|\$?\s*\\mp\b\s*\$?|\$\s*-\/\+\s*\$/g, ' ∓ ');
  text = text.replace(/\\times\b|\$?\s*\\times\b\s*\$?|\$\s*\\cdot\b\s*\$/g, ' × ');
  text = text.replace(/\\div\b|\$?\s*\\div\b\s*\$/g, ' ÷ ');
  text = text.replace(/\\cdot\b/g, ' · ');
  text = text.replace(/\\bullet\b/g, ' • ');
  text = text.replace(/\\gt\b/g, ' > ');
  text = text.replace(/\\lt\b/g, ' < ');
  text = text.replace(/\$?\s*\\(?:dots|cdots|ldots)\b\s*\$?|(?:\.\s*){3,}/g, '…');

  // 4. Arrows & directions
  text = text.replace(/\\(?:rightarrow|to)\b|\$?\s*\\(?:rightarrow|to)\b\s*\$?|\$\s*->\s*\$/g, ' → ');
  text = text.replace(/\\leftarrow\b|\$?\s*\\leftarrow\b\s*\$?|\$\s*<-\s*\$/g, ' ← ');
  text = text.replace(/\\Rightarrow\b|\$?\s*\\Rightarrow\b\s*\$?|\$\s*=>\s*\$/g, ' ⇒ ');
  text = text.replace(/\\Leftarrow\b|\$?\s*\\Leftarrow\b\s*\$?|\$\s*<=\s*\$/g, ' ⇐ ');
  text = text.replace(/\\(?:leftrightarrow|iff)\b|\$?\s*\\(?:leftrightarrow|iff)\b\s*\$?|\$\s*<=>\s*\$/g, ' ↔ ');
  text = text.replace(/\\uparrow\b|\$?\s*\\uparrow\b\s*\$/g, ' ↑ ');
  text = text.replace(/\\downarrow\b|\$?\s*\\downarrow\b\s*\$/g, ' ↓ ');

  // 5. Greek letters, degrees & symbols
  text = text.replace(/\$?\s*\\mu\s*g\b\s*\$?|\$\\mu g\$/gi, 'μg');
  text = text.replace(/\\mu\b|\$?\s*\\mu\b\s*\$/g, 'μ');
  text = text.replace(/\\alpha\b|\$?\s*\\alpha\b\s*\$/g, 'α');
  text = text.replace(/\\beta\b|\$?\s*\\beta\b\s*\$/g, 'β');
  text = text.replace(/\\gamma\b|\$?\s*\\gamma\b\s*\$/g, 'γ');
  text = text.replace(/\\delta\b|\$?\s*\\delta\b\s*\$/g, 'δ');
  text = text.replace(/\\Delta\b|\$?\s*\\Delta\b\s*\$/g, 'Δ');
  text = text.replace(/\\theta\b|\$?\s*\\theta\b\s*\$/g, 'θ');
  text = text.replace(/\\lambda\b|\$?\s*\\lambda\b\s*\$/g, 'λ');
  text = text.replace(/\\sigma\b|\$?\s*\\sigma\b\s*\$/g, 'σ');
  text = text.replace(/\\Sigma\b|\$?\s*\\Sigma\b\s*\$/g, 'Σ');
  text = text.replace(/\\pi\b|\$?\s*\\pi\b\s*\$/g, 'π');
  text = text.replace(/\\infty\b|\$?\s*\\infty\b\s*\$/g, '∞');
  text = text.replace(/\$?\s*(?:\\degree|\^\\circ|\^\{\\circ\}|\\circ)\s*\$?|\$^\circ\$/g, '°');

  // 6. Common clinical and blood gas notation
  text = text.replace(/\bPaO_\{?2\}?\b/g, 'PaO₂');
  text = text.replace(/\bPaCO_\{?2\}?\b/g, 'PaCO₂');
  text = text.replace(/\bPvO_\{?2\}?\b/g, 'PvO₂');
  text = text.replace(/\bSaO_\{?2\}?\b/g, 'SaO₂');
  text = text.replace(/\bSpO_\{?2\}?\b/g, 'SpO₂');
  text = text.replace(/\bFiO_\{?2\}?\b/g, 'FiO₂');
  text = text.replace(/\bHCO_\{?3\}?\^?\{?-?\}?/g, 'HCO₃⁻');
  text = text.replace(/\bCa\^\{?2\+?\}?/g, 'Ca²⁺');
  text = text.replace(/\bNa\^\{?\+?\}?/g, 'Na⁺');
  text = text.replace(/\bK\^\{?\+?\}?/g, 'K⁺');
  text = text.replace(/\bMg\^\{?2\+?\}?/g, 'Mg²⁺');
  text = text.replace(/\bCl\^\{?-?\}?/g, 'Cl⁻');
  text = text.replace(/\bH\^\{?\+?\}?/g, 'H⁺');
  text = text.replace(/\bCO_\{?2\}?\b/g, 'CO₂');
  text = text.replace(/\bH_\{?2\}?O\b/g, 'H₂O');

  // 7. Generic Superscripts and Subscripts
  text = text.replace(/\^\{([0-9+\-()=n]+)\}/g, (_, exp) => toSuperscript(exp));
  text = text.replace(/\^([0-9n])/g, (_, exp) => toSuperscript(exp));
  text = text.replace(/_\{([0-9+\-()=]+)\}/g, (_, sub) => toSubscript(sub));
  text = text.replace(/_([0-9])/g, (_, sub) => toSubscript(sub));
  // Clean text subscript braces like V_{max} -> Vmax or K_{m} -> Km
  text = text.replace(/_\{([a-zA-Z]+)\}/g, '$1');

  // 8. Strip leftover single or double dollar signs around simple math / phrases
  text = text.replace(/\$([^$\n]+)\$/g, '$1');

  // 9. Stray backslashes before punctuation or words
  text = text.replace(/\\([%$&_#><])/g, '$1');

  // 10. Clean up duplicate spaces and trailing broken artifacts like "m^2$" or "$m^2"
  text = text.replace(/[ \t]{2,}/g, ' ');
  text = text.replace(/m\^2/g, 'm²');
  text = text.replace(/cm\^2/g, 'cm²');
  text = text.replace(/mm\^2/g, 'mm²');
  text = text.replace(/m\^3/g, 'm³');

  return text.trim();
}
