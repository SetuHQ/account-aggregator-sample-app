const uuid = require("./uuid");
var axios = require("axios");
const config = require("./../config");

///// GENERATE KEYS

const generateKeyMaterial = async () => {
  const { data: response } = await axios.get(
    config.rahasya_url + "/ecc/v1/generateKey"
  );
  return response;
};

///// CREATE BODY FOR DATA REQUEST

const requestDataBody = (signedConsent, consent_id, keys) => {
  const dateNow = new Date();
  let data = JSON.stringify({
    ver: "1.0",
    timestamp: dateNow.toISOString(),
    txnid: uuid.create_UUID(),
    FIDataRange: {
      from: "2018-12-06T11:39:57.153Z",
      to: "2020-07-03T14:25:33.440Z",
    },

    Consent: {
      id: consent_id,
      digitalSignature: signedConsent.split(".")[2],
    },
    KeyMaterial: keys,
  });

  return data;
};

module.exports = { requestDataBody, generateKeyMaterial };
