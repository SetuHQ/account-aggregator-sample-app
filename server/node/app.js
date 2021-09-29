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

var jwkToPem = require("jwk-to-pem");

// UTILS
const uuid = require("./util/uuid");
const signature = require("./util/request_signing");
const requestData = require("./util/request_data");
const createData = require("./util/consent_detail");
const decrypt_data = require("./util/decrypt_data");

const fs = require("fs");

// use the express-static middleware

app.use(cors());
app.use(express.json());
app.use(express.urlencoded());

app.use(express.static("public"));

// define the first route
app.get("/", function (req, res) {
  res.send("Hello from AA sample app");
});

///// CREATE CONSENT CALL

app.get("/consent/:mobileNumber", (req, res) => {
  localStorage.setItem("consent", "Pending");
  let body = createData(req.params.mobileNumber);
  const privateKey = fs.readFileSync("./keys/private_key.pem", {
    encoding: "utf8",
  });
  let detachedJWS = signature.makeDetachedJWS(privateKey, body);
  var requestConfig = {
    method: "post",
    url: config.api_url + "/Consent",
    headers: {
      "Content-Type": "application/json",
      client_api_key: config.client_api_key,
      "x-jws-signature": detachedJWS,
    },
    data: body,
  };

  axios(requestConfig)
    .then(function (response) {
      let url =
        config.app_url +
        "/" +
        response.data.ConsentHandle +
        "?redirect_url=<YOUR_CLIENT_URL>/redirect";
      res.send(url);
    })
    .catch(function (error) {
      console.log(error);
      console.log("Error");
    });
});

////// CONSENT NOTIFICATION

app.post("/Consent/Notification", (req, res) => {
  var body = req.body;
  console.log(body);

  let headers = req.headers;
  let obj = JSON.parse(fs.readFileSync("./keys/setu_public_key.json", "utf8"));
  let pem = jwkToPem(obj);

  if (signature.validateDetachedJWS(headers["x-jws-signature"], body, pem)) {
    let consent_id = body.ConsentStatusNotification.consentId;
    let consent_status = body.ConsentStatusNotification.consentStatus;

    localStorage.setItem("consent_id", consent_id);
    localStorage.setItem("consent_status", consent_status);

    if (consent_status === "ACTIVE") {
      fetchSignedConsent(consent_id);
    }

    const dateNow = new Date();
    res.send({
      ver: "1.0",
      timestamp: dateNow.toISOString(),
      txnid: uuid.create_UUID(),
      response: "OK",
    });
  } else {
    res.send("Invalid Signature");
  }
});

////// FETCH SIGNED CONSENT

const fetchSignedConsent = (consent_id) => {
  const privateKey = fs.readFileSync("./keys/private_key.pem", {
    encoding: "utf8",
  });
  let detachedJWS = signature.makeDetachedJWS(
    privateKey,
    "/Consent/" + consent_id
  );
  var requestConfig = {
    method: "get",
    url: config.api_url + "/Consent/" + consent_id,
    headers: {
      "Content-Type": "application/json",
      client_api_key: config.client_api_key,
      "x-jws-signature": detachedJWS,
    },
  };

  axios(requestConfig)
    .then(function (response) {
      fi_data_request(response.data.signedConsent, consent_id);
    })
    .catch(function (error) {
      console.log(error);
      console.log("Error");
    });
};

////// FI DATA REQUEST

const fi_data_request = async (signedConsent, consent_id) => {
  let keys = await requestData.generateKeyMaterial();
  let request_body = requestData.requestDataBody(
    signedConsent,
    consent_id,
    keys["KeyMaterial"]
  );
  const privateKey = fs.readFileSync("./keys/private_key.pem", {
    encoding: "utf8",
  });
  let detachedJWS = signature.makeDetachedJWS(privateKey, request_body);
  var requestConfig = {
    method: "post",
    url: config.api_url + "/FI/request",
    headers: {
      "Content-Type": "application/json",
      client_api_key: config.client_api_key,
      "x-jws-signature": detachedJWS,
    },
    data: request_body,
  };

  axios(requestConfig)
    .then(function (response) {
      // Ideally, after this step we save the session ID in your DB and wait for FI notification and then proceed.
      fi_data_fetch(
        response.data.sessionId,
        keys["privateKey"],
        keys["KeyMaterial"]
      );
    })
    .catch(function (error) {
      console.log(error);
      console.log("Error");
    });
};

////// FI NOTIFICATION

app.post("/FI/Notification", (req, res) => {
  var body = req.body;
  let headers = req.headers;
  let obj = JSON.parse(fs.readFileSync("./keys/setu_public_key.json", "utf8"));
  let pem = jwkToPem(obj);

  if (signature.validateDetachedJWS(headers["x-jws-signature"], body, pem)) {
    // Do something with body
    // Ideally you wait for this notification and then proceed with Data fetch request.
    const dateNow = new Date();
    res.send({
      ver: "1.0",
      timestamp: dateNow.toISOString(),
      txnid: uuid.create_UUID(),
      response: "OK",
    });
  } else {
    res.send("Invalid Signature");
  }
});

////// FETCH DATA REQUEST

const fi_data_fetch = (session_id, encryption_privateKey, keyMaterial) => {
  const privateKey = fs.readFileSync("./keys/private_key.pem", {
    encoding: "utf8",
  });
  let detachedJWS = signature.makeDetachedJWS(
    privateKey,
    "/FI/fetch/" + session_id
  );
  var requestConfig = {
    method: "get",
    url: config.api_url + "/FI/fetch/" + session_id,
    headers: {
      "Content-Type": "application/json",
      client_api_key: config.client_api_key,
      "x-jws-signature": detachedJWS,
    },
  };
  axios(requestConfig)
    .then(function (response) {
      decrypt_data(response.data.FI, encryption_privateKey, keyMaterial);
    })
    .catch(function (error) {
      console.log(error);
      console.log("Error");
    });
};

///// GET DATA

app.get("/get-data", (req, res) => {
  res.send(JSON.parse(localStorage.getItem("jsonData")));
});
// start the server listening for requests
app.listen(config.port || 3000, () => console.log("Server is running..."));
