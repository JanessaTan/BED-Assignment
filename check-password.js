const bcrypt = require("bcryptjs");

const hash =
  "$2b$12$X8JsEE7U.r47o9N6J9nQvO0EUTnKH.hi.pvwd9b2noxOG2e0hxnoy";

const passwords = ["Test123!", "Teat123!"];

for (const password of passwords) {
  console.log(password, bcrypt.compareSync(password, hash));
}
