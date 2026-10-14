from pathlib import Path
import zipfile,sys
p=Path(sys.argv[1])
archive=p/'expression-lab-offline.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for file in ('index.html','README.txt','LICENSE'):
        z.write(p/file,file)
with zipfile.ZipFile(archive) as z:
    assert set(z.namelist()) == {'index.html','README.txt','LICENSE'}
    assert z.read('index.html') == (p/'expression-lab-offline.html').read_bytes()
print(f'Offline ZIP verified: {archive.stat().st_size:,} bytes')
