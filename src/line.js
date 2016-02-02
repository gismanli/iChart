(function () {
    'use strict';

    var methods = iChart.methods;

    var defaultConfig = {
        // Grid相关配置
        scaleGridLines: true,
        scaleGridLineColor: "rgba(0,0,0,.05)",
        scaleGridLineWidth: 1,
        scaleShowHorizontalLines: true,
        scaleShowVerticalLines: true,
        // 贝塞尔曲线
        bezierCurve: false,
        bezierCurveTension: 0.4,
        // 控制点样式
        symbol: true,
        symbolRadius: 4,
        symbolStrokeWidth: 1,
        // 线条样式
        seriesStroke: true,
        seriesStrokeWidth: 2,
        // 是否填充
        seriesFill: true,
        // Grid Scale
        offsetGridLines: false
    };

    iChart.Type.extend({
        name: 'Line',
        defaults: defaultConfig,
        initialize: function (data) {
            this.PointClass = iChart.Point.extend({
                offsetGridLines: this.options.offsetGridLines,
                strokeWidth: this.options.symbolStrokeWidth,
                radius: this.options.symbolRadius,
                display: this.options.symbol,
                ctx: this.chart.ctx,
                inRange: function (mouseX) {
                    return (Math.pow(mouseX - this.x, 2) < Math.pow(this.radius + this.hitDetectionRaiudL, 2));
                }
            });

            this.datasets = [];

            methods.each(data.series, function (dataset) {
                var datasetObject = {
                    label: dataset.bael || null,
                    fillColor: dataset.fillColor,
                    strokeColor: dataset.strokeColor,
                    pointColor: dataset.pointColor,
                    pointStorkeColor: dataset.pointStorkeColor,
                    points: []
                };

                this.datasets.push(datasetObject);

                methods.each(dataset.data, function (dataPoint, index) {
                    datasetObject.points.push(new this.PointClass({
                        value : dataPoint,
                        label : data.labels[index],
                        datasetLabel: dataset.label,
                        strokeColor : dataset.pointStrokeColor,
                        fillColor : dataset.pointColor,
                        highlightFill : dataset.pointHighlightFill || dataset.pointColor,
                        highlightStroke : dataset.pointHighlightStroke || dataset.pointStrokeColor
                    }));
                }, this);

                this.buildScale(data.labels);

                this.eachPoints(function (point, index) {
                    methods.extend(point, {
                        x: this.scale.calculateX(index),
                        y: this.scale.endPoint
                    });
                    point.save()
                }, this);

            }, this);

            this.render();
        },
        update: function (){
            this.scale.update();
            methods.each(this.activeElements, function (activeElements) {
                activeElements.restore(['fillColor', 'strokeColor']);
            });
            this.eachPoints(function (point) {
                point.save();
            });
            this.render();
        },
        eachPoints: function (cb) {
            methods.each(this.datasets, function (dataset) {
                methods.each(dataset.points, cb, this);
            }, this);
        },
        draw: function (ease) {
            var easingDecimal = ease || 1;
            this.clear();

            var ctx = this.chart.ctx;

            var hasValue = function (item) {
                return item && item.value !== null;
            },
            nextPoint = function (point, collection, index) {
                return methods.findNextWhere(collection, hasValue, index) || point;
            },
            previousPoint = function (point, collection, index) {
                return methods.findPreviousWhere(collection, hasValue, index) || point;
            };

            if (!this.scale) return;
            this.scale.draw(easingDecimal);

            methods.each(this.datasets, function (dataset) {
                var pointsWithValues = methods.where(dataset.points, hasValue);

                methods.each(dataset.points, function (point, index) {
                    if (point.hasValue()) {
                        point.transition({
                            y: this.scale.calculateY(point.value),
                            x: this.scale.calculateX(index)
                        }, easingDecimal);
                    }
                }, this);
                if (this.options.bezierCurve){
                    methods.each(pointsWithValues, function(point, index){
                        var tension = (index > 0 && index < pointsWithValues.length - 1) ? this.options.bezierCurveTension : 0;
                        point.controlPoints = methods.splineCurve(
                            previousPoint(point, pointsWithValues, index),
                            point,
                            nextPoint(point, pointsWithValues, index),
                            tension
                        );

                        if (point.controlPoints.outer.y > this.scale.endPoint){
                            point.controlPoints.outer.y = this.scale.endPoint;
                        }
                        else if (point.controlPoints.outer.y < this.scale.startPoint){
                            point.controlPoints.outer.y = this.scale.startPoint;
                        }

                        if (point.controlPoints.inner.y > this.scale.endPoint){
                            point.controlPoints.inner.y = this.scale.endPoint;
                        }
                        else if (point.controlPoints.inner.y < this.scale.startPoint){
                            point.controlPoints.inner.y = this.scale.startPoint;
                        }
                    },this);
                }

                ctx.lineWidth = this.options.seriesStrokeWidth;
                ctx.strokeStyle = dataset.strokeColor;
                ctx.beginPath();

                methods.each(pointsWithValues, function (point, index) {
                    if (index === 0) {
                        ctx.moveTo(point.x, point.y);
                    }
                    else {
                        if (this.options.bezierCurve) {
                            var previous = previousPoint(point, pointsWithValues, index);

                            ctx.bezierCurveTo(
                                previous.controlPoints.outer.x,
                                previous.controlPoints.outer.y,
                                point.controlPoints.inner.x,
                                point.controlPoints.inner.y,
                                point.x,
                                point.y
                            );
                        }
                        else {
                            ctx.lineTo(point.x, point.y);
                        }
                    }
                }, this);

                if (this.options.seriesStroke) {
                    ctx.stroke();
                    // ctx.closePath();
                }

                if (this.options.seriesFill && pointsWithValues.length > 0) {
                    ctx.lineTo(pointsWithValues[pointsWithValues.length - 1].x, this.scale.endPoint);
                    ctx.lineTo(pointsWithValues[0].x, this.scale.endPoint);
                    ctx.fillStyle = dataset.fillColor;
                    ctx.closePath();
                    ctx.fill();
                }

                methods.each(pointsWithValues, function (point) {
                    point.draw();
                });

            }, this);
        },
        buildScale: function(labels){
            var self = this;

            var dataTotal = function(){
                var values = [];
                self.eachPoints(function(point){
                    values.push(point.value);
                });

                return values;
            };

            var scaleOptions = {
                height: this.chart.height,
                width: this.chart.width,
                ctx: this.chart.ctx,
                textColor: this.options.scaleFontColor,
                offsetGridLines: this.options.offsetGridLines,
                fontSize: this.options.scaleFontSize,
                fontStyle: this.options.scaleFontStyle,
                fontFamily: this.options.scaleFontFamily,
                valuesCount: labels.length,
                beginAtZero: this.options.scaleBeginAtZero,
                integersOnly: this.options.scaleIntegersOnly,
                calculateYRange: function(currentHeight){
                    var updatedRanges = methods.calculateScaleRange(
                        dataTotal(),
                        currentHeight,
                        this.fontSize,
                        this.beginAtZero,
                        this.integersOnly
                    );
                    methods.extend(this, updatedRanges);
                },
                xLabels: labels,
                font: methods.fontString(this.options.scaleFontSize, this.options.scaleFontStyle, this.options.scaleFontFamily),
                lineWidth: this.options.scaleLineWidth,
                lineColor: this.options.scaleLineColor,
                showHorizontalLines: this.options.scaleShowHorizontalLines,
                showVerticalLines: this.options.scaleShowVerticalLines,
                gridLineWidth: (this.options.scaleGridLines) ? this.options.scaleGridLineWidth : 0,
                gridLineColor: (this.options.scaleGridLines) ? this.options.scaleGridLineColor : "rgba(0,0,0,0)",
                padding: (this.options.showScale) ? 0 : this.options.symbolRadius + this.options.symbolStrokeWidth,
                showLabels: this.options.scaleShowLabels,
                display: this.options.showScale
            };

            this.scale = new iChart.Scale(scaleOptions);
        },
    });

})(this || window)