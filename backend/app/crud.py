from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from . import models, database
import os
from datetime import datetime
from typing import List

def parse_filename(filename_no_ext: str):
    try:
        group_str, photo_str = filename_no_ext.split('-')
        return int(group_str), int(photo_str)
    except ValueError:
        return None, None # Or raise an error

def get_photo_by_filename(db: Session, filename: str):
    return db.query(database.PhotoVoteDB).filter(database.PhotoVoteDB.filename == filename).first()

def update_vote(db: Session, filename_no_ext: str):
    group_id, photo_id = parse_filename(filename_no_ext)
    if group_id is None or photo_id is None:
        # Invalid filename format
        return None

    db_photo = get_photo_by_filename(db, filename_no_ext)
    if db_photo:
        db_photo.votes += 1
    else:
        db_photo = database.PhotoVoteDB(
            filename=filename_no_ext,
            group_id=group_id,
            photo_id=photo_id,
            votes=1
        )
        db.add(db_photo)
    db.commit()
    db.refresh(db_photo)
    return db_photo

def record_user_vote(db: Session, username: str, photo_filename: str):
    user_vote_log = database.UserVoteLogDB(
        username=username,
        photo_filename=photo_filename,
        timestamp=datetime.utcnow()
    )
    db.add(user_vote_log)
    db.commit()
    db.refresh(user_vote_log)
    return user_vote_log

def get_photo_rankings(db: Session):
    return db.query(database.PhotoVoteDB).order_by(desc(database.PhotoVoteDB.votes)).all()

def get_group_rankings(db: Session):
    result = db.query(
        database.PhotoVoteDB.group_id,
        func.sum(database.PhotoVoteDB.votes).label("total_votes")
    ).group_by(database.PhotoVoteDB.group_id).order_by(desc("total_votes")).all()
    return [{"group_id": r.group_id, "total_votes": r.total_votes} for r in result]

def get_voted_users(db: Session) -> List[models.VotedUser]:
    users = db.query(database.UserVoteLogDB.username).distinct().order_by(database.UserVoteLogDB.username).all()
    return [models.VotedUser(username=user[0]) for user in users]

def get_user_vote_details(db: Session, username: str) -> List[models.UserVoteRecord]:
    user_votes = db.query(database.UserVoteLogDB).filter(database.UserVoteLogDB.username == username).all()
    
    vote_details = []
    for vote_log in user_votes:
        # Fetch corresponding photo details from PhotoVoteDB to get group_id
        photo_info = db.query(database.PhotoVoteDB.group_id).filter(database.PhotoVoteDB.filename == vote_log.photo_filename).first()
        group_id = photo_info.group_id if photo_info else 0 # Default group_id if not found (should not happen if data is consistent)
        
        vote_details.append(
            models.UserVoteRecord(
                username=vote_log.username,
                photo_filename=vote_log.photo_filename,
                group_id=group_id,
                photo_path=f"/images/{vote_log.photo_filename}.webp", # Assuming .webp extension
                timestamp=vote_log.timestamp
            )
        )
    return vote_details


def get_available_photos_from_disk():
    # Path relative to the project root when running uvicorn from there
    # This path needs to be correct based on where uvicorn is run.
    # If uvicorn backend.app.main:app is run from project root:
    images_dir = "backend/images"
    if not os.path.isdir(images_dir):
        # Fallback if running from backend/app directory (less ideal)
        alt_images_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "images")
        if os.path.isdir(alt_images_dir):
            images_dir = alt_images_dir
        else:
            return [] # Or raise an error if directory not found

    available_photos = []
    try:
        for f_name in os.listdir(images_dir):
            if f_name.lower().endswith(".webp"): # Assuming PNG format
                filename_no_ext = os.path.splitext(f_name)[0]
                available_photos.append(
                    models.AvailablePhoto(filename=filename_no_ext, path=f"/images/{f_name}")
                )
    except FileNotFoundError:
        print(f"Warning: Image directory '{images_dir}' not found.")
        return []
    return available_photos
