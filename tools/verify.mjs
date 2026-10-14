import {readFileSync,existsSync,statSync} from 'node:fs';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..');const dist=join(root,'dist');
const online=readFileSync(join(dist,'index.html'),'utf8');
const offline=readFileSync(join(dist,'downloads','expression-lab-offline.html'),'utf8');
for (const name of ['mightora-header','mightora-author','mightora-footer']){assert.ok(online.includes(`<${name}`),`missing online ${name}`);assert.ok(offline.includes(`<${name}`),`missing offline ${name}`);}
for(const s of ['expression','example-select','context','run-expression','network-rows','function-list','toast'])assert.ok(offline.includes(`id="${s}"`));
assert.match(online,/shared-ui@main\/shared.css/);assert.match(online,/shared-ui@main\/components.js/);assert.match(online,/js-yaml/);
assert.ok(online.indexOf('js-yaml@')<online.indexOf('shared-ui@main/components.js'));
assert.match(offline,/Offline Edition – No Internet Connection Required/);
assert.match(offline,/connect-src 'none'/);assert.match(offline,/default-src 'none'/);
assert.doesNotMatch(offline,/<script[^>]+src=/i);assert.doesNotMatch(offline,/<link[^>]+rel="stylesheet"/i);
assert.doesNotMatch(offline,/<img[^>]+src="https?:/i);
assert.match(offline,/<script type="module">/);
assert.match(offline,/evaluateExpression/);
assert.ok(statSync(join(dist,'downloads','expression-lab-offline.zip')).size>1000);
execFileSync('python3',['-c',`from pathlib import Path;import zipfile;d=Path('${dist}/downloads');z=zipfile.ZipFile(d/'expression-lab-offline.zip');assert z.read('index.html')==(d/'expression-lab-offline.html').read_bytes()`]);
for (const wf of ['ci.yml','codeql.yml','deploy.yml','dependency-review.yml'])assert.ok(existsSync(join(root,'.github','workflows',wf)),`missing ${wf}`);
for (const [edition,html] of [['online',online],['offline',offline]]) {
  const mainEnd=html.indexOf('</main>');
  const authorStart=html.indexOf('<mightora-author');
  const badgesStart=html.indexOf('class="trust container"');
  const footerStart=html.indexOf('<mightora-footer');
  assert.ok(mainEnd>=0 && mainEnd<authorStart && authorStart<badgesStart && badgesStart<footerStart,`${edition} author must span the page and precede badges and footer`);
  for(const className of ['author-section-overlay','author-section-inner','author-photos','author-avatar','author-blog-logo','author-bio','author-links'])assert.ok(html.includes(className),`${edition} missing ${className}`);
}
assert.doesNotMatch(offline,/author-fallback/);
assert.match(offline,/<mightora-author[^>]+class="author-section"/);
assert.match(offline,/body\[data-edition="offline"\] mightora-author\.author-section\{background-image:url\("data:image\/png;base64,/);
assert.ok((offline.match(/<img src="data:image\/png;base64,/g)||[]).length>=2,'offline portrait and logo must be embedded');
console.log('Build verification passed. Online / offline branding, CSP, author layout, artwork, workflow paths, and ZIP parity checked.');
