from setuptools import setup, find_packages
from pathlib import Path

this_directory = Path(__file__).parent
long_description = (this_directory / "README.md").read_text()

setup(
    name="mountaineer",
    version="0.0.1",
    packages=find_packages(),
    # Project uses reStructuredText, so ensure that the docutils get
    # installed or upgraded on the target machine
    install_requires=[
        "gale-topo>=0.0.3",
    ],
    # metadata to display on PyPI
    author="Parikshit Solunke, Joao Rulff, Peter Xenopoulos, Luis Gustavo Nonato, Brian Barr, Claudio Silva",
    author_email="xenopoulos@nyu.edu",
    description="Mountaineer is ...",
    keywords="topology tda topological-data-analysis",
    url="https://github.com/pnxenopoulos/mountaineer",
    project_urls={
        "Issues": "https://github.com/pnxenopoulos/mountaineer/issues",
        "GitHub": "https://github.com/pnxenopoulos/mountaineer/",
    },
    classifiers=["License :: OSI Approved :: MIT License"],
)
