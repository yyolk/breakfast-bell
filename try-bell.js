var fakeContext = require('./fakeLambdaContext');
var main = require('./dist/main');

main.handler(
  fakeContext.event,
  fakeContext.context,
  fakeContext.callback
);
