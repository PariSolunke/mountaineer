from collections import defaultdict
import glob
from notebookjs import execute_js
from sklearn.manifold import TSNE
from .util import remove_duplicated_links, remove_graph_duplicates
from gale import bottleneck_distance, mapper_to_networkx
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
    input_projection={}
    mapper_outputs=[]
    lenses=[]
    def __init__(self) -> None:
                
        self.visapp = None
        with open('./mountaineer/vis/dist/mountaineer.js') as f:
            self.visapp = f.read()

    def visualize(self, X, y, lens, explanation_list, mappers, column_names=None, expl_labels=[], class_labels={1:'Class 1', 0:'Class 2'}):
        self.mapper_outputs=[]
        self.lens=copy.deepcopy(lens)
        overlaps=[]
        output_lenses=[]

        ## setting callbacks
        callbacks = {
            'callback_test': self.test
        }

        #Use TSNE/UMAP to get a 2d projection of the input data
        self.input_projection['UMAP']=umap.UMAP(random_state=42).fit_transform(X).tolist()

        
        self.input_projection['TSNE']=TSNE(n_components=2,random_state=42).fit_transform(X).tolist()

        distance_matrix = [[0 for i in range(len(mappers))] for j in range(len(mappers))]


        #process every mapper output
        for i,mapper in enumerate(mappers):
            #create distance matrix
            j=i+1
            while j < len(mappers):
                curDist=round(bottleneck_distance(mapper,mappers[j]),6)
                distance_matrix[i][j]=curDist
                distance_matrix[j][i]=curDist
                j+=1

            #curMapper= copy.deepcopy(mapper)
            
            #remove duplicated nodes from the mapper output
            #self.mapper_outputs.append(remove_graph_duplicates(curMapper))
            #remove duplicated links
            #self.mapper_outputs[i]=remove_duplicated_links(self.mapper_outputs[i])
            G = mapper_to_networkx(mapper)
            mapper_obj = {}
            nodes_dict = defaultdict(list)
            for node, data in mapper.node_info_.items():
                indices = data['indices'].tolist()
                nodes_dict[str(node)].extend(indices)
                
            edges_dict = defaultdict(list)

            for edge in G.edges:
                source, target = str(edge[0]), str(edge[1])
                edges_dict[source].append(target)

            mapper_obj['links'] = edges_dict
            mapper_obj['nodes'] = nodes_dict
            self.mapper_outputs.append(mapper_obj)
            #find the overlap for each connected node
            overlap=defaultdict(dict)
            for node1,link_nodes in edges_dict.items():
                for node2 in link_nodes:
                    node1_set=set(nodes_dict[node1])
                    node2_set=set(nodes_dict[node2])
                    overlap[node1][node2]= len(node1_set.intersection(node2_set))/len(node1_set.union(node2_set))
            overlaps.append(overlap)

        #append lenses as list to the output object
        
        output_lens=lens.tolist()

        #setting the input data dictionary for the frontend
        input_data = {
            'input_projection': self.input_projection,
            'mapper_outputs': self.mapper_outputs,
            'overlaps': overlaps,
            'dataframe':X.tolist(),
            'lens': output_lens,
            'y': y.tolist(),
            'column_names': column_names.tolist(),
            'distance_matrix':distance_matrix,
            'explanation_list':explanation_list,
            'expl_labels':expl_labels,
            'class_labels':class_labels
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