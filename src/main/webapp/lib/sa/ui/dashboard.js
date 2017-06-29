/*
 *  Dashboard  plugin
 * @date 20141107
 * @requires 
 * js/libs/log4javascript/log4javascript.min.js
 * js/libs/jqplugins/jquery.gridster.js
 * js/sa/utils/log4jq.js
 * js/sa/ui/widget.js
 */

;
(function ($) {

    //define plugin name
    var pluginName = 'dashboard';

    //create plugin class
    function Plugin(element, options) {

        this.logger = log4jq.getLogger({
            loggerName: 'dashboard.js'
        });

        this.el = element;
        this.$el = $(element); // gridster jq object
        this.widgetIndex = 0; //widget index count

        this.gridsterCanvas = null; //gridster obb
        this.$lastWidget = null; // keep last widget

        //dashboard properties
        this.minCols = 3;
        this.colNumber = this.minCols;//current column
        this.slideCount = 0;//slider counter
        this.colWidth = 0;// column width of dashboard
        this.isRunning = true;

        //widget properties
        this.widgetWidth = 400;//Here is set the WidgetWidth
        this.widgetHeight = 40;//Here is the WidgetHeight which is set in main.css
        this.widgetMargins = 5;//Default margin size 

        this.colWidth = this.widgetMargins + this.widgetWidth + this.widgetMargins;

        this.options = $.extend({}, $.fn[pluginName].defaults, options);

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
            plugin.logger.debug('call init func');

            //append all html
            plugin._appendGridsterHtml();

            //init function
            plugin._initGridster();

            //init susi widgets
            plugin._initWidgets();

            //要避免使用者原本的大小是在比較大的解析度畫面
            plugin.adjustWidgets();

            var resizeTimer;
            $(window).resize(function () {
                plugin.logger.debug('browser resize');
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function () {
                    plugin.adjustWidgets();
                }, 200);//!!IMPORTANT Delay
            });

        },
        //重新設定資料
        updateWidgetsData: function (newData) {
            var plugin = this;
            plugin.logger.debug('call reinit func');
            plugin.options.data = newData;
            plugin.init();
        },
        //adjust widget layout by page columns
        adjustWidgets: function () {

            var plugin = this;
            plugin.logger.info('call adjustWidgets func');

            var max_cols = plugin.getMaxColNumber();
//            
            //取得目前所有的widget
            var $widgets = plugin.$el.find('li.gs-w');
            plugin.logger.debug('reposition widgets: ' + $widgets.length);

            //由於拖拉完後原本的li元素(widget)的位置並不會被改變，因此需先按row跟col重新排序
            //以便重新計算新的位置
//            console.log($widgets);
            $widgets.sort(function ($a, $b) {

                var aRow = $($a).attr('data-row');
                var aCol = $($a).attr('data-col');
                var bRow = $($b).attr('data-row');
                var bCol = $($b).attr('data-col');
                if (aRow > bRow || aRow === bRow && aCol > bCol) {
                    return 1;
                }
                return -1;

            });
            plugin.logger.debug('after sort');
//            console.log($widgets);

            //reposition current widgets' col
            //超級重要，會不會破版靠這裡的演算法了!!
            var $preWidget = null;
            $widgets.each(function (i, obj) {

                var $currLI = $(this);//curr widget 
                var widgetTitle = $currLI.find('h3').attr('title');//for debug
                var colReal = $currLI.attr("data-col-real");
                var colSizeXReal = $currLI.attr("data-sizex-real");

                plugin.logger.debug('widget(' + widgetTitle + '): data-col-real:' + colReal + ', data-sizex-real: ' + colSizeXReal);

                //確定目前的起始col是否有大於目前的dashbaord的col配置
                if (colReal > plugin.colNumber) {
                    plugin.logger.warn('widget(' + widgetTitle + ') real col more than current cols of dashbaord');

                    //需要偵測換行
                    //下一行的規則為先前一個的data-sizey="1" + data-row="1" = next data-row="2"
                    if ($preWidget != null) {

                        var preRow = parseInt($preWidget.attr("data-row"));
                        var preSizeY = parseInt($preWidget.attr("data-sizey"));
                        var newRow = preRow + preSizeY;
                        plugin.logger.warn('widget(' + widgetTitle + ') new row is: ' + newRow);
                        $currLI.attr('data-row', newRow);

                    }

                    //如果會換列，就把行放在第一個起始
//                                        $currLI.attr('data-col', 1);
                    $currLI.attr('data-col', plugin.colNumber);
                } else {
                    plugin.logger.warn('widget(' + widgetTitle + ') real col less than or euqal current cols of dashbaord');
                    //需要偵測換行
                    //下一行的規則為先前一個的data-sizex="1" + data-row="1" = next data-row="2"

                    if ($preWidget != null) {

                        var preRow = parseInt($preWidget.attr("data-row"));
                        var preSizeY = parseInt($preWidget.attr("data-sizey"));
                        var newRow = preRow + preSizeY;
                        plugin.logger.warn('widget(' + widgetTitle + ') new row is: ' + newRow);
                        $currLI.attr('data-row', newRow);
                    }
                    //保持原來的位置
                    plugin.logger.debug('widget(' + widgetTitle + ') set data-col with real');
                    $currLI.attr('data-col', colReal);

                }

                //變更widget寬度
                if (colSizeXReal > plugin.colNumber) {
                    plugin.logger.warn('widget(' + widgetTitle + ') data-sizex-real more than current cols of dashbaord. So set data-size with current cols');
                    $currLI.attr('data-sizex', plugin.colNumber);
//                    plugin.gridsterCanvas.resize_widget($currLI,plugin.colNumber);
                }
                else {
                    $currLI.attr('data-sizex', colSizeXReal);
//                    plugin.gridsterCanvas.resize_widget($currLI,$currLI.attr("data-sizex-real"));
                }

//                console.log($currLI);
                $preWidget = $currLI;
            });

            if (plugin.gridsterCanvas != null) {
                plugin.gridsterCanvas.destroy();
            }

//            plugin.gridsterCanvas.generate_grid_and_stylesheet();
            //re-init
            plugin._initGridster();
            plugin.updateGridWidth(max_cols);

        },
        //unused
        addWidgets: function (widgetsData) {

        },
        //add single widget
        addWidget: function (widgetData) {
            var plugin = this;

            plugin.logger.info('call addWidget func');
            plugin.logger.debug(widgetData);

            plugin._setWidgetData(widgetData);
            plugin.options.data.push(widgetData);
            var girdsterHtml = plugin._appendGridsterWidget(widgetData);

            //create a new widget on girdster
            //                .add_widget( html, [size_x], [size_y], [col], [row] )
            var $newWidgetInstance =
                    plugin.gridsterCanvas.add_widget.apply(
                            plugin.gridsterCanvas,
                            [
                                girdsterHtml,
                                widgetData.size_x,
                                widgetData.size_y,
                                widgetData.col,
                                widgetData.row
                            ]);

            //               plugin.gridsterCanvas.add_widget(
            //               girdsterHtml,
            //                widgetData.size_x, 
            //                widgetData.size_y, 
            //                widgetData.col, 
            //                widgetData.row
            //                );

            plugin.widgetIndex++;

            //create a new susi widget on gridster (SINGLE)
            var $widget = $newWidgetInstance.find('div.widget');

            //active widget and refresh widget
            plugin._initWidget($widget, widgetData);
            var positions = plugin.gridsterCanvas.serialize();

//            plugin.repositionGrid();

            if (plugin.options.afterAdd && typeof (plugin.options.afterAdd) === 'function') {
                plugin.options.afterAdd(plugin);
            }

            if (plugin.options.changeLayout && typeof (plugin.options.changeLayout) === 'function') {
                plugin.options.changeLayout(positions);
            }
        },
        //added by ken 2015/04/10
        clearWidgets: function () {
            var plugin = this;
            plugin.logger.info('clearWidgets');
            var $widgets = plugin.$el.find('div.widget');
            if ($widgets.length > 0) {
                plugin.logger.warn('Widgets: ' + $widgets.length);
                $.each($widgets, function (i, obj) {
                    var $widget = $(this);
//                    console.log($widget);
                    plugin.removeWidget($widget);
                });
            } else {
                plugin.logger.warn('No Widgets');
            }

        },
        //移除一個dashboard widget
        removeWidget: function ($widget) {
            var plugin = this;
            plugin.logger.info('call removeWidget func');
            //            console.log($widget);
            //            plugin.logger.debug($widget);

            var $gridsterWidget = $widget.parent();
            var keepWidgetID = plugin.getWidgetID($widget);
            if (typeof (keepWidgetID) == 'undefined') {
                plugin.logger.error('cannot remove widget, because widget not found');
            } else {

                //一定要殺掉呀(每個widget有一個timer)
                $widget.widget('destroy');

                //這個fucn會把包在裡面的widget殺掉，所以要先執行susi widget destory
                plugin.gridsterCanvas.remove_widget($gridsterWidget, function () {
                    plugin.logger.debug('removeWidget after remove callback');

                    //remove data from plugin.$el
                    if (typeof ($widget) != 'undefined') {
                        plugin.logger.debug('widget exist');
                        plugin._removeWidgetData(keepWidgetID);
                        var countOfWidgets = plugin.count();
                        //重設最後一個widget撐開dashboard佔用的高度
                        if (countOfWidgets == 0) {
                            //reset height
                            plugin.$el.css('height', '');
                        }
                        if (plugin.options.afterRemove && typeof (plugin.options.afterRemove) === 'function') {
                            plugin.options.afterRemove(plugin);
                        }
                    } else {
                        plugin.logger.error('cannot find $widget object');
                    }

                });
            }

        },
        //重新一個dashboard的 widget的數據
        updateWidget: function ($widget, widgetData, sampleData) {
            var plugin = this;
            plugin.logger.info('call updateWidget func');
//            console.log($widget);

//            $widget.widget('unblock');
            if ($widget == null) {
                plugin.logger.error('cannot find $widget');
            } else {
                var type = widgetData.type;
                plugin.logger.debug('widget data type: ' + type);
                switch (type) {

                    /*iParking*/
                    case 'DEMO_PARKING_WEEKLY_AVG':
                        $widget.find('div.widget-customer').chart('plot');
                        break;
                    case 'DEMO_PARKING_WEEKLY_AVG_OF_SPACE':
                        $widget.find('div.widget-customer').chart('plot');
                        break;
                    case 'DEMO_PARKING_DURATION_HOUR_AVG':
                        $widget.find('div.widget-customer').chart('plot');
                        break;
                    case 'DEMO_PARKING_LPR_CORRECT_RATE':
                        $widget.find('div.widget-customer').chart('plot');
                        break;

                        /*sales*/
                    case 'DEMO_SALE_ANALYTICS':
                        $widget.find('div.widget-customer').chart('plot');
                        break;
                    case 'DEMO_SALE_ANALYTICS_2':
                        $widget.find('div.widget-customer').chart('plot');
                        break;
                    case 'DEMO_SALE_ANALYTICS_CITY':
                        $widget.find('div.widget-customer').chart('plot');
                        break;

                    case 'DEFAULT_SERVER_LOAD':

                        var $cpuProgress = $widget.find('.progress-cpu');
                        var $memProgress = $widget.find('.progress-mem');
                        var $stoargeProgress = $widget.find('.progress-storage');
                        var $databaseProgress = $widget.find('.progress-database');

                        var cpuPercent = sampleData.cpu;
                        $cpuProgress.progressbar('update', cpuPercent);

                        var memPercent = sampleData.mem;
                        $memProgress.progressbar('update', memPercent);

                        var storagePercent = sampleData.storage;
                        $stoargeProgress.progressbar('update', storagePercent);

                        var databasePercent = sampleData.database;
                        $databaseProgress.progressbar('update', databasePercent);

                        break;

                    case 'DEFAULT_GEO_DEV_STATUS':
                        var $widgetChart = $widget.find('div.widget-mapael');
                        if ($widgetChart.length > 0) {

                            plugin.logger.debug('init jq mapael');

                            $widgetChart.mapael({
                                map: {
                                    name: "world_countries",
                                    zoom: {
                                        enabled: true
                                    },
                                    //                                tooltip :{
                                    //                                    cssClass: 'map-tooltip'
                                    //                                },
                                    defaultArea: {
                                        attrs: {
                                            stroke: "#fff",
                                            "stroke-width": 1
                                        }
                                    },
                                    defaultPlot: {
                                        eventHandlers: {
                                            click: function (e, id, mapElem, textElem) {

                                            },
                                            hover: function (e, id, mapElem, textElem) {

                                            }
                                        }
                                    }
                                },
                                legend: {
                                    plot: {
                                        display: true,
                                        labelAttrs: {
                                            fill: "#4a4a4a"
                                        },
                                        titleAttrs: {
                                            fill: "#4a4a4a"
                                        },
                                        marginBottom: 20,
                                        marginLeft: 30,
                                        hideElemsOnClick: {
                                            opacity: 0
                                        },
                                        title: "Numbers",
                                        slices: [{
                                                size: 20,
                                                type: "circle",
                                                min: 100,
                                                max: 500,
                                                attrs: {
                                                    fill: "#89ff72"
                                                },
                                                label: "Less than 500"
                                            }, {
                                                size: 30,
                                                type: "circle",
                                                min: 500,
                                                max: 1000,
                                                attrs: {
                                                    fill: "black"
                                                },
                                                label: "More than 500"
                                            }]
                                    }
                                },
                                plots: {
                                    'paris': {
                                        latitude: 48.86,
                                        longitude: 2.3444,
                                        value: 500,
                                        tooltip: {
                                            content: "Paris<br />Pants: 500"
                                        }
                                    },
                                    'newyork': {
                                        latitude: 40.667,
                                        longitude: -73.833,
                                        value: 2000,
                                        tooltip: {
                                            content: "New york<br /> Coats: 150"
                                        }
                                    },
                                    'sydney': {
                                        latitude: -33.917,
                                        longitude: 151.167,
                                        value: 600,
                                        tooltip: {
                                            content: "Sydney<br />Pants: 600"
                                        }
                                    },
                                    'brasilia': {
                                        latitude: -15.781682,
                                        longitude: -47.924195,
                                        value: 1000,
                                        tooltip: {
                                            content: "Brasilia<br />Coats: 99"
                                        }
                                    },
                                    'tokyo': {
                                        latitude: 35.687418,
                                        longitude: 139.692306,
                                        value: 200,
                                        tooltip: {
                                            content: "Tokyo<br />Shirts: 200"
                                        }
                                    },
                                    'taiwan': {
                                        latitude: 25.03,
                                        longitude: 121.30,
                                        value: 500,
                                        tooltip: {
                                            content: "Taiwan<br />Pants: 450"
                                        }
                                    }
                                }
                            });
                        } else {
                            plugin.logger.error('cannot init jq mapael');

                        }
                        break;

                    case 'DEFAULT_DEV_HEALTH_STATUS':


                        break;

                    case 'DEFAULT_DEV_MAINTANCE_STATUS':


                        break;

                    case 'DEFAULT_DEV_MONITOR_STATUS':


                        break;

                    case 'DEFAULT_DEV_TOP_ABNORMAL':


                        break;

                    case 'DEFAULT_WSN_OFFLINE':


                        break;

                    case 'DEFAULT_LASTEST_EVENT':


                        break;

                    case 'CUSTOMER':

                        var $widgetChart = $widget.find('div.widget-customer');
                        $widgetChart
                                //.chart('clear')
                                .chart('update',
                                        sampleData.data, {
                                            label: sampleData.label
                                        })
                                .chart('plot');

                        break;

                    case 'CUSTOMER_SENSOR':
                        plugin.logger.debug(sampleData);
                        var $widgetChart = $widget.find('div.widget-customer');

                        $widgetChart.hwmonitor('update', sampleData);

                        break;

                    case 'CUSTOMER_FANS':
                        plugin.logger.debug(sampleData);
                        var $widgetChart = $widget.find('div.widget-fans');

                        if (sampleData) {
                            $widgetChart.fans('on');
                        } else {
                            $widgetChart.fans('off');
                        }
                        break;

                    case 'CUSTOMER_BULB':
                        plugin.logger.debug(sampleData);
                        var $widgetChart = $widget.find('div.widget-bulb');
                        if (sampleData) {
                            $widgetChart.bulb('on');
                        } else {
                            $widgetChart.bulb('off');
                        }
                        break;

                    case 'CUSTOMER_ACTIVE_VALUE':
                        plugin.logger.debug('update active value: ' + sampleData);
                        var $widgetChart = $widget.find('div.widget-activevalue');
                        $widgetChart.activevalue('update', sampleData);
                        break;

                    case 'CUSTOMER_GSENSOR':
                        plugin.logger.debug(sampleData);
                        var $widgetChart = $widget.find('div.widget-gsensor');

                        $widgetChart.gsensor('update', sampleData);
                        break;
                        
                     case 'CUSTOMER_HTMLIMAGE':
                        plugin.logger.debug(sampleData);
                        var $widgetChart = $widget.find('div.widget-htmlimage');
                        if (sampleData) {
                            $widgetChart.htmlimage('on');
                        } else {
                            $widgetChart.htmlimage('off');
                        }
                        break;
                        
                    default:
                        plugin.logger.error('Invalid widget type(updateWidget): ' + type);

                } //end of switch
            }


        },
        //count widget
        count: function () {
            var plugin = this;
            plugin.logger.info('call count func');
            var count = plugin.$el.find('div.widget').length;
            plugin.logger.debug('count: ' + count);
            return count;
        },
        //自動重設widget可顯示區塊的大小
        resizeBodyOfWidget: function ($widget, newWidth, newHeight) {
            var plugin = this;

            plugin.logger.info('call resizeBodyOfWidget func');
            plugin.logger.debug('w: ' + newWidth + ',h: ' + newHeight);
            var $bodyOfWidget = $widget.find('div.widget-customer');
            //resize w and h
            $bodyOfWidget.height(newHeight * 0.8);
            $bodyOfWidget.width(newWidth * 0.8);
        },
        // susi widget timer的refresh處理
        refreshWidget: function ($widget) {

            var plugin = this;

            plugin.logger.info('call refreshWidget func');
//            console.log($widget);
//            $widget.widget('block');

            //added by ken 2015/04/08
            var $liOfGridster = $widget.parent();
            var wOfWidget = $liOfGridster.width();
            var hOfWidget = $liOfGridster.height();

            plugin.resizeBodyOfWidget($widget, wOfWidget, hOfWidget);

            var poolingWidgetData = plugin.getWidgetData($widget);
            if (typeof (poolingWidgetData) != 'undefined') {
                plugin.logger.debug(poolingWidgetData);

                var type = poolingWidgetData.type;

                plugin.logger.debug('pooling widget data type: ' + type);

                var $widgetChart = null;
                if (type.indexOf('DEMO_') >= 0) {

                    plugin.logger.debug('demo widget');

                    switch (type) {
                        case 'DEMO_PARKING_LPR_CORRECT_RATE':
                            $widgetChart = $widget.find('div.widget-customer');
                            var LPR = [
                                ['correct', 95], ['error', 15]
                            ];
                            $widgetChart.chart({
                                chart: 'pie'
                            }).chart('setData', LPR).chart('plot');
                            break;
                        case 'DEMO_PARKING_DURATION_HOUR_AVG':
                            $widgetChart = $widget.find('div.widget-customer');
                            var duration_hour_avg =
                                    [['1hr', 18], ['2hr', 15], ['3hr', 8], ['4hr', 5], ['5hr', 3.5], ['6hr and up', 8]];
                            $widgetChart.chart({
                                chart: 'bar',
                                xasix: {
//                                tickInterval: '1 month'
                                },
                                yasix: {
                                    min: 0,
                                    max: 80
                                }
                            })
                                    .chart('setXaxisRender', 'categoryaxis')
                                    .chart('update', duration_hour_avg, {
                                        label: 'Weekly avg.'
                                    }).chart('plot');
                            break;
                        case 'DEMO_PARKING_WEEKLY_AVG_OF_SPACE':
                            $widgetChart = $widget.find('div.widget-customer');
                            var weekly_usage =
                                    [['VIP-001', 15], ['VIP-002', 20], ['VIP-003', 13], ['VIP-004', 18], ['VIP-005', 70], ['VIP-006', 68], ['VIP-007', 75], ['VIP-008', 66], ['VIP-009', 28], ['VIP-010', 35], ['VIP-011', 43], ['VIP-012', 55]];
                            $widgetChart.chart({
                                chart: 'bar',
                                xasix: {
//                                tickInterval: '1 month'
                                },
                                yasix: {
                                    min: 0,
                                    max: 80
                                }
                            })
                                    .chart('setXaxisRender', 'categoryaxis')
                                    .chart('update', weekly_usage, {
                                        label: 'Daily usage avg.'
                                    }).chart('plot');

                            break;
                        case 'DEMO_PARKING_WEEKLY_AVG':
                            $widgetChart = $widget.find('div.widget-customer');
                            var weekly_usage = [['Mon.', 25], ['Tues', 40], ['Wed.', 32], ['Thur.', 50], ['Fri', 22]];
                            ;
                            $widgetChart.chart({
                                chart: 'area',
                                xasix: {
                                    tickInterval: '1 month'
                                },
                                yasix: {
                                    min: 0,
                                    max: 80
                                }
                            })
                                    .chart('setXaxisRender', 'categoryaxis')
                                    .chart('update', weekly_usage, {
                                        label: 'Daily usage avg.'
                                    }).chart('plot');
                            break;
                        case 'DEMO_SALE_ANALYTICS_CITY':
                            $widgetChart = $widget.find('div.widget-customer');
                            var pants = [['American', 4.1], ['China', 2.8], ['Europe', 3.5], ['Japan / Korea', 4.9]];
                            var coat = [['American', 2.5], ['China', 4.6], ['Europe', 1.8], ['Japan / Korea', 2.8]];
                            var shirt = [['American', 2], ['China', 2], ['Europe', 3], ['Japan / Korea', 5]];

                            $widgetChart.chart({
                                chart: 'bar',
                                xaxis: {
                                    ticks: ticks,
                                    renderer: 'categoryaxis'
                                },
                                yaxis: {
                                    min: 0,
                                    max: 70
                                }
                            }).chart('update', pants, {
                                label: 'pants'
                            }).chart('update', coat, {
                                label: 'coat'
                            }).chart('update', shirt, {
                                label: 'shirt'
                            })
                                    .chart('plot');
                            break;
                        case 'DEMO_SALE_ANALYTICS':
                            $widgetChart = $widget.find('div.widget-customer');
                            if ($widgetChart.length > 0) {
                                var sale_pie_analytics = [
                                    ['coat', 10],
                                    ['pants', 15],
                                    ['shirt', 20]
                                ];
                                $widgetChart.chart({
                                    chart: 'pie'
                                }).chart('clear').chart('setData', sale_pie_analytics).chart('plot');
                            } else {
                                plugin.logger.error('cannot find widget');
                            }
                            break;

                        case 'DEMO_SALE_ANALYTICS_2':

                            $widgetChart = $widget.find('div.widget-customer');
                            var data_buy_1 = [1, 3, 2];
                            var data_buy_2 = [2, 2, 7];
                            var ticks = ['pants', 'shirt', 'coat'];

                            $widgetChart.chart({
                                chart: 'column',
                                yaxis: {
                                    renderer: 'categoryaxis',
                                    ticks: ticks
                                }
                            });
                            $widgetChart.chart('clear').chart('update', data_buy_1, {
                                label: 'attention time'
                            }).chart('update', data_buy_2, {
                                label: 'number of sale (unit: 1000)'
                            }).chart('plot');
                            //
                            break;

                        case 'DEMO_ELEVATOR_USAGE':
                            $widgetChart = $widget.find('div.widget-customer');
                            var day_avg = [5, 6, 7, 45, 22, 51, 24, 31, 62, 15, 8, 4];
                            var people_avg = [5, 5, 7, 9, 6, 9, 2, 8, 10, 5, 4, 2];
                            var ticks = ['2', '4', '6', '8', '10', '12', '14', '16', '18', '20', '22', '24'];
                            $widgetChart.chart({
                                chart: 'bar',
                                xaxis: {
                                    ticks: ticks,
                                    renderer: 'categoryaxis'
                                },
                                yaxis: {
                                    min: 0,
                                    max: 70
                                }
                            });

                            $widgetChart.chart('clear')
                                    .chart('update', day_avg, {
                                        label: 'average of daily usage'
                                    })
                                    .chart('update', people_avg, {
                                        label: 'average of usage'
                                    }).chart('plot');
                            break;

                        case 'DEMO_ELEVATOR_FLOOR_USAGE':
                            $widgetChart = $widget.find('div.widget-customer');
                            var data_floor_sum = [
                                ['0 people', 30],
                                ['1 to 3 people', 30],
                                ['4 to 6 people', 50],
                                ['7 up people', 20]
                            ];
                            $widgetChart.chart({
                                chart: 'donut'
                            });
                            $widgetChart.chart('clear').chart('setData', data_floor_sum).chart('plot');
                            break;

                        case 'DEMO_REMOTE_CPU_USAGE':
                            $widgetChart = $widget.find('div.widget-customer');
                            var product_line_1 = [
                                ['2014-05', 58],
                                ['2014-06', 60],
                                ['2014-07', 62],
                                ['2014-08', 61],
                                ['2014-09', 58],
                                ['2014-10', 65]
                            ];
                            var product_line_2 = [
                                ['2014-05', 35],
                                ['2014-06', 40],
                                ['2014-07', 35],
                                ['2014-08', 70],
                                ['2014-09', 35],
                                ['2014-10', 40]
                            ];
                            $widgetChart.chart({
                                chart: 'area',
                                xaxis: {
                                    tickInterval: '1 month',
                                    tickOptions: {
                                        formatString: '%y/%m'
                                    }
                                },
                                yaxis: {
                                    min: 0,
                                    max: 80
                                }
                            });

                            $widgetChart.chart('clear').chart('update', product_line_1, {
                                label: 'Product Line 1 CPU usage avg'
                            }).chart('update', product_line_2, {
                                label: 'Product Line 2 CPU usage avg'
                            }).chart('plot');

                            break;

                        case 'DEMO_REMOTE_CPU_TEMP_AND_ISSUE':
                            $widgetChart = $widget.find('div.widget-customer');
                            var product_line_1 = [
                                ['2014-5', 55],
                                ['2014-6', 58],
                                ['2014-7', 62],
                                ['2014-8', 65],
                                ['2014-9', 60],
                                ['2014-10', 58]
                            ];
                            var product_line_2 = [
                                ['2014-5', 48],
                                ['2014-6', 50],
                                ['2014-7', 53],
                                ['2014-8', 50],
                                ['2014-9', 50],
                                ['2014-10', 48]
                            ];
                            var product_line_3 = [
                                ['2014-5', 2],
                                ['2014-6', 1],
                                ['2014-7', 3],
                                ['2014-8', 5],
                                ['2014-9', 3],
                                ['2014-10', 1]
                            ];
                            var product_line_4 = [
                                ['2014-5', 0],
                                ['2014-6', 2],
                                ['2014-7', 0],
                                ['2014-8', 1],
                                ['2014-9', 0],
                                ['2014-10', 0]
                            ];

                            $widgetChart.chart({
                                chart: 'line',
                                xaxis: {
                                    tickInterval: '1 month',
                                    tickOptions: {
                                        formatString: '%y / %m'
                                    }
                                },
                                yaxis: {
                                    min: 0,
                                    max: 60
                                }
                            })
                                    .chart('clear')
                                    .chart('update', product_line_1, {
                                        label: 'Product Line 1 temprature  avg'
                                    })
                                    .chart('update', product_line_2, {
                                        label: 'Product Line 2 temprature avg'
                                    })
                                    .chart('update', product_line_3, {
                                        label: 'Product Line 1 issue'
                                    })
                                    .chart('update', product_line_4, {
                                        label: 'Product Line 2 issue'
                                    })
                                    .chart('plot');
                            break;

                        case 'DEMO_REMOTE_HW_STATUS':
                            $widgetChart = $widget.find('div.widget-customer');
                            var data_remote_monitor_sum = [
                                ['CPU Temprature', 10],
                                ['Fan  speed', 30],
                                ['Hdd Healthy', 50],
                                ['Voltage', 10]
                            ];
                            $widgetChart.chart({
                                chart: 'donut'
                            })
                                    .chart('clear')
                                    .chart('setData', data_remote_monitor_sum).chart('plot');
                            break;

                        case 'DEMO_WSN_CO2':
                            $widgetChart = $widget.find('div.widget-customer');
                            var product_co2_1 = [
                                ['2014-8', 5],
                                ['2014-9', 4],
                                ['2014-10', 4],
                                ['2014-11', 2],
                                ['2014-12', 5]
                            ];
                            var product_co2_2 = [
                                ['2014-8', 2],
                                ['2014-9', 2],
                                ['2014-10', 1],
                                ['2014-11', 3],
                                ['2014-12', 5]
                            ];
                            var product_co2_3 = [
                                ['2014-8', 1],
                                ['2014-9', 1],
                                ['2014-10', 2],
                                ['2014-11', 2],
                                ['2014-12', 3]
                            ];
                            $widgetChart.chart({
                                chart: 'line',
                                xaxis: {
                                    tickInterval: '1 month',
                                    tickOptions: {
                                        formatString: '%y/%m'
                                    }
                                },
                                yasix: {
                                    min: 0,
                                    max: 6
                                }
                            })
                                    .chart('clear')
                                    .chart('update', product_co2_1, {
                                        label: 'CO2 Concentration 1'
                                    })
                                    .chart('update', product_co2_2, {
                                        label: 'CO2 Concentration 2'
                                    })
                                    .chart('update', product_co2_3, {
                                        label: 'CO2 Concentration 3'
                                    })
                                    .chart('plot');
                            break;
                        default:
                            plugin.logger.error('Invalid DEMO widget type:' + type);
                    } //end of switch

                    if (plugin.options.afterRefresh && typeof (plugin.options.afterRefresh) === 'function') {
//                        plugin.options.afterRefresh(plugin, $widgetChart, poolingWidgetData);
                        plugin.options.afterRefresh(plugin, $widget, poolingWidgetData);
                    }

                } else {

                    //use query data to update widget content
                    switch (type) {

                        case 'DEFAULT_SERVER_LOAD':

                            $widgetChart = $widget.find('div.widget-server-load');
                            if ($widgetChart.length > 0) {

                                var $cpuProgress = $widgetChart.find('.progress-cpu');
                                var $memProgress = $widgetChart.find('.progress-mem');
                                var $stoargeProgress = $widgetChart.find('.progress-storage');
                                var $databaseProgress = $widgetChart.find('.progress-database');

                                //init
                                $cpuProgress.progressbar({
                                    percent: 0
                                });

                                $memProgress.progressbar({
                                    percent: 0
                                });

                                $stoargeProgress.progressbar({
                                    percent: 0
                                });

                                $databaseProgress.progressbar({
                                    percent: 0
                                });
                            } else {
                                plugin.logger.error('cannot find server load widget');
                            }

                            break;

                        case 'DEFAULT_GEO_DEV_STATUS':

                            $widgetChart = $widget.find('div.widget-mapael');
                            if ($widgetChart.length > 0) {

                                plugin.logger.debug('init jq mapael');

                                $widgetChart.mapael({
                                    map: {
                                        name: "world_countries",
                                        zoom: {
                                            enabled: true
                                        },
                                        //                                tooltip :{
                                        //                                    cssClass: 'map-tooltip'
                                        //                                },
                                        defaultArea: {
                                            attrs: {
                                                stroke: "#fff",
                                                "stroke-width": 1
                                            }
                                        },
                                        defaultPlot: {
                                            eventHandlers: {
                                                click: function (e, id, mapElem, textElem) {

                                                },
                                                hover: function (e, id, mapElem, textElem) {

                                                }
                                            }
                                        }
                                    },
                                    legend: {
                                        plot: {
                                            display: true,
                                            labelAttrs: {
                                                fill: "#4a4a4a"
                                            },
                                            titleAttrs: {
                                                fill: "#4a4a4a"
                                            },
                                            marginBottom: 20,
                                            marginLeft: 30,
                                            hideElemsOnClick: {
                                                opacity: 0
                                            },
                                            title: "Numbers",
                                            slices: [{
                                                    size: 20,
                                                    type: "circle",
                                                    min: 100,
                                                    max: 500,
                                                    attrs: {
                                                        fill: "#89ff72"
                                                    },
                                                    label: "Less than 500"
                                                }, {
                                                    size: 30,
                                                    type: "circle",
                                                    min: 500,
                                                    max: 1000,
                                                    attrs: {
                                                        fill: "black"
                                                    },
                                                    label: "More than 500"
                                                }]
                                        }
                                    },
                                    plots: {
                                        'paris': {
                                            latitude: 48.86,
                                            longitude: 2.3444,
                                            value: 500,
                                            tooltip: {
                                                content: "Paris<br />Pants: 500"
                                            }
                                        },
                                        'newyork': {
                                            latitude: 40.667,
                                            longitude: -73.833,
                                            value: 2000,
                                            tooltip: {
                                                content: "New york<br /> Coats: 150"
                                            }
                                        },
                                        'sydney': {
                                            latitude: -33.917,
                                            longitude: 151.167,
                                            value: 600,
                                            tooltip: {
                                                content: "Sydney<br />Pants: 600"
                                            }
                                        },
                                        'brasilia': {
                                            latitude: -15.781682,
                                            longitude: -47.924195,
                                            value: 1000,
                                            tooltip: {
                                                content: "Brasilia<br />Coats: 99"
                                            }
                                        },
                                        'tokyo': {
                                            latitude: 35.687418,
                                            longitude: 139.692306,
                                            value: 200,
                                            tooltip: {
                                                content: "Tokyo<br />Shirts: 200"
                                            }
                                        },
                                        'taiwan': {
                                            latitude: 25.03,
                                            longitude: 121.30,
                                            value: 500,
                                            tooltip: {
                                                content: "Taiwan<br />Pants: 450"
                                            }
                                        }
                                    }
                                });
                            } else {
                                plugin.logger.error('cannot init jq mapael');

                            }

                            break;

                        case 'DEFAULT_DEV_HEALTH_STATUS':

                            $widgetChart = $widget.find('div.widget-customer');

                            plugin.logger.debug('DEFAULT_DEV_HEALTH_STATUS: ' + poolingWidgetData.chart);

                            var data = [
                                ['Abnormal', easyrandom.get(3, 1)],
                                ['Normal', easyrandom.get(30, 29)]
                            ];

                            $widgetChart.chart({
                                chart: poolingWidgetData.chart
                            }).chart('setData', data).chart('plot');

                            break;

                        case 'DEFAULT_DEV_MAINTANCE_STATUS':


                            break;

                        case 'DEFAULT_DEV_MONITOR_STATUS':


                            break;

                        case 'DEFAULT_DEV_TOP_ABNORMAL':


                            break;

                        case 'DEFAULT_WSN_OFFLINE':


                            break;

                        case 'DEFAULT_LASTEST_EVENT':


                            break;

                        case 'CUSTOMER':
//                            "{"cmd":[{"sensorId":["/SenData/Room Temp"],"pageSize":300,"agentId":"0001000EC6F0F831","datePeriod":"month","pageIndex":1,"handler":"SenHub"}],"report":"avg","chart":"line"}"

                            plugin.logger.debug('init CUSTOMER plugin');
//                            console.log(poolingWidgetData);
//                            console.log(poolingWidgetData.query);
                            var seriesIndex = 0;
                            var cmd = poolingWidgetData.query.cmd;
                            var getSeries = [];
                            var getSeriesData = [];
                            getSeries.length = cmd.length;
                            for (seriesIndex; seriesIndex < cmd.length; seriesIndex++) {
                                var currQuery = cmd[seriesIndex];
//                                console.log(currQuery.sensorId[0]);
                                getSeries[seriesIndex] = {
                                    label: currQuery.sensorId[0]
                                };

                                getSeriesData[seriesIndex] = [null];
                            }

                            var ticks = [];
                            var dateRangeType;
                            var dateRange;
                            var ticksUnit;
                            var ticksLen = 0;
                            if (!poolingWidgetData.query.hasOwnProperty('beginTs')) {

                                //表示時間序列
                                dateRangeType = poolingWidgetData.query.datePeriod;
//                                alert(dateRangeType);
                                ticksUnit = DataConverter.convDatePeriod2TickUnit(dateRangeType);
//                                alert(ticksUnit);
                                dateRange =
//                    easydate.getDateRange(dateRangeType);
                                        easydate.getDateRangeFromNow(dateRangeType);

                                plugin.logger.debug('apply date range as below (original):');
                                plugin.logger.debug(dateRange);


                                ticksLen = DataConverter.covDatePeriod2NumbersOfTick(dateRangeType);//hour,day,wwek
                                //     example: 快選為小時 => 一小時有60分 => DataConverter.addTicksWithDatePeriod(60,'2015-06-26 17:00:00','minute');
                                //     example: 快選為天 => 一天有24小時 => DataConverter.covDatePeriod2NumbersOfTick(24,'2015-06-26 17:00:00','hour');
                                //     example: 快選為月 => 一個月有幾天 => DataConverter.covDatePeriod2NumbersOfTick(30,'2015-06-26 17:00:00','day');
                                ticks = DataConverter.addTicksWithDatePeriod(
                                        ticksLen,
                                        dateRange.start, //ticks的時間不需要先經過time zone
                                        ticksUnit);

                            } else {

                                dateRange = {
                                    start: poolingWidgetData.query.beginTs,
                                    end: poolingWidgetData.query.endTs
                                };
                                plugin.logger.debug('apply date range as below (original):');
                                plugin.logger.debug(dateRange);

                                //日期區間都以day為準
                                ticksUnit = 'day';
                                dateRangeType = 'cday';//如果是客製化選日期的話，需要變更日期類型
                                //需要再加一天
                                ticksLen = easydate.dateDiff(dateRange.start, dateRange.end, 'days');
//            alert('ticksLen: ' + ticksLen);

                                if (ticksLen >= 30 && ticksLen < 365) {
                                    plugin.logger.debug('customer range by month: ');
                                    //tick = month
                                    ticksUnit = 'month';
                                    dateRangeType = 'cmonth';
                                    ticksLen = easydate.dateDiff(dateRange.start, dateRange.end, 'months');
                                }
                                else if (ticksLen >= 365) {
                                    plugin.logger.debug('customer range by year: ');
                                    ticksLen = easydate.dateDiff(dateRange.start, dateRange.end, 'years');
                                    ticksUnit = 'year';
                                    dateRangeType = 'cyear';
                                }

                                ticks = DataConverter.addTicksWithDatePeriod(
                                        ticksLen,
                                        dateRange.start,
                                        ticksUnit);
                            }

//                           console.log( getSeries);
//                            console.log( getSeriesData);

                            poolingWidgetData.query.ticks = ticks;
                            $widgetChart = $widget.find('div.widget-customer');
                            if ($widgetChart.length > 0) {
                                //init chart plugin
                                $widgetChart
                                        .chart({
//                                        series: [{label: 's1'},{label: 's2'}],
                                            series: getSeries, //add default series
                                            data: getSeriesData,
                                            chart: poolingWidgetData.query.chart
                                            , xaxis: {
                                                ticks: ticks,
                                                renderer: 'categoryaxis'
                                            }
                                        })
                                        .chart('setYaxisMinMax', poolingWidgetData.query.min, poolingWidgetData.query.max);
                                ;

                                //.chart('clear');//每次執行都要reset
                            }
                            break;

                        case 'CUSTOMER_SENSOR':

                            $widgetChart = $widget.find('div.widget-customer');
                            $widgetChart.hwmonitor({
                                autoPlay: false, //透過widget plugin來進行資料的更新
                                //            series: [ {
                                //                label: 'test'
                                //            }],
                                yaxis: {
                                    min: 0,
                                    max: 100
                                }
                            });//end of hw monitor

                            $widgetChart.hwmonitor('resizePlot');
                            break;

                        case 'CUSTOMER_FANS':
                            $widgetChart = $widget.find('div.widget-fans');
                            $widgetChart.fans();
                            break;

                        case 'CUSTOMER_BULB':
                            $widgetChart = $widget.find('div.widget-bulb');
                            $widgetChart.bulb();
                            break;

                        case 'CUSTOMER_ACTIVE_VALUE':
//                            console.log(poolingWidgetData.query);
                            var unit = '';
                            if (typeof (poolingWidgetData.query.cmd.sensorUnit) != 'undefined') {
                                unit = poolingWidgetData.query.cmd.sensorUnit[0];
                            }
                            $widgetChart = $widget.find('div.widget-activevalue');
                            $widgetChart.activevalue({
                                unit: unit
                            });
                            break;

                        case 'CUSTOMER_GSENSOR':
                            $widgetChart = $widget.find('div.widget-gsensor');
                            $widgetChart.gsensor();
                            break;
                            
                        case 'CUSTOMER_HTMLIMAGE':
                            var query = poolingWidgetData.query;
                            $widgetChart = $widget.find('div.widget-htmlimage');
                            $widgetChart.htmlimage({
                                 iconOn: query.iconOn,
                                 iconOff: query.iconOff
                            });
                            break;
                            
                        default:
                            plugin.logger.error('Invalid widget type(refreshWidget): ' + type);

                    } //end of switch widget type

                    if (plugin.options.afterRefresh && typeof (plugin.options.afterRefresh) === 'function') {
//                        plugin.options.afterRefresh(plugin, $widgetChart, poolingWidgetData);
                        plugin.options.afterRefresh(plugin, $widget, poolingWidgetData);
                    }
                }
            } else {
                plugin.logger.error('CANNOT find widget');
            }

//            $widget.widget('unblock');

        },
        //getter如果外部呼叫，有帶入參數只會回傳整個jquery object的物件，getter常數值是不能帶入物件
        getWidget: function (widget_id) {
            var plugin = this;
            plugin.logger.info('call getWidget func');
            var $widgetInstance;

            //
            var $widget = plugin.$el.find('div[data-widget-id=' + widget_id + ']');
            if ($widget.length > 0) {
                plugin.logger.debug('widget be found: ' + widget_id);
                $widgetInstance = $($widget).widget();
                //                console.log($widgetInstance);
            }

            return $widgetInstance;
        },
        //get widget id from div.widget
        getWidgetID: function ($widget) {
            var plugin = this;
            plugin.logger.info('call getWidgetID func');
            var widgetID = $widget.attr('data-widget-id');
            if (typeof (widgetID) == 'undefined') {
                plugin.logger.error('cannot find widget id: ' + widgetID);
            } else {
                plugin.logger.debug('widget id: ' + widgetID);
            }

            return widgetID;
        },
        //update widget title
        updateWidgetTitle: function (widgetData) {
            var plugin = this;
            plugin.logger.info('call updateWidgetTitle func');
            plugin.logger.debug(widgetData);
            var $widget = plugin.getWidget(widgetData.widget_id);

            $widget.widget('updateTitle', widgetData.title);
            //update local widget data on jquery
            plugin._setWidgetData(widgetData);
        },
        //get widget data
        getWidgetData: function ($widget) {

            var plugin = this;
            plugin.logger.info('call getWidgetData func');

            var widgetData = plugin.$el.data(plugin.getWidgetID($widget));
            plugin.logger.debug(widgetData);

            return widgetData;
        },
        //play all widgets (enable widgets' timer)
        play: function (startOrStop) {
            var plugin = this;
            plugin.logger.info('play: ' + startOrStop + ', curr play status: ' + plugin.isRunning);

            if (startOrStop) {
                plugin.adjustWidgets();
            } else {
                var $widgets = plugin.$el.find('div.widget');
                if ($widgets.length > 0) {
                    plugin.logger.warn('Widgets: ' + $widgets.length);

                    $.each($widgets, function (i, obj) {
                        var $widget = $(this);
//                    console.log($widget);
                        if (startOrStop) {
                            $widget.widget('startPooling');
                        } else {
                            $widget.widget('stopPooling');
                        }
                    });

                } else {
                    plugin.logger.warn('No Widgets');
                }
            }

            plugin.isRunning = startOrStop;
        },
        repositionGrid: function () {

        },
        updateGridWidth: function (newCols) {

            var plugin = this;
            plugin.logger.info('call updateGridWidth func');
            if (newCols === undefined || newCols < plugin.minCols)
            {
                newCols = plugin.minCols;
            }

            var max_columns = plugin.getMaxColNumber();
            if (newCols > max_columns)
            {
                newCols = max_columns;
            }

            // +newCols to account for scaling on zoomed browsers
            //設了才能讓girdster 置中(margin 0 auto)
            var new_width = (plugin.colWidth * newCols) + newCols;
            var $parentDivOfGridster = plugin.$el.parent();
            $parentDivOfGridster.css('max-width', new_width);

//            plugin.gridsterCanvas.generate_grid_and_stylesheet();

//            reset gridster width
            var gridster_width = plugin.gridsterCanvas.cols
                    * plugin.widgetWidth + (plugin.gridsterCanvas.cols * plugin.widgetMargins * 2);
            plugin.$el.css("width", gridster_width);
            plugin.logger.debug('gridster parent new max-width:' + new_width + ', grid width: ' + gridster_width);


            if (newCols === plugin.gridsterCanvas.cols)
            {
                return false;
            }
            else
            {
                return true;
            }
        },
        //get curret col numbers from dashboard based on browser's width
        getMaxColNumber: function () {

            //Get the column number
            var plugin = this;
            plugin.logger.info('call getMaxColNumber func');

            var $parentDivOfGridster = plugin.$el.parent();
            $parentDivOfGridster.css('max-width', '');
            var gridsterWidthOfParentDiv = $parentDivOfGridster.width();//最外圍div.gridster被撐開的width, available width

            var gridsterWidth = plugin.$el.width();//目前widgets的總width => div.gridster ul

            plugin.logger.debug('getMaxColNumber gwd:' + gridsterWidthOfParentDiv + ', gw:' + gridsterWidth);
            //breakpoints: {
            //large: 4, --------# if width is > 1200 #
            //medium: 3, ----# if width is > 1024 , < 1200 #
            //small: 2, -------# if width is < 1024 , > 480 #
            //mobile: 1 ------# if width < 480 #
            //}

//            if (gridsterWidthOfParentDiv > 1200) {
//                plugin.colNumber = 4;
//            } else if (gridsterWidthOfParentDiv < 1200 && gridsterWidthOfParentDiv > 1024 && (gridsterWidthOfParentDiv >= gridsterWidth)) {
//                plugin.colNumber = 3;
//            } else if (gridsterWidthOfParentDiv < 1024 && gridsterWidthOfParentDiv > 480 && (gridsterWidthOfParentDiv >= gridsterWidth)) {
//                plugin.colNumber = 2;
//            } else {
//                plugin.colNumber = 1;
//            }

            var newCols = Math.floor(gridsterWidthOfParentDiv / plugin.colWidth);
            plugin.colNumber = newCols;
//            alert(plugin.gridsterCanvas.cols);
            plugin.logger.debug('colNumber: ' + plugin.colNumber);
            return newCols;
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

            plugin.logger.info('call destroy func');

            plugin.clearWidgets();

            plugin.gridsterCanvas.destroy();

            // Remove any attached data from your plugin
            this.$el.removeData();
        },
        //初始化gridster plugin
        _initGridster: function () {

            var plugin = this;

            plugin.logger.info('call _initGridster func');
            plugin.gridsterCanvas =
                    plugin.$el.gridster({
//                        autogrow_cols: true,
                        widget_margins: [plugin.widgetMargins, plugin.widgetMargins], //The X & Y Margins for each widget
                        widget_base_dimensions: [plugin.widgetWidth, plugin.widgetHeight], //set min-w and min-h for widget panel
                        //                    The maximum number of columns to create. Set to `null` to disable.
//                        min_cols: 3, //min size-x
//                        max_cols: 3, //max size-y
                        //                min_cols: 4, //min size-x
                        //                max_cols: null, //max size-y
//                        max_cols: plugin.colNumber,
                        resize: {
                            enabled: true, // enable resize function

                            max_size: [4, 16], // [max_cols_occupied, max_rows_occupied]
                            min_size: [1, 8],
                            //reset resize handles by user
                            handle_class: 'widget-content-resize', //CSS class name used by resize handles.
                            handle_append_to: 'widget', //Set a valid CSS selector to append resize handles to. If value evaluates to false it's appended to the widget.

                            start: function (e, ui, $widget) {
                                plugin.logger.debug('resize start callback');
                            },
                            stop: function (e, ui, $widget) {

                                plugin.logger.debug('resize stop callback');
                                //                        plugin.logger.debug($widget);
                                //                        console.log($widget);

                                var newHeight = this.resize_coords.data.height;
                                var newWidth = this.resize_coords.data.width;

                                plugin.logger.debug('newHeight: ' + newHeight);
                                plugin.logger.debug('newWidth: ' + newWidth);
                                plugin.logger.debug('update new position:  ' + positions);

                                var positions = plugin.gridsterCanvas.serialize();
                                if (plugin.options.changeLayout && typeof (plugin.options.changeLayout) === 'function') {
                                    plugin.options.changeLayout(positions);
                                }

                                //added by ken 2015/04/08
                                plugin.logger.debug('after resize, refresh widget');//讓chart自動重畫
//                                console.log($widgetPanel);
                                var $susiWidget = $widget.find('div.widget');
                                var widgetData = plugin.getWidgetData($susiWidget);

                                if ($susiWidget.length > 0) {
                                    //目前僅虛資料分析需要重畫
                                    if (widgetData.type === 'CUSTOMER') {

                                        plugin.resizeBodyOfWidget($susiWidget, newWidth, newHeight);
                                        var $widgetChart = $susiWidget.find('div.widget-customer');
                                        if ($widgetChart.length > 0) {
                                            var resizeTimer = setTimeout(function () {
//                                                  alert('find in timer');
                                                $widgetChart.chart('resizePlot');
                                            }, 500);//!!IMPORTANT Delay
                                        } else {
                                            plugin.logger.error('cannot find widget');
                                        }
                                    } else if (widgetData.type === 'CUSTOMER_SENSOR') {

                                        plugin.resizeBodyOfWidget($susiWidget, newWidth, newHeight);
                                        var $widgetChart = $susiWidget.find('div.widget-customer');
                                        if ($widgetChart.length > 0) {
                                            var resizeTimer = setTimeout(function () {
//                                                  alert('find in timer');
                                                $widgetChart.hwmonitor('resizePlot');
                                            }, 500);//!!IMPORTANT Delay
                                        } else {
                                            plugin.logger.error('cannot find widget');
                                        }
                                    }

                                } else {
                                    plugin.logger.error('canont find widget after resize callback');
                                }
                            }

                        },
                        serialize_params: function ($widget, wgd) {

                            var $susiWidget = $($widget).find('div.widget');
                            var susiWidgetID = $susiWidget.attr('data-widget-id');
                            var serializeWidgetData = {
                                widget_id: susiWidgetID,
                                col: wgd.col,
                                row: wgd.row,
                                size_x: wgd.size_x,
                                size_y: wgd.size_y
                            };
                            plugin.logger.debug('serialize widget data as below:');
                            plugin.logger.debug(serializeWidgetData);
                            return serializeWidgetData;
                        },
                        // draggable.stop: function(event, ui){} -- A callback for when dragging stops.
                        // You can also implement other draggable options based on your requirements
                        // draggable.start: function(event, ui){} -- A callback for when dragging starts.
                        // draggable.drag: function(event, ui){} -- A callback for when the mouse is moved during the dragging.

                        draggable: {
                            start: function (event, ui) {
                                plugin.logger.debug('drag widget position: ' + ui.position.top + ' ' + ui.position.left);
                                var $currWidget = ui.$helper.find('.widget');
//                                console.log($currWidget);
                                $currWidget.widget('closeDropdownMenu');

                                plugin.updateGridWidth(plugin.getMaxColNumber());
                            },
                            stop: function (event, ui) {

                                // .serialize( )
                                // Creates an array of objects representing the current position of all widgets in the grid.
                                // Returns an Array of Objects (ready to be encoded as a JSON string) with the data specified by the serialize_params option
                                // JSON.stringify() converts a primitive value, object or array to a JSON-formatted string that can later be parsed with JSON.parse().
                                var $currWidget = ui.$helper.find('.widget');
//                                console.log($currWidget);
                                var positions = this.serialize();

//                                plugin.logger.debug(positions);
//                                console.log(positions);
                                var currWidigetPos = positions[ $currWidget.parent().index()];
                                //  {col: 4, row: 1,size_x: 1,size_y: 8}
//                                console.log(currWidigetPos);
                                plugin.logger.debug('resize callback position of widget => col: '
                                        + currWidigetPos.col + ', row: ' + currWidigetPos.row
                                        + ', size_x: ' + currWidigetPos.size_x + ', size_y: ' + currWidigetPos.size_y);

                                //要重新指定col-real for螢幕改變大小時計算使用
                                //update data-col-real value
                                $currWidget.parent().attr('data-col-real', currWidigetPos.col);
//                                console.log(positions);
//                                plugin.updateGridWidth(plugin.getMaxColNumber());

                                if (plugin.options.changeLayout && typeof (plugin.options.changeLayout) === 'function') {
                                    plugin.options.changeLayout(positions);
                                }

                            }
                        }
                    })
                    /*resize after mouse enter and leave*/
                    .on('mouseenter', '> li', function () {
                        //        console.log('mouse enter callback');
                        //        console.log($(this));
                        //        grid_canvas.resize_widget($(this), 3, 3);
                        plugin.$lastWidget = $(this);

                    })
                    .on('mouseleave', '> li', function () {
                        //        console.log('mouse leave callback');
                        //        grid_canvas.resize_widget($(this), 1, 1);
                        plugin.$lastWidget = $(this);

                    }).data('gridster');
            //end of gridster


            plugin.updateGridWidth(plugin.getMaxColNumber());
            plugin.logger.debug('gridster instance as below');
//            plugin.logger.debug(plugin.gridsterCanvas);

        },
        //初始化在gridster裡的widget
        _initWidgets: function () {

            var plugin = this;

            plugin.logger.info('call _initWidget func');

            var $Widgets = plugin.$el.find('li div.widget');
            if ($Widgets.length > 0) {

                plugin.logger.debug('init widgets one by one');
                $Widgets.each(function (i, obj) {

                    var $singleWidget = $(obj);
                    //                console.log( $singleWidget );

                    var widgetData = plugin.getWidgetData($singleWidget);

                    //init widget panel with jquery.fn.widget
                    plugin._initWidget($singleWidget, widgetData);

                }); //end of $widget each
            } else {
                plugin.logger.error('cannot init widgets');
            }
        },
        //active single widget plugin
        _initWidget: function ($singleWidget, widgetData) {
            var plugin = this;

            plugin.logger.info('call _initWidget func');

            //init susi widget
            $singleWidget.widget({
                interval: widgetData.interval,
                afterInit: function ($widget) {

                    plugin.logger.debug('_initWidget $widget.afterInit callback widget id: ' + plugin.getWidgetData($widget).widget_id);
                    //                    console.log($widget);
                    plugin.refreshWidget($widget);
                },
                afterPooling: function ($widget, poolingInstance, status) {

                    plugin.logger.debug('_initWidget $widget.afterPooling callback: ' + status);
                    //                    console.log($widget);
                    plugin.refreshWidget($widget);
                },
                afterToggle: function ($widget, status) {

                    plugin.logger.debug('_initWidget $widget.afterToggle callback: ' + status);

                    var $gridsterWidget = $widget.parent();

                    if (status == 'hide') {

                        //                        plugin.logger.debug('current size_y: ' + plugin.$lastWidget.attr('data-sizey'));
                        //

                        var old_sizey = $gridsterWidget.attr('data-sizey');
                        plugin.logger.debug('current size_y: ' + old_sizey);
                        //save original data-sizex
                        $gridsterWidget.data('data-old-sizey', old_sizey);

                        plugin.gridsterCanvas.resize_widget($gridsterWidget, $gridsterWidget.attr('data-sizex'), 1);

                    } else {
                        //read original data-sizey
                        var old_sizey = $gridsterWidget.data('data-old-sizey');
                        plugin.logger.debug('previous size_y: ' + old_sizey);
                        plugin.gridsterCanvas.resize_widget($gridsterWidget, $gridsterWidget.attr('data-sizex'), old_sizey);
                    }

                },
                beforeRemove: function ($widget) {
                    plugin.logger.debug('_initWidget $widget.beforeRemove callback');

                    //                        var $gridsterWidget = $widget.parent();
                    var widgetData = plugin.getWidgetData($widget);

                    if (plugin.options.beforeRemove && typeof (plugin.options.beforeRemove) === 'function') {
                        plugin.options.beforeRemove(plugin, $widget, widgetData);
                    }
                },
                afterRemove: function ($widget, status) {

                    plugin.logger.debug('_initWidget $widget.afterRemove callback');


                    //                    console.log($widget);

                    //                    var $gridsterWidget = $widget.parent();
                    //                    var keepWidgetID = plugin.getWidgetID($widget);
                    //                    
                    //                    plugin.gridsterCanvas.remove_widget($gridsterWidget, function() {
                    //                        plugin.logger.debug('_initWidget $widget. widget after remove callback');
                    //                      
                    //                        //remove data from plugin.$el
                    //                        if(typeof($widget) != 'undefined'){
                    //                            $($widget).widget('destory');
                    //                            plugin._removeWidgetData(keepWidgetID);
                    //                        }else{
                    //                             plugin.logger.error('cannot find $widget object');
                    //                        }
                    //                        
                    //                    });
                },
                afterThemeActive: function ($widget, active) {
                    plugin.logger.debug('_initWidget $widget.afterThemeActive callback: ' + active);
                    var widgetData = plugin.getWidgetData($widget);

                    if (plugin.options.afterThemeActive && typeof (plugin.options.afterThemeActive) === 'function') {
                        plugin.options.afterThemeActive(plugin, $widget, widgetData, active);
                    }
                },
                afterConfigDataAnalyticsActive: function ($widget, active) {
                    plugin.logger.debug('_initWidget $widget.afterConfigDataAnalyticsActive callback: ' + active);
                    var widgetData = plugin.getWidgetData($widget);

                    if (plugin.options.afterConfigDataAnalyticsActive && typeof (plugin.options.afterConfigDataAnalyticsActive) === 'function') {
                        plugin.options.afterConfigDataAnalyticsActive(plugin, $widget, widgetData);
                    }
                },
                afterConfigTextActive: function ($widget, active) {
                    plugin.logger.debug('_initWidget $widget.afterConfigTextActive callback: ' + active);
                    var widgetData = plugin.getWidgetData($widget);

                    if (plugin.options.afterConfigTextActive && typeof (plugin.options.afterConfigTextActive) === 'function') {
                        plugin.options.afterConfigTextActive(plugin, $widget, widgetData, active);
                    }
                }

            }); //end of susi widget init

            //active widget
            //應由init後觸發即可
            //            plugin.refreshWidget($singleWidget);
        },
        /*generate all widget in the gridster*/
        _appendGridsterHtml: function () {
            var plugin = this;

            var opts = plugin.options;
            var wdata = opts.data;

            plugin.logger.info('call _appendGridsterHtml func');
            //            console.log(wdata);
            wdata = Gridster.sort_by_row_and_col_asc(wdata);

            //            console.log(wdata);
            plugin.$el.empty();//reset li
            var girdsterHtml = "";
            for (var i = 0; i < wdata.length; i++) {

                //get the instanst
                var wObj = wdata[i];
                plugin.logger.debug(wObj);

                //save widget data into $.data
                plugin._setWidgetData(wObj);

                girdsterHtml += plugin._appendGridsterWidget(wObj);
                plugin.widgetIndex++;
            }
            plugin.$el.append(girdsterHtml);


            /*
             for (var i = 0; i < wdata.length; i++) {
             
             //get the instanst
             var wObj = wdata[i];
             plugin.logger.debug(wObj);
             plugin.addWidget(wObj);
             }
             */

        },
        _appendGridsterWidget: function (widgetData) {
            var plugin = this;
            plugin.logger.info('call _appendGridsterWidget func');


            //加入data-col-real/data-sizex-real來偵側螢幕的大小來動態切換widget
            var liElem = null;
            if (widgetData.type === 'CUSTOMER') {
//                
                liElem = '<li  data-min-sizex="2" data-min-sizey="8"  data-row="' + widgetData.row + '" data-col-real="' + widgetData.col + '" data-col="' + widgetData.col + '" data-sizex-real="' + widgetData.size_x + '" data-sizex="' + widgetData.size_x + '" data-sizey="' + widgetData.size_y + '">' +
                        plugin._appendWidget(widgetData) +
                        '</li>';
            } else {
                liElem = '<li data-row="' + widgetData.row + '" data-col-real="' + widgetData.col + '" data-col="' + widgetData.col + '" data-sizex-real="' + widgetData.size_x + '" data-sizex="' + widgetData.size_x + '" data-sizey="' + widgetData.size_y + '">' +
                        plugin._appendWidget(widgetData) +
                        '</li>';
            }

            return liElem;
        },
        /*append differenct widget html based on widget info*/
        _appendWidget: function (widgetData) {

            var widgetHtml = "";

            var plugin = this;

            plugin.logger.info('call _appendWidget func');

            var type = widgetData.type;
            plugin.logger.debug('widget type:' + type);

            if (type.indexOf('DEMO_') >= 0) {
                plugin.logger.debug('WPC Demo chart');
                //                 switch(type){
                //                    case 'DEMO_SALE_ANALYTICS':
                //                        widget.content = plugin._appendCustomerContent();
                //                        break;
                //                    default:
                //                        plugin.logger.error('Invalid DEMO widget type (_appendWidget):' + type);
                //                }//end of switch

                widgetData.content = plugin._appendCustomerContent();
            } else {

                switch (type) {

                    case 'DEFAULT_SERVER_LOAD':

                        //set widget json obj
                        widgetData.title = widgetData.title;
                        widgetData.content = plugin._appendServerLoadContent();

                        break;

                    case 'DEFAULT_GEO_DEV_STATUS':

                        //                        widgetData.title = 'GEO Device Map';
                        widgetData.title = 'Sales Map'
                        widgetData.content = plugin._appendGEOMapContent();

                        break;

                    case 'DEFAULT_DEV_HEALTH_STATUS':

                        widgetData.title = 'Device Health Status';
                        widgetData.content = plugin._appendDeviceHealthStatusContent();
                        break;

                    case 'DEFAULT_DEV_MAINTANCE_STATUS':

                        widgetData.title = 'Device Maintance Status';
                        widgetData.content = plugin._appendDeviceMaintanceStatusContent();

                        break;

                    case 'DEFAULT_DEV_MONITOR_STATUS':

                        widgetData.title = 'Device Monitor Status';
                        widgetData.content = plugin._appendDeviceMonitorStatusContent();

                        break;

                    case 'DEFAULT_DEV_TOP_ABNORMAL':

                        widgetData.title = 'Top 10 Abnormal Devices';
                        widgetData.content = plugin._appendDeviceTopAbnormalContent();

                        break;

                    case 'DEFAULT_WSN_OFFLINE':

                        widgetData.title = 'WSN Offine';
                        widgetData.content = plugin._appendWSNOfflineContent();

                        break;

                    case 'DEFAULT_LASTEST_EVENT':

                        widgetData.title = 'Latest Event';
                        widgetData.content = plugin._appendLastestEventContent();

                        break;

                    case 'CUSTOMER':

                        widgetData.content = plugin._appendCustomerContent();

                        break;

                    case 'CUSTOMER_SENSOR':

                        widgetData.content = plugin._appendCustomerContent();

                        break;

                    case 'CUSTOMER_FANS':

                        widgetData.content = plugin._appendCustomerFANsContent();

                        break;

                    case 'CUSTOMER_BULB':

                        widgetData.content = plugin._appendCustomerBulbContent();

                        break;

                    case 'CUSTOMER_ACTIVE_VALUE':

                        widgetData.content = plugin._appendCustomerActiveValueContent();

                        break;

                    case 'CUSTOMER_GSENSOR':

                        widgetData.content = plugin._appendCustomerGSENSORContent();

                        break;

                    case 'CUSTOMER_HTMLIMAGE':

                        widgetData.content = plugin._appendCustomerHTMLImageContent();

                        break;

                    default:
                        plugin.logger.error('Invalid widget type(_appendWidget): ' + type);

                } //end of switch
            }

            widgetHtml = plugin._appendWidgetHtml(widgetData);

            return widgetHtml;
        },
        _appendServerLoadContent: function () {
            var html = '';
            html += '<div class="widget-server-load">';
            html += '<span class="progress-cpu-name" lang="en" langtag="Srv_001">CPU Usage</span>';
            html += '<div class="progress progress-striped">';
            html += '<div class="progress-cpu progress-bar " style="width: 0%">0%</div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="widget-server-load">';
            html += '<span class="progress-mem-name" lang="en" langtag="Srv_002">MEM Usage</span>';
            html += '<div class="progress progress-striped">';
            html += '<div class="progress-mem progress-bar" style="width: 0%">0%</div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="widget-server-load">';
            html += '<span class="progress-storage-name" lang="en" langtag="Srv_003">Storage Usage</span>';
            html += '<div class="progress progress-striped">';
            html += '<div class="progress-storage progress-bar" style="width: 0%">0%</div>';
            html += '</div>';
            html += '</div>';

//            html += '<div class="widget-server-load">';
//            html += '<span>Database Usage</span>';
//            html += '<div class="progress progress-striped">';
//            html += '<div class="progress-database progress-bar" style="width: 0%">0%</div>';
//            html += '</div>';
//            html += '</div>';

            return html;
        },
        _appendGEOMapContent: function () {
            var plugin = this;
            var html = '<div id="mapael_' + plugin.widgetIndex + '" class="widget-mapael">';
            html += '<div class="map"></div>';
            html += '<div class="plotLegend"><span></span></div>'
            html += '</div>';
            return html;
        },
        /*Dev status widget START*/
        _appendDeviceHealthStatusContent: function () {
            var plugin = this;
            var html = '<div class="widget-timeframe"><span>TimeFrame: </span><small>Last 24 hours</small></div><div id="jqplot_' + plugin.widgetIndex + '"class="widget-customer"></div>';

            return html;
        },
        _appendDeviceMaintanceStatusContent: function () {
            var plugin = this;
            var html = '<div id="jqplot_' + plugin.widgetIndex + '"class="widget-customer"></div>';
            return html;
        },
        _appendDeviceMonitorStatusContent: function () {
            var plugin = this;
            var html = '<div id="jqplot_' + plugin.widgetIndex + '"class="widget-customer"></div>';
            return html;
        },
        _appendDeviceTopAbnormalContent: function () {
            var html = '<table class="widget-table">';
            html += '<tbody>';

            html += '<tr>';
            html += '<td>1</td>';
            html += '<td>DS-061-PC</td>';
            html += '<td><span class="badge">10</span></td>';
            html += '</tr>';

            html += '<tr>';
            html += '<td>2</td>';
            html += '<td>AIMB-281KK</td>';
            html += '<td><span class="badge">6</span></td>';
            html += '</tr>';

            html += '<tr>';
            html += '<td>3</td>';
            html += '<td>DS-011-PC</td>';
            html += '<td><span class="badge">1</span></td>';
            html += '</tr>';

            html += '</tbody>';
            html += '</table>';

            return html;
        },
        _appendWSNOfflineContent: function () {
            var html = '<table class="widget-table">';
            html += '<tbody>';

            html += '<tr>';
            html += '<td class="widget-table-date">Today at 12:01</td>';
            html += '<td>WSN-001</td>';
            html += '<td>D8-17-DC-23-9F-6F</td>';
            html += '</tr>';

            html += '<tr>';
            html += '<td class="widget-table-date">Yesterday at 16:34</td>';
            html += '<td>WSN-002</td>';
            html += '<td>7B-77-0C-1D-F6-A9</td>';
            html += '</tr>';

            html += '<tr>';
            html += '<td class="widget-table-date">22nd June 2012</td>';
            html += '<td>WSN-002</td>';
            html += '<td>97-D9-A2-62-4B-A4</td>';
            html += ' </tr>';

            html += '</tbody>';
            html += '</table>';

            return html;
        },
        _appendLastestEventContent: function () {
            var html = '<table class="widget-table">';
            html += '<tbody>';

            html += '<tr>';
            html += '<td class="widget-table-date">Today at 12:01</td>';
            html += '<td>DS-061-PC</td>';
            html += '<td><span class="label label-waring">Error</span></td>';
            html += '<td>Agent Network Error</td>';
            html += '</tr>';

            html += '<tr>';
            html += '<td class="widget-table-date">Yesterday at 16:34</td>';
            html += '<td>AIMB-281KK</td>';
            html += '<td><span class="label label-waring">Error</span></a></td>';
            html += '<td>System Backup/Recovery Download Error</td>';
            html += '</tr>';

            html += '<tr>';
            html += '<td class="widget-table-date">22nd June 2012</td>';
            html += '<td>DS-061-PC</td>';
            html += '<td><span class="label label-waring">Error</span></td>';
            html += '<td>Power Reboot</td>';
            html += '</tr>';

            html += '</tbody>';
            html += '</table>';
            return html;
        },
        //        for jq-plot
        _appendCustomerContent: function () {
            var plugin = this;
            //jqplot need elem id
            var html = '<div id="jqplot_' + plugin.widgetIndex + '"class="widget-customer"></div>';
            return html;
        },
        _appendCustomerFANsContent: function () {
            var plugin = this;
            var html = '<div id="fans_' + plugin.widgetIndex + '" class="widget-fans"></div>';
            return html;
        },
        _appendCustomerBulbContent: function () {
            var plugin = this;
            var html = '<div id="bulb_' + plugin.widgetIndex + '" class="widget-bulb"></div>';
            return html;
        },
        _appendCustomerHTMLImageContent: function () {
            var plugin = this;
            var html = '<div id="htmlimage_' + plugin.widgetIndex + '" class="widget-htmlimage"></div>';
            return html;
        },
        _appendCustomerActiveValueContent: function () {
            var plugin = this;
            var html = '<div id="activeval_' + plugin.widgetIndex + '" class="widget-activevalue"></div>';
            return html;
        },
        _appendCustomerGSENSORContent: function () {
            var plugin = this;
            var html = '<div id="gsensor_' + plugin.widgetIndex + '" class="widget-gsensor"></div>';
            return html;
        },
        //widget panel
        _appendWidgetHtml: function (widgetData) {
            var plugin = this;
            plugin.logger.info('call _appendWidgetHtml func');
            plugin.logger.debug(widgetData);

            var widgetStyle = 'widget';//default style
            if (typeof (widgetData.query) !== 'undefined' && widgetData.query != '') {
                var queryInfo = widgetData.query;

                if (typeof (queryInfo.theme) !== 'undefined' && widgetData.queryInfo != '') {
                    plugin.logger.debug('widget theme: ' + queryInfo.theme);
                    widgetStyle += ' widget-' + queryInfo.theme;
                }
            }

            var basicWidgetHtml = '<div class="' + widgetStyle + '" data-widget-id="' + widgetData.widget_id + '">';
            basicWidgetHtml += '<div class="widget-header">';
            if (widgetData.type == 'DEFAULT_SERVER_LOAD') {
                basicWidgetHtml += '<h3 lang="en" langtag="Ser_011"></h3>';
            } else {
                basicWidgetHtml += '<h3 title="' + widgetData.title + '">' + widgetData.title + '</h3>';
            }

            if (typeof (widgetData.subtitle) != 'undefined' && widgetData.subtitle != '') {
                basicWidgetHtml += '<span class="widget-header-subtitle">' + widgetData.subtitle + '</span>';
            }

            //
            // toolbar
            //
            basicWidgetHtml += '<div class="widget-header-toolbar">';//widget-header-toolbar START



            basicWidgetHtml += '<ul class="widget-header-toolbar-btn-group">';//toolbar START

            if (widgetData.type != 'DEFAULT_SERVER_LOAD') {
                basicWidgetHtml += '<li>';
                basicWidgetHtml += '<a data-role="none" href="javascript:void(0)" class=" widget-header-toolbar-btn-config"></a>';


                basicWidgetHtml += ' <ul data-role="none" class="widget-dropdown-menu dropdown-menu">';//level dropdown menu  START

                basicWidgetHtml += ' <li data-role="none"><a data-role="none" data-active="title_desc" lang="en" langtag="Das_014">Title and Desc</a></li>';
                if (widgetData.type === 'CUSTOMER') {
//                basicWidgetHtml += ' <li data-role="none"><a data-role="none" data-active="data_analytics" lang="en" langtag="Das_015">Edit data analytics</a></li>';
                }
                basicWidgetHtml += '</ul>';  //level dropdown menu  END
                basicWidgetHtml += '</li>';
            }




            basicWidgetHtml += '<li>';
            basicWidgetHtml += '<a data-role="none" href="javascript:void(0)" class=" widget-header-toolbar-btn-color"></a>';
            basicWidgetHtml += ' <ul data-role="none" class="widget-dropdown-menu dropdown-menu">';//level dropdown menu  START
            basicWidgetHtml += ' <li data-role="none"><a data-role="none" data-active="default" lang="en" langtag="Das_016">Default</a></li>';
            basicWidgetHtml += ' <li data-role="none"><a data-role="none" data-active="primary" lang="en" langtag="Das_017">Primary</a></li>';
            basicWidgetHtml += ' <li><a data-role="none" data-active="success" lang="en" langtag="Das_018">Success</a></li>';
            basicWidgetHtml += ' <li><a data-role="none" data-active="info" lang="en" langtag="Das_019">Info</a></li>';
            basicWidgetHtml += ' <li><a data-role="none" data-active="warning" lang="en" langtag="Das_020">Warning</a></li>';
            basicWidgetHtml += ' <li><a data-role="none" data-active="danger" lang="en" langtag="Das_021">Danger</a></li>';
            basicWidgetHtml += '</ul>';  //level dropdown menu  END
            basicWidgetHtml += '</li>';

//            basicWidgetHtml += '<li><a data-role="none" href="javascript:void(0)" class=" widget-header-toolbar-btn-toggle-collapse"></a></li>';
            basicWidgetHtml += '<li><a data-role="none" href="javascript:void(0)" class=" widget-header-toolbar-btn-remove"></a></li>';
            basicWidgetHtml += '</ul>';//toolbar END

            basicWidgetHtml += '</div>';//widget-header-toolbar END

            basicWidgetHtml += ' </div>';//widget title  END

//            <!--widget content  START-->
            basicWidgetHtml += '<div class="widget-content">';
            basicWidgetHtml += widgetData.content;
            basicWidgetHtml += '<span class="widget-content-resize"></span>';
            basicWidgetHtml += '</div>';
//            <!--widget content  END-->

            basicWidgetHtml += '<div class="widget-footer">';
            basicWidgetHtml += '</div>';
            basicWidgetHtml += '</div>';
//            <!--widget  END-->
            return basicWidgetHtml;
        },
        //save widget data into $.data
        _setWidgetData: function (widgetData) {

            var plugin = this;

            plugin.logger.info('call _setWidgetData func');
            plugin.logger.debug(widgetData);
            plugin.$el.data(widgetData.widget_id.toString(), widgetData);
        },
        //remove widget data into $.data
        _removeWidgetData: function (widgetID) {
            var plugin = this;
            plugin.logger.info('call _removeWidgetData func');
            plugin.logger.debug('remove widget data from id: ' + widgetID);
            $.removeData(plugin.$el, widgetID);
        }

    }

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
    $.fn[pluginName].getters = ['count', 'getMaxColNumber'];

    /**
     * Default options
     */
    $.fn[pluginName].defaults = {
        data: [], //init widget list
        afterAdd: null,
        changeLayout: null,
        afterRefresh: null,
        //widget plugin
        afterRemove: null,
        beforeRemove: null, //for confirm dialog for end user
        afterActive: null,
        afterThemeActive: null,
        afterConfigTextActive: null
    };

})(jQuery);