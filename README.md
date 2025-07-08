# 📈 Option Pricing Calculator

An interactive web application for pricing financial options using the binomial tree method. Built with pure HTML, CSS, and JavaScript for easy deployment on GitHub Pages.

## Features

- **Vanilla Options**: Price European and American call/put options
- **Barrier Options**: Support for knock-in and knock-out barrier options
- **Interactive Visualization**: Real-time display of binomial trees
- **Responsive Design**: Works on desktop, tablet, and mobile devices
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

## Deployment on GitHub Pages

### Method 1: Direct Upload (Recommended)

1. Create a new repository on GitHub
2. Upload the following files to your repository:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `README.md`
3. Go to your repository Settings
4. Scroll down to "GitHub Pages" section
5. Under "Source", select "Deploy from a branch"
6. Choose "main" branch and "/ (root)" folder
7. Click "Save"
8. Your app will be available at `https://yourusername.github.io/your-repo-name`

### Method 2: Using GitHub Desktop

1. Clone your repository to your local machine
2. Add the web app files to the repository folder
3. Commit and push the changes
4. Follow steps 4-8 from Method 1

### Method 3: Using Command Line

```bash
# Clone your repository
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name

# Add the web app files
# (Copy index.html, styles.css, script.js, README.md to this folder)

# Commit and push
git add .
git commit -m "Add option pricing calculator web app"
git push origin main
```

Then follow steps 4-8 from Method 1.

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

This project is open source and available under the MIT License.

## Acknowledgments

- Built with vanilla JavaScript for maximum compatibility
- Uses modern CSS Grid and Flexbox for responsive design
- Inspired by Dr. Ryan Donnelly's Mathematical Finance class at King's College London 