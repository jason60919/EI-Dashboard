/* 
 *  Easy random function
 * @author ken.tsai@advantech.com.tw
 * @date 20141201
 */

var easyrandom = (function() {

    var easyrandom = {};
  
    /**
                    * Returns a random integer between min (inclusive) and max (inclusive)
                    * Using Math.round() will give you a non-uniform distribution!
                    */  
    easyrandom.get = function(max,min){
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    
    window.easyrandom = easyrandom;

    return easyrandom;
})();
