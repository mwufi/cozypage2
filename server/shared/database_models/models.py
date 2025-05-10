from sqlalchemy import Column, String, Text, JSON, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func # For server_default=func.now()

# from sqlalchemy.orm import declarative_base
# Base = declarative_base()
from shared.database_config.database import Base # Adjusted Base import

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, unique=True, index=True, nullable=False) 
    username = Column(String, nullable=True)
    color_theme = Column(String, nullable=True, default="default")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    google_tokens = relationship("UserGoogleToken", back_populates="profile")

    def __repr__(self):
        return f"<Profile(id={self.id}, user_email='{self.user_email}', username='{self.username}')>"


class UserGoogleToken(Base):
    __tablename__ = "user_google_tokens"

    user_email = Column(String, primary_key=True, index=True) 
    token = Column(String, nullable=False)
    refresh_token = Column(String, nullable=True)
    token_uri = Column(String, nullable=False)
    client_id = Column(String, nullable=False)
    client_secret = Column(String, nullable=False)
    scopes = Column(JSON, nullable=False)

    profile_id = Column(Integer, ForeignKey('profiles.id'), nullable=True, index=True) 
    profile = relationship("Profile", back_populates="google_tokens")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "user_email": self.user_email,
            "token": self.token,
            "refresh_token": self.refresh_token,
            "token_uri": self.token_uri,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "scopes": self.scopes
        }

    @classmethod
    def from_dict(cls, data: dict):
        return cls(
            user_email=data.get("user_email"),
            token=data.get("token"),
            refresh_token=data.get("refresh_token"),
            token_uri=data.get("token_uri"),
            client_id=data.get("client_id"),
            client_secret=data.get("client_secret"),
            scopes=data.get("scopes", [])
        )

class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    completed = Column(Boolean, default=False, nullable=False)
    # Optional: Link to a profile if todos are user-specific
    # profile_id = Column(Integer, ForeignKey('profiles.id'), nullable=True)
    # profile = relationship("Profile") # Add backref in Profile if needed

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Todo(id={self.id}, title='{self.title}', completed={self.completed})>" 