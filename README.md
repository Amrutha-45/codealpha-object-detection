# 🎯 VisionTrack AI — Next-Gen Object Detection & Multi-Object Tracking SaaS Platform

> **CodeAlpha Artificial Intelligence Internship Project**
> Production-grade real-time AI object detection and persistent multi-object tracking powered by **YOLOv8** and **ByteTrack**, featuring a glassmorphic dashboard built with **React**, **TypeScript**, **Framer Motion**, **Tailwind CSS**, and **FastAPI**.


## 📖 Overview

VisionTrack AI detects and tracks multiple objects simultaneously in live webcam feeds, uploaded videos, and static images. Every detected object is assigned a **persistent tracking ID** that remains consistent frame-by-frame (e.g. `Person #1`, `Car #2`, `Dog #3`) with fading center-point motion trails.

The backend is a high-performance **FastAPI** service running **Ultralytics YOLOv8** for detection and **ByteTrack** for tracking. The frontend is a **React + Framer Motion + Tailwind CSS** dark-mode web application.

---

## ✨ Features & Highlights

### 🤖 AI Engine & Tracking
- **10 COCO Detection Classes**: `person`, `car`, `bicycle`, `bus`, `truck`, `dog`, `cat`, `bottle`, `chair`, `laptop`
- **ByteTrack Integration**: Persistent unique tracking IDs assigned to objects across frames
- **Category-Based Color Coding**: Distinct neon color highlights for Persons, Vehicles, Animals, and Objects
- **Motion Trails**: Fading trajectory polylines mapping historical object movement
- **Tracker Reset Isolation**: Enforced tracker memory resets between video sessions to prevent ID contamination

### 🎨 Futuristic AI SaaS Interface
- **Animated Hero Landing Page**: Floating glowing AI particles, neon gradient typography, and quick feature cards
- **Live Webcam Stream**: Real-time camera feed with active status badges and stream controls
- **Video Processing Engine**: H.264 web-compatible video export with browser native `<video>` playback
- **Image Inference Panel**: Bounding box overlay visualization and detailed object chips
- **Analytics & Distribution**: Interactive category breakdown progress bars, FPS gauge meters, and latency stats
- **Detection History Table**: Search, filter by category/class/confidence, and view raw bounding boxes
- **Data Export**: Export detection history and session statistics in **JSON** or **CSV** formats
- **Settings & Hotkeys**: Customizable YOLO model variants (`yolov8n`, `yolov8s`, `yolov8m`), confidence threshold sliders, theme toggle, and keyboard shortcuts (`Cmd+K`, `1-5`, `Esc`)

---

## 🛠️ Tech Stack

| Domain | Technologies |
|---|---|
| **AI Models** | Ultralytics YOLOv8 (yolov8n / yolov8s / yolov8m) |
| **Tracking** | ByteTrack (native Ultralytics `.track()`) |
| **Backend** | Python 3.11+, FastAPI, OpenCV, PyTorch, Pydantic v2 |
| **Frontend** | React 18, TypeScript, Vite, Framer Motion, Tailwind CSS |
| **Icons & UI** | lucide-react, react-hot-toast |
| **Data Export** | JSON, CSV Streaming |

---

## 📁 Folder Structure

```
visionTracker AI / codealpha-object-detection-tracking/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── detect.py      # Image & Video REST routes
│   │   │   ├── webcam.py      # Live webcam stream routes
│   │   │   ├── stats.py       # Live session statistics
│   │   │   └── export.py      # JSON and CSV export endpoints
│   │   ├── services/
│   │   │   ├── detector.py    # YOLOv8 wrapper & model cache
│   │   │   ├── tracker.py     # Motion trail tracker state
│   │   │   ├── video_processor.py # Frame & video pipeline
│   │   │   └── stats_service.py # Aggregate metrics
│   │   ├── models/
│   │   │   └── schemas.py     # Pydantic data contracts
│   │   ├── utils/
│   │   │   ├── drawing.py     # OpenCV bounding box & trail overlays
│   │   │   └── file_utils.py  # Disk I/O & file validation
│   │   ├── config.py          # App configuration
│   │   └── main.py            # FastAPI application entrypoint
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios API client & export helpers
│   │   ├── components/
│   │   │   ├── common/        # Button, LoadingSpinner, CountUp, Toast
│   │   │   ├── detection/     # Webcam, Image, Video, History, BoundingBox
│   │   │   ├── landing/       # LandingHero overview section
│   │   │   ├── layout/        # Sidebar, Header
│   │   │   ├── modals/        # Settings, About, KeyboardShortcuts
│   │   │   └── stats/         # StatsCards, StatsAnalyticsCharts
│   │   ├── hooks/             # useDetectionStats, useWebcam
│   │   ├── styles/            # index.css (glassmorphism & neon theme)
│   │   ├── types/             # TypeScript definitions
│   │   ├── App.tsx            # Main AI Dashboard SPA
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
└── README.md
```

---

## 🚀 Commands to Run the Project

### 1. Backend Setup & Launch

```bash
# Navigate to backend directory
cd backend

# Create & activate virtual environment
python -m venv venv
# On Windows PowerShell:
venv\Scripts\activate
# On Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server (runs on http://localhost:8000)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup & Launch

```bash
# Open a second terminal and navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server (runs on http://localhost:5173)
npm run dev
```

Open your browser and navigate to `http://localhost:5173` to experience the VisionTrack AI Dashboard!

---

## 🔮 Future Scope

- **Custom YOLO Weights Upload**: Allow users to drop custom fine-tuned `.pt` weights directly into the dashboard.
- **RTSP IP Camera Input**: Direct streaming support for IP security cameras via RTSP protocol endpoints.
- **Multi-Camera Grid View**: Simultaneous multi-camera grid dashboard for enterprise surveillance monitoring.
- **DB Persistence**: PostgreSQL / Supabase integration for long-term historical tracking analytics storage.
