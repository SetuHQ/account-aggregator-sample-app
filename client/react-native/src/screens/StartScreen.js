import React, { useState } from "react";
import Background from "../components/Background";
import Logo from "../components/Logo";
import Header from "../components/Header";
import Button from "../components/Button";
import Paragraph from "../components/Paragraph";
import TextInput from "../components/TextInput";
import { ActivityIndicator } from "react-native";
import { numberValidator } from "../helpers/numberValidator";

export default function StartScreen({ navigation }) {
  const [number, setNumber] = useState({ value: "", error: "" });
  const [isLoading, setLoading] = useState(false);

  const getURL = async () => {
    setLoading(true);
    const numberError = numberValidator(number.value);

    if (numberError) {
      setNumber({ ...number, error: numberError });
      setLoading(false);
    } else {
      try {
        const response = await fetch("<URL_OF_EXPRESS_APP>/" + number.value);
        const json = await response.text();
        navigation.navigate("Dashboard", { param: json });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Background>
      <Logo />
      <Header>Personal Finance</Header>
      <Paragraph>
        Provide access to your financial data so we can help you manage your
        budget and finances.
      </Paragraph>
      <TextInput
        label="Mobile number"
        returnKeyType="next"
        value={number.value}
        onChangeText={(text) => setNumber({ value: text, error: "" })}
        error={!!number.error}
        errorText={number.error}
        keyboardType="number-pad"
      />
      <Button mode="contained" onPress={getURL}>
        Provide Access
      </Button>
      {isLoading ? <ActivityIndicator size="large" color="#0000ff" /> : null}
    </Background>
  );
}
