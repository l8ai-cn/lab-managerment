from fastapi import APIRouter, Depends, UploadFile

from src.core.deps import get_current_user
from src.modules.users.models import User
from src.shared.file_storage import save_upload

router = APIRouter(prefix="/upload", tags=["文件上传"])


@router.post("")
async def upload_file(
    file: UploadFile,
    subdir: str = "general",
    user: User = Depends(get_current_user),
):
    url = await save_upload(file, subdir=subdir)
    return {"url": url, "filename": file.filename}
