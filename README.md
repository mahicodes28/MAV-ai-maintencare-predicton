# MAV AI Maintenance Predictor 🚀

An end-to-end AI-powered predictive maintenance and vibration analysis platform. The system uses Lucas-Kanade optical flow motion tracking and FFT spectral analysis on equipment video recordings to measure dominant vibration frequencies, displacement amplitudes, and RMS intensity, identifying mechanical anomalies before catastrophic failure occurs.

---

## 🌐 Live Deployments & Endpoints

| Component | Status | URL |
| :--- | :--- | :--- |
| **Backend API** | 🟢 Live | `https://mav-ai-backend.onrender.com` |
| **API Interactive Docs (Swagger)** | 🟢 Live | `https://mav-ai-backend.onrender.com/docs` |
| **API Health Check** | 🟢 Live | `https://mav-ai-backend.onrender.com/health` |
| **Web Dashboard** | 🟢 Ready / Configured | `https://mav-ai-web.onrender.com` (Render Blueprint) |
| **Android APK** | 📱 Ready to build | Built via Expo EAS (`mobile/eas.json`) |

---

## 🏗️ System Architecture

```
                    ┌────────────────────────┐
                    │ Equipment Video Stream │
                    └───────────┬────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        │                                               │
┌───────▼────────────────────────┐   ┌──────────────────▼─────────────────┐
│     Web Dashboard (React)      │   │   Mobile App (Android / Expo)      │
│  (Overview, Graphs & Reports)  │   │   (Camera, Video Capture & Reports)│
└───────────────┬────────────────┘   └──────────────────┬─────────────────┘
                │                                       │
                └───────────────────┬───────────────────┘
                                    │ HTTPS (JSON / Multipart)
                                    ▼
                     ┌──────────────────────────────┐
                     │    FastAPI Backend Server    │
                     │  (Render / Docker Container) │
                     └──────────────┬───────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
     ┌──────▼────────┐      ┌───────▼────────┐      ┌───────▼────────┐
     │ OpenCV + SciPy│      │ SQLite/Postgres│      │   ReportLab    │
     │ Optical Flow  │      │  SQLAlchemy DB │      │ PDF Generator  │
     │  FFT Spectrum │      │ Machine Health │      │ Formal Reports │
     └───────────────┘      └────────────────┘      └────────────────┘
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | API status, health overview, and endpoint directory |
| `GET` | `/health` | Uptime health check probe (`{"status":"ok"}`) |
| `GET` | `/docs` | Interactive Swagger UI documentation |
| `GET` | `/machines/` | List all monitored machines with baselines |
| `GET` | `/machines/{id}` | Retrieve specific machine details |
| `POST` | `/machines/` | Register a new machine |
| `POST` | `/inspections/{id}/upload` | Upload MP4 inspection video & trigger background AI vibration analysis |
| `GET` | `/inspections/{id}` | Get vibration metrics history for a machine |
| `GET` | `/reports/{inspection_id}` | Download generated formal PDF inspection report |

---

## 🔬 AI Vibration Analysis Methodology

1. **Feature Tracking**: Lucas-Kanade pyramid optical flow (`calcOpticalFlowPyrLK`) extracts sub-pixel displacement signals from machine video frames.
2. **Signal Filtering**: Mean centering and trend removal isolate high-frequency mechanical vibration.
3. **Spectral Decomposition**: Fast Fourier Transform (FFT) computes the frequency spectrum:
   - **Dominant Frequency ($Hz$)**: Fundamental operating harmonic.
   - **Peak Amplitude ($px$)**: Maximum oscillation deflection.
   - **RMS Vibration ($px$)**: Root-mean-square kinetic energy.
4. **Health Thresholding**: Automated anomaly grading (`No significant anomaly` vs. `Warning`) triggers alerts.

---

## 📦 Local Development

### 1. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate       # On Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
python seed.py              # Seeds initial machine records
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Mobile App (Expo)
```bash
cd mobile
npm install
npm run android             # Starts Expo for Android
npm run web                 # Starts Expo for Web
```

### 3. Docker Deployment
```bash
docker compose up -d --build
```

---

## 📱 Building the Standalone Android APK

The mobile application is pre-configured with Expo Application Services (EAS):

1. Log in to your Expo account:
   ```bash
   cd mobile
   npx eas-cli login
   ```
2. Build the standalone installable APK:
   ```bash
   npx eas-cli build -p android --profile preview
   ```
3. EAS will build the `.apk` in the cloud and output a direct download link.

---

## ⚙️ Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | SQLAlchemy database connection string | `sqlite:///./app.db` |
| `PORT` | Web server listening port | `8000` (Assigned by Render) |
| `EXPO_PUBLIC_API_URL`| API URL for Web and Mobile | `https://mav-ai-backend.onrender.com` |
