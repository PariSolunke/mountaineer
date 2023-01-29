import numpy as np

def getF1ScoreAveraging(y):
    _, counts = np.unique(y, return_counts=True)
    return 'binary' if len(counts) == 2 else 'macro'