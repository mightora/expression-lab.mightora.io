import { evaluateExpression, resultType } from './engine.mjs';
import { sampleContext, examples, catalog } from './catalog.mjs';
const $ = (id) => document.getElementById(id);
const offline = document.body.dataset.edition === 'offline';
const liveRegion = $('result-value');
let latestResult, hasResult = false, activeFilter = 'All';
const clone = (data) => JSON.parse(JSON.stringify(data));
const plain = v => typeof v === 'string' ? v : JSON.stringify(v, null, 2);
function message(m) { $('toast').textContent = m; $('toast').hidden = false; clearTimeout(message.timer); message.timer = setTimeout(() => $('toast').hidden = true, 2900); }
async function copyText(text) {
  try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); message('Copied to clipboard.'); return; } } catch {}
  // No automatic copying via execCommand; works even when file:// blocks Clipboard API.
  const input = document.createElement('textarea'); input.value = text; input.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.append(input); input.select();
  const ok = document.execCommand?.('copy'); input.remove(); message(ok ? 'Copied to clipboard.' : 'Clipboard blocked. Select the text and copy manually.');
}
function openTab(value) {
  const isResult = value === 'result';
  $('tab-result').setAttribute('aria-selected',String(isResult)); $('tab-context').setAttribute('aria-selected',String(!isResult));
  $('panel-result').hidden = !isResult; $('panel-context').hidden = isResult;
  $('tab-result').tabIndex = isResult?0:-1; $('tab-context').tabIndex = isResult?-1:0;
}
function resetContext() { $('context').value = JSON.stringify(sampleContext,null,2); message('Sample context restored.'); }
function run() {
  openTab('result');
  try {
    const context = JSON.parse($('context').value);
    if (!context || typeof context !== 'object' || Array.isArray(context)) throw new Error('Context must be a JSON object.');
    const result = evaluateExpression($('expression').value,context);
    hasResult=true; latestResult=result;
    $('result-status').className='status'; $('result-status').textContent='✓ Success';
    $('result-type').textContent=`${resultType(result).toUpperCase()} · Local result`;
    liveRegion.textContent=plain(result) ?? 'null'; $('error-detail').hidden=true;
  } catch (error) {
    hasResult=false; $('result-status').className='status error'; $('result-status').textContent='! Error';
    $('result-type').textContent='Unable to evaluate'; liveRegion.textContent=error.message;
    $('error-detail').textContent=Number.isInteger(error.position)?`Expression position ${error.position+1}.`:error instanceof SyntaxError ? 'Check that mock context contains valid JSON.' : 'Check syntax, function arguments and mock values.';
    $('error-detail').hidden=false;
  }
}
function setExpression(value) { $('expression').value=value; updateCount(); }
function updateCount(){ $('char-count').textContent=`${$('expression').value.length.toLocaleString()} characters`; }
function selectExample(id) {const v=examples.find(x=>x.id===id) || examples[0]; $('example-select').value=v.id; setExpression(v.expression); run();}
function drawCatalog() {
  const search=$('function-search').value.trim().toLowerCase();
  const selected=catalog.filter(f=>(activeFilter==='All'||f.category===activeFilter)&&`${f.name} ${f.category} ${f.description}`.toLowerCase().includes(search));
  $('function-list').replaceChildren(...selected.map(f => {
    const b=document.createElement('button'); b.type='button'; b.className='function-card';
    const name=document.createElement('code');name.textContent=f.name+'()';
    const cat=document.createElement('span');cat.className='cat';cat.textContent=f.category;
    const p=document.createElement('p');p.textContent=f.description;
    const ex=document.createElement('small');ex.textContent=f.expression;
    b.append(cat,name,p,ex);b.title=`Load ${f.name} example in editor`;
    b.addEventListener('click',()=>{setExpression(f.expression);location.hash='#lab';$('expression').focus();run();});return b;
  }));
  if (!selected.length) {const p=document.createElement('p');p.className='no-results';p.textContent='No functions match that search.';$('function-list').append(p);}
  $('function-count').textContent=`Showing ${selected.length} of ${catalog.length} implemented functions`;
  for (const b of $('function-filters').querySelectorAll('button')) b.setAttribute('aria-pressed',String(b.dataset.category===activeFilter));
}
function setupCatalog() {
  const categories=['All',...new Set(catalog.map(x=>x.category))];
  for(const cat of categories){const b=document.createElement('button');b.type='button';b.className='chip';b.dataset.category=cat;b.textContent=cat;b.addEventListener('click',()=>{activeFilter=cat;drawCatalog();});$('function-filters').append(b);}
  $('function-search').addEventListener('input',drawCatalog);drawCatalog();
}
function networkReport() {
  const entries=performance?.getEntriesByType?.('resource')||[];const domains=new Map();
  for(const entry of entries) {
    let domain;try{domain=new URL(entry.name).hostname||'local file';}catch {domain='unknown';}
    domains.set(domain,(domains.get(domain)||0)+1);
  }
  $('network-rows').replaceChildren();
  if (!domains.size){const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=2;td.textContent='No resource requests visible to Resource Timing.';tr.append(td);$('network-rows').append(tr);}
  else for (const [name,count] of [...domains.entries()].sort((a,b)=>b[1]-a[1])) {const tr=document.createElement('tr');const domain=document.createElement('td');domain.textContent=name;const num=document.createElement('td');num.textContent=String(count);tr.append(domain,num);$('network-rows').append(tr);}
  $('network-summary').textContent=`${entries.length} visible resource request(s) across ${domains.size} domain(s).`;
}
function boot() {
  const select=$('example-select');for(const ex of examples){const opt=document.createElement('option');opt.value=ex.id;opt.textContent=`${ex.category} · ${ex.label}`;select.append(opt);}
  $('context').value=JSON.stringify(clone(sampleContext),null,2);
  $('example-select').addEventListener('change', e => selectExample(e.target.value));
  $('reset-example').addEventListener('click',()=>selectExample($('example-select').value));
  $('run-expression').addEventListener('click',run);$('run-context').addEventListener('click',run);
  $('expression').addEventListener('input',updateCount);$('expression').addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();run();} if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();const a=e.target;const start=a.selectionStart;a.setRangeText('  ',start,a.selectionEnd,'end');updateCount();}});
  $('clear-expression').addEventListener('click',()=>{setExpression('');$('expression').focus();});
  $('copy-expression').addEventListener('click',()=>copyText($('expression').value));
  $('copy-result').addEventListener('click',()=>hasResult?copyText(plain(latestResult)??'null'):message('Run an expression first.'));
  $('reset-context').addEventListener('click',resetContext);
  $('tab-result').addEventListener('click',()=>openTab('result'));$('tab-context').addEventListener('click',()=>openTab('context'));
  $('open-context').addEventListener('click',()=>openTab('context'));
  $('refresh-network').addEventListener('click',networkReport);
  setupCatalog();selectExample('welcome');
  if(offline){$('edition-indicator').textContent='✓ Offline Edition – No Internet Connection Required';$('online-dependencies').textContent='Offline Edition – No Internet Connection Required. No CDNs, analytics, APIs or remote images are loaded. Any optional GitHub or Microsoft links require a connection only when you choose to open them.';}
  setTimeout(networkReport,800);
  // Simple fallback navigation only; online shared component manages its own menu.
  $('local-hamburger')?.addEventListener('click',()=>{const menu=$('local-menu');const open=menu.classList.toggle('open');$('local-hamburger').setAttribute('aria-expanded',String(open));});
  $('local-menu')?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{$('local-menu').classList.remove('open');$('local-hamburger').setAttribute('aria-expanded','false');}));
}
boot();
