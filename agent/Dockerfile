FROM python:3.11-slim

# Install system dependencies needed for building python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent code and configuration files
COPY agent.py .

# Command to run the agent in production start mode
CMD ["python", "agent.py", "start"]
