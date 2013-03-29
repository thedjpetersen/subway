exports.dev = {
    port: process.env.PORT || 3000,
    client_port: process.env.PORT || 3000,
    mongoose_auth: process.env.MONGODB_URL || 'mongodb://mongodb@localhost/subway'
}

exports.prod = {
    port: process.env.PORT || 14858, // Nodester port
    client_port: 80, // Websockets talk on port 80 on Nodester, regardless of listen port
    mongoose_auth: process.env.MONGODB_URL ||  'mongodb://mongodb@localhost/subway'
}

exports.misc = {
  max_log_size: 32000
}