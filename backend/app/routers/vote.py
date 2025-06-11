from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, models, database

router = APIRouter()

MAX_VOTES_PER_SUBMISSION = 25

@router.post("/api/vote", status_code=status.HTTP_201_CREATED)
def submit_vote(
    vote_request: models.VoteRequest, db: Session = Depends(database.get_db)
):
    selected_photos = vote_request.selected_photos
    if not selected_photos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No photos selected.",
        )
    if len(selected_photos) > MAX_VOTES_PER_SUBMISSION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot vote for more than {MAX_VOTES_PER_SUBMISSION} photos at a time.",
        )

    # Basic validation: check if photo filenames are somewhat valid (e.g., exist on disk or parseable)
    # For simplicity, we'll rely on parsing and DB insertion logic in crud.
    # A more robust check would verify against `get_available_photos_from_disk()`
    
    available_photo_filenames = [p.filename for p in crud.get_available_photos_from_disk()]

    for photo_filename_no_ext in selected_photos:
        if photo_filename_no_ext not in available_photo_filenames:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Photo '{photo_filename_no_ext}' not found or invalid.",
            )
        crud.update_vote(db, photo_filename_no_ext)
    
    return {"message": "Votes submitted successfully"}
