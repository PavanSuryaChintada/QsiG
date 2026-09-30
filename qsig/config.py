"""
QSIG — Configuration
Single source for seeds, defaults, and thresholds.
Every module imports this. Every experiment records its seed in its output.
"""

SEED = 20260101
KEY_LENGTH_L = 256
N_RUNS_DEFAULT = 200
BASES = ("X", "Y", "Z")

# Statistical parameters
ALPHA = 0.01      # SPRT false positive
BETA = 0.01       # SPRT false negative
TARGET_FRR = 0.01 # false rejection target for threshold derivation
SIG_LEVEL = 0.05  # chi2 attribution significance

# CHSH parameters
CHSH_TEST_FRACTION = 0.10  # fraction of rounds used for CHSH
CHSH_SECURE_MIN = 2.40     # below this -> entanglement compromised
TSIRELSON = 2.8284271247461903  # 2*sqrt(2)

# Other parameters
DECOY_FRACTION = 0.15
MAX_QUBITS_GROVER = 16

# Fingerprint attribution accumulates over a session of signatures (~850 samples per basis)
SESSION_SIGNATURES = 10
