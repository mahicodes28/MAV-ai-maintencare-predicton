from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import datetime

# Create tables if they don't exist
models.Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    
    # Check if there are already machines
    if db.query(models.Machine).count() > 0:
        print("Database already seeded!")
        return

    # Add a dummy inspector
    inspector = models.User(username="test_inspector", role="inspector")
    db.add(inspector)
    db.commit()
    db.refresh(inspector)

    # Add some dummy machines
    m1 = models.Machine(name="Turbine Generator A", type="Turbine", location="Plant Floor 1", details="Main generator")
    m2 = models.Machine(name="Conveyor Belt Motor", type="Motor", location="Assembly Line B", details="Heavy duty motor")
    
    db.add(m1)
    db.add(m2)
    db.commit()
    db.refresh(m1)

    # Add a dummy baseline for m1
    b1 = models.Baseline(machine_id=m1.id, dominant_freq_hz=45.0, amplitude_pixels=5.0, rms_pixels=3.5)
    db.add(b1)
    
    # Add a dummy inspection for m1
    insp1 = models.Inspection(
        machine_id=m1.id,
        inspector_id=inspector.id,
        video_s3_key="dummy_video.mp4",
        dominant_freq_hz=48.2,
        amplitude_pixels=14.5,
        rms_pixels=8.9,
        status="completed",
        anomaly_flag="Warning",
        created_at=datetime.datetime.utcnow() - datetime.timedelta(days=1)
    )
    db.add(insp1)
    db.commit()

    print("Successfully seeded the database with dummy data!")

if __name__ == "__main__":
    seed()
