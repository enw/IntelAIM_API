var naim = require('./lib/naim');
naim.connect(null,null,function(err) {
    console.log('connected');

    naim.getViewerCount(function(err, count) {
        if (err) return err;
        console.log("got viewer count of", count);
      });
  })
