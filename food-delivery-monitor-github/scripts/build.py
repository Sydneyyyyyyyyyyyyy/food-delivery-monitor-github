from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
source = root / 'src'
html = (source / 'index.html').read_text(encoding='utf-8-sig')
sample = (root / 'data' / 'demo.csv').read_text(encoding='utf-8-sig')
scripts = '<script>const embeddedSample=' + json.dumps(sample, ensure_ascii=False).replace('</', '<\\/') + ';</script>'
for name in ('engine.js', 'monthly.js', 'app.js', 'monthly-ui.js'):
    code = (source / name).read_text(encoding='utf-8-sig')
    if name == 'app.js':
        code = code.replace("const r=await fetch('data/demo.csv');if(!r.ok)throw Error('样本读取失败');load(await r.text(),", 'load(embeddedSample,')
    scripts += '<script>' + code + '</script>'
tags = ''.join('<script src="' + name + '"></script>' for name in ('engine.js', 'monthly.js', 'app.js', 'monthly-ui.js'))
if tags not in html:
    raise RuntimeError('Source script references do not match the build configuration.')
(root / 'index.html').write_text(html.replace(tags, scripts), encoding='utf-8')
print('Built index.html')
