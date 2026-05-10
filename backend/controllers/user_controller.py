from models.user_model import User
from database.database import users_collection
from bson import ObjectId

def create_user(user: User, uid: str):
    existing = users_collection.find_one({"_id": uid})
    if existing:
        existing["id"] = existing["_id"]
        del existing["_id"]
        return existing

    user_dict = user.model_dump(exclude={"id"})
    user_dict["_id"] = uid
    users_collection.insert_one(user_dict)

    return {"id": uid, "message": "User created successfully"}

def get_user(uid: str):
    user = users_collection.find_one({"_id": uid})
    if not user:
        return {"error": "User not found"}
    user["id"] = user["_id"]
    del user["_id"]
    return user

def get_user_by_email(email: str):
    user = users_collection.find_one({"email": email})
    if not user:
        return {"error": "User not found"}
    
    user["id"] = str(user["_id"])
    del user["_id"]
    return user

def update_user(uid: str, user: User):
    result = users_collection.find_one_and_update(
        {"_id": uid},
        {"$set": user.model_dump(exclude={"id"}, exclude_none=True)},
    )
    if not result:
        return {"error": "User not found"}
    return {"message": "User updated successfully"}

def delete_user(uid: str):
    result = users_collection.delete_one({"_id": uid})
    if result.deleted_count == 0:
        return {"error": "User not found"}
    return {"message": "User deleted successfully"}