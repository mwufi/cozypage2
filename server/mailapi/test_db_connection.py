import asyncio
import os
from sqlalchemy import create_engine as create_sync_engine, text
from sqlalchemy.ext.asyncio import create_async_engine
from dotenv import load_dotenv
from rich.console import Console
from rich.table import Table
from rich.text import Text

console = Console()

def get_db_url():
    dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(dotenv_path):
        load_dotenv(dotenv_path=dotenv_path)
    else:
        console.print(f"[.red]Warning:[/] .env file not found at {dotenv_path}. Relying on environment variables.")
    
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        console.print("[.red]Error:[/] DATABASE_URL not found in environment variables or .env file.")
        return None
    return db_url

async def test_async_connection(db_url):
    if not db_url:
        return "DATABASE_URL not provided", False

    async_db_url = db_url
    if "+psycopg2" in async_db_url:
        async_db_url = async_db_url.replace("+psycopg2", "+asyncpg")
    elif not async_db_url.startswith("postgresql+asyncpg://") and async_db_url.startswith("postgresql://"):
        async_db_url = async_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif not async_db_url.startswith("postgresql+asyncpg://"):
        return f"URL not convertible to asyncpg: {db_url}", False

    engine = None
    try:
        engine = create_async_engine(async_db_url, echo=False)
        async with engine.connect() as connection:
            result = await connection.execute(text("SELECT 1"))
            scalar_result = result.scalar_one()
            return f"Successfully connected (async). SELECT 1 result: {scalar_result}", True
    except Exception as e:
        return f"Async connection error: {e}", False
    finally:
        if engine:
            await engine.dispose()

def test_sync_connection(db_url):
    if not db_url:
        return "DATABASE_URL not provided", False

    sync_db_url = db_url
    if "+asyncpg" in sync_db_url:
        sync_db_url = sync_db_url.replace("+asyncpg", "+psycopg2")
    elif not sync_db_url.startswith("postgresql+psycopg2://") and sync_db_url.startswith("postgresql://"):
        sync_db_url = sync_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    elif not sync_db_url.startswith("postgresql+psycopg2://"):
         # If it does not start with postgresql+psycopg2:// try to make it so
        if "postgres" in sync_db_url and "://" in sync_db_url:
             parts = sync_db_url.split("://")
             sync_db_url = f"postgresql+psycopg2://{parts[1]}"
        else:
            return f"URL not convertible to psycopg2: {db_url}", False
    
    engine = None
    try:
        engine = create_sync_engine(sync_db_url, echo=False)
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            scalar_result = result.scalar_one()
            return f"Successfully connected (sync). SELECT 1 result: {scalar_result}", True
    except Exception as e:
        return f"Sync connection error: {e}", False
    finally:
        if engine:
            engine.dispose()

async def main():
    db_url_original = get_db_url()

    table = Table(title=Text("Database Connection Test Results", style="bold magenta"))
    table.add_column("Test Type", style="cyan", no_wrap=True)
    table.add_column("Status", style="green")
    table.add_column("Details", style="white")

    if not db_url_original:
        console.print("[bold red]Cannot proceed without DATABASE_URL.[/bold red]")
        return

    console.print(f"Using DATABASE_URL (host part for privacy): [bold blue]...@{db_url_original.split('@')[-1]}[/bold blue]")
    console.print(f"Full original DATABASE_URL (for debugging, be careful if sharing): [dim]{db_url_original}[/dim]")

    # Test Asynchronous Connection
    async_details, async_success = await test_async_connection(db_url_original)
    table.add_row(
        "Asynchronous (asyncpg)", 
        Text("SUCCESS", style="bold green") if async_success else Text("FAILURE", style="bold red"), 
        async_details
    )

    # Test Synchronous Connection
    sync_details, sync_success = test_sync_connection(db_url_original)
    table.add_row(
        "Synchronous (psycopg2)", 
        Text("SUCCESS", style="bold green") if sync_success else Text("FAILURE", style="bold red"), 
        sync_details
    )

    console.print(table)

if __name__ == "__main__":
    asyncio.run(main()) 