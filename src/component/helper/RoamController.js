/**
 * @module echarts/component/helper/RoamController
 */

define(function (require) {

    var Eventful = require('zrender/mixin/Eventful');
    var zrUtil = require('zrender/core/util');

    function mousedown(e) {
        if (e.target && e.target.draggable) {
            return;
        }

        var x = e.offsetX;
        var y = e.offsetY;
        var rect = this.rect;
        if (rect && rect.contain(x, y)) {
            this._x = x;
            this._y = y;
            this._dragging = true;
        }
    }

    function mousemove(e) {
        if (this._dragging && !this._pinching) {
            var rawE = e.event;
            rawE.preventDefault && rawE.preventDefault();

            var x = e.offsetX;
            var y = e.offsetY;

            var dx = x - this._x;
            var dy = y - this._y;

            this._x = x;
            this._y = y;

            var target = this.target;

            if (target) {
                var pos = target.position;
                pos[0] += dx;
                pos[1] += dy;
                target.dirty();
            }

            this.trigger('pan', dx, dy);
        }
    }

    function mouseup(e) {
        this._dragging = false;
    }

    function mousewheel(e) {
        var scale = e.wheelDelta > 0 ? 1.1 : 1 / 1.1;
        zoom.call(this, e, scale);
    }

    function pinchstart() {
        this._pinching = true;
    }

    function pinchchange(e) {
        var scale = e.deltaScale > 1 ? 1.1 : 1 / 1.1;
        zoom.call(this, e, scale);
    }

    function pinchend() {
        this._pinching = false;
    }

    function zoom(e, eventScale) {
        var mouseX = e.offsetX;
        var mouseY = e.offsetY;
        var rect = this.rect;

        if (rect && rect.contain(mouseX, mouseY)) {

            var target = this.target;

            if (target) {
                var pos = target.position;
                var scale = target.scale;

                var newZoom = this._zoom = this._zoom || 1;
                newZoom *= eventScale;
                // newZoom = Math.max(
                //     Math.min(target.maxZoom, newZoom),
                //     target.minZoom
                // );
                var zoomScale = newZoom / this._zoom;
                this._zoom = newZoom;
                // Keep the mouse center when scaling
                pos[0] -= (mouseX - pos[0]) * (zoomScale - 1);
                pos[1] -= (mouseY - pos[1]) * (zoomScale - 1);
                scale[0] *= zoomScale;
                scale[1] *= zoomScale;

                target.dirty();
            }

            this.trigger('zoom', eventScale, mouseX, mouseY);
        }
    }

    /**
     * @alias module:echarts/component/helper/RoamController
     * @constructor
     * @mixin {module:zrender/mixin/Eventful}
     *
     * @param {module:zrender/zrender~ZRender} zr
     * @param {module:zrender/Element} target
     * @param {module:zrender/core/BoundingRect} rect
     */
    function RoamController(zr, target, rect) {

        /**
         * @type {module:zrender/Element}
         */
        this.target = target;

        /**
         * @type {module:zrender/core/BoundingRect}
         */
        this.rect = rect;

        // Avoid two roamController bind the same handler
        var bind = zrUtil.bind;
        var mousedownHandler = bind(mousedown, this);
        var mousemoveHandler = bind(mousemove, this);
        var mouseupHandler = bind(mouseup, this);
        var mousewheelHandler = bind(mousewheel, this);
        var pinchstartHandler = bind(pinchstart, this);
        var pinchchangeHandler = bind(pinchchange, this);
        var pinchendHandler = bind(pinchend, this);

        Eventful.call(this);

        /**
         * @param  {boolean} [controlType=true] Specify the control type, which can be only 'pan' or 'zoom'
         */
        this.enable = function (controlType) {
            // Disable previous first
            this.disable();
            if (controlType == null) {
                controlType = true;
            }
            if (controlType && controlType !== 'zoom') {
                zr.on('mousedown', mousedownHandler);
                zr.on('mousemove', mousemoveHandler);
                zr.on('mouseup', mouseupHandler);
            }
            if (controlType && controlType !== 'pan') {
                zr.on('mousewheel', mousewheelHandler);
                zr.on('pinchstart', pinchstartHandler);
                zr.on('pinchchange', pinchchangeHandler);
                zr.on('pinchend', pinchendHandler);
            }
        };

        this.disable = function () {
            zr.off('mousedown', mousedownHandler);
            zr.off('mousemove', mousemoveHandler);
            zr.off('mouseup', mouseupHandler);
            zr.off('mousewheel', mousewheelHandler);
            zr.off('pinchstart', pinchstartHandler);
            zr.off('pinchchange', pinchchangeHandler);
            zr.off('pinchend', pinchendHandler);
        };

        this.dispose = this.disable;

        this.isDragging = function () {
            return this._dragging;
        };

        this.isPinching = function () {
            return this._pinching;
        };
    }

    zrUtil.mixin(RoamController, Eventful);

    return RoamController;
});