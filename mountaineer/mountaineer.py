import glob
from notebookjs import execute_js
from sklearn.manifold import TSNE
from gale import create_mapper
from .util import remove_duplicated_links, remove_graph_duplicates

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

        #Gale to get the mapper output
        self.mapper_output = create_mapper(X, preds, resolution=10, gain=0.2, dist_thresh=0.5)
        #remove duplicated nodes from the mapper output
        self.mapper_output=remove_graph_duplicates(self.mapper_output)
        #remove duplicated links
        self.mapper_output=remove_duplicated_links(self.mapper_output)
        
        #setting the input data dictionary for the frontend
        input_data = {
            'input_projection': self.input_projection,
            'mapper_output': self.mapper_output,
            'dataframe':X.tolist(),
            'y_pred': preds.tolist(),
            'y_actual': y.tolist()
        }

        #Execute and send data to the frontend
        execute_js(
            library_list=[self.visapp],
            main_function="mountaineer.renderMountaineer", 
            data_dict=input_data,
            callbacks=callbacks 
        )


    def test(self, event):
        return {"event": [1,2,3]}