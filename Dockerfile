# Dockerfile — For deploying the backend to Hugging Face Spaces (FREE 16GB RAM CPU Server)
FROM python:3.10-slim

# Install system audio dependencies
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first to leverage caching
COPY requirements_colab.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend project
COPY . .

# Hugging Face Spaces routes web traffic to port 7860 by default
EXPOSE 7860

# Run FastAPI app
CMD ["uvicorn", "backend.api:app", "--host", "0.0.0.0", "--port", "7860"]
