/* jqPlot widget
 * @date 2015/08/18
 * @requried
 * js/libs/charts/jqplot/*
 * js/libs/log4javascript/log4javascript.min.js
 * js/sa/utils/log4jq.js
 * js/sa/ui/chart.js
 */
(function () {

    var logger = log4jq.getLogger({
        loggerName: 'SA.wg.jqplot.js'
    });
    logger.info('loaded');
    logger.info('add jqplot style');

    /*
     * i18n 
     
     if (typeof (i18n) != 'undefined') {
     //        plugins_wd.<WIDGET_NAME>.<WIDGET_FIELD>
     */

    /*
     * 
     * Global jqplot settings
     * 
     */
    freeboard.addStyle('.jqplot-highlighter', 'background:#fff;color: #000;');
    freeboard.addStyle('.jqplot-highlighter-tooltip', 'z-index: 25;');

    
    //common settings for different chart type
    var commonjqPlotSettings = [
        {
            name: "title",
            validate: 'optional,maxSize[100]',
            display_name: $.i18n.t('global.title'),
            type: "text"
        },
        {
            name: 'chartType',
            display_name: $.i18n.t('global.plugins_wd.chart_type'),
            //$.i18n.t('plugins_wd.gauge.type'),
            type: 'option',
            required: true,
            options: [
                {
                    name: $.i18n.t('global.plugins_wd.chart_type_options.line'),
//                                $.i18n.t('plugins_wd.text.chart_type_options.line'),
                    value: 'line'
                },
                {
                    name: $.i18n.t('global.plugins_wd.chart_type_options.area'),
//                                            $.i18n.t('plugins_wd.text.chart_type_options.area'),
                    value: 'area'
                },
                {
                    name: $.i18n.t('global.plugins_wd.chart_type_options.bar'),
//                                $.i18n.t('plugins_wd.text.chart_type_options.bar'),
                    value: 'bar'
                },
                {
                    name: $.i18n.t('global.plugins_wd.chart_type_options.scatter'),
                    value: 'scatter'
                }
            ]
        },
        {
            name: "value",
            display_name: $.i18n.t('global.data'),
            type: "calculated"
//                ,multi_input: "true"
        },
        {
            name: "enableYaxisMaxMix",
            display_name: $.i18n.t('global.plugins_wd.enableYaxisMaxMix'),
            type: "boolean"
//                ,multi_input: "true"
        },
        {
            name: "yaxisMin",
            display_name: $.i18n.t('global.plugins_wd.min_value'),
//                    "Min Value",
            type: "number",
            default_value: 0
//            ,
//            description: 'Y-axix min value'
        },
        {
            name: "yaxisMax",
            display_name: $.i18n.t('global.plugins_wd.max_value'),
//                    "Max Value",
            type: "number",
            default_value: 100
//            ,
//            description: 'Y-axix max value'
        },
        {
            name: "enableWidthHeight",
            display_name: $.i18n.t('global.plugins_wd.enable_chart_width_heigth'),
            type: "boolean"
//                ,multi_input: "true"
        },
        {
            name: "chartWidth",
            display_name: $.i18n.t('global.plugins_wd.chart_width'),
//                    "Chart Widgth (px)",
            type: "number",
            default_value: 300
//            ,
//            description: "chart width in pixels"
        },
        {
            name: "chartHeight",
            display_name: $.i18n.t('global.plugins_wd.chart_height'),
//                    "Chart Height (px)",
            type: "number",
            default_value: 300
//            ,
//            description: "chart height in pixels"
        }, {
            name: "height",
            display_name: $.i18n.t('global.plugins_wd.blocks'),
//                    "Height Blocks",
            type: "number",
            default_value: 5,
            validate: 'required,custom[integer],min[1],max[20]',
            description: $.i18n.t('global.plugins_wd.blocks_desc')
//                    "A height block is around 60 pixels"
        }, {
            name: 'backgroundOfGrid',
            display_name: $.i18n.t('global.plugins_wd.chart_background_color_of_grid'),
//                    'Background color of grid',
            type: 'color',
            validate: 'required,custom[hexcolor]',
            default_value: '#000',
            description: $.i18n.t('global.plugins_wd.default_color', '#000')
//                    'default: #000'
        },
        {
            name: 'lineColorOfGrid',
            display_name: $.i18n.t('global.plugins_wd.chart_line_color_of_grid'),
//                    'Line color of grid',
            type: 'color',
            validate: 'required,custom[hexcolor]',
            default_value: '#222',
            description: $.i18n.t('global.plugins_wd.default_color', '#222')
//                    'default: #222'
        },
        {
            name: 'borderColorOfGrid',
            display_name: $.i18n.t('global.plugins_wd.chart_border_color_of_grid'),
//                    'Border color of grid',
            type: 'color',
            validate: 'required,custom[hexcolor]',
            default_value: '#222',
            description: $.i18n.t('global.plugins_wd.default_color', '#222')
//                    'default: #222'
        }];

    //all jqplot id 
    var jqPlotId = 0;

    /*依目前的資料來源設定檔取得資料來源*/
    var getDataSourceModel = function (dataSourceConfig) {
        logger.info('getDataSourceModel: ' + dataSourceConfig);
        //load datasource plugin 
        var datasourceRegex = new RegExp("datasources.([\\w_-]+)|datasources\\[['\"]([^'\"]+)", "g");
        var matches = datasourceRegex.exec(dataSourceConfig);
      
        var dsName = matches[0].replace('datasources[\"', '');
        logger.info('getDataSourceModel dsName: ' + dsName);
        var datasourceModel = freeboard.getDatasourceSettings(dsName);
        return datasourceModel;
    };

    /*
     * jqplot Line Monitor Widget
     * @param {JSON} settings
     * @returns {object}
     */

    var jqPlotLineMonitorWidget = function (settings) {

        var jqPlotLineMonitorWidgetLog =
                log4jq.getLogger(
                        {loggerName: 'jqPlotLineMonitorWidget'
                        });
        var self = this;
        var currentSettings = settings;

        //chart variables
        jqPlotId++;
        var $chartDiv = null;
        var updateData = null;
        var chartJqplotId = 'jqplotId_' + jqPlotId;

        var $chartTitleH2 = null;
        self.widgetType = 'jqPlotLine';

        var createjqPlotLineMonitorChart = function (currentSettings) {

            // logger.info('createjqPlotChart');
            jqPlotLineMonitorWidgetLog.info('createjqPlotLineMonitorChart as below: ');
            jqPlotLineMonitorWidgetLog.debug(currentSettings);
            // alert('charttype: ' + currentSettings.charttype);
            jqPlotLineMonitorWidgetLog.debug('jqplot elem id: ' + chartJqplotId);

            $chartDiv = $('#' + chartJqplotId);

            if ($chartDiv.length > 0) {

                var $widgetOfLI = $chartDiv.parent().parent().parent().parent();
                if (currentSettings.enableWidthHeight) {
                    $chartDiv.css('width', currentSettings.chartWidth * 0.9);
                    $chartDiv.css('height', currentSettings.chartHeight * 0.9);
                } else {
                    $chartDiv.css('width', $widgetOfLI.attr('data-sizex') * 300 * 0.9);
                    $chartDiv.css('height', currentSettings.height * 60 * 0.9);
                }

                var initOpts = {
                    theme: {
                        axis: {
                            tickColor: '#d4d4d4'
                        }
                        , series: {
                            color: currentSettings.monitorColor
                        }, grid: {
                            background: currentSettings.backgroundOfGrid,
                            gridLineColor: currentSettings.lineColorOfGrid,
                            borderColor: currentSettings.borderColorOfGrid
                        }
                    }};
//                initOpts.yaxis = {
                //                    min: currentSettings.yaxisMin,
//                    max: currentSettings.yaxisMax
                //                };

                jqPlotLineMonitorWidgetLog.debug('jqplot init opts as below: '); //                jqPlotLineMonitorWidgetLog.debug(initOpts);
                $chartDiv
                        .hwmonitor(initOpts);

                if (currentSettings.enableYaxisMaxMix) {
                    //鎖定y-axis
                    $chartDiv.hwmonitor('setYaxisMinMax',
                            currentSettings.yaxisMin,
                            currentSettings.yaxisMax);
                }
                //                        .hwmonitor('setLineColor',currentSettings.monitorColor)

                $chartDiv.css('margin', 'auto');

            } else {
                jqPlotLineMonitorWidgetLog.error('cannot find id: ' + chartJqplotId);
            }

        };
        var destroyjqPlotLineMonitorChart = function () {
            $chartDiv.hwmonitor('destroy');
        };
        var updateData = function (newValue) {

            jqPlotLineMonitorWidgetLog.info('updateData as below: ');
            jqPlotLineMonitorWidgetLog.debug(newValue);

            var date = (new Date()).getTime();
            var smapleData = [date, newValue];

            $chartDiv.hwmonitor('update', smapleData);

        };

        var updateTitle = function (newTitle) {
            jqPlotLineMonitorWidgetLog.info('updateTitle as below: ' + newTitle);
            if (newTitle.length > 0) {
                $chartTitleH2.html(newTitle);

            }
        };

        self.render = function (containerElement) {

            jqPlotLineMonitorWidgetLog.info('render');

            //add external css
            //            $(element).append('<link rel="stylesheet" href="http://cdnjs.cloudflare.com/ajax/libs/jqPlot/1.0.8/jquery.jqplot.min.css" />');

            //add the chart div to the dom
            var chartElem = '<div id="' + chartJqplotId + '"></div>';
            var titleElem = '<h2 class="section-title"></h2>';

            $chartDiv = $(chartElem);
            $chartTitleH2 = $(titleElem);

            var $containerElement = $(containerElement);
            $containerElement.append($chartTitleH2);
            $containerElement.append($chartDiv);

            self.onSettingsChanged(currentSettings);
        };

        self.onSettingsChanged = function (newSettings) {

            jqPlotLineMonitorWidgetLog.info('onSettingsChanged as below: ');
            jqPlotLineMonitorWidgetLog.debug(newSettings);
            currentSettings = newSettings;

            if (currentSettings.hasOwnProperty('monitorColor')) {
                destroyjqPlotLineMonitorChart();
            }
            if (currentSettings.hasOwnProperty('enableYaxisMaxMin')) {
                destroyjqPlotLineMonitorChart();
            }
            if (currentSettings.hasOwnProperty('backgroundOfGrid')) {
                destroyjqPlotLineMonitorChart();
            }
            if (currentSettings.hasOwnProperty('lineColorOfGrid')) {
                destroyjqPlotLineMonitorChart();
            }
            if (currentSettings.hasOwnProperty('borderColorOfGrid')) {
                destroyjqPlotLineMonitorChart();
            }

            if (currentSettings.hasOwnProperty('title')) {
                updateTitle(currentSettings.title);
            }
            createjqPlotLineMonitorChart(currentSettings);
        };

        self.onPaneWidgetChanged = function (col_width) {
//            alert(col_width);
            jqPlotLineMonitorWidgetLog.info('onPaneWidgetChanged: new col is ' + col_width);
            destroyjqPlotLineMonitorChart();
            createjqPlotLineMonitorChart(currentSettings);
        };

        //seems to be called after render whenever a calculated value changes
        self.onCalculatedValueChanged = function (settingName, newValue, agentConnection) {

            jqPlotLineMonitorWidgetLog.debug('onCalculatedValueChanged settingName: ' + settingName);
            
            
            //Add icon to specify agent connect or not
            if ((agentConnection === false && !$chartTitleH2.hasClass('agentDisconnect')) || (agentConnection === true && $chartTitleH2.hasClass('agentDisconnect'))) {
                $chartTitleH2.toggleClass('agentDisconnect');
                $chartTitleH2.removeAttr('title');
            }

            if (settingName == 'title') {
                updateTitle(newValue);
            }
            if (settingName == 'value') {

                updateData(newValue);
            }
        };

        self.getHeight = function () {
            jqPlotLineMonitorWidgetLog.info('getHeight');
            return Number(currentSettings.height);
        };


    };

    var jqplotMonitorSetting = [
        {
            name: "title",
            validate: 'optional,maxSize[100]',
            display_name: $.i18n.t('global.title'),
            type: "text"
        },
        {
            name: "value",
            display_name: $.i18n.t('global.data'),
            type: "calculated"
//                ,multi_input: "true"
        },
        {
            name: "enableYaxisMaxMix",
            display_name: $.i18n.t('global.plugins_wd.enableYaxisMaxMix'),
            type: "boolean"
//                ,multi_input: "true"
        },
        {
            name: "yaxisMin",
            display_name: $.i18n.t('global.plugins_wd.min_value'),
//                    "Min Value",
            type: "number",
            default_value: 0
//            ,
//            description: 'Y-axix min value'
        },
        {
            name: "yaxisMax",
            display_name: $.i18n.t('global.plugins_wd.max_value'),
//                    "Max Value",
            type: "number",
            default_value: 100
//            ,
//            description: 'Y-axix max value'
        },
        {
            name: "enableWidthHeight",
            display_name: $.i18n.t('global.plugins_wd.enable_chart_width_heigth'),
            type: "boolean"
//                ,multi_input: "true"
        },
        {
            name: "chartWidth",
            display_name: $.i18n.t('global.plugins_wd.chart_width'),
//                    "Chart Widgth (px)",
            type: "number",
            default_value: 300
//            ,
//            description: "chart width in pixels"
        },
        {
            name: "chartHeight",
            display_name: $.i18n.t('global.plugins_wd.chart_height'),
//                    "Chart Height (px)",
            type: "number",
            default_value: 300
//            ,
//            description: "chart height in pixels"
        }, {
            name: "height",
            display_name: $.i18n.t('global.plugins_wd.blocks'),
//                    "Height Blocks",
            type: "number",
            default_value: 5,
            validate: 'required,custom[integer],min[1],max[20]',
            description: $.i18n.t('global.plugins_wd.blocks_desc')
//                    "A height block is around 60 pixels"
        },
        //theme
        {
            name: 'monitorColor',
            display_name: $.i18n.t('global.plugins_wd.chart_line_color'),
//                    'line color',
            type: 'color',
            validate: 'required,custom[hexcolor]',
            default_value: '#00ff00',
            description: 'default: #00ff00'
        },
        {
            name: 'backgroundOfGrid',
            display_name: $.i18n.t('global.plugins_wd.chart_background_color_of_grid'),
//                    'Background color of grid',
            type: 'color',
            validate: 'required,custom[hexcolor]',
            default_value: '#000',
            description: $.i18n.t('global.plugins_wd.default_color', '#000')
//                    'default: #000'
        },
        {
            name: 'lineColorOfGrid',
            display_name: $.i18n.t('global.plugins_wd.chart_line_color_of_grid'),
//                    'Line color of grid',
            type: 'color',
            validate: 'required,custom[hexcolor]',
            default_value: '#222',
            description: $.i18n.t('global.plugins_wd.default_color', '#222')
//                    'default: #222'
        },
        {
            name: 'borderColorOfGrid',
            display_name: $.i18n.t('global.plugins_wd.chart_border_color_of_grid'),
//                    'Border color of grid',
            type: 'color',
            validate: 'required,custom[hexcolor]',
            default_value: '#222',
            description: $.i18n.t('global.plugins_wd.default_color', '#222')
//                    'default: #222'
        }
    ];

    var jqPlotLineMonitorWidgetPlugin = {
        type_name: 'jqplotLineMonitor',
        display_name: $.i18n.t('plugins_wd.jqplot_line_monitor.display_name'),
        description: $.i18n.t('plugins_wd.jqplot_line_monitor.description'),
        fill_size: false,
        settings: jqplotMonitorSetting,
        newInstance: function (settings, newInstanceCallback) {

            logger.info('freeboard.loadWidgetPlugin: jqPlotLineMonitorWidgetPlugin newInstance');
            newInstanceCallback(new jqPlotLineMonitorWidget(settings));
        }
    };

    //    load jqplot line plugin
    freeboard.loadWidgetPlugin(jqPlotLineMonitorWidgetPlugin);

    /*
     * jqplot Widget
     * @param {JSON} settings
     * @returns {object}
     */
    var jqPlotWidget = function (settings) {

        var jqPlotWidgetLog = log4jq.getLogger({
            loggerName: 'jqPlotWidget'
        });

        var self = this;
        var currentSettings = settings;
        var chartType = null;
        var widgetName = null;


        //load datasource plugin 
        var sensorId = null;
        var timerange = null;
        var createdTime = null;

        var ticks = [];
        var ticksUnit = null;
        var dateRangeType = null;

        //chart variables
        jqPlotId++;
        var $chartDiv = null;
        var updateData = null;
        var chartJqplotId = 'jqplotId_' + jqPlotId;
        //title 
        var $chartTitleH2 = null;

        var getSensorIdAndTimeRangeFormDS = function (newValue) {

            var dsInfo = {
                sensorId: null,
                timerange: null
            };
            logger.debug('getSensorIdAndTimeRangeFormDS: ' + newValue);
            if(typeof(newValue) != 'undefined'){
                var datasourceModel = getDataSourceModel(newValue);
               
            //for debug 
//            console.log('========================================');
//            console.log(datasourceModel);

                if (datasourceModel.hasOwnProperty('source')) {
                    dsInfo.sensorId = datasourceModel.source;
                    dsInfo.timerange = datasourceModel.timerange;
                }
            }else{
                logger.debug('no data source');
                dsInfo = null;
            }
            
            return dsInfo;
        };
        var dsInfo = getSensorIdAndTimeRangeFormDS(currentSettings.value);
        if(dsInfo != null){
            sensorId = dsInfo.sensorId;
            timerange = dsInfo.timerange;
        }
        

        var createjqPlotChart = function (currentSettings) {
            createdTime = new Date();
            jqPlotWidgetLog.info('createjqPlotChart: ' + createdTime);
            jqPlotWidgetLog.debug(currentSettings);

            jqPlotWidgetLog.debug('jqplot elem id: ' + chartJqplotId);
            jqPlotWidgetLog.debug('chart type:' + chartType);

            jqPlotWidgetLog.debug('time range:' + timerange);


            $chartDiv = $('#' + chartJqplotId);

            var $widgetOfLI = $chartDiv.parent().parent().parent().parent();
            if (currentSettings.enableWidthHeight) {
                $chartDiv.css('width', currentSettings.chartWidth * 0.9);
                $chartDiv.css('height', currentSettings.chartHeight * 0.9);
            } else {
                $chartDiv.css('width', $widgetOfLI.attr('data-sizex') * 300 * 0.9);
                $chartDiv.css('height', currentSettings.height * 60 * 0.9);
            }
            

            $chartDiv.css({
                margin: 'auto'
            });
//            if (currentSettings.charttype == 'pie' || currentSettings.charttype == 'donut') {


            if (chartType == 'pie' || chartType == 'donut') {

                //尚未提供
                $chartDiv
                        .chart({
                            chart: chartType,
                            
                            xaxis: {
                                tickOptions: {
                                    textColor: '#d4d4d4'
                                }
                            }, yaxis: {
                                tickOptions: {
                                    textColor: '#d4d4d4'
                                }
                            }

                        })
                        // .chart('setRender',currentSettings.charttype)
//                        .chart('setData', currentSettings.data)
                        .chart('plot');

            } else {

                if (timerange.indexOf('&') > 0) {

                    jqPlotWidgetLog.debug('自定開始/結束:' + timerange);
                    //customer range
                    var spiltDate = timerange.split('&');
                    var startDate = spiltDate[0] + ' 00:00:00';
                    var endDate = spiltDate[1] + ' 23:59:59';
                    var customerDateRange = {
                        start: startDate,
                        end: endDate
                    };
                    jqPlotWidgetLog.debug('apply date range as below (original):');
                    jqPlotWidgetLog.debug(customerDateRange);

                    //日期區間都以day為準
                    ticksUnit = 'day';
                    dateRangeType = 'cday';//如果是客製化選日期的話，需要變更日期類型 
                    //
                    //需要再加一天
                    var newStartDateObj = easydate.dateAdd(easydate.parseDate(startDate), 'day', -1);
                    var strNewStartDateObj = easydate.date2Str(newStartDateObj);

                    var ticksLen = easydate.dateDiff(
                            strNewStartDateObj,
                            endDate, 'days');

                    customerDateRange.start = strNewStartDateObj;
//                    alert('ticksLen: ' + ticksLen);

                    if (ticksLen > 30 && ticksLen < 365) {
                        jqPlotWidgetLog.debug('customer range by month: ');
                        //tick = month
                        ticksUnit = 'month';
                        dateRangeType = 'cmonth';

//                        alert(customerDateRange.start + ' / ' + customerDateRange.end );
                        ticksLen = easydate.dateDiff(customerDateRange.start, customerDateRange.end, 'months');
                    }
                    else if (ticksLen >= 365) {
                        jqPlotWidgetLog.debug('customer range by year: ');
                        ticksLen = easydate.dateDiff(customerDateRange.start, customerDateRange.end, 'years');
                        ticksUnit = 'year';
                        dateRangeType = 'cyear';
                    }

                    ticks = DataConverter.addTicksWithDatePeriod(
                            ticksLen,
                            customerDateRange.start,
                            ticksUnit);

                } else {

                    //     example: 快選為小時 => 一小時有60分 => DataConverter.addTicksWithDatePeriod(60,'2015-06-26 17:00:00','minute');
                    //     example: 快選為天 => 一天有24小時 => DataConverter.covDatePeriod2NumbersOfTick(24,'2015-06-26 17:00:00','hour');
                    //     example: 快選為月 => 一個月有幾天 => DataConverter.covDatePeriod2NumbersOfTick(30,'2015-06-26 17:00:00','day');

                    jqPlotWidgetLog.debug('自動產生開始/結束:' + timerange);

                    dateRangeType = timerange;
                    ticksUnit = DataConverter.convDatePeriod2TickUnit(dateRangeType);

                    dateRange =
                            easydate.getDateRangeFromNow(dateRangeType);

                    jqPlotWidgetLog.debug('apply date range as below (original):');
                    jqPlotWidgetLog.debug(dateRange);

                    var ticksLen = DataConverter.covDatePeriod2NumbersOfTick(dateRangeType);//minute/hour/day

                    ticks = DataConverter.addTicksWithDatePeriod(
                            ticksLen,
                            dateRange.start, //ticks的時間不需要先經過time zone
                            ticksUnit);
                }

                jqPlotWidgetLog.debug('init jq chart with: ' + chartType);

                var chartOpts = {
                    chart: chartType,
                     theme: {
                        axis: {
                            tickColor: '#d4d4d4'
                        }
                    },
                    series: [{
                            label: sensorId
                        }],
                    grid: {
                        background: currentSettings.backgroundOfGrid,
                        gridLineColor: currentSettings.lineColorOfGrid,
                        borderColor: currentSettings.borderColorOfGrid
                    },
                    xaxis: {
                        ticks: ticks,
                        renderer: 'categoryaxis', //切格子一定要設這個
                        tickOptions: {
                            textColor: '#d4d4d4'
                        }
                    },
                    yaxis: {
//                        min: null,
//                        max: null,
                        tickOptions: {
                            textColor: '#d4d4d4'
                        }
                    }
                };

//  alert('enable y-axis: '
//                            + currentSettings.yaxisMin
////                            + ', ' + currentSettings.yaxisMax);

                if (currentSettings.enableYaxisMaxMix) {

//                    鎖定y-axis
                    chartOpts.yaxis.min = currentSettings.yaxisMin;
                    chartOpts.yaxis.max = currentSettings.yaxisMax;
                }

                $chartDiv.chart(chartOpts);
//                
//                        .chart('setRender',currentSettings.charttype);


                if (currentSettings.enableYaxisMaxMix) {
                  
                    //鎖定y-axis
//                    $chartDiv.chart('setYaxisMinMax',
//                            currentSettings.yaxisMin,
//                            currentSettings.yaxisMax);
                }

            }
        };

        var showDialog = function () {
            var ctype = currentSettings.charttype;
            jqPlotWidgetLog.info('showDialog: ' + ctype);
            switch (ctype) {
                case 'pie':
                    widgetName = $.i18n.t('global.plugins_wd.chart_type_options.pie');
                    break;
                case 'donut':
                    widgetName = $.i18n.t('global.plugins_wd.chart_type_options.donut');
                    break;
                case 'line':
                    widgetName = $.i18n.t('global.plugins_wd.chart_type_options.line');
                    break;
                case 'area':
                    widgetName = $.i18n.t('global.plugins_wd.chart_type_options.area');
                    break;
                case 'bar':
                    widgetName = $.i18n.t('global.plugins_wd.chart_type_options.bar');
                    break;
                case 'scatter':
                    widgetName = $.i18n.t('global.plugins_wd.chart_type_options.scatter');
                    break;

                default:
                    widgetName = '';
            }

            var db = new DialogBox(
                    widgetName + $.i18n.t('global.invaliddataformat'),
                    $.i18n.t('global.error'), $.i18n.t('global.yes'), '', function (okcancel) {
                jqPlotWidgetLog.debug('invalid dialog: ' + okcancel);
                if (okcancel) {

                }
            });
        };

        var destroyjqPlotChart = function () {
            jqPlotWidgetLog.info('destroyjqPlotChart');
            $chartDiv.empty();
            $chartDiv.chart('destroy');
        };

        var updateData = function (newData) {

            jqPlotWidgetLog.info('udpateDate');
             
            jqPlotWidgetLog.debug('fill data with dateRangeType: ' + dateRangeType);
            jqPlotWidgetLog.debug(newData);
//            console.log(newData);
            
            if(dateRangeType == 'hour'){
                //因為會切12格(每五分鐘)，因此回傳資料的時間會變動
                var currTime = new Date();
                var endDate =  easydate.date2Str(currTime);
                var startDate  = easydate.date2Str(createdTime);
                var diffMinutes =  easydate.dateDiff(
                           startDate,
                            endDate,
                            'minutes');
                jqPlotWidgetLog.debug('diffMinutes(' + startDate + ',' + endDate + '): ' + diffMinutes);
                
                if(diffMinutes > 5){
//                    alert('destory chart');
                    destroyjqPlotChart();
                    createjqPlotChart(currentSettings);
                }
            }
            //set chart data to draw
            if (newData != null) {

                //將缺的tick補滿
                var fillChartData =
                        DataConverter.fillDataWithTicks(newData, dateRangeType, ticks);

//                console.log(dateRangeType);
//                console.log(ticks);
//                console.log(fillChartData);

//            createjqPlotChart(currentSettings);
                $chartDiv.chart('update', fillChartData, {
                    label: sensorId
                })
                        .chart('plot');
            }
        };

        var updateTitle = function (newTitle) {
            jqPlotWidgetLog.info('updateTitle as below: ' + newTitle);
            if (newTitle.length > 0) {
                $chartTitleH2.html(newTitle);
            }
        };

        self.onPaneWidgetChanged = function (col_width) {
//            alert(col_width);
            jqPlotWidgetLog.info('onPaneWidgetChanged: new col is ' + col_width);
            destroyjqPlotChart();
            createjqPlotChart(currentSettings);
        };

        self.render = function (containerElement) {

            jqPlotWidgetLog.info('render');

            //add external css
            //            $(element).append('<link rel="stylesheet" href="http://cdnjs.cloudflare.com/ajax/libs/jqPlot/1.0.8/jquery.jqplot.min.css" />');

            //add the chart div to the dom
            var chartElem = '<div id="' + chartJqplotId + '"></div>';
            var titleElem = '<h2 class="section-title"></h2>';

            $chartDiv = $(chartElem);
            $chartTitleH2 = $(titleElem);

            var $containerElement = $(containerElement);
            $containerElement.append($chartTitleH2);
            $containerElement.append($chartDiv);

            self.onSettingsChanged(currentSettings);
        };

        self.onSettingsChanged = function (newSettings) {

            jqPlotWidgetLog.info('onSettingsChanged as below: ' + newSettings.value);
            jqPlotWidgetLog.debug(newSettings);


            if (newSettings.value != currentSettings.value) {
                logger.debug('ds change');
                destroyjqPlotChart();
            }


            currentSettings = newSettings;

            if (currentSettings.hasOwnProperty('title')) {

                updateTitle(currentSettings.title);
            }

            if (currentSettings.hasOwnProperty('chartType')) {
                if (typeof (currentSettings.chartType) != 'undefined') {
                    jqPlotWidgetLog.debug('chart type changed');
                    chartType = currentSettings.chartType;

                    destroyjqPlotChart();
                }
            }

            if (currentSettings.hasOwnProperty('monitorColor')) {
                destroyjqPlotChart();
            }
            if (currentSettings.hasOwnProperty('enableYaxisMaxMin')) {
                destroyjqPlotChart();
            }
            if (currentSettings.hasOwnProperty('backgroundOfGrid')) {
                destroyjqPlotChart();
            }
            if (currentSettings.hasOwnProperty('lineColorOfGrid')) {
                destroyjqPlotChart();
            }
            if (currentSettings.hasOwnProperty('borderColorOfGrid')) {
                destroyjqPlotChart();
            }

            if (currentSettings.hasOwnProperty('height')) {
                destroyjqPlotChart();
            }


            if (timerange == null) {
                logger.error('timerange is null');
//                showDialog();
                $chartDiv.html($.i18n.t('global.invaliddataformat'));

            } else {
                createjqPlotChart(currentSettings);
            }




        };

        //seems to be called after render whenever a calculated value changes
        self.onCalculatedValueChanged = function (settingName, newValue) {

            jqPlotWidgetLog.debug('onCalculatedValueChanged settingName: ' + settingName);
            //因為ds的timerange被改變時只有辦法觸發onCalculatedValueChanged
            //所以要有這檢查是否要重新繪圖(x軸會因timerange變更格數)
            var checkDsInfo = getSensorIdAndTimeRangeFormDS(currentSettings.value);
            logger.debug(checkDsInfo);
            if(checkDsInfo = null){
                jqPlotWidgetLog.warn('data source not found');
                return;
                
            }
            if (checkDsInfo.timerange != timerange) {
                logger.debug('timerange change');
                
                //update timerange
                timerange = checkDsInfo.timerange ;
//                alert('timerange change');
                destroyjqPlotChart();
                createjqPlotChart(currentSettings);
            }
            
            if(checkDsInfo.sensorId != sensorId){
                   //update timerange
                sensorId = checkDsInfo.sensorId ;
//                alert('timerange change');
                destroyjqPlotChart();
                createjqPlotChart(currentSettings);
            }

            if (settingName == 'value') {
                updateData(newValue);
            }

        };

        self.onDispose = function () {
        };
        self.getHeight = function () {
            jqPlotWidgetLog.info('getHeight');
            return Number(currentSettings.height);
        };


    };


    var jqPlotWidgetPlugin = {
        type_name: 'jqPlot',
        display_name: $.i18n.t('plugins_wd.jqplot.display_name'),
        description: $.i18n.t('plugins_wd.jqplot.description'),
        fill_size: false,
        settings: commonjqPlotSettings,
        newInstance: function (settings, newInstanceCallback) {

            logger.info('freeboard.loadWidgetPlugin: jqPlotLineWidgetPlugin newInstance');

            newInstanceCallback(new jqPlotWidget(settings));
        }
    };
    freeboard.loadWidgetPlugin(jqPlotWidgetPlugin);

    /******************************************************
     * @deprecated
     ******************************************************/
    var jqPlotLineWidgetPlugin = {
        type_name: 'jqPlotLine',
        display_name: $.i18n.t('global.plugins_wd.chart_type_options.line'),
//                $.i18n.t('plugins_wd.jqPlotLineChartWidget.display_name'),
        fill_size: false,
        settings: commonjqPlotSettings,
        newInstance: function (settings, newInstanceCallback) {

            logger.info('freeboard.loadWidgetPlugin: jqPlotLineWidgetPlugin newInstance');

            settings.charttype = 'line';
            newInstanceCallback(new jqPlotWidget(settings));
        }
    };

    //load jqplot line plugin
    //freeboard.loadWidgetPlugin(jqPlotLineWidgetPlugin);

    var jqPlotAreaWidgetPlugin = {
        type_name: 'jqPlotArea',
        display_name: $.i18n.t('global.plugins_wd.chart_type_options.area'),
//                $.i18n.t('plugins_wd.jqPlotAreaChartWidget.display_name'),
        fill_size: false,
        settings: commonjqPlotSettings, newInstance: function (settings, newInstanceCallback) {

            logger.info('freeboard.loadWidgetPlugin: jqPlotAreaWidget newInstance');

            settings.charttype = 'area';

            newInstanceCallback(new jqPlotWidget(settings));
        }};
    //load jqplot area plugin
    //freeboard.loadWidgetPlugin(jqPlotAreaWidgetPlugin);

    var jqPlotBarWidgetPlugin = {
        type_name: 'jqPlotBar',
        display_name: $.i18n.t('global.plugins_wd.chart_type_options.bar'),
//                $.i18n.t('plugins_wd.jqPlotBarChartWidget.display_name'),
        fill_size: false,
        settings: commonjqPlotSettings,
        newInstance: function (settings, newInstanceCallback) {

            logger.info('freeboard.loadWidgetPlugin: jqPlotBarWidgetPlugin newInstance');

            settings.charttype = 'bar';

            newInstanceCallback(new jqPlotWidget(settings));
        }
    };
    //load jqplot bar plugin
    //freeboard.loadWidgetPlugin(jqPlotBarWidgetPlugin);

    var jqPlotScatterWidgetPlugin = {
        type_name: 'jqPlotScatter',
        display_name: $.i18n.t('global.plugins_wd.chart_type_options.scatter'),
//                $.i18n.t('plugins_wd.jqPlotScatterChartWidget.display_name'),
        fill_size: false,
        settings: commonjqPlotSettings,
        newInstance: function (settings, newInstanceCallback) {

            logger.info('freeboard.loadWidgetPlugin: jqPlotScatterWidgetPlugin newInstance');

            settings.charttype = 'scatter';

            newInstanceCallback(new jqPlotWidget(settings));
        }
    };
    //load jqplot scatter plugin
    //freeboard.loadWidgetPlugin(jqPlotScatterWidgetPlugin);
}());
