var game = null;
var accum_time = 0;
var accum_frames = 0;
var accum_frames_max = 25;

$(document).ready(function(){
    game = new CyberWarrior();
});


const fps = 30;
const min_tick = 15;
const tile_size = 32;
const tiles_w = 40;
const tiles_h = 20;
const draw_w = tiles_w * tile_size;
const draw_h = tiles_h * tile_size;
const aspect_ratio = draw_w/draw_h;
