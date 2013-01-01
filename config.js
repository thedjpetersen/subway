exports.dev = {
    port: 3000,
    client_port: 3000,
    mongoose_auth: 'mongodb://mongodb@localhost/subway',
    // default_ircserver: '127.0.0.1',
    // default_ircchannel: '#your_chan'
}

exports.prod = {
    port: 14858, // Nodester port
    client_port: 80, // Websockets talk on port 80 on Nodester, regardless of listen port
    mongoose_auth: 'mongodb://mongodb@localhost/subway',
    // default_ircserver: '127.0.0.1',
    // default_ircchannel: '#your_chan'
}

exports.misc = {
  max_log_size: 32000
}
