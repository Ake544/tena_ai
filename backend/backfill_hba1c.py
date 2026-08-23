import uuid
from datetime import date
from app.core.database import SessionLocal
from app.models.patient import Patient

pid = "dbf4d380-357a-4b5a-bd64-ed91068fd0fc"
db = SessionLocal()
p = db.get(Patient, pid)
print("before:", p.hba1c)
p.hba1c = 6.5
db.commit()
db.refresh(p)
print("after:", p.hba1c)
db.close()