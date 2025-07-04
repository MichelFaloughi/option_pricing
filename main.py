from BinomialTree import BinomialTree
from StockTree import StockTree
from OptionPricer import OptionPricer
from Option import Option
import numpy as np
from BarrierOption import BarrierOption

sigma = 0.2
T = 1.0 # maturity
N = 3 # number of steps
r = 0.05
K = 110 # strike price
S0 = 100.0

option = Option( K, T, style = "American", type = "Put" )
option_pricer = OptionPricer(option, sigma, S0, r, N)


# print(isinstance(option, BarrierOption))

tree = option_pricer.build_option_tree()
tree.display_tree_on_terminal()