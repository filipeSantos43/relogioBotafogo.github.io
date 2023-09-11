"use strict";

var canvas = document.getElementById("clock");

var context = canvas.getContext("2d");

var ctx = document.getElementById("handles").getContext("2d");

const pi = Math.PI;

const fiveMin = pi / 6;

var style = getComputedStyle(document.head);

const grena = style.getPropertyValue("--cgrena");

const green = style.getPropertyValue("--cgreen");

const orange = style.getPropertyValue("--corange");

const white = style.getPropertyValue("--cwhite");

const white1 = style.getPropertyValue("--cwhite1");

const white2 = style.getPropertyValue("--cwhite2");

const white3 = style.getPropertyValue("--cwhite3");

var clockRadius = Math.min(canvas.width, canvas.height) / 3.1;

var center = [canvas.width / 2, canvas.height / 2];

var cityOffset = null;

function imgSize(w, h, r) {
  let d = 2 * r * 0.8;
  return [(d * w) / h, d];
}

function setFont(size) {
  return `bold ${1.2 * size}px arial`;
}

function polar2Cartesian(radius, angle) {
  angle -= pi / 2;
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
  };
}

function translate(pos, vec) {
  return {
    x: pos.x + vec[0],
    y: pos.y + vec[1],
  };
}

function scale(pos, vec) {
  return {
    x: pos[0] * vec[0],
    y: pos[1] * vec[1],
  };
}

function circle(center, radius, fill = true) {
  context.beginPath();
  context.arc(center[0], center[1], radius, 0, 2 * pi);
  if (fill) context.fill();
  else context.stroke();
}

function arc(center, radius, t1, t2, fill = true) {
  let [arcInit, arcEnd] = [t1, t2].map((t) => {
    let [hour, minutes] = t.split(":").map((q) => Number(q));
    return 0.5 * (fiveMin * (hour + minutes / 60) - pi);
  });

  context.beginPath();
  context.arc(center[0], center[1], radius, arcInit, arcEnd);
  if (fill) context.fill();
  else context.stroke();
}

async function readZones() {
  const requestURL = `${location.protocol}/cwdc/10-html5css3/clock/localtime.json`;
  const request = new Request(requestURL);

  const response = await fetch(request);
  const timeZonesText = await response.text();
  const timeZones = JSON.parse(timeZonesText);

  return timeZones;
}

function drawClock(place) {

  const img = new Image();
  img.src = "./rolex_bezel.png";
  img.decode().then(() => {

    let size = imgSize(img.width, img.height, 1.8 * clockRadius);
    var coord = translate(scale(size, [-1 / 2, -1 / 2]), center);
    context.drawImage(img, coord.x, coord.y, size[0], size[1]);

    const logo = new Image();
    logo.src = "./botafogo.png";
    logo.decode().then(() => {

      let size = imgSize(logo.width, logo.height, 0.9 * clockRadius);
      var coord = translate(scale(size, [-1 / 2, -1 / 2]), center);
      context.drawImage(logo, coord.x, coord.y, size[0], size[1]);

      context.strokeStyle = grena;
      context.fillStyle = white;
      circle(center, 10);
      circle(center, 10, false);
    });
  });

  context.strokeStyle = grena;
  context.lineWidth = 3;
  circle(center, clockRadius - 8, false);

  navigator.geolocation.getCurrentPosition(
    (position) => {

      drawArc({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    () => {

      (async () => {
        let tz = await readZones();

        let city = tz.cities.filter(function (c) {
          return c.city == place;
        })[0];
        if (city) {
          let lat = city.coordinates.latitude;
          let lng = city.coordinates.longitude;
          drawArc({ latitude: lat, longitude: lng }, city.offset);
        }
        window.onkeydown = function (event) {
          if (event.key === "n" || event.key === "N") {
            let index = localStorage.getItem("placeIndex") || 0;
            index = (+index + (event.key === "n" ? 1 : -1)).mod(
              tz.cities.length
            );
            localStorage.setItem("placeIndex", String(index));
            city = tz.cities[index];
            window.location.href =
              window.location.href.split("?")[0] +
              `?timeZone=${city.region}/${city.city}`;
          } else if (event.key === "Escape" || event.key === "e") {
            if (event.metaKey || event.ctrlKey) {
              localStorage.clear();
              alert("Local storage has been cleared");
            }
          } else if (event.key == "b") {
            window.location.href = "/cwdc";
          } else if (event.key == "B") {
            let path = window.location.pathname;
            window.location.href = path.split("/", 3).join("/");
          }
        };
      })();
    }
  );

  Number.prototype.mod = function (b) {
    return ((this % b) + b) % b;
  };

  function drawArc(loc, utcoff) {
    let today = new Date();
    let times = SunCalc.getTimes(today, loc.latitude, loc.longitude);

    let offset;
    let timezoneOffset = today.getTimezoneOffset() / 60;
    if (typeof utcoff === "undefined") {
      offset = 0;
      cityOffset = -timezoneOffset;
    } else {
      offset = timezoneOffset + utcoff;
      cityOffset = utcoff;
    }

    let sunriseStr =
      times.sunrise.getHours() + offset + ":" + times.sunrise.getMinutes();

    let sunsetStr =
      times.sunset.getHours() + offset + ":" + times.sunset.getMinutes();

    console.log(sunriseStr, sunsetStr);
    context.strokeStyle = orange;
    arc(center, clockRadius - 8, sunriseStr, sunsetStr, false);
  }

  context.textAlign = "center";
  context.textBaseline = "middle";

  context.font = setFont(clockRadius / 10);
  drawClock.romans.map((n, i) => {
    context.fillStyle = n.c;
    var coord = polar2Cartesian(0.85 * clockRadius, i * fiveMin);

    coord = translate(coord, center);
    context.fillText(n.txt, coord.x, coord.y);
  });

  context.font = setFont(clockRadius / 20);
  drawClock.decimals.map((n, i) => {
    context.fillStyle = n.c;

    var coord = polar2Cartesian(1.01 * clockRadius, i * fiveMin * 0.5);

    coord = translate(coord, center);
    context.fillText(n.txt, coord.x, coord.y);
  });
}

drawClock.romans = [
  { txt: "XII", c: white1 },
  { txt: "XI", c: white1 },
  { txt: "X", c: white1 },
  { txt: "IX", c: grena },
  { txt: "VIII", c: white1 },
  { txt: "VII", c: white1 },
  { txt: "VI", c: white1 },
  { txt: "V", c: white1 },
  { txt: "IV", c: white1 },
  { txt: "III", c: grena },
  { txt: "II", c: white1 },
  { txt: "I", c: white1 },
];

drawClock.decimals = Array.from(Array(24), (_, i) => {
  return { txt: String(i), c: white2 };
});
drawClock.decimals[0].txt = "24";
drawClock.decimals[6].c = white3;
drawClock.decimals[18].c = white3;

var runAnimation = (() => {

  const clock_handles = [
    { width: 8, length: 0.5, c: orange },
    { width: 8, length: 0.8, c: orange },
    { width: 2, length: 0.9, c: orange },
    { width: 1, length: 0.95, c: white3 },
  ];
  const oneMin = pi / 30; 
  let timer = null;

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  var tz = urlParams.get("timeZone") || timezone;
  var city = tz.split("/")[1];

  function drawHandles() {

    while (true) {
      try {
        var today = new Date();
        var [day, month, year, hours, minutes, seconds] = today
          .toLocaleString("en-GB", { timeZone: tz })
          .slice()
          .split(/:|\/|,/);
        break;
      } catch (e) {
        if (e instanceof RangeError) {
          tz = timezone;
        } else {
          console.log(e);
          throw new Error("By, bye. See you later, alligator.");
        }
      }
    }

    let hours12 = hours % 12 || 12;

  clock_handles[0].time2Angle = 2 * pi - (fiveMin * (+hours12 + minutes / 60));
clock_handles[1].time2Angle = 2 * pi - (oneMin * (+minutes + seconds / 60));
clock_handles[2].time2Angle = 2 * pi - (oneMin * seconds);
clock_handles[3].time2Angle = 2 * pi - (fiveMin * (+hours + minutes / 60) * 0.5);


    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let date = `${day} / ${month} / ${year}`;
    let utc = `UTC ${cityOffset}`;
    let [region, city] = tz.split("/");
    let [tcity, tregion, tlen, tutc] = [city, region, date, utc].map((p) =>
      ctx.measureText(p)
    );
    let theight = clockRadius / 15;
    ctx.font = setFont(theight);
    ctx.fillStyle = white1;
    [
      [date, tlen],
      [city, tcity],
      [region, tregion],
      [utc, tutc],
    ].map((p, i) => {
      ctx.fillText(
        p[0],
        2 * center[0] - p[1].width,
        2 * center[1] - i * theight
      );
    });

    ctx.lineCap = "round";

    clock_handles.map((handle) => {
      ctx.strokeStyle = handle.c;
      ctx.beginPath();
      coord = polar2Cartesian(0.057 * clockRadius, handle.time2Angle);
      coord = translate(coord, center);
      ctx.moveTo(coord.x, coord.y);

      var coord = polar2Cartesian(
        handle.length * clockRadius,
        handle.time2Angle
      );
      coord = translate(coord, center);
      ctx.lineTo(coord.x, coord.y);
      ctx.lineWidth = handle.width;
      ctx.stroke();
    });
    cancelAnimationFrame(timer);
    timer = requestAnimationFrame(drawHandles);
  }
  drawClock(city);
  timer = requestAnimationFrame(drawHandles);
  return drawHandles;
})();