import random
import pandas as pd
from scipy import stats

import numpy as np

from sklearn.metrics import f1_score
from collections import defaultdict

import time
import warnings
warnings.filterwarnings('ignore')

from matplotlib import pyplot as plt
from matplotlib.ticker import PercentFormatter

import torch
import torch.nn as nn

import src.dataloader as dataloader
import src.nn_model as nn_model
import src.imputation as imp
from src.baseline_utils import BaselineUtilTensor

from captum.attr import IntegratedGradients, DeepLift
from collections import defaultdict
import shap

rs = 2022
np.random.seed(rs)
torch.manual_seed(rs)
random.seed(rs)

def integrated_gradients(X, target, baseline, model):
    start_time = time.time()
    ig = IntegratedGradients(model)
    baseline = baseline
    attr = ig.attribute(X, baseline, target=target)
    print("--- '%.2f' seconds computation time ---" % (time.time() - start_time))
    return attr.cpu().detach().numpy()

def integrated_gradients_mdb(X, target, model, X_min, X_max, columns):
    start_time = time.time()
    ig = IntegratedGradients(model)
    attr = []
    but = BaselineUtilTensor()
    for idx, observation in enumerate(X):
        cur_baseline = but.create_max_dist_baseline(observation, X_min, X_max, columns).unsqueeze(0)
        if target == None:
            attr.append(ig.attribute(observation.unsqueeze(0), cur_baseline))
        else:
            attr.append(ig.attribute(observation.unsqueeze(0), cur_baseline, target=target[idx]))

    print("--- '%.2f' seconds computation time ---" % (time.time() - start_time))
    return torch.cat(attr).cpu().detach().numpy()

def integrated_gradients_avg(X, target, baseline, model, sample_size=10):
    start_time = time.time()
    attr = torch.zeros(X.shape)
    ig = IntegratedGradients(model)
    for i in range(sample_size):
        idx = np.random.randint(baseline.shape[0], size=1)
        sample = torch.from_numpy(baseline[idx,:])
        attr += ig.attribute(X, sample, target=target)
        
    print("--- '%.2f' seconds computation time ---" % (time.time() - start_time))
    return (attr/sample_size).cpu().detach().numpy()

def deep_lift(X, y,baseline, model):
    start_time = time.time()
    dl = DeepLift(model)
    baseline = baseline
    attr = dl.attribute(X, baseline, target=y)
    print("--- '%.2f' seconds computation time ---" % (time.time() - start_time))
    return attr.cpu().detach().numpy()

def deep_lift_mdb(X, target, model, X_min, X_max, columns):
    start_time = time.time()
    dl = DeepLift(model)
    attr = []
    but = BaselineUtilTensor()
    for idx, observation in enumerate(X):
        cur_baseline = but.create_max_dist_baseline(observation, X_min, X_max, columns).unsqueeze(0)
        if target == None:
            attr.append(dl.attribute(observation.unsqueeze(0), cur_baseline))
        else:
            attr.append(dl.attribute(observation.unsqueeze(0), cur_baseline, target=target[idx]))
        
    print("--- '%.2f' seconds computation time ---" % (time.time() - start_time))
    return torch.cat(attr).cpu().detach().numpy()

def deep_lift_avg(X, target, baseline, model, sample_size=10):
    start_time = time.time()
    attr = torch.zeros(X.shape)
    dl = DeepLift(model)
    for i in range(sample_size):
        idx = np.random.randint(baseline.shape[0], size=1)
        sample = torch.from_numpy(baseline[idx,:])
        attr += dl.attribute(X, sample, target=target)
        
    print("--- '%.2f' seconds computation time ---" % (time.time() - start_time))
    return (attr/sample_size).cpu().detach().numpy()

def deep_shap(X, baseline, model):
    start_time = time.time()
    explainer = shap.DeepExplainer(model, baseline)
    shap_values = explainer.shap_values(X, ranked_outputs=1)
    print("--- '%.2f' seconds computation time ---" % (time.time() - start_time))
    return shap_values if len(shap_values) == X.shape[0] else shap_values[0][0]

def deep_shap_mdb(X, model, X_min, X_max, columns):
    start_time = time.time()
    attr_list = []
    but = BaselineUtilTensor()
    for observation in X:
        cur_baseline = but.create_max_dist_baseline(observation, X_min, X_max, columns).unsqueeze(0)
        explainer = shap.DeepExplainer(model, cur_baseline)
        shap_values = explainer.shap_values(observation.unsqueeze(0), ranked_outputs=1)
        if len(shap_values) == 1:
            attr_list.append(shap_values)
        else:
            attr_list.append(shap_values[0][0])
        
    print("--- '%.2f' seconds computation time ---" % (time.time() - start_time))
    return np.concatenate(attr_list, axis=0)

def deep_shap_avg(X, baseline, model, sample_size=10):
    start_time = time.time()
    attr = np.zeros(X.shape)
    for i in range(sample_size):
        idx = np.random.randint(baseline.shape[0], size=1)
        sample = torch.from_numpy(baseline[idx,:])    
        explainer = shap.DeepExplainer(model, sample)
        shap_values = explainer.shap_values(X, ranked_outputs=1)
        if len(shap_values) == X.shape[0]:
            attr += shap_values
        else:
            attr += shap_values[0][0]
        
    print("--- '%.2f' seconds computation time ---" % (time.time() - start_time))
    return (attr/sample_size)

def calc_ig_attr(X_test_c_tens, target, black_baseline, uniform_baseline, gaussian_baseline, 
                train_baseline, model, X_min, X_max, columns):
    print("Start integrated gradients for correct predictions with black_baseline")
    bb_attr = integrated_gradients(X_test_c_tens, target, black_baseline, model)
    print("Start integrated gradients for correct predictions with max_dist_baseline")
    mdb_attr = integrated_gradients_mdb(X_test_c_tens, target, model, X_min, X_max, columns)
#     print("Start integrated gradients for correct predictions with blurred_baseline")
#     blb_attr = integrated_gradients_avg(X_test_c_tens, target, blurred_baseline, model)
    print("Start integrated gradients for correct predictions with uniform_baseline")
    ub_attr = integrated_gradients_avg(X_test_c_tens, target, uniform_baseline, model)
    print("Start integrated gradients for correct predictions with gaussian_baseline")
    gb_attr = integrated_gradients_avg(X_test_c_tens, target, gaussian_baseline, model)
    print("Start integrated gradients for correct predictions with train_baseline")
    tb_attr = integrated_gradients_avg(X_test_c_tens, target, train_baseline, model)
    return bb_attr, mdb_attr, ub_attr, gb_attr, tb_attr

def calc_dl_attr(X_test_c_tens, target, black_baseline, uniform_baseline, gaussian_baseline, 
                train_baseline, model, X_min, X_max, columns):
    print("Start DeepLIFT for correct predictions with black_baseline")
    bb_attr = deep_lift(X_test_c_tens, target, black_baseline, model)
    print("Start DeepLIFT for correct predictions with max_dist_baseline")
    mdb_attr = deep_lift_mdb(X_test_c_tens, target, model, X_min, X_max, columns)
#     print("Start DeepLIFT for correct predictions with blurred_baseline")
#     blb_attr = deep_lift_avg(X_test_c_tens, target, blurred_baseline, model)
    print("Start DeepLIFT for correct predictions with uniform_baseline")
    ub_attr = deep_lift_avg(X_test_c_tens, target, uniform_baseline, model)
    print("Start DeepLIFT for correct predictions with gaussian_baseline")
    gb_attr = deep_lift_avg(X_test_c_tens, target, gaussian_baseline, model)
    print("Start DeepLIFT for correct predictions with train_baseline")
    tb_attr = deep_lift_avg(X_test_c_tens, target, train_baseline, model)
    return bb_attr, mdb_attr, ub_attr, gb_attr, tb_attr

def calc_ds_attr(X_test_c_tens, target, black_baseline, uniform_baseline, gaussian_baseline, 
                train_baseline, model, X_min, X_max, columns):
    print("Start DeepSHAP for correct predictions with black_baseline")
    bb_attr = deep_shap(X_test_c_tens, black_baseline, model)
    print("Start DeepSHAP for correct predictions with max_dist_baseline")
    mdb_attr = deep_shap_mdb(X_test_c_tens, model, X_min, X_max, columns)
#     print("Start DeepSHAP for correct predictions with blurred_baseline")
#     blb_attr = deep_shap_avg(X_test_c_tens, blurred_baseline, model)
    print("Start DeepSHAP for correct predictions with uniform_baseline")
    ub_attr = deep_shap_avg(X_test_c_tens, uniform_baseline, model)
    print("Start DeepSHAP for correct predictions with gaussian_baseline")
    gb_attr = deep_shap_avg(X_test_c_tens, gaussian_baseline, model)
    print("Start DeepSHAP for correct predictions with train_baseline")
    tb_attr = deep_shap_avg(X_test_c_tens, train_baseline, model)
    return bb_attr, mdb_attr, ub_attr, gb_attr, tb_attr

def get_attr_scores(method, X_test_c_tens, target, black_baseline, uniform_baseline, gaussian_baseline, 
                train_baseline, model, X_min, X_max, columns):
    options = {
        'IG': calc_ig_attr,
        'DeepLIFT': calc_dl_attr,
        'DeepSHAP': calc_ds_attr
    }
    return options[method](X_test_c_tens, target, black_baseline, uniform_baseline, gaussian_baseline, 
                train_baseline, model, X_min, X_max, columns)

def get_correct_predictions(model, X_test, X_test_tens, Y_test, averaging='binary'):
    np.random.seed(rs)
    random.seed(rs)
    
    Y_test_reset = Y_test.reset_index(drop=True)
    corr_idx = []

    predictions = model(X_test_tens)
    y_pred_label = torch.round(torch.sigmoid(predictions)) if averaging == 'binary' else torch.max(predictions.data, 1)[1]

    xs = np.asarray(X_test, dtype=np.float32)
    ys = np.asarray(Y_test, dtype=np.int) if averaging == 'binary' else np.asarray(Y_test, dtype=np.int) - 1

    for x, prediction, y in zip(enumerate(xs), y_pred_label, ys):
        if prediction == y:
            corr_idx.append(x[0])

    X_test_c = X_test[X_test.index.isin(corr_idx)]
    print(f"X_test of correct predictions shape: {X_test_c.shape}")
    Y_test_c = Y_test_reset[Y_test_reset.index.isin(corr_idx)] if averaging == 'binary' else Y_test_reset[Y_test_reset.index.isin(corr_idx)] - 1
    print(f"Y_test of correct predictions shape: {Y_test_c.shape}")
    unique, counts = np.unique(Y_test_c, return_counts=True)
    print(f"Label in Y_test of correct predictions ratio: \n {np.asarray((unique, counts)).T}")

    Y_test_reset = Y_test_reset if averaging == 'binary' else Y_test_reset - 1
    return X_test_c, Y_test_c