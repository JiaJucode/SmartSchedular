import os
from flask import current_app as app

FILE_PATH = "/local_storage"

class FileStorageModel:
    def get_file_content(file_id) -> str | None:
        if not os.path.exists(os.path.join(FILE_PATH, file_id + ".txt")):
            # list all files in the directory
            app.logger.error("file not found")
            app.logger.error(os.listdir(FILE_PATH))
            return None
        with open(os.path.join(FILE_PATH, file_id + ".txt"), "r") as f:
            return f.read()
        
    def update_file(file_id, content):
        try:
            with open(os.path.join(FILE_PATH, file_id + ".txt"), "w") as f:
                f.write(content)
            return True
        except Exception as e:
            app.logger.error("error updating file: %s", e)
            return False

    def delete_file(file_id) -> bool:
        try:
            os.remove(os.path.join(FILE_PATH, file_id + ".txt"))
            return True
        except Exception as e:
            app.logger.error("error deleting file: %s", e)
            return False

    def create_file(file_id, content) -> bool:
        try:
            with open(os.path.join(FILE_PATH, file_id + ".txt"), "w") as f:
                f.write(content)
            return True
        except Exception as e:
            app.logger.error("error creating file: %s", e)
            return False
