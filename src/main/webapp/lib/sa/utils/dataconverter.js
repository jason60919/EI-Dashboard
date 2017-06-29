/* 
 * Convert mongodb result for morris.js
 * @date 2014/11/13
 * @required
 *  js/libs/log4javascript/log4javascript.min.js
 *  js/sa/utils/log4jq.js
 * js/sa/utils/easyday.js
 */

var datacoverter = (function (easydate, log4jq) {

    var dataConverter = {};

    dataConverter.logger = log4jq.getLogger({
        loggerName: 'dataconverter.js'
    });

    dataConverter.version = '0.1';
    dataConverter.author = 'bigd';

    function _date2Str(dateObj) {
        return easydate.date2Str(dateObj);
    }

    dataConverter.cov2jqPlotSeparate = function (inputData) {
        var dc = this;

        var jqPlotData = [];
        var jqPlotDate = [];

        //         single point: [x,y]
        for (var i = 0; i < inputData.length; i++) {

            var dataObj = inputData[i];
            var xDate = new Date(dataObj.unitVal);

            jqPlotDate.push(_date2Str(xDate));
            jqPlotData.push(dataObj.val);

        }

        var result = {
            ticks: jqPlotDate,
            data: jqPlotData
        };

        return result;
    };

    //multiple single ids
    dataConverter.cov2jqPlotWithDifferentId = function (idArr, inputData, withoutDate) {
        //{ key1: [array], key2: [array]}

        var dc = this;

        dc.logger.info('cov2jqPlotWithDifferentId (MULTIPLE)');

        var convDataJson = {};

        for (var j = 0; j < inputData.length; j++) {
            var dataObj = inputData[j];

            dc.logger.info('current data obj as below: ');
            dc.logger.info(dataObj);

//            var xDate = new Date(dataObj.unitVal);

            for (var i = 0; i < idArr.length; i++) {

                var currID = idArr[i];
//                console.log('curr sensorId: ' + currID);
                if (!convDataJson.hasOwnProperty(currID)) {
                    convDataJson[currID] = [];//create new key array
                }

                if (dataObj.sensorId == currID) {
                    var newVal = dataObj.val;

                    var conv2jqFormat = null;
                    if (withoutDate == true) {
                        //column chart only need value
                        convDataJson[currID].push(newVal);
                    } else {
//                        conv2jqFormat = [_date2Str(xDate), newVal];
                        conv2jqFormat = [easydate.getDateTimeZone(dataObj.unitVal, false), newVal];

                        convDataJson[currID].push(conv2jqFormat);
                    }
                }
            }
        }//end of for
        return convDataJson;
    };

    //single sensor id
    dataConverter.cov2jqPlot = function (inputData) {
        var dc = this;
        dc.logger.info('cov2jqPlot (SINGLE)');

        var jqPlotData = [];

        if ($.isArray(inputData)) {
            //         single point: [x,y]
            for (var i = 0; i < inputData.length; i++) {
                var dataObj = inputData[i];
                dc.logger.info('ts: ' + dataObj.unitVal);

                //no timezone
//            var xDate = new Date(dataObj.unitVal);
//     jqPlotData.push([_date2Str(xDate), dataObj.val]);

                var convDate = easydate.getDateTimeZone(dataObj.unitVal, false);

                dc.logger.info('conv2 ts: ' + convDate);
                jqPlotData.push([convDate, dataObj.val]);
            }

        } else {
            dc.logger.info('no array');
//            console.log(inputData);
            var dataObj = inputData;

//                "itemList" : {
//			"unitVal" : "2015-06-11 02:00:00",
//			"sensorId" : "/SenData/Room Temp",
//			"val" : 6.015184381778742
//		}

            dc.logger.info('ts: ' + dataObj.unitVal);

            var convDate = easydate.getDateTimeZone(dataObj.unitVal, true);

            dc.logger.info('conv2 ts: ' + convDate);
            jqPlotData.push([convDate, dataObj.val]);

        }


//        console.log(jqPlotData);
        return jqPlotData;

    };

    dataConverter.cov2Value = function (dataObj) {
        var dc = this;
//        dc.logger.info('conv2Value');
        var con2Val = 0;
        if (dataObj.hasOwnProperty('sv')) {
            con2Val = dataObj.sv;
        } else if (dataObj.hasOwnProperty('bv')) {
            con2Val = dataObj.bv;
        } else if (dataObj.hasOwnProperty('v')) {
            con2Val = dataObj.v;
        } else {
            dc.logger.error('cannot find key of value');
            con2Val = 0;
        }
        return con2Val;
    };

    /*
     * 轉換時間範圍該分隔的tick數 (VERY IMPORTANT)
     * @param {type} datePeriod
     * @returns {Number}
     */
    dataConverter.covDatePeriod2NumbersOfTick = function (datePeriod) {
        var dc = this;
        dc.logger.info('covDatePeriod2NumbersOfTick: ' + datePeriod);
        var ticksLen = 0;
        switch (datePeriod) {
            case 'hour':
//                ticksLen = 60-1; //min
//                ticksLen = 60; //min
                ticksLen = 12; //min
                break;

            case 'week':
//                ticksLen = 7-1;
                ticksLen = 7;
                break;

            case 'today':
//                ticksLen = 24-1; //hour
                ticksLen = 24;
                break;
            case 'day':
//                ticksLen = 24-1;
                ticksLen = 24;
                break;

            case 'month':
//                ticksLen = easydate.getDaysInMonth() - 1;
                ticksLen = easydate.getDaysInMonth();
                break;

            case 'year':
//                ticksLen = 12-1;
                ticksLen = 12;
                break;
        }

        dc.logger.debug('numbers of tick: ' + ticksLen);
        return ticksLen;
    };

    /*
     * 轉換時間範圍為切割的tick單元
     * @param {string} datePeriod: hour,day,week,month,year
     * @returns {string}
     */
    dataConverter.convDatePeriod2TickUnit = function (datePeriod) {
        var dc = this;
        dc.logger.info('convDatePeriod2TickUnit: ' + datePeriod);
        var ticksUnit = 0;
        switch (datePeriod) {
            case 'hour':
                ticksUnit = 'minute'; //min
                break;
            case 'day':
                ticksUnit = 'hour';
                break;
            case 'week':
                ticksUnit = 'day';
                break;
            case 'month':
                ticksUnit = 'day'; //hour
                break;
            case 'year':
                ticksUnit = 'month'; //hour
                break;

                //因應客製化時間範圍的處理類型
            case 'cday':
                ticksUnit = 'day'; //day
                break;
            case 'cmonth':
                ticksUnit = 'month'; //month
                break;
            case 'cyear':
                ticksUnit = 'year'; //year
                break;
        }

        dc.logger.debug('cov unit of tick: ' + ticksUnit);
        return ticksUnit;
    };

    /*
     * 產生一段指定開始日期的ticks陣列 (VERY IMPORTANT)
     * example: 快選為小時 => 一小時有60分 => DataConverter.addTicksWithDatePeriod(60,'2015-06-26 17:00:00','minute');
     * example: 快選為天 => 一天有24小時 => DataConverter.addTicksWithDatePeriod(24,'2015-06-26 17:00:00','hour');
     * example: 快選為月 => 一個月有幾天 => DataConverter.addTicksWithDatePeriod(30,'2015-06-26 17:00:00','day');
     * @param {type} ticksLen: ticks的大小: ex: hour: 60 (min), day: 24 (hour), month: 30 (day) =>大於天都是
     * @param {type} startDate：　tick的開始日期
     * @param {type} interval：date period interval => 請參考easydate
     * @returns {Array}　轉換完的ticks array
     */
    dataConverter.addTicksWithDatePeriod = function (ticksLen, startDate, intervalOfDatePeriod) {
        var dc = this;
        dc.logger.info('addTicksWithDatePeriod');
        dc.logger.debug('ticksLen: ' + ticksLen + ', startDate: ' + startDate + ', date period: ' + intervalOfDatePeriod);

        var ticks = [];
//         easydate.dateAdd = function (date, interval, units) 
        var indexticks = 1;
        for (indexticks; indexticks <= ticksLen; indexticks++) {
              dc.logger.debug('startDate: ' + startDate);
            var dateAddStr = '';
            var dateAddObj = easydate.dateAdd(startDate, intervalOfDatePeriod, indexticks);
            dc.logger.debug('after add date:' + dateAddObj);
            dateAddStr= easydate.date2Str(dateAddObj);
            dateAddStr = easydate.str2DateWithDatePeriod(dateAddStr, intervalOfDatePeriod);
        
            ticks.push(dateAddStr);
        }
//        console.log(ticks);
        dc.logger.debug('conv date ticks as below: ' + ticks.length);
        dc.logger.debug(ticks);
        return ticks;
    };

    /*
     * 填補缺少的資料(VERY IMPORTANT)
     * @param {array} originalDataArr 要填滿空缺的資料集
     * @param {string} datePeriod: 一個格式的對應單位
     * @param {array} ticks array 對應的ticks array
     * @returns {Number|String}
     */
    dataConverter.fillDataWithTicks = function (originalDataArr, datePeriod, ticks) {
        var dc = this;
        dc.logger.info('fillDataWithTicks');
        dc.logger.debug(originalDataArr);
        dc.logger.debug('datePeriod: ' + datePeriod + ', ticks:' + ticks);
        //new data array with tick
        var dataArrWithTick = [];
        dataArrWithTick.length = ticks.length;
        for(var i=0;i<ticks.length;i++){
            dataArrWithTick[i] = null;
        }
        var lenOfOriginalDataArr = originalDataArr.length;
        if (lenOfOriginalDataArr <= 0) {
            dc.logger.warn('input data null: ' + lenOfOriginalDataArr);
        } else {
            var barKeyArrIndex = 0;
            for (barKeyArrIndex; barKeyArrIndex < lenOfOriginalDataArr; barKeyArrIndex++) {

                //當前的資料
                var dataOfKeyArr = originalDataArr[barKeyArrIndex];
                dc.logger.debug(dataOfKeyArr);
                //計算要更新的位置新的繪圖資料集索引

                var currDate = dataOfKeyArr[0, 0];
         
                dc.logger.debug('original currDate: ' + currDate);
                //轉換一下要查詢的時間格式=>要跟ticks一致
                currDate = easydate.str2DateWithDatePeriod(currDate, dc.convDatePeriod2TickUnit(datePeriod));

                dc.logger.debug('conv currDate: ' + currDate);
                var updateIndex = 
                        dc.getIndexOfTicks(currDate, ticks);
//                (dc.getIndexOfTicks(dataOfKeyArr, datePeriod) - 1);
                if (updateIndex >= 0) {
                    dc.logger.debug('updateIndex: ' + updateIndex);
                    dc.logger.debug('orginal val:' + dataArrWithTick[updateIndex]);
                    dataArrWithTick[updateIndex] = parseFloat(dataOfKeyArr[0, 1]);//only value
                    dc.logger.debug('new val:' + dataArrWithTick[updateIndex]);
                } else {
                    dc.logger.debug('cannot find update index from date: ' + currDate);
                }

            }
        }
        dc.logger.debug('conv reseult as below: ');
        dc.logger.debug(dataArrWithTick);
       
        
        return dataArrWithTick;
    };

    /*
     * 取得對應日期的tick陣列索引
     */
    dataConverter.getIndexOfTicks = function (inputDate, dateTicks) {
        var dc = this;
        dc.logger.info('getIndexOfTicks');
        var targetIndex = $.inArray(inputDate, dateTicks);
        dc.logger.info('query targetIndex :' + targetIndex);
        if (targetIndex >= 0) {
            dc.logger.debug('inputDate: ' + inputDate + ', targetIndex: ' + targetIndex); 
//            dc.logger.error(dateTicks);
        }else{
            dc.logger.error('cannot find target index: ' + inputDate + ', target index: ' + targetIndex);
        }
        
        return targetIndex;
    };

    /*
     * 取得目前的時間位置對應的tick索引(整個月份的週期)
     * @param {type} dateObjArr
     * @param {type} datePeriod
     * @returns {Number|String}
     */
//    dataConverter.getIndexOfTicks = function (dateObjArr, datePeriod) {
////    ["2015-6-1 10:00:00", 425]
//        var dc = this;
//        dc.logger.info('getIndexOfTicks');
//
//        var dateStr = dateObjArr[0, 0];
//        index_log.debug('dateStr: ' + dateStr);
//        var dateIndex = 0;
//        switch (datePeriod) {
//            case 'hour':
//                dateIndex = easydate.getMinuteUnit(new Date(dateStr));
//                break;
//
//            case 'day':
//                dateIndex = easydate.getHourUnit(new Date(dateStr));
//                break;
//
//            case 'week':
//                dateIndex = easydate.getHourUnit(new Date(dateStr));
//                break;
//            case 'month':
//                dateIndex = easydate.getDayUnit(new Date(dateStr));
//                break;
//        }
//        dc.logger.debug('jqdateToIndex: ' + dateIndex);
//        return dateIndex;
//    };

    window.DataConverter = dataConverter;

    return dataConverter;

})(easydate, log4jq);


