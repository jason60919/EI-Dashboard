/* 
 * log4jq global logger debug
 * @auth ken.tsai@advantech.com.tw
 * @date 2015/9/9
 * @required
 * js/sa/utils/log4jq.js
 */
var loggers = [];
//jquery plugins
loggers.push({
    name: 'jquery.lang.js',
    level: 'OFF'
});
//page module
loggers.push(
        {
    name: 'frmDeviceMgmt',
    level: 'ALL'
},{
    name: 'frmDeviceMgmtIoTGwSensorInfo',
    level: 'ALL'
});
//
//sa service
loggers.push({
    name: 'service.js',
    level: 'OFF'
});
loggers.push({
    name: 'timer.js',
    level: 'OFF'
});
//sa ui
loggers.push({
    name: 'dashboard.js',//deprecated
    level: 'OFF'
}, {
    name: 'widget.js',//deprecated
    level: 'OFF'
},{
    name: 'fans.js',
    level: 'OFF'
},
{
    name: 'chart.js',
    level: 'ALL'
},
{
    name: 'hwmonitor.js',
    level: 'ALL'
},
{
    name: 'tabs.js',
    level: 'OFF'
});
//sa utils
loggers.push(
{
    name: 'easydate.js',
    level: 'OFF'
}, {
    name: 'dropdown.js',
    level: 'OFF'
}, {
    name: 'dataconverter.js',
    level: 'OFF'
}, {
    name: 'bnparser.js',
    level: 'OFF'
});


//handlebar.js
loggers.push(
{
    name: 'SA.handlebarsHelpers.js',
    level: 'OFF'
});
//freeboard CORE     
loggers.push({
    name: 'freeboard.js',
    level: 'ALL'
});
loggers.push({
    name: 'FreeboardModel.js',
    level: 'ALL'
});
loggers.push({
    name: 'FreeboardUI.js',
    level: 'ALL'
});
loggers.push({
    name: 'WidgetModel.js',
    level: 'ALL'
});
loggers.push({
    name: 'DatasourceModel.js',
    level: 'ALL'
});
//freeboard 3-rd plugin lib
loggers.push(
{
    name: 'jsonFrill.js',
    level: 'OFF'
});
      
//freeboard SA Util
loggers.push({
    name: 'SA.REST.js',
    level: 'OFF'
});
loggers.push({
    name: 'SA.ConnectionPool.js',
    level: 'OFF'
});
loggers.push({
    name: 'AjaxQueue',
    level: 'OFF'
});
//freeboard content pack generator
loggers.push({
    name: 'SA.ContentPackGenerator.js',
    level: 'ALL'
});
loggers.push({
    name: 'SA.Device2ContentPackGenerator.js',
    level: 'ALL'
});

//freeboard SA adapter
loggers.push({
    name: 'SA.DataSourceAdapter.js',
    level: 'OFF'
});
loggers.push({
    name: 'SA.HistDataDataSourceAdapter.js',
    level: 'OFF'
});
loggers.push({
    name: 'SA.RealTimeDataDataSourceAdapter.js',
    level: 'OFF'
});
loggers.push({
    name: 'SA.FuzzySearchDataSourceAdapter.js',
    level: 'OFF'
});
loggers.push({
    name: 'SA.DataAnalyticsDataSourceAdapter.js',
    level: 'OFF'
});

//freeboard widget

loggers.push({
    name: 'SA.wg.jqplot.js',
    level: 'ALL'
});

loggers.push({
    name: 'jqPlotWidget',
    level: 'ALL'
});
loggers.push({
    name: 'jqPlotLineMonitorWidget',
    level: 'ALL'
});
loggers.push({
    name: 'plugin.wg.text.js',
    level: 'ALL'
});
loggers.push({
    name: 'SA.wg.c3js.js',
    level: 'OFF'
});
loggers.push({
    name: 'SA.wg.indicator.js',
    level: 'OFF'
});
loggers.push({
    name: 'SA.wg.multigooglemap.js',
    level: 'ALL'
});
loggers.push({
    name: 'SA.wg.ragIndicator.js',
    level: 'OFF'
});
loggers.push({
    name: 'SA.wg.progressbar.js',
    level: 'OFF'
});
loggers.push({
    name: 'SA.wg.sparkline.js',
    level: 'OFF'
});
loggers.push({
    name: 'SA.wg.table.js',
    level: 'OFF'
});
loggers.push({
    name: 'SA.wg.html.js',
    level: 'OFF'
});
loggers.push({
    name: 'SA.wg.fans.js',
    level: 'OFF'
});
//freeboard datasource
loggers.push({
    name: 'RealTimeData',
    level: 'OFF'
});




var log4jqConfig = {
    loggers: loggers
};