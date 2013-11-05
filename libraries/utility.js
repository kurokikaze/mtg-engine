Array.prototype.shuffle = function() {
  var i = this.length, j, tempi, tempj;
  if ( i == 0 ) return false;
  while ( --i ) {
     j       = Math.floor( Math.random() * ( i + 1 ) );
     tempi   = this[i];
     tempj   = this[j];
     this[i] = tempj;
     this[j] = tempi;
  }
  return this;
};

function asyncLoop(iterations, func, callback) {
    var index = 0;
    var done = false;
    var loop = {
        'next': function() {
            if (done) {
                return;
            }

            if (index < iterations) {
                index++;
                func(loop);

            } else {
                done = true;
                callback();
            }
        },

        'iteration': function() {
            return index - 1;
        },

        'break': function() {
            done = true;
            callback();
        }
    };
    loop.next();
    return loop;
}
