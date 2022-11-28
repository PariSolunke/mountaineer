from collections import defaultdict
import glob
from notebookjs import execute_js
from sklearn.manifold import TSNE
from .util import remove_duplicated_links, remove_graph_duplicates
import umap
import os
import copy

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
    mapper_outputs=[]
    def __init__(self) -> None:
                
        self.visapp = None
        with open('./mountaineer/vis/dist/mountaineer.js') as f:
            self.visapp = f.read()

    def visualize(self, X, y, mappers, lenses, column_names=None, projection_method='TSNE'):
        self.mapper_outputs=[]
        
        overlaps=[]
        output_lenses=[]

        ## setting callbacks
        callbacks = {
            'callback_test': self.test
        }

        #Use TSNE to get a 2d projection of the input data (Extend support for others later)

        if(projection_method=='UMAP'):
            self.input_projection=umap.UMAP(random_state=42).fit_transform(X).tolist()

        else:
            self.input_projection=TSNE(n_components=2,random_state=42).fit_transform(X).tolist()


        #process every mapper output
        for i,mapper in enumerate(mappers):
            curMapper= copy.deepcopy(mapper)
            overlap=defaultdict(dict)
            #remove duplicated nodes from the mapper output
            self.mapper_outputs.append(remove_graph_duplicates(curMapper))
            #remove duplicated links
            self.mapper_outputs[i]=remove_duplicated_links(self.mapper_outputs[i])
            
            #find the overlap for each connected node
            for node1,link_nodes in self.mapper_outputs[i]['links'].items():
                for node2 in link_nodes:
                    node1_set=set(self.mapper_outputs[i]['nodes'][node1])
                    node2_set=set(self.mapper_outputs[i]['nodes'][node2])
                    overlap[node1][node2]= len(node1_set.intersection(node2_set))/len(node1_set.union(node2_set))
            overlaps.append(overlap)

        #append lenses as list to the output object
        for lens in lenses:
            output_lenses.append(lens.tolist())

        #setting the input data dictionary for the frontend
        input_data = {
            'input_projection': self.input_projection,
            'mapper_outputs': self.mapper_outputs,
            'overlaps': overlaps,
            'dataframe':X.tolist(),
            'lenses': output_lenses,
            'y': y.tolist(),
            'column_names': column_names.tolist()
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