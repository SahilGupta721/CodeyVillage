from fastapi import APIRouter
from models.feedback import FeedbackModel
from controllers.feedback_controller import submit_feedback

router = APIRouter()

@router.post("/feedback")
async def post_feedback(feedback: FeedbackModel):
    return await submit_feedback(feedback)