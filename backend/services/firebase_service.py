import requests
from fastapi import HTTPException, Header
from dotenv import load_dotenv
import os

load_dotenv()

PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID")

def verify_token(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        
        # Verify via Google's public endpoint
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={os.getenv('FIREBASE_API_KEY')}"
        response = requests.post(url, json={"idToken": token})
        data = response.json()
        
        if "error" in data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = data["users"][0]
        return user["localId"]  # this is the UID
    
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Auth failed: {str(e)}")