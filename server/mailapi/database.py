import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./mailapi.db")

# Create an async engine
# echo=True is useful for debugging, it logs all SQL statements
engine = create_async_engine(DATABASE_URL, echo=True, future=True)

# Create a sessionmaker that will be used to create AsyncSession instances
# expire_on_commit=False is important for async sessions, so that objects
# are not expired after commit and can still be accessed.
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,  # Explicitly set autocommit to False for async sessions
    autoflush=False,   # Explicitly set autoflush to False for async sessions
)

# Base class for declarative models
Base = declarative_base()

async def get_db() -> AsyncSession:
    """
    Dependency to get a database session.
    Ensures the session is closed after the request.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit() # Commit changes made during the request
        except Exception:
            await session.rollback() # Rollback in case of error
            raise
        finally:
            await session.close()

async def create_db_and_tables():
    """
    Creates all tables in the database.
    This should be called once when the application starts up,
    or as part of a migration script.
    """
    async with engine.begin() as conn:
        # For creating tables, if they don't exist
        # In a real app, you'd use Alembic for migrations.
        await conn.run_sync(Base.metadata.create_all)

# Example of how to initialize tables (e.g., in your main.py or a startup event)
# if __name__ == "__main__":
#     import asyncio
#     asyncio.run(create_db_and_tables()) 