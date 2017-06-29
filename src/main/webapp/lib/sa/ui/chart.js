/*
 *  Chart  plugin
 * @date 20141022
 * @requires
 *  js/libs/charts/jqplot/*
 *  js/libs/log4javascript/log4javascript.min.js
 *  js/sa/utils/log4jq.js
 */

;
(function ($) {
    //define plugin name
    var pluginName = 'chart';

    //create plugin class
    function Plugin(element, options) {

        this.logger = log4jq.getLogger({
            loggerName: 'chart.js'
        });

        this.el = element;
        this.$el = $(element);
        this.options = $.extend({}, $.fn[pluginName].defaults, options);

        //jqplot parmeters
        this.jqPlotInstance = null;
        this.jqElemId = null;
        this.jqChart = null;
        this.jqData = []; //store series data
        this.jqSeriesLable = [];//series lables info
        this.jqSampleNum = 20;
        this.jqOptions = null;
        this.jqRenderer = null;

        //constrctor
        this.init();



        return this;
    }
    ;

    Plugin.prototype.name = pluginName;
    Plugin.prototype.version = '0.0.1';

    Plugin.prototype = {
        init: function () {

            var plugin = this;

            //            plugin.jqData = opts.data;// get data from init
            plugin.logger.info('init');
            //            plugin.logger.debug(plugin.jqData);

            //get elem id to craete jqplot
//            var currElemId = plugin.$el.attr('id');
//            plugin.jqElemId = currElemId;
//          plugin.logger.debug('init jqplot to elem id: ' + currElemId);
            plugin.jqElemId = generateElemId();
            plugin.$el.append(generateElemOfPlot(plugin.jqElemId));
            var $chartElem = plugin.$el.find('#' + plugin.jqElemId);
            $chartElem.css('height', plugin.$el.height());

            if (plugin.jqPlotInstance == null) {
                //init default options
                plugin.initJqOptions();
                
                //create jqplot instance
                var initDataSetWithNull = [];

                //沒半條線一定死會噴 Uncaught Error: No data specified
//                plugin.jqPlotInstance =
//                        $.jqplot(plugin.jqElemId, [], plugin.jqOptions);    //init no data

                //假設有多個線只能秀一個label
//                plugin.jqPlotInstance =
//                        $.jqplot(plugin.jqElemId, [[null]], plugin.jqOptions);    //init no data


                //2015/06/10支援多個seriesLabel可以空值時被顯示
                var initData = plugin.initJqDefaultDataSetWithNull();

  
                plugin.jqData = initData;
                plugin.logger.debug('==============FINAL jq opts================');
                console.log(plugin.jqOptions);
                plugin.jqPlotInstance =
                        $.jqplot(plugin.jqElemId, initData, plugin.jqOptions);    //init no data
            } else {

                plugin.logger.warn('jqplot have run');
            }

            var resizeTimer;
            $(window).resize(function () {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function () {
                    plugin.resizePlot();
                }, 200);//!!IMPORTANT Delay
            });
        },
        initJqDefaultDataSetWithNull: function () {
            //added 20150610
            var plugin = this;
            var series = plugin.jqOptions.series;

            var initDataSetWithNull = [];
//            console.log(series);
            if (typeof (series) === 'undefined') {
                //有可能第一次初始化是不給series的值的
                initDataSetWithNull.push([null]);
            } else {
                var seriesIndex = 0;

                if (series.length === 0) {
                    initDataSetWithNull.push([null]);
                } else {
                    //create series data array with Null
                    for (seriesIndex; seriesIndex < series.length; seriesIndex++) {
                        initDataSetWithNull.push([null]);
                    }
                }
            }


            return initDataSetWithNull;
        },
        initJqOptions: function () {

            var plugin = this;

            plugin.logger.info('init jq options');

            var opts = plugin.options;
            console.log(opts);

            //jqplot properties
            var chart = opts.chart;
            var series = opts.series;

            var yaxis = opts.yaxis;
            console.log(yaxis);
            var tickColorOfAxis = opts.theme.axis.tickColor;
            console.log(tickColorOfAxis);
            var seriesColors = opts.seriesColors;
            console.log(seriesColors);
            var placement = opts.legend.placement;
            console.log(placement);

            plugin.jqOptions = {
//                // be assigned to the series.  If there are more series than colors, colors
//                // will wrap around and start at the beginning again.
//                series: [],
                seriesColors: seriesColors,
                axes: {
                    xaxis: {
                        numberTicks: plugin.jqSampleNum,
                        renderer: $.jqplot.DateAxisRenderer, //default x axis with date
                        tickRenderer: $.jqplot.CanvasAxisTickRenderer,
                        tickOptions: {
                            angle: -30
                        }
                    },
//                    yaxis: {
//                        numberTicks: plugin.jqSampleNum
//                    }

                    yaxis: {
//                        min: yaxis.min, 
//                        max: yaxis.max,
//                        min: 5, 
//                        max: 10,
                        numberTicks: 10,
                        tickOptions:{
//                            formatString:'%.1f',
                            textColor: tickColorOfAxis
                        } 
                    }
                },
                seriesDefaults: {
                    shadow: false,
                    shadowOffset: 0 // offset from the line of the shadow.
                            //                    rendererOptions: {
                            //                        smooth: true
                            //                    }
                },
                legend: {
                    show: true,
                    location: opts.legend.location, // compass direction, nw, n, ne, e, se, s, sw, w.
                    placement: placement
                },
                highlighter: {
                    show: true,
                    sizeAdjust: 10,
                    tooltipLocation: 'nw',
                    useAxesFormatters: true,
//                    formatString: '<table class="jqplot-highlighter"><tr><td>x axis: </td><td>%s</td></tr><tr><td>y axis: </td><td>%s</td></tr></table>'
                    //網路找的，沒辦法用
                    tooltipContentEditor: function (str, seriesIndex, pointIndex, jqPlot) {
                        plugin.logger.debug('tooltipContentEditor (x,y): ' + str);
//                        console.log('str: ' + str);// x , y 
//                        console.log('seriesIndex: ' + seriesIndex);
//                        console.log('pointIndex: ' + pointIndex);
//                        console.log(jqPlot.options.axes.xaxis.ticks);
//                        console.log(jqPlot.data[seriesIndex]);

//                console.log(jqPlot);
                        var xAxis =
                                jqPlot.options.axes.xaxis.ticks[parseInt(str) - 1];
//                                str.split(',')[0];
                        

                        var yAxis = str.split(',')[1];//這樣取比較準
                        var newElem = '<table  class="jqplot-highlighter"><tr><td colspan="2">'
                                + jqPlot.series[seriesIndex]["label"] + '</td></tr>'
                                + '<tr><td>x axis: </td><td>' + xAxis + '</td></tr>'
                                //以下這個方法有時候取得的值會異常，例如設成年的時候
//                        +'<tr><td>y axis: </td><td>' + jqPlot.data[seriesIndex][pointIndex] + '</td></tr></table>';
                                + '<tr><td>y axis: </td><td>' + yAxis + '</td></tr></table>';
                        return newElem;

                    }

                },
                grid: {
//                    drawGridLines: false, // wether to draw lines across the grid or not.
//                    gridLineColor: '#b3acac', // *Color of the grid lines.
//                    background: '#fff', // CSS color spec for background color of grid.
//                    borderColor: '#b3acac', // CSS color spec for border around grid.
//                    borderWidth: 0.5, // pixel width of border around grid.
//                    shadow: false, // draw a shadow for grid.

                    background: opts.grid.background,
                    gridLineColor: opts.grid.gridLineColor,
                    borderColor: opts.grid.borderColor,
                    rendererOptions: {}         // options to pass to the renderer.  Note, the default


                },
                cursor: {
                    show: true,
                    tooltipLocation: 'sw'
                }

            };

            console.log('xxx');
            if (chart != null) {
                plugin.logger.debug('jqChart: ' + chart);
                plugin.jqChart = chart;
                plugin.setRenderer(chart);
            }

            //add series name
            if (series.length > 0) {
                plugin.jqSeriesLable = series;
                plugin.jqOptions.series = series;
            }
          
        },
        getSeriseDataIndex: function (sampleSeriesLabel) {
            var plugin = this;
            var sdIndex = -1;
            plugin.logger.info('getSeriseDataIndex: ' + sampleSeriesLabel.label);
            plugin.logger.debug('getSeriseDataIndex length: ' + plugin.jqSeriesLable.length);
            //console.log( plugin.jqSeriesLable);
            //如果初始化沒有設series label，這裡就比對不到
            for (var i = 0; i < plugin.jqSeriesLable.length; i++) {
                var currLb = plugin.jqSeriesLable[i].label;
                plugin.logger.info('getSeriseDataIndex currLb: ' + currLb);
                if (currLb === sampleSeriesLabel.label) {
                    sdIndex = i;
                    break;
                }
            }
            plugin.logger.debug('getSeriseDataIndex sdIndex: ' + sdIndex);
            return sdIndex;
        },
        //update data (DONOT plot data)
        update: function (sampleData, sampleSeriesLabel) {

            var plugin = this;

            plugin.logger.info('update sample data: ' + sampleSeriesLabel.label);
//            plugin.logger.info(plugin.jqData);
            plugin.logger.info(sampleData);

            if (sampleData.length === 0) {
                plugin.logger.warn('sample data is null arr');
                sampleData = [null];
            }

            //add series data
            var sdIndex = plugin.getSeriseDataIndex(sampleSeriesLabel);

            if (sdIndex > -1) {
                //find old data
                plugin.logger.debug('find old series: ' + sdIndex);

                plugin.jqData[sdIndex] = sampleData;

            } else {

                //
                //add series lable
                if (typeof (sampleSeriesLabel) != 'undefined') {

                    plugin.logger.debug('add new series label:');
                    plugin.logger.debug(sampleSeriesLabel);

                    if (plugin.jqSeriesLable.length === 0) {
                        plugin.logger.debug('add new series data (FIRST):');
                        plugin.jqData[0] = sampleData;
//                         console.log(plugin.jqData);
                    } else {
                        plugin.logger.debug('add new series data:');
                        plugin.jqData.push(sampleData);//support multi-series
//                        console.log( plugin.jqData);
                    }

                    plugin.jqSeriesLable.push(sampleSeriesLabel);

                }
            }


        },
        //clear all data of plot
        clear: function () {
            var plugin = this;

            plugin.logger.info('clear');

            plugin.logger.debug('reset jqData');
            plugin.jqData = [];
            plugin.jqSeriesLable = [];

            if (plugin.jqPlotInstance) {

                plugin.logger.debug('clear jqplot instance');

                plugin.jqPlotInstance.destroy();

                plugin.$el.empty();

            }
        },
        resizePlot: function () {
            var plugin = this;
            plugin.logger.info('resizePlot');
            var w = plugin.$el.width();
            var h = plugin.$el.height();
            plugin.logger.debug('resize w: ' + w + ', h: ' + h);

            //get jqplot target elem
            var $elemOfPlot = plugin.$el.find('.jqplot-target');
            $elemOfPlot.css('width', w);
            $elemOfPlot.css('height', h);

//            var $canvas = plugin.$el.find('canvas');
//            $canvas.attr('width', w);
//            $canvas.attr('height',h );
//            plugin.jqPlotInstance.replot({resetAxes: true});
            plugin.jqPlotInstance.replot({
                resetAxes: ['xaxis', 'yaxis']
            });
        },
        //!IMPORTANT
        //plot data from jqData array (final step to plot data)
        plot: function () {

            var plugin = this;

            plugin.logger.info('plot');

            //          plugin.logger.debug(plugin.jqData);
            if (plugin.jqData != null && plugin.jqData.length > 0) {

                if (plugin.jqSeriesLable.length > 0) {
                    plugin.setSeries(plugin.jqSeriesLable);
                }

                if (plugin.jqPlotInstance) {
                    plugin.logger.debug('destroy jqplot');
                    plugin.jqPlotInstance.destroy();

                    $('#' + plugin.jqElemId).remove();
                    plugin.jqElemId = generateElemId();
                    plugin.$el.append(generateElemOfPlot(plugin.jqElemId));
                    var $chartElem = plugin.$el.find('#' + plugin.jqElemId);
                    $chartElem.css('height', plugin.$el.height());
                }

                plugin.logger.debug('create jqplot instance: ' + plugin.jqChart);
                plugin.logger.debug('jqplot elem id: ' + plugin.jqElemId);
                //                plugin.logger.debug(plugin.jqData);
//                console.log('exist: '  + $('#' + plugin.jqElemId + '').length);

//               console.log('================fake for multiple lines=====================');
//
// plugin.jqData =   [
//     
// [
//  null,
//  null,
//  '6.0',
//  6.0,
//  6.084745762711864,
//  6.0,
//  6.0256410256410255,
//  6.008403361344538,
//  6.05982905982906,
//  6.0,
//  6.008403361344538,
//  null
//],
//
//["6.0", "6.0", "6.084745762711864", "6.0", "6.0256410256410255", "6.008403361344538", "6.05982905982906", "6.0", "6.008403361344538", "6.0508474576271185", "6.008403361344538", null]
//
//]
//;


//                console.log( plugin.jqData);
//                console.log( plugin.jqData.length);
//                console.log( plugin.jqData[0]);
//                console.log( plugin.jqData[0].length);

                plugin.logger.debug('==============FINAL jq opts (2)================');
                       console.log(plugin.jqOptions);
                
                
                plugin.jqPlotInstance =
                        $.jqplot(
                                plugin.jqElemId,
                                plugin.jqData,
                                plugin.jqOptions);

                //聽說會吃記憶體(禁用，不要聽網路傳言)
//                plugin.jqPlotInstance.replot({
//                    resetAxes: ['xaxis', 'yaxis']
//                });


//                plugin.hideEvenXaxis();
                plugin.logger.debug('jqplot have created: ' + plugin.jqElemId);
//                console.log(plugin.jqPlotInstance);

            } else {
                plugin.logger.error('cannot find jq data');
            }
        },
        getJqOptions: function () {
            var plugin = this;
            plugin.logger.info('getJqOptions');

            return plugin.jqOptions;
        },
        setData: function (sampleData) {
            var plugin = this;
            plugin.logger.info('setData as below: ');

            plugin.jqData = [];//reset
            plugin.jqData.push(sampleData);

            plugin.logger.debug(plugin.jqData);

        },
        getData: function () {
            var plugin = this;

            var currData = plugin.jqData;
            plugin.logger.info('getData : ' + currData.length);
            plugin.logger.debug(currData);

            return currData;
        },
        setSeries: function (series) {
            var plugin = this;
            plugin.logger.info('setSeries');
            plugin.logger.debug(series);
            //            console.log(series);

            plugin.jqOptions.series = series;
        },
        getSeries: function () {
            var plugin = this;
            plugin.logger.info('getSeries');
            return  plugin.jqSeriesLable;
        },
        setXaxis: function (xaxis) {

            var plugin = this;

            plugin.logger.info('setXaxis as below:');
            plugin.logger.debug(xaxis);

            if (xaxis != null) {

                if (typeof (plugin.jqOptions.axes) == 'undefined') {
                    plugin.logger.debug('reset axes attritube');
                    plugin.jqOptions.axes = {};
                }

                if (typeof (plugin.jqOptions.axes.xaxis) == 'undefined') {
                    plugin.logger.debug('reset axes.xaxis attritube');
                    plugin.jqOptions.axes.xaxis = {};
                }

                if (typeof (plugin.jqOptions.axes.xaxis.numberTicks) == 'undefined') {
                    plugin.jqOptions.axes.xaxis.numberTicks = plugin.jqSampleNum;
                }

                if (typeof (xaxis.renderer) == 'undefined') {
                    //assign default reneder
                    plugin.setXaxisRender('dateaxis');
                } else {
                    plugin.setXaxisRender(xaxis.renderer);
                }

                if (typeof (plugin.jqOptions.axes.xaxis.tickRenderer) == 'undefined') {
                    //assign default canvas axis ticker renderer
                    plugin.jqOptions.axes.xaxis.tickRenderer = $.jqplot.CanvasAxisTickRenderer;
                }

                if (typeof (plugin.jqOptions.axes.xaxis.tickOptions) == 'undefined') {
                    plugin.logger.debug('create axes.xaxis.tickOptions attritube');
                    //default
                    plugin.jqOptions.axes.xaxis.tickOptions = {
                        formatString: '',
                        angle: -30,
                        fontSize: '10pt',
                        textColor: ''
                    };
                }

                //check x axis parameters   
                if (typeof (xaxis.min) != 'undefined') {
                    plugin.jqOptions.axes.xaxis.min = xaxis.min;
                }
                if (typeof (xaxis.max) != 'undefined') {
                    plugin.jqOptions.axes.xaxis.max = xaxis.max;
                }

                if (typeof (xaxis.ticks) != 'undefined') {

                    plugin.logger.debug('x axis ticks: ' + xaxis.ticks);



                    plugin.jqOptions.axes.xaxis.ticks = xaxis.ticks;
                    //                    plugin.logger.debug(plugin.jqOptions.axes.xaxis.ticks);
                }

                if (typeof (xaxis.tickInterval) != 'undefined') {
                    plugin.logger.debug('x axis tickInterval: ' + xaxis.tickInterval);
                    //'1 day'
                    //'x days' where x is any integer greater than 1
                    //'1 week'
                    //'x weeks' where x is any integer greater than 1
                    //'1 month'
                    //'x months' where x is any integer greater than 1
                    plugin.jqOptions.axes.xaxis.tickInterval = xaxis.tickInterval;
                }

                if (typeof (xaxis.tickOptions) != 'undefined') {
                    plugin.logger.debug('x axis tick format: ' + xaxis.tickOptions.formatString);

                    plugin.jqOptions.axes.xaxis.tickOptions.formatString = xaxis.tickOptions.formatString;
                    plugin.jqOptions.axes.xaxis.tickOptions.angle = -30;
//                    plugin.jqOptions.axes.xaxis.tickOptions.textColor = '#000';
                    plugin.jqOptions.axes.xaxis.tickOptions.textColor = xaxis.tickOptions.textColor;
                }

                plugin.logger.debug(plugin.jqOptions.axes.xaxis);
            } else {
                plugin.logger.error('cannot find x axis');
            }
        },
        //call from setXaxis
        setXaxisRender: function (rendererType) {
            var plugin = this;

            plugin.logger.info('set x-axis renderer: ' + rendererType);

            if (typeof (plugin.jqOptions.axes) == 'undefined') {
                plugin.jqOptions.axes = {};
                if (typeof (plugin.jqOptions.axes.xaxis) == 'undefined') {
                    plugin.jqOptions.axes.xaxis = {};
                }
            }

            switch (rendererType) {
                case 'dateaxis':

                    plugin.jqOptions.axes.xaxis.renderer = $.jqplot.DateAxisRenderer;
                    break;

                case 'categoryaxis':
                    plugin.jqOptions.axes.xaxis.renderer = $.jqplot.CategoryAxisRenderer;
                    break;

                default:
                    plugin.logger.error('cannot find x-axis renderer');
            }

        },
        setYaxis: function (yaxis) {

            var plugin = this;

            plugin.logger.info('setYaxis as below: ');
            plugin.logger.debug(yaxis);
            console.log(yaxis);

            if (yaxis != null) {

                if (typeof (plugin.jqOptions.axes) == 'undefined') {
                    plugin.logger.debug('reset axes attritube');
                    plugin.jqOptions.axes = {};
                }

                if (typeof (plugin.jqOptions.axes.yaxis) == 'undefined') {
                    plugin.logger.debug('reset axes.yaxis attritube');
                    plugin.jqOptions.axes.yaxis = {};
                }

                if (typeof (plugin.jqOptions.axes.yaxis.numberTicks) == 'undefined') {
                    plugin.jqOptions.axes.yaxis.numberTicks = plugin.jqSampleNum;
                }

                if (typeof (plugin.jqOptions.axes.yaxis.tickOptions) == 'undefined') {
                    plugin.logger.debug('create axes.yaxis.tickOptions attritube');
                    plugin.jqOptions.axes.yaxis.tickOptions = {
                        formatString: ''
                    };
                }

                //check y axis parameters
                if (typeof (yaxis.min) != 'undefined') {
                    plugin.jqOptions.axes.yaxis.min = yaxis.min;
                }

                if (typeof (yaxis.max) != 'undefined') {
                    plugin.jqOptions.axes.yaxis.max = yaxis.max;
                }

                if (typeof (yaxis.renderer) != 'undefined') {
                    plugin.setYaxisRender(yaxis.renderer);
                }

                if (typeof (yaxis.ticks) != 'undefined') {
                    plugin.logger.debug('y axis ticks: ' + yaxis.ticks);
                    plugin.jqOptions.axes.yaxis.ticks = yaxis.ticks;
                    plugin.logger.debug(plugin.jqOptions.axes.yaxis.ticks);
                }
                if (plugin.jqChart == 'column') {
                    delete plugin.jqOptions.axes.yaxis.ticks;
                }

                if (typeof (yaxis.tickOptions) != 'undefined') {

                    plugin.logger.debug('y axis tick format: ' + yaxis.tickOptions.formatString);

                    plugin.jqOptions.axes.yaxis.tickOptions = {};
                    plugin.jqOptions.axes.yaxis.tickOptions.formatString = yaxis.tickOptions.formatString;
//                    plugin.jqOptions.axes.yaxis.tickOptions.textColor = '#000';
                    plugin.jqOptions.axes.yaxis.tickOptions.textColor = yaxis.tickOptions.textColor;

                }

            } else {
                plugin.logger.error('cannot find y axis');
            }
        },
        //call from setYaxis
        setYaxisRender: function (rendererType) {

            var plugin = this;

            plugin.logger.info('set y-axis renderer: ' + rendererType);
            if (typeof (plugin.jqOptions.axes) == 'undefined') {
                plugin.jqOptions.axes = {};
                if (typeof (plugin.jqOptions.axes.yaxis) == 'undefined') {
                    plugin.jqOptions.axes.yaxis = {};
                }
            }

            switch (rendererType) {

                case 'dateaxis':
                    plugin.jqOptions.axes.yaxis.renderer = $.jqplot.DateAxisRenderer;
                    break;

                case 'categoryaxis':
                    plugin.jqOptions.axes.yaxis.renderer = $.jqplot.CategoryAxisRenderer;
                    break;
            }

        },
        getYaxisMinMax: function () {
            var plugin = this;
            return {
                min: plugin.jqOptions.axes.yaxis.min,
                max: plugin.jqOptions.axes.yaxis.max
            };
        },
        setYaxisMinMax: function (min, max) {
            var plugin = this;
            plugin.logger.info('setYaxisMinMax min and max: ' + min + ' , ' + max);

            if (typeof (plugin.jqOptions.axes) == 'undefined') {
                plugin.jqOptions.axes = {};
            }

            plugin.jqOptions.axes.yaxis = {};
            plugin.jqOptions.axes.yaxis.min = min;
            plugin.jqOptions.axes.yaxis.max = max;

            plugin.logger.debug('yaxis min: ' + plugin.jqOptions.axes.yaxis.min);
            plugin.logger.debug('yaxis max: ' + plugin.jqOptions.axes.yaxis.max);

        },
        //swith chart renender (include setXaxis and setYaxis)
        setRenderer: function (rendererType) {

            var plugin = this;
            plugin.logger.info('setRenderer: ' + rendererType);

            if (typeof (rendererType) == 'undefined') {
                plgugin.logger.error('Please input chart type');
                return;
            }
            var opts = plugin.options;

            //jqplot properties
            var chart = opts.chart;
            var series = opts.series;

            plugin.logger.debug('opts axis info as below');
            var xaxis = opts.xaxis;
            plugin.logger.debug(xaxis);

            var yaxis = opts.yaxis;
            plugin.logger.debug(yaxis);

            var placement = opts.legend.placement;

            //reset for switch chart
            plugin.logger.debug('reset jq opts series defaults and axes');
            plugin.jqOptions.seriesDefaults = {};//reset
            plugin.jqOptions.axes = {};

            switch (rendererType) {

                case 'donut':

                    plugin.jqOptions.seriesDefaults = {
                        renderer: $.jqplot.DonutRenderer,
                        rendererOptions: {
                            sliceMargin: 3,
                            startAngle: -90,
                            showDataLabels: true,
                            dataLabels: 'value'
                        },
                        tickOptions: {
                            formatString: ''
                        }
                    };

                    plugin.jqOptions.legend = {
                        renderer: $.jqplot.EnhancedLegendRenderer,
                        show: true,
                        location: opts.legend.location
                    };

                    delete plugin.jqOptions.axes;

                    break;

                case 'pie':
                    //http://www.jqplot.com/docs/files/plugins/jqplot-pieRenderer-js.html
                    plugin.jqOptions.seriesDefaults = {
                        // Make this a pie chart.
                        renderer: $.jqplot.PieRenderer,
//                        trendline:{ show: true },
                        rendererOptions: {
                            // Put data labels on the pie slices.
                            // By default, labels show the percentage of the slice.
                            showDataLabels: true,
                            dataLabelNudge: 5
                        },
                        tickOptions: {
                            formatString: ''
                        }
                    };//end of

                    plugin.jqOptions.legend = {
                        show: true,
                        location: opts.legend.location
                    };

                    delete plugin.jqOptions.axes;

                    break;

                case 'bar':

                    plugin.jqOptions.seriesDefaults = {
                        renderer: $.jqplot.BarRenderer,
                        rendererOptions: {
                            barDirection: 'vertical'
                                    //                            barWidth: 2
                        }
                    };

                    plugin.jqOptions.legend = {
                        show: true,
                        location: opts.legend.location, // compass direction, nw, n, ne, e, se, s, sw, w.
                        placement: placement
                    };

                    /**
                     * 為了動態轉換而設計，不過用這個方法好像有bug
                     * 2015/02/06
                     **/
                    //set date axis 
                    plugin.setXaxis(xaxis);

                    //set date axis
//                    plugin.jqOptions.axes.xaxis = {};
//                    plugin.jqOptions.axes.xaxis = {
                    //                        renderer: $.jqplot.DateAxisRenderer,
                    // a factor multiplied by the data range on the axis to give the            
//                        renderer: $.jqplot.CategoryAxisRenderer,
//                        tickRenderer: $.jqplot.CanvasAxisTickRenderer,
//                        tickOptions: {
//                            formatString: '%y/%m/%d %H:%M:%S',
//                            //                            formatter: $.jqplot.DateTickFormatter, //如果要使用DateAxisRenderer
//                            angle: -30
//                        }
//                    };

                    plugin.jqOptions.axes.yaxis = {
                        tickOptions: {
                            textColor: yaxis.tickOptions.textColor
                        }
                    };

                    break;

                case 'stack':

                    // Tell the plot to stack the bars.
                    plugin.jqOptions.stackSeries = true;
                    plugin.jqOptions.captureRightClick = true;

                    plugin.jqOptions.seriesDefaults = {
                        renderer: $.jqplot.BarRenderer,
                        rendererOptions: {
                            barDirection: 'vertical'
                                    //                            barWidth: 2

                        },
                        pointLabels: {
                            show: true,
                            hideZeros: true
                        }

                    };

                    plugin.jqOptions.legend = {
                        show: true,
                        location: opts.legend.location, // compass direction, nw, n, ne, e, se, s, sw, w.
                        placement: placement
                    };

                    /**
                     * 為了動態轉換而設計，不過用這個方法好像有bug
                     * 2015/02/06
                     **/
                    //set date axis 
                    plugin.setXaxis(xaxis);


                    plugin.jqOptions.axes.yaxis = {
                        padMin: 0
                    };


                    break;

                case 'column':

                    plugin.jqOptions.seriesDefaults = {
                        renderer: $.jqplot.BarRenderer,
                        rendererOptions: {
                            barDirection: 'horizontal'
                        }
                    };
                    plugin.jqOptions.legend = {
                        show: true,
                        location: opts.legend.location, // compass direction, nw, n, ne, e, se, s, sw, w.
                        placement: placement
                    };

                    //很重要
                    //                    delete plugin.jqOptions.axes.xaxis;(無作用)
                    plugin.logger.debug('reset axes xaxis');
                    plugin.jqOptions.axes.xaxis = {};

                    break;

                case 'line':

                    plugin.jqOptions.seriesDefaults = {
                        renderer: $.jqplot.LineRenderer,
                        fill: false
                    };

                    plugin.jqOptions.legend = {
                        renderer: $.jqplot.EnhancedLegendRenderer,
                        show: true,
                        location: opts.legend.location, // compass direction, nw, n, ne, e, se, s, sw, w.
                        placement: placement
                    };

                    //set axes
                    plugin.setXaxis(xaxis);

                    /*
                     plugin.jqOptions.axes.xaxis = {};
                     plugin.jqOptions.axes.xaxis = {
                     numberTicks: plugin.jqSampleNum,
                     renderer: $.jqplot.DateAxisRenderer, //default x axis with date
                     tickRenderer: $.jqplot.CanvasAxisTickRenderer,
                     tickOptions: {
                     angle: -30
                     }
                     };
                     */

                    plugin.setYaxis(yaxis);

                    /*
                     plugin.jqOptions.axes.yaxis = {};
                     plugin.jqOptions.axes.yaxis = {
                     numberTicks: plugin.jqSampleNum,
                     tickOptions: {
                     formatString: '%.1f'
                     }
                     };*/
                    break;

                case 'area':

                    plugin.jqOptions.seriesDefaults = {
                        renderer: $.jqplot.LineRenderer,
                        fill: true
                    };

                    plugin.jqOptions.legend = {
                        renderer: $.jqplot.EnhancedLegendRenderer,
                        show: true,
                        location: opts.legend.location, // compass direction, nw, n, ne, e, se, s, sw, w.
                        placement: placement
                    };

                    //set axes
                    plugin.setXaxis(xaxis);

                    /*
                     plugin.jqOptions.axes.xaxis = {};
                     plugin.jqOptions.axes.xaxis = {
                     numberTicks: plugin.jqSampleNum,
                     renderer: $.jqplot.DateAxisRenderer, //default x axis with date
                     tickRenderer: $.jqplot.CanvasAxisTickRenderer,
                     tickOptions: {
                     angle: -30
                     }
                     };
                     */

                    plugin.setYaxis(yaxis);

                    /*
                     plugin.jqOptions.axes.yaxis = {};
                     plugin.jqOptions.axes.yaxis = {
                     numberTicks: plugin.jqSampleNum,
                     tickOptions: {
                     formatString: '%.1f'
                     }
                     };*/

                    break;

                case 'scatter':

                    plugin.jqOptions.seriesDefaults = {
                        renderer: $.jqplot.LineRenderer,
                        showLine: false,
                        showMarkers: true,
                        legend: {
                            renderer: $.jqplot.EnhancedLegendRenderer,
                            show: true,
                            location: opts.legend.location, // compass direction, nw, n, ne, e, se, s, sw, w.
                            placement: placement
                        }
                    };

                    //set axes
                    plugin.setXaxis(xaxis);

                    /*
                     plugin.jqOptions.axes.xaxis = {
                     numberTicks: plugin.jqSampleNum,
                     renderer: $.jqplot.DateAxisRenderer, //default x axis with date
                     tickRenderer: $.jqplot.CanvasAxisTickRenderer,
                     tickOptions: {
                     angle: -30
                     }
                     };
                     */

                    plugin.setYaxis(yaxis);

                    /*
                     plugin.jqOptions.axes.yaxis = {
                     numberTicks: plugin.jqSampleNum,
                     tickOptions: {
                     formatString: '%.1f'
                     }
                     };*/

                    break;

                default:
                    plugin.logger.debug('Invalid chart type');

            }//end of switch

            //去除陰影效果
            plugin.jqOptions.seriesDefaults.shadow = false;
            plugin.jqOptions.seriesDefaults.shadowOffset = 0;

//             plugin.jqOptions.seriesDefaults.axesDefaults = {};
//              plugin.jqOptions.seriesDefaults.axesDefaults.tickRenderer = $.jqplot.CanvasAxisTickRenderer;
//               plugin.jqOptions.seriesDefaults.axesDefaults.tickOptions = {};
//               plugin.jqOptions.seriesDefaults.axesDefaults.tickOptions.fontSize = '10pt' ;

//            plugin.logger.debug('show render as below: ');
//            plugin.logger.debug(plugin.jqOptions.seriesDefaults.renderer);
        },
        /**
         * The 'destroy' method is were you free the resources used by your plugin:
         * references, unregister listeners, etc.
         *
         * Remember to unbind for your event:
         *
         * @example
         * this.$someSubElement.off('.' + pluginName);
         *
         * Above example will remove any listener from your plugin for on the given
         * element.
         */
        destroy: function () {

            var plugin = this;

            plugin.logger.info('destroy');

            if (plugin.jqPlotInstance) {
                plugin.jqPlotInstance.destroy();
                $('#' + plugin.jqElemId).remove();
            }
            // Remove any attached data from your plugin
            plugin.$el.removeData();
        },
        hideEvenXaxis: function () {
            var plugin = this;
            plugin.logger.info('hide evenXaxis');

            //hide odd x-axis
            var $findXaxisElems = plugin.$el.find('canvas[class="jqplot-xaxis-tick"]:odd');
            var countOfXaxisElems = $findXaxisElems.length;

            plugin.logger.debug('find xaxis elems: ' + countOfXaxisElems);

            if (countOfXaxisElems > 0) {
                plugin.logger.debug('hide find xaxis elems');
                $findXaxisElems.remove();
            }

        }
    };

    /**
     * This is a real private method. A plugin instance has access to it
     * @return {[type]}
     */
    var privateMethod = function () {
        console.log("privateMethod");
        console.log(this);
    };

    var generateElemOfPlot = function (elemId) {
        var elem = '<div id="' + elemId + '"></div>';
        return elem;
    };

    var generateElemId = function () {
        var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        var uniqid = randLetter + (+new Date);
        return uniqid;
    };

    // Plugin wrapper around the constructor,
    $.fn[pluginName] = function (options) {

        var args = arguments;

        if (options === undefined || typeof options === 'object') {
            // Create a plugin instance for each selected element.
            return this.each(function () {
                if (!$.data(this, 'plugin_' + pluginName)) {
                    $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
                }
            });
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
            // Call a pluguin method for each selected element.
            if (Array.prototype.slice.call(args, 1).length == 0 && $.inArray(options, $.fn[pluginName].getters) != -1) {
                // If the user does not pass any arguments and the method allows to
                // work as a getter then break the chainability
                var instance = $.data(this[0], 'plugin_' + pluginName);
                return instance[options].apply(instance, Array.prototype.slice.call(args, 1));
            } else {
                // Invoke the speficied method on each selected element
                return this.each(function () {
                    var instance = $.data(this, 'plugin_' + pluginName);
                    if (instance instanceof Plugin && typeof instance[options] === 'function') {
                        instance[options].apply(instance, Array.prototype.slice.call(args, 1));
                    }
                });
            }
        }
    }

    /**
     * Names of the pluguin methods that can act as a getter method.
     * @type {Array}
     */
    $.fn[pluginName].getters = ['getYaxisMinMax', 'getJqOptions', 'getData', 'getSeries'];

    /**
     * Default options
     */

    $.fn[pluginName].defaults = {
        data: [],
        series: [],
        chart: 'line',
        seriesColors: [
            'rgba(31, 119, 180, 0.75)', //#1f77b4
            'rgba(255, 127, 14, 0.75)', //#ff7f0e
            'rgba(44, 160,44, 0.75)', //#2ca02c

            'rgba(214, 39, 40, 0.75)', //#D62728
            'rgba(148, 103, 189, 0.75)', //#9467bd

            'rgba(140, 86, 75, 0.75)', //#8c564b
            'rgba(227, 119, 194, 0.75)', //#e377c2
            'rgba(127, 127, 127, 0.75)', //#7f7f7f
            'rgba(188, 189, 34, 0.75)', //#bcbd22
            'rgba(23, 190, 207, 0.75)' //#17BECF

        ],
        grid: {
            background: '#fff',
            gridLineColor: '#a4aba4',
            borderColor: '#fff'
        },
        xaxis: {
            renderer: 'dateaxis',
            tickOptions: {
                formatString: '%y/%m/%d %H:%M:%S',
                textColor: '#000'
            }
        },
        yaxis: {
            min: null,
            max: null,
            tickOptions: {
                formatString: '%.1f',
                textColor: '#000'
            }
        },
        legend: {
            placement: 'inside', //'insideGrid',outside
            location: 'se'
        }
    };

})(jQuery);