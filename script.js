// Option Pricing Calculator - JavaScript Implementation

class BinomialTree {
    constructor(depth, values = null) {
        this.depth = depth;
        this.values = values || this.getDefaultValues();
        // Coordinates ("depth,height") where exercising beats holding. Only ever
        // populated for American-style options.
        this.exerciseNodes = new Set();
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
                    if (exercise_value > hold_value) {
                        option_tree.exerciseNodes.add(`${depth},${height}`);
                    }
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
                        if (exercise_value > hold_value) {
                            option_tree.exerciseNodes.add(`${depth},${height}`);
                        }
                    }
                }
            }
        }
    }
}

// UI Functions

// Layout constants for the rendered trees (px).
const NODE_SIZE = 52;
const H_GAP = 88;
const V_GAP = 62;

/**
 * Render a binomial tree as positioned nodes over an SVG edge layer.
 *
 * `ctx` optionally carries pricing context used to encode meaning onto the
 * nodes:
 *   moneyness    - tint nodes by stock price relative to the strike
 *   K, barrier   - draw horizontal reference lines at those price levels
 *   S0, upFactor - required for reference lines (sets the price/y mapping)
 *   pastBarrier  - Set of "depth,height" keys that have crossed the barrier
 *   exercise     - Set of "depth,height" keys where early exercise is optimal
 */
function displayTree(tree, containerId, ctx = {}) {
    const container = document.getElementById(containerId);
    if (!tree || !tree.values || tree.values.length === 0) {
        container.innerHTML = '<div class="empty">Enter parameters and calculate to build the tree.</div>';
        return;
    }

    const depth = tree.values.length;
    const maxNodes = tree.values[depth - 1].length;
    const width = (depth - 1) * H_GAP + NODE_SIZE * 2;
    const height = (maxNodes - 1) * V_GAP + NODE_SIZE * 2;

    // Node positions. Each column is centered vertically and rows are flipped so
    // the highest price sits at the top.
    const pos = [];
    for (let col = 0; col < depth; col++) {
        pos[col] = [];
        const nodesInCol = tree.values[col].length;
        const colTop = (height - (nodesInCol - 1) * V_GAP - NODE_SIZE) / 2;
        for (let row = 0; row < nodesInCol; row++) {
            pos[col][row] = {
                x: col * H_GAP + NODE_SIZE,
                y: colTop + (nodesInCol - 1 - row) * V_GAP
            };
        }
    }

    // Edges to both children: (col+1, row) is the down move, (col+1, row+1) the up move.
    let edges = '';
    for (let col = 0; col < depth - 1; col++) {
        for (let row = 0; row < tree.values[col].length; row++) {
            const from = pos[col][row];
            for (const childRow of [row, row + 1]) {
                if (childRow < pos[col + 1].length) {
                    const to = pos[col + 1][childRow];
                    edges += `<line class="tree-edge" x1="${from.x + NODE_SIZE / 2}" y1="${from.y + NODE_SIZE / 2}" `
                          + `x2="${to.x + NODE_SIZE / 2}" y2="${to.y + NODE_SIZE / 2}" />`;
                }
            }
        }
    }

    // The tree recombines, so a given price always lands at the same y:
    //   y = height/2 - log(S/S0)/log(u) * (V_GAP/2)
    const priceToY = (price) => {
        if (!ctx.S0 || !ctx.upFactor || ctx.upFactor <= 1) return null;
        const y = height / 2 - (Math.log(price / ctx.S0) / Math.log(ctx.upFactor)) * (V_GAP / 2);
        return y >= 8 && y <= height - 8 ? y : null;
    };

    let refLines = '';
    const addRefLine = (price, kind, label) => {
        const y = priceToY(price);
        if (y === null) return;
        refLines += `<line class="ref-line ${kind}" x1="0" y1="${y}" x2="${width}" y2="${y}" />`
                  + `<text class="ref-label" x="${width - 4}" y="${y - 5}" text-anchor="end">${label} ${price.toFixed(2)}</text>`;
    };
    if (ctx.K !== undefined) addRefLine(ctx.K, 'strike', 'K');
    if (ctx.barrier !== undefined) addRefLine(ctx.barrier, 'barrier', 'B');

    let nodes = '';
    for (let col = 0; col < depth; col++) {
        for (let row = 0; row < tree.values[col].length; row++) {
            const { x, y } = pos[col][row];
            const value = tree.values[col][row];
            const key = `${col},${row}`;

            const classes = ['tree-node'];
            if (col === 0 && row === 0) classes.push('root');
            if (ctx.pastBarrier && ctx.pastBarrier.has(key)) {
                classes.push('knocked');
            } else if (ctx.moneyness && ctx.K !== undefined) {
                classes.push(value >= ctx.K ? 'above-strike' : 'below-strike');
            }
            if (ctx.exercise && ctx.exercise.has(key)) classes.push('exercise');

            nodes += `<div class="${classes.join(' ')}" `
                   + `style="left:${x}px;top:${y}px;width:${NODE_SIZE}px;height:${NODE_SIZE}px;">`
                   + `${value.toFixed(2)}</div>`;
        }
    }

    container.innerHTML = `
        <div class="tree-canvas" style="width:${width}px;height:${height}px;">
            <svg width="${width}" height="${height}" aria-hidden="true">
                ${edges}
                ${refLines}
            </svg>
            ${nodes}
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

        // Shared pricing context so the trees can encode strike, barrier and
        // early-exercise information onto the nodes.
        const isBarrier = option instanceof BarrierOption;
        const pastBarrier = isBarrier
            ? new Set(optionPricer.findCoordsPastBarrier().map(([d, h]) => `${d},${h}`))
            : null;
        const baseCtx = { S0, upFactor: optionPricer.up_factor, K };
        if (isBarrier) baseCtx.barrier = option.barrier;

        displayTree(optionPricer.stock_tree, 'stockTree', { ...baseCtx, moneyness: true, pastBarrier });
        displayTree(optionTree, 'optionTree', { ...baseCtx, pastBarrier, exercise: optionTree.exerciseNodes });

        // Knock-in options also expose the "already knocked in" tree they fall back to.
        const afterTreeSection = document.getElementById('afterTreeSection');
        if (optionPricer.after_tree) {
            displayTree(optionPricer.after_tree, 'afterTree', {
                ...baseCtx,
                exercise: optionPricer.after_tree.exerciseNodes
            });
            afterTreeSection.hidden = false;
        } else {
            afterTreeSection.hidden = true;
        }

        // Show only the legend entries that apply to this run.
        for (const el of document.querySelectorAll('.tree-legend .barrier-only')) {
            el.hidden = !isBarrier;
        }
        for (const el of document.querySelectorAll('.tree-legend .american-only')) {
            el.hidden = style !== 'American';
        }

    } catch (error) {
        priceDisplay.textContent = '—';
        const message = document.createElement('div');
        message.className = 'empty';
        message.textContent = error.message;
        document.getElementById('stockTree').replaceChildren(message);
        document.getElementById('optionTree').replaceChildren(message.cloneNode(true));
        console.error('Calculation error:', error);
    } finally {
        // Reset button state
        calculateBtn.textContent = 'Calculate Option Price';
        calculateBtn.disabled = false;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Toggle barrier parameters visibility
    const optionCategory = document.getElementById('optionCategory');
    const barrierParams = document.getElementById('barrierParams');
    
    optionCategory.addEventListener('change', function() {
        barrierParams.hidden = this.value !== 'barrier';
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