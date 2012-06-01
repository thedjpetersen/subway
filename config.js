exports.development = {
    port: 3000,
    client_port: 3000,
    mongoose_endpoint: 'mongodb://mongodb@localhost/subway',
    accept_self_signed_ssl: true,
    accept_expired_ssl: true
}

exports.production = {
    port: 14858, // Nodester port
    client_port: 80, // Websockets talk on port 80 on Nodester, regardless of listen port
    mongoose_endpoint: 'mongodb://mongodb@localhost/subway',
    accept_self_signed_ssl: false,
    accept_expired_ssl: false
}
