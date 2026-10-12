import cv2
import numpy as np
from scipy.fft import fft, fftfreq

def extract_motion_signal(video_path):
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0 or np.isnan(fps):
        fps = 30.0
        
    ret, old_frame = cap.read()
    if not ret:
        raise ValueError("Cannot read video")
        
    old_gray = cv2.cvtColor(old_frame, cv2.COLOR_BGR2GRAY)
    
    feature_params = dict(maxCorners=100, qualityLevel=0.3, minDistance=7, blockSize=7)
    lk_params = dict(winSize=(15, 15), maxLevel=2, criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 0.03))
    
    p0 = cv2.goodFeaturesToTrack(old_gray, mask=None, **feature_params)
    if p0 is None:
        p0 = np.array([[[old_gray.shape[1]//2, old_gray.shape[0]//2]]], dtype=np.float32)

    motion_signal_y = []
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        p1, st, err = cv2.calcOpticalFlowPyrLK(old_gray, frame_gray, p0, None, **lk_params)
        
        if p1 is not None and len(p1[st==1]) > 0:
            good_new = p1[st==1]
            good_old = p0[st==1]
            displacement = np.mean(good_new - good_old, axis=0)
            motion_signal_y.append(displacement[1])
            old_gray = frame_gray.copy()
            p0 = good_new.reshape(-1, 1, 2)
        else:
            motion_signal_y.append(0)
            
    cap.release()
    
    signal = np.cumsum(motion_signal_y)
    signal = signal - np.mean(signal)
    return signal, fps

def analyze_vibration(signal, fps):
    N = len(signal)
    if N == 0:
        return {'frequencies': [], 'magnitudes': [], 'dominant_freq_hz': 0, 'amplitude_pixels': 0, 'rms_pixels': 0}
        
    T = 1.0 / fps
    yf = fft(signal)
    xf = fftfreq(N, T)[:N//2]
    magnitude = 2.0/N * np.abs(yf[0:N//2])
    
    dom_freq_idx = np.argmax(magnitude[1:]) + 1 if len(magnitude) > 1 else 0
    dominant_freq = xf[dom_freq_idx] if dom_freq_idx < len(xf) else 0
    
    amplitude = np.max(np.abs(signal))
    rms = np.sqrt(np.mean(np.square(signal)))
    
    return {
        'dominant_freq_hz': float(dominant_freq),
        'amplitude_pixels': float(amplitude),
        'rms_pixels': float(rms)
    }
