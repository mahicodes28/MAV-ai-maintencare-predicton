from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String) # "engineer" or "inspector"

class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(String)
    location = Column(String)
    details = Column(String)
    
    inspections = relationship("Inspection", back_populates="machine")
    baselines = relationship("Baseline", back_populates="machine")

class Baseline(Base):
    __tablename__ = "baselines"
    
    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"))
    dominant_freq_hz = Column(Float)
    amplitude_pixels = Column(Float)
    rms_pixels = Column(Float)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    machine = relationship("Machine", back_populates="baselines")

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"))
    inspector_id = Column(Integer, ForeignKey("users.id"))
    
    video_s3_key = Column(String)
    
    dominant_freq_hz = Column(Float, nullable=True)
    amplitude_pixels = Column(Float, nullable=True)
    rms_pixels = Column(Float, nullable=True)
    
    status = Column(String) # "processing", "completed", "failed"
    anomaly_flag = Column(String) # "No significant anomaly", "Warning", "Further inspection recommended"
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    machine = relationship("Machine", back_populates="inspections")
    inspector = relationship("User")
