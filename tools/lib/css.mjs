// Разбор CSS для проверок токенов: общий для линтера (CSS продуктов) и снимка (CSS компонентов).
//
// Цвет числом или именем ищется только в значениях свойств, не в селекторах:
//   #hex, rgb()/hsl()/hwb()/lab()/lch()/oklab()/oklch()/color(),
//   color-mix() с литеральным цветом внутри, именованные цвета (red, white…).
// transparent и currentColor — не цвет бренда, их можно.
// Позиции — в той же строке, что пришла на вход: комментарии гасите заранее с сохранением длины.

export const NAMED_COLORS = new Set(("aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood " +
  "cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey " +
  "darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey " +
  "darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite " +
  "gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon " +
  "lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue " +
  "lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid " +
  "mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin " +
  "navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff " +
  "peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver " +
  "skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen").split(" "));

// свойства, где слово — не цвет: шрифты, имена анимаций, области сетки, текст
const NOT_COLOR_PROPS = /^(font|font-family|content|quotes|grid-area|grid-template-areas|grid-template|animation|animation-name|transition|transition-property|will-change|counter-reset|counter-increment|list-style|list-style-type|text-transform)$/i;
const COLOR_FN = /(?<![\w-])(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/gi;

// конец скобки, открытой на позиции open (src[open] === "(")
function closeParen(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "(") depth++;
    else if (src[i] === ")" && --depth === 0) return i;
  }
  return src.length - 1;
}
// заменить пробелами содержимое var(...), url(...) и строк в кавычках — длина сохраняется
function blankRefs(v) {
  let out = v.replace(/"[^"]*"|'[^']*'/g, (m) => " ".repeat(m.length));
  for (const re of [/(?<![\w-])var\(/gi, /(?<![\w-])url\(/gi]) {
    let m;
    while ((m = re.exec(out))) {
      const open = m.index + m[0].length - 1;
      const close = closeParen(out, open);
      out = out.slice(0, m.index) + " ".repeat(close - m.index + 1) + out.slice(close + 1);
    }
  }
  return out;
}
function literalColorsIn(value) {
  const v = blankRefs(value);
  const out = [];
  for (const m of v.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) out.push({ index: m.index, text: m[0] });
  for (const m of v.matchAll(COLOR_FN)) out.push({ index: m.index, text: value.slice(m.index, closeParen(value, m.index + m[0].length - 1) + 1) });
  for (const m of v.matchAll(/(?<![\w-])([a-zA-Z]+)(?![\w-])/g)) if (NAMED_COLORS.has(m[1].toLowerCase())) out.push({ index: m.index, text: m[1] });
  return out;
}

// [{ index, text }] — литеральные цвета в значениях свойств
export function colorLiterals(src) {
  const out = [];
  for (const d of src.matchAll(/([-\w]+)\s*:([^;{}]*)(?=[;}])/g)) {
    if (NOT_COLOR_PROPS.test(d[1])) continue;
    const start = d.index + d[0].length - d[2].length;
    const value = d[2];
    const found = [];
    // color-mix(): нарушение, только если внутри литеральный цвет; сами по себе токены в нём можно
    let rest = value;
    for (const m of value.matchAll(/(?<![\w-])color-mix\(/gi)) {
      const open = m.index + m[0].length - 1;
      const close = closeParen(value, open);
      const inner = value.slice(open + 1, close);
      if (literalColorsIn(inner).length) found.push({ index: m.index, text: value.slice(m.index, close + 1) });
      rest = rest.slice(0, m.index) + " ".repeat(close - m.index + 1) + rest.slice(close + 1);
    }
    found.push(...literalColorsIn(rest));
    for (const f of found) out.push({ index: start + f.index, text: f.text });
  }
  return out.sort((a, b) => a.index - b.index);
}

// [{ index, name }] — ссылки var(--x), в том числе с пробелом после скобки
export function varRefs(src) {
  return [...src.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => ({ index: m.index, name: m[1] }));
}
