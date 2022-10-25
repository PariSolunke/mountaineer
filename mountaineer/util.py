import numpy as np
from scipy.cluster.hierarchy import linkage,fcluster
from collections import defaultdict
import sklearn

#get the similarity between two nodes
def jaccard_similarity(list1, list2):
    intersection = len(list(set(list1).intersection(list2)))
    union = (len(list1) + len(list2)) - intersection
    return float(intersection) / union

#check for duplicated links and remove them
def remove_duplicated_links(graph):
    links = []
    for node, ls in graph['links'].items():
        for n in ls:
            links.append([node,n])
    links = np.array(links)
    links =np.unique(np.sort(links),axis=0)
    result = defaultdict(list)
    for link in links:
        result[link[0]].append(link[1])
    graph['links'] = result
    return graph

#check for duplicated nodes and remove them
def remove_graph_duplicates(graph):
    unique_nodes = defaultdict(list)
    nodes = list(graph['nodes'].keys())
    dist = []
    for i,n1 in enumerate(nodes):
        for n2 in nodes[i+1:]:
            dist.append(1-jaccard_similarity(graph['nodes'][n1],graph['nodes'][n2]))

    Z = linkage(dist,'single')
    labels = fcluster(Z,0.1,'distance')
    for label, node in zip(labels,nodes):
        unique_nodes[label].append(node)

    unique_nodes = {val[0]:val[1:] for val in unique_nodes.values()}
    for val in unique_nodes.values():
        for node in val:
            del graph['nodes'][node]

    nodes_lookup = {}
    for key,val in unique_nodes.items():
        nodes_lookup[key] = key
        for v in val:
            nodes_lookup[v] = key

    unique_edges = defaultdict(set)
    for key,edges in graph['links'].items():
        key = nodes_lookup[key]
        edges = set([nodes_lookup[e] for e in edges])
        edges.discard(key)
        unique_edges[key] = unique_edges[key].union(edges)
    for key in list(unique_edges.keys()):
        if len(unique_edges[key]) == 0:
            del unique_edges[key]
        else:
            unique_edges[key] = list(unique_edges[key])
    graph = {'nodes':graph['nodes'],'links':unique_edges}
    return graph

	