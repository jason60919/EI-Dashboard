/*
 *  content pack generator template
 *  @date 2015/11/04
 */
if (typeof (ContentPackGenerator) !== 'undefined') {
    ContentPackGenerator.register('deviceSystemInfo', 'DeviceSystemInfoContentPackGenerator');
}

var DeviceSystemInfoContentPackGenerator = (function (log4jq) {

    var self = {};
    self.name = 'SA.DeviceSystemInfoContentPackGenerator.js';

    var logger = log4jq.getLogger({
        loggerName: self.name
    });

    /*
     * Sample create function
     * dsGenerator.create = function (pack_type,data) {};
    */
    self.create = function (data,callback) {
        logger.info('create');
     
        logger.debug(data);
          
        //SUSIControl
        Device2ContentPackGenerator.create(
                data,
                'ProcessMonitor',
                ['System Monitor Info','Process Monitor Info'],
//                ['System Monitor Info'],
               
                function(config){
                    if(typeof(callback === 'function')){
                        callback(config);
                    }
                });
    };
    
    window[self.name] = self;

    return self;
})(log4jq);

function testDeviceSystemInfoContentPackGenerator(device) {
   
    var config = Device2ContentPackGenerator.create(device,   
                'ProcessMonitor',
                ['Process Monitor Info']);
}