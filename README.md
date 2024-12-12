
# COVID-19 Data Visualization Dashboard

This repository contains the source code for a COVID-19 Data Visualization Dashboard, a web application that visualizes the global impact and spread of the COVID-19 pandemic.

You can view the live dashboard here -> https://heysachins.github.io/covid-19-dashboard/

## Project Overview

The COVID-19 Data Visualization Dashboard provides an interactive platform for exploring various aspects of the COVID-19 pandemic. It includes multiple visualizations that help users understand the spread of the virus, the impact of vaccinations, and the effects of different socio-economic factors on the pandemic.

## Features

- **Global COVID-19 Spread Visualization**:
  - A world map with bubble markers indicating the number of COVID-19 cases in each country. The size of each bubble corresponds to the case count.
  - Interactive elements like tooltips and zoom functionality for detailed country-level data.

- **Country Comparison**:
  - Bar charts to compare countries based on GDP or population density, showing how these factors correlate with COVID-19 spread.
  - Line charts displaying COVID-19 cases, deaths, and stringency index for selected countries, with the ability to add or remove countries for comparison.

- **Impact of Vaccinations and Booster Shots**:
  - Line charts showing the relationship between vaccination rates, booster shots, and COVID-19 cases/deaths globally.
  - A pie chart displaying global vaccination statistics.

- **Correlation Analysis**:
  - Scatterplot with k-means clustering to explore the correlation between GDP and COVID-19 cases across different countries.

- **Interactive Visualizations**:
  - Hovering over data points in one visualization highlights related data in others, providing a comprehensive view of the data.
  - Cross-visualization brushing to select and highlight multiple data points across visualizations.

## Technology Stack

- **HTML5** for the structure of the application.
- **CSS3** for styling and layout.
- **JavaScript (D3.js)** for creating dynamic and interactive data visualizations.
- **CSV data** sourced from OWID (Our World in Data) for COVID-19 statistics.

## Project Structure

- `index.html` - The main HTML page that hosts all the visualizations.
- `index.js` - JavaScript file containing the logic for data processing and visualization rendering.
- `index.css` - CSS file for styling the dashboard.
- `owid-covid-data.csv` - Dataset containing global COVID-19 statistics.
- `cover-page.webp` - Cover image for the project.

## How to Run the Project Locally

1. Clone the repository:

   ```bash
   git clone https://github.com/heysachins/covid-19-dashboard.git
   ```

2. Navigate to the project directory:

   ```bash
   cd covid-19-dashboard
   ```

3. Open `index.html` in your web browser:

   ```bash
   open index.html
   ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
