// Option Pricing Calculator - JavaScript Implementation

class BinomialTree {
    constructor(depth, values = null) {
        this.depth = depth;
        this.values = values || this.getDefaultValues();
    }

    getDefaultValues() {
        const returnArray = [];
        for (let i = 0; i < this.depth; i++) {
            returnArray[i] = new Array(i + 1).fill(0);
        }
        return returnArray;
    }

    displayTreeOnTerminal() {
        let result = '';
        for (let i = 0; i < this.depth; i++) {
            const spaces = (this.depth - i - 1) * 4;
            result += ' '.repeat(spaces);
            for (const val of this.values[i]) {
                result += `${val.toFixed(2).padStart(6)} `;
            }
            result += '\n';
        }
        return result;
    }
}

class StockTree extends BinomialTree {
    constructor(depth, S0, upFactor, downFactor) {
        super(depth);
        this.S0 = S0;
        this.upFactor = upFactor;
        this.downFactor = downFactor;
        this.values = this.buildStockTree();
    }

    buildStockTree() {
        const returnArray = this.getDefaultValues();
        
        for (let i = 0; i < this.depth; i++) {
            for (let j = 0; j <= i; j++) {
                returnArray[i][j] = this.S0 * Math.pow(this.upFactor, j) * Math.pow(this.downFactor, i - j);
            }
        }
        
        return returnArray;
    }
}

class Option {
    constructor(K, T, style, type) {
        this.K = K;
        this.T = T;
        this.style = style;
        this.type = type;
        this.payoff = this.getPayoffFunction();
    }

    getPayoffFunction() {
        if (this.type === 'Call') {
            return (S) => Math.max(0, S - this.K);
        } else if (this.type === 'Put') {
            return (S) => Math.max(0, this.K - S);
        } else {
            throw new Error("Type must be either 'Call' or 'Put'");
        }
    }
}

class BarrierOption extends Option {
    constructor(K, T, style, type, barrier, direction, knockType) {
        super(K, T, style, type);
        this.barrier = barrier;
        this.direction = direction;
        this.knockType = knockType;
    }
}

class OptionPricer {
    constructor(option, sigma, S0, r, N) {
        this.option = option;
        this.sigma = sigma;
        this.S0 = S0;
        this.r = r;
        this.N = N;

        // Calculations
        this.delta_T = this.option.T / N;
        this.up_factor = Math.exp(sigma * Math.sqrt(this.delta_T));
        this.down_factor = 1 / this.up_factor;
        this.q = (Math.exp(r * this.delta_T) - this.down_factor) / (this.up_factor - this.down_factor);

        this.stock_tree = new StockTree(N + 1, S0, this.up_factor, this.down_factor);
    }

    buildOptionTree() {
        if (this.option instanceof BarrierOption) {
            return this.buildBarrierOptionTree();
        } else {
            return this.buildVanillaOptionTree();
        }
    }

    buildBarrierOptionTree() {
        if (this.option.knockType === 'out') {
            return this.buildKnockOutTree();
        } else {
            return this.buildKnockInTree();
        }
    }

    buildVanillaOptionTree() {
        const option_tree = new BinomialTree(this.N + 1);
        this.setTerminalPayoffs(option_tree);
        this.vanillaBacktrackTree(option_tree);
        return option_tree;
    }

    buildKnockOutTree() {
        const option_tree = new BinomialTree(this.N + 1);
        this.setTerminalPayoffs(option_tree);
        
        const nodesPastBarrier = this.findCoordsPastBarrier();
        for (const [depth, height] of nodesPastBarrier) {
            option_tree.values[depth][height] = 0;
        }
        
        this.barrierBacktrackTree(option_tree, nodesPastBarrier);
        return option_tree;
    }

    buildKnockInTree() {
        const after_tree = this.buildVanillaOptionTree();
        const before_tree = new BinomialTree(this.N + 1);
        
        before_tree.values[before_tree.values.length - 1] = new Array(before_tree.values[before_tree.values.length - 1].length).fill(0);
        
        const nodesPastBarrier = this.findCoordsPastBarrier();
        for (const [depth, height] of nodesPastBarrier) {
            before_tree.values[depth][height] = after_tree.values[depth][height];
        }
        
        this.barrierBacktrackTree(before_tree, nodesPastBarrier, after_tree);
        this.after_tree = after_tree;
        
        return before_tree;
    }

    setTerminalPayoffs(tree) {
        for (let i = 0; i < tree.values[tree.values.length - 1].length; i++) {
            tree.values[tree.values.length - 1][i] = this.option.payoff(this.stock_tree.values[tree.values.length - 1][i]);
        }
    }

    findCoordsPastBarrier() {
        const coords = [];
        
        if (this.option.direction === 'up') {
            for (let depth = 0; depth < this.stock_tree.values.length; depth++) {
                for (let height = 0; height < this.stock_tree.values[depth].length; height++) {
                    if (this.stock_tree.values[depth][height] >= this.option.barrier) {
                        coords.push([depth, height]);
                    }
                }
            }
        } else {
            for (let depth = 0; depth < this.stock_tree.values.length; depth++) {
                for (let height = 0; height < this.stock_tree.values[depth].length; height++) {
                    if (this.stock_tree.values[depth][height] <= this.option.barrier) {
                        coords.push([depth, height]);
                    }
                }
            }
        }
        
        return coords;
    }

    calculateHoldValue(depth, height, option_tree) {
        return Math.exp(-this.r * this.delta_T) * 
               (this.q * option_tree.values[depth + 1][height + 1] + 
                (1 - this.q) * option_tree.values[depth + 1][height]);
    }

    vanillaBacktrackTree(option_tree) {
        for (let depth = option_tree.values.length - 2; depth >= 0; depth--) {
            for (let height = 0; height < option_tree.values[depth].length; height++) {
                const hold_value = this.calculateHoldValue(depth, height, option_tree);
                
                if (this.option.style === "European") {
                    option_tree.values[depth][height] = hold_value;
                } else {
                    const exercise_value = this.option.payoff(this.stock_tree.values[depth][height]);
                    option_tree.values[depth][height] = Math.max(hold_value, exercise_value);
                }
            }
        }
    }

    barrierBacktrackTree(option_tree, pastBarrierCoords, after_tree = null) {
        for (let depth = option_tree.values.length - 2; depth >= 0; depth--) {
            for (let height = 0; height < option_tree.values[depth].length; height++) {
                const isPastBarrier = pastBarrierCoords.some(([d, h]) => d === depth && h === height);
                
                if (isPastBarrier) {
                    if (after_tree !== null) {
                        option_tree.values[depth][height] = after_tree.values[depth][height];
                    } else {
                        option_tree.values[depth][height] = 0;
                    }
                } else {
                    const hold_value = this.calculateHoldValue(depth, height, option_tree);
                    
                    if (this.option.style === "European") {
                        option_tree.values[depth][height] = hold_value;
                    } else {
                        const exercise_value = this.option.payoff(this.stock_tree.values[depth][height]);
                        option_tree.values[depth][height] = Math.max(hold_value, exercise_value);
                    }
                }
            }
        }
    }
}

// UI Functions
function displayTree(tree, containerId) {
    const container = document.getElementById(containerId);
    if (!tree || !tree.values || tree.values.length === 0) {
        container.innerHTML = '<div class="empty">No tree data available</div>';
        return;
    }

    // Layout parameters
    const nodeSize = 56; // px (node box height/width)
    const hGap = 90;     // horizontal gap between columns
    const vGap = 65;     // vertical gap between rows (user's preferred)
    const depth = tree.values.length;
    const maxNodes = tree.values[depth - 1].length;
    const svgWidth = (depth - 1) * hGap + nodeSize * 2;
    const svgHeight = (maxNodes - 1) * vGap + nodeSize * 2;

    // Calculate node positions: for each (col, row), compute (x, y)
    // Center the root node vertically
    const nodePositions = [];
    for (let col = 0; col < depth; col++) {
        nodePositions[col] = [];
        const nodesInCol = tree.values[col].length;
        // Center this column vertically
        const colTop = (svgHeight - (nodesInCol - 1) * vGap - nodeSize) / 2;
        for (let row = 0; row < nodesInCol; row++) {
            // Flip the row index: highest price at top
            const flippedRow = nodesInCol - 1 - row;
            const x = col * hGap + nodeSize;
            const y = colTop + flippedRow * vGap;
            nodePositions[col][row] = { x, y };
        }
    }

    // SVG for branches
    let svgLines = '';
    for (let col = 0; col < depth - 1; col++) {
        for (let row = 0; row < tree.values[col].length; row++) {
            // Each node connects to two children: (col+1, row) and (col+1, row+1)
            const { x: x1, y: y1 } = nodePositions[col][row];
            // Left child (down move, which is now lower visually)
            if (row < nodePositions[col + 1].length) {
                const { x: x2, y: y2 } = nodePositions[col + 1][row];
                svgLines += `<line x1="${x1 + nodeSize / 2}" y1="${y1 + nodeSize / 2}" x2="${x2 + nodeSize / 2}" y2="${y2 + nodeSize / 2}" stroke="#b4b4b4" stroke-width="2" />`;
            }
            // Right child (up move, which is now higher visually)
            if (row + 1 < nodePositions[col + 1].length) {
                const { x: x2, y: y2 } = nodePositions[col + 1][row + 1];
                svgLines += `<line x1="${x1 + nodeSize / 2}" y1="${y1 + nodeSize / 2}" x2="${x2 + nodeSize / 2}" y2="${y2 + nodeSize / 2}" stroke="#b4b4b4" stroke-width="2" />`;
            }
        }
    }

    // Render nodes
    let nodesHtml = '';
    for (let col = 0; col < depth; col++) {
        for (let row = 0; row < tree.values[col].length; row++) {
            const { x, y } = nodePositions[col][row];
            const value = tree.values[col][row];
            const nodeClass = col === 0 && row === 0 ? 'tree-node highlight' : 'tree-node';
            nodesHtml += `<div class="${nodeClass}" style="position:absolute;left:${x}px;top:${y}px;width:${nodeSize}px;height:${nodeSize}px;display:flex;align-items:center;justify-content:center;">${value.toFixed(2)}</div>`;
        }
    }

    // Compose HTML
    container.innerHTML = `
        <div style="position:relative;width:${svgWidth}px;height:${svgHeight}px;margin:0 auto;">
            <svg width="${svgWidth}" height="${svgHeight}" style="position:absolute;left:0;top:0;z-index:0;">
                ${svgLines}
            </svg>
            <div style="position:absolute;left:0;top:0;z-index:1;">
                ${nodesHtml}
            </div>
        </div>
    `;
}

function calculateOptionPrice() {
    const calculateBtn = document.getElementById('calculateBtn');
    const priceDisplay = document.getElementById('optionPrice');
    
    // Show loading state
    calculateBtn.innerHTML = '<span class="loading"></span> Calculating...';
    calculateBtn.disabled = true;
    priceDisplay.textContent = 'Calculating...';

    try {
        // Get input values
        const sigma = parseFloat(document.getElementById('sigma').value);
        const S0 = parseFloat(document.getElementById('S0').value);
        const r = parseFloat(document.getElementById('r').value);
        const T = parseFloat(document.getElementById('T').value);
        const N = parseInt(document.getElementById('N').value);
        const K = parseFloat(document.getElementById('K').value);
        const optionType = document.getElementById('optionType').value;
        const style = document.getElementById('style').value;
        const optionCategory = document.getElementById('optionCategory').value;

        // Validate inputs
        if (isNaN(sigma) || isNaN(S0) || isNaN(r) || isNaN(T) || isNaN(N) || isNaN(K)) {
            throw new Error('Please enter valid numeric values for all parameters');
        }

        if (sigma <= 0 || S0 <= 0 || K <= 0 || T <= 0 || N <= 0) {
            throw new Error('All parameters must be positive');
        }

        if (N > 10) {
            throw new Error('Number of steps must be 10 or less for performance reasons');
        }

        // Create option
        let option;
        if (optionCategory === 'vanilla') {
            option = new Option(K, T, style, optionType);
        } else {
            const barrier = parseFloat(document.getElementById('barrier').value);
            const direction = document.getElementById('direction').value;
            const knockType = document.getElementById('knockType').value;
            
            if (isNaN(barrier) || barrier <= 0) {
                throw new Error('Please enter a valid barrier level');
            }
            
            option = new BarrierOption(K, T, style, optionType, barrier, direction, knockType);
        }

        // Create option pricer and calculate
        const optionPricer = new OptionPricer(option, sigma, S0, r, N);
        const optionTree = optionPricer.buildOptionTree();

        // Display results
        const optionPrice = optionTree.values[0][0];
        priceDisplay.textContent = `$${optionPrice.toFixed(4)}`;

        // Display trees
        displayTree(optionPricer.stock_tree, 'stockTree');
        displayTree(optionTree, 'optionTree');

        // Display after tree for barrier options if it exists
        const afterTreeSection = document.getElementById('afterTreeSection');
        if (optionPricer.after_tree) {
            displayTree(optionPricer.after_tree, 'afterTree');
            afterTreeSection.style.display = 'block';
        } else {
            afterTreeSection.style.display = 'none';
        }

    } catch (error) {
        priceDisplay.textContent = 'Error';
        document.getElementById('stockTree').innerHTML = `<div class="empty">Error: ${error.message}</div>`;
        document.getElementById('optionTree').innerHTML = `<div class="empty">Error: ${error.message}</div>`;
        console.error('Calculation error:', error);
    } finally {
        // Reset button state
        calculateBtn.innerHTML = 'Calculate Option Price';
        calculateBtn.disabled = false;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Toggle barrier parameters visibility
    const optionCategory = document.getElementById('optionCategory');
    const barrierParams = document.getElementById('barrierParams');
    
    optionCategory.addEventListener('change', function() {
        if (this.value === 'barrier') {
            barrierParams.style.display = 'block';
        } else {
            barrierParams.style.display = 'none';
        }
    });

    // Calculate button
    document.getElementById('calculateBtn').addEventListener('click', calculateOptionPrice);

    // Auto-calculate on Enter key
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            calculateOptionPrice();
        }
    });

    // Initialize with default values
    displayTree(null, 'stockTree');
    displayTree(null, 'optionTree');
}); 