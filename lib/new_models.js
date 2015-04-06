var bcrypt = require("bcryptjs");
var Sequelize = require("sequelize");

var sequelize = new Sequelize('subway', '', '', {
  dialect: 'sqlite'
});

var User = sequelize.define("User", {
  username: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  session_id: Sequelize.STRING
}, {
  classMethods: {
    login: function(username, password) {
      return new Sequelize.Promise(function(resolve, reject) {
        User.find({where: {username: username}})
        .complete(function(err, user) {
          if(!!err) {
            reject(err);
          } else if(!user) {
            reject('No user with the username \"' + username + '\" has been found.');
          } else {
            bcrypt.compare(password, user.password, function(err, res) {
              if(!!err) {
                reject(err);
              } else {
                if (res) {
                  resolve(user);
                } else {
                  reject(new Error("Invalid Password"));
                }
              }
            });
          }
        });
      });
    },

    register: function(username, password) {
      return new Sequelize.Promise(function(resolve, reject) {
        User.create({username: username, password: password})
        .complete(function(err, user) {
          if(!!err) {
            reject(err);
          } else {
            resolve(user);
          }
        });
      });
    }
  },
  hooks: {
    beforeCreate: function(user, options, fn) {
      bcrypt.hash(user.password, 10, function(err, hash) {
        user.password = hash;
        fn(null, user);
      });
    }
  }
});

var Settings = sequelize.define("Settings", {
  settings: Sequelize.TEXT
});

// Model to capture IRC message
var Message = sequelize.define("Message", {
  // we will capture the whole message as a JSON blob
  server: Sequelize.STRING,
  from: Sequelize.STRING,
  to: Sequelize.STRING,
  data: Sequelize.STRING
});

User.hasOne(Settings, {as: 'Settings'});

sequelize
.sync()
.complete(function(err) {
  if(!!err) {
    console.log("Unable to connect to database:", err);
  } else {
    console.log("Connection has been established successfully");
  }
});

module.exports = {
  User: User,
  Settings: Settings,
  Message: Message
};
