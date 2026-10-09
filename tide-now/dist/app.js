const stations = [
  { id: "8517847", name: "Brooklyn Bridge, East River, NY", tz: "America/New_York", lat: 40.7033, lon: -73.9950 },
  { id: "8518699", name: "Williamsburg Bridge, East River, NY", tz: "America/New_York", lat: 40.7117, lon: -73.9683 },
  { id: "8518695", name: "East 41st Street Pier, East River, NY", tz: "America/New_York", lat: 40.7467, lon: -73.9683 },
  { id: "8518687", name: "Queensboro Bridge, East River, NY", tz: "America/New_York", lat: 40.7583, lon: -73.9583 },
  { id: "8518750", name: "The Battery, NY", tz: "America/New_York", lat: 40.7006, lon: -74.0142 },
  { id: "9414290", name: "San Francisco, CA", tz: "America/Los_Angeles", lat: 37.8063, lon: -122.4659 },
  { id: "9410170", name: "San Diego, CA", tz: "America/Los_Angeles", lat: 32.7142, lon: -117.1736 },
  { id: "9410660", name: "Los Angeles, CA", tz: "America/Los_Angeles", lat: 33.7203, lon: -118.2728 },
  { id: "9447130", name: "Seattle, WA", tz: "America/Los_Angeles", lat: 47.6026, lon: -122.3393 },
  { id: "9439040", name: "Astoria, OR", tz: "America/Los_Angeles", lat: 46.2073, lon: -123.7683 },
  { id: "8443970", name: "Boston, MA", tz: "America/New_York", lat: 42.3539, lon: -71.0503 },
  { id: "8418150", name: "Portland, ME", tz: "America/New_York", lat: 43.6581, lon: -70.2442 },
  { id: "8723214", name: "Virginia Key, FL", tz: "America/New_York", lat: 25.7314, lon: -80.1618 },
  { id: "8724580", name: "Key West, FL", tz: "America/New_York", lat: 24.5551, lon: -81.8079 },
  { id: "8665530", name: "Charleston, SC", tz: "America/New_York", lat: 32.7808, lon: -79.9236 },
  { id: "1612340", name: "Honolulu, HI", tz: "Pacific/Honolulu", lat: 21.3067, lon: -157.8670 }
];

const stationStorageKey = "tide-now-station-v2";

const el = {
  station: document.querySelector("#station"),
  date: document.querySelector("#date"),
  refresh: document.querySelector("#refresh"),
  clock: document.querySelector("#clock"),
  heroLabel: document.querySelector("#hero-label"),
  height: document.querySelector("#height"),
  trend: document.querySelector("#trend"),
  place: document.querySelector("#place"),
  lowTime: document.querySelector("#low-time"),
  lowHeight: document.querySelector("#low-height"),
  highTime: document.querySelector("#high-time"),
  highHeight: document.querySelector("#high-height"),
  bestTime: document.querySelector("#best-time"),
  bestNote: document.querySelector("#best-note"),
  rangeLow: document.querySelector("#range-low"),
  rangeHigh: document.querySelector("#range-high"),
  chartPath: document.querySelector("#chart-path"),
  chartDots: document.querySelector("#chart-dots"),
  incomingBand: document.querySelector("#incoming-band"),
  fishMarker: document.querySelector("#fish-marker"),
  chartMarkerLine: document.querySelector("#chart-marker-line"),
  chartMarkerDot: document.querySelector("#chart-marker-dot"),
  scrubber: document.querySelector("#scrubber"),
  scrubTime: document.querySelector("#scrub-time"),
  scrubHeight: document.querySelector("#scrub-height"),
  scrubTrend: document.querySelector("#scrub-trend"),
  incomingTime: document.querySelector("#incoming-time"),
  tideTable: document.querySelector("#tide-table"),
  status: document.querySelector("#status")
};

const day = 24 * 60 * 60 * 1000;
let activeData = null;
let chartRange = null;

function ymd(date) {
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

function ymdFromInput(value) {
  return value.replaceAll("-", "");
}

function stationDateValue(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function timeZoneOffset(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    hour12: false,
    timeZone
  }).formatToParts(date);
  const part = (type) => Number(parts.find((item) => item.type === type).value);
  const asUtc = Date.UTC(
    part("year"),
    part("month") - 1,
    part("day"),
    part("hour"),
    part("minute"),
    part("second")
  );
  return asUtc - date.getTime();
}

function parseStationTime(value, timeZone) {
  const [datePart, timePart] = value.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  const firstPass = new Date(asUtc - timeZoneOffset(new Date(asUtc), timeZone));
  return new Date(asUtc - timeZoneOffset(firstPass, timeZone));
}

function selectedStation() {
  return stations.find((item) => item.id === el.station.value) || stations[0];
}

function isSelectedToday(station) {
  return el.date.value === stationDateValue(new Date(), station.tz);
}

function formatTime(date, timeZone) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone
  }).format(date);
}

function formatDayTime(date, timeZone) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone
  }).format(date);
}

function formatTableTime(date, timeZone) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone
  }).format(date);
}

function feet(value) {
  return `${Number(value).toFixed(1)} ft`;
}

function setStatus(text) {
  el.status.textContent = text;
}

function setLoading(isLoading) {
  el.refresh.disabled = isLoading;
  el.refresh.textContent = isLoading ? "Loading" : "Refresh";
}

function endpoint(station, interval, dateValue) {
  const params = new URLSearchParams({
    product: "predictions",
    application: "tide_now",
    begin_date: ymdFromInput(dateValue),
    end_date: ymdFromInput(dateValue),
    datum: "MLLW",
    station: station.id,
    time_zone: "lst_ldt",
    units: "english",
    format: "json"
  });

  if (interval) params.set("interval", interval);

  return `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?${params}`;
}

async function getPredictions(station, interval, dateValue) {
  const response = await fetch(endpoint(station, interval, dateValue));
  if (!response.ok) throw new Error("NOAA did not respond.");

  const payload = await response.json();
  if (payload.error) throw new Error(payload.error.message || "No tide data for that station.");

  return payload.predictions.map((point) => ({
    at: parseStationTime(point.t, station.tz),
    value: Number(point.v),
    type: point.type
  }));
}

function weatherEndpoint(station, dateValue) {
  const params = new URLSearchParams({
    latitude: String(station.lat),
    longitude: String(station.lon),
    hourly: "temperature_2m,precipitation,wind_speed_10m",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    precipitation_unit: "inch",
    timezone: station.tz,
    start_date: dateValue,
    end_date: dateValue
  });

  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

async function getWeather(station, dateValue) {
  const response = await fetch(weatherEndpoint(station, dateValue));
  if (!response.ok) throw new Error("Weather unavailable.");

  const payload = await response.json();
  const hourly = payload.hourly;
  if (!hourly?.time?.length) return [];

  return hourly.time.map((time, index) => ({
    at: parseStationTime(time.replace("T", " "), station.tz),
    temperature: hourly.temperature_2m[index],
    wind: hourly.wind_speed_10m[index],
    precipitation: hourly.precipitation[index]
  }));
}

function interpolate(points, now) {
  const before = [...points].reverse().find((point) => point.at <= now);
  const after = points.find((point) => point.at >= now);

  if (!before || !after) return null;
  if (before.at.getTime() === after.at.getTime()) {
    return { value: before.value, slope: 0 };
  }

  const span = after.at.getTime() - before.at.getTime();
  const progress = (now.getTime() - before.at.getTime()) / span;
  const value = before.value + (after.value - before.value) * progress;

  return {
    value,
    slope: after.value - before.value
  };
}

function nextTide(tides, type, now) {
  return tides.find((point) => point.type === type && point.at > now);
}

function trendClass(slope) {
  return slope >= 0 ? "rising" : "falling";
}

function trendText(slope) {
  return slope >= 0 ? "Rising" : "Falling";
}

function updateClock(station) {
  const now = new Date();
  el.clock.dateTime = now.toISOString();
  el.clock.textContent = formatTime(now, station.tz);
}

function renderScrubber(station, series) {
  if (!series.length) {
    el.scrubber.disabled = true;
    el.scrubber.value = "0";
    el.scrubTime.textContent = "--";
    el.scrubHeight.textContent = "--";
    el.scrubTrend.textContent = "Waiting";
    el.scrubTrend.className = "trend";
    return;
  }

  el.scrubber.disabled = false;
  el.scrubber.min = "0";
  el.scrubber.max = String(series.length - 1);

  const nowIndex = series.findIndex((point) => point.at >= new Date());
  const startingIndex = isSelectedToday(station) && nowIndex >= 0 ? nowIndex : 0;
  el.scrubber.value = String(startingIndex);
  updateScrubbedTide(station, series);
}

function updateScrubbedTide(station, series) {
  const index = Number(el.scrubber.value);
  const point = series[index];
  const next = series[Math.min(series.length - 1, index + 1)] || point;
  const slope = next.value - point.value;

  el.scrubTime.textContent = formatTableTime(point.at, station.tz);
  el.scrubHeight.textContent = feet(point.value);
  el.scrubTrend.textContent = trendText(slope);
  el.scrubTrend.className = `trend ${trendClass(slope)}`;
  updateChartMarker(index, series);
}

function chartPoint(point, index, series, min, max) {
  const x = series.length <= 1 ? 0 : (index / (series.length - 1)) * 100;
  const normalized = max === min ? 0.5 : (point.value - min) / (max - min);
  const y = 52 - normalized * 44;
  return { x, y };
}

function clearChart() {
  el.chartPath.setAttribute("d", "");
  el.chartDots.replaceChildren();
  el.incomingBand.setAttribute("x", "0");
  el.incomingBand.setAttribute("width", "0");
  el.fishMarker.setAttribute("x", "0");
  el.fishMarker.setAttribute("y", "30");
  el.fishMarker.setAttribute("opacity", "0");
  el.chartMarkerLine.setAttribute("x1", "0");
  el.chartMarkerLine.setAttribute("x2", "0");
  el.chartMarkerDot.setAttribute("cx", "0");
  el.chartMarkerDot.setAttribute("cy", "30");
  chartRange = null;
}

function bestFishingIndex(series) {
  if (series.length < 2) return -1;

  let bestIndex = 0;
  let bestMovement = 0;
  for (let index = 0; index < series.length - 1; index += 1) {
    const movement = Math.abs(series[index + 1].value - series[index].value);
    if (movement > bestMovement) {
      bestMovement = movement;
      bestIndex = index;
    }
  }
  return bestIndex;
}

function nearestSeriesIndex(series, target) {
  return series.reduce((best, candidate, index) => {
    const bestDelta = Math.abs(series[best].at - target);
    const candidateDelta = Math.abs(candidate.at - target);
    return candidateDelta < bestDelta ? index : best;
  }, 0);
}

function incomingHighWindow(series, extremes) {
  if (series.length < 2) return null;

  const highs = extremes.filter((point) => point.type === "H");
  if (!highs.length) return null;

  let best = null;
  for (const high of highs) {
    const endIndex = nearestSeriesIndex(series, high.at);
    const startTime = new Date(high.at.getTime() - 2 * 60 * 60 * 1000);
    const startIndex = nearestSeriesIndex(series, startTime);
    const start = Math.min(startIndex, endIndex);
    const end = Math.max(startIndex, endIndex);
    const gain = series[end].value - series[start].value;

    if (gain <= 0) continue;
    if (!best || gain > best.gain) {
      best = { start, end, high, gain };
    }
  }

  return best;
}

function renderBestFishingTime(station, series, bestIndex) {
  if (bestIndex < 0 || !series[bestIndex]) {
    el.bestTime.textContent = "🐟 --";
    el.bestNote.textContent = "Strongest predicted movement";
    return;
  }

  const point = series[bestIndex];
  const next = series[Math.min(series.length - 1, bestIndex + 1)] || point;
  const slope = next.value - point.value;

  el.bestTime.textContent = `🐟 ${formatTableTime(point.at, station.tz)}`;
  el.bestNote.textContent = `${trendText(slope)} fastest`;
}

function renderIncomingHighWindow(station, series, window) {
  if (!window) {
    el.incomingTime.textContent = "↑ High --";
    el.incomingBand.setAttribute("x", "0");
    el.incomingBand.setAttribute("width", "0");
    return;
  }

  const start = series[window.start].at;
  const end = series[window.end].at;
  el.incomingTime.textContent = `↑ High ${formatTime(start, station.tz)}–${formatTime(end, station.tz)}`;
}

function renderTideChart(series, extremes, min, max, bestIndex, incomingWindow) {
  if (!series.length) {
    clearChart();
    return;
  }

  chartRange = { min, max };
  const path = series
    .map((point, index) => {
      const { x, y } = chartPoint(point, index, series, min, max);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  el.chartPath.setAttribute("d", path);
  if (incomingWindow) {
    const start = chartPoint(series[incomingWindow.start], incomingWindow.start, series, min, max).x;
    const end = chartPoint(series[incomingWindow.end], incomingWindow.end, series, min, max).x;
    el.incomingBand.setAttribute("x", Math.min(start, end).toFixed(2));
    el.incomingBand.setAttribute("width", Math.abs(end - start).toFixed(2));
  } else {
    el.incomingBand.setAttribute("x", "0");
    el.incomingBand.setAttribute("width", "0");
  }

  el.chartDots.replaceChildren(...extremes.map((point) => {
    const nearestIndex = series.reduce((best, candidate, index) => {
      const bestDelta = Math.abs(series[best].at - point.at);
      const candidateDelta = Math.abs(candidate.at - point.at);
      return candidateDelta < bestDelta ? index : best;
    }, 0);
    const { x, y } = chartPoint(series[nearestIndex], nearestIndex, series, min, max);
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("class", `chart-dot ${point.type === "H" ? "high" : "low"}`);
    dot.setAttribute("cx", x.toFixed(2));
    dot.setAttribute("cy", y.toFixed(2));
    dot.setAttribute("r", "1.8");
    return dot;
  }));

  if (bestIndex >= 0 && series[bestIndex]) {
    const { x, y } = chartPoint(series[bestIndex], bestIndex, series, min, max);
    el.fishMarker.setAttribute("x", x.toFixed(2));
    el.fishMarker.setAttribute("y", Math.max(6, y - 6).toFixed(2));
    el.fishMarker.setAttribute("opacity", "1");
  } else {
    el.fishMarker.setAttribute("opacity", "0");
  }
}

function updateChartMarker(index, series) {
  if (!chartRange || !series.length) return;

  const point = series[index];
  const { x, y } = chartPoint(point, index, series, chartRange.min, chartRange.max);
  el.chartMarkerLine.setAttribute("x1", x.toFixed(2));
  el.chartMarkerLine.setAttribute("x2", x.toFixed(2));
  el.chartMarkerDot.setAttribute("cx", x.toFixed(2));
  el.chartMarkerDot.setAttribute("cy", y.toFixed(2));
}

function nearestWeather(weather, time) {
  if (!weather?.length) return null;

  return weather.reduce((best, point) => {
    const bestDelta = Math.abs(best.at - time);
    const pointDelta = Math.abs(point.at - time);
    return pointDelta < bestDelta ? point : best;
  });
}

function formatWeather(point) {
  if (!point) return "--";

  const temp = Number.isFinite(point.temperature) ? `${Math.round(point.temperature)}°` : "--";
  const wind = Number.isFinite(point.wind) ? `${Math.round(point.wind)} mph` : "--";
  const rain = Number(point.precipitation) > 0 ? ` · ${Number(point.precipitation).toFixed(2)} in` : "";
  return `${temp} ${wind}${rain}`;
}

function renderTideTable(station, extremes, weather) {
  const rows = extremes
    .map((point) => {
      const row = document.createElement("tr");
      const time = document.createElement("td");
      const tide = document.createElement("td");
      const height = document.createElement("td");
      const weatherCell = document.createElement("td");

      time.textContent = formatTableTime(point.at, station.tz);
      tide.textContent = point.type === "H" ? "High" : "Low";
      height.textContent = feet(point.value);
      weatherCell.textContent = formatWeather(nearestWeather(weather, point.at));

      row.append(time, tide, height, weatherCell);
      return row;
    });

  if (!rows.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = "No upcoming tides";
    row.append(cell);
    rows.push(row);
  }

  el.tideTable.replaceChildren(...rows);
}

function paint({ station, series, extremes, weather }) {
  const now = new Date();
  const today = isSelectedToday(station);
  const selectedPoint = today ? interpolate(series, now) : series[0];
  const low = extremes.find((point) => point.type === "L");
  const high = extremes.find((point) => point.type === "H");
  const visibleExtremes = extremes.length ? extremes : series;

  updateClock(station);
  el.heroLabel.textContent = today ? "Now" : "Day Start";
  el.place.textContent = station.name;

  if (!visibleExtremes.length) {
    el.height.textContent = "--";
    el.trend.textContent = "Waiting";
    el.trend.className = "trend";
    el.lowTime.textContent = "--";
    el.lowHeight.textContent = "--";
    el.highTime.textContent = "--";
    el.highHeight.textContent = "--";
    renderBestFishingTime(station, series, -1);
    renderIncomingHighWindow(station, series, null);
    el.rangeLow.textContent = "Low --";
    el.rangeHigh.textContent = "High --";
    clearChart();
    renderScrubber(station, series);
    renderTideTable(station, extremes, weather);
    setStatus(`${el.date.value} · no predictions found`);
    return;
  }

  const rangeMin = Math.min(...visibleExtremes.map((point) => point.value));
  const rangeMax = Math.max(...visibleExtremes.map((point) => point.value));

  if (selectedPoint) {
    const slope = selectedPoint.slope ?? ((series[1] || selectedPoint).value - selectedPoint.value);
    el.height.textContent = feet(selectedPoint.value);
    el.trend.textContent = trendText(slope);
    el.trend.className = `trend ${trendClass(slope)}`;
  }

  if (low) {
    el.lowTime.textContent = formatDayTime(low.at, station.tz);
    el.lowHeight.textContent = feet(low.value);
  } else {
    el.lowTime.textContent = "--";
    el.lowHeight.textContent = "--";
  }

  if (high) {
    el.highTime.textContent = formatDayTime(high.at, station.tz);
    el.highHeight.textContent = feet(high.value);
  } else {
    el.highTime.textContent = "--";
    el.highHeight.textContent = "--";
  }

  el.rangeLow.textContent = `Low ${feet(rangeMin)}`;
  el.rangeHigh.textContent = `High ${feet(rangeMax)}`;
  const bestIndex = bestFishingIndex(series);
  const incomingWindow = incomingHighWindow(series, extremes);
  renderBestFishingTime(station, series, bestIndex);
  renderIncomingHighWindow(station, series, incomingWindow);
  renderTideChart(series, extremes, rangeMin, rangeMax, bestIndex, incomingWindow);
  renderScrubber(station, series);
  renderTideTable(station, extremes, weather);
  setStatus(`${el.date.value} · updated ${formatTime(now, station.tz)}`);
}

async function load() {
  const station = selectedStation();
  const dateValue = el.date.value || stationDateValue(new Date(), station.tz);
  el.date.value = dateValue;
  localStorage.setItem(stationStorageKey, station.id);
  setLoading(true);
  setStatus("Loading NOAA predictions.");

  try {
    const [series, extremes, weatherResult] = await Promise.allSettled([
      getPredictions(station, "6", dateValue),
      getPredictions(station, "hilo", dateValue),
      getWeather(station, dateValue)
    ]);

    if (series.status === "rejected") throw series.reason;
    if (extremes.status === "rejected") throw extremes.reason;

    const weather = weatherResult.status === "fulfilled" ? weatherResult.value : [];
    activeData = { station, series: series.value, extremes: extremes.value, weather };
    paint({ station, series: series.value, extremes: extremes.value, weather });
  } catch (error) {
    setStatus(error.message || "Tide data is unavailable.");
  } finally {
    setLoading(false);
  }
}

function init() {
  const saved = localStorage.getItem(stationStorageKey) || stations[0].id;
  for (const station of stations) {
    const option = document.createElement("option");
    option.value = station.id;
    option.textContent = station.name;
    option.selected = station.id === saved;
    el.station.append(option);
  }

  el.date.value = stationDateValue(new Date(), selectedStation().tz);
  el.station.addEventListener("change", load);
  el.date.addEventListener("change", load);
  el.refresh.addEventListener("click", load);
  el.scrubber.addEventListener("input", () => {
    if (activeData) updateScrubbedTide(activeData.station, activeData.series);
  });
  load();
  setInterval(() => {
    const station = stations.find((item) => item.id === el.station.value) || stations[0];
    updateClock(station);
  }, 30000);
}

init();
