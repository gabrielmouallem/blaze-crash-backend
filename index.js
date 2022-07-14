const express = require("express");
const cors = require("cors");
const mongo = require("./database/connection");
const report = require("./utils/report");

require("dotenv").config();
mongo.connect();

const app = express();
const PORT = process.env.PORT ? process.env.PORT : 8000;

const allowedOrigins = ["http://localhost:3000", process.env.FRONTEND_URL];

app.use(express.json());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);

app.use("/crash", async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] /crash`);
    const db = mongo.getDb();
    await db
      .collection("Crashes")
      .find({})
      .sort({ date: -1 })
      .toArray(function (err, data) {
        if (err || !db) {
          return res.status(400).send({ message: err });
        }
        res.send(data);
      });
  } catch (err) {
    res.status(400).send({message: err})
  }
});

app.use("/report", async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] /report`);
    let query = {};
  
    if (!req?.body)
      res.status(400).send({
        message: "Missing request body",
      });
  
    if ("filters" in req.body) {
      const { filters } = req.body;
  
      if ("startDate" in filters && "endDate" in filters) {
        const startDate = filters.startDate;
        const endDate = filters.endDate;
  
        query = {
          date: {
            $gt: new Date(startDate),
            $lt: new Date(endDate),
          },
        };
      } else if ("startDate" in filters) {
        const startDate = filters.startDate;
  
        query = {
          date: {
            $gt: new Date(startDate),
          },
        };
      } else if ("endDate" in filters) {
        const endDate = filters.endDate;
  
        query = {
          date: {
            $lt: new Date(endDate),
          },
        };
      }
    }
  
    if ("pattern" in req.body) {
      const { pattern } = req.body;
  
      if ("type" in pattern) {
        if (pattern.type === "basic") {
          if (
            "balance" in pattern &&
            "investment" in pattern &&
            "multiplier" in pattern
          ) {
            const balance = pattern.balance;
            const investment = pattern.investment;
            const multiplier = pattern.multiplier;
  
            const result = await report.basic({
              query,
              balance,
              investment,
              multiplier,
            });
            res.send(result);
          } else
            res.status(400).send({
              message:
                "Basic Report missing one or more attributes: balance, investment or multiplier",
            });
        } else if (pattern.type === "advanced") {
          if (
            "balance" in pattern &&
            "investment" in pattern &&
            "previous_multiplier" in pattern &&
            "profit_multiplier" in pattern
          ) {
            const balance = pattern.balance;
            const investment = pattern.investment;
            const previous_multiplier = pattern.previous_multiplier;
            const profit_multiplier = pattern.profit_multiplier;
  
            const result = await report.advanced({
              query,
              balance,
              investment,
              previous_multiplier,
              profit_multiplier,
            });
            res.send(result);
          } else
            res.status(400).send({
              message:
                "Advanced Report missing one or more attributes: balance, investment, previous_multiplier or profit_multiplier",
            });
        } else {
          res.status(400).send({
            message:
              "Basic report with invalid type attribute, options are: 'basic' and 'advanced'",
          });
        }
      } else
        res.status(400).send({ message: "Report is missing type attribute" });
    } else
      res.status(400).send({ message: "Report is missing pattern attribute" });
  } catch (err) {
    res.status(400).send({message: err})
  }
});

app.use("/", (req, res) => {
  res.send("The Crash Server is online!");
});

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
  console.log({allowedOrigins});
});
