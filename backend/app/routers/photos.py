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

@router.get("/api/users/voted", response_model=List[models.VotedUser])
def list_voted_users(db: Session = Depends(database.get_db)):
    """
    Lists all users who have submitted votes.
    """
    users = crud.get_voted_users(db)
    return users

@router.get("/api/users/{username}/votes", response_model=List[models.UserVoteRecord])
def get_user_votes_details(username: str, db: Session = Depends(database.get_db)):
    """
    Retrieves all photos a specific user has voted for.
    """
    vote_details = crud.get_user_vote_details(db, username)
    if not vote_details and not db.query(crud.database.UserVoteLogDB.id).filter(crud.database.UserVoteLogDB.username == username).first():
        # Check if user exists at all, if not, 404. If user exists but has no votes (should not happen with current logic), return empty list.
        # This check is more about if the username itself is valid in the context of having voted.
        # A simpler check: if not vote_details: raise HTTPException(status_code=404, detail="User not found or no votes recorded for this user")
        # However, an empty list is a valid response if the user has voted for 0 photos (which is not possible with current UI)
        # or if their votes were somehow cleared.
        # For now, if crud.get_user_vote_details returns empty, it means either user not found or no votes.
        # Let's refine to specifically check if user has ever voted.
        user_exists_check = db.query(crud.database.UserVoteLogDB.id).filter(crud.database.UserVoteLogDB.username == username).first()
        if not user_exists_check:
             raise HTTPException(status_code=404, detail=f"User '{username}' not found in vote logs.")

    return vote_details
