const uuid = require("./uuid");
var axios = require("axios");
const config = require("./../config");
var parseString = require("xml2js").parseString;
const localStorage = require("localStorage");

const decrypt_data = (fi, privateKey, keyMaterial) => {
  const fi_data = fi[0];
  const body = {
    base64Data: fi_data["data"][0]["encryptedFI"],
    base64RemoteNonce: fi_data["KeyMaterial"]["Nonce"],
    base64YourNonce: keyMaterial["Nonce"],
    ourPrivateKey: privateKey,
    remoteKeyMaterial: fi_data["KeyMaterial"],
  };
  var requestConfig = {
    method: "post",
    url: config.rahasya_url + "/ecc/v1/decrypt",
    data: body,
  };

  axios(requestConfig)
    .then((res) => {
      let base64Data = res.data["base64Data"];
      let decoded_data = Buffer.from(base64Data, "base64").toString();
      var xml = decoded_data;
      parseString(xml, function (err, result) {
        console.log(typeof result);
        localStorage.setItem("jsonData", JSON.stringify(result));
      });
    })
    .catch((err) => console.log(err));
};

module.exports = decrypt_data;
