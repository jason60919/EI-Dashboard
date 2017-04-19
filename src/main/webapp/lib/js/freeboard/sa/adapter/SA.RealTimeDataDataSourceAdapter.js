/*
 *  datasource adapter 
 *  @ken.tsai@advantech.com.tw
 *  @date 2015/10/27
 */
if (typeof (DataSourceAdapter) !== 'undefined') {
    DataSourceAdapter.register('realtimedata', 'RealTimeDataDataSourceAdapter');
}

var RealTimeDataDataSourceAdapter = (function (log4jq) {

    var dsAdapter = {};
    dsAdapter.name = 'SA.RealTimeDataDataSourceAdapter.js';

    var logger = log4jq.getLogger({
        loggerName: dsAdapter.name
    });

    /*
     * Sample widget function
     * dsAdapter.<WIDGET_TYPE_NAME> = function (sourceData) {};
     */

    var parseValue = function (sourceData, widgetName) {
        logger.info('parseValue to ' + widgetName);
//        logger.debug(sourceData);
//        console.log(sourceData);
        var newSourceData = [];
        if (typeof (sourceData) != 'undefined') {

            if (!$.isArray(sourceData)) {
                logger.debug('Singel data source');
                
                parseDataFormat(sourceData, newSourceData);
                
            } else {
                logger.debug('Multiple data sources');

                try {

                    for (var i = 0; i < sourceData.length; i++) {
                        var currData = sourceData[i];
                        logger.debug(i + ': current data as below');
                        logger.debug(currData);

                        newSourceData = parseDataFormat(currData, newSourceData);
                    }//end of for
                 

                } catch (ex) {
                    logger.error('Invalid data format: ' + ex);
                    return sourceData;
                }
            }
            
               logger.debug('return newSourceData as below:');
                    logger.debug(newSourceData);
                    return newSourceData;

        } else {
            logger.error('Data not ready');
            return sourceData;
        }


    };
    var parseDataFormat = function (currData, newSourceData) {
        logger.info('parseDataFormat');
        //if currdata is undefiend, it means server return data not yet.
        if (typeof (currData) != 'undefined') {

            if (currData.hasOwnProperty('result')) {
                /*
                 
                 {"result":{"itemList":[{"v":0.003171,"sensorId":"/netMonInfoList/區域連線/netUsage","ts":"Tue Oct 27 17:32:49 CST 2015"}]}}
                 */
                if (currData.result.hasOwnProperty('itemList')) {

                    if (currData.result.itemList.length > 0) {
                        var sensorData = currData.result.itemList[0];
                        var sensorVal = null;
                        if (sensorData.hasOwnProperty('v')) {
                            sensorVal = sensorData.v;
                        } else if (sensorData.hasOwnProperty('sv')) {
                            sensorVal = sensorData.sv;
                        } else if (sensorData.hasOwnProperty('bv')) {
                            sensorVal = sensorData.bv;
                        }

                        logger.info('parseValue ' + sensorData.sensorId + ' value: ' + sensorVal);

                        newSourceData = combineData(newSourceData, sensorVal);
                    } else {
                        newSourceData = combineData(newSourceData, 'undefined');
                    }
                } else {
                    logger.warn('current Data doesn\'t has itemList: ' + i);
                    newSourceData = combineData(newSourceData, 'undefined');
                }

                logger.debug('newSourceData: ' + newSourceData);

            } else {

                //put original format
                newSourceData = combineData(newSourceData, currData);
            }

//  
        } else {
            logger.warn('current Data not ready: ' + i);

            newSourceData = combineData(newSourceData, currData);

        }
//        console.log(newSourceData);
        return newSourceData;
    };
    var combineData = function (newSourceData, sensorVal) {
        logger.info('combineData');
//        if (newSourceData == '') {
//            newSourceData = sensorVal;
//        } else {
//            newSourceData += ',' + sensorVal;
//        }
        newSourceData.push(sensorVal);
        return newSourceData;
    };

    dsAdapter.sparkline = function (sourceData) {
        logger.info('sparkline');
        return parseValue(sourceData, 'sparkline');

    };

    dsAdapter.pointer = function (sourceData) {
        logger.info('pointer');
        return parseValue(sourceData, 'pointer');
    };

    dsAdapter.text = function (sourceData) {
        logger.info('text');
        return parseValue(sourceData, 'text')[0];;
    };

    dsAdapter.indicator = function (sourceData) {
        logger.info('indicator');
        return parseValue(sourceData, 'indicator')[0];;
    };

    dsAdapter.OnOff = function (sourceData) {
        logger.info('OnOff');
        return parseValue(sourceData, 'OnOff')[0];;
    };

    dsAdapter.gauge = function (sourceData) {
        logger.info('gauge');
        return parseValue(sourceData, 'gauge');
    };
        

    dsAdapter.jqplotLineMonitor = function (sourceData) {
        logger.info('jqplotLineMonitor');
        return parseValue(sourceData, 'jqplotLineMonitor')[0];;
    };

    window[dsAdapter.name] = dsAdapter;

    return dsAdapter;
})(log4jq);
