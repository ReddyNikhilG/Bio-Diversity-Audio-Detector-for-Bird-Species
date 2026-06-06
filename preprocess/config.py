# preprocess/config.py

# ===============================
# LOCKED PREPROCESSING SPEC
# ===============================

SAMPLE_RATE = 22050
DURATION = 5  # seconds
SAMPLES_PER_FILE = SAMPLE_RATE * DURATION

N_MELS = 128
N_FFT = 2048
HOP_LENGTH = 512

TRAIN_SPLIT = 0.7
VAL_SPLIT = 0.15
TEST_SPLIT = 0.15

# ===============================
# SEPARATION CONFIG
# ===============================
# NMF source separation via scikit-learn (no external model download required)