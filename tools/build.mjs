import {readFileSync,writeFileSync,copyFileSync,mkdirSync,existsSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..'), src=join(root,'src'), out=join(root,'dist');
rmSync(out,{recursive:true,force:true});mkdirSync(join(out,'downloads'),{recursive:true});
const read = f=>readFileSync(join(src,f),'utf8');
const officialLogo=join(src,'mightora-logo.png');
const logo=existsSync(officialLogo)?`data:image/png;base64,${readFileSync(officialLogo).toString('base64')}`:`data:image/svg+xml;base64,${Buffer.from(read('mightora-wordmark.svg')).toString('base64')}`;
const favicon=`data:image/svg+xml;base64,${Buffer.from(read('favicon.svg')).toString('base64')}`;
// Brand artwork is fetched at build time and embedded in the offline HTML (never fetched at runtime).
// The source uses the same photos/logo/background as the Mightora shared author component.
async function embedAuthorAsset(name,url){
  const destination=join(src,'author-assets',name);
  if(!existsSync(destination)){
    mkdirSync(join(src,'author-assets'),{recursive:true});
    let response;
    for(let attempt=1;attempt<=3;attempt++){
      try{response=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('HTTP '+response.status);break;}
      catch(error){if(attempt===3)throw Error('Cannot bundle Mightora author asset '+name+': '+error.message);}
    }
    writeFileSync(destination,Buffer.from(await response.arrayBuffer()));
  }
  const bytes=readFileSync(destination);
  if(bytes.length<1000 || bytes.toString('ascii',1,4)!=='PNG')throw Error('Invalid author image: '+name);
  return 'data:image/png;base64,'+bytes.toString('base64');
}
const [authorBackground,authorAvatar,authorBlogLogo]=await Promise.all([
  embedAuthorAsset('background.png','https://raw.githubusercontent.com/mightora/shared-ui/main/ian-tweedie-presenting-4.png'),
  embedAuthorAsset('avatar.png','https://raw.githubusercontent.com/mightora/shared-ui/main/ian-tweedie-sq2.png'),
  embedAuthorAsset('blog-logo.png','https://raw.githubusercontent.com/mightora/shared-ui/main/main-logo.png')
]);
const photo='https://techtweedie.github.io/images/author/ian-tweedie-sq2_hu_a380911c6f4726de.png';
const blogLogo='https://raw.githubusercontent.com/TechTweedie/techtweedie.github.io/v2/assets/images/site/main-logo.png';
const onlineLogo='https://raw.githubusercontent.com/mightora/mightora.io/main/static/images/mightoraIoLogo4-200x900.png';
const repo='https://github.com/mightora/expression-lab.mightora.io';
const source=read('index.html');
const nav=[{label:'Expression Lab',url:'#lab'},{label:'Functions',url:'#functions'},{label:'Download',url:'#download'},{label:'GitHub ↗',url:repo,ext:true},{label:'Mightora.io ↗',url:'https://mightora.io',ext:true}];
const headerOnline=`<mightora-header site-name="Power Automate Expression Lab" site-url="/" logo-light="${onlineLogo}" logo-dark="${onlineLogo}" nav-links='${JSON.stringify(nav)}'></mightora-header>`;
const headerOffline=`<mightora-header site-name="Power Automate Expression Lab" site-url="#lab" logo-light="${logo}" logo-dark="${logo}" nav-links='${JSON.stringify(nav)}'>
  <header class="local-header"><div class="container local-header-inner"><a href="#lab" aria-label="Mightora Expression Lab home"><img src="${logo}" alt="Mightora"></a><strong>Expression Lab</strong><button class="btn local-hamburger" id="local-hamburger" type="button" aria-controls="local-menu" aria-expanded="false" aria-label="Toggle navigation">☰</button><nav class="local-menu" id="local-menu" aria-label="Primary">${nav.map(n=>`<a href="${n.url}" ${n.ext?'target="_blank" rel="noopener noreferrer"':''}>${n.label}</a>`).join('')}</nav></div></header>
</mightora-header>`;
const authorMarkup=(avatar,mark)=>`<mightora-author class="author-section"><div class="author-section-overlay"><div class="author-section-inner"><div class="author-photos"><img src="${avatar}" alt="Ian Tweedie" class="author-avatar" loading="lazy" decoding="async"><img src="${mark}" alt="TechTweedie" class="author-blog-logo" loading="lazy" decoding="async"></div><div class="author-text"><h2 class="author-heading">Built by TechTweedie</h2><p class="author-bio">Power Automate Expression Lab is a free tool created by <strong>Ian Tweedie</strong> — also known online as <strong>TechTweedie</strong>. Ian is a technology consultant and developer based in North East England with a background in enterprise IT, cloud infrastructure, and developer tooling. He builds free, practical tools and writes about technology on his blog.</p><div class="author-links"><a href="https://techtweedie.github.io" target="_blank" rel="noopener noreferrer" class="author-link">Blog ↗</a><a href="https://github.com/itweedie" target="_blank" rel="noopener noreferrer" class="author-link">GitHub ↗</a></div></div></div></div></mightora-author>`;
const authorOnline=authorMarkup(photo,blogLogo);
const authorOffline=authorMarkup(authorAvatar,authorBlogLogo);
const footerContent=`<div class="site-footer-fallback"><div class="container"><span>Expression Lab by <a href="https://mightora.io" target="_blank" rel="noopener noreferrer">Mightora</a>. Independent, open-source developer tooling.</span><span><a href="${repo}" target="_blank" rel="noopener noreferrer">Source &amp; licence ↗</a> · <a href="#privacy">Privacy &amp; network</a></span></div></div>`;
const footerOnline=`<mightora-footer>${footerContent}</mightora-footer>`;
const footerOffline=`<mightora-footer>${footerContent}</mightora-footer>`;
const patch=`<script>/* Correct known upstream tab indentation in footer.yaml before js-yaml reads it. */if(window.fetch){const nativeFetch=window.fetch.bind(window);window.fetch=async(input,init)=>{const url=typeof input==='string'?input:input.url;const response=await nativeFetch(input,init);if(url&&url.includes('footer.yaml')){const text=await response.text();return new Response(text.replace(/\\t/g,'  '),{status:response.status,statusText:response.statusText,headers:response.headers});}return response;};}</script>`;
const onlineHead=`<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/mightora/shared-ui@main/shared.css"><link rel="stylesheet" href="./styles.css">${patch}<script defer src="https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js"></script><script defer src="https://cdn.jsdelivr.net/gh/mightora/shared-ui@main/components.js"></script>`;
const offlineHead=`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src data:; connect-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none'"><style>${read('styles.css')}</style><style>body[data-edition="offline"] mightora-author.author-section{background-image:url("${authorBackground}")}</style>`;
const offlineLogic=[read('engine.mjs').replace(/^export /gm,''),read('catalog.mjs').replace(/^export /gm,''),read('app.mjs').replace(/^import .+;\s*$/gm,'')].join('\n');
const offlineScript=`<script type="module">${offlineLogic.replaceAll('</script','<\\/script')}</script>`;
const onlineSeo=`<link rel="canonical" href="https://expression-lab.mightora.io/"><meta property="og:url" content="https://expression-lab.mightora.io/">`;
function makeOffline(downloadLinksDisabled=false) {
  let html=source.replaceAll('__EDITION__','offline').replace('__HEAD_ASSETS__',offlineHead).replace('__SEO__','').replace('__FAVICON__',favicon).replace('__HEADER__',headerOffline).replace('__AUTHOR__',authorOffline).replace('__FOOTER__',footerOffline).replace('__SCRIPT_ASSETS__',offlineScript);
  html=html.replace('downloads/expression-lab-offline.html','#download').replace('downloads/expression-lab-offline.zip','#download');
  html=html.replace('<strong>Runtime limitation:</strong>', '<strong>Offline Edition – No Internet Connection Required.</strong> This copy embeds styles, scripts and brand artwork. <strong>Runtime limitation:</strong>');
  return html;
}
const offline=makeOffline();
writeFileSync(join(out,'downloads','expression-lab-offline.html'),offline);
writeFileSync(join(out,'index.html'),source.replaceAll('__EDITION__','online').replace('__HEAD_ASSETS__',onlineHead).replace('__SEO__',onlineSeo).replace('__FAVICON__','./favicon.svg').replace('__HEADER__',headerOnline).replace('__AUTHOR__',authorOnline).replace('__FOOTER__',footerOnline).replace('__SCRIPT_ASSETS__','<script type="module" src="./app.mjs"></script>'));
for(const file of ['app.mjs','engine.mjs','catalog.mjs','styles.css','favicon.svg'])copyFileSync(join(src,file),join(out,file));
if(existsSync(officialLogo))copyFileSync(officialLogo,join(out,'mightora-logo.png'));
copyFileSync(join(root,'LICENSE'),join(out,'downloads','LICENSE'));
writeFileSync(join(out,'downloads','README.txt'),`Mightora Power Automate Expression Lab — offline edition\n\n1. Extract this ZIP.\n2. Double-click index.html in Windows, macOS or Linux.\n3. No installer, local web server, account or internet access is needed.\n4. Paste an expression, edit the mock JSON context and click Run expression.\n5. This simulator implements a subset of Microsoft workflow expression functions, not an authoritative Power Automate runtime.\n6. For network transparency use F12 > Developer Tools > Network > Preserve log, then reload.\n7. All app assets are embedded; outbound application connections are blocked by the offline CSP.\n8. External hyperlinks work only if you intentionally follow them online.\n\nRepository: ${repo}\nMIT licence included.\n`);
copyFileSync(join(out,'downloads','expression-lab-offline.html'),join(out,'downloads','index.html'));
execFileSync('python3',[join(root,'tools','package-offline.py'),join(out,'downloads')],{stdio:'inherit'});
console.log(`Built online and offline editions. Offline ${Buffer.byteLength(offline).toLocaleString()} bytes. ${existsSync(officialLogo)?'Official logo included.':'Local fallback wordmark included (supply official PNG before release).'}`);
