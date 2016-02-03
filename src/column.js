(function () {
    'use strict'

    var methods = iChart.methods;

    var defaultConfig = {
        columnValueSpacing : 10,
        columnSeriesSpacing: 5
    };

    iChart.Type.extend({
        name: 'Column',
        defaults: defaultConfig,
        initialize: function (data) {
            var options = this.options;

            this.ScaleClass = iChart.Scale.extend({
                offsetGridLines : true,
                calculateBarX : function(datasetCount, datasetIndex, barIndex){
                    var xWidth = this.calculateBaseWidth(),
                        xAbsolute = this.calculateX(barIndex) - (xWidth/2),
                        barWidth = this.calculateBarWidth(datasetCount);

                    return xAbsolute + (barWidth * datasetIndex) + (datasetIndex * options.columnSeriesSpacing) + barWidth / 2;
                },
                calculateBaseWidth : function(){
                    return (this.calculateX(1) - this.calculateX(0)) - ( 2 * options.columnValueSpacing);
                },
                calculateBarWidth : function(datasetCount){
                    var baseWidth = this.calculateBaseWidth() - ((datasetCount - 1) * options.columnSeriesSpacing);
                    return (baseWidth / datasetCount);
                }
            });

            this.ColumnClass = iChart.Rectangle.extend({
                ctx: this.chart.ctx,
                strokeWidth: this.options.barStrokeWidth,
                showStroke : this.options.barShowStroke
            });

            this.series = [];

            methods.each(data.series, function (series) {
                var seriesObject = {
                    label: series.label,
                    fillColor: series.fillColor,
                    strokeColor: series.strokeColor,
                    column: []
                };

                this.series.push(seriesObject);

                methods.each(series.data, function (dataPoint, index) {
                    seriesObject.column.push(new this.ColumnClass({
                        value: dataPoint,
                        label: data.labels[index],
                        strokeColor: series.strokeColor,
                        fillColor: series.fillColor,
                        seriesLabel: series.label
                    }));
                }, this);
            }, this);

            this.buildScale(data.labels);
            this.ColumnClass.prototype.base = this.scale.endPoint;

            this.eachColumns(function(bar, index, datasetIndex){
                methods.extend(bar, {
                    width: this.scale.calculateBarWidth(this.series.length),
                    x: this.scale.calculateBarX(this.series.length, datasetIndex, index),
                    y: this.scale.endPoint
                });
                bar.save();
            }, this);

            this.render();

        },
        draw : function(ease){
            var easingDecimal = ease || 1;
            this.clear();

            var ctx = this.chart.ctx;

            this.scale.draw(easingDecimal);

            methods.each(this.series, function(dataset, datasetIndex){
                methods.each(dataset.column, function(bar, index){
                    if (bar.hasValue()){
                        bar.base = this.scale.endPoint;
                        bar.transition({
                            x: this.scale.calculateBarX(this.series.length, datasetIndex, index),
                            y: this.scale.calculateY(bar.value),
                            width : this.scale.calculateBarWidth(this.series.length)
                        }, easingDecimal).draw();
                    }
                },this);

            },this);
        },
        eachColumns: function (cb) {
            methods.each(this.series, function(item, index) {
                methods.each(item.column, cb, this, index);
            }, this);
        },
        buildScale: function (labels) {
            var self = this;

            var dataTotal = function () {
                var values = [];
                self.eachColumns(function (column) {
                    values.push(column.value);
                });
                return values;
            }

            var scaleOptions = {
                height : this.chart.height,
                width : this.chart.width,
                ctx : this.chart.ctx,
                textColor : this.options.scaleFontColor,
                fontSize : this.options.scaleFontSize,
                fontStyle : this.options.scaleFontStyle,
                fontFamily : this.options.scaleFontFamily,
                valuesCount : labels.length,
                beginAtZero : this.options.scaleBeginAtZero,
                integersOnly : this.options.scaleIntegersOnly,
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
                xLabels : labels,
                font : methods.fontString(this.options.scaleFontSize, this.options.scaleFontStyle, this.options.scaleFontFamily),
                lineWidth : this.options.scaleLineWidth,
                lineColor : this.options.scaleLineColor,
                showHorizontalLines : this.options.scaleShowHorizontalLines,
                showVerticalLines : this.options.scaleShowVerticalLines,
                gridLineWidth : (this.options.scaleShowGridLines) ? this.options.scaleGridLineWidth : 0,
                gridLineColor : (this.options.scaleShowGridLines) ? this.options.scaleGridLineColor : "rgba(0,0,0,0)",
                padding : (this.options.showScale) ? 0 : (this.options.barShowStroke) ? this.options.barStrokeWidth : 0,
                showLabels : this.options.scaleShowLabels,
                display : this.options.showScale
            };

            this.scale = new this.ScaleClass(scaleOptions);
        }
    })

})(this)