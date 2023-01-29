import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

rs = 42


def prepare_spambase_ds(data):
    X = data.drop(['label'], axis=1)
    y = data['label']

    X_train, X_test, Y_train, Y_test = train_test_split(X, y, test_size=0.2, random_state=rs)

    scaler = StandardScaler().fit(X_train)
    X_train = pd.DataFrame(scaler.transform(X_train), columns=X.columns)
    X_test = pd.DataFrame(scaler.transform(X_test), columns=X.columns)
    return X_train, X_test, Y_train, Y_test


def prepare_fraud_ds(data):
    df = data.sample(n=50000, random_state=rs)
    X = df.drop(['Class'], axis=1)
    y = df['Class']
    X_train, X_test, Y_train, Y_test = train_test_split(X, y, test_size=0.2, random_state=rs)

    scaler = StandardScaler().fit(X_train)
    X_train = pd.DataFrame(scaler.transform(X_train), columns=X.columns)
    X_test = pd.DataFrame(scaler.transform(X_test), columns=X.columns)
    return X_train, X_test, Y_train, Y_test


def prepare_compas_ds(data):
    X = data.drop(['Two_yr_Recidivism'], axis=1)
    y = data['Two_yr_Recidivism']
    X_train, X_test, Y_train, Y_test = train_test_split(X, y, test_size=0.2, random_state=rs)

    scaler = StandardScaler().fit(X_train)
    X_train = pd.DataFrame(scaler.transform(X_train), columns=X.columns)
    X_test = pd.DataFrame(scaler.transform(X_test), columns=X.columns)
    return X_train, X_test, Y_train, Y_test


def prepare_communities_ds(data):
    coerce_columns = ['LemasSwornFT', 'LemasSwFTPerPop', 'LemasSwFTFieldOps', 'LemasSwFTFieldPerPop',
                      'LemasTotalReq', 'LemasTotReqPerPop', 'PolicReqPerOffic', 'PolicPerPop', 'RacialMatchCommPol',
                      'PctPolicWhite', 'PctPolicBlack', 'PctPolicHisp', 'PctPolicAsian', 'PctPolicMinor',
                      'OfficAssgnDrugUnits',
                      'NumKindsDrugsSeiz', 'PolicAveOTWorked', 'PolicCars', 'PolicOperBudg', 'LemasPctPolicOnPatr',
                      'LemasGangUnitDeploy', 'PolicBudgPerPop']
    non_predictive_columns = ['state', 'county', 'community', 'communityname', 'fold']
    df = data.drop(coerce_columns + non_predictive_columns, axis=1)
    df = df.replace('?', np.nan)
    df.dropna(inplace=True)
    # create label
    # 0 low risk, 1 high risk, higher then 30% Violent Crimes per Population high risk
    df['label'] = 0
    df.loc[df['ViolentCrimesPerPop'] >= 0.3, 'label'] = 1
    X = df.drop(['label', 'ViolentCrimesPerPop'], axis=1)
    y = df['label']

    X_train, X_test, Y_train, Y_test = train_test_split(X, y, test_size=0.2, random_state=rs)
    scaler = StandardScaler().fit(X_train)
    X_train = pd.DataFrame(scaler.transform(X_train), columns=X.columns)
    X_test = pd.DataFrame(scaler.transform(X_test), columns=X.columns)
    return X_train, X_test, Y_train, Y_test


def load_and_prepare_har_ds(path):
    X_train = pd.read_table(f'{path}/train/X_train.txt', sep='\s+', header=None)
    Y_train = pd.read_table(f'{path}/train/y_train.txt', sep='\s+', header=None, squeeze=True)
    X_test = pd.read_table(f'{path}/test/X_test.txt', sep='\s+', header=None)
    Y_test = pd.read_table(f'{path}/test/y_test.txt', sep='\s+', header=None, squeeze=True)

    scaler = StandardScaler().fit(X_train)
    X_train = pd.DataFrame(scaler.transform(X_train), columns=X_train.columns)
    X_test = pd.DataFrame(scaler.transform(X_test), columns=X_test.columns)

    return X_train, X_test, Y_train, Y_test


def prepare_dataset(name, data):
    options = {
        'spambase': prepare_spambase_ds,
        'fraud_detection': prepare_fraud_ds,
        'compas': prepare_compas_ds,
        'communities': prepare_communities_ds,
        'har': load_and_prepare_har_ds
    }
    return options[name](data)
