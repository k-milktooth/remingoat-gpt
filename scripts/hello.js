async function hello() {
  console.log("hello");
}

(async () => {
  await hello();
})();
