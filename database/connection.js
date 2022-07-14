const { MongoClient } = require("mongodb");
require('dotenv').config();

const client = new MongoClient(process.env.ATLAS_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let dbConnection;

module.exports = {
  connect: async function () {
    return new Promise((resolve, reject) => {
      try {
        client.connect(function (err, db) {
          if (err || !db) {
            return reject(err);
          }
    
          dbConnection = db.db("blaze-crash-database");
          console.log("Successfully connected to MongoDB.");
          resolve(dbConnection);
        });
      } catch (error) {
        reject(error);
      }
    })
  },

  getDb: function () {
    return dbConnection;
  },
};