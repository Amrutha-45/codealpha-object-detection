# =========================================================
# Backend Dockerfile — AI Object Detection & Tracking API
# =========================================================
FROM python:3.11-slim

# System dependencies required by OpenCV & FFmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Upgrade pip first
RUN pip install --no-cache-dir --upgrade pip

# Step 1: Install PyTorch CPU-only wheels separately.
# Using the dedicated CPU wheel index keeps the image ~500MB instead of ~2GB.
RUN pip install --no-cache-dir \
    torch==2.3.1+cpu \
    torchvision==0.18.1+cpu \
    --extra-index-url https://download.pytorch.org/whl/cpu

# Step 2: Install remaining Python dependencies (torch already present, so
#         ultralytics won't pull in the full GPU torch on top).
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create runtime directories
RUN mkdir -p storage/uploads storage/outputs storage/screenshots weights logs

EXPOSE 8000

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
