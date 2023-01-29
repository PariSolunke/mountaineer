import gudhi as gd
import numpy as np
import networkx as nx
from sklearn_tda import MapperComplex

def compute_extended_persistence(mapper):
    G = nx.Graph()
    M = mapper.mapper_
    st = gd.SimplexTree()
    for (splx,_) in M.get_skeleton(1):
        if len(splx) == 1:  G.add_node(splx[0])
        if len(splx) == 2:  G.add_edge(splx[0], splx[1])
    attrs = {k: mapper.node_info_[k]["colors"][0] for k in G.nodes()}

    for n in G.nodes():
        st.insert([n])
    for e1,e2 in G.edges():
        st.insert([e1,e2])
    for k,v in attrs.items():
        st.assign_filtration([k],v)
    st.make_filtration_non_decreasing()
    return st

def get_persistence_diagrams(mapper,combine=True):
    st = compute_extended_persistence(mapper)
    st.extend_filtration()
    dgms = st.extended_persistence(min_persistence=1e-5)
    pdgms = []
    if combine:
        for dgm in dgms:
            pdgms += [d[1] for d in dgm]
    else:
        for dgm in dgms:
            pdgms.append([d[1] for d in dgm])
    return pdgms

def bottleneck_distance(m1,m2,combine=True):
    pd_1 = get_persistence_diagrams(m1,combine)
    pd_2 = get_persistence_diagrams(m2,combine)
    
    if combine:
        return gd.bottleneck_distance(pd_1,pd_2)
    
    bd = 0
    for pd1,pd2 in zip(pd_1,pd_2):
        bd = max(gd.bottleneck_distance(pd1,pd2),bd)
    return bd

def bootstrap_mapper(X,params,CI=0.95,N=100):
    M = MapperComplex(**params).fit(X)
    num_pts, distribution = len(X), []
    for bootstrap_id in range(N):
        # Randomly select points with replacement
        idxs = np.random.choice(num_pts, size=num_pts, replace=True)
        Xboot = X[idxs,:]
        params_boot = {k: params[k] for k in params.keys()}
        params_boot["filters"] = params["filters"][idxs,:]
        params_boot["colors"] = params["colors"][idxs,:]
        
        M_boot = MapperComplex(**params_boot).fit(X)
        distribution.append(bottleneck_distance(M_boot,M))
        
    distribution = np.sort(distribution)
    dist_thresh  = distribution[int(CI*len(distribution))]
    return dist_thresh

def mapper2networkx(mapper, get_attrs=False):
	"""
    Reference: https://github.com/MathieuCarriere/statmapper/blob/master/statmapper/statmapper.py
	Turn a Mapper graph (as computed by sklearn_tda) into a networkx graph.
	Parameters:
		mapper (mapper graph): Mapper (as computed by sklearn_tda).
		get_attrs (bool): whether to use Mapper attributes or not.
	Returns:
		G (networkx graph): networkx graph associated to the Mapper.
	"""
	M = mapper.mapper_
	G = nx.Graph()
	for (splx,_) in M.get_skeleton(1):	
		if len(splx) == 1:	G.add_node(splx[0])
		if len(splx) == 2:	G.add_edge(splx[0], splx[1])
	if get_attrs:
		attrs = {k: {"attr_name": mapper.node_info_[k]["colors"]} for k in G.nodes()}
		nx.set_node_attributes(G, attrs)
	return G