import torch
import torch.nn as nn
import numpy as np
from sklearn.metrics import f1_score

class simpleNN(nn.Module):
    def __init__(self, input_dim, output_dim):
        super(simpleNN, self).__init__()
        self.layer_1 = nn.Linear(input_dim, 64,bias=True)
        self.relu1 = nn.ReLU()
        self.batchnorm1 = nn.BatchNorm1d(64)
        self.layer_2 = nn.Linear(64, 64,bias=True)
        self.relu2 = nn.ReLU()
        self.batchnorm2 = nn.BatchNorm1d(64)
        self.dropout = nn.Dropout(p=0.1)
        self.layer_out = nn.Linear(64, output_dim)

    def forward(self, inputs):
        x = self.relu1(self.layer_1(inputs))
        x = self.batchnorm1(x)
        x = self.relu2(self.layer_2(x))
        x = self.batchnorm2(x)
        x = self.dropout(x)
        x = self.layer_out(x)

        return x

def get_acc_score(y_pred, y_test, averaging):
    y_hat = torch.round(torch.sigmoid(y_pred)) if averaging == 'binary' else torch.max(y_pred.data, 1)[1]
    correct_results_sum = (y_hat == y_test).sum().float()
    acc = correct_results_sum/y_test.shape[0]
    return torch.round(acc * 100)

def get_f1_score(y_pred, y_test, averaging):
    y_hat = torch.round(torch.sigmoid(y_pred)) if averaging == 'binary' else torch.max(y_pred.data, 1)[1]
    return f1_score(y_test.cpu().data.numpy(), y_hat.cpu().data.numpy(), average=averaging) * 100


def get_model(device, train_iter, input_dim, output_dim, averaging, learning_rate, num_epochs):
    model = simpleNN(input_dim, output_dim)
    model.to(device)
    criterion = nn.BCEWithLogitsLoss() if averaging == 'binary' else nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
    print('Train model')
    train(device, model, optimizer, criterion, train_iter, num_epochs, averaging)
    print('Set to eval')
    model.eval()
    return model

def train(device, model, optimizer, criterion, train_iter, num_epochs, averaging):
    model.train()
    for e in range(1, num_epochs+1):
        epoch_loss = 0
        epoch_acc = 0
        epoch_f1 = 0
        for X_batch, y_batch in train_iter:
            X_batch, y_batch = X_batch.to(device), y_batch.to(device)
            optimizer.zero_grad()

            y_pred = model(X_batch)
            loss = criterion(y_pred, y_batch)
            acc = get_acc_score(y_pred, y_batch, averaging)
            f1 = get_f1_score(y_pred, y_batch, averaging)

            loss.backward()
            optimizer.step()

            epoch_loss += loss
            epoch_acc += acc
            epoch_f1 += f1

        if e % 20 == 0:
            print(f'Epoch {e+0:03}: | Loss: {epoch_loss/len(train_iter):.5f} | Acc: {epoch_acc/len(train_iter):.3f} | F1: {epoch_f1/len(train_iter):.5f}')