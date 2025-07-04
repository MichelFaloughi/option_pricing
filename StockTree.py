from BinomialTree import BinomialTree
import numpy as np

class StockTree(BinomialTree):

    def __init__(self, depth: int, S0: float, up_factor: float, down_factor: float):

        assert depth >= 1 and depth <= 1000, 'depth out of range'
        assert S0 > 0, "Initial stock price must be greater than 0"
        assert up_factor > 1, "Up factor must be bigger than 1"
        assert down_factor < 1, "Down factor must be less than 1"

        self.depth = depth
        self.S0 = S0
        self.upFactor = up_factor
        self.down_factor = down_factor

        self.values = self.build_stock_tree()

    
    def build_stock_tree(self) -> np.ndarray:

        # First let's get the skeleton
        return_array = self.get_default_values()

        # Then let's fill the tree with the correct values
        for i in range(self.depth):
            for j in range(i + 1):
                return_array[i][j] = self.S0 * (self.upFactor ** j) * (self.down_factor ** (i - j))
        
        return return_array

        
