Subway
======

Subway is a web-based IRC client with a multi-user backend and a
JavaScript-heavy UI. Frontend/backend communication is done with
websockets (or best available fallback where not available).
The backend supports connection persistence and optional logging when the
browser disconnects.

Subway is built with [node.js](http://nodejs.org/),
[node-irc](https://github.com/martynsmith/node-irc)
and [MongoDB](http://www.mongodb.org/) on the backend,
and [Backbone.js](http://documentcloud.github.com/backbone/) and
[jQuery](http://jquery.com/) on the frontend.

Screenshots
------------
![Overview](http://people.oregonstate.edu/~petersed/overview.png)
![Chat](http://people.oregonstate.edu/~petersed/chat.png)

Installation
------------

*Should be something like this, once implemented:*

1. Assuming you already have node.js, npm, and mongo, run:

        $ git clone https://github.com/thedjpetersen/subway.git
        $ cd subway

2. Install the dependencies using npm:
    
    	$ npm install

3. Launch the web server

        $ node subway

4. Point your browser at `http://localhost:3000/`


Deployment
-----------
### Nodejitsu
To deploy to Nodejitsu, update the `name` and `subdomain` values in `package.json` to the appropriate values for your app. Then:

    $ jitsu databases create mongo subway

Now change the line `mongoose.connect('mongodb://localhost/subway');` in lib/irchandler.js to the connect URI you got back from jitsu. Then:

    $ jitsu env set PORT 80
    $ jitsu deploy


Development
-----------

Discussion about the client takes place on the freenode channel **#subway**, and on
this repository's [Issues](https://github.com/thedjpetersen/subway/issues) page.
Contributors are welcome and greatly appreciated.


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

The inspiration for Subway was trying to watch a fellow programmer try
to explain how to set up screen/irssi to a non-technical person.


Credits
-------

Major Subway contributors include:

- [David Petersen](https://github.com/thedjpetersen), developer
- [Aaron Kavlie](https://github.com/akavlie), developer
- [Eric Barch](https://github.com/ericbarch), developer
- [HyeonJe Jun](https://github.com/noraesae), developer
- [Jamie Soar](http://www.jamiesoarmusic.co.uk/), notification sounds
- Yusuke Kamiyamane, some icons

**The logo right now is a Gowalla icon, we are not planning on keeping this, we are only planning on using it as a placeholder**


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
