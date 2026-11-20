\
"""PAD inference. Higher attack_score means more likely spoof. No biometric storage."""
import json, io, numpy as np
from pathlib import Path
from PIL import Image, ImageOps
import onnxruntime as ort

ROOT=Path(__file__).resolve().parent
cfg=json.loads((ROOT/'handoff.json').read_text())
SESSIONS={}
for n in cfg['export_models']:
    f=ROOT/f'{n}.onnx'
    if not f.exists():raise FileNotFoundError(f)
    SESSIONS[n]=ort.InferenceSession(str(f),providers=['CPUExecutionProvider'])

def preprocess(image):
    im=ImageOps.exif_transpose(image.convert('RGB'))
    s=max(im.size); im=ImageOps.pad(im,(s,s),method=Image.Resampling.BILINEAR,color=(127,127,127))
    im=im.resize((cfg['image_size'],cfg['image_size']),Image.Resampling.BILINEAR)
    x=np.asarray(im,dtype=np.float32).transpose(2,0,1)/255.0
    m=np.array(cfg['mean'],dtype=np.float32).reshape(3,1,1)
    v=np.array(cfg['std'],dtype=np.float32).reshape(3,1,1)
    return ((x-m)/v)[None]

def predict(image):
    x=preprocess(image)
    probs={}
    for n,s in SESSIONS.items():
        output=s.run(None,{'image':x})[0][0]
        z=output-output.max();soft=np.exp(z);soft/=soft.sum()
        probs[n]=float(soft[1])
    score=float(np.mean(list(probs.values()))) if cfg['selected']=='ensemble_equal' else probs[cfg['selected']]
    return {'label':'SPOOF' if score>=cfg['threshold'] else 'LIVE',
            'attack_score':score,'threshold':cfg['threshold'],'model_scores':probs,
            'note':'Image-only PAD result; not proof of identity or resistance to all attacks.'}
