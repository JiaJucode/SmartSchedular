import os.path
from dotenv import load_dotenv
from googleapiclient.discovery import build
from models.google_model import GoogleDB
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from milvus.milvus_client import milvus_client
from googleapiclient.http import MediaIoBaseDownload
from ai.embedder import get_embeddings
from services.text_processor_service import get_text_difference, text_to_sentences, text_preprocessing
import PyPDF2
import requests
import io
from flask import current_app as app

load_dotenv()
CLIENT_ID = os.environ.get("CLIENT_ID")
API_KEY = os.environ.get("API_KEY")
CLIENT_SECRET = os.environ.get("CLIENT_SECRET")
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
    access_token, refresh_token = GoogleDB.get_tokens(user_id)
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
    GoogleDB.update_token(user_id, access_token, refresh_token)
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

def get_doc(user_id: int, file_id: str) -> tuple | None:
    """
    Get the document from Google Drive
    """
    if GoogleDB.check_connected(user_id) is False:
        return None
    cred = get_cred(user_id)
    app.logger.info("cred: " + str(cred))
    service = build_service(user_id, cred)
    if not service:
        return None, None
    file_info = None
    try:
        file_info = service.files().get(fileId=file_id).execute()
        return get_doc_content(user_id, file_info, cred) if file_info else None, None
    except Exception as e:
        app.logger.error("error: " + str(e))
        return None, None

def get_doc_content(user_id: int, file_info: dict, creds: Credentials) -> tuple:
    service = build_service(user_id, creds)
    if not service:
        return "", ""
    metadata = "file name: " + file_info["name"]
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
    # calculate embeddings
    embeddings, embedding_range = get_embeddings(text, metadata)
    app.logger.info("embedding length: " + str(len(embeddings)))
    # store in milvus
    milvus_client.inserts(user_id, file_info["id"], embeddings, embedding_range)

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
                                    "redirect_uri": "http://localhost:3000",
                                    "grant_type": "authorization_code"
                                })
    if response.status_code != 200:
        return {"error": "Failed to get access token"}
    response = response.json()
    access_token = response["access_token"]
    refresh_token = response["refresh_token"]
    app.logger.info("access_token: " + access_token)
    app.logger.info("refresh_token: " + refresh_token)
    GoogleDB.add_token(user_id, access_token, refresh_token)
    GoogleDB.set_syncing(user_id, True)
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
    for file in files["files"]:
        doc_process(file, creds, user_id)
    GoogleDB.set_syncing(user_id, False)

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
            break

        # if shift is not 0 and no change in the segment, update the segment range and continue
        if len(segment_diffs) == 0:
            milvus_client.update_segment_range(user_id, file_id, (start, end), (start + accu_shift, end + accu_shift))
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

        # check if there is any insert or replace
        insert_or_replace = [diff for diff in segment_diffs if diff[1] == "insert" or diff[1] == "replace"]
        if len(insert_or_replace) > 0:
            # might need to split the segment
            # get embedding for the new segment/s from embedder
            embeddings, index_ranges = get_embeddings(" ".join(
                [str(sent) for sent in new_sentences[start + accu_shift:end + accu_shift + shift_between]]), file_metadata)
            # update the current segment and insert the rest
            index_ranges = [(start + accu_shift + b, start + accu_shift + e) for b, e in index_ranges]
            milvus_client.update_segment(user_id, file_id, (start, end), embeddings[0], index_ranges[0])
            for i in range(1, len(embeddings)):
                milvus_client.inserts(user_id, file_id, embeddings[i], index_ranges[i])

        else:
            # check if there are any deletes
            if len(segment_diffs) != len(insert_or_replace):
                # check if everything is deleted
                # if yes, delete the segment from milvus
                if len(segment_diffs) == end - start + 1:
                    # delete from milvus
                    milvus_client.delete_segment(user_id, file_id, (start, end))
                    continue
                else:
                    # calculate the new embedding
                    # update milvus
                    embeddings, _ = get_embeddings(" ".join(
                        [str(sent) for sent in 
                         new_sentences[start + accu_shift:end + accu_shift + shift_between]]), file_metadata)
                    milvus_client.update_segment(user_id, file_id, (start, end), embeddings[0],
                                                    (start + accu_shift, end + accu_shift + shift_between))
