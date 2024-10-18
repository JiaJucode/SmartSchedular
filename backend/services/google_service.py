import os.path
from dotenv import load_dotenv
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from models.google_model import GoogleDB
from google.oauth2.credentials import Credentials
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import requests
from flask import current_app as app

SCOPES = ["https://www.googleapis.com/auth/drive"]
load_dotenv()
CLIENT_ID = os.environ.get("CLIENT_ID")
API_KEY = os.environ.get("API_KEY")
CLIENT_SECRET = os.environ.get("CLIENT_SECRET")

def files_request(access_token: str) -> dict:
    """
    Get the files from the google drive
    """
    response = requests.get(
        f"https://www.googleapis.com/drive/v3/files?key={API_KEY}",
        headers={"Authorization": f"Bearer {access_token}",
                    "Accept": "application/json"}
    ).json()
    files = []
    for file in response["files"]:
        if file["mimeType"] == "application/vnd.google-apps.document":
            files.append(file)
    return files

def doc_process(file_id: str, creds: Credentials) -> None:
    """
    Process the document
    """
    service = build("drive", "v3", credentials=creds)
    request = service.files().export_media(fileId=file_id, mimeType="text/plain")
    response = request.execute()
    # TODO: calculate embedding and store in milvus
    # app.logger.info(response)

def google_drive_setup(user_id: int, 
                       token: str,
                       refresh_token: str,
                       access_token: str) -> None:
    """
    Sets up the refresh token for the user in the database and
    request for push notification for all files
    """
    # verify the id_token
    try:
        idInfo = id_token.verify_oauth2_token(token, google_requests.Request(), CLIENT_ID)
    except ValueError:
        return {"error": "Invalid token"}
    GoogleDB.add_token(user_id, access_token, refresh_token)
    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        scopes=SCOPES
    )
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())

    service = build("drive", "v3", credentials=creds)
    files = service.files().list(fields="files(id, name)").execute()
    app.logger.info("test: ", files)
    # request for push notification
    # get all files
    files = files_request(access_token)
    # for each file, get content, calculate embedding and store in milvus
    for file in files:
        doc_process(file["id"], creds)

    # TODO:
    # get all documents, calculate embedding and store in milvus
    # set up push notification for all files



    
