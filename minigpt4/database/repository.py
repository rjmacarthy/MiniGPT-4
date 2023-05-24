from sqlalchemy import create_engine
from sqlalchemy_utils import create_database, database_exists
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import select
from sqlalchemy.sql import text
from typing import List


Base = declarative_base()


PGPASSWORD = "password"
PGUSER = "postgres"
PGDATABASE = "minigpt4"
PGHOST = "localhost"
PGPORT = 5432


def get_uri():
    return f"postgresql://{PGUSER}:{PGPASSWORD}@{PGHOST}:{PGPORT}/{PGDATABASE}"


def get_engine():
    engine = create_engine(get_uri())

    if not database_exists(engine.url):
        create_database(engine.url)

    with engine.connect() as con:
        con.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        con.commit()

    Base.metadata.create_all(engine)

    return engine


class Repository:
    def __init__(self, model_type):
        self.engine = get_engine()
        Session = sessionmaker(bind=self.engine)
        self.session = Session
        self.model_type = model_type

    def create(self, **kwargs):
        entity = self.model_type(**kwargs)
        with self.session() as session:
            session.add(entity)
            session.commit()
            session.refresh(entity)
        return entity

    def get_by_id(self, id):
        with self.session() as session:
            entity = session.query(self.model_type).get(id)
        return entity

    def list(self):
        with self.session() as session:
            entities = session.query(self.model_type).all()
        return entities

    def get_first(self):
        with self.session() as session:
            entity = session.query(self.model_type).first()
        return entity

    def search(self, embeddings):
        with self.session() as session:
            entities = session.scalars(
                select(self.model_type)
                .order_by(self.model_type.embedding.l2_distance(embeddings))
                .limit(4)
            ).all()
        return entities

    def update(self, id, **kwargs):
        with self.session() as session:
            entity = session.query(self.model_type).get(id)
            for key, value in kwargs.items():
                setattr(entity, key, value)
            session.commit()
        return entity

    def delete(self, id: int):
        with self.session() as session:
            entity = session.query(self.model_type).get(id)
            session.delete(entity)
            session.commit()
        return entity

    def delete_by_ids(self, ids: List[int]):
        with self.session() as session:
            entities = (
                session.query(self.model_type).filter(self.model_type.id.in_(ids)).all()
            )
            for entity in entities:
                session.delete(entity)
            session.commit()
        return entities
    
    def get_by_ids(self, ids: List[int]):
        with self.session() as session:
            entities = (
                session.query(self.model_type).filter(self.model_type.id.in_(ids)).all()
            )
        return entities

    def delete_all(self):
        with self.session() as session:
            session.query(self.model_type).delete()
            session.commit()
        return True
