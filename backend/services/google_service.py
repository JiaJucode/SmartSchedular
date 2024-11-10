import os.path
from dotenv import load_dotenv
from googleapiclient.discovery import build
from models.google_model import GoogleAuthenDB
from models.file_storage_model import FileStorageModel
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from milvus.milvus_client import milvus_client
from services.rag_linking_service import update_document_segment, delete_document_segment
from googleapiclient.http import MediaIoBaseDownload
from ai.embedder import get_embeddings
from services.text_processor_service import get_text_difference, text_to_sentences, text_preprocessing
import PyPDF2
import requests
import uuid
import io
import time
from flask import current_app as app

load_dotenv()
CLIENT_ID = os.environ.get("CLIENT_ID")
API_KEY = os.environ.get("API_KEY")
CLIENT_SECRET = os.environ.get("CLIENT_SECRET")
WEB_ADDRESS = os.environ.get("WEB_ADDRESS")
PDF_MIME_TYPE = "application/pdf"
GOOGLE_DOC_MIME_TYPE = "application/vnd.google-apps.document"

def init_cred(access_token: str, refresh_token: str) -> Credentials:
    return Credentials(
        token=access_token,
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        scopes=["https://www.googleapis.com/auth/drive"]
    )

def get_cred(user_id: int) -> Credentials:
    access_token, refresh_token = GoogleAuthenDB.get_tokens(user_id)
    return init_cred(access_token, refresh_token)

def update_token(user_id: int, refresh_token: str) -> Credentials | None:
    response = requests.post("https://oauth2.googleapis.com/token",
                                data={
                                    "client_id": CLIENT_ID,
                                    "client_secret": CLIENT_SECRET,
                                    "refresh_token": refresh_token,
                                    "grant_type": "refresh_token"
                                })
    if response.status_code != 200:
        app.logger.error("Failed to update token")
        return None
    response = response.json()
    access_token = response["access_token"]
    GoogleAuthenDB.update_token(user_id, access_token, refresh_token)
    return init_cred(access_token, refresh_token)

def build_service(user_id: int, creds: Credentials):
    """
    if the token is expired, update the token
    return the service object from build
    if failed to update token, return None
    """
    try:
        return build("drive", "v3", credentials=creds)
    except Exception as e:
        # check if its caused by expired token
        if "Invalid Credentials" in str(e):
            creds = update_token(user_id, creds.refresh_token)
            if not creds:
                return None
            return build("drive", "v3", credentials=creds)
        app.logger.error("error building service: " + str(e))
        raise

def metadata_builder(file_info: dict) -> str:
    return "file name: " + file_info["name"]

def get_doc_metadata(user_id: int, file_id: str) -> str:
    """
    Get metadata of the document
    """
    if GoogleAuthenDB.check_connected(user_id) is False:
        return None
    cred = get_cred(user_id)
    service = build_service(user_id, cred)
    if not service:
        app.logger.error("failed to build service")
        return None
    file_info = None
    try:
        file_info = service.files().get(fileId=file_id).execute()
        if file_info:
            return metadata_builder(file_info)
        app.logger.error("failed to get file info")
        return None
    except Exception as e:
        app.logger.error("error: " + str(e))
        return None

def get_doc_content(user_id: int, file_info: dict, creds: Credentials) -> tuple:
    """
    Return: content, metadata
    """
    service = build_service(user_id, creds)
    if not service:
        return "", ""
    metadata = metadata_builder(file_info)
    text = ""
    if file_info["mimeType"] == PDF_MIME_TYPE:
        try:
            request = service.files().get_media(fileId=file_info["id"])
        except Exception as e:
            app.logger.error("error when getting doc content: " + str(e))
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while done is False:
            _, done = downloader.next_chunk()
        fh.seek(0)

        reader = PyPDF2.PdfReader(fh)
        for page in reader.pages:
            try:
                text += page.extract_text() + "\n"
            except Exception as e:
                app.logger.error("error while extracting text: " + str(e))
                app.logger.error("page: " + str(page))
    elif file_info["mimeType"] == GOOGLE_DOC_MIME_TYPE:
        try:
            request = service.files().export_media(fileId=file_info["id"], mimeType="text/plain")
        except Exception as e:
            # check if its caused by expired token
            app.logger.error("error when getting doc content: " + str(e))
        text = request.execute().decode("utf-8")

    # clean up the text
    text = text_preprocessing(text)
    app.logger.info("metadata: " + metadata)
    return text, metadata

def doc_process(file_info: dict, creds: Credentials, user_id: int) -> None:
    """
    embed the document and store in milvus
    """
    app.logger.info("processing file: " + str(file_info))
    text, metadata = get_doc_content(user_id, file_info, creds)
    # store in file_storage
    FileStorageModel.create_file(file_info["id"], text)
    # calculate embeddings
    embeddings, embedding_range = get_embeddings(text, metadata)
    app.logger.info("embedding length: " + str(len(embeddings)))
    # store in milvus
    milvus_client.inserts(user_id, file_info["id"], embeddings, embedding_range)

def cancel_push_notification(user_id: str, access_token) -> None:
    channel_info = GoogleAuthenDB.get_channel_info(user_id)
    if not channel_info or not channel_info["channel_id"] or not channel_info["resource_id"]:
        app.logger.error("not enough channel info")
        return
    response = requests.post(
        "https://www.googleapis.com/drive/v3/channels/stop",
        headers={
            "Authorization": "Bearer " + access_token,
            "Content-Type": "application/json"
        },
        json={
            "id": channel_info["channel_id"],
            "resourceId": channel_info["resource_id"]
        })
    if response.status_code != 204:
        app.logger.error("Failed to cancel push notification: " + str(response.text))
    return


def check_and_update_push_notification(access_token: str, user_id: str) -> None:
    """
    Check if the push notification is still valid
    If the expiration time is less than 1 day, update the push notification
    """
    expiration_time = GoogleAuthenDB.get_expiration_time(user_id)
    if expiration_time > int(time.time() - 24 * 60 * 60):
        push_notification_setup(access_token, user_id)

def push_notification_setup(access_token: str, user_id: int) -> bool:
    """
    Set up push notification for the user
    """
    # get page token
    cancel_push_notification(user_id, access_token)
    response = requests.get(
        "https://www.googleapis.com/drive/v3/changes/startPageToken",
        headers={
            "Authorization": "Bearer " + access_token
        })
    if response.status_code != 200:
        app.logger.error("Failed to get page token: " + str(response.text))
        return False
    page_token = response.json()["startPageToken"]
    app.logger.info("page token: " + page_token)

    channel_id = str(uuid.uuid4())
    expiration_time = int(time.time() +  30 * 24 * 60 * 60) # 30 days

    for _ in range(3):
        response = requests.post(
            "https://www.googleapis.com/drive/v3/changes/watch?pageToken=" + page_token,
            headers={
                "Authorization": "Bearer " + access_token,
                "Content-Type": "application/json"
            },
            json={
                "id": channel_id,
                "type": "web_hook",
                "address": WEB_ADDRESS + "/backend/google/push_notification",
                "expiration": expiration_time * 1000
            })
        if response.status_code == 200:
            GoogleAuthenDB.update_push_notification(user_id, channel_id, page_token, expiration_time)
            return True
    app.logger.error("Failed to set up push notification: " + str(response.text))
    return False

def google_drive_setup(user_id: int, 
                       code: str) -> None:
    """
    Sets up the refresh token for the user in the database and
    request for push notification for all files
    """
    # get the access token and refresh token
    response = requests.post("https://oauth2.googleapis.com/token",
                                data={
                                    "code": code,
                                    "client_id": CLIENT_ID,
                                    "client_secret": CLIENT_SECRET,
                                    "redirect_uri": WEB_ADDRESS,
                                    "grant_type": "authorization_code"
                                })
    if response.status_code != 200:
        app.logger.info("response: " + str(response.text))
        return {"error": "Failed to get access token"}
    response = response.json()
    access_token = response["access_token"]
    app.logger.info("access token: " + access_token)
    refresh_token = response["refresh_token"]
    creds = init_cred(access_token, refresh_token)

    service = build_service(user_id, creds)
    files = service.files().list(
        pageSize=100, 
        fields="files(id, name, mimeType)",
        q="mimeType='application/vnd.google-apps.document' or mimeType='application/pdf'"
        ).execute()
    app.logger.info("results: " + str(files))

    # process each file
    for file in files["files"]:
        doc_process(file, creds, user_id)
    
    # set up push notification
    success = push_notification_setup(access_token, user_id)
    if not success:
        return {"error": "Failed to set up push notification"}
    GoogleAuthenDB.add_token(user_id, access_token, refresh_token)

    return {"message": "Refresh token set up successfully"}

# TODO refresh notification channel after expires
def update_changes(channel_id: str, resource_id: str) -> None:
    user_info = GoogleAuthenDB.get_user(channel_id)
    if not user_info:
        app.logger.error("no user associated with the channel id")
        app.logger.error("channel_id: " + channel_id)
        app.logger.error("resource_id: " + resource_id)
        return
    user_id = user_info["user_id"]
    access_token = user_info["access_token"]
    refresh_token = user_info["refresh_token"]
    old_page_token = user_info["page_token"]
    page_token = old_page_token

    GoogleAuthenDB.update_resource_id(user_id, resource_id)

    GoogleAuthenDB.set_syncing(user_id, True)
    cred = init_cred(access_token, refresh_token)
    file_changes = set()
    try:
        service = build_service(user_id, cred)
        while True:
            response = service.changes().list(
                pageToken=page_token,
                spaces="drive"
            ).execute()
            for change in response.get("changes", []):
                file_id = change["fileId"]
                if file_id not in file_changes:
                    file_changes.add(file_id)
            temp_page_token = response.get("nextPageToken")
            if not temp_page_token:
                # update page_token
                GoogleAuthenDB.update_page_token(user_id, page_token)
                break
            page_token = temp_page_token

        app.logger.info("file changes: " + str(file_changes))
        # process each file
        for file_id in file_changes:
            content = FileStorageModel.get_file_content(file_id)
            file_info = service.files().get(fileId=file_id).execute()
            if not content:
                app.logger.info("failed to get content from file_storage")
                doc_process(file_info, cred, user_id)
            else:
                new_content, metadata = get_doc_content(user_id, file_info, cred)
                # segment comparison
                update_from_file_change(user_id, file_id, metadata, content, new_content)
                FileStorageModel.update_file(file_id, new_content)

    except Exception as e:
        app.logger.error("error: " + str(e))
        
    GoogleAuthenDB.set_syncing(user_id, False)

def update_from_file_change(user_id: int, file_id: str, file_metadata: str, old_file: str, new_file: str) -> None:
    new_sentences = text_to_sentences(new_file)
    diffs = get_text_difference(old_file, new_file)
    app.logger.info("diffs: " + str(diffs))
    # get all segments from google_drive_files_usage db and 
    segments = milvus_client.get_chunk_ranges(file_id)
    segments.sort(key=lambda x: x[0])
    accu_shift = 0
    shift_buffer = {}
    app.logger.info("segments: " + str(segments))
    for start, end in segments:
        # clean up shift buffer
        old_shifts = [shift for i, shift in shift_buffer.items() if i < start]
        accu_shift = sum(old_shifts)
        shift_buffer = {i: shift for i, shift in shift_buffer.items() if i >= start}

        # update the segment diffs
        diffs = [diff for diff in diffs if diff[0] >= start]
        # if last segment, then use the rest of the diffs
        if end == segments[-1][1]:
            app.logger.info("last segment: " + str(diffs))
            segment_diffs = diffs
        else:
            segment_diffs = [diff for diff in diffs if diff[0] <= end]

        # if shift is 0, buffer is empty and no diff, copy the rest of the segments and break
        if len(diffs) == 0 and len(shift_buffer) == 0 and accu_shift == 0:
            break

        # if shift is not 0 and no change in the segment, update the segment range and continue
        if len(segment_diffs) == 0:
            milvus_client.update_segment(user_id, file_id, (start, end), None, (start + accu_shift, end + accu_shift))
            continue
        insert_or_delete = [diff for diff in segment_diffs if diff[1] == "insert" or diff[1] == "delete"]
        # for updating subsequent segment indices
        for change in insert_or_delete:
            if change[1] == "insert":
                shift_buffer[change[0]] = 1
            elif change[1] == "delete":
                shift_buffer[change[0]] = -1
        shift_between = sum([shift for shift in shift_buffer.values()])

        # check if there is any insert or replace
        insert_or_replace = [diff for diff in segment_diffs if diff[1] == "insert" or diff[1] == "replace"]
        if len(insert_or_replace) > 0:
            # might need to split the segment
            # get embedding for the new segment/s from embedder
            raw_text = " ".join([str(sent) for sent in 
                                new_sentences[start + accu_shift:end + accu_shift + shift_between + 1]])
            embeddings, index_ranges = get_embeddings(raw_text, file_metadata)
            # update the current segment and insert the rest
            app.logger.info("index within segment: " + str(index_ranges))
            index_ranges = [(start + accu_shift + b, start + accu_shift + e) for b, e in index_ranges]
            app.logger.info("updating segment from " + str(start) + " to " + str(end))
            app.logger.info("embedding range: " + str(index_ranges))
            try:
                update_document_segment(user_id, file_id, (start, end), embeddings, index_ranges, raw_text)
            except Exception as e:
                app.logger.error("error updating segment: " + str(e))

        else:
            # check if there are any deletes
            if len(segment_diffs) != len(insert_or_replace):
                # check if everything is deleted
                # if yes, delete the segment from milvus
                if len(segment_diffs) == end - start + 1:
                    # delete from milvus
                    delete_document_segment(file_id, start, end)
                    continue
                else:
                    # calculate the new embedding
                    # update milvus
                    raw_text = " ".join([str(sent) for sent in 
                                        new_sentences[start + accu_shift:end + accu_shift + shift_between + 1]])
                    embeddings, _ = get_embeddings(raw_text, file_metadata)
                    update_document_segment(user_id, file_id, (start, end), embeddings,
                                            [(start + accu_shift, end + accu_shift + shift_between)]
                                            , raw_text)
        

# curl -i -X POST https://www.googleapis.com/drive/v3/channels/stop \
#   -H "Authorization: Bearer " \
#   -H "Content-Type: application/json" \
#   -d '{"id": "", "resourceId": ""}'
