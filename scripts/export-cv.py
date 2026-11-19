#!/usr/bin/env python3
"""
Export the CV texts from Jurgo88/job-hunting-pro into app/data/cv-classic.json
for the Classic view (/cv). Uses the same selection logic as the PDF generator
(cv/build.py: build_context), so the web page and the PDFs say the same thing.

  python3 scripts/export-cv.py ../job-hunting-pro

The phone number is NOT exported (the page shows it via XpPhone, click-to-reveal).
"""
import json, sys
from pathlib import Path

src = Path(sys.argv[1] if len(sys.argv) > 1 else '../job-hunting-pro').resolve() / 'cv'
sys.path.insert(0, str(src))
import yaml  # noqa: E402
from build import build_context  # noqa: E402

# site role id -> job-hunting-pro profile
PROFILES = {'frontend': 'frontend', 'fullstack': 'fullstack', 'analyst': 'analyst', 'ai-engineer': 'ai'}
KEEP = ['headline', 'role', 'stack', 'summary', 'location', 'sections', 'experience', 'earlier',
        'projects', 'skills', 'education', 'languages', 'L']


def plain(v):
    if isinstance(v, dict):
        return {k: plain(x) for k, x in v.items()}
    if isinstance(v, (list, tuple)):
        return [plain(x) for x in v]
    return v if v is None or isinstance(v, (int, float, bool)) else str(v)


data = yaml.safe_load((src / 'data/cv.yaml').read_text(encoding='utf-8'))
out = {}
for role, prof_name in PROFILES.items():
    prof = yaml.safe_load((src / f'profiles/{prof_name}.yaml').read_text(encoding='utf-8'))
    out[role] = {}
    for lang in ('en', 'sk'):
        ctx = build_context(data, prof, lang)
        out[role][lang] = plain({k: ctx[k] for k in KEEP})

dest = Path(__file__).resolve().parent.parent / 'app/data/cv-classic.json'
text = json.dumps(out, ensure_ascii=False, indent=1)
assert data['person']['phone'] not in text, 'phone number must not be exported'
dest.write_text(text + '\n', encoding='utf-8')
print(f'wrote {dest} ({len(text)} chars)')
