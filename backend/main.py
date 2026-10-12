from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import os

import models
import schemas
from database import SessionLocal, engine, get_db
from report_generator import generate_pdf_report
from video_processor import extract_motion_signal, analyze_vibration
from seed import seed
import shutil

from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MAV AI Maintenance Predictor API",
    description="Vibration analysis, anomaly detection, and maintenance health prediction system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    models.Base.metadata.create_all(bind=engine)
    try:
        seed()
    except Exception as e:
        print(f"Startup seed notice: {e}")

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "MAV AI Maintenance Predictor API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "openapi_url": "/openapi.json",
        "endpoints": {
            "machines": "/machines/",
            "inspections": "/inspections/{machine_id}",
            "upload_video": "/inspections/{machine_id}/upload",
            "reports": "/reports/{inspection_id}"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "mav-ai-backend"}

@app.post("/machines/", response_model=schemas.Machine)
def create_machine(machine: schemas.MachineCreate, db: Session = Depends(get_db)):
    db_machine = models.Machine(**machine.model_dump())
    db.add(db_machine)
    db.commit()
    db.refresh(db_machine)
    return db_machine

@app.get("/machines/", response_model=List[schemas.Machine])
def read_machines(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    machines = db.query(models.Machine).offset(skip).limit(limit).all()
    return machines

@app.get("/machines/{machine_id}", response_model=schemas.Machine)
def read_machine(machine_id: int, db: Session = Depends(get_db)):
    db_machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if db_machine is None:
        raise HTTPException(status_code=404, detail="Machine not found")
    return db_machine

def process_video_background(inspection_id: int, db: Session):
    inspection = db.query(models.Inspection).filter(models.Inspection.id == inspection_id).first()
    if not inspection:
        return
        
    try:
        # Run vibration analysis
        signal, fps = extract_motion_signal(inspection.video_s3_key)
        results = analyze_vibration(signal, fps)
        
        # Update inspection with results
        inspection.dominant_freq_hz = results['dominant_freq_hz']
        inspection.amplitude_pixels = results['amplitude_pixels']
        inspection.rms_pixels = results['rms_pixels']
        
        # Simple thresholding for anomaly flag
        if inspection.amplitude_pixels > 15 or inspection.rms_pixels > 10:
            inspection.anomaly_flag = "Warning"
        else:
            inspection.anomaly_flag = "No significant anomaly"
            
        inspection.status = "completed"
        
    except Exception as e:
        print(f"Error processing video: {e}")
        inspection.status = "failed"
        inspection.anomaly_flag = "Failed to process"
        
    db.commit()

@app.post("/inspections/{machine_id}/upload")
async def upload_inspection_video(machine_id: int, background_tasks: BackgroundTasks, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Ensure uploads directory exists
    os.makedirs("uploads", exist_ok=True)
    filepath = f"uploads/{machine_id}_{file.filename}"
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_inspection = models.Inspection(
        machine_id=machine_id,
        inspector_id=1, # Default mock inspector
        video_s3_key=filepath,
        status="processing",
        anomaly_flag="Pending"
    )
    db.add(db_inspection)
    db.commit()
    db.refresh(db_inspection)
    
    background_tasks.add_task(process_video_background, db_inspection.id, SessionLocal())
    
    return {"message": "Upload successful, processing started", "inspection_id": db_inspection.id}

@app.get("/inspections/{machine_id}", response_model=List[schemas.Inspection])
def read_machine_inspections(machine_id: int, db: Session = Depends(get_db)):
    inspections = db.query(models.Inspection).filter(models.Inspection.machine_id == machine_id).order_by(models.Inspection.created_at.desc()).all()
    return inspections

@app.get("/reports/{inspection_id}", response_class=FileResponse)
def get_inspection_report(inspection_id: int, db: Session = Depends(get_db)):
    inspection = db.query(models.Inspection).filter(models.Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
        
    machine = db.query(models.Machine).filter(models.Machine.id == inspection.machine_id).first()
    
    # Ensure a reports directory exists
    os.makedirs("reports", exist_ok=True)
    filepath = f"reports/inspection_{inspection_id}.pdf"
    
    # Generate the PDF
    inspection_dict = {
        'status': inspection.status,
        'anomaly_flag': inspection.anomaly_flag,
        'dominant_freq_hz': inspection.dominant_freq_hz,
        'amplitude_pixels': inspection.amplitude_pixels,
        'rms_pixels': inspection.rms_pixels
    }
    generate_pdf_report(machine.name, inspection_dict, filepath)
    
    return FileResponse(path=filepath, filename=f"Inspection_{inspection_id}.pdf", media_type='application/pdf')

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
