const dotenv = require("dotenv");
const { Client } = require("typesense");

dotenv.config();

const client = new Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST,
      port: "443",
      protocol: "https",
    },
  ],
  apiKey: process.env.TYPESENSE_ADMIN_API_KEY,
  connectionTimeoutSeconds: 2,
});

module.exports = {
  client,
};
