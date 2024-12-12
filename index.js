var flag = true; //used to drop drop down navigation bar
var currentClassActive = null;
var oldClassActive = null;
var cActive = 0;

window.onload = function() {
  fetch('owid-covid-data.csv')
      .then(response => response.text())
      .then(data => {
          console.log(data);
          // Process the CSV data here
          processData(data);
      })
      .catch(error => console.error('Error fetching the CSV file:', error));
};
//dropping the menu down when user clicks on menu once screen width decreases
d3.select("header")
  .select("span")
  .on("click", function (d) {
    if (flag) {
      d3.select("#nav-bar").classed("active-nav", true);
      d3.select("#full-body").classed("active-body", true);
      flag = false;
    } else {
      d3.select("#nav-bar").classed("active-nav", false);
      d3.select("#full-body").classed("active-body", false);
      flag = true;
    }
  });
d3.select("html").classed("smooth-scroll", true);

//activating the link when user clicks on it
//homepage is shown at first, so the current active class is stored in  ne variable - Home link
//afterwards the next active class gets active and previous is inactive.

d3.select("header")
  .selectAll("a")
  .on("click", function (d) {
    d3.select("header").selectAll(".active").attr("class", null);
    currentClassActive = d3.select(this).classed("active", true);
    flag = true;
    d3.select("#nav-bar").classed("active-nav", false);
    d3.select("#full-body").classed("active-body", false);
    d3.select("html").classed("smooth-scroll", true);
  });
d3.select("#gotosection2").on("click", function (d) {
  d3.select("html").classed("smooth-scroll", true);
});

//adding code for navigation bar activation when scrolling
var limitForEachActivation = (window.screen.height - 80) / 2;

//using an event and watching the pageYOffset variation.
d3.select(window).on("scroll", function () {
  //when page object is less than half of screen height, activate home.
  //home link is activated here
  if (window.pageYOffset < limitForEachActivation) {
    d3.select("header").selectAll(".active").attr("class", null);
    d3.select("#sec1").classed("active", true);
    d3.select(".header-white").attr("class", null);
  }

  //for each of the links apart from home, the below code will activate as user scrolls
  //when i is 1, it will be from half of first page to half of second page and likewise for the rest.
  //we cannot use i as it increments by 2, hence j which increments by 1 is used to activate links.
  for (let i = 1, j = 2; i < 8; i = i + 2, j++) {
    if (
      window.pageYOffset > limitForEachActivation * i &&
      window.pageYOffset < limitForEachActivation * (i + 1)
    ) {
      d3.select("header").selectAll(".active").attr("class", null);
      d3.select("#sec" + j).classed("active", true);
      d3.select("header").classed("header-white", true);
    }
  }
});

//Promise is used here to load both the geoJSON data as well as the whole covid data from the csv file.

Promise.all([
  d3.json(
    "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson" //data for the map
  ),
  d3.csv("owid-covid-data.csv"),
]).then(function (loadData) {
  //loading data
  let geoData = loadData[0];
  let wholeCovidData = loadData[1];

  //below code fetches continents
  const fetchContinentByCountry = new Map(); //returns continents when iso_code is used as key
  const fetchCountryByCode = new Map(); //returns continents when iso_code is used as key
  const fetchCountryByLocation = new Map(); //returns continents when iso_code is used as key
  const fetchContinents = new Set(); //returns all the names of the continents.

  wholeCovidData.map(function (d) {
    if (d.iso_code.length <= 3) {
      fetchContinentByCountry.set(d.iso_code, d.continent);
      fetchCountryByCode.set(d.iso_code, d.location);

      if (d.continent !== "") fetchContinents.add(d.continent); // removing any blank spaces in the continents
      //adding all continents to fetchContinents
    }
  });

  //selecting only the columns that are needed
  var covidData = wholeCovidData.map(function (d) {
    if (d.iso_code.length == 3) {
      return {
        iso_code: d.iso_code || "ISO_Code Unavailable",
        continent: d.continent || "Continent Unavailable",
        location: d.location || "Location Unavailable",
        total_deaths: d.total_deaths || "1.0",
        total_cases: d.total_cases || "1.0",
        total_cases_per_million: d.total_cases_per_million || "0.0",
        new_cases: d.new_cases || "0.0",
        stringency_index: d.stringency_index || "0.0",
        new_cases_smoothed: d.new_cases_smoothed || "0.0",
        new_cases_smoothed_per_million:
          d.new_cases_smoothed_per_million || "0.0",
        new_deaths: d.new_deaths || "0.0",
        new_deaths_smoothed: d.new_deaths_smoothed || "0.0",
        new_deaths_smoothed_per_million:
          d.new_deaths_smoothed_per_million || "0.0",
        total_vaccinations: d.people_vaccinated || "1.0", //people vaccinated is taken because total vaccination count is more than population count of the world
        total_boosters: d.total_boosters || "1.0",
        population: d.population || "0.0",
        population_density: d.population_density || "0.0",
        gdp_per_capita: d.gdp_per_capita || "0.0",
        new_cases_smoothed_per_million:
          d.new_cases_smoothed_per_million || "0.0",
        date: d.date || "Date Unavailable",
      };
    }
  });

  covidData = covidData.filter(function (d) {
    return d !== undefined;
  });

  /* Selecting the maximum value in total_cases for each country.
        This is later going to be used to determine the radius of each circle plotted on the map
        It groups the max value of total_cases by iso_code */

  const casesByCountry = d3.rollup(
    covidData,
    (v) => d3.max(v, (d) => +d.total_cases),
    (d) => d.iso_code
  );

  const casesByCountryName = d3.rollup(
    covidData,
    (v) => d3.max(v, (d) => +d.total_cases),
    (d) => fetchCountryByCode.get(d.iso_code)
  );

  const deathsByCountryName = d3.rollup(
    covidData,
    (v) => d3.max(v, (d) => +d.total_deaths),
    (d) => fetchCountryByCode.get(d.iso_code)
  );

  const popByCountryName = d3.rollup(
    covidData,
    (v) => d3.max(v, (d) => +d.population),
    (d) => fetchCountryByCode.get(d.iso_code)
  );

  var popDenByCountryAllValues = d3.rollup(
    covidData,
    (v) => d3.max(v, (d) => +d.population_density),
    (d) => fetchCountryByCode.get(d.iso_code)
  );
  //removing values with 0
  var popDenByCountry = new Map(
    d3.filter(
      Array.from(popDenByCountryAllValues),
      ([key, value]) => value > 1
    )
  );

  var gdpByCountryAllValues = d3.rollup(
    covidData,
    (v) => d3.max(v, (d) => +d.gdp_per_capita),
    (d) => fetchCountryByCode.get(d.iso_code)
  );

  //removing values with 0
  var gdpByCountry = new Map(
    d3.filter(
      Array.from(gdpByCountryAllValues),
      ([key, value]) => value !== 0
    )
  );

  numberOfCountries = 3;

  //this is in the Exploring Inequality and COVID-19 section of the page
  //fetching increase or decrese button value
  d3.select("#increase").on("click", function (d) {
    numberOfCountries = numberOfCountries + 1;
    if (numberOfCountries <= 5) {
      userSelectionCheck();
    } else {
      numberOfCountries = 5;
    }
  });

  d3.select("#decrease").on("click", function (d) {
    numberOfCountries = numberOfCountries - 1;
    if (numberOfCountries >= 2) {
      userSelectionCheck();
    } else {
      numberOfCountries = 2;
    }
  });

  //need to fetch min 2 countreis and max 2 countries from the map
  //sorting to arrange min 2 countries first and max 2 countries last
  function fetchTwoMaxAndMinCountries(dataMap) {
    const sortedEntries = Array.from(dataMap.entries()).sort(
      (a, b) => b[1] - a[1]
    );

    const minEntries = sortedEntries.slice(0, numberOfCountries);
    const maxEntries = sortedEntries.slice(-numberOfCountries);

    const resultEntries = [...minEntries, ...maxEntries];
    return new Map(resultEntries);
  }

  var iso_codes_added = []; //inorder to remove duplicate iso being added, the added iso will be pushed to this array, later a check is done to insert isos that are NOT present in this array.
  var casesByContinent = d3.rollup(
    covidData,
    (v) =>
      d3.sum(v, function (d) {
        if (!iso_codes_added.includes(d.iso_code)) {
          iso_codes_added.push(d.iso_code);
          return casesByCountry.get(d.iso_code);
        }
      }),
    (d) => d.continent
  );

  //fetching max population
  const popByCountry = d3.rollup(
    covidData,
    (v) => d3.max(v, (d) => +d.population),
    (d) => d.iso_code
  );

  var totalPopulation = d3.sum(popByCountry, (d) => d[1]);

  var casesGroupedByDateAndContinent = d3.rollup(
    covidData,
    // (a) => a.date,
    (v) => d3.sum(v, (d) => +d.new_cases_smoothed_per_million || 0),
    (d) => d.date,
    (c) => c.continent
  );

  var dataByCountryAndDate = d3.map(covidData, function (d) {
    return {
      date: d.date,
      country: fetchCountryByCode.get(d.iso_code),
      gdp_per_capita: +d.gdp_per_capita,
      total_cases: +d.total_cases_per_million,
      population_density: +d.population_density,
      new_cases: +d.new_cases_smoothed_per_million || 0,
      new_deaths: +d.new_deaths_smoothed_per_million || 0,
      stringency_index: +d.stringency_index || 0,
    };
  });

  var dataForVaccineAndBooster = d3.map(covidData, function (d) {
    var parseDate = d3.timeParse("%Y-%m-%d");
    return {
      date: parseDate(d.date),
      country: fetchCountryByCode.get(d.iso_code),
      total_vaccinations: d.total_vaccinations,
      total_boosters: d.total_boosters,
      total_cases: d.total_cases,
      total_deaths: d.total_deaths,
    };
  });

  var sumOfTotalCasesPerDate = d3.rollup(
    dataForVaccineAndBooster,
    (v) => d3.sum(v, (d) => +d.total_cases),
    (d) => d.date
  );

  var totalCases = d3.max(sumOfTotalCasesPerDate, (d) => d[1]);

  var sumOfTotalDeathsPerDate = d3.rollup(
    dataForVaccineAndBooster,
    (v) => d3.sum(v, (d) => +d.total_deaths),
    (d) => d.date
  );
  var totalDeaths = d3.max(sumOfTotalDeathsPerDate, (d) => d[1]);

  var sumOfTotalVaccinationsPerDate = d3.rollup(
    dataForVaccineAndBooster,
    (v) => d3.sum(v, (d) => +d.total_vaccinations),
    (d) => d.date
  );

  var totalVaccinations = d3.max(sumOfTotalVaccinationsPerDate, (d) => d[1]);

  var sumOfTotalBoostersPerDate = d3.rollup(
    dataForVaccineAndBooster,
    (v) => d3.sum(v, (d) => +d.total_boosters),
    (d) => d.date
  );

  var totalBoosters = d3.max(sumOfTotalBoostersPerDate, (d) => d[1]);

  var convertToMapSumOfTotalCasesPerDate = d3.map(
    sumOfTotalCasesPerDate,
    function (d) {
      return {
        date: d[0],
        total_cases: d[1],
      };
    }
  );

  var convertToMapSumOfTotalDeathsPerDate = d3.map(
    sumOfTotalDeathsPerDate,
    function (d) {
      return {
        date: d[0],
        total_deaths: d[1],
      };
    }
  );
  var convertToMapSumOfTotalVaccinationsPerDate = d3.map(
    sumOfTotalVaccinationsPerDate,
    function (d) {
      return {
        date: d[0],
        total_vaccinations: d[1],
      };
    }
  );
  var convertToMapSumOfTotalBoostersPerDate = d3.map(
    sumOfTotalBoostersPerDate,
    function (d) {
      return {
        date: d[0],
        total_boosters: d[1],
      };
    }
  );

  //this is later used in the stacked area chart
  var casesByContinentsAndDate = d3.map(
    casesGroupedByDateAndContinent,
    function (d) {
      if (d[0].match(/-(\d{2})$/)[1] == "24")
        // returns data on the 24th of each month
        return {
          date: d[0],
          Africa: d[1].get("Africa") || 0,
          Oceania: d[1].get("Oceania") || 0,
          SouthAmerica: d[1].get("South America") || 0,
          NorthAmerica: d[1].get("North America") || 0,
          Asia: d[1].get("Asia") || 0,
          Europe: d[1].get("Europe") || 0,
        };
    }
  );

  casesByContinentsAndDate = casesByContinentsAndDate.filter(function (d) {
    return d !== undefined;
  });
  casesByContinent = new Map([...casesByContinent.entries()].sort());

  //drawing the map

  var svgMainMap = d3.select("#mainMap");
  var mainMapWidth = window.innerWidth;
  var height = window.innerHeight / 2;

  //Projection is used to project the map onto the screen using raw data.

  var projection = d3
    .geoMercator()
    .scale(mainMapWidth / 4 / Math.PI)
    .center([0, 20])
    .translate([mainMapWidth / 3.5, height / 1.35]);

  //Projection converts lat & long -> x & y coordinates.
  //GeoPath generates an SVG path data string

  svgMainMap
    .append("g")
    .attr("id", "map")
    .selectAll("path")
    .data(geoData.features)
    .enter()
    .append("path")
    .attr("d", d3.geoPath().projection(projection))
    .style("fill", "black")
    .style("stroke", "white")
    .style("opacity", 0.2);

  // zooming capabilities
  var zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", handleZoom);
  d3.select("#lockButton").on("click", function (d) {
    d3.select("#brushButton").classed("highlightButton", false);
    d3.select("#lockButton").classed("highlightButton", true);
    d3.select("#lockButton")
      .style("scale", "1.5")
      .transition()
      .duration(200)
      .style("scale", "1");

    //enabling zoom
    svgMainMap.call(zoom);
    //drawing circles without brushing [brushing is disabled by default]
    var circleRange = [2, 50];
    var circleRadius = d3
      .scaleSqrt()
      .domain(minAndMaxCountry)
      .range(circleRange);

    //need to remove hightlight from continent bars
    var continentsBars = Array.from(fetchContinents);

    for (let index = 0; index < continentsBars.length; index++) {
      var eachContinent = continentsBars[index].replace(/\s+/g, "").trim();
      console.log(eachContinent);
      d3.selectAll("." + eachContinent).classed("highlight", false);
    }
    svgMainMap.select(".brush").remove();
    drawCircle(circleRadius, false);
  });

  d3.select("#brushButton").on("click", function (d) {
    d3.select("#lockButton").classed("highlightButton", false);
    d3.select("#brushButton").classed("highlightButton", true);
    d3.select("#brushButton")
      .style("scale", "1.5")
      .transition()
      .duration(200)
      .style("scale", "1");

    //disabling zoom
    svgMainMap.call(zoom.transform, d3.zoomIdentity);
    svgMainMap.on(".zoom", null);
    //drawing circles again with brushing
    var circleRange = [2, 50];
    var circleRadius = d3
      .scaleSqrt()
      .domain(minAndMaxCountry)
      .range(circleRange);

    drawCircle(circleRadius, true);
  });

  d3.select("#disableButton").on("click", function (d) {
    d3.select("#lockButton").classed("highlightButton", false);
    d3.select("#brushButton").classed("highlightButton", false);
    d3.select("#disableButton")
      .style("scale", "1.5")
      .transition()
      .duration(200)
      .style("scale", "1");
    //disabling zoom
    svgMainMap.call(zoom.transform, d3.zoomIdentity);
    svgMainMap.on(".zoom", null);
    //drawing circles without brushing [brushing is disabled by default]
    var circleRange = [2, 50];
    var circleRadius = d3
      .scaleSqrt()
      .domain(minAndMaxCountry)
      .range(circleRange);

    //need to remove hightlight from continent bars
    var continentsBars = Array.from(fetchContinents);

    for (let index = 0; index < continentsBars.length; index++) {
      var eachContinent = continentsBars[index].replace(/\s+/g, "").trim();
      console.log(eachContinent);
      d3.selectAll("." + eachContinent).classed("highlight", false);
    }

    svgMainMap.select(".brush").remove();
    drawCircle(circleRadius, false);
  });

  function handleZoom(event) {
    const { transform } = event;
    var gMap = svgMainMap.select("#map");
    gMap.attr("transform", transform);
    var gCircle = svgMainMap.select("#circleG");
    gCircle.attr("transform", transform);

    if (transform.k > 1.8 && transform.k < 2.2) {
      var circleRange = [2, 8];
      var circleRadius = d3
        .scaleSqrt()
        .domain(minAndMaxCountry)
        .range(circleRange);

      drawCircle(circleRadius, false);
    }
    if (transform.k > 1.4 && transform.k < 1.5) {
      var circleRange = [2, 50];
      var circleRadius = d3
        .scaleSqrt()
        .domain(minAndMaxCountry)
        .range(circleRange);

      drawCircle(circleRadius, false);
    }
  }

  //minAndMax is the minimum and maximum values of the total_cases column irrespective of country.

  var minAndMaxCountry = d3.extent(casesByCountry.values());
  var minAndMaxContinent = d3.extent(casesByContinent.values());

  // adding scales to identify big and small covid 19 impacted countries.
  // circleRadius is used so that the huge numbers in total_cases can be shrunk down and scaled from a range of 1 to 10.

  var circleRange = [2, 50];
  var circleRadius = d3
    .scaleSqrt()
    .domain(minAndMaxCountry)
    .range(circleRange);

  //color is added using continentToColorScale
  var continentToColorScale = d3
    .scaleOrdinal()
    .domain(fetchContinents)
    .range(["green", "steelblue", "black", "orange", "purple", "pink"]);

  //drawing circles on map
  svgMainMap.append("g").attr("id", "circleG");

  //tooltip
  var mainMapDiv = d3.select("#divMapAndBar");
  mainMapDiv
    .append("div")
    .attr("id", "toolTip")
    .style("position", "absolute")
    .classed("toolTip", true)
    .style("visibility", "hidden")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .html(
      '<p id="countryTip"></p><svg id="svgToolTip" width=100 height=140 class="countryTip"></svg><br><svg width="10" \
      height="10"><rect width="300" height="100" style="fill:red" /></svg> Covid Cases -> <p id="cases"></p><br><svg width="10" height="10">\
      <rect width="300" height="100" style="fill:orange" /></svg> Covid Deaths -> <p id="deaths"></p><br><svg width="10" height="10"><rect width="300" \
      height="100" style="fill:lightgrey" /></svg> Population Unaffected -> <p id="unaffected"></p>'
    );

  var circles = drawCircle(circleRadius, false);
  function drawCircle(circleRadius, brushing) {
    svgCircleG = svgMainMap;
    var circles = svgMainMap
      .select("#circleG")
      .selectAll("circle")
      .data(geoData.features, function (d) {
        return d.id;
      });

    circles.exit().remove();

    var circleUpdate = circles
      .enter()
      .append("circle")
      .merge(circles)
      .attr("id", (d) => fetchCountryByCode.get(d.id))
      .attr("cx", (d) => projection(d3.geoPath().centroid(d.geometry))[0])
      .attr("cy", (d) => projection(d3.geoPath().centroid(d.geometry))[1])
      .attr("r", (d) => circleRadius(casesByCountry.get(d.id)))
      .attr("fill", (d) =>
        continentToColorScale(fetchContinentByCountry.get(d.id))
      )
      .attr("class", function (d) {
        var continent = String(fetchContinentByCountry.get(d.id))
          .replace(/\s+/g, "")
          .trim();
        var casePercentage =
          (circleRadius(casesByCountry.get(d.id)) / circleRange[1]) * 100;
        if (casePercentage > 60)
          return "highlightHighCaseCountries " + continent;
        else return continent;
      })
      .style("opacity", "0.8")
      .style("transition", "0.4s")
      .on("mouseover", function (d) {
        
        // addToolTipMap();
        onMouseOver(this);
      })
      .on("mouseout", function (d) {
        onMouseOut(this);
      })
      .on("click", function (d) {
        // addToolTipMap();
        onMouseClick(this);
      })
      .on("mousemove", function () {
        //tool tip move
        addToolTipMap();

        var divNodeMap = svgMainMap.node(); // get the DOM node of the selected div
        var rectMap = divNodeMap.getBoundingClientRect(); // get the size and position of the div relative to the viewport
        var topMap = rectMap.top + window.scrollY; // add the current scroll position to get the top screen coordinate
        var leftMap = rectMap.left + window.scrollX; // add the current scroll position to get the left screen coordinate

        var toolTip = d3
          .select("#toolTip")
          .style("top", event.pageY - topMap + 15+ "px")
          .style("left", event.pageX - leftMap + 15 + "px");

        // var toolTip = d3
        //   .select("#toolTip")
        //   .style("top", event.pageY - 1190 + "px")
        //   .style("left", event.pageX - 260 + "px");

        var currentMovingCountry = d3.select(this).attr("id");
        toolTip.select("p").text(currentMovingCountry);
        var svgToolTip = d3.select("#svgToolTip");
        const svgToolTipWidth = +svgToolTip.attr("width");
        const svgToolTipHeight = +svgToolTip.attr("height");

        // This is the D3 Margin Convention.
        var margin = { top: 65, right: 50, bottom: 20, left: 105 };
        var innerWidth = svgToolTipWidth - margin.left - margin.right; //this is the width of the barchart
        var innerHeight = svgToolTipHeight - margin.top - margin.bottom; // this is the height of the barchart

        // append the svg object to the body of the page
        var svg = svgToolTip
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

        var totalCasesOfCountry =
          casesByCountryName.get(currentMovingCountry);
        var totalDeathsOfCountry =
          deathsByCountryName.get(currentMovingCountry);
        var totalPopulationOfCountry =
          popByCountryName.get(currentMovingCountry);

        var percOfTotalCasesOfCountry =
          (totalCasesOfCountry / totalPopulationOfCountry) * 100;
        var percOfTotalDeathsOfCountry =
          (totalDeathsOfCountry / totalPopulationOfCountry) * 100;
        var remainingPerc = 100 - percOfTotalCasesOfCountry;
        const color = d3.scaleOrdinal().range(["red", "lightgrey"]);

        d3.select("#cases").text(
          Math.round(percOfTotalCasesOfCountry * 100) / 100 + "%"
        );
        d3.select("#deaths").text(
          Math.round(percOfTotalDeathsOfCountry * 100) / 100 + "%"
        );
        d3.select("#unaffected").text(
          Math.round(remainingPerc * 100) / 100 + "%"
        );
        drawPieChart(
          svg,
          {
            a: percOfTotalCasesOfCountry,
            c: remainingPerc,
          },
          "toolTip",
          innerHeight,
          innerWidth,
          color
        );
      });

    circleUpdate.merge(circles);

    if (brushing) {
      // Add brushing
      var width = svgMainMap.attr("width");
      var height = svgMainMap.attr("height");
      svgMainMap
        .append("g")
        .classed("brush", true)
        .call(
          d3
            .brush() // Add the brush feature using the d3.brush function
            .extent([
              [0, 0],
              [width, height],
            ]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
            .on("start brush", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function
            .on("end", brushEnded)
        );

      // Function that is triggered when brushing is performed
      function updateChart() {
        extent = d3.brushSelection(this);

        circleUpdate.classed("highlight", function () {
          return isBrushed(
            extent,
            parseFloat(d3.select(this).attr("cx")),
            parseFloat(
              d3.select(this).attr("cy"),
              String(d3.select(this).attr("id"))
            )
          );
        });
      }

      var selectedContinents = [];
      // A function that return TRUE or FALSE according if a dot is in the selection or not
      function isBrushed(brush_coords, cx, cy, thisSelection) {
        var x0 = brush_coords[0][0],
          x1 = brush_coords[1][0],
          y0 = brush_coords[0][1],
          y1 = brush_coords[1][1];
        var arrayFetchContinents = Array.from(fetchContinents);
        if (x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1) {
          var selectContinent = d3
            .select(`circle[cx="${cx}"][cy="${cy}"]`)
            .attr("class");
          var reg = /\w+$/;
          selectingContinentFromCSS = String(selectContinent.match(reg));

          if (selectingContinentFromCSS != "highlight") {
            selectedContinents.push(selectingContinentFromCSS);
            d3.select("#" + selectingContinentFromCSS).classed(
              "highlight",
              true
            );
          }
        }
        return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1; // This return TRUE or FALSE depending on if the points is in the selected area
      }

      function brushEnded() {
        var selection = d3.brushSelection(this);
        if (!selection) {
          console.log("brush end");
          for (let index = 0; index < selectedContinents.length; index++) {
            d3.selectAll("." + selectedContinents[index]).classed(
              "highlight",
              false
            );
          }
        }
      }
    }
    return circles;
  }
  //adding legend to map

  maxCases = d3.max(casesByCountry.values());
  minCases = d3.min(casesByCountry.values());
  meanCases = d3.mean(casesByCountry.values());
  var valueExtent = d3.extent(casesByCountry.values(), function (d) {
    return d;
  });
  var size = d3
    .scaleSqrt()
    .domain(valueExtent) // What's in the data
    .range(circleRange); // Size in pixel
  // Add legend: circles
  var valuesToShow = [minCases, meanCases, maxCases];
  var xCircle = 75;
  var xLabel = 135;
  var legendHeight = 140;
  svgMainMap
    .selectAll("legend")
    .data(valuesToShow)
    .enter()
    .append("circle")
    .attr("cx", xCircle)
    .attr("cy", function (d) {
      return height - size(d) + legendHeight;
    })
    .attr("r", function (d) {
      return size(d);
    })
    .style("fill", "none")
    .attr("stroke", "black");

  // Add legend: segments
  svgMainMap
    .selectAll("legend")
    .data(valuesToShow)
    .enter()
    .append("line")
    .attr("x1", function (d) {
      return xCircle + size(d);
    })
    .attr("x2", xLabel - 3)
    .attr("y1", function (d) {
      return height - size(d) + legendHeight;
    })
    .attr("y2", function (d) {
      return height - size(d) + legendHeight;
    })
    .attr("stroke", "black")
    .style("stroke-dasharray", "2,2");

  // Add legend: labels
  svgMainMap
    .selectAll("legend")
    .data(valuesToShow)
    .enter()
    .append("text")
    .attr("x", xLabel)
    .attr("y", function (d) {
      return height - size(d) + legendHeight;
    })
    .text(function (d) {
      return (d / 1000000).toFixed(2) + " Million";
    })
    .style("font-size", 10)
    .attr("alignment-baseline", "middle");

  //creating tool tip
  var selectingContinentFromCSS;
  var countriesOtherThanSelection = [];

  circles.on("mouseover", function (d) {
    onMouseOver(this);
  });

  circles.on("mouseout", function (d) {
    // onMouseOut();
  });

  circles.on("click", function (d) {
    // onMouseClick(this);
  });

  function addToolTipMap() {
    d3.select("#toolTip").style("visibility", "visible");
  }
  function removeToolTipMap() {
    d3.select("#toolTip").style("visibility", "hidden");
  }

  //HIGHLIGHTS THE CONTINENTS AND ITS COUNTRIES SHOWN ON THE PAGE
  //THIS FUNCTION IS CALLED LATER ON IN THREE VISUALISATIONS - MAP, BAR CHART, AND STACKED AREA CHART.

  function onMouseOver(thisSelection) {
    addToolTipMap()
    var continent = d3.select(thisSelection).attr("class"); //selecting the class on hover
    var reg = /\w+$/;
    selectingContinentFromCSS = String(continent.match(reg)); //CSS contains multiple classes, hence just using continent wont work, so implemented code to fetch last css class which would be continent name of the circle and add or remove classes accordingly

    //other .continent classes should have another class to change opacity to .2
    var arrayFetchContinents = Array.from(fetchContinents); //we need to check continents (without spaces, hence used fetchContinents instead of selectingContinentFromCSS)

    for (let index = 0; index < arrayFetchContinents.length; index++) {
      var eachOtherContinent = arrayFetchContinents[index]
        .split(" ")
        .join("");
      countriesOtherThanSelection.push(eachOtherContinent);
      if (eachOtherContinent != selectingContinentFromCSS) {
        //console.log(eachOtherContinent);
        d3.selectAll("." + eachOtherContinent).style("opacity", "0.1");
      }
    }
    d3.selectAll("." + selectingContinentFromCSS).classed("highlight", true);
  }

  //REMOVES THE HIGHLIGHT CLASS
  function onMouseOut() {
    removeToolTipMap();
    d3.selectAll("." + selectingContinentFromCSS).classed("highlight", false);
    for (let index = 0; index < countriesOtherThanSelection.length; index++) {
      const eachCountryToNormaliseStyle = countriesOtherThanSelection[index];
      d3.selectAll("." + eachCountryToNormaliseStyle).style("opacity", ".8");
    }
    countriesOtherThanSelection = [];
  }

  function onMouseClick(thisSelection) {
    d3.selectAll("circle").classed("highlight", false);
    d3.select(thisSelection).classed("highlight", true);
  }

  //BAR CHART CODE
  //THE BELOW FUNCTIONS OF BAR CHART ARE TO BE USED LATER WITH OTHER DATA

  //INITIALISING HORIZONTAL BAR CHART

  function initializeHorizontalBarChart(
    innerWidth,
    innerHeight,
    xAxisMax,
    yAxisDomain,
    barChartDimension,
    xScaleType
  ) {
    //adding scales
    //adding xScale -> Scale Linear -> used to show data
    var xScale;
    if (xScaleType == "linear") {
      xScale = d3.scaleLinear().domain([0, xAxisMax]).range([0, innerWidth]);
    } else if (xScaleType == "log") {
      xScale = d3.scaleLog().domain([1, xAxisMax]).range([0, innerWidth]);
    }

    //adding yScale -> Scale Band -> used to separate barChart according to range
    var yScale = d3
      .scaleBand()
      .domain(yAxisDomain)
      .range([0, innerHeight])
      .padding(0.2);

    //adding axes
    var yAxis = d3.axisLeft(yScale);
    var xAxis = d3.axisBottom(xScale);

    var barChart = barChartDimension
      .append("g")
      .attr(
        "transform",
        "translate(+" + margin.left + "," + margin.top + ")"
      );

    barChart.append("g").call(yAxis).attr("class", "yAxis");
    barChart
      .append("g")
      .call(xAxis)
      .attr("class", "xAxis")
      .attr("transform", "translate(0," + innerHeight + ")")
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

    return [barChart, xScale, yScale];
  }

  //ADDING AND UPDATE FUNCTION FOR BAR CHART
  function updateHorizontalBarChart(
    barChart,
    xScale,
    yScale,
    data,
    innerHeight,
    innerWidth,
    margin,
    yAxisLabel,
    xAxisLabel,
    xAxisPos,
    yAxisPos
  ) {
    var update = barChart.select("g").selectAll("rect").data(data);
    var yAxis = d3.axisLeft(yScale);
    var xAxis = d3.axisBottom(xScale);

    if (xAxisLabel != "" && yAxisLabel != "") {
      //X axis label
      barChart
        .append("text")
        .attr("text-anchor", "end")
        .attr("class", ".xAxis")
        .attr("id", xAxisLabel.replace(/\s+/g, "").trim())
        .attr("x", innerWidth / xAxisPos[0] + margin.left)
        .attr("y", innerHeight + margin.top + xAxisPos[1])
        .text(xAxisLabel);

      // Y axis label:
      barChart
        .append("text")
        .attr("text-anchor", "end")
        .attr("class", ".yAxis")
        .attr("transform", "rotate(-90)")
        .attr("id", yAxisLabel.replace(/\s+/g, "").trim())
        .attr("y", -margin.left + yAxisPos[0])
        .attr("x", -margin.top - innerHeight / yAxisPos[1] + yAxisPos[2])
        .text(yAxisLabel);
    }
    barChart.selectAll(".yAxis").transition().duration(500).call(yAxis);
    barChart.selectAll(".xAxis").transition().duration(500).call(xAxis);

    countryToColorScale = d3
      .scaleOrdinal()
      .domain(fetchTwoMaxAndMinCountries(data).keys())
      .range(d3.schemeRdYlBu[numberOfCountries * 2]);

    var bars = update
      .enter()
      .append("rect")
      .merge(update)
      .attr("y", (d) => yScale(d[0]))
      .attr("width", (d) => xScale(d[1]))
      .attr("height", yScale.bandwidth())
      .style("transition", "0.6s")
      .attr("fill", (eachCountry) => countryToColorScale(eachCountry[0]))
      .attr(
        "class",
        (eachCountry) =>
          String(eachCountry[0]) //fetching continents based on country code from geoJSON (existing circles/centroids or center points of countries on the map)
            .replace(/\s+/g, "")
            .trim() //adding class based on country for selection of all countries by continent later.
      )
      .attr(
        "id",
        (eachCountry) =>
          String(eachCountry[0]) //fetching continents based on country code from geoJSON (existing circles/centroids or center points of countries on the map)
            .replace(/\s+/g, "")
            .trim() //adding class based on country for selection of all countries by continent later.
      );

    update.exit().remove();
    console.log(bars);
    return bars;
  }

  //CREATING THE BAR CHART -> INTIALISING IT AND UPDATING IT

  const svgContinentBarChart = d3.select("#continentBarChart");
  const barMapWidth = +svgContinentBarChart.attr("width");
  const barMapHeight = +svgContinentBarChart.attr("height");
  // This is the D3 Margin Convention.
  var margin = { top: 20, right: 180, bottom: 100, left: 130 };
  var innerWidth = barMapWidth - margin.left - margin.right; //this is the width of the barchart
  var innerHeight = barMapHeight - margin.top - margin.bottom; // this is the height of the barchart

  var [barChart, xScale, yScale] = initializeHorizontalBarChart(
    innerWidth,
    innerHeight,
    minAndMaxContinent[1],
    casesByContinent.keys(),

    svgContinentBarChart,
    "linear"
  );
  var bars = updateHorizontalBarChart(
    //continent
    barChart,
    xScale,
    yScale,
    casesByContinent,
    innerHeight,
    innerWidth,
    margin,
    "Continent",
    "Total Cases",
    [7, 55], //x axis
    [30, 2, 60] //y axis
  );

  bars
    .attr("fill", (eachContinent) => continentToColorScale(eachContinent[0]))
    .attr(
      "class",
      (eachContinent) =>
        String(eachContinent[0]) //fetching continents based on country code from geoJSON (existing circles/centroids or center points of countries on the map)
          .replace(/\s+/g, "")
          .trim() //adding class based on country for selection of all countries by continent later.
    );

  bars.on("mouseover", function (d) {
    onMouseOver(this);
  });
  bars.on("mouseout", function (d) {
    onMouseOut(this);
  });

  bars.on("click", function (d) {
    onMouseClick(this);
  });


  //Below code is for the next page: Exploring Inequality and COVID-19


  userSelection = "GDP"; //by default the GDP will be the user selection
  var dataSelected = gdpByCountry; //data is selected
  drawTopBottomCountry(dataSelected); //data is passed
  drawCasesDeathsLineChart(dataSelected); //data is passed

  //the scatter plot uses ONLY data for GDP
  drawScatterPlot(); //drawing a scatter plot based on analysis

  d3.select("#populationDensity").classed("highlightButton", false);
  d3.select("#gdp").classed("highlightButton", true);

  // on mouse click get value of clicked button.
  d3.select("#gdp").on("click", function (d) {
    userSelection = "GDP";
    d3.select("#populationDensity").classed("highlightButton", false);
    d3.select("#gdp").classed("highlightButton", true);

    userSelectionCheck(); // this is done to execute a set of statements to redraw visualisations.
  });
  d3.select("#populationDensity").on("click", function (d) {
    userSelection = "Population Density";
    d3.select("#gdp").classed("highlightButton", false);
    d3.select("#populationDensity").classed("highlightButton", true);

    userSelectionCheck(); // this is done to execute a set of statements to redraw visualisations.
  });

  // GDP AND POPULATION COMPARISON BAR CHART

  function topBottomCountryChartUpdate(dataSelected) {
    const selectTopBottomCountry = d3.select("#selectTopBottomCountry");
    const barTopCountryWidth = +selectTopBottomCountry.attr("width");
    const barTopCountryHeight = +selectTopBottomCountry.attr("height");
    // This is the D3 Margin Convention.
    margin = { top: 40, right: 70, bottom: 100, left: 150 };
    innerWidth = barTopCountryWidth - margin.left - margin.right; //this is the width of the barchart
    innerHeight = barTopCountryHeight - margin.top - margin.bottom; // this is the height of the barcha
    var barChartSelected = d3.select("#selectTopBottomCountry");
    var countriesSelected = fetchTwoMaxAndMinCountries(dataSelected);
    var max = Array.from(countriesSelected).slice(1);

    var xScale = d3.scaleLog().domain([1, max[0][1]]).range([0, innerWidth]);

    var yScale = d3
      .scaleBand()
      .domain(countriesSelected.keys())
      .range([0, innerHeight])
      .padding(0.2);

    //updating x axis label for user data sort selection
    barChartSelected
      .select("#PopulationDensity")
      .data(userSelection)
      .transition()
      .duration(10000)
      .text(userSelection);
    barChartSelected
      .select("#GDP")
      .data(userSelection)
      .transition()
      .duration(1000)
      .text(userSelection);

    barsTopBottom = updateHorizontalBarChart(
      //top bottom update
      barChartSelected,
      xScale,
      yScale,
      countriesSelected,
      innerHeight,
      innerWidth,
      margin,
      "",
      "",
      [5, 20], //x Axis    [a[0] -> is x , a[1] -> is y]
      [30, 2, 10] //y Axis
    );
  }

  function userSelectionCheck() {
    if (userSelection == "GDP") {
      var dataSelected = gdpByCountry; //data is selected

      d3.select("#dataSelectChartName").text(
        "COVID-19 Cases vs GDP for Top and Bottom Countries"
      );

      topBottomCountryChartUpdate(dataSelected);
      casesDeathsLineChartUpdate(dataSelected);
    } else if (userSelection == "Population Density") {
      var dataSelected = popDenByCountry; //data is selected
      d3.select("#dataSelectChartName").text(
        "COVID-19 Cases vs Population Density for Top and Bottom Countries"
      );
      topBottomCountryChartUpdate(dataSelected);
      casesDeathsLineChartUpdate(dataSelected);
    }
  }

  function drawScatterPlot() {
    //fetches all countries
    dataOfSelectedCountries = dataByCountryAndDate;
    const selectCluster = d3.select("#clusterPlot");
    const clusterWidth = +selectCluster.attr("width");
    const clusterHeight = +selectCluster.attr("height");
    // This is the D3 Margin Convention.
    margin = { top: 40, right: 70, bottom: 100, left: 150 };
    innerWidth = clusterWidth - margin.left - margin.right; //this is the width of the barchart
    innerHeight = clusterHeight - margin.top - margin.bottom; // this is the height of the barchart

    var [clusterPlot, xScale, yScale] = initialiseScatterPlot(
      innerWidth,
      innerHeight,
      selectCluster,
      margin
    );

    updateScatterPlot(
      innerWidth,
      innerHeight,
      dataOfSelectedCountries,
      clusterPlot,
      xScale,
      yScale,
      "Covid Case",
      "GDP"
    );
  }

  //initialising plot
  function initialiseScatterPlot(
    innerWidth,
    innerHeight,
    svgDimension,
    margin
  ) {
    var svg = svgDimension
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().range([0, innerWidth]);
    const yScale = d3.scaleLinear().range([innerHeight, 0]);
    svg.append("g").attr("class", "y-axis");
    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${innerHeight})`);

    return [svg, xScale, yScale];
  }
  function updateScatterPlot(
    innerWidth,
    innerHeight,
    data,
    svgCluster,
    xScale,
    yScale,
    xAxisLabel,
    yAxisLabel
  ) {
    // dataSelected has the whole country dataset includes gdp and pop and cases and death

    console.log("calling");

    // group the data by country
    const dataByCountry = d3.group(data, (d) => d.country);

    // calculate the maximum value of gdp_per_capita and population_density for each country
    var maxValuesByCountry = [];
    dataByCountry.forEach((values, key) => {
      const maxGDP = d3.max(values, (d) => d.gdp_per_capita);
      const maxTotalCases = d3.max(values, (d) => d.total_cases);
      const maxPopDensity = d3.max(values, (d) => d.population_density);
      maxValuesByCountry.push({
        country: key,
        maxGDP: maxGDP,
        maxTotalCases: maxTotalCases,
        maxPopDensity: maxPopDensity,
      });
    });

    console.log(maxValuesByCountry);
    maxValuesByCountry = maxValuesByCountry.filter(
      (d) => d.maxGDP !== 0 && d.maxTotalCases !== 0 && d.maxPopDensity !== 0
    );

    const maxGDPs = maxValuesByCountry.map((d) => d.maxGDP);
    const maxGDPAllCountries = d3.max(maxGDPs);
    console.log(maxGDPAllCountries);

    const maxTotalCases = maxValuesByCountry.map((d) => d.maxTotalCases);
    const maxTotalCasesAllCountries = d3.max(maxTotalCases);
    console.log(maxTotalCasesAllCountries);

    svgCluster
      .append("text")
      .attr("text-anchor", "end")
      .attr("x", innerWidth / 4 + margin.left)
      .attr("y", innerHeight + margin.top + 10)
      .text(xAxisLabel);

    // Y axis label:
    svgCluster
      .append("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 90)
      .attr("x", -margin.top - innerHeight / 2 + 115)
      .text(yAxisLabel);

    xScale.domain([0, maxTotalCasesAllCountries]);
    yScale.domain([0, maxGDPAllCountries]);

    svgCluster
      .select(".x-axis")
      .transition()
      .duration(500)
      .call(d3.axisBottom(xScale).ticks(4));

    svgCluster
      .select(".y-axis")
      .transition()
      .duration(500)
      .call(d3.axisLeft(yScale));

    // create scatter plot
    const circles = svgCluster
      .selectAll("circle")
      .data(maxValuesByCountry)
      .enter()
      .append("circle")
      .attr("id", (d) => d.country)
      .attr("cx", (d) => xScale(d.maxTotalCases))
      .attr("cy", (d) => yScale(d.maxGDP))
      .attr("r", 5)
      .style("fill", "green")
      .on("mouseover", function (d) {
        console.log("mouseover");
        d3.select(this).classed("highlight", true);
        var Country = d3.select(this).attr("id");
        d3.select(this).append("title").text(Country);
      })
      .on("mouseout", function () {
        d3.select(this).classed("highlight", false);
      });

    // create the points
    const points = maxValuesByCountry.map((d) => [d.maxGDP, d.maxTotalCases]);

    var clusterButton = d3.select("#clusterButton");
    clusterButton.on("click", function () {
      console.log("clicked!");
      kmeanIterate();
    });

    iteration = 0;
    let k = 2; // number of clusters

    // initialize centroids randomly
    let centroids = Array.from({ length: k }, () => [
      Math.random() * d3.max(points, (d) => d[0]),
      Math.random() * d3.max(points, (d) => d[1]),
    ]);

    // update function to calculate k-mean step
    function kmeanIterate() {
      iteration++;

      // assigned each point to the nearest centroid
      for (let i = 0; i < points.length; i++) {
        let d = Math.sqrt(
          Math.pow(points[i][0] - centroids[0][0], 2) +
            Math.pow(points[i][1] - centroids[0][1], 2)
        );
        points[i][2] = 0; // nearest

        for (let j = 1; j < k; j++) {
          let dn = Math.sqrt(
            Math.pow(points[i][0] - centroids[j][0], 2) +
              Math.pow(points[i][1] - centroids[j][1], 2)
          );
          if (dn < d) {
            d = dn;
            points[i][2] = j;
          }
        }
      }

      // update centroids
      for (let j = 0; j < k; j++) {
        let dsumX = 0;
        let dsumY = 0;
        let dcount = 0;
        for (let i = 0; i < points.length; i++) {
          if (points[i][2] === j) {
            dsumX += points[i][0];
            dsumY += points[i][1];
            dcount++;
          }
        }
        if (dcount > 0) {
          centroids[j][0] = dsumX / dcount;
          centroids[j][1] = dsumY / dcount;
        }
      }

      // update circle colors
      svgCluster
        .selectAll("circle")
        .data(points)
        .style("fill", (d) => {
          return ["red", "blue"][d[2]];
        });

      document.getElementById(
        "clusterButton"
      ).innerHTML = `Iteration Step (${iteration})`;
    } // end kmeanIterate()
  }

  //THIS FUNCTION IS USED TO DRAW THE TOP BOTTOM COUNTRY BAR CHART ACCORDIDNG TO INEQUALITY SELECTED.

  function drawTopBottomCountry(dataSelected) {
    countriesSelected = fetchTwoMaxAndMinCountries(dataSelected);
    var max = Array.from(countriesSelected).slice(1);

    const selectTopBottomCountry = d3.select("#selectTopBottomCountry");
    const barTopCountryWidth = +selectTopBottomCountry.attr("width");
    const barTopCountryHeight = +selectTopBottomCountry.attr("height");
    // This is the D3 Margin Convention.
    margin = { top: 40, right: 70, bottom: 100, left: 150 };
    innerWidth = barTopCountryWidth - margin.left - margin.right; //this is the width of the barchart
    innerHeight = barTopCountryHeight - margin.top - margin.bottom; // this is the height of the barchart

    var [barChart, xScale, yScale] = initializeHorizontalBarChart(
      innerWidth,
      innerHeight,
      max[0][1],
      countriesSelected.keys(),

      selectTopBottomCountry,
      "log"
    );

    var barsOfTopBottom = updateHorizontalBarChart(
      //drawing for first time
      barChart,
      xScale,
      yScale,
      countriesSelected,
      innerHeight,
      innerWidth,
      margin,
      "Country",
      userSelection,
      [10, 10], //x Axis    [a[0] -> is x , a[1] -> is y]
      [30, 1.5, 110] //y Axis   a[0] -> , a[1] ->y
    );
  }

  //THE FUNCTION BELOW UPDATES THE LINE CHART FOR CASES, DEATHS, STRINGENCY INDEX. THESE ARE SEPERATE LINE CHARTS.
  //FOR EXAMPLE, LINE CHART FOR SELECTED COUNTRIES WHICH SHOWS THE COVID CASES.

  function casesDeathsLineChartUpdate(dataSelected) {
    var countriesSelected = fetchTwoMaxAndMinCountries(dataSelected);
    arrayOfSelectedCountries = Array.from(countriesSelected.keys());
    dataOfSelectedCountries = dataByCountryAndDate.filter((d) =>
      arrayOfSelectedCountries.includes(d.country)
    );

    //newCaseLine
    const selectnewCaseLine = d3.select("#newCaseLine");
    var newCaseLineWidth = +selectnewCaseLine.attr("width");
    var newCaseLineHeight = +selectnewCaseLine.attr("height");
    // This is the D3 Margin Convention.
    var margin = { top: 20, right: 160, bottom: 100, left: 60 };
    var innerWidth = newCaseLineWidth - margin.left - margin.right; //this is the width of the barchart
    var innerHeight = newCaseLineHeight - margin.top - margin.bottom; // this is the height of the barchart

    //xScale
    var xScaleLineChart = d3.scaleTime().range([0, innerWidth]);
    //yScale
    var yScaleLineChart = d3.scaleLinear().range([innerHeight, 0]);

    updateLineChart(
      innerWidth,
      innerHeight,
      dataOfSelectedCountries,
      "new_cases",
      selectnewCaseLine,
      xScaleLineChart,
      yScaleLineChart,
      "",
      ""
    );

    const selectnewDeathsLine = d3.select("#newDeathLine");
    var newDeathsLineWidth = +selectnewDeathsLine.attr("width");
    var newDeathsLineHeight = +selectnewDeathsLine.attr("height");
    // This is the D3 Margin Convention.
    var margin = { top: 20, right: 160, bottom: 100, left: 60 };
    var innerWidth = newCaseLineWidth - margin.left - margin.right; //this is the width of the barchart
    var innerHeight = newCaseLineHeight - margin.top - margin.bottom; // this is the height of the barchart

    //xScale
    var xScaleLineChart = d3.scaleTime().range([0, innerWidth]);
    //yScale
    var yScaleLineChart = d3.scaleLinear().range([innerHeight, 0]);

    var caseslines = updateLineChart(
      innerWidth,
      innerHeight,
      dataOfSelectedCountries,
      "new_deaths",
      selectnewDeathsLine,
      xScaleLineChart,
      yScaleLineChart,
      "",
      ""
    );

    const selectStringencyLine = d3.select("#stringencyLine");
    var stringnecyLineWidth = +selectStringencyLine.attr("width");
    var stringnecyLineHeight = +selectStringencyLine.attr("height");
    // This is the D3 Margin Convention.
    var margin = { top: 20, right: 160, bottom: 100, left: 60 };
    var innerWidth = stringnecyLineWidth - margin.left - margin.right; //this is the width of the barchart
    var innerHeight = stringnecyLineHeight - margin.top - margin.bottom; // this is the height of the barchart

    //xScale
    var xScaleLineChart = d3.scaleTime().range([0, innerWidth]);
    //yScale
    var yScaleLineChart = d3.scaleLinear().range([innerHeight, 0]);

    var caseslines = updateLineChart(
      innerWidth,
      innerHeight,
      dataOfSelectedCountries,
      "stringency_index",
      selectStringencyLine,
      xScaleLineChart,
      yScaleLineChart,
      "",
      ""
    );
  }

  //THE FUNCTION BELOW INTIALLY CREATES THE LINE CHARTS BASED ON INEQUALITY

  function drawCasesDeathsLineChart(dataSelected) {
    var countriesSelected = fetchTwoMaxAndMinCountries(dataSelected);
    arrayOfSelectedCountries = Array.from(countriesSelected.keys());
    dataOfSelectedCountries = dataByCountryAndDate.filter((d) =>
      arrayOfSelectedCountries.includes(d.country)
    );

    // //newCaseLine
    const selectnewCaseLine = d3.select("#newCaseLine");
    const newCaseLineWidth = +selectnewCaseLine.attr("width");
    const newCaseLineHeight = +selectnewCaseLine.attr("height");
    // This is the D3 Margin Convention.
    var margin = { top: 20, right: 160, bottom: 100, left: 60 };
    var innerWidth = newCaseLineWidth - margin.left - margin.right; //this is the width of the barchart
    var innerHeight = newCaseLineHeight - margin.top - margin.bottom; // this is the height of the barchart

    var [lineChart, xScale, yScale] = initialiseLineChart(
      innerWidth,
      innerHeight,
      selectnewCaseLine
    );

    var lines = updateLineChart(
      innerWidth,
      innerHeight,
      dataOfSelectedCountries,
      "new_cases",
      lineChart,
      xScale,
      yScale,
      "Time",
      "New Cases Per Million"
    );

    //newCaseLine
    const selectnewDeathLine = d3.select("#newDeathLine");
    const newDeathLineWidth = +selectnewDeathLine.attr("width");
    const newDeathLineHeight = +selectnewDeathLine.attr("height");
    // This is the D3 Margin Convention.
    var margin = { top: 20, right: 160, bottom: 100, left: 60 };
    innerWidth = newDeathLineWidth - margin.left - margin.right; //this is the width of the barchart
    innerHeight = newDeathLineHeight - margin.top - margin.bottom; // this is the height of the barchart

    var [lineChart, xScale, yScale] = initialiseLineChart(
      innerWidth,
      innerHeight,
      selectnewDeathLine
    );

    var lines = updateLineChart(
      innerWidth,
      innerHeight,
      dataOfSelectedCountries,
      "new_deaths",
      lineChart,
      xScale,
      yScale,
      "Time",
      "New Deaths Per Million"
    );

    //stringency line
    //newCaseLine
    const selectStringencyLine = d3.select("#stringencyLine");
    const stringencyLineWidth = +selectStringencyLine.attr("width");
    const stringencyLineHeight = +selectStringencyLine.attr("height");
    // This is the D3 Margin Convention.
    var margin = { top: 20, right: 160, bottom: 100, left: 60 };
    innerWidth = stringencyLineWidth - margin.left - margin.right; //this is the width of the barchart
    innerHeight = stringencyLineHeight - margin.top - margin.bottom; // this is the height of the barchart

    var [lineChart, xScale, yScale] = initialiseLineChart(
      innerWidth,
      innerHeight,
      selectStringencyLine
    );

    var lines = updateLineChart(
      innerWidth,
      innerHeight,
      dataOfSelectedCountries,
      "stringency_index",
      lineChart,
      xScale,
      yScale,
      "Time",
      "Stringency Index"
    );
  }

  function initialiseLineChart(
    innerWidth,
    innerHeight,
    svgLineChartDimension
  ) {
    // console.log("svgLineChartDimension");
    // console.log(svgLineChartDimension);
    var svgLineChart = svgLineChartDimension
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScaleLineChart = d3.scaleTime().range([0, innerWidth]);

    const yScaleLineChart = d3.scaleLinear().range([innerHeight, 0]);

    svgLineChart
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${innerHeight})`);

    svgLineChart.append("g").attr("class", "y-axis");

    svgLineChart.append("g").attr("class", "lines-container");

    return [svgLineChart, xScaleLineChart, yScaleLineChart];
  }

  function updateLineChart(
    innerWidth,
    innerHeight,
    dataOfSelectedCountries,
    casesOrDeathsOrStringency,
    svgLineChart,
    xScaleLineChart,
    yScaleLineChart,
    xAxisLabel,
    yAxisLabel
  ) {
    const groupByCountry = d3.group(
      dataOfSelectedCountries,
      (d) => d.country
    );

    if (xAxisLabel != "" && yAxisLabel != "") {
      //X axis label
      svgLineChart
        .append("text")
        .attr("text-anchor", "end")
        .attr("x", innerWidth / 4 + margin.left)
        .attr("y", innerHeight + margin.top + 10)
        .text(xAxisLabel);

      // Y axis label:
      svgLineChart
        .append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 90)
        .attr("x", -margin.top - innerHeight / 2 + 115)
        .text(yAxisLabel);
    }
    xScaleLineChart.domain(
      d3.extent(dataOfSelectedCountries, function (d) {
        formatTime = d3.timeParse("%Y-%m-%d");
        return formatTime(d.date);
      })
    );

    if (casesOrDeathsOrStringency === "new_cases")
      var maxCasesOrDeathsOrStringency = d3.max(
        dataOfSelectedCountries,
        function (d) {
          return +d.new_cases;
        }
      );
    else if (casesOrDeathsOrStringency == "new_deaths")
      var maxCasesOrDeathsOrStringency = d3.max(
        dataOfSelectedCountries,
        function (d) {
          return +d.new_deaths;
        }
      );
    else if (casesOrDeathsOrStringency == "stringency_index")
      var maxCasesOrDeathsOrStringency = d3.max(
        dataOfSelectedCountries,
        function (d) {
          return +d.stringency_index;
        }
      );

    yScaleLineChart.domain([0, maxCasesOrDeathsOrStringency]);

    const line = d3
      .line()
      .x(function (d) {
        formatTime = d3.timeParse("%Y-%m-%d");
        return xScaleLineChart(formatTime(d.date));
      })
      .y(function (d) {
        if (casesOrDeathsOrStringency == "new_cases")
          return yScaleLineChart(+d.new_cases);
        else if (casesOrDeathsOrStringency == "new_deaths")
          return yScaleLineChart(+d.new_deaths);
        else if (casesOrDeathsOrStringency == "stringency_index")
          return yScaleLineChart(+d.stringency_index);
      });

    const lines = svgLineChart
      .select(".lines-container")
      .selectAll(".line")
      .data(groupByCountry);

    lines
      .enter()
      .append("path")
      .attr("class", "line")
      .merge(lines)
      .attr("fill", "none")
      .attr("stroke", (d) => countryToColorScale(d[0]))
      .attr("stroke-width", 2.5)
      .attr("id", function (d) {
        console.log(d[0]);
        return String(d[0]).replace(/\s+/g, "").trim();
      })
      .transition()
      .duration(500)
      .attr("d", function (d) {
        return line(d[1]);
      });

    lines.exit().remove();

    svgLineChart
      .select(".x-axis")
      .transition()
      .duration(500)
      .call(d3.axisBottom(xScaleLineChart).ticks(8));

    svgLineChart
      .select(".y-axis")
      .transition()
      .duration(500)
      .call(d3.axisLeft(yScaleLineChart));
  }

  // Stacked area line chart
  {
    (marginStack = { top: 40, right: 10, bottom: 140, left: 100 }),
      (widthStack = 460 - marginStack.left - marginStack.right),
      (heightStack = 400 - marginStack.top - marginStack.bottom);

    // append the svg object to the body of the page
    const areaStackSvg = d3
      .select("#continentAreaLineChart")
      .append("svg")
      .attr("width", widthStack + marginStack.left + marginStack.right)
      .attr("height", heightStack + marginStack.top + marginStack.bottom)
      .append("g")
      .attr(
        "transform",
        `translate(${marginStack.left}, ${marginStack.top})`
      );

    // Add X axis

    const xScaleStack = d3
      .scaleTime() //used to scale time
      .domain(
        d3.extent(casesByContinentsAndDate, function (d) {
          //fetches min and max date
          formatTime = d3.timeParse("%Y-%m-%d");
          return formatTime(d.date);
        })
      )
      .range([0, widthStack]);

    areaStackSvg
      .append("g")
      .attr("transform", `translate(0, ${heightStack})`)
      .call(d3.axisBottom(xScaleStack).ticks(3));

    areaStackSvg // x Axis
      .append("text")
      .attr("text-anchor", "end")
      .attr("x", widthStack / 3.5 + marginStack.left)
      .attr("y", heightStack + marginStack.top + 5)
      .text("Years");

    // Y axis label:
    areaStackSvg // y Axis
      .append("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-90)")
      .attr("y", -marginStack.left + 30)
      .attr("x", -marginStack.top - heightStack / 2 + 120)
      .text("New Cases Per Million");

    //defining the stack
    var casesByContinentSorted = new Map(
      [...casesByContinent.entries()].sort((a, b) => a[1] - b[1])
    );
    var arrayOfContinentSorted = Array.from(casesByContinentSorted.keys());
    for (let index = 0; index < arrayOfContinentSorted.length; index++) {
      arrayOfContinentSorted[index] = arrayOfContinentSorted[index]
        .split(" ")
        .join("");
    }

    var stack = d3 // Stack the data: each group will be represented on top of each other
      .stack()
      .keys(arrayOfContinentSorted);
    var stackedData = stack(casesByContinentsAndDate);

    //console.log(stackedData); // the data on top of the stack will be Asia, then underneath Africa and so on as defined by the data in keys.
    // console.log(stackedData[5]); //would fetch values or data of the first country specified in keys, [0]th index -> Asia  | Data would be new cases recorded in Asia from start of data(2019) to end of data(2023)

    var maxStack = d3.max(stackedData[stackedData.length - 1], function (d) {
      return +d[1];
    });
    // console.log("max" + maxStack); //maxinum number of data from the last item on stack.

    //  Add Y axis
    var yScaleStack = d3
      .scaleLinear()
      .domain([0, maxStack])
      .range([heightStack, 0]);
    var yAxisStack = areaStackSvg
      .append("g")
      .call(d3.axisLeft(yScaleStack).ticks(5));

    // Show the areas
    areaStackSvg
      .selectAll("mylayers")
      .data(stackedData)
      .join("path")
      .attr("class", function (d) {
        return d.key;
      })
      .attr("id", function (d) {
        return d.key;
      })
      .style("fill", function (d) {
        return continentToColorScale(
          d.key.replace(/([a-z])([A-Z])/g, "$1 $2")
        );
      })
      .style("opacity", "1")
      .style("transition", "0.6s")
      .attr(
        "d",
        d3
          .area()
          .x(function (d, i) {
            formatTime = d3.timeParse("%Y-%m-%d");
            return xScaleStack(formatTime(d.data.date));
          })
          .y0(function (d) {
            return yScaleStack(+d[0]);
          })
          .y1(function (d) {
            return yScaleStack(+d[1]);
          })
      )

      .on("mouseover", function (d) {
        onMouseOver(this);
      })
      .on("mouseout", function (d) {
        onMouseOut(this);
      })
      .on("click", function (d) {
        onMouseClick(this);
      });
  }

  // VACCINATIONS
  //data used:
  //dataForVaccineAndBooster,
  //sumOfTotalBoostersPerDate
  //sumOfTotalVaccinationsPerDate

  //newCaseLine
  const selectVacLine = d3.select("#vacLine");
  const vacLineWidth = +selectVacLine.attr("width");
  const vacLineHeight = +selectVacLine.attr("height");
  // This is the D3 Margin Convention.
  var margin = { top: 50, right: 50, bottom: 390, left: 100 };
  var innerWidth = vacLineWidth - margin.left - margin.right; //this is the width of the barchart
  var innerHeight = vacLineWidth - margin.top - margin.bottom; // this is the height of the barchart

  // append the svg object to the body of the page
  var svg = selectVacLine
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  drawThreeLinesLineChart(
    convertToMapSumOfTotalVaccinationsPerDate,
    convertToMapSumOfTotalCasesPerDate,
    convertToMapSumOfTotalDeathsPerDate,
    "vaccine",
    svg,
    innerHeight,
    innerWidth,
    "Time",
    "No. Of People"
  );

  const selectBoosLine = d3.select("#boosLine");
  const boosLineWidth = +selectBoosLine.attr("width");
  const boosLineHeight = +selectBoosLine.attr("height");
  // This is the D3 Margin Convention.
  var margin = { top: 50, right: 50, bottom: 390, left: 100 };
  var innerWidth = boosLineWidth - margin.left - margin.right; //this is the width of the barchart
  var innerHeight = boosLineWidth - margin.top - margin.bottom; // this is the height of the barchart

  // append the svg object to the body of the page
  svg = selectBoosLine
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  drawThreeLinesLineChart(
    convertToMapSumOfTotalBoostersPerDate,
    convertToMapSumOfTotalCasesPerDate,
    convertToMapSumOfTotalDeathsPerDate,
    "booster",
    svg,
    innerHeight,
    innerWidth,
    "Time",
    "No. Of People"
  );

  function drawThreeLinesLineChart(
    data1,
    data2,
    data3,
    vaccineOrBooster,
    svg,
    innerHeight,
    innerWidth,
    xAxisLabel,
    yAxisLabel
  ) {
    var data = data1; //demo data taken for general as date is common for all, so extent of date is similar for all
    //mapping data for lines
    // Define the sort function
    const sortByDate = (a, b) => a.date - b.date;

    // Sort the data by date
    data.sort(sortByDate);
    data1.sort(sortByDate);
    data2.sort(sortByDate);
    data3.sort(sortByDate);

    if (vaccineOrBooster == "vaccine") {
      var totalVaccineOrBoosterMax = d3.max(
        data1,
        (d) => d.total_vaccinations
      );
    } else {
      var totalVaccineOrBoosterMax = d3.max(data1, (d) => d.total_boosters);
    }
    var totalCaseMax = d3.max(data2, (d) => d.total_cases);
    var totalDeathMax = d3.max(data3, (d) => d.total_deaths);

    //adding scales
    const x = d3
      .scaleTime()
      .domain(
        d3.extent(data, function (d) {
          return d.date;
        })
      )
      .range([0, innerWidth]);
    svg
      .append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(x));

    // Add Y axis
    const y = d3
      .scaleLog()
      .domain([
        1,
        Math.max(totalVaccineOrBoosterMax, totalCaseMax, totalDeathMax),
      ])
      .range([innerHeight, 0]);

    svg.append("g").call(d3.axisLeft(y));

    //X axis label
    svg
      .append("text")
      .attr("text-anchor", "end")
      .attr("x", innerWidth / 3 + margin.left)
      .attr("y", innerHeight + margin.top + 10)
      .text(xAxisLabel);

    // Y axis label:
    svg
      .append("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 50)
      .attr("x", -margin.top - innerHeight / 2 + 90)
      .text(yAxisLabel);

    if (vaccineOrBooster == "vaccine") {
      const vaccinationsLine = d3
        .line()
        .x((d) => x(d.date))
        .y((d) => y(d.total_vaccinations))
        .curve(d3.curveBasis);

      svg
        .append("path")
        .attr("class", "calcPercOfPopVaccinated")
        .datum(data1)
        .attr("fill", "none")
        .attr("stroke", "green")
        .attr("stroke-width", 3.5)
        .attr("d", vaccinationsLine);
    } else {
      const boostersLine = d3
        .line()
        .x((d) => x(d.date))
        .y((d) => y(d.total_boosters))
        .curve(d3.curveBasis);

      svg
        .append("path")
        .attr("class", "calcPercOfPopGotBoosterShots")
        .datum(data1)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 3.5)
        .attr("d", boostersLine);
    }
    const totalCasesLine = d3
      .line()
      .x((d) => x(d.date))
      .y((d) => y(d.total_cases))
      .curve(d3.curveBasis);
    const totalDeathsLine = d3
      .line()
      .x((d) => x(d.date))
      .y((d) => y(+d.total_deaths))
      .curve(d3.curveBasis);

    // Add the line

    svg
      .append("path")
      .attr("class", "calcPercOfTotalCases")
      .datum(convertToMapSumOfTotalCasesPerDate)
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 3.5)
      .attr("d", totalCasesLine);

    svg
      .append("path")
      .attr("class", "calcPercOfTotalDeaths")
      .datum(convertToMapSumOfTotalDeathsPerDate)
      .attr("fill", "none")
      .attr("stroke", "orange")
      .attr("stroke-width", 3.5)
      .attr("d", totalDeathsLine);
  }

  //adding pie chart
  var calcPercOfPopVaccinated = (totalVaccinations / totalPopulation) * 100;

  var calcPercOfPopGotBoosterShots = (totalBoosters / totalPopulation) * 100;
  // var remainingPercBooster = 100 - calcPercOfPopGotBoosterShots;

  var calcPercOfTotalDeaths = (totalDeaths / totalPopulation) * 100;
  // var remainingPercBooster = 100 - calcPercOfTotalDeaths;

  var calcPercOfTotalCases = (totalCases / totalPopulation) * 100;
  // var remainingPercBooster = 100 - calcPercOfTotalCases;
  var remainingPercVaccination =
    100 -
    (calcPercOfPopVaccinated +
      calcPercOfTotalCases +
      calcPercOfTotalDeaths +
      calcPercOfPopGotBoosterShots);
  // console.log("Remaining Perc -> " + remainingPercVaccination);

  d3.select("#peopleVaccinated").text(
    " " + Math.round(calcPercOfPopVaccinated * 100) / 100 + "%"
  );
  d3.select("#boosterShots").text(
    Math.round(calcPercOfPopGotBoosterShots * 100) / 100 + "%"
  );
  d3.select("#totalCases").text(
    Math.round(calcPercOfTotalCases * 100) / 100 + "%"
  );
  d3.select("#totalDeaths").text(
    Math.round(calcPercOfTotalDeaths * 100) / 100 + "%"
  );
  d3.select("#totalUnaffected").text(
    Math.round(remainingPercVaccination * 100) / 100 + "%"
  );

  var mapForVaccination = {
    calcPercOfPopVaccinated: calcPercOfPopVaccinated,
    calcPercOfTotalCases: calcPercOfTotalCases,
    calcPercOfTotalDeaths: calcPercOfTotalDeaths,
    remainingPercVaccination: remainingPercVaccination,
    calcPercOfPopGotBoosterShots: calcPercOfPopGotBoosterShots,
  };

  const selectVacPie = d3.select("#vacPie");
  const vacPieWidth = +selectVacPie.attr("width");
  const vacPieHeight = +selectVacPie.attr("height");
  // This is the D3 Margin Convention.
  var margin = { top: 106, right: 50, bottom: 20, left: 145 };
  var innerWidth = vacPieWidth - margin.left - margin.right; //this is the width of the barchart
  var innerHeight = vacPieHeight - margin.top - margin.bottom; // this is the height of the barchart

  // append the svg object to the body of the page
  svg = selectVacPie
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  //svg after it is drawn willl be :
  const color = d3
    .scaleOrdinal()
    .range(["green", "red", "orange", "lightgrey", "steelblue"]);
  drawPieChart(
    svg,
    mapForVaccination,
    "normal",
    innerHeight,
    innerWidth,
    color
  );

  //color scale order is => vaccination, cases, deaths, remaininng perc vaccination and Booster shots.
  function drawPieChart(
    svg,
    data,
    typeOfPieChart,
    innerHeight,
    innerWidth,
    color
  ) {
    var radius = Math.min(innerWidth, innerHeight) / 2;

    // Compute the position of each group on the pie
    const pie = d3
      .pie()
      .value((d) => d[1])
      .startAngle(-2 * Math.PI)
      .endAngle((3 * Math.PI) / 2);

    const data_ready = pie(Object.entries(data));
    var g = svg.append("g");
    var update = g.selectAll("path").data(data_ready);

    if (typeOfPieChart == "normal") {
      var innerRadius = 100;
      var outerRadius = 25;
    } else {
      var innerRadius = 20;
      var outerRadius = -90;
    }
    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    update
      .join("path")
      .merge(update)
      .attr("id", (d) => d.data[0])
      .attr(
        "d",
        d3
          .arc()
          .innerRadius(innerRadius) // This is the size of the donut hole
          .outerRadius(radius - outerRadius)
      )
      .attr("fill", (d) => color(d.data[0]))
      .attr("stroke", "white")
      .style("stroke-width", "1px")
      .style("opacity", 1)
      .on("mouseover", function (d) {
        console.log("mouse over");
        d3.select(this).classed("highlightArc", true);
        classToSelect = d3.select(this).attr("id");
        d3.selectAll("." + classToSelect).classed("highlightArcStroke", true);
        // update.selectAll('path').style('opacity','0.3')
      })
      .on("mouseout", function (d) {
        d3.select(this).classed("highlightArc", false);
        d3.selectAll("." + classToSelect).classed(
          "highlightArcStroke",
          false
        );
      });

    update.exit().remove();
  }
});
