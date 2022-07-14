const mongo = require("../database/connection");

module.exports = {
  basic: async function ({ query = {}, balance, investment, multiplier }) {
    return new Promise(async (resolve, reject) => {
      let historic = [];
      const db = mongo.getDb();
      const data = await db.collection("Crashes").find(query).toArray();

      let currentBalance = balance;

      let peak = {
        date: null,
        crashValue: null,
        currentBalance: null,
      };

      data.forEach((el) => {
        const { date, value } = el;
        if (currentBalance && value) {
          if (currentBalance > peak.currentBalance) {
            const percentage = (currentBalance / balance) * 100;
            peak = {
              date,
              crashValue: value,
              currentBalance,
              percentage,
            };
          }

          currentBalance = currentBalance - investment;
          if (multiplier <= value) {
            const profit = investment * multiplier;
            currentBalance = currentBalance + profit;
            const totalProfit = currentBalance - balance;
            historic.push({
              date,
              currentBalance,
              crashValue: value,
              totalProfit,
            });
          } else {
            const totalProfit = currentBalance - balance;
            historic.push({
              date,
              currentBalance,
              crashValue: value,
              totalProfit,
            });
            if (!currentBalance) return;
          }
        }
      });
      const percentage = (currentBalance / balance) * 100;
      resolve({
        inputs: { query, balance, investment, multiplier },
        historic,
        result: {
          balance: currentBalance,
          percentage,
          peak,
        },
      });
    });
  },
  advanced: async function ({
    query = {},
    balance,
    investment,
    previous_multiplier,
    profit_multiplier,
  }) {
    return new Promise(async (resolve, reject) => {
      let historic = [];
      const db = mongo.getDb();
      const data = await db.collection("Crashes").find(query).toArray();

      let currentBalance = balance;
      let previousValue;

      let peak = {
        date: null,
        crashValue: null,
        currentBalance: null,
      };

      data.forEach((el) => {
        const { date, value } = el;
        if (currentBalance && value) {
          if (currentBalance > peak.currentBalance) {
            const percentage = (currentBalance / balance) * 100;
            peak = {
              date,
              crashValue: value,
              currentBalance,
              percentage,
            };
          }

          currentBalance = currentBalance - investment;

          if (previousValue <= previous_multiplier) {
            if (profit_multiplier <= value) {
              const profit = investment * profit_multiplier;
              currentBalance = currentBalance + profit;
              const totalProfit = currentBalance - balance;
              historic.push({
                date,
                currentBalance,
                previousValue,
                crashValue: value,
                totalProfit,
              });
            } else {
              const totalProfit = currentBalance - balance;
              historic.push({
                date,
                currentBalance,
                previousValue,
                crashValue: value,
                totalProfit,
              });
              if (!currentBalance) return;
            }
          }
        }
        previousValue = value;
      });
      const percentage = (currentBalance / balance) * 100;
      resolve({
        inputs: {
          query,
          balance,
          investment,
          previous_multiplier,
          profit_multiplier,
        },
        historic,
        result: {
          balance: currentBalance,
          percentage,
          peak,
        },
      });
    });
  },
};
