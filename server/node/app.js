/**
 * app.js
 * Express Example. Created by Aditya Gannavarapu (https://github.com/aditya-67)
 */

// create an express app
const express = require("express");
const cors = require("cors");
const app = express();
const config = require("./config");
var axios = require("axios");
const localStorage = require("localStorage");

// UTILS
const createData = require("./util/consent_detail");
const dataFlow = require("./util/request_data");

// use the express-static middleware

app.use(cors());
app.use(express.json());
app.use(express.urlencoded());
// app.use(bodyParser.text({ defaultCharset: "utf-8" }));

app.use(express.static("public"));

// define the first route
app.get("/", function (req, res) {
  res.send("Hello");
});

///// CREATE CONSENT CALL

app.get("/consent/:mobileNumber", (req, res) => {
  localStorage.setItem("consent", "Pending");
  let body = createData(req.params.mobileNumber);
  var requestConfig = {
    method: "post",
    url: config.api_url + "/consents",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": config.client_id,
      "x-client-secret": config.client_secret,
    },
    data: body,
  };

  axios(requestConfig)
    .then(function (response) {
      let url = response.data.url;
      res.send(url);
    })
    .catch(function (error) {
      console.log(error);
      console.log("Error");
    });
});

////// CONSENT NOTIFICATION

app.post("/notification", (req, res) => {
  var body = req.body;
  if (body.type === "CONSENT_STATUS_UPDATE") {
    if (body.data.status === "ACTIVE") {
      console.log("In Consent notification");
      fi_data_request(body.consentId);
    } else {
      localStorage.setItem("jsonData", "Rejected");
    }
  }
  if (body.type === "SESSION_STATUS_UPDATE") {
    if (body.data.status === "COMPLETED") {
      console.log("In FI notification");
      fi_data_fetch(body.dataSessionId);
    } else {
      localStorage.setItem("jsonData", "PENDING");
    }
  }

  res.send("OK");
});

////// FI DATA REQUEST

const fi_data_request = async (consent_id) => {
  console.log("In FI data request");
  let request_body = dataFlow.requestData(consent_id);
  var requestConfig = {
    method: "post",
    url: config.api_url + "/sessions",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": config.client_id,
      "x-client-secret": config.client_secret,
    },
    data: request_body,
  };

  axios(requestConfig)
    .then(function (response) {
      console.log("Data request sent");
    })
    .catch(function (error) {
      console.log(error);
      console.log("Error");
    });
};

////// FETCH DATA REQUEST

const fi_data_fetch = (session_id) => {
  console.log("In FI data fetch");
  var requestConfig = {
    method: "get",
    url: config.api_url + "/sessions/" + session_id,
    headers: {
      "Content-Type": "application/json",
      "x-client-id": config.client_id,
      "x-client-secret": config.client_secret,
    },
  };
  axios(requestConfig)
    .then(function (response) {
      localStorage.setItem("jsonData", JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
      console.log("Error");
    });
};

app.post("/redirect", (req, res) => {
  res.send(localStorage.getItem("consent"));
});

///// GET DATA

app.get("/get-data", (req, res) => {
  res.send(JSON.parse(localStorage.getItem("jsonData")));
});
// start the server listening for requests
app.listen(config.port || 3000, () => console.log("Server is running..."));
