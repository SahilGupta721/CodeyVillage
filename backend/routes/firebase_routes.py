from services.firebase_service import verify_token
from fastapi import Depends

@router.post("/")
def create(user: User, uid: str = Depends(verify_token)):
    user.id = uid  # Firebase UID becomes MongoDB _id
    return create_user(user)