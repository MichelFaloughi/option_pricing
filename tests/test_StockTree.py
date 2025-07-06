import pytest
from src.StockTree import StockTree
import numpy as np

def test_stock_tree_init():
    stock_tree = StockTree(depth=3, S0=100, up_factor=1.1, down_factor=0.9)
    assert stock_tree.depth == 3
    assert stock_tree.S0 == 100
    assert stock_tree.up_factor == 1.1
    assert stock_tree.down_factor == 0.9

def test_stock_tree_values():
    stock_tree = StockTree(depth=3, S0=100, up_factor=1.1, down_factor=0.9)
    expected_values = [
        [100.0, 0.0, 0.0],
        [110.0, 90.0, 0.0],
        [121.0, 99.0, 81.0]
    ]
    assert np.allclose(stock_tree.values, expected_values)

