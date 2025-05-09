# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies (if any are needed later, add them here)
# RUN apt-get update && apt-get install -y --no-install-recommends some-package && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install Python dependencies using uv
# First, ensure uv is installed. We'll use pip to install uv itself.
RUN pip install uv

# Now, use uv to install the dependencies from requirements.txt
RUN uv pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
# We'll copy the entire mailapi directory content into /app
# Adjust if your main.py is in a subdirectory of mailapi, e.g., COPY . .
COPY . .

# Make port 8000 available to the world outside this container
EXPOSE 8000

# # Define environment variables that can be overridden at runtime
# ENV JWT_SECRET_KEY="your-super-secret-jwt-key-please-change"
# ENV FRONTEND_APP_URL="http://localhost:3000"
# ENV BACKEND_BASE_URL="http://localhost:8000"
# ENV SESSION_SECRET_KEY="your-session-secret-key-please-change"
# # Example, override this in your docker run command or docker-compose file
# ENV DATABASE_URL="postgresql+asyncpg://user:password@host:port/dbname"
# # Ensure OAUTHLIB_INSECURE_TRANSPORT is set for development if using HTTP for callbacks
# # ENV OAUTHLIB_INSECURE_TRANSPORT="1"

# Command to run the application
# Ensure your main.py and the app object are correctly referenced
# The command from your comments was: uvicorn server.mailapi.main:app --reload
# For production, remove --reload and specify host and port
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"] 