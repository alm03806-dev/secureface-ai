\
from fastapi import FastAPI,UploadFile,File,HTTPException
from fastapi.responses import HTMLResponse
from PIL import Image
from io import BytesIO
from predictor import predict
from pathlib import Path
app=FastAPI(title='SecureFace Image PAD Demo')
@app.get('/health')
def health():return {'ok':True,'model':'image_pad'}
@app.get('/',response_class=HTMLResponse)
def index():return (Path(__file__).parent/'index.html').read_text()
@app.post('/predict')
async def run(file:UploadFile=File(...)):
    if file.content_type not in ('image/jpeg','image/png','image/webp'):
        raise HTTPException(415,'Supported: JPEG, PNG, WEBP')
    buf=await file.read(8_000_001)
    if len(buf)>8_000_000:raise HTTPException(413,'File too large')
    try:
        with Image.open(BytesIO(buf)) as im:
            im.verify()
        with Image.open(BytesIO(buf)) as im:
            return predict(im)
    except Exception as e:raise HTTPException(400,'Invalid or unreadable image') from e
