/* 
 *  Date function
 * @author ken.tsai@advantech.com.tw
 * @date 20141120
 * @required:
 * js/libs/utils/moment/moment.min.js
 * js/libs/utils/moment/moment-timezone-with-data.min.js
 */

var easydate = (function (log4jq) {

    var easydate = {};

    easydate.logger = log4jq.getLogger({
        loggerName: 'easydate.js'
    });

    easydate.version = '0.1';
    easydate.author = 'bigd';

    /*
     * dateStr add 
     * @param {type} date Object
     * @param {string} interval (時間單位)
     * @param {int} date units  (加減直)
     * @returns {Date}
     * @example
     *  easydate.dateAdd(' Mon Aug 03 2015 15:45:00 GMT+0800','month', -8)
     */
    easydate.dateAdd = function (date, interval, units) {
        var _self = this;
        _self.logger.info('dateAdd: ' + date + ', interval: ' + interval + ', unit:' + units);
         //don't change original date
        var ret = new Date(date);

        switch (interval.toLowerCase()) {
            case 'year'   :
                ret.setFullYear(ret.getFullYear() + units);
                break;
            case 'quarter':
                ret.setMonth(ret.getMonth() + 3 * units);
                break;
            case 'month'  :
                
                ret.setMonth(ret.getMonth() + units);
                break;
            case 'week'   :
                ret.setDate(ret.getDate() + 7 * units);
                break;
//            case 'today'    :
//                ret.setDate(ret.getDate() + units);
//                break;
            case 'day'    :
                ret.setDate(ret.getDate() + units);
                break;
            case 'hour'   :
                ret.setTime(ret.getTime() + units * 3600000);
                break;
            case 'minute' :
//                ret.setTime(ret.getTime() + units * 60000);
                //5 mintue
                ret.setTime(ret.getTime() + units * 60000 * 5);
                break;
            case 'second' :
                ret.setTime(ret.getTime() + units * 1000);
                break;
            default       :
                ret = undefined;
                break;
        }
        return ret;
    };

    /*
     * 日期相減
     * @param {string} startDate
     * @param {string} endDate
     * @param {string} diffUnit
     * @returns {unresolved}
     */
    easydate.dateDiff = function (startDate, endDate, diffUnit) {
        var _self = this;
        
  
        _self.logger.info('dateDiff start: ' + startDate + ', end: ' + endDate + ', diffUnit: ' + diffUnit);
        
        var dateS = moment(startDate);
        var dateE = moment(endDate);

        var difference = 0;
        switch (diffUnit) {
            case 'milliseconds':
                difference = dateE.diff(dateS);
                break;
            case 'minutes':
                difference = dateE.diff(dateS, 'minutes');
                break;
            case 'days':
                difference = dateE.diff(dateS, 'days');
//                difference = new Date(dateE).getDate()- new Date(dateS).getDate();
                break;
            case 'months':
                difference = dateE.diff(dateS, 'months');
                break;
            case 'years':
                difference = new Date(dateE).getFullYear() - new Date(dateS).getFullYear();
                break;

            default:
                _self.logger.error('invalid diff unit');
        }
        _self.logger.debug('dateDiff result: ' + difference);
        return difference;
    };

    easydate.date2Str = function (dateObj) {
        var _self = this;
        _self.logger.info('date2Str: ' + dateObj);
        if (typeof (dateObj) !== 'undefined') {
            var year = dateObj.getFullYear();
            var month = pad(dateObj.getMonth() + 1);
            var date =  pad(dateObj.getDate());
            var hour = pad(dateObj.getHours());
            var minute = pad(dateObj.getMinutes());
            var second = pad(dateObj.getSeconds());
//            var newDateStr =  year + '-' + month + '-' + date + ' ' + hour + ':' + minute + ':' + second;
            var newDateStr =  year + '/' + month + '/' + date + ' ' + hour + ':' + minute + ':' + second;
            _self.logger.debug('after date2str: ' + newDateStr);
            return newDateStr;
//            return year + '/' + month + '/' + date + ' ' + hour + ':' + minute + ':' + second;
        } else {
            return 'date2Str: Invalid date ';
        }
    };

    easydate.getDayUnit = function (dateObj) {
        if (typeof (dateObj) != 'undefined') {
            var date = dateObj.getDate();
            return date;
        } else {
//               console.log(dateObj);
            return 'getDayUnit: Invalid date';
        }
    };

    easydate.getHourUnit = function (dateObj) {
        if (typeof (dateObj) != 'undefined') {
            var hour = dateObj.getHours();
            return hour;
        } else {
//               console.log(dateObj);
            return 'getHourUnit: Invalid date';
        }
    };

    easydate.getMinuteUnit = function (dateObj) {
        if (typeof (dateObj) != 'undefined') {
            var minute = dateObj.getMinutes();
            return minute;
        } else {
//            console.log(dateObj);
            return 'getMinuteUnit Invalid date';
        }
    };

    easydate.parseDate = function (dateStr) {
        var _self = this;
        _self.logger.info('parseDate:' + dateStr);
       
        var a = $.map(dateStr.split(/[^0-9]/), function (s) {
            return parseInt(s, 10);
        });
        return new Date(a[0], a[1] - 1 || 0, a[2] || 1, a[3] || 0, a[4] || 0, a[5] || 0, a[6] || 0);
       
//        dateStr = dateStr.replace(/-/g,"/");
//       var newDate = new Date(Date.parse(dateStr));
//       return newDate;
    };

    easydate.str2Date = function (dateStr) {
        var _self =this;
        _self.logger.info('str2Date: ' + dateStr);
//        console.log('dateStr: ' + dateStr);
//        var parseDateObj = easydate.parseDate(dateStr);
//        return parseDateObj;
        // $.console('parse:' + parseDateObj);
        var convDate = new Date(Date.parse(dateStr));
        return convDate;
    };

//     easydate.str2DateWithFormat('2015-7-24 09:15:00','YYYY-MM-DD HH:mm:00')
    easydate.str2DateWithFormat = function (dateStr, format) {
        var _self = this;
        _self.logger.info('str2DateWithFormat: ' + dateStr + ', format: ' + format);
        //'YYYY-MM-DD hh:mm:ss'
//       
        var tmpDateObj = 
//                new Date(dateStr);
                _self.parseDate(dateStr);
        var convDate = moment(tmpDateObj.getTime()).format(format);
        _self.logger.debug('after str2DateWithFormat convDate: ' + convDate );
        return convDate;
    };

//     easydate.str2DateWithDatePeriod('2015-7-24 09:15:00','minute')
    easydate.str2DateWithDatePeriod = function (dateStr, datePeriod) {
        var _self = this;
//        str2DateWithFormat: 2015-7-24 09:15:00, format: YYYY-MM-DD HH:mm:00"
        _self.logger.info('str2DateWithDatePeriod dateStr: ' + dateStr + ', datePeriod:' + datePeriod);

        var convDate = '';
        //'YYYY-MM-DD hh:mm:ss'
        if (datePeriod === 'minute') {
            //HH => 24 hour format
            convDate =
                    easydate.str2DateWithFormat(dateStr, 'YYYY/MM/DD HH:mm:00');
//            easydate.str2DateWithFormat(dateStr, 'YYYY-MM-DD HH:mm:00');
        } else if (datePeriod === 'hour') {
            //
            convDate =
                    easydate.str2DateWithFormat(dateStr, 'YYYY/MM/DD HH:00:00');//+ ':00:00';
//                easydate.str2DateWithFormat(dateStr, 'YYYY-MM-DD HH:00:00');//+ ':00:00';

        } else if ((datePeriod === 'day')) {
            //
            convDate =
                    easydate.str2DateWithFormat(dateStr, 'YYYY/MM/DD');
//                    easydate.str2DateWithFormat(dateStr, 'YYYY-MM-DD');
        } else if (datePeriod === 'month') {
            convDate =
                    easydate.str2DateWithFormat(dateStr, 'YYYY/MM');
//            easydate.str2DateWithFormat(dateStr, 'YYYY-MM');
        } else if (datePeriod === 'year') {
            convDate =
                    easydate.str2DateWithFormat(dateStr, 'YYYY');
        }
        _self.logger.debug('conv dateStr: ' + convDate);
        
        return convDate;
    };

//    easydate.getDateTimeZone = function (offset) {
//        // 建立現在時間的物件
//        d = new Date();
//
//        // 取得 UTC time
//        utc = d.getTime() + (d.getTimezoneOffset() * 60000);
//        // 新增不同時區的日期資料
//        return new Date(utc + (3600000 * offset));
//    };

    /*
     * 轉換time zone
     * @param {string} inputDate
     * @param {boolean} inverse
     * @returns {}
     */
    easydate.getDateTimeZone = function (dateStr, inverseByClientZone) {
        var _self = this;
        _self.logger.info('getDateTimeZone dateStr: ' + dateStr + ', inverseByClientZone: ' + inverseByClientZone);
        var zoneOffset = moment().format('Z');
         _self.logger.debug(zoneOffset);
         
        var common = zoneOffset.indexOf(':');
        var zoneNumber = zoneOffset.substring(1,common);
        var inverse = zoneOffset.match(/[\+\-]+/g);
        
        _self.logger.debug('zoneNumber: ' + zoneNumber);
        _self.logger.debug('original inverse: ' + inverse);
        //改自動判斷
        if (inverseByClientZone == true) {
            //適用時機: 前端查詢日期
//            alert('強制反轉');
              _self.logger.debug('a');
              
//            zoneNumber = -zoneNumber;
            if(inverse == '-'){
                          _self.logger.debug('inverse: +'  );
                zoneNumber = +zoneNumber;
            } else{
                          
                zoneNumber = -zoneNumber;
                _self.logger.debug('inverse: -');
            }
        }else{
            //適用時機: 前端拿到server資料的時間
            _self.logger.debug('b');
            if(inverse == '-'){
                zoneNumber = -zoneNumber;
            } else{
                zoneNumber = +zoneNumber;
            }
        }

        
          _self.logger.debug('zoneNumber: ' + zoneNumber);

        //2015-06-03 09:00:00
//          moment(new Date('2015-06-03 17:00:00').getTime()).zone('-8:00').format('YYYY-MM-DD hh:mm:ss');


//          moment(new Date('2015-06-03 17:00:00')).utcOffset(8).format('YYYY-MM-DD hh:mm:ss');
        var dateAddResult = easydate.dateAdd(_self.parseDate(dateStr), 'hour', zoneNumber);
//        alert(dateAddResult);
        var conv2TimeZone =
                _self.date2Str(dateAddResult);
//                 moment(new Date(inputDate)).utcOffset(zoneNumber).format('YYYY-MM-DD hh:mm:ss');
        _self.logger.debug('conv2TimeZone: ' + conv2TimeZone);
        return conv2TimeZone;
    };

    easydate.getFirstDay = function () {
        var _self = this;
        var date = new Date();

        var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        return _self.date2Str(firstDay);
    };

    easydate.getNow = function () {
        var _self = this;
        var date = new Date();
        return _self.date2Str(date);
    };

    easydate.getHour = function () {
        var _self = this;

//        var now = new Date();

//        var nowEnd = _self.dateAdd(now,'hour',-1);
//          var hour = {
//            start:  _self.date2Str(nowEnd),
//            end: _self.date2Str(now)
//        };

        var today = moment().startOf('day').format('YYYY-MM-DD') + ' ';
        var currHour = moment().get('hour');
        var start = today + currHour + ':00:00';
        var end = today + currHour + ':59:59';
        var hour = {
            start: start,
            end: end
        };
        return hour;
    };

    easydate.getHour = function () {
        var _self = this;
        var today = moment().startOf('day').format('YYYY-MM-DD') + ' ';
        var currHour = moment().get('hour');
        var start = today + currHour + ':00:00';
        var end = today + currHour + ':59:59';
        var hour = {
            start: start,
            end: end
        };
        return hour;
    };

    easydate.getToday = function () {
        var _self = this;

        var today = {
            start: _self.date2Str(new Date(moment().startOf('day').valueOf())),
            end: _self.date2Str(new Date(moment().startOf('day').format('YYYY-MM-DD') + ' 23:59:59'))
        };
        return today;
    };

    easydate.getYesterday = function () {
        return easydate.period(-1, easydate.getToday(), 'today');
    };

    easydate.getThisWeek = function () {
        var _self = this;
        var now = moment(new Date());
        var mon = moment(new Date());
        mon.isoWeekday(1).startOf('day'); // destructive!
        var week = {
            start: _self.date2Str(new Date(mon.valueOf())),
//            end: _self.date2Str(new Date(now.valueOf())
            end: _self.date2Str(new Date(moment().startOf('day').format('YYYY-MM-DD') + ' 23:59:59'))
        };
        return week;
    };

    easydate.getLastWeek = function () {
        var _self = this;
        return easydate.period(-1, easydate.getThisWeek(), 'week');
    };

    easydate.getThisMonth = function () {
        var _self = this;
        var month = {
            start: _self.date2Str(new Date(moment().startOf('month').valueOf())),
//            end: _self.date2Str(new Date(Date.now()))
            end: _self.date2Str(new Date(moment().endOf('month').valueOf()))
        };
        return month;
    };

    easydate.getLastMonth = function () {
        var _self = this;
        return easydate.period(-1, easydate.getThisMonth(), 'month');
    };

    easydate.getThisYear = function () {
        var _self = this;
        var month = {
            start: _self.date2Str(new Date(moment().startOf('year').valueOf())),
            end: _self.date2Str(new Date(Date.now()))
        };
        return month;
    };

    easydate.getLastYear = function () {
        var _self = this;
        return easydate.period(-1, easydate.getThisYear(), 'year');
    };

    /*
     * 依時間類型計算回傳開始與結束時間
     * @parm: {string }dateType 
     */
    easydate.getDateRangeFromNow = function (dateType) {
        
        var _self = this;
        _self.logger.debug('getDateRangeFromNow dateType: ' + dateType);
        var dateRange = {};
        var now = new Date();

        dateRange.end = _self.date2Str(easydate.dateAdd(now, 'second', -1));

        switch (dateType) {
            case 'hour':
                //因為要取分，建議
//                dateRange.start = _self.date2Str(easydate.dateAdd(now, 'minute', -1));

//                  dateRange.start = _self.date2Str(easydate.dateAdd(now, 'hour', -1));
                var date = moment(now).format('YYYY/MM/DD');
                var hour = moment(now).get('hour');
                var min = 0;
                var minArr = moment(now).format('mm').toString().split('');
//                    console.log(minArr);
                if (minArr[1] < 5) {
                    min = minArr[0] + 0;
                } else if (minArr[1] >= 5) {
                    min = minArr[0] + 5;
                }
                var covDateStr = date + ' ' + hour + ':' + min + ':00';
//                     console.log(covDateStr);

                dateRange.end = _self.date2Str(easydate.dateAdd(covDateStr, 'second', -1));
                ;
//                     var newNow = new Date(covDateStr);
                dateRange.start = _self.date2Str(easydate.dateAdd(covDateStr, 'hour', -1));

                break;
            case 'day':
                dateRange.start = _self.date2Str(easydate.dateAdd(now, 'day', -1));
                break;
            case 'today':
                dateRange.start = _self.date2Str(easydate.dateAdd(now, 'day', -1));
                break;
            case 'week':
                dateRange.start = _self.date2Str(easydate.dateAdd(now, 'week', -1));
                break;
            case 'month':
                dateRange.start = _self.date2Str(easydate.dateAdd(now, 'month', -1));
                break;
            case 'year':
                dateRange.start = _self.date2Str(easydate.dateAdd(now, 'year', -1));
                break;

        }
        return dateRange;
    };

    easydate.getDateRange = function (dateType) {
        var dateRange = {};
        switch (dateType) {

            case 'hour':
                dateRange = easydate.getHour();
                break;

            case 'day':
                dateRange = easydate.getToday();
                break;
            case 'today':
                dateRange = easydate.getToday();
                break;

            case 'yesterday':
                dateRange = easydate.getYesterday();
                break;
            case 'week':
                dateRange = easydate.getThisWeek();
                break;
            case 'lweek':
                dateRange = easydate.getLastWeek();
                break;
            case 'month':
                dateRange = easydate.getThisMonth();
                break;
            case 'lmonth':
                dateRange = easydate.getLastMonth();
                break;
            case 'year':
                dateRange = easydate.getThisYear();
                break;
            case 'lyear':
                dateRange = easydate.getLastYear();
                break;

        }
        return dateRange;
    };

    easydate.period = function (dir, dateRange, currentPeriod) {
        // we need to normalise this to the nearest day    
        var _self = this;
        var start = moment(dateRange.start);

        if (currentPeriod == 'week') {
            start.isoWeekday(1).startOf('day');
        }

        var end = moment(dateRange.end);
        end.endOf('day');

        if (dir == -1) {
            start.subtract(1, currentPeriod).startOf(currentPeriod)//.startOf('day');
        } else {
            start.add(1, currentPeriod).startOf(currentPeriod);
        }
        end = moment(start).startOf('day');
        end.endOf(currentPeriod).endOf('day');
//        if (end > now) {
//            end = moment();
//        }
        var newPeroid = {
            start: _self.date2Str(new Date(start.valueOf())),
            end: _self.date2Str(new Date(end.valueOf()))
        };
        return newPeroid;
    };

    /*
     * 取得這個月有幾天 
     * 
     */
    easydate.getDaysInMonth = function () {
        return parseInt(moment().add('months', 1).date(1).subtract('days', 1).format('DD'));
    };
    
    function pad(str) {
        return ('0' + str).slice(-2);
    };

    window.easydate = easydate;

    return easydate;

})(log4jq);
