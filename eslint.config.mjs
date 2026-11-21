import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  // mobile/ adalah aplikasi Flutter (Dart); hasil build-nya berisi JS yang tidak perlu di-lint.
  { ignores: [".next/**", "node_modules/**", "mobile/**"] },
];

export default eslintConfig;
