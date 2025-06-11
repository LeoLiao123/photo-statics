from pydantic import BaseModel
from typing import List, Optional

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
        orm_mode = True # For SQLAlchemy compatibility (Pydantic V1)
        # from_attributes = True # For Pydantic V2

class VoteRequest(BaseModel):
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
