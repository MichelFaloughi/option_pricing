import numpy as np
from typing import Optional

class BinomialTree:
    
    def __init__(self, depth: int, values: Optional[np.ndarray] = None):

        assert depth >= 1 and depth <= 1000, 'depth out of range'
        
        self.depth = depth
        self.values = values

        if values is not None:
            assert len(values) == depth + 1, "values length must match depth + 1"
        else:
            self.values = self.get_default_values()

    
    def get_default_values(self) -> np.ndarray:
        """ Returns a nested NumPy array of NumPy arrays of 0s with appropriate dimensions """

        return_array = np.empty(self.depth, dtype=object)

        for i in range(self.depth):
            return_array[i] = np.zeros(i + 1, dtype=float)

        assert len(return_array[-1]) == self.depth, 'error in making the default values'
        assert len(return_array[0]) == 1, 'huh'
        return return_array


    def display_tree_on_terminal(self):
        """ What the name says """

        for i in range(self.depth):
            spaces = (self.depth - i - 1) * 4  # wider for clean layout
            print(" " * spaces, end="")

            for val in self.values[i]:
                print(f"{val:6.2f} ", end="")  # 6-char width, 1 decimal

            print()  # new line after each row
            
        



