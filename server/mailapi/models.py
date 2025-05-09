from sqlalchemy import Column, String, Text, JSON, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func # For server_default=func.now()
from .database import Base # Import Base from our database.py

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    # Assuming user_email is the unique identifier for a user's profile
    user_email = Column(String, unique=True, index=True, nullable=False) 
    username = Column(String, nullable=True)
    color_theme = Column(String, nullable=True, default="default") # Example default
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship to UserGoogleToken: A profile can have multiple Google tokens
    google_tokens = relationship("UserGoogleToken", back_populates="profile")

    def __repr__(self):
        return f"<Profile(id={self.id}, user_email='{self.user_email}', username='{self.username}')>"


class UserGoogleToken(Base):
    __tablename__ = "user_google_tokens"

    # user_email here is the email associated with THIS specific Google token/account.
    # It might be different from the profile's primary user_email if a user links multiple Google accounts.
    user_email = Column(String, primary_key=True, index=True) 
    token = Column(String, nullable=False)
    refresh_token = Column(String, nullable=True)
    token_uri = Column(String, nullable=False)
    client_id = Column(String, nullable=False)
    client_secret = Column(String, nullable=False)
    scopes = Column(JSON, nullable=False)

    # Foreign Key to link to the Profile table's 'id'
    profile_id = Column(Integer, ForeignKey('profiles.id'), nullable=True, index=True) 
    # Make profile_id nullable=False if every token MUST belong to a profile.
    # Set to True for now to allow existing tokens to be migrated without a profile_id initially,
    # or if you want to allow tokens that are not yet associated with a full profile.

    # Relationship to Profile
    profile = relationship("Profile", back_populates="google_tokens")
    
    # Timestamps for the token itself
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
        # Note: This doesn't handle profile_id association directly, 
        # that would typically be handled by the calling logic.
        return cls(
            user_email=data.get("user_email"),
            token=data.get("token"),
            refresh_token=data.get("refresh_token"),
            token_uri=data.get("token_uri"),
            client_id=data.get("client_id"),
            client_secret=data.get("client_secret"),
            scopes=data.get("scopes", [])
        ) 