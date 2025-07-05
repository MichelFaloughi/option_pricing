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

        # assertions
        if isinstance(option, BarrierOption):
            assert option.barrier >= 0, "Barrier must be a non-negative float"
            if option.direction == 'up':
                assert option.barrier > S0, "Barrier must be above the initial stock price for an up barrier"
            else: # down
                assert option.barrier < S0, "Barrier must be below the initial stock price for a down barrier"
            

    def build_option_tree(self) -> BinomialTree:
        option_tree = BinomialTree(self.N + 1) # build skeleton tree (with default values)
        vectorized_payoff = np.vectorize(self.option.payoff) # for use below

        assert len(option_tree.values) == len(self.stock_tree.values), "dimensions don't match"
        assert len(option_tree.values[-1]) == len(self.stock_tree.values[-1]), "dimensions don't match"

        if not isinstance(self.option, BarrierOption):

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

        
        else: # it's a barrier option

            if self.option.knock_type == 'out':

                option_tree.values[-1] = vectorized_payoff(self.stock_tree.values[-1]) # fill last level with payoffs
                
                coords_to_be_0 = self.find_coords_to_be_0() # then set the 0s where they have to be
                for depth, height in coords_to_be_0:        # this is kind of a double overkill because the default is 0, but might change later
                    option_tree.values[depth][height] = 0
                
                # now backtrack from second to last level, make sure if coords are in coords_to_be_0 then the val stays 0
                # SEMI REPETITION
                # then backtrack using formula  V_n^(k,h) = e^(-rΔt) [ q V_(n+1)^(k+1) + (1-q) V_(n+1)^k ] 
                for depth in range(len(option_tree.values) - 1)[::-1]:     # loop backwards from second-to-last level
                    for height in range(len(option_tree.values[depth])):   # loop through nodes of that level
                        
                        if (depth, height) in coords_to_be_0:
                            option_tree.values[depth][height] = 0 # explicit, overkill, but it's okay for now
                        
                        else:  
                            hold_value = np.exp(-self.r * self.delta_T) * ( self.q * option_tree.values[depth + 1][height + 1] + (1 - self.q) * option_tree.values[depth + 1][height] )

                            if self.option.style == "European":
                                option_tree.values[depth][height] = hold_value
                            
                            else: # American
                                exercise_value = self.option.payoff(self.stock_tree.values[depth][height])
                                option_tree.values[depth][height] = max(hold_value, exercise_value)

            else: # knock-in

                # AFTER TREE
                after_tree = BinomialTree(self.N + 1) # build skeleton tree (with default values)
                after_tree.values[-1] = vectorized_payoff(self.stock_tree.values[-1]) # fill last level with payoffs

                # then backtrack using formula  V_n^(k,h) = e^(-rΔt) [ q V_(n+1)^(k+1) + (1-q) V_(n+1)^k ] 
                for depth in range(len(option_tree.values) - 1)[::-1]:     # loop backwards from second-to-last level
                    for height in range(len(option_tree.values[depth])):   # loop through nodes of that level

                        hold_value = np.exp(-self.r * self.delta_T) * ( self.q * option_tree.values[depth + 1][height + 1] + (1 - self.q) * option_tree.values[depth + 1][height] )

                        if self.option.style == "European":
                            option_tree.values[depth][height] = hold_value
                        
                        else: # American
                            exercise_value = self.option.payoff(self.stock_tree.values[depth][height])
                            option_tree.values[depth][height] = max(hold_value, exercise_value)



                # BEFORE TREE
                # last level zeros
                # get_coords then fill with whatever coresponds in the after tree
                # backtrack
            

        return option_tree
    

    def find_coords_to_be_0(self) -> list: # list of (depth, height)
        """ FOR NOW THIS IS ONLY FOR KNOCK-OUT BARRIER OPTIONS """
        assert isinstance(self.option, BarrierOption), 'huh'
        assert self.option.knock_type == 'out', 'huh'
        
        coords = []

        if self.option.direction == 'up':
            for depth in range(len(self.stock_tree.values)):     
                for height in range(len(self.stock_tree.values[depth])):

                    if self.stock_tree.values[depth][height] >= self.option.barrier:
                        coords.append( (depth, height) )

        else: # 'down'
            for depth in range(len(self.stock_tree.values)):     
                for height in range(len(self.stock_tree.values[depth])):

                    if self.stock_tree.values[depth][height] <= self.option.barrier: # condition changed
                        coords.append( (depth, height) )

        return coords # depth, height

