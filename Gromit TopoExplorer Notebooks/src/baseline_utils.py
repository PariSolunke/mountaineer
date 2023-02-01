import numpy as np
import pandas as pd
import random
import shap
import torch
from scipy.ndimage.filters import gaussian_filter

rs = 42
np.random.seed(rs)
random.seed(rs)
torch.manual_seed(rs)


class BaselineUtilNumpy():

    def __init__(self, N):
        self.shap_sample_size = N

    def create_black_baseline(self, X):
        return np.zeros((1, X.shape[1]))

    def create_max_dist_baseline(self, x, X_min, X_max):
        max_dist_baseline = np.zeros(x.shape)
        for idx, (column, value) in enumerate(x.items()):
            meanval = (X_min[column] + X_max[column]) * 0.5
            if value < meanval:
                max_dist_baseline[idx] = X_max[column]
            else:
                max_dist_baseline[idx] = X_min[column]
        return max_dist_baseline

    def create_blurred_baseline(self, X, sigma, iterations=1000):
        shuffled_gaussian_df = pd.DataFrame().reindex_like(X).fillna(0)
        features_to_shuffle = list(X.columns)
        df_to_shuffle = X.copy(deep=True)
        permutations = []
        for i in range(iterations):
            unique = True

            gaussian_filter_df = pd.DataFrame(gaussian_filter(df_to_shuffle, sigma=sigma), columns=features_to_shuffle)
            for feature in features_to_shuffle:
                shuffled_gaussian_df[feature] += gaussian_filter_df[feature]

            permutations.append(features_to_shuffle[:])
            random.shuffle(features_to_shuffle)

            while unique:
                unique = True
                for permutation in permutations:
                    if features_to_shuffle == permutation:
                        random.shuffle(features_to_shuffle)
                        unique = False
                        break
                if unique:
                    break

            df_to_shuffle = df_to_shuffle[features_to_shuffle]

        shuffled_gaussian_df = shuffled_gaussian_df.div(iterations)
        return shap.sample(np.asarray(shuffled_gaussian_df), self.shap_sample_size)

    def create_uniform_baseline(self, X):
        return shap.sample(np.random.uniform(X.min().min(), X.max().max(), X.shape), self.shap_sample_size)

    def create_gaussian_baseline(self, X, sigma):
        gaussian_baseline = np.random.randn(*X.shape) * sigma + X
        # Make sure the min and max values are not higher then from X
        return shap.sample(np.clip(gaussian_baseline, a_min=X.min().min(), a_max=X.max().max()), self.shap_sample_size)

    def create_train_baseline(self, X):
        return shap.sample(X, self.shap_sample_size)


class BaselineUtilTensor():

    def __init__(self):
        pass

    def create_black_baseline(self, X):
        return torch.zeros(1, X.shape[1])

    def create_max_dist_baseline(self, x, X_min, X_max, columns):
        x = x.cpu().data.numpy()
        max_dist_baseline = torch.zeros(x.shape)
        for idx, (value, column) in enumerate(zip(x, columns)):
            meanval = (X_min[column] + X_max[column]) * 0.5
            if value < meanval:
                max_dist_baseline[idx] = X_max[column]
            else:
                max_dist_baseline[idx] = X_min[column]
        return max_dist_baseline

    def create_blurred_baseline(self, X, sigma, iterations=1000):
        shuffled_gaussian_df = pd.DataFrame().reindex_like(X).fillna(0)
        features_to_shuffle = list(X.columns)
        df_to_shuffle = X.copy(deep=True)
        permutations = []
        for i in range(iterations):
            unique = True

            gaussian_filter_df = pd.DataFrame(gaussian_filter(df_to_shuffle, sigma=sigma), columns=features_to_shuffle)
            for feature in features_to_shuffle:
                shuffled_gaussian_df[feature] += gaussian_filter_df[feature]

            permutations.append(features_to_shuffle[:])
            random.shuffle(features_to_shuffle)

            while unique:
                unique = True
                for permutation in permutations:
                    if features_to_shuffle == permutation:
                        random.shuffle(features_to_shuffle)
                        unique = False
                        break
                if unique:
                    break

            df_to_shuffle = df_to_shuffle[features_to_shuffle]

        shuffled_gaussian_df = shuffled_gaussian_df.div(iterations)
        return np.asarray(shuffled_gaussian_df, dtype=np.float32)

    def create_uniform_baseline(self, X):
        return np.random.uniform(X.min().min(), X.max().max(), X.shape).astype(np.float32)

    def create_gaussian_baseline(self, X, sigma):
        X = X.to_numpy()
        gaussian_baseline = np.random.randn(*X.shape) * sigma + X
        # Make sure that the min and max values are not higher then from X
        return np.clip(gaussian_baseline, a_min=X.min().min(), a_max=X.max().max()).astype(np.float32)

    def create_train_baseline(self, X):
        return X.to_numpy(dtype=np.float32)
