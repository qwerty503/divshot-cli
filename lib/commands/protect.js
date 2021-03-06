var regular = require('regular');
var format = require('chalk');
var _ = require('lodash');

module.exports = function (cli) {
  var command = cli.command('protect <environment> <username:password>');
  
  command.before('authenticate');
  command.description('add http basic auth to any environment');
  command.handler(function (env, credentials, done) {
    if (!env) return done(cli.errors.MISSING_ENVIRONMENT);
    if (!credentials) return done(cli.errors.MISSING_CREDENTIALS);
    
    var username = credentials.split(':')[0];
    var password = credentials.split(':')[1];
    
    if (!regular.basicAuth.test(credentials) || !username || !password) return done(cli.errors.INVALID_CREDENTIALS);
    
    cli.commands.apps(function (err, apps) {
      var name = cli.cwd.getConfig().name;
      var appObj = _.find(apps.self, function (app) {
        return app.name === name;
      });
      
      if (!appObj) return done(format.bold(name) + ' app does not exist');
      
      cli.api.apps.id(appObj.id).env(env).config({
        auth: credentials
      }, function (err, response) {
        if (err || response.statusCode !== +200) return done(cli.errors.DEFAULT);
        
        cli.log(format.bold(env) + ' has been protected.', {success: true});
        done(err, response);
      });
    });
  });
};