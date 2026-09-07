# 📈 Option Pricing Calculator

An interactive web application for pricing financial options using the binomial tree method, built with pure HTML, CSS, and JavaScript.

**▶ [Try it live](https://michelfaloughi.github.io/option_pricing/)**

## Features

- **Vanilla Options**: Price European and American call/put options
- **Barrier Options**: Support for knock-in and knock-out barrier options
- **Annotated Tree Visualization**: Binomial lattices with dashed reference lines at the
  strike and barrier levels, nodes tinted by moneyness, knocked nodes dimmed, and
  early-exercise nodes outlined for American options
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Light and Dark Mode**: Follows the operating system colour scheme
- **Real-time Calculation**: Instant results as you change parameters

## Parameters

### Market Parameters
- **Volatility (σ)**: Stock price volatility (0.01 - 2.0)
- **Initial Stock Price (S₀)**: Current stock price
- **Risk-free Rate (r)**: Annual risk-free interest rate (0 - 1)

### Option Parameters
- **Time to Maturity (T)**: Time until option expiration in years
- **Number of Steps (N)**: Number of time steps in the binomial tree (2-10)
- **Strike Price (K)**: Option strike price

### Option Type
- **Option Category**: Vanilla or Barrier options
- **Option Type**: Call or Put
- **Style**: European or American

### Barrier Parameters (for barrier options)
- **Barrier Level**: Price level that triggers the barrier
- **Direction**: Up or Down barrier
- **Knock Type**: Knock-in or Knock-out

## How to Use

1. Enter the market parameters (volatility, initial stock price, risk-free rate)
2. Set the option parameters (maturity, steps, strike price)
3. Choose the option type and style
4. For barrier options, set the barrier parameters
5. Click "Calculate Option Price" to see results
6. View the interactive binomial trees showing stock prices and option values


## Technical Details

The application implements the binomial tree method for option pricing:

1. **Stock Price Tree**: Builds the underlying stock price lattice
2. **Option Price Tree**: Calculates option values through backward induction
3. **Barrier Logic**: Handles barrier option specific calculations
4. **Risk-neutral Pricing**: Uses risk-neutral probabilities for valuation

### Mathematical Framework

- **Up Factor**: `u = e^(σ√Δt)`
- **Down Factor**: `d = 1/u`
- **Risk-neutral Probability**: `q = (e^(rΔt) - d)/(u - d)`
- **Option Value**: `V = e^(-rΔt) * [q*V_up + (1-q)*V_down]`

## Python Reference Implementation

The `src/` directory contains a standalone Python implementation of the same pricer (stock tree construction, backward induction, and barrier logic split across `StockTree`, `BinomialTree`, `Option`, `BarrierOption`, and `OptionPricer` classes), with pytest tests in `tests/`:

```bash
pip install numpy pytest
pytest tests/
```

## Performance Notes

- Number of steps (N) is limited to 10 for performance reasons
- Larger trees (N > 10) may cause browser slowdown
- All calculations are performed client-side using JavaScript

## Contributing

Feel free to contribute to this project by:
- Reporting bugs
- Suggesting new features
- Improving the UI/UX
- Adding new option types

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Built with vanilla JavaScript and no runtime dependencies
- Uses modern CSS Grid and Flexbox for responsive design
- Inspired by Dr. Ryan Donnelly's Mathematical Finance class at King's College London 