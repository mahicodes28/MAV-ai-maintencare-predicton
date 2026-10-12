from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MachineBase(BaseModel):
    name: str
    type: str
    location: str
    details: Optional[str] = None

class MachineCreate(MachineBase):
    pass

class Machine(MachineBase):
    id: int

    class Config:
        from_attributes = True

class InspectionBase(BaseModel):
    machine_id: int
    inspector_id: int
    video_s3_key: str

class InspectionCreate(InspectionBase):
    pass

class Inspection(InspectionBase):
    id: int
    dominant_freq_hz: Optional[float]
    amplitude_pixels: Optional[float]
    rms_pixels: Optional[float]
    status: str
    anomaly_flag: str
    created_at: datetime

    class Config:
        from_attributes = True
