/* 
 * Hist Data datasource adapter
 * @date 2015/10/07
 * @required
 *  jquery.js
 *  js/libs/log4javascript/log4javascript.min.js
 *  js/sa/utils/log4jq.js
 */

var DataSourceAdapter = (function (log4jq) {

    var dsAdapter = {};

    dsAdapter.name = 'SA.DataSourceAdapter.js';

    var types = {
//        <datasoruceTypeName>: <className>
    };//all strategy

    var logger = log4jq.getLogger({
        loggerName: dsAdapter.name
    });

    dsAdapter.exceptionEventCallback = null;
    dsAdapter.setExceptionEventCallback = function (newCallback) {
        dsAdapter.exceptionEventCallback = newCallback;
    };

    //register new adapter
    dsAdapter.register = function (datasoruceTypeName, adapterName) {
        logger.info('register');

//        logger.debug(adapterName);

        var checkerAdapter = types[datasoruceTypeName];
//         console.log(checkerAdapter);
        if (typeof (checkerAdapter) != 'undefined') {
            logger.debug('overwrite OLD adapter. ds type: ' + datasoruceTypeName + ', adapter name: ' + adapterName);
            checkerAdapter = adapterName;
        } else {
            logger.debug('add NEW adapter. ds type: ' + datasoruceTypeName + ', adapter name: ' + adapterName);
            types[datasoruceTypeName] = adapterName;
        }
//         console.log(types);
    };

    dsAdapter.getAdapters = function () {
        logger.info('getAdapters');
        return types;
    };
    /*
     @param data: 
     {
     'ds': '<data source>',
     'wg': '<widget name>',
     'data': '<response from data source>'
     }
     */
    dsAdapter.process = function (data) {
        logger.info('process');
        logger.debug(data);
        try {
            //get adapter
            var currAdapter = types[data.ds];
//            console.log(currAdapter);
            if (typeof (currAdapter) != 'undefined') {
                //find 
                logger.debug('find adapter: ' + data.ds);
                var finalProcessData = window[currAdapter][data.wg](data.data);
                logger.debug('final data as below: ');
                logger.debug(finalProcessData);
                return finalProcessData;
            } else {
                logger.warn('CANNOT find \"' + data.ds + '\" adapter: ' + currAdapter);
                return data.data;
            }
        } catch (e) {

            logger.error('Adapter process exception: ' + e);
            if (typeof (exceptionEventCallback) === 'function') {
                daAdapter.exceptionEventCallback(e);
            }
            return data.data;
        }
    };

    window.DataSourceAdapter = dsAdapter;

    return dsAdapter;

})(log4jq);
//console.log('init ds adapter');
//console.log(DataSourceAdapter);

