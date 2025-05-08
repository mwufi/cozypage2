from sqlalchemy import Column, String, Text, JSON
from sqlalchemy.orm import relationship
from .database import Base # Import Base from our database.py

class UserGoogleToken(Base):
    __tablename__ = "user_google_tokens"

    user_email = Column(String, primary_key=True, index=True)
    token = Column(String, nullable=False)
    refresh_token = Column(String, nullable=True)
    token_uri = Column(String, nullable=False)
    client_id = Column(String, nullable=False)
    client_secret = Column(String, nullable=False)
    scopes = Column(JSON, nullable=False) # Storing scopes as JSON

    # If you plan to have a User model and link tokens to users directly:
    # user_id = Column(Integer, ForeignKey('users.id'))
    # user = relationship("User", back_populates="google_tokens")

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