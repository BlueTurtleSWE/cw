var CyberWarrior = Class.extend({
    init: function () {
        // Init basic vars
        this._window = $(window);
        this._loading = true;
        this._ms_p_f = 1000.0 / fps;
        this._timer_id = null;
        this._lasttime = null;
        this._canvas_obj = $('canvas#main');
        this._gravity = null;
        this._viewport = null;
        this._objects = new Array();
        this._level = 0;

        // Init physics
        this._world = Physics({
            timestep: 1000.0 / 160,
            maxIPF: 16
        });

        // Setup html elements
        this._canvas_obj.css('background-color', 'rgba(255, 0, 50, 128)');
        this.resize();
        var go = this;
        this._window.resize(function (e) {
            go.resize();
        });
        this._window.keydown(function (e) {
            go.keydown(e);
        });
        this._window.keyup(function (e) {
            go.keyup(e);
        });

        $('#swap').hide();
        $('#dirty').hide();

        this.reset();
        this.finished_loading();
    },
    _parse_horizontal_block: function (sx, sy) {
        var tile_count = 1;
        for (var sx_end = sx + 1; sx_end < tiles_w; ++sx_end) {
            if (cw_course_data[this._level][sy].charAt(sx_end) == '-' ||
                cw_course_data[this._level][sy].charAt(sx_end) == '+') {
                ++tile_count;
            }
            else {
                break;
            }
        }

        var rect = Physics.body('rectangle', {
            x: ((2 * sx + tile_count) / 2) * tile_size,
            y: sy * tile_size + tile_size / 2,
            treatment: 'static',
            cof: 0.1,
            restitution: 0.99,
            width: tile_size * tile_count,
            height: tile_size/2,
            view: 'h_platform'
        });
        return rect;
    },
    _parse_vertical_block: function (sx, sy) {
        var tile_count = 1;
        for (var sy_end = sy + 1; sy_end < tiles_h; ++sy_end) {
            if (cw_course_data[this._level][sy_end].charAt(sx) == '|' ||
                cw_course_data[this._level][sy_end].charAt(sx) == '+'
            ) {
                ++tile_count;
            }
            else {
                break;
            }
        }
        var my_height = tile_count==1?tile_size:(tile_count-1)*tile_size;
        var rect = Physics.body('rectangle', {
            x: sx * tile_size + tile_size / 2,
            y: ((2 * sy + tile_count) / 2) * tile_size,
            treatment: 'static',
            cof: 0.1,
            restitution: 0.99,
            width: tile_size/2,
            height: my_height,
            view: 'v_platform'
        });
        return rect;
    },
    reset: function () {
        bugme.log("Reset game");
        // Setup gravity
        if (this._gravity == null) {
            this._gravity = Physics.behavior('constant-acceleration', {
                acc: {x: 0, y: 0.0004}
            });
            this._viewport = Physics.aabb(0, 0, draw_w, draw_h);
            var edge_bounce = Physics.behavior('edge-collision-detection', {
                aabb: this._viewport,
                restitution: 0.99,
                cof: 0.1
            });
            this._world.add([
                this._gravity,
                edge_bounce,
                Physics.behavior('body-collision-detection'),
                Physics.behavior('body-impulse-response'),
                Physics.behavior('sweep-prune')
            ]);
        }

        // Empty world
        //var objects = this._world.getBodies();
        for (var i = 0; i < this._objects.length; ++i) {
            this._world.removeBody(this._objects[i]);
        }
        this._objects = new Array();

        // Add objects
        for (var my = 0; my < tiles_h; ++my) {
            for (var mx = 0; mx < tiles_w; ++mx) {
                var ch = cw_course_data[this._level][my].charAt(mx);
                if (ch == '-') {
                    if (mx == 0 || (cw_course_data[this._level][my].charAt(mx - 1) != '-'
                        && cw_course_data[this._level][my].charAt(mx - 1) != '+')) {
                        var rect = this._parse_horizontal_block(mx, my);
                        this._objects.push(rect);
                    }
                }
                else if (ch == '|') {
                    if (my == 0 || (cw_course_data[this._level][my - 1].charAt(mx) != '|'
                        && cw_course_data[this._level][my - 1].charAt(mx) != '+')) {
                        var rect = this._parse_vertical_block(mx, my);
                        this._objects.push(rect);
                    }
                }
                else if (ch == '+') {
                    if (mx == 0 || (cw_course_data[this._level][my].charAt(mx - 1) != '-'
                        && cw_course_data[this._level][my].charAt(mx - 1) != '+')) {
                        var rect = this._parse_horizontal_block(mx, my);
                        this._objects.push(rect);
                    }
                    if (my == 0 || (cw_course_data[this._level][my - 1].charAt(mx) != '|'
                        && cw_course_data[this._level][my - 1].charAt(mx) != '+')) {
                        var rect = this._parse_vertical_block(mx, my);
                        this._objects.push(rect);
                    }
                }
                else if (ch == 'C') {
                    var ball = Physics.body('circle', {
                        x: mx * tile_size + tile_size / 2,
                        y: my * tile_size + tile_size / 2,
                        vx: 0.1,
                        vy: 0,
                        cof: 0.1,
                        restitution: 0.99,
                        radius: tile_size / 2,
                        view: 'ball'
                    });
                    this._objects.push(ball);
                }
                else if (ch == 'E') {
                    var rect = Physics.body('rectangle', {
                        x: mx * tile_size + tile_size / 2,
                        y: my * tile_size + tile_size / 2,
                        treatment: 'static',
                        cof: 0.1,
                        restitution: 0.99,
                        width: tile_size,
                        height: tile_size,
                        view: 'exit'
                    });
                    this._objects.push(rect);
                }
            }
        }

        this._world.add(this._objects);
    },
    finished_loading: function () {
        this._canvas_obj[0].width = draw_w;
        this._canvas_obj[0].height = draw_h;

        this._canvas_obj.show();
        $('#loader').hide();
        this._loading = false;

        this.start();
    },
    draw: function () {
        //this._world.render();
        this._canvas_obj.clearCanvas();
        //var objects = this._world.getBodies();
        for (var i = 0; i < this._objects.length; ++i) {
            var pos = this._objects[i].state.pos;
            var view = this._objects[i].view;
            if (view == 'ball') {
                this._canvas_obj.drawArc({
                    fillStyle: 'white',
                    x: pos.x,
                    y: pos.y,
                    radius: 16
                });
            }
            else if (view == 'h_platform') {
                var width = this._objects[i].width;
                var height = this._objects[i].height;
                this._canvas_obj.drawRect({
                    fillStyle: '#aaf',
                    x: pos.x,
                    y: pos.y,
                    width: width,
                    height: height
                });
            }
            else if (view == 'v_platform') {
                var width = this._objects[i].width;
                var height = this._objects[i].height;
                this._canvas_obj.drawRect({
                    fillStyle: '#afa',
                    x: pos.x,
                    y: pos.y,
                    width: width,
                    height: height
                });
            }
            else if (view == 'exit') {
                this._canvas_obj.drawRect({
                    fillStyle: 'blue',
                    x: pos.x,
                    y: pos.y,
                    width: tile_size,
                    height: tile_size
                });
            }            // TODO: Rotate object with state.angular.pos
        }
        if (accum_frames >= accum_frames_max - 1) {
            var pos = this._objects[0].state.pos;
            bugme.log("Drawing circle at " + pos.x + ":" + pos.y);
        }
    },
    tick: function () {
        this._timer_id = null;
        var curr_time = (new Date()).getTime();
        var time_delta = (curr_time - this._lasttime);
        if (time_delta > 3 * this._ms_p_f) {
            time_delta = 3 * this._ms_p_f;
        }
        curr_time = this._lasttime + time_delta;

        this._world.step(curr_time);
        time_delta = 0;
        this.draw();

        this._lasttime = curr_time;
        var go = this;
        var frame_time = (new Date()).getTime() - this._lasttime;
        var timeout = Math.max(this._ms_p_f - frame_time, min_tick);
        this._timer_id = setTimeout(function () {
            go.tick();
        }, timeout);

        if (this._objects[0].state.pos.y > draw_h * 2) {
            this.reset();
        }

        accum_time += (new Date()).getTime() - curr_time;
        ++accum_frames;
        if (accum_frames >= accum_frames_max) {
            bugme.log("Draw time: " + (accum_time / accum_frames));
            accum_time = 0;
            accum_frames = 0;
        }
    },
    keydown: function (e) {
        bugme.log(bugme.dump(e.keyCode));
        switch (e.keyCode) {
            case 32:
                if (this._timer_id != null) {
                    this.stop();
                }
                else {
                    this.start();
                }
                break;
            case 27:
                this.reset();
                break;
            case 112:
                // F1
                break;
            case 113:
                // F2
                break;
            case 114:
                // F3
                break;
        }
    },
    keyup: function (e) {
        //bugme.log(bugme.dump(e.keyCode));
    },
    resize: function () {
        this.stop();
        var ww = $(window).width();
        var wh = $(window).height();
        if (ww / wh > aspect_ratio) {
            ww = aspect_ratio * wh;
        }
        else {
            wh = ww / aspect_ratio;
        }
        this._canvas_obj.width(ww);
        this._canvas_obj.height(wh);
        if (!this._loading) {
            this.draw();
            this.start();
        }
    },
    start: function () {
        bugme.assert(this._timer_id == null, 'Game started twice!');
        var go = this;
        this._timer_id = setTimeout(function () {
            go.tick();
        }, this._ms_p_f);
        this._lasttime = (new Date()).getTime();
        if (this._world) {
            this._world.unpause();
        }
    },
    stop: function () {
        if (this._timer_id != null) {
            clearInterval(this._timer_id);
            this._timer_id = null;
            if (this._world) {
                this._world.pause();
            }
        }
    }
});