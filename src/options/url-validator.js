export default function urlValidator(url) {
  const rules = [];
  rules.push(
    /^((https?):\/\/)([a-zA-Z0-9-_\*]+\.)*[\*a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?(\/.+){0,}\/?\*?$/
  );
  rules.push(/^((file):\/\/\/)(.+){1}\/?\*?$/);
  return rules.some(rule => rule.test(url));
}
