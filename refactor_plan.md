# OptionPricer Refactor Plan

## New Functions to Implement

### 1. Main Entry Point
```python
def build_option_tree(self) -> BinomialTree:
    """Main entry point - routes to appropriate builder based on option type"""
    if isinstance(self.option, BarrierOption):
        return self._build_barrier_option_tree()
    else:
        return self._build_vanilla_option_tree()
```

### 2. Vanilla Option Builder
```python
def _build_vanilla_option_tree(self) -> BinomialTree:
    """Build tree for vanilla (non-barrier) options"""
    option_tree = BinomialTree(self.N + 1)
    vectorized_payoff = np.vectorize(self.option.payoff)
    
    # Set terminal payoffs
    option_tree.values[-1] = vectorized_payoff(self.stock_tree.values[-1])
    
    # Backtrack through the tree
    self._backtrack_tree(option_tree)
    
    return option_tree
```

### 3. Barrier Option Router
```python
def _build_barrier_option_tree(self) -> BinomialTree:
    """Build tree for barrier options"""
    if self.option.knock_type == 'out':
        return self._build_knock_out_tree()
    else:  # knock-in
        return self._build_knock_in_tree()
```

### 4. Knock-Out Tree Builder
```python
def _build_knock_out_tree(self) -> BinomialTree:
    """Build tree for knock-out barrier options"""
    option_tree = BinomialTree(self.N + 1)
    vectorized_payoff = np.vectorize(self.option.payoff)
    
    # Set terminal payoffs
    option_tree.values[-1] = vectorized_payoff(self.stock_tree.values[-1])
    
    # Set knocked-out nodes to zero
    knocked_out_coords = self._find_barrier_coordinates()
    for depth, height in knocked_out_coords:
        option_tree.values[depth][height] = 0
    
    # Backtrack with barrier constraints
    self._backtrack_tree_with_barrier(option_tree, knocked_out_coords)
    
    return option_tree
```

### 5. Knock-In Tree Builder
```python
def _build_knock_in_tree(self) -> BinomialTree:
    """Build tree for knock-in barrier options"""
    # First build the "after" tree (what happens if barrier is hit)
    after_tree = self._build_vanilla_option_tree()
    
    # Then build the "before" tree (what happens if barrier is not hit)
    before_tree = BinomialTree(self.N + 1)
    vectorized_payoff = np.vectorize(self.option.payoff)
    
    # Set terminal payoffs
    before_tree.values[-1] = vectorized_payoff(self.stock_tree.values[-1])
    
    # Set knocked-in nodes to their after-tree values
    knocked_in_coords = self._find_barrier_coordinates()
    for depth, height in knocked_in_coords:
        before_tree.values[depth][height] = after_tree.values[depth][height]
    
    # Backtrack with barrier constraints
    self._backtrack_tree_with_barrier(before_tree, knocked_in_coords, after_tree)
    
    # Store after_tree for potential future use
    self.after_tree = after_tree
    
    return before_tree
```

### 6. Vanilla Backtracking
```python
def _backtrack_tree(self, option_tree: BinomialTree):
    """Backtrack through the tree for vanilla options"""
    for depth in range(len(option_tree.values) - 1)[::-1]:
        for height in range(len(option_tree.values[depth])):
            hold_value = self._calculate_hold_value(option_tree, depth, height)
            
            if self.option.style == "European":
                option_tree.values[depth][height] = hold_value
            else:  # American
                exercise_value = self.option.payoff(self.stock_tree.values[depth][height])
                option_tree.values[depth][height] = max(hold_value, exercise_value)
```

### 7. Barrier Backtracking
```python
def _backtrack_tree_with_barrier(self, option_tree: BinomialTree, barrier_coords: list, after_tree: BinomialTree = None):
    """Backtrack through the tree with barrier constraints"""
    for depth in range(len(option_tree.values) - 1)[::-1]:
        for height in range(len(option_tree.values[depth])):
            
            if (depth, height) in barrier_coords:
                if after_tree is not None:
                    # Knock-in case: use after_tree value
                    option_tree.values[depth][height] = after_tree.values[depth][height]
                else:
                    # Knock-out case: keep as zero
                    option_tree.values[depth][height] = 0
            else:
                hold_value = self._calculate_hold_value(option_tree, depth, height)
                
                if self.option.style == "European":
                    option_tree.values[depth][height] = hold_value
                else:  # American
                    exercise_value = self.option.payoff(self.stock_tree.values[depth][height])
                    option_tree.values[depth][height] = max(hold_value, exercise_value)
```

### 8. Hold Value Calculator
```python
def _calculate_hold_value(self, option_tree: BinomialTree, depth: int, height: int) -> float:
    """Calculate the hold value for a given node"""
    return np.exp(-self.r * self.delta_T) * (
        self.q * option_tree.values[depth + 1][height + 1] + 
        (1 - self.q) * option_tree.values[depth + 1][height]
    )
```

### 9. Barrier Coordinate Finder
```python
def _find_barrier_coordinates(self) -> list:
    """Find coordinates of nodes that have passed the barrier"""
    assert isinstance(self.option, BarrierOption), 'This method is only for barrier options'
    
    coords = []
    
    if self.option.direction == 'up':
        for depth in range(len(self.stock_tree.values)):
            for height in range(len(self.stock_tree.values[depth])):
                if self.stock_tree.values[depth][height] >= self.option.barrier:
                    coords.append((depth, height))
    else:  # 'down'
        for depth in range(len(self.stock_tree.values)):
            for height in range(len(self.stock_tree.values[depth])):
                if self.stock_tree.values[depth][height] <= self.option.barrier:
                    coords.append((depth, height))
    
    return coords
```

### 10. Deprecated Wrapper (Optional)
```python
def find_coords_passt_barrier(self) -> list:
    """Deprecated: Use _find_barrier_coordinates instead"""
    return self._find_barrier_coordinates()
```

## Implementation Order

1. Start with helper functions: `_calculate_hold_value`, `_find_barrier_coordinates`
2. Implement backtracking functions: `_backtrack_tree`, `_backtrack_tree_with_barrier`
3. Build specific tree builders: `_build_vanilla_option_tree`, `_build_knock_out_tree`, `_build_knock_in_tree`
4. Add router: `_build_barrier_option_tree`
5. Finally, refactor main method: `build_option_tree`
6. Optionally add deprecated wrapper for backward compatibility

## Key Benefits

- **DRY Principle**: No repeated backtracking logic
- **Single Responsibility**: Each method has one clear purpose
- **Maintainability**: Changes to pricing logic only need to be made in one place
- **Testability**: Each method can be tested independently
- **Readability**: Much easier to understand the flow 