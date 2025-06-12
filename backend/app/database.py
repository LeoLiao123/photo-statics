import sqlalchemy
from sqlalchemy import create_engine, Column, Integer, String, MetaData, DateTime, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from datetime import datetime

DATABASE_URL = "sqlite:///./photovote.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Define the PhotoVote table model
class PhotoVoteDB(Base):
    __tablename__ = "photo_votes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    group_id = Column(Integer, nullable=False)
    photo_id = Column(Integer, nullable=False)
    filename = Column(String, nullable=False, unique=True, index=True)
    votes = Column(Integer, nullable=False, default=0)

# New table for user vote logs
class UserVoteLogDB(Base):
    __tablename__ = "user_vote_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, index=True, nullable=False)
    photo_filename = Column(String, index=True, nullable=False) # No foreign key to PhotoVoteDB.filename to keep it simple
    timestamp = Column(DateTime, default=datetime.utcnow)

def create_db_and_tables():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Ensure the images directory exists
IMAGES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "images") # backend/images
if not os.path.exists(IMAGES_DIR):
    os.makedirs(IMAGES_DIR)
    # Add a .gitkeep file to ensure the directory is tracked by git if empty
    with open(os.path.join(IMAGES_DIR, ".gitkeep"), "w") as f:
        pass
