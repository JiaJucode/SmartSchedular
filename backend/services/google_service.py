import os.path
from dotenv import load_dotenv
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from models.google_model import GoogleDB
from google.oauth2.credentials import Credentials
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from milvus.milvus_client import milvus_client
from googleapiclient.http import MediaIoBaseDownload
from ai.embedder import get_embeddings, get_indexed_content
from services.text_processor_service import get_text_difference, text_to_sentences
import PyPDF2
import io
from flask import current_app as app

load_dotenv()
CLIENT_ID = os.environ.get("CLIENT_ID")
API_KEY = os.environ.get("API_KEY")
CLIENT_SECRET = os.environ.get("CLIENT_SECRET")

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
    result = GoogleDB.get_tokens(user_id)
    access_token, refresh_token = GoogleDB.get_tokens(user_id)
    return init_cred(access_token, refresh_token)

def get_doc(user_id: int, file_id: str, file_index: int) -> tuple | None:
    """
    Get the document from Google Drive
    """
    if GoogleDB.check_connected(user_id) is False:
        return None
    cred = get_cred(user_id)
    service = build("drive", "v3", credentials=cred)
    file_info = None
    try:
        file_info = service.files().get(fileId=file_id).execute()
    except HttpError as e:
        app.logger.error("error: " + str(e))
        return None
    if file_info:
        text, metadata = get_doc_content(file_info, cred)
        return get_indexed_content(text, metadata, file_index), metadata
    
def get_doc_content(file_info: dict, creds: Credentials) -> tuple:
    service = build("drive", "v3", credentials=creds)
    metadata = "file name: " + file_info["name"]
    text = ""
    if file_info["mimeType"] == "application/pdf":
        request = service.files().get_media(fileId=file_info["id"], mimeType="application/pdf")
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while done is False:
            _, done = downloader.next_chunk()
        fh.seek(0)

        reader = PyPDF2.PdfFileReader(fh)
        for page in reader.pages:
            text += page.extract_text() + "\n"
    elif file_info["mimeType"] == "application/vnd.google-apps.document":
        request = service.files().export_media(fileId=file_info["id"], mimeType="text/plain")
        text = request.execute().decode("utf-8")
    return text, metadata

def doc_process(file_info: dict, creds: Credentials, user_id: int) -> None:
    """
    Process the document
    """
    app.logger.info("processing file: " + str(file_info))
    text, metadata = get_doc_content(file_info, creds)
    # calculate embeddings
    embeddings, embedding_range = get_embeddings(text, metadata)
    app.logger.info("embedding length: " + str(len(embeddings)))
    # store in milvus
    milvus_client.inserts(user_id, embeddings, file_info["id"])

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
    creds = init_cred(access_token, refresh_token)
    # if creds and creds.expired and creds.refresh_token:
    #     creds.refresh(Request())
    # if not creds.valid:
    #     app.logger.info("Invalid credentials")

    service = build("drive", "v3", credentials=creds)
    files = service.files().list(
        pageSize=100, 
        fields="files(id, name, mimeType)",
        q="mimeType='application/vnd.google-apps.document' or mimeType='application/pdf'"
        ).execute()
    app.logger.info("results: " + str(files))
    # request for push notification
    # get all files
    # for each file, get content, calculate embedding and store in milvus
    # for file in files:
    doc_process(files["files"][0], creds, user_id)

    return {"message": "Refresh token set up successfully"}

# TODO: test this
def update_from_file_change(user_id: int, file_id: str, file_metadata: str, old_file: str, new_file: str) -> None:
    new_sentences = text_to_sentences(new_file)
    diffs = get_text_difference(old_file, new_file)
    # get all segments from google_drive_files_usage db and 
    segments = milvus_client.get_chunk_ranges(user_id, file_id)
    segments.sort(key=lambda x: x[0])
    accu_shift = 0
    shift_buffer = {}
    new_segments = []
    for start, end in segments:
        # clean up shift buffer
        old_shifts = [shift for i, shift in shift_buffer.items() if i < start]
        accu_shift = sum(old_shifts)
        shift_buffer = {i: shift for i, shift in shift_buffer.items() if i >= start}

        # update the segment diffs
        diffs = [diff for diff in diffs if diff[0] >= start]
        segment_diffs = [diff for diff in diffs if diff[0] <= end]

        # if shift is 0, buffer is empty and no diff, copy the rest of the segments and break
        if len(diffs) == 0 and len(shift_buffer) == 0 and accu_shift == 0:
            new_segments.extend([seg for seg in segments if seg[0] >= start])
            break

        # if shift is not 0, update the current segment
        if len(segment_diffs) == 0:
            new_segments.append(start + accu_shift, end + accu_shift)
            continue
        insert_or_delete = [diff for diff in segment_diffs if diff[1] == "insert" or diff[1] == "delete"]
        if len(insert_or_delete) > 0:
            # for updating subsequent segment indices
            for change in insert_or_delete:
                if change[1] == "insert":
                    shift_buffer[change[0]] = 1
                elif change[1] == "delete":
                    shift_buffer[change[0]] = -1
        shift_between = sum([shift for i, shift in shift_buffer.items() if i <= end])
        start += accu_shift
        end += accu_shift + shift_between

        # check if there is any insert or replace
        insert_or_replace = [diff for diff in segment_diffs if diff[1] == "insert" or diff[1] == "replace"]
        if len(insert_or_replace) > 0:
            # might need to split the segment
            # get embedding for the new segment/s from embedder
            embeddings, index_ranges = get_embeddings(" ".join(
                [str(sent) for sent in new_sentences[start:end + 1]]), file_metadata)
            # TODO: update milvus instead of just inserting
            milvus_client.inserts(user_id, embeddings, file_id)
            new_segments.extend(index_ranges)
                
        else:
            # check if there are any deletes
            if len(segment_diffs) != len(insert_or_replace):
                # check if everything is deleted
                # if yes, delete the segment from milvus
                if len(segment_diffs) == end - start + 1:
                    # delete from milvus
                    continue
                else:
                    # calculate the new embedding
                    # update milvus
                    pass
            shift_between = sum([shift for i, shift in shift_buffer.items() if i <= end])
            start += accu_shift
            end += accu_shift + shift_between
            new_segments.append((start, end))
