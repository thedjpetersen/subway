Subway
======

*(Note: this is aspirational. Not implemented yet!)*

Subway is an IRC client/server combination. The server works for multiple simultaneous users, with optional persistent connections and logging. The client is a modern JavaScript-heavy web interface. Server/client communication is done with websockets (or best available fallback) via socket.io.

Subway utilizes [node.js](http://nodejs.org/) and
Martyn Smith's [node-irc](https://github.com/martynsmith/node-irc) on the backend,
and [Backbone.js](http://documentcloud.github.com/backbone/) and
[jQuery](http://jquery.com/) on the frontend.


Status
------

Nothing works yet. Functionality to come shortly. If you'd like to contribute,
there is plenty to do. Tickets for needed functionality also to come shortly.

Installation
------------

*Should be something like this, once implemented:*

1. Assuming you already have node.js & npm, run:

    $ npm install -g subway

2. Launch the web server

    $ node bin/subway

3. Point your browser at `http://localhost:8337/`

Development
-----------

*Should be about like this, once implemented:*

Replace step 1 above with this:

    $ git clone https://github.com/thedjpetersen/subway.git
    $ cd subway
    $ npm link

this should install dependencies, and link the git checkout to your global
node_modules directory.

History
-------

Subway is a combination of two projects that started independently
with a similar technology stack and similar aims:

- [subway-web](https://github.com/thedjpetersen/subway-web) /
  [subway-server](https://github.com/thedjpetersen/subway-server)
  by David Petersen
- [web-irc](https://github.com/akavlie/web-irc) by Aaron Kavlie

Its goals are twofold:
1) Become the best web-based IRC client available
2) Provide a really easy method of persistent IRC connections, available
   from any web browser


Credits
-------

Major Subway contributors include:

- [David Petersen](https://github.com/thedjpetersen), developer
- [Aaron Kavlie](https://github.com/akavlie), developer
- [Jamie Soar](http://www.jamiesoarmusic.co.uk/), notification sounds


License
-------

Excepting third-party assets (licensed as specified in their respective files
or directories), this project is covered by the MIT License:


The MIT License (MIT)
Copyright (c) 2011 David Petersen

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
