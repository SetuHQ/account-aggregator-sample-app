const requestData = (consent_id) => {
  var data = JSON.stringify({
    consentId: consent_id,
    DataRange: {
      from: "2021-04-01T00:00:00Z",
      to: "2021-09-30T00:00:00Z",
    },
    format: "json",
  });

  return data;
};

module.exports = requestData;
