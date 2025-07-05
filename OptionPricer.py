# TODO: for now forget custom payoffs, but this is a member of the Option class
import numpy as np
from Option import Option
from StockTree import StockTree
from BinomialTree import BinomialTree
from BarrierOption import BarrierOption

class OptionPricer:

    def __init__(self,  option: Option,
                        sigma: float,   # volatility
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
            
    ####################
    ## OPTION PRICERS ##
    ####################

    def build_option_tree(self) -> BinomialTree:
        """ Main entry point - routes to appropriate builder based on option type """
        if isinstance(self.option, BarrierOption):
            return self._build_barrier_option_tree()
        else:
            return self._build_vanilla_option_tree() 
    
    def _build_barrier_option_tree(self) -> BinomialTree:
        """ Barrier options builder sub-router """
        if self.option.knock_type == 'out':
            return self._build_knock_out_tree()
        else:  # knock-in
            return self._build_knock_in_tree()

    def _build_vanilla_option_tree(self) -> BinomialTree:
        """ Build tree for vanilla (non-barrier) options, European or American alike """
        option_tree = BinomialTree(self.N + 1)  # Make skeleton
        self._set_terminal_payoffs(option_tree) # Set terminal payoffs
        self._vanilla_backtrack_tree(option_tree)       # Backtrack
        
        return option_tree

    def _build_knock_out_tree(self) -> BinomialTree:
        """ What da func says """
        option_tree = BinomialTree(self.N + 1)  # Make skeleton
        self._set_terminal_payoffs(option_tree) # Set terminal payoffs
        
        # Set nodes passt barrier to 0
        nodes_passt_barrier = self._find_coords_passt_barrier()
        for depth, height in nodes_passt_barrier:
            option_tree.values[depth][height] = 0
        
        self._barrier_backtrack_tree(option_tree, nodes_passt_barrier) # Barrier backtrack
        
        return option_tree

    def _build_knock_in_tree(self) -> BinomialTree:
        """ Same as above, the most troublesome cause we have before and after trees """
        
        after_tree = self._build_vanilla_option_tree()  # After tree, straightforward
        before_tree = BinomialTree(self.N + 1)          # Before tree skeleton
        
        self._set_terminal_payoffs(before_tree) # Set terminal payoffs
        
        # Set knocked-in nodes to their after-tree values
        nodes_passt_barrier = self._find_coords_passt_barrier()
        for depth, height in nodes_passt_barrier:
            before_tree.values[depth][height] = after_tree.values[depth][height]
        
        self._barrier_backtrack_tree(before_tree, nodes_passt_barrier, after_tree) # Barrier backtrack
        self.after_tree = after_tree # Store for future use
        
        return before_tree




    #######################
    ## UTILITY FUNCTIONS ##
    #######################

    def _set_terminal_payoffs(self, tree: BinomialTree):
        """ Set the last level of given tree to the payoffs of the stock_tree """
        vectorized_payoff = np.vectorize(self.option.payoff) 
        tree.values[-1] = vectorized_payoff(self.stock_tree.values[-1])
    
    def _find_coords_passt_barrier(self) -> list: # list of (depth, height)
        """ what da func name says. Sometimes these need to be set to 0 (knock-out case),
         sometimes they need to be set to their value in the after tree (knock-in case) """
        assert isinstance(self.option, BarrierOption), 'why would you need this ?'
        
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

    def _calculate_hold_value(self, depth: int, height: int, option_tree: BinomialTree) -> float:
        """ calculate the hold value for a given depth and height """
        return np.exp(-self.r * self.delta_T) * ( self.q * option_tree.values[depth + 1][height + 1] + (1 - self.q) * option_tree.values[depth + 1][height] )

    ##### Backtrackers #####

    def _vanilla_backtrack_tree(self, option_tree: BinomialTree):
        """ Backtrack from second to last level to start, considering European or American cases """
        # backtrack using formula  V_n^(k,h) = e^(-rΔt) [ q V_(n+1)^(k+1) + (1-q) V_(n+1)^k ] 
        for depth in range(len(option_tree.values) - 1)[::-1]:     # loop backwards from second-to-last level
            for height in range(len(option_tree.values[depth])):   # loop through nodes of that level

                hold_value = self._calculate_hold_value(depth, height, option_tree)

                if self.option.style == "European":
                    option_tree.values[depth][height] = hold_value
                
                else: # American
                    exercise_value = self.option.payoff(self.stock_tree.values[depth][height])
                    option_tree.values[depth][height] = max(hold_value, exercise_value)
    
    def _barrier_backtrack_tree(self, option_tree: BinomialTree, passt_barrier_coords:list, after_tree: BinomialTree = None):
        """ Same backtrack but check for special nodes passt the barrier, replace with 0 or corresponding value in after_tree """
        for depth in range(len(option_tree.values) - 1)[::-1]:
            for height in range(len(option_tree.values[depth])):
                
                if (depth, height) in passt_barrier_coords:
                    if after_tree is not None:
                        # Knock-in case: use after_tree value
                        option_tree.values[depth][height] = after_tree.values[depth][height]
                    else:
                        # Knock-out case: keep as zero
                        option_tree.values[depth][height] = 0
                else:
                    hold_value = self._calculate_hold_value(depth, height, option_tree)
                    
                    if self.option.style == "European":
                        option_tree.values[depth][height] = hold_value
                    else:  # American
                        exercise_value = self.option.payoff(self.stock_tree.values[depth][height])
                        option_tree.values[depth][height] = max(hold_value, exercise_value)