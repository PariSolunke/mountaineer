import pandas as pd
from scipy.ndimage.filters import gaussian_filter

def mean_imp(X):
    return X.mean()


def zero_imp(X):
    zero_imputation = X.iloc[0:, ].copy(deep=True)
    zero_imputation.values[:] = 0
    return zero_imputation


def blur_imp(X):
    sigma = 3
    return pd.DataFrame(data=gaussian_filter(X, sigma=sigma), columns=X.columns)


def load_imputation(name, X):
    options = {
        'blur': blur_imp,
        'mean': mean_imp,
        'zero': zero_imp
    }
    return options[name](X)
