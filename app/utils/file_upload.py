from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def save_upload_files(files: list[UploadFile], upload_dir: str) -> list[str]:
    if not files:
        return []

    Path(upload_dir).mkdir(parents=True, exist_ok=True)
    saved_paths: list[str] = []

    for file in files:
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type for {file.filename}. Allowed: jpg, jpeg, png",
            )

        unique_name = f"{uuid4().hex}{ext}"
        target_path = Path(upload_dir) / unique_name
        with target_path.open("wb") as buffer:
            buffer.write(file.file.read())
        saved_paths.append(str(target_path).replace("\\", "/"))

    return saved_paths
