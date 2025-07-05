from BinomialTree import BinomialTree
from StockTree import StockTree
from OptionPricer import OptionPricer
from Option import Option
import numpy as np
from BarrierOption import BarrierOption

sigma = 0.2
S0 = 100.0
r = 0.05

T = 1   # maturity
N = 3   # number of steps
K = 100 # strike price
B = 120 # barrier

option = Option( K=110, T=1, style = "American", type = "Put" )
option = BarrierOption( K, T, style = "European", type = "Call",
                        barrier=B, direction='up', knock_type='in')

option_pricer = OptionPricer(option, sigma, S0, r, N)


# print(isinstance(option, BarrierOption))

tree = option_pricer.build_option_tree()

# Display
print('Stock Tree')
option_pricer.stock_tree.display_tree_on_terminal()

print() # skip a line

print('After Tree')
option_pricer.after_tree.display_tree_on_terminal()

print()

print('Option Tree')
tree.display_tree_on_terminal()