/* 
 * Extend Array function
 * @reference http://stackoverflow.com/questions/3954438/remove-item-from-array-by-value
 * @date 20141126
 */

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

function findAndRemove(array, property, value) {
   $.each(array, function(index, result) {
      if(result[property] == value) {
//          console.log(result[property] );
//          console.log(value )
          //Remove from array
          array.splice(index, 1);
      }    
   });
   return array;
}
