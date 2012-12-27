exports.dev = {
    port: 3000,
    client_port: 3000,
    mongoose_auth: 'mongodb://mongodb@localhost/subway',
    default_ircserver: '192.168.56.54',
    default_ircchannel: '#powerline'
}

exports.prod = {
    port: 14858, // Nodester port
    client_port: 80, // Websockets talk on port 80 on Nodester, regardless of listen port
    mongoose_auth: 'mongodb://mongodb@localhost/subway',
    default_ircserver: '192.168.56.54',
    default_ircchannel: '#powerline'
}

exports.misc = {
  max_log_size: 32000
}
