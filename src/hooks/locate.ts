import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import ISO6391 from "iso-639-1";

countries.registerLocale(enLocale);

export const countryOptions = Object.entries(
  countries.getNames("en", { select: "official" })
)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const languageOptions = ISO6391.getAllCodes()
  .map((code) => ({
    code,
    name: ISO6391.getName(code)
  }))
  .filter((l) => l.name)
  .sort((a, b) => a.name.localeCompare(b.name));

