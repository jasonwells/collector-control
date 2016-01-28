var settings = {};

settings.redis = {
  url: 'redis://localhost',
  queue: 'resque:queue:test',
  class: 'TestClass',
};

settings.auth = {
  username: 'auser',
  password: 'notagoodpassword',
};

settings.server = {
  port: 3000,
};

module.exports = settings;
