import React, { useEffect, useState } from "react";
import Background from "../components/Background";
import Logo from "../components/Logo";
import Paragraph from "../components/Paragraph";
import Header from "../components/Header";
import Button from "../components/Button";
import { ActivityIndicator } from "react-native";

export default function Complete({ navigation }) {
  const [showData, setShowData] = useState(false);
  const [data, setData] = useState({});
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(function () {
      fetchData();
    }, 7000);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("https://demo-pfm.herokuapp.com/get-data/");
      const json = await response.json();
      console.log(json["Account"]["$"]);
      setData({
        name: json["Account"]["Profile"][0]["Holders"][0]["Holder"][0]["$"][
          "name"
        ],
        account: json["Account"]["$"]["maskedAccNumber"],
        pan: json["Account"]["Profile"][0]["Holders"][0]["Holder"][0]["$"][
          "pan"
        ],
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background>
      <Header>Consent successfully approved</Header>
      <Paragraph>Please wait while we fetch you're financial data.</Paragraph>
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <Paragraph>Name: {data["name"]}</Paragraph>
          <Paragraph>Account Number: {data["account"]}</Paragraph>
          <Paragraph>PAN: {data["pan"]}</Paragraph>
          <Button
            mode="outlined"
            onPress={() =>
              navigation.reset({
                index: 0,
                routes: [{ name: "StartScreen" }],
              })
            }
          >
            Go home
          </Button>
        </>
      )}
    </Background>
  );
}
