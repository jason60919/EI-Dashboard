/* 
 *  Next time 
 *  Ease to get next time
 * @auth ken.tsai@advantech.com.tw
 * @date 20141113
 * @required
 * js/sa/utils/easyday.js
 */

var nexttime =  (function(easydate) {

    function _dateAdd(date, interval, units) {
        return easydate.dateAdd(date, interval, units);
    }

    function _date2Str(dateObj) {
        return easydate.date2Str(dateObj);
    }
    
    var nexttime = {};
    
    nexttime.logger = log4jq.getLogger({
        loggerName: 'nexttime.js'
    });
        
    nexttime.version = "0.0.1";
    nexttime.author = 'bigd';

    nexttime.interval = 'second';
    nexttime.units = 1;
    
    nexttime.preDate = new Date();
    nexttime.nextDate = '';
        
    nexttime.setUnits = function(newUnits){
        var _self = this;
        _self.units = newUnits;
    };
    nexttime.setIntreval = function(newInterval){
        var _self = this;
        _self.interval = newInterval;
    };
    
    nexttime.setPre = function(preDate){
        var _self = this;
        _self.preDate = preDate;
        _self.nextDate = '';//re-start
        return _self.preDate;
    };
    
    nexttime.getPre = function(){
        return _date2Str(nexttime.preDate);
    };
    
    nexttime.getNext = function(){
        var _self = this;
        
        if(_self.nextDate == ''){
            
            _self.logger.debug('first getNext: ' + _self.preDate)
          
            //new
            _self.nextDate = _dateAdd(
                _self.preDate,
                _self.interval,
                _self.units);
            
            nexttime.logger.debug('update next: ' + _self.preDate)
            
        }else{
            
            _self.logger.debug('update next');
            
            //update next
            _self.preDate = nexttime.nextDate;
            
            _self.logger.debug('old next Date: ' +  nexttime.nextDate ); 
      
            _self.nextDate = _dateAdd(nexttime.nextDate,nexttime.interval,1)
            
            _self.logger.debug('new next Date: ' + nexttime.nextDate ); 
            
        }

        return _date2Str(_self.nextDate);
    };
    
    window.nexttime = nexttime;

    return nexttime;
    
})(easydate);





