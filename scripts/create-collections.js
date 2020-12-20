const { client } = require("../lib/typesense");

const fields = [
  {
    name: "name",
    type: "string",
    facet: false,
  },
  {
    name: "latitude",
    type: "float",
    facet: false,
  },
  {
    name: "longitude",
    type: "float",
    facet: false,
  },
  {
    name: "sort_order",
    type: "int32",
    facet: false,
  },
];

const collections = ["geonames", "ons_postcodes", "os_opennames"];

collections.forEach((name) =>
  client.collections().create({
    name,
    fields,
    num_documents: 0,
    default_sorting_field: "sort_order",
  })
);