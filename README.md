naim
====

## Synopsis
Node.js interface to [Intel's AIM Suite](https://aimsuite.intel.com/) API

In the words of Intel - "real-time audience counting and analytics".

## Code Example

var naim = require('naim').connect();

// subscribe to stream of events
naim.listen(true);
naim.on('start', function(viewer) {
    console.log('viewing started', viewer);                
});
naim.on('stop', function(viewer) {
    console.log('viewing stopped', viewer);                
});

// get number of viewers
naim.getViewerCount(function(err, count) {
    if (err) return err;
    console.log('there are',count,viewers);
});

## Motivation

Developing cross-platform network code on nodejs is fast.  

## API Reference

Depending on the size of the project, if it is small and simple enough the reference docs can be added to the README. For medium size to larger projects it is important to at least provide a link to where the API reference docs live.
...

## Tests

Describe and show how to run the tests with code examples.
...

## Contributors

Let people know how they can dive into the project, include important links to things like issue trackers, irc, twitter accounts if applicable.
...

## License
MIT

