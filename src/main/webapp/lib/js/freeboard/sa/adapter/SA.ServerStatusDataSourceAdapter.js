/*
 *  Server status datasource adapter 
 *  @date 2015/10/28
 */
if (typeof (DataSourceAdapter) !== 'undefined') {
    DataSourceAdapter.register('Temp', 'ServerStatusDataSourceAdapter');
}

var ServerStatusDataSourceAdapter = (function (log4jq) {

    var dsAdapter = {};
    dsAdapter.name = 'SA.ServerStatusDataSourceAdapter.js';

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
