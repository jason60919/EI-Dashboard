/* 
 * SA ConnectionPool for data sources
 * @author: ken.tsai@advantech.com.tw
 * @date 2015/11/20
 * @required
 * @jquery.ajaxqueue2
 */
/* 
 Allows for ajax requests to be run synchronously in a queue
 with pool , without cancel
 Usage::
 var queue = new $.AjaxQueue();
 
 // add with tag name or not , both ok
 queue.add('test',{
 url: 'url',
 complete: function() {
 console.log('ajax completed');
 },
 _run: function(req) {
 //special pre-processor to alter the request just before it is finally executed in the queue
 req.url = 'changed_url'
 }
 });
 
 */
(function (log4jq) {

    $.AjaxQueue = function () {

        this.logger = log4jq.getLogger({
            loggerName: 'AjaxQueue'
        });

        this.MAX_POOL_LIMITATION = 50;
        this.MAX_POOL_SIZE = 1;
        this.CURR_POOL_SIZE = 0;
        
        this.reqs = [];//request pool
        this.requesting = false;
        this.current_reqs_tag = null;
        this.current_req = null;

    };
    
    $.AjaxQueue.prototype = {
        getQueues: function () {
            
            var self = this;
            var logger = self.logger;
            logger.info('getQueues');
            
            logger.debug(self.reqs);
            var nowQueues = self.reqs;
            logger.debug('total queues: ' + nowQueues.length);
            return nowQueues;
        },
        setMaxPool: function (poolSize) {
            
            var self = this;
            var logger = self.logger;
            logger.info('setMaxPool');
            
            self.MAX_POOL_SIZE = poolSize;
        },
        setConcurrentPool: function (poolSize) {
            
            var self = this;
            var logger = self.logger;
            logger.info('setConcurrentPool');
            
            self.CURR_POOL_SIZE = poolSize;
        },
        add: function (req) {
            
            var self = this;
            var logger = self.logger;

            self.reqs.push({n: '', r: req});
            self.next();
        },
        addWithName: function (name, req) {
            var self = this;
            var logger = self.logger;

            logger.info('addWithName: ' + name);
            self.reqs.push({n: name, r: req});
            var count =  self.reqs.length;
            
            if(count >= self.MAX_POOL_LIMITATION){
                logger.warn('exceed max pool limitation: ' + self.MAX_POOL_LIMITATION);
                self.clear();
                self.reqs.push({n: name, r: req});
            }
            logger.debug('queue size: ' + count);
            self.next();
        },
        remove: function (name) {
            
            var self = this;
            var logger = self.logger;
            
            // TODO: NOT IMPLEMENT
            if(self.current_reqs_tag == name){
                logger.warn('Cancel Request : ' + name);
                self.current_req.abort();
                alert('abort');
                self.current_req = null;
                self.current_reqs_tag = null;
                self.requesting = false;
                self.next();
            }else{
                for (var i = 0; i < this.reqs.length; i++) {
                    if(self.reqs[i]['n'] == name){
                        self.reqs.splice(i, 1);
                        break;
                    }
                }
            }
        },
        clear: function(){
            
            var self = this;
            var logger = self.logger;
            
            var countReqs = self.reqs.length;
            logger.info('clear: ' + countReqs);
            //reset
            self.CURR_POOL_SIZE = 0;
            self.reqs = [];
            if(self.current_req != null){
                logger.debug('abort curr request');
                self.current_req.abort();
            }
        },
        next: function () {

            var self = this;
            var logger = self.logger;

            logger.info('next');
            logger.debug('queue size: ' + this.reqs.length);

            if (self.reqs.length === 0) {
                logger.debug('queue is equal zero...');
                return;
            }

            if (self.CURR_POOL_SIZE >= self.MAX_POOL_SIZE) {
                logger.warn('concurrent pool size more than max pool size (' +  self.MAX_POOL_SIZE +  '): ' + self.CURR_POOL_SIZE );
                return;
            }

            var request = self.reqs.splice(0, 1)[0];
            var req = request['r'];

            var complete = req.complete;

            self.current_reqs_tag = request['n'];
            
            if (req._run) {
                logger.debug('request run');
                req._run(req);
            }
            req.complete = function (event) {
                logger.debug('==================req.complete==================');
//                console.log(event);
                if (complete) {
                    complete.apply(this, arguments);
                }
                self.CURR_POOL_SIZE--;
                logger.debug('update concurrent pool: ' + self.CURR_POOL_SIZE);
                self.next();
            };

            self.CURR_POOL_SIZE++;
            self.current_req = $.ajax(req);
        }
    };
})(log4jq);


var ConnectionPool = (function (log4jq) {

    var self = {};

    var logger = log4jq.getLogger({
        loggerName: 'SA.ConnectionPool.js'
    });
    logger.info('ConnectionPool init');

    var API_ENDPOINT = REST.getAPIEndpoint();

    var queue = new $.AjaxQueue();

    self.add = function (name, ajaxOpts) {
//        var url = '';
//        if(ajaxOpts.url.indexOf('http') < 0){
//            url = API_ENDPOINT + ajaxOpts.url;
//        }else{
//            url = ajaxOpts.url;
//        }
//        
//        
        logger.info('add');
        logger.info('connect: ' + name);
        logger.info('url: ' + ajaxOpts.url);
//        ajaxOpts.url = url;
        queue.addWithName(name, ajaxOpts);
    };

    self.getQueues = function () {
        logger.info('getQueues');
        return queue.getQueues();
    };
    
    self.clear = function () {
        logger.info('clear');
        return queue.clear();
    };
    
    return self;

})(log4jq);
