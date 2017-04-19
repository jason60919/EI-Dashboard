/*
 *  datasource adapter template
 *  @ken.tsai@advantech.com.tw
 *  @date 2015/10/27
 */
if (typeof (DataSourceAdapter) !== 'undefined') {
    DataSourceAdapter.register('Temp', 'TempDataSourceAdapter');
}

var TempDataSourceAdapter = (function (log4jq) {

    var dsAdapter = {};
    dsAdapter.name = 'SA.TempDataSourceAdapter.js';

    var logger = log4jq.getLogger({
        loggerName: dsAdapter.name
    });

    /*
     * Sample widget function
     * dsAdapter.<WIDGET_TYPE_NAME> = function (sourceData) {};
    */

    window[dsAdapter.name] = dsAdapter;

    return dsAdapter;
})(log4jq);
