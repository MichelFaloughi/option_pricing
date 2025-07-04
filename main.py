from BinomialTree import BinomialTree
from StockTree import StockTree
from OptionPricer import OptionPricer
from Option import Option
import numpy as np

# depth = 4
sigma = 0.2
T = 1.0 # maturity
N = 3 # number of steps
r = 0.05
# delta_t = T / N
K = 110 # strike price

S0 = 100.0
# up_factor = np.exp(sigma * np.sqrt(delta_t))
# down_factor = 1 / up_factor





option = Option( K, T, style = "American", type = "Put" )
option_pricer = OptionPricer(option, sigma, S0, r, N)


tree = option_pricer.build_option_tree()

# Display the tree
tree.display_tree_on_terminal()