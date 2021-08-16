export function numberValidator(number) {
  if (!number) return "Number can't be empty";
  if (number.length !== 10) return "Number should be 10 characters long.";
  return "";
}
