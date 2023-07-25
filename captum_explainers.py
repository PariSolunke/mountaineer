from captum.attr import Lime, KernelShap, Saliency, NoiseTunnel, IntegratedGradients, InputXGradient, Occlusion, GuidedBackprop
from captum._utils.models.linear_model import SkLearnLinearRegression
from captum.attr._core.lime import get_exp_kernel_similarity_function

from functools import partial
import numpy as np
import torch

seed=9999
np.random.seed(seed)
torch.manual_seed(seed)

#lime
def captum_lime(x, target_class, n_perturb, model_f, kernel_width):
    if target_class is None:
        target_class = model_f(x).data.max(1)[1].item()
    exponential_kernel = get_exp_kernel_similarity_function('euclidean', kernel_width=kernel_width)
    method = Lime(forward_func=model_f, interpretable_model=SkLearnLinearRegression(), similarity_func=exponential_kernel)
    attr = method.attribute(inputs=x, target=target_class, n_samples=n_perturb)
    return attr

#kernelshap
def captum_ks(x, target_class, n_perturb, model_f):
    if target_class is None:
        target_class = model_f(x).data.max(1)[1].item()
    method = KernelShap(model_f)
    attr = method.attribute(inputs=x, target=target_class, n_samples=n_perturb)
    return attr

#smoothgrad
def captum_sg(x, target_class, n_perturb, model_f, stdevs=0.1):
    if target_class is None:
        target_class = model_f(x).data.max(1)[1].item()
    model_f.zero_grad()
    method = NoiseTunnel(Saliency(model_f))
    attr = method.attribute(inputs=x, nt_type='smoothgrad', target=target_class, nt_samples=n_perturb, abs=False, stdevs=stdevs)
    return attr

#integrated gradients
def captum_ig(x, target_class, n_perturb, model_f):
    if target_class is None:
        target_class = model_f(x).data.max(1)[1].item()
    model_f.zero_grad()
    method = IntegratedGradients(model_f)
    attr = method.attribute(inputs=x, target=target_class, n_steps=n_perturb)
    return attr

#vanilla gradients
def captum_vg(x, target_class, model_f):
    if target_class is None:
        target_class = model_f(x).data.max(1)[1]
    model_f.zero_grad()
    method = Saliency(model_f)
    x.requires_grad_()
    attr = method.attribute(inputs=x, target=target_class, abs=False)
    return attr

#gradient x input
def captum_gxi(x, target_class, model_f):
    if target_class is None:
        target_class = model_f(x).data.max(1)[1]
    model_f.zero_grad()
    method = InputXGradient(model_f)
    x.requires_grad_()
    attr = method.attribute(inputs=x, target=target_class)
    return attr

#occlusion
def captum_oc(x, target_class, model_f):
    if target_class is None:
        target_class = model_f(x).data.max(1)[1]
    method = Occlusion(model_f)
    attr = method.attribute(inputs=x, target=target_class, sliding_window_shapes=(1,))
    return attr

#guided backprop
def captum_gb(x, target_class, model_f):
    if target_class is None:
        target_class = model_f(x).data.max(1)[1]
    method = GuidedBackprop(model_f)
    attr = method.attribute(inputs=x, target=target_class)
    return attr

def create_explainers(model_f):
    lime = partial(captum_lime, model_f=model_f, kernel_width=1)
    ks = partial(captum_ks, model_f=model_f)
    sg = partial(captum_sg, model_f=model_f)
    ig = partial(captum_ig, model_f=model_f)
    vg = partial(captum_vg, model_f=model_f)
    gxi = partial(captum_gxi, model_f=model_f)
    oc = partial(captum_oc, model_f=model_f)
    gb = partial(captum_gb, model_f=model_f)

    explainer_nonperturb = {
	    'Vanilla Gradient': vg,
	    'Gradient x Input': gxi,
	    'Occlusion': oc,
        'Guided Backprop': gb
	}

    explainer_npertrub = {
	    'LIME': lime,
	    'KernelSHAP': ks,
	    'SmoothGrad': sg,
	    'Integrated Gradients': ig
    }

    return explainer_nonperturb, explainer_npertrub

def explainer_attributes(model_f, X, n_perturb = 100, n_subset=None):
    if n_subset is None:
        n_subset = X.size(0) #all data points in X 
    instances = X[0:n_subset, :] 
    n = instances.shape[0]

    explainer_nonperturb, explainer_npertrub = create_explainers(model_f)

    exp_dict = {}

    for method_name, attr_calculator in explainer_nonperturb.items():
        attr_tensor = attr_calculator(x=instances, target_class=None)
        exp_dict[method_name] = attr_tensor.detach().numpy()

    for method_name, attr_calculator in explainer_npertrub.items():
        attr_tup = [attr_calculator(x=instances[[i], :], target_class=None, n_perturb=n_perturb) for i in range(0, n)]
        attr_np = []
        for l in attr_tup:
            attr_np.append(l.detach().numpy()[0])
        exp_dict[method_name] = np.asarray(attr_np)

    return exp_dict