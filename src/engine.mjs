/** Offline, deliberately bounded subset of Power Automate/Workflow Definition Language.
 * Never runs user supplied JavaScript or makes a network request.
 */
export class ExpressionError extends Error {
  constructor(message, position = null) { super(message); this.name = 'ExpressionError'; this.position = position; }
}
const MAX_EXPRESSION = 50_000, MAX_DEPTH = 64, MAX_CALLS = 2_000;
const denyKeys = new Set(['__proto__', 'prototype', 'constructor']);
const owns = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
function display(value) { return value == null ? '' : typeof value === 'string' ? value : JSON.stringify(value); }
function assertArgs(name, values, min, max = min) {
  if (values.length < min || (max !== Infinity && values.length > max)) throw new ExpressionError(`${name}() requires ${min === max ? min : `${min}–${max === Infinity ? 'many' : max}`} argument(s); received ${values.length}.`);
}
function finite(value, name) { const x = typeof value === 'number' ? value : Number(value); if (!Number.isFinite(x) || value === '' || value === null) throw new ExpressionError(`${name}() requires a valid number.`); return x; }
function integer(value, name) { const n = finite(value, name); if (!Number.isInteger(n)) throw new ExpressionError(`${name}() requires an integer.`); return n; }
function str(value) { return display(value); }
function type(value) { return value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value; }
function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b) || (a == null && b === ''); }
function property(value, key, safe = false) {
  if (typeof key !== 'string' && typeof key !== 'number') throw new ExpressionError('Property access expects a string or array index.');
  if (denyKeys.has(String(key))) throw new ExpressionError('This property name is not available in the lab.');
  if (value == null) { if (safe) return null; throw new ExpressionError(`Cannot access [${JSON.stringify(key)}] on null.`); }
  if (Array.isArray(value) || typeof value === 'string') {
    if (key === 'length') return value.length;
    const idx = typeof key === 'number' ? key : /^\d+$/.test(key) ? Number(key) : -1;
    if (idx < 0 || idx >= value.length) return safe ? null : null;
    return value[idx];
  }
  if (typeof value !== 'object') throw new ExpressionError('Cannot access a property on a scalar value.');
  return owns(value, key) ? value[key] : null;
}
function tokenize(expression) {
  const tokens = []; let i = 0;
  while (i < expression.length) {
    const c = expression[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "'") {
      const start = i++; let value = ''; let closed = false;
      while (i < expression.length) {
        if (expression[i] === "'") {
          if (expression[i + 1] === "'") { value += "'"; i += 2; }
          else { i++; closed = true; break; }
        } else value += expression[i++];
      }
      if (!closed) throw new ExpressionError('Unclosed string. Use two single quotes for an apostrophe.', start);
      tokens.push({ type: 'string', value, pos: start }); continue;
    }
    const num = expression.slice(i).match(/^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/);
    if (num) { tokens.push({ type: 'number', value: Number(num[0]), pos: i }); i += num[0].length; continue; }
    const id = expression.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (id) { tokens.push({ type: 'identifier', value: id[0], pos: i }); i += id[0].length; continue; }
    if (['(', ')', ',', '[', ']', '?', '.'].includes(c)) { tokens.push({ type: c, pos: i }); i++; continue; }
    throw new ExpressionError(`Unexpected character “${c}”.`, i);
  }
  tokens.push({ type: 'eof', pos: i }); return tokens;
}
function parse(source) {
  const tokens = tokenize(source); let index = 0, depth = 0;
  function peek() { return tokens[index]; }
  function consume(expected) { const t = tokens[index]; if (expected && t.type !== expected) throw new ExpressionError(`Expected “${expected}” but found “${t.type}”.`, t.pos); index++; return t; }
  function expr() {
    if (++depth > MAX_DEPTH) throw new ExpressionError('Expression nesting is too deep.');
    let node; const t = consume();
    if (t.type === 'string' || t.type === 'number') node = { kind: 'literal', value: t.value };
    else if (t.type === 'identifier') {
      if (/^(true|false|null)$/i.test(t.value)) node = { kind: 'literal', value: t.value.toLowerCase() === 'null' ? null : t.value.toLowerCase() === 'true' };
      else if (peek().type === '(') {
        consume('('); const args = [];
        if (peek().type !== ')') {
          do { args.push(expr()); if (peek().type !== ',') break; consume(','); } while (true);
        }
        consume(')'); node = { kind: 'call', name: t.value, args };
      } else throw new ExpressionError(`Unknown identifier “${t.value}”. Did you mean ${t.value}(...)?`, t.pos);
    } else throw new ExpressionError('Expected a string, number, keyword or function call.', t.pos);
    while (['[', '?', '.'].includes(peek().type)) {
      let safe = false;
      if (peek().type === '?') { consume('?'); safe = true; }
      if (peek().type === '.') { consume('.'); node = { kind: 'property', source: node, key: { kind: 'literal', value: consume('identifier').value }, safe }; }
      else { consume('['); const key = expr(); consume(']'); node = { kind: 'property', source: node, key, safe }; }
    }
    depth--; return node;
  }
  const result = expr();
  if (peek().type !== 'eof') throw new ExpressionError('Unexpected trailing expression content.', peek().pos);
  return result;
}
function datestring(input, operation) { const d = new Date(str(input)); if (Number.isNaN(d.getTime())) throw new ExpressionError(`${operation}() received an invalid date.`); return d; }
function formatUtc(date, fmt) {
  const d = datestring(date, 'formatDateTime');
  const pad = n => String(n).padStart(2, '0');
  const parts = { yyyy: String(d.getUTCFullYear()), MM: pad(d.getUTCMonth()+1), dd: pad(d.getUTCDate()), HH: pad(d.getUTCHours()), mm: pad(d.getUTCMinutes()), ss: pad(d.getUTCSeconds()), fff: String(d.getUTCMilliseconds()).padStart(3,'0'), 'K': 'Z' };
  if (!fmt || fmt === 'o' || fmt === 'O') return d.toISOString();
  if (fmt === 's') return d.toISOString().slice(0,19);
  if (fmt === 'd') return `${parts.MM}/${parts.dd}/${parts.yyyy}`;
  // Not a comprehensive .NET format string implementation. Reject unknown letter tokens.
  const pattern = /'[^']*'|([A-Za-z])\1*|[^A-Za-z']+/g;
  const chunks = fmt.match(pattern) || [];
  if (chunks.join('') !== fmt || chunks.some(x => /^[A-Za-z]+$/.test(x) && !(x in parts))) throw new ExpressionError('This date format token is not supported in the local lab. Test it in a flow.');
  return chunks.map(x => x.startsWith("'") ? x.slice(1,-1) : (parts[x] ?? x)).join('');
}
function createRuntime(context = {}) {
  let calls = 0; const now = owns(context, 'now') ? context.now : new Date().toISOString();
  function resolveAction(name, part) { const v = property(context.actions ?? {}, name); return v == null ? null : (part === 'body' ? (owns(v, 'body') ? v.body : property(v, 'outputs', true)?.body ?? null) : (owns(v, 'outputs') ? v.outputs : v)); }
  const fn = Object.create(null);
  const add = (name, min, max, implementation) => {
    fn[name.toLowerCase()] = args => { assertArgs(name, args, min, max); return implementation(...args); };
  };
  // String
  add('concat', 1, Infinity, (...xs) => xs.map(str).join(''));
  add('toLower', 1, 1, v => str(v).toLowerCase());
  add('toUpper', 1, 1, v => str(v).toUpperCase());
  add('trim', 1, 1, v => str(v).trim());
  add('replace', 3, 3, (s, find, replacement) => str(s).split(str(find)).join(str(replacement)));
  add('split', 2, 2, (s, delim) => str(s).split(str(delim)));
  add('join', 2, 2, (arr, sep) => { if (!Array.isArray(arr)) throw new ExpressionError('join() requires an array.'); return arr.map(str).join(str(sep)); });
  add('substring', 2, 3, (s, from, length) => { const t = str(s), start = integer(from,'substring'); if (start < 0 || start > t.length || (length != null && (integer(length,'substring') < 0 || start + length > t.length))) throw new ExpressionError('substring() index or length is outside the string.'); return t.substr(start, length === undefined ? undefined : length); });
  add('slice', 2, 3, (s, start, end) => { if (typeof s !== 'string' && !Array.isArray(s)) throw new ExpressionError('slice() requires a string or array.'); return s.slice(integer(start,'slice'), end === undefined ? undefined : integer(end,'slice')); });
  add('startsWith', 2, 2, (a, b) => str(a).toLowerCase().startsWith(str(b).toLowerCase()));
  add('endsWith', 2, 2, (a, b) => str(a).toLowerCase().endsWith(str(b).toLowerCase()));
  add('indexOf', 2, 2, (a, b) => str(a).toLowerCase().indexOf(str(b).toLowerCase()));
  add('lastIndexOf', 2, 2, (a, b) => str(a).toLowerCase().lastIndexOf(str(b).toLowerCase()));
  add('length', 1, 1, v => { if (typeof v !== 'string' && !Array.isArray(v)) throw new ExpressionError('length() requires a string or array.'); return v.length; });
  // Collections
  add('first', 1, 1, v => { if (!Array.isArray(v) && typeof v !== 'string') throw new ExpressionError('first() requires an array or string.'); return v[0] ?? null; });
  add('last', 1, 1, v => { if (!Array.isArray(v) && typeof v !== 'string') throw new ExpressionError('last() requires an array or string.'); return v[v.length-1] ?? null; });
  add('empty', 1, 1, v => v == null || v === '' || (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && Object.keys(v).length === 0));
  add('contains', 2, 2, (v, needle) => typeof v === 'string' ? v.toLowerCase().includes(str(needle).toLowerCase()) : Array.isArray(v) ? v.some(x=>eq(x,needle)) : v !== null && typeof v === 'object' ? owns(v, str(needle)) : false);
  add('take', 2, 2, (v, count) => { if (typeof v !== 'string' && !Array.isArray(v)) throw new ExpressionError('take() expects an array or string.'); return v.slice(0,Math.max(0,integer(count,'take'))); });
  add('skip', 2, 2, (v, count) => { if (typeof v !== 'string' && !Array.isArray(v)) throw new ExpressionError('skip() expects an array or string.'); return v.slice(Math.max(0,integer(count,'skip'))); });
  add('reverse', 1, 1, v => Array.isArray(v) ? [...v].reverse() : [...str(v)].reverse().join(''));
  add('createArray', 1, Infinity, (...vs) => vs);
  add('array', 1, 1, v => Array.isArray(v) ? v : [v]);
  add('union', 2, Infinity, (...arrays) => { if (!arrays.every(Array.isArray)) throw new ExpressionError('union() requires arrays.'); return arrays.flat().filter((v,i,all)=>all.findIndex(x=>eq(x,v))===i); });
  add('intersection', 2, Infinity, (...arrays) => { if (!arrays.every(Array.isArray)) throw new ExpressionError('intersection() requires arrays.'); return arrays[0].filter((v,i,all)=>all.findIndex(x=>eq(x,v))===i && arrays.slice(1).every(a=>a.some(x=>eq(x,v)))); });
  // Conversion
  add('string', 1, 1, v => v === null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v));
  add('int', 1, 1, v => { if (!/^[+-]?\d+$/.test(str(v).trim())) throw new ExpressionError('int() could not convert the value.'); return integer(str(v).trim(),'int'); });
  add('float', 1, 1, v => finite(v,'float'));
  add('bool', 1, 1, v => { if (v === true || str(v).toLowerCase() === 'true' || v === 1) return true; if (v === false || str(v).toLowerCase() === 'false' || v === 0) return false; throw new ExpressionError('bool() expects true or false.'); });
  add('json', 1, 1, v => { if (typeof v !== 'string') return v; try { return JSON.parse(v); } catch { throw new ExpressionError('json() expects valid JSON text.'); } });
  add('isInt', 1, 1, v => typeof v === 'string' && /^[-+]?\d+$/.test(v.trim()));
  add('isFloat', 1, 1, v => typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)));
  add('coalesce', 1, Infinity, (...vs) => vs.find(x => x !== null && x !== undefined) ?? null);
  add('encodeUriComponent', 1, 1, v => encodeURIComponent(str(v)));
  add('decodeUriComponent', 1, 1, v => { try {return decodeURIComponent(str(v));} catch {throw new ExpressionError('Invalid URI encoding.');} });
  // Math
  add('add', 2, 2, (a,b)=>finite(a,'add')+finite(b,'add'));
  add('sub', 2, 2, (a,b)=>finite(a,'sub')-finite(b,'sub'));
  add('mul', 2, 2, (a,b)=>finite(a,'mul')*finite(b,'mul'));
  add('div', 2, 2, (a,b)=>{ const y=finite(b,'div'); if (y===0) throw new ExpressionError('Division by zero.'); const x=finite(a,'div'); return Number.isInteger(x)&&Number.isInteger(y)?Math.trunc(x/y):x/y; });
  add('mod', 2, 2, (a,b)=>{const y=integer(b,'mod'); if(y===0) throw new ExpressionError('Division by zero.');return integer(a,'mod')%y;});
  add('min', 2, Infinity, (...xs)=>Math.min(...xs.map(x=>finite(x,'min'))));
  add('max', 2, Infinity, (...xs)=>Math.max(...xs.map(x=>finite(x,'max'))));
  // Logic; lazy if / and / or are special-cased below
  add('equals', 2, 2, (a,b)=>eq(a,b));
  add('greater', 2, 2, (a,b)=>a>b);
  add('greaterOrEquals', 2, 2, (a,b)=>a>=b);
  add('less', 2, 2, (a,b)=>a<b);
  add('lessOrEquals', 2, 2, (a,b)=>a<=b);
  add('not', 1, 1, v=>!v);
  // Date/time: simplified UTC, no timezone conversions
  add('utcNow', 0, 1, fmt=>formatUtc(now,fmt));
  add('formatDateTime', 1, 2, (date,fmt)=>formatUtc(date,fmt));
  for (const [name,ms] of [['addDays',86400000],['addHours',3600000],['addMinutes',60000],['addSeconds',1000]]) {
    add(name,2,3,(date,count,fmt)=>formatUtc(new Date(datestring(date,name).getTime() + finite(count,name)*ms).toISOString(),fmt));
  }
  add('ticks', 1, 1, date => ((datestring(date,'ticks').getTime() + 62135596800000) * 10000).toString()); // JS integers cannot exactly hold .NET ticks
  // Context helpers
  add('triggerBody',0,0,()=>context.trigger?.body ?? null);
  add('triggerOutputs',0,0,()=>context.trigger?.outputs ?? null);
  add('body',1,1, name=>resolveAction(str(name),'body'));
  add('outputs',1,1, name=>resolveAction(str(name),'outputs'));
  add('variables',1,1, name=>property(context.variables ?? {},str(name),true));
  add('parameters',1,1, name=>property(context.parameters ?? {},str(name),true));
  add('items',1,1, name=>property(context.items ?? {},str(name),true));
  add('item',0,0,()=>context.item ?? null);
  function run(node, depth = 0) {
    if (++calls > MAX_CALLS) throw new ExpressionError('Expression exceeded the evaluation operation limit.');
    if (depth > MAX_DEPTH) throw new ExpressionError('Expression nesting is too deep.');
    if (node.kind === 'literal') return node.value;
    if (node.kind === 'property') return property(run(node.source,depth+1),run(node.key,depth+1),node.safe);
    const name = node.name.toLowerCase();
    if (name === 'if') {assertArgs('if',node.args,3); return run(node.args[run(node.args[0],depth+1)?1:2],depth+1);}
    if (name === 'and') {assertArgs('and',node.args,2,Infinity); return node.args.every(a=>Boolean(run(a,depth+1)));}
    if (name === 'or') {assertArgs('or',node.args,2,Infinity); return node.args.some(a=>Boolean(run(a,depth+1)));}
    if (!owns(fn,name)) throw new ExpressionError(`Function “${node.name}” is not supported by this local evaluator. Check the supported-functions list; you can still copy the expression to Power Automate.`);
    return fn[name](node.args.map(a=>run(a,depth+1)));
  }
  return {run};
}
export function evaluateExpression(source, context = {}) {
  if (typeof source !== 'string' || !source.trim()) throw new ExpressionError('Enter an expression to evaluate.');
  if (source.length > MAX_EXPRESSION) throw new ExpressionError('Expression is too long for this local lab.');
  const runtime = createRuntime(context);
  let s = source.trim();
  if (s.includes('@{')) {
    // Text interpolation with balanced curly brackets, handling escaped quotes.
    let result = '', cursor = 0;
    while (cursor < s.length) {
      const start = s.indexOf('@{',cursor);
      if (start === -1) {result += s.slice(cursor); break;}
      result += s.slice(cursor,start); let pos=start+2, depth=1, inString=false;
      for (;pos<s.length;pos++) {
        const c=s[pos]; if(c==="'"){if(inString && s[pos+1]==="'"){pos++;continue;} inString=!inString;continue;}
        if(!inString){if(c==='{')depth++; if(c==='}' && --depth===0)break;}
      }
      if (depth!==0) throw new ExpressionError('Unclosed @{...} interpolation.',start);
      result += str(runtime.run(parse(s.slice(start+2,pos))));cursor=pos+1;
    }
    return result;
  }
  if (s.startsWith('@')) s=s.slice(1);
  return runtime.run(parse(s));
}
export function resultType(result) { return type(result); }
