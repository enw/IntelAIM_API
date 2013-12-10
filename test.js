var naim =require('./lib/naim');

naim.connect(null,null,function(err) {
    console.log('connected');

    // simple calls
    naim.getAudienceCount(function(err, count) {
        if (err) { console.log('ERR',err); return err; }
        console.log('got viewer count of', count);
      });

    naim.getAudienceDetails(function(err, details) {
        if (err) { console.log('ERR',err); return err; }
        console.log('got audience details', details);
      });
    
    // stream
    naim.listen(true);
    naim.on('ACK', function() {
        console.log('ACK received');
    });
    naim.on('NACK', function() {
        console.log('NACK received');
    });
    naim.on('EVENT_VIEWER', function(d) {
        console.log('EVENT_VIEWER received',d);
    });
  })
