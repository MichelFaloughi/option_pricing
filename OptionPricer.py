# for now forget barrier options
# for now forget custom payoffs, but this is a member of the Option class
import numpy as np
from Option import Option
from StockTree import StockTree
from BinomialTree import BinomialTree
from BarrierOption import BarrierOption

class OptionPricer:

    def __init__(self,  option: Option,
                        sigma: float,   # volatility ?
                        S0: float,      # initial stock price
                        r: float,       # risk-free interest rate
                        N: int,         # num steps
                    ):
        
        self.option = option
        self.sigma = sigma
        self.S0 = S0
        self.r = r
        self.N = N

        # Quick mafs
        self.delta_T = self.option.T / N
        self.up_factor = np.exp(sigma * np.sqrt(self.delta_T))
        self.down_factor = 1 / self.up_factor
        self.q = (np.exp(r * self.delta_T) - self.down_factor) / (self.up_factor - self.down_factor) # Risk-neutral probability

        self.stock_tree = StockTree(N + 1, S0, self.up_factor, self.down_factor)



    def build_option_tree(self) -> BinomialTree:
        option_tree = BinomialTree(self.N + 1) # build skeleton tree (with default values)

        assert len(option_tree.values) == len(self.stock_tree.values), "dimensions don't match"
        assert len(option_tree.values[-1]) == len(self.stock_tree.values[-1]), "dimensions don't match"

        if not isinstance(self.option, BarrierOption):

            vectorized_payoff = np.vectorize(self.option.payoff) # for use below
            option_tree.values[-1] = vectorized_payoff(self.stock_tree.values[-1]) # fill last level with payoffs

            # then backtrack using formula  V_n^(k,h) = e^(-rΔt) [ q V_(n+1)^(k+1) + (1-q) V_(n+1)^k ] 
            for depth in range(len(option_tree.values) - 1)[::-1]:     # loop backwards from second-to-last level
                for height in range(len(option_tree.values[depth])):   # loop through nodes of that level

                    hold_value = np.exp(-self.r * self.delta_T) * ( self.q * option_tree.values[depth + 1][height + 1] + (1 - self.q) * option_tree.values[depth + 1][height] )

                    if self.option.style == "European":
                        option_tree.values[depth][height] = hold_value
                    
                    else: # American
                        exercise_value = self.option.payoff(self.stock_tree.values[depth][height])
                        option_tree.values[depth][height] = max(hold_value, exercise_value)

        else: # if it's a barrier option

            raise NotImplementedError("rou2 chway") 
        
        

        return option_tree
    



