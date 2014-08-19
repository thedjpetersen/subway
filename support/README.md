Support scripts
===============

[Init Script](init.d/subway)
----------------------------

This is a pretty basic init script to get subway running as a service.
By default it places a log file at /var/log/subway.log and a pid file
in /var/run/subway.pid .


[Nginx config](nginx/subway)
----------------------------

This is a simple Nginx host configuration that proxies both the normal
HTTP requests as well as Websocket connections to Subway's server.
Simply edit the file where necessary and throw it in your
/etc/nginx/sites-enabled (or what ever it's called) folder
and reload/restart your nginx (typically "service nginx reload").
