from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, models, database

router = APIRouter()

@router.get("/api/photos/ranking", response_model=List[models.PhotoRankingResponse])
def get_photos_ranking(db: Session = Depends(database.get_db)):
    rankings = crud.get_photo_rankings(db)
    # Manually construct response to match Pydantic model if necessary
    # This is needed if crud returns DB models directly and they don't perfectly match
    # For PhotoVoteDB, it should map well if orm_mode=True is set.
    return rankings


@router.get("/api/groups/ranking", response_model=List[models.GroupRankingResponse])
def get_groups_ranking(db: Session = Depends(database.get_db)):
    return crud.get_group_rankings(db)

@router.get("/api/available-photos", response_model=List[models.AvailablePhoto])
def list_available_photos():
    """
    Lists all available photos from the images directory.
    """
    photos = crud.get_available_photos_from_disk()
    if not photos:
        # This could be an empty list if no images, or an error if dir not found.
        # crud.get_available_photos_from_disk handles FileNotFoundError by returning [].
        pass
    return photos
