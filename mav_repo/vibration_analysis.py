import cv2
import numpy as np
from scipy.fft import fft, fftfreq
import matplotlib.pyplot as plt

def extract_motion_signal(video_path, roi=None):
    """
    Extract a motion signal from a video, optionally within an ROI.
    Uses Lucas-Kanade optical flow on good features to track.
    roi: tuple (x, y, w, h)
    """
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0 or np.isnan(fps):
        fps = 30.0 # fallback
        
    ret, old_frame = cap.read()
    if not ret:
        raise ValueError("Cannot read video")
        
    old_gray = cv2.cvtColor(old_frame, cv2.COLOR_BGR2GRAY)
    
    if roi is not None:
        x, y, w, h = roi
        mask = np.zeros_like(old_gray)
        mask[y:y+h, x:x+w] = 255
    else:
        mask = None
        
    # params for ShiTomasi corner detection
    feature_params = dict(maxCorners=100, qualityLevel=0.3, minDistance=7, blockSize=7)
    # Parameters for lucas kanade optical flow
    lk_params = dict(winSize=(15, 15), maxLevel=2, criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 0.03))
    
    p0 = cv2.goodFeaturesToTrack(old_gray, mask=mask, **feature_params)
    if p0 is None:
        # Fallback to simple dense optical flow or center pixel tracking if no features
        p0 = np.array([[[old_gray.shape[1]//2, old_gray.shape[0]//2]]], dtype=np.float32)

    motion_signal_x = []
    motion_signal_y = []
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # calculate optical flow
        p1, st, err = cv2.calcOpticalFlowPyrLK(old_gray, frame_gray, p0, None, **lk_params)
        
        if p1 is not None and len(p1[st==1]) > 0:
            good_new = p1[st==1]
            good_old = p0[st==1]
            
            # calculate average displacement
            displacement = np.mean(good_new - good_old, axis=0)
            motion_signal_x.append(displacement[0])
            motion_signal_y.append(displacement[1])
            
            # Update the previous frame and previous points
            old_gray = frame_gray.copy()
            p0 = good_new.reshape(-1, 1, 2)
        else:
            motion_signal_x.append(0)
            motion_signal_y.append(0)
            
    cap.release()
    
    # Integrate velocity to get displacement
    displacement_x = np.cumsum(motion_signal_x)
    displacement_y = np.cumsum(motion_signal_y)
    
    # We can use the magnitude or just the dominant axis
    signal = displacement_y # assuming vertical vibration is typical, or combine them
    
    # Detrend the signal (remove mean)
    signal = signal - np.mean(signal)
    return signal, fps

def analyze_vibration(signal, fps):
    """
    Perform FFT and compute RMS/Amplitude.
    """
    N = len(signal)
    T = 1.0 / fps
    
    # FFT
    yf = fft(signal)
    xf = fftfreq(N, T)[:N//2]
    magnitude = 2.0/N * np.abs(yf[0:N//2])
    
    # Dominant frequency
    dom_freq_idx = np.argmax(magnitude[1:]) + 1 # skip DC
    dominant_freq = xf[dom_freq_idx]
    
    # Amplitude and RMS
    amplitude = np.max(np.abs(signal))
    rms = np.sqrt(np.mean(np.square(signal)))
    
    return {
        'frequencies': xf,
        'magnitudes': magnitude,
        'dominant_freq_hz': dominant_freq,
        'amplitude_pixels': amplitude,
        'rms_pixels': rms
    }

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--video', type=str, required=True)
    args = parser.parse_args()
    
    sig, fps = extract_motion_signal(args.video)
    res = analyze_vibration(sig, fps)
    
    print(f"Dominant Frequency: {res['dominant_freq_hz']:.2f} Hz")
    print(f"Amplitude (pixels): {res['amplitude_pixels']:.2f}")
    print(f"RMS (pixels): {res['rms_pixels']:.2f}")
