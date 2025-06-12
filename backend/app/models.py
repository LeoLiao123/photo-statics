from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PhotoVoteBase(BaseModel):
    filename: str
    group_id: int
    photo_id: int

class PhotoVoteCreate(PhotoVoteBase):
    pass

class PhotoVote(PhotoVoteBase):
    id: int
    votes: int

    class Config:
        from_attributes = True # Updated from orm_mode

class VoteRequest(BaseModel):
    username: str # Added username
    selected_photos: List[str]

class PhotoRankingResponse(BaseModel):
    filename: str
    group_id: int
    photo_id: int
    votes: int

class GroupRankingResponse(BaseModel):
    group_id: int
    total_votes: int

class AvailablePhoto(BaseModel):
    filename: str
    path: str

# New model for user vote details (for admin display)
class UserVoteRecord(BaseModel):
    username: str
    photo_filename: str
    group_id: int # For easier lookup of photographer name
    photo_path: str # For displaying the image
    timestamp: datetime

    class Config:
        from_attributes = True # Updated from orm_mode

class VotedUser(BaseModel):
    username: str
    # No Config needed if no ORM interaction directly on this Pydantic model
