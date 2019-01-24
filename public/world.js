var tl_state = {markers:[]};
var tl_canvas;
var tl_scaleState = {};
var mapImage = new Image();

const IMAGE_WIDTH = 2917;
const IMAGE_HEIGHT = 1535;
const MAP_SIZE = 1;
const FULL_CIRCLE = (Math.PI / 180) * 360;

function setReadyCallback(callback) {
  mapImage.onload = callback;
  mapImage.src = 'world.png';
}

function tl_init(container) {
  console.log("Initialised");
  window.requestAnimationFrame(tl_int_tick);

  container.on('click', function (event) {
    var x = event.offsetX - tl_scaleState.map.offset.x;
    var y = event.offsetY;
    x /= tl_scaleState.map.size.width;
    y /= tl_scaleState.map.size.height;
    tl_state.markers.push({
      x: x,
      y: y
    })
    view_updatePosition(x,y);
  });

}

function tl_resize(canvasCtx, width, height) {
  console.log("Resized to " + width + "," + height);

  tl_canvas = canvasCtx;
  tl_scaleState.width = width;
  tl_scaleState.height = height;
  tl_scaleState.timelineHeight = height * 0.01;
  tl_scaleState.padding = 8;
  tl_scaleState.targetRadius = Math.min(width, height) * 0.05;

  var res = scaleRatio(width, height * MAP_SIZE, IMAGE_WIDTH, IMAGE_HEIGHT);

  tl_scaleState.map = {};
  tl_scaleState.date = {};
  tl_scaleState.stats = {};
  tl_scaleState.map.offset = {
    x: (width - res[0]),
    y: (height * MAP_SIZE - res[1]) / 2
  };
  tl_scaleState.map.size = {
    width: res[0],
    height: res[1] * MAP_SIZE
  };
}

function tl_clear_markers() {
  tl_state.markers = [];
}

function tl_int_tick() {
  tl_int_drawBackground();
  tl_int_drawMarkers();

  window.requestAnimationFrame(tl_int_tick);
}

function tl_int_drawBackground() {

  tl_canvas.fillStyle = 'rgb(0, 0, 50)';

  tl_canvas.fillRect(0, 0, tl_scaleState.width, tl_scaleState.height);

  tl_canvas.drawImage(mapImage, tl_scaleState.map.offset.x, tl_scaleState.map.offset.y, tl_scaleState.map.size.width, tl_scaleState.map.size.height);
}

function tl_int_drawMarkers() {
  
  tl_state.markers.forEach((active) => {
    const isLast = (tl_state.markers[tl_state.markers.length - 1] == active);

    tl_canvas.fillStyle = 'rgba(255,255,150, 0.3)'

    if (isLast) {
      tl_canvas.fillStyle = 'rgb(255,255,150)'
    }

    var x = tl_scaleState.map.offset.x + (tl_scaleState.map.size.width * active.x);
    var y = tl_scaleState.map.offset.y + (tl_scaleState.map.size.height * active.y);

    tl_canvas.beginPath();
    tl_canvas.arc(x, y, 3, 0, FULL_CIRCLE, true);
    tl_canvas.fill();
  });
}

function scaleRatio(containerWidth, containerHeight, imageWidth, imageHeight) {
  var targetWidth = containerWidth;
  var targetHeight = containerHeight;

  var resImage = imageWidth / imageHeight;
  var resTarget = targetWidth / targetHeight;

  var factor = (resTarget > resImage) ? targetHeight / imageHeight : targetWidth / imageWidth;

  return [imageWidth * factor, imageHeight * factor];
}