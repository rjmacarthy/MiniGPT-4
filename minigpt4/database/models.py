from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import mapped_column
from pgvector.sqlalchemy import Vector

from minigpt4.database.repository import Base


class Image(Base):
    __tablename__ = "images"
    id = Column(Integer, primary_key=True)
    image_description = Column(String)
    base64_representation = Column(String)
