from database import db
from models.feedback import FeedbackModel
from datetime import datetime

feedback_collection = db["feedback"]

async def submit_feedback(feedback: FeedbackModel):
    doc = {
        "name": feedback.name,
        "email": feedback.email,
        "message": feedback.message,
        "created_at": datetime.utcnow()
    }
    result = feedback_collection.insert_one(doc)
    return {"id": str(result.inserted_id)}