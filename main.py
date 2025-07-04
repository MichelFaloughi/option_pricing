from BinomialTree import BinomialTree
from StockTree import StockTree
import numpy as np

depth = 4
sigma = 0.2
T = 1.0
N = 3
r = 0.05
delta_t = T / N

S0 = 100.0
up_factor = np.exp(sigma * np.sqrt(delta_t))
down_factor = 1 / up_factor

tree = StockTree(depth, S0, up_factor, down_factor)

# Display the tree
tree.display_tree_on_terminal()