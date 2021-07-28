const Recaptcha = require("express-recaptcha").RecaptchaV3;

const recaptcha =
  process.env.RECAPTCHA_SECRET && process.env.RECAPTCHA_SITE_KEY
    ? new Recaptcha(
        process.env.RECAPTCHA_SITE_KEY,
        process.env.RECAPTCHA_SECRET
      )
    : null;

if (recaptcha) {
  console.log("Recaptcha is setup");
} else {
  console.log(
    "Recaptcha is not setup, add RECAPTCHA_SECRET and RECAPTCHA_SITE_KEY to the .env in order to use it."
  );
}

module.exports = function recaptchaVerify(req, res, next) {
  if (recaptcha) {
    recaptcha.verify(req, function (error) {
      let err = null;
      if (error) err = error;
      else if (req.recaptcha && req.recaptcha.error) err = req.recaptcha.error;
      if (!err) {
        // success code
        console.log("Recaptcha verification succeeded.");
        next();
      } else {
        let msg = `Recaptcha verification failed: ${err}`;
        console.log(msg);
        res.status(403).send({ error: msg });
      }
    });
  } else {
    console.log("Recaptcha verification not configured.");
    next();
  }
};
