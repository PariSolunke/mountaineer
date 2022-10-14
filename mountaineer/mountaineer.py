import glob
from notebookjs import execute_js
from sklearn.manifold import TSNE
from gale import create_mapper


import os

try:
    import importlib.resources as pkg_resources
except ImportError:
    # Try backported to PY<37 `importlib_resources`.
    import importlib_resources as pkg_resources

from copyreg import constructor
from gc import callbacks
from notebookjs import execute_js
# import numpy as np
# from callbacks import reliability_diagram, learned_reliability_diagram, filter_by_range, filter_by_feature_range
# from .callbacks import get_reliability_curve, learned_reliability_diagram, confusion, get_table_average

class Mountaineer:
    input_projection=[]
    mapper_output={}

    def __init__(self) -> None:
                
        self.visapp = None
        with open('./mountaineer/vis/dist/mountaineer.js') as f:
            self.visapp = f.read()

    def visualize(self, X, y, preds, projection_method='TSNE'):

        ## setting callbacks
        callbacks = {
            'callback_test': self.test
        }

        #Use TSNE to get a 2d projection of the input data (Extend support for others later)
        if(projection_method=='TSNE'):
            self.input_projection=TSNE(n_components=2,random_state=42).fit_transform(X).tolist()

        self.mapper_output = create_mapper(X, preds, resolution=10, gain=0.2, dist_thresh=0.5)

        input_data = {
            'input_projection': self.input_projection,
            'mapper_output': self.mapper_output
        }
        # Plotting the Radial Bar Chart
        execute_js(
            library_list=[self.visapp],
            main_function="mountaineer.renderMountaineer", 
            data_dict=input_data,
            callbacks=callbacks 
        )


    def test(self, event):
        return {"event": [1,2,3]}