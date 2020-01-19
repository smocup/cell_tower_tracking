import api from "./api.js";
import conversion from "./conversions.js";
import mapStyling from "./mapStyling.js";

window.onload = () => {
  let map;

  let currentCoords;
  let originalCoords;

  let cellTowers = [];
  getLocation(
    result => {
      const coords = result.coords;
      currentCoords = { lat: coords.latitude, lng: coords.longitude };
      originalCoords = currentCoords;

      map = initMap(currentCoords);

      api.getTowers(currentCoords.lat, currentCoords.lng).then(result => {
        cellTowers = result;
      });

      let overlay = new google.maps.OverlayView();
      overlay.draw = () => {
        draw(overlay, currentCoords, cellTowers);
      };
      overlay.setMap(map);
    },
    () => {
      console.log("error getting location");
    }
  );

  watchPosition(result => {
    const coords = result.coords;
    currentCoords = { lat: coords.latitude, lng: coords.longitude };
    if (
      conversion.coordsDistanceMetres(
        currentCoords.lat,
        currentCoords.lng,
        originalCoords.lat,
        originalCoords.lng
      ) >= 800
    ) {
      api.getTowers(currentCoords.lat, currentCoords.lng).then(result => {
        cellTowers = result;
      });
      originalCoords = currentCoords;
    }
    map.panTo(currentCoords);
  });
};

const draw = (overlay, currentCoords, cellTowers) => {
  const pixelCentre = coordsToPixel(
    overlay,
    new google.maps.LatLng(currentCoords.lat, currentCoords.lng)
  );

  updateCellTowerMarkers(
    cellTowers.map(tower =>
      coordsToPixel(overlay, new google.maps.LatLng(tower.lat, tower.lon))
    )
  );

  updateLocationMarker(pixelCentre);
};

const coordsToPixel = (overlay, coord) => {
  return overlay.getProjection().fromLatLngToContainerPixel(coord);
};

const getLocation = (succ, err) => {
  navigator.geolocation.getCurrentPosition(succ, err);
};

const watchPosition = (succ, err) => {
  navigator.geolocation.watchPosition(succ, err);
};

const updateLocationMarker = pixelCoords => {
  d3.select("svg")
    .selectAll(".centre")
    .data([pixelCoords])
    .enter()
    .append("g")
    .attr("class", "centre")
    .append("circle")
    .attr("cx", pixelCoords.x)
    .attr("cy", pixelCoords.y)
    .attr("r", 0)
    .style("opacity", 0)
    .style("fill","rgba(255,255,255)")
    .transition()
    .style("opacity", 0.8)
    .style("stroke","rgba(255, 255, 255")
    .attr("r", 7)
    .duration(1000)
    .ease(d3.easeElastic);

  d3.selectAll(".centre circle")
    .attr("cx", pixelCoords.x)
    .attr("cy", pixelCoords.y);
};

const updateCellTowerMarkers = cellTowers => {
  d3.select("svg")
    .selectAll(".cellTower")
    .data(cellTowers)
    .enter()
    .append("g")
    .attr("class", "cellTower")
    .append("circle")
    .attr("cx", (d, i) => d.x)
    .attr("cy", (d, i) => d.y)
    .attr("r", 0)
    .style("opacity", 0)
    .style("fill", "rgba(153, 241, 55)")
    .transition()
    .style("opacity", 0.65)
    .attr("r", 10)
    .duration(1000)
    .delay(() => {
      return Math.random() * (2000 - 500) + 500;
    })
    .ease(d3.easeElastic);

  d3.selectAll(".cellTower circle")
    .attr("cx", (d, i) => cellTowers[i].x)
    .attr("cy", (d, i) => cellTowers[i].y);
};

const initMap = (center, zoom = 15) => {
  return new google.maps.Map(document.getElementById("map"), {
    center,
    zoom,
    styles: mapStyling.styling(),
    disableDefaultUI: true,
    disableDoubleClickZoom: true
  });
};
