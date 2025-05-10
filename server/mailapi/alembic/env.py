import os
import sys # Import sys
from logging.config import fileConfig
import asyncio # Added for async

from dotenv import load_dotenv # Import load_dotenv

# Determine the path to the .env file (e.g., server/mailapi/.env)
# Assuming env.py is in server/mailapi/alembic/
# So, ../../.env relative to this file should point to server/mailapi/.env
dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env'))
if os.path.exists(dotenv_path):
    print(f"Loading .env file from: {dotenv_path}")
    load_dotenv(dotenv_path=dotenv_path)
else:
    print(f".env file not found at {dotenv_path}, relying on environment variables.")

# Add the parent directory of 'mailapi' (i.e., 'server/') to sys.path
# This allows `from mailapi.models import Base` to work correctly.
# Adjust the number of os.path.dirname calls if your alembic dir is nested differently.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))) # Go up to /app

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine # For async engine

from alembic import context

# Import Base from mailapi.models
# from mailapi.models import Base # Changed from `from models import Base`
from shared.database_config.database import Base # Use shared Base

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set the DATABASE_URL from environment variable for alembic.ini usage
# The %(DB_URL)s in alembic.ini will pick this up.
db_url = os.getenv("DATABASE_URL")
if not db_url:
    raise ValueError("DATABASE_URL environment variable not set")
config.set_main_option("sqlalchemy.url", db_url)


# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata # Set to your Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        # Include render_as_batch for SQLite and other DBs that need it
        render_as_batch=True
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        # Include render_as_batch for SQLite and other DBs that need it
        render_as_batch=True
        )

    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # Get the sqlalchemy.url from the config object, which we updated from DB_URL
    db_url_from_config = config.get_main_option("sqlalchemy.url")
    if not db_url_from_config:
        # Fallback or ensure alembic.ini provides it if not set via env var for some reason
        # (though we explicitly set it above from os.getenv)
        raise ValueError("sqlalchemy.url not found in Alembic config and DATABASE_URL was not set.")

    connectable = create_async_engine(
        db_url_from_config, # Use the URL from config (derived from env var)
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
