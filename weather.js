import axios from "axios";

export function getWeather(lat, lon, timezone) {
  return axios
    .get(
      "https://api.open-meteo.com/v1/forecast?hourly=temperature_2m,apparent_temperature,precipitation,weathercode,windspeed_10m&daily=weathercode,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch&timeformat=unixtime",
      {
        params: {
          latitude: lat,
          longitude: lon,
          timezone,
        },
      }
    )
    .then(({ data }) => {
      return {
        current: parseCurrentWeather(data),
        daily: parseDailyWeather(data),
        hourly: parseHourlyWeather(data),
      };
    });
}

function parseCurrentWeather({ current_weather, daily }) {
  const {
    temperature: currentTemp,
    windspeed: windSpeed,
    weathercode: iconCode,
  } = current_weather;
  const {
    temperature_2m_max: [maxTemp],
    temperature_2m_min: [minTemp],
    apparent_temperature_max: [maxFeelsLike],
    apparent_temperature_min: [minFeelsLike],
    precipitation_sum: [precip],
  } = daily;

  return {
    currentTemp: Math.round((currentTemp - 32) * (5 / 9)),
    highTemp: Math.round((maxTemp - 32) * (5 / 9)),
    lowTemp: Math.round((minTemp - 32) * (5 / 9)),
    highFeelsLike: Math.round((maxFeelsLike - 32) * (5 / 9)),
    lowFeelsLike: Math.round((minFeelsLike - 32) * (5 / 9)),
    windSpeed: Math.round(windSpeed * 1.609),
    precip: Math.round(precip * 2.54 * 100) / 100,
    iconCode,
  };
}

function parseDailyWeather({ daily }) {
  return daily.time.map((time, index) => {
    return {
      timestamp: time * 1000,
      iconCode: daily.weathercode[index],
      maxTemp: Math.round((daily.temperature_2m_max[index] - 32) * (5 / 9)),
    };
  });
}

function parseHourlyWeather({ hourly, current_weather }) {
  return hourly.time
    .map((time, index) => {
      return {
        timestamp: time * 1000,
        iconCode: hourly.weathercode[index],
        temp: Math.round((hourly.temperature_2m[index] - 32) * (5 / 9)),
        feelsLike: Math.round(
          (hourly.apparent_temperature[index] - 32) * (5 / 9)
        ),
        windSpeed: Math.round(hourly.windspeed_10m[index] * 1.609),
        precip: Math.round(hourly.precipitation[index] * 2.54 * 100) / 100,
      };
    })
    .filter(({ timestamp }) => timestamp >= current_weather.time * 1000);
}
