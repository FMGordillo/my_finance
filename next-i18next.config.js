const path = require("path");

/** @type {import('next-i18next').UserConfig} */
const i18nConfig = {
  debug: process.env.NODE_ENV !== "production",
  i18n: {
    defaultLocale: "es",
    locales: ["en", "es"],
  },
  localePath:
    typeof window === "undefined"
      ? path.resolve("./public/locales")
      : "/locales",
  reloadOnPrerender: process.env.NODE_ENV === "development",
  ns: ["common"],
};

module.exports = i18nConfig;
